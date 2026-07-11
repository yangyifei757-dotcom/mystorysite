'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isSent, setIsSent] = useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) {
      setMessage(error.message)
    } else {
      setIsSent(true)
      setMessage('Check your email for the reset link.')
    }
    setLoading(false)
  }

  if (isSent) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-serif text-primary mb-4">Check Your Email</h1>
          <p className="text-foreground/60 mb-6">{message}</p>
          <Link href="/login" className="text-primary hover:underline">Back to login</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-card p-8 rounded-2xl border border-border">
        <h1 className="text-2xl font-serif text-primary mb-6 text-center">Reset Password</h1>
        <form onSubmit={handleReset} className="space-y-4">
          <input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 rounded bg-background border border-border text-foreground"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        <p className="text-center mt-4 text-sm text-foreground/50">
          <Link href="/login" className="text-primary hover:underline">Back to login</Link>
        </p>
        {message && !isSent && (
          <p className="mt-4 text-center text-sm text-red-400">{message}</p>
        )}
      </div>
    </main>
  )
}
