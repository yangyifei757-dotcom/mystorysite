import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const stripeKey = process.env.STRIPE_SECRET_KEY

    // 1. 检查必要的环境变量
    if (!supabaseUrl || !supabaseServiceKey || !stripeKey) {
      const missing = []
      if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL')
      if (!supabaseServiceKey) missing.push('SUPABASE_SERVICE_ROLE_KEY')
      if (!stripeKey) missing.push('STRIPE_SECRET_KEY')
      return NextResponse.json(
        { error: `Missing environment variables: ${missing.join(', ')}` },
        { status: 500 }
      )
    }

    const stripe = new Stripe(stripeKey)

    // 2. 从请求头中获取 token
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 })
    }
    const token = authHeader.split(' ')[1]

    // 3. 向 Supabase 验证 token 并获取用户信息
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!userRes.ok) {
      const errText = await userRes.text()
      console.error('Supabase auth error:', errText)
      return NextResponse.json({ error: `Invalid token or Supabase error: ${errText}` }, { status: 401 })
    }

    const user = await userRes.json()
    const email = user.email

    if (!email) {
      return NextResponse.json({ error: 'No email associated with this user. Please update your profile.' }, { status: 400 })
    }

    // 4. 查找或创建 Stripe 客户
    let customerId: string | null = null
    const customers = await stripe.customers.list({ email, limit: 1 })
    if (customers.data.length > 0) {
      customerId = customers.data[0].id
    } else {
      const customer = await stripe.customers.create({ email })
      customerId = customer.id
    }

    // 5. 创建门户会话
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${request.headers.get('origin') || 'https://mystorysite.vercel.app'}/pricing`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('Portal API error:', err)
    return NextResponse.json(
      { error: `Internal server error: ${err.message}` },
      { status: 500 }
    )
  }
}
