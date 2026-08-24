'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { track } from '@vercel/analytics'

export default function ThankYouPage() {
  useEffect(() => {
    track('payment_success')
  }, [])

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md text-center space-y-6">
        <div className="text-6xl">🎉</div>
        <h1 className="text-4xl font-serif text-primary">Thank You!</h1>
        <p className="text-foreground/70">
          Your payment was successful. Your subscription will be activated shortly.
        </p>
        <p className="text-sm text-foreground/40">
          If you don't see the change within a few minutes, please contact our support.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/"
            className="px-6 py-2 bg-primary text-background rounded-lg hover:bg-primary/90 transition"
          >
            Start Reading
          </Link>
          <Link
            href="/pricing"
            className="px-6 py-2 border border-primary text-primary rounded-lg hover:bg-primary/10 transition"
          >
            Back to Pricing
          </Link>
        </div>
      </div>
    </main>
  )
}
