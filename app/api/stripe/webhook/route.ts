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

  // 处理账单支付成功事件（订阅最可靠的信号）
  if (event.type === 'invoice.payment.paid') {
    const invoice = event.data.object as Stripe.Invoice
    const email = invoice.customer_email

    if (!email) {
      console.error('❌ No email in invoice')
      return NextResponse.json({ error: 'No email' }, { status: 400 })
    }

    // 查找或创建用户
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

    // 从 invoice 的 subscription 获取计划信息
    let plan = 'monthly' // 默认
    if (invoice.subscription) {
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
      // 通过价格金额判断计划
      const amount = invoice.amount_paid / 100 // 美元金额
      if (amount === 2.99) plan = 'weekly'
      else if (amount === 9.99) plan = 'monthly'
      else if (amount === 99.99) plan = 'yearly'
    }

    // 计算到期日（从当前时间开始算）
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

    console.log(`✅ Subscription activated for ${email} (plan: ${plan}, amount: $${invoice.amount_paid / 100})`)
  }

  // 也保留 checkout.session.completed 处理（备用）
  if (event.type === 'checkout.session.completed') {
    console.log('📦 checkout.session.completed received (backup handler)')
    // 这里可以留空，因为已经用 invoice.paid 处理了
  }

  return NextResponse.json({ received: true })
}
