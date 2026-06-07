'use client'

import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { useEffect, useState } from 'react'

export default function Home() {
  const [novels, setNovels] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from('novels')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
      setNovels(data || [])

      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    fetchData()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    window.location.reload()
  }

  const handleManageSubscription = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) {
      alert('You must be logged in to manage your subscription.')
      return
    }

    const res = await fetch('/api/portal', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      alert('Could not open subscription management. Please try again.')
    }
  }

  // 取消订阅功能（暂时隐藏按钮，代码保留以便将来启用）
  /*
  const handleCancelSubscription = async () => {
    const reason = prompt(
      'We\'re sorry to see you go. Could you tell us why you want to cancel?\n\n' +
      '(Optional) Leave a reason or click OK to continue cancellation.'
    )

    if (reason === null) return

    if (!confirm('Are you sure you want to cancel your subscription? You will still have access until the end of your billing period.')) {
      return
    }

    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) {
      alert('You must be logged in.')
      return
    }

    const res = await fetch('/api/cancel-subscription', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    const data = await res.json()
    if (data.success) {
      alert('Your subscription has been cancelled. You can continue reading until the end of the billing period.')
      window.location.reload()
    } else {
      alert('Cancellation failed: ' + (data.error || 'Unknown error'))
    }
  }
  */

  return (
    <main className="min-h-screen bg-background">
      <header className="fixed top-0 w-full z-50 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-serif text-primary tracking-wide">NovelCrush</h1>
          <nav className="flex items-center gap-4 text-sm text-foreground/80">
            <Link href="/pricing" className="hover:text-primary transition">
              Pricing
            </Link>
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-green-400 text-xs bg-green-900/30 px-2 py-1 rounded-full">
                  Logged in as {user.email}
                </span>
                <button
                  onClick={handleManageSubscription}
                  className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full hover:bg-primary/30 transition cursor-pointer"
                >
                  Manage Subscription
                </button>
                {/* 取消按钮暂时隐藏，需要时取消注释即可 */}
                {/*
                <button
                  onClick={handleCancelSubscription}
                  className="text-xs text-foreground/30 hover:text-red-400 transition cursor-pointer ml-4"
                  title="Cancel subscription"
                >
                  Cancel
                </button>
                */}
                <button onClick={handleLogout} className="hover:text-primary transition">
                  Logout
                </button>
              </div>
            ) : (
              <Link href="/login" className="hover:text-primary transition">
                Sign In
              </Link>
            )}
          </nav>
        </div>
      </header>

      <section className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-serif text-center mb-4 leading-tight">
            Stories that <span className="text-primary">stay with you</span>
          </h2>
          <p className="text-center text-foreground/60 max-w-2xl mx-auto mb-16">
            Hand-picked tales of romance, fantasy, and mystery. Unlock one chapter at a time—or become a
            member for unlimited reading.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              <p className="text-foreground/40 text-center col-span-full">Loading...</p>
            ) : novels.length === 0 ? (
              <p className="text-foreground/40 text-center col-span-full">
                No novels available yet. Check back soon!
              </p>
            ) : (
              novels.map((novel: any) => (
                <Link key={novel.id} href={`/novel/${novel.id}`} className="group">
                  <div className="rounded-2xl bg-card hover:ring-2 hover:ring-primary/30 transition-all duration-300 shadow-lg overflow-hidden">
                    <div className="aspect-[3/4] bg-gradient-to-b from-primary/10 to-card">
                      {novel.cover_url ? (
                        <img
                          src={novel.cover_url}
                          alt={novel.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-foreground/20 text-6xl font-serif">
                          {novel.title?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-serif text-xl text-white mb-1 line-clamp-1">{novel.title}</h3>
                      <p className="text-sm text-gray-400">by {novel.author}</p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
