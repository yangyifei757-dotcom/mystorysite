import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function POST(request: Request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!stripeKey || !supabaseUrl || !supabaseServiceKey || !webhookSecret) {
    console.error('Missing env vars')
    return NextResponse.json({ error: 'Server config error' }, { status: 500 })
  }

  const stripe = new Stripe(stripeKey)
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature failed:', err.message)
    return NextResponse.json({ error: 'Signature verification failed' }, { status: 400 })
  }

  if (event.type === 'invoice.paid') {
    const invoice = event.data.object as Stripe.Invoice
    const email = invoice.customer_email

    if (!email) {
      return NextResponse.json({ error: 'No email' }, { status: 400 })
    }

    const amount = invoice.amount_paid
    let plan = 'monthly'
    if (amount === 299) plan = 'weekly'
    else if (amount === 999) plan = 'monthly'
    else if (amount === 9999) plan = 'yearly'

    const now = new Date()
    const periodEnd = new Date(now)
    if (plan === 'weekly') periodEnd.setDate(periodEnd.getDate() + 7)
    else if (plan === 'monthly') periodEnd.setMonth(periodEnd.getMonth() + 1)
    else if (plan === 'yearly') periodEnd.setFullYear(periodEnd.getFullYear() + 1)

    // 使用 fetch 调用 Supabase REST API
    const headers = {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    }

    // 1. 查找现有 profile
    const profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles?select=id&email=eq.${encodeURIComponent(email)}`, {
      headers: { ...headers, 'Prefer': 'return=representation' },
    })
    let profileId: string | null = null

    if (profileRes.ok) {
      const profiles = await profileRes.json()
      if (profiles.length > 0) {
        profileId = profiles[0].id
      }
    }

    // 2. 如果没找到，创建新 profile
    if (!profileId) {
      const createRes = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ email }),
      })
      if (createRes.ok) {
        const newProfile = await createRes.json()
        profileId = newProfile.id
      } else {
        const errText = await createRes.text()
        console.error('Failed to create profile:', errText)
        return NextResponse.json({ error: 'Profile creation failed' }, { status: 500 })
      }
    }

    // 3. Upsert 订阅记录（需要先检查是否存在，因为 Supabase REST 的 upsert 需要 on conflict）
    // 简单做法：直接尝试 PATCH 根据 user_id，如果不存在则 POST
    const subRes = await fetch(`${supabaseUrl}/rest/v1/subscriptions?user_id=eq.${profileId}`, {
      headers,
    })
    const subArray = subRes.ok ? await subRes.json() : []
    const subBody = {
      user_id: profileId,
      plan,
      status: 'active',
      current_period_end: periodEnd.toISOString(),
    }

    if (subArray.length > 0) {
      // 更新
      await fetch(`${supabaseUrl}/rest/v1/subscriptions?user_id=eq.${profileId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(subBody),
      })
    } else {
      // 插入
      await fetch(`${supabaseUrl}/rest/v1/subscriptions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(subBody),
      })
    }

    console.log(`✅ Subscription saved for ${email}, plan: ${plan}`)
  }

  return NextResponse.json({ received: true })
}
