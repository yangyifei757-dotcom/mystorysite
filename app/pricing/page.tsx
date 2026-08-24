'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { track } from '@vercel/analytics'

export default function PricingPage() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
    }
    checkUser()
    // 埋点：定价页浏览
    track('view_pricing')
  }, [])

  const handleSubscribe = (paymentLink: string, planName: string) => {
    // 埋点：点击订阅套餐
    track('click_subscribe_plan', { plan: planName })
    if (!user) {
      router.push('/login?redirect=/pricing')
      return
    }
    window.open(paymentLink, '_blank')
  }

  const plans = [
    {
      name: 'Monthly',
      dailyPrice: '0.33',
      monthlyPrice: '9.99',
      firstMonthPrice: '6.99',
      interval: 'month',
      description: 'Then $9.99/month after first month',
      paymentLink: 'https://www.creem.io/payment/prod_4ZI6kyf8A9qbLyDyYYb6Tx?offer=QZO318UTSZ',
      popular: true,
    },
    {
      name: 'Yearly',
      dailyPrice: '0.27',
      yearlyPrice: '99.99',
      interval: 'year',
      description: 'Billed annually — best value',
      paymentLink: 'https://www.creem.io/payment/prod_1vKDDSUKmfkSefSmmhlHa',
    },
  ]

  return (
    <main className="min-h-screen bg-background pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="font-serif text-5xl text-primary mb-6">Choose Your Reading Journey</h1>
        <p className="text-foreground/60 max-w-xl mx-auto mb-16">
          Unlimited romance stories. Less than a cup of coffee.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-lg mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`p-8 rounded-2xl bg-card border hover:border-primary/40 transition shadow-lg ${
                plan.popular ? 'border-primary ring-1 ring-primary' : 'border-border'
              }`}
            >
              {plan.popular && (
                <span className="text-xs bg-primary text-background px-2 py-1 rounded-full uppercase tracking-wider">
                  Popular
                </span>
              )}
              <h3 className="text-2xl font-serif text-primary mt-4 mb-4">{plan.name}</h3>

              <p className="text-5xl font-bold text-foreground mb-1">
                ${plan.dailyPrice}
                <span className="text-xl text-foreground/50 font-normal">/day</span>
              </p>

              {plan.monthlyPrice && (
                <p className="text-xs text-foreground/30 mb-1">
                  ${plan.monthlyPrice}/month
                </p>
              )}
              {plan.yearlyPrice && (
                <p className="text-xs text-foreground/30 mb-1">
                  ${plan.yearlyPrice}/year
                </p>
              )}

              {plan.firstMonthPrice && (
                <p className="text-sm text-primary font-medium mt-2">
                  First month only ${plan.firstMonthPrice}
                </p>
              )}

              <p className="text-sm text-foreground/50 mt-4 mb-6">{plan.description}</p>

              <button
                onClick={() => handleSubscribe(plan.paymentLink, plan.name)}
                className="block w-full py-3 bg-primary text-background rounded-xl font-medium hover:bg-primary/90 transition text-center"
              >
                Subscribe
              </button>
            </div>
          ))}
        </div>

        {/* 信任徽章 */}
        <div className="flex flex-wrap justify-center gap-4 mt-10 text-sm text-foreground/60">
          <span className="inline-flex items-center gap-1">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            Secure payment via Creem
          </span>
          <span className="inline-flex items-center gap-1">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            Cancel anytime
          </span>
          <span className="inline-flex items-center gap-1">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            Instant access
          </span>
        </div>

        <p className="mt-8 text-foreground/40 text-sm">
          After payment, your account will be upgraded shortly. If you have any issues, please contact support.
        </p>

        <p className="text-xs text-foreground/40 mt-4">
          You can cancel anytime from your customer portal or order confirmation email.
        </p>
      </div>
    </main>
  )
}
