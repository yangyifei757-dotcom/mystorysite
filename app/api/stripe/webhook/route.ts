import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
  } catch (err: any) {
    console.error('❌ Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Webhook Error' }, { status: 400 })
  }

  // 只处理结算完成事件
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const email = session.customer_email || session.customer_details?.email

    if (!email) {
      console.error('❌ No email in session')
      return NextResponse.json({ error: 'No email' }, { status: 400 })
    }

    // 查找或创建用户（基于邮箱）
    let { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (!profile) {
      const { data: newProfile, error: createError } = await supabaseAdmin
        .from('profiles')
        .insert({ email })
        .select('id')
        .single()

      if (createError || !newProfile) {
        console.error('❌ Failed to create profile:', createError)
        return NextResponse.json({ error: 'Profile creation failed' }, { status: 500 })
      }
      profile = newProfile
    }

    // 从 metadata 读取计划（weekly/monthly/yearly）
    const plan = session.metadata?.plan || 'monthly'

    // 计算到期日
    const now = new Date()
    let periodEnd = new Date(now)
    if (plan === 'weekly') periodEnd.setDate(periodEnd.getDate() + 7)
    else if (plan === 'monthly') periodEnd.setMonth(periodEnd.getMonth() + 1)
    else if (plan === 'yearly') periodEnd.setFullYear(periodEnd.getFullYear() + 1)

    const { error: upsertError } = await supabaseAdmin
      .from('subscriptions')
      .upsert({
        user_id: profile.id,
        plan,
        status: 'active',
        current_period_end: periodEnd.toISOString(),
      })

    if (upsertError) {
      console.error('❌ Failed to upsert subscription:', upsertError)
      return NextResponse.json({ error: 'Subscription upsert failed' }, { status: 500 })
    }

    console.log(`✅ Subscription activated for ${email} (plan: ${plan})`)
  }

  return NextResponse.json({ received: true })
}
