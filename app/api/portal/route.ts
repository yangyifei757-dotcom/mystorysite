import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function GET(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const token = authHeader.split(' ')[1]

  const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${token}`,
    },
  })
  if (!res.ok) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
  const user = await res.json()
  const email = user.email

  if (!email) {
    return NextResponse.json({ error: 'No email on user' }, { status: 400 })
  }

  // 查找或创建 Stripe 客户
  const customers = await stripe.customers.list({ email, limit: 1 })
  let customerId = customers.data.length > 0 ? customers.data[0].id : null

  if (!customerId) {
    const customer = await stripe.customers.create({ email })
    customerId = customer.id
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${request.headers.get('origin')}/pricing`,
  })

  return NextResponse.json({ url: portalSession.url })
}
