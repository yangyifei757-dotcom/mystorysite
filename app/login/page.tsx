'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setMessage(error.message)
    } else {
      window.location.href = '/'
    }
    setLoading(false)
  }

  const handleSignUp = async () => {
    if (!email || !password) {
      setMessage('Email and password are required.')
      return
    }
    setLoading(true)
    setMessage('')
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Registration successful! You can now log in.')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-card p-8 rounded-2xl border border-border">
        <h1 className="text-2xl font-serif text-primary mb-6 text-center">IvyNovel Login</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 rounded bg-background border border-border text-foreground"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded bg-background border border-border text-foreground"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-background rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Login'}
          </button>
        </form>
        <p className="text-center mt-4 text-sm text-foreground/50">
          Don't have an account?{' '}
          <button onClick={handleSignUp} className="text-primary hover:underline" disabled={loading}>
            Sign up
          </button>
        </p>
        {message && (
          <p className="mt-4 text-center text-sm text-red-400">{message}</p>
        )}
      </div>
    </main>
  )
}
