'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function MinePage() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
    }
    getUser()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!user) return null

  return (
    <main className="min-h-screen bg-background pt-24 pb-20 px-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">👤</span>
          </div>
          <h1 className="text-2xl font-serif text-foreground">{user.email}</h1>
        </div>

        <div className="bg-card rounded-2xl shadow-card p-4 space-y-3">
          <Link
            href="/library"
            className="block w-full py-3 bg-accent text-accent-foreground rounded-xl text-center font-medium hover:bg-accent/80 transition"
          >
            My Library
          </Link>
          <button
            onClick={handleLogout}
            className="w-full py-3 border border-primary/30 text-primary rounded-xl font-medium hover:bg-primary/5 transition"
          >
            Log Out
          </button>
        </div>

        <p className="text-center text-xs text-foreground/40">
          By using IvyNovel, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </main>
  )
}
