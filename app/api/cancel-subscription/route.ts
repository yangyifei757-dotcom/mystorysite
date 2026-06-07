import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server config error' }, { status: 500 })
    }

    // 验证用户身份
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.split(' ')[1]

    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${token}`,
      },
    })
    if (!userRes.ok) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    const user = await userRes.json()
    const email = user.email

    if (!email) {
      return NextResponse.json({ error: 'No email' }, { status: 400 })
    }

    // 查找 Stripe 客户
    const customers = await stripe.customers.list({ email, limit: 1 })
    if (customers.data.length === 0) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
    }
    const customerId = customers.data[0].id

    // 查找活跃订阅
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    })
    if (subscriptions.data.length === 0) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
    }
    const subscriptionId = subscriptions.data[0].id

    // 取消订阅（在周期末取消，不立即终止）
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    })

    return NextResponse.json({ success: true, message: 'Subscription will be cancelled at the end of the billing period.' })
  } catch (err: any) {
    console.error('Cancel subscription error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
