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
    console.error('Webhook signature failed:', err.message)
    return NextResponse.json({ error: 'Signature verification failed' }, { status: 400 })
  }

  if (event.type === 'invoice.paid') {
    const invoice = event.data.object as Stripe.Invoice
    const email = invoice.customer_email

    if (!email) {
      console.error('No email in invoice')
      return NextResponse.json({ error: 'No email' }, { status: 400 })
    }

    console.log(`Processing invoice.paid for ${email}, amount: ${invoice.amount_paid} cents`)

    // 用美分判断计划
    const amount = invoice.amount_paid
    let plan = 'monthly'
    if (amount === 299) plan = 'weekly'
    else if (amount === 999) plan = 'monthly'
    else if (amount === 9999) plan = 'yearly'

    // 计算到期日
    const now = new Date()
    const periodEnd = new Date(now)
    if (plan === 'weekly') periodEnd.setDate(periodEnd.getDate() + 7)
    else if (plan === 'monthly') periodEnd.setMonth(periodEnd.getMonth() + 1)
    else if (plan === 'yearly') periodEnd.setFullYear(periodEnd.getFullYear() + 1)

    // 查找或创建用户
    let userId: string | null = null
    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (existing) {
      userId = existing.id
      console.log(`Found profile: ${userId}`)
    } else {
      const { data: newProfile, error: createError } = await supabaseAdmin
        .from('profiles')
        .insert({ email })
        .select('id')
        .single()

      if (createError || !newProfile) {
        console.error('Profile creation failed:', createError)
        return NextResponse.json({ error: 'Profile creation failed' }, { status: 500 })
      }
      userId = newProfile.id
      console.log(`Created profile: ${userId}`)
    }

    const { error: upsertError } = await supabaseAdmin
      .from('subscriptions')
      .upsert({
        user_id: userId,
        plan,
        status: 'active',
        current_period_end: periodEnd.toISOString(),
      })

    if (upsertError) {
      console.error('Subscription upsert failed:', upsertError)
      return NextResponse.json({ error: 'Subscription upsert failed' }, { status: 500 })
    }

    console.log(`✅ Subscription saved: ${email}, plan: ${plan}, ends: ${periodEnd}`)
  }

  return NextResponse.json({ received: true })
}
