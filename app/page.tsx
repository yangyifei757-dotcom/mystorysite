'use client'

import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { useEffect, useState } from 'react'

export default function Home() {
  const [novels, setNovels] = useState<any[]>([])
  const [featured, setFeatured] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from('novels')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
      
      const allNovels = data || []
      setNovels(allNovels)

      // 随机选取三部作为轮播
      const shuffled = [...allNovels].sort(() => 0.5 - Math.random())
      setFeatured(shuffled.slice(0, 3))

      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    fetchData()
  }, [])

  // 轮播自动播放
  useEffect(() => {
    if (featured.length === 0) return
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % featured.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [featured])

  const goToSlide = (index: number) => setCurrentSlide(index)

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-foreground/40">Loading...</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-serif text-primary tracking-wide">NovelCrush</h1>
          <nav className="flex items-center gap-4 text-sm text-foreground/80">
            <Link href="/pricing" className="hover:text-primary transition">Pricing</Link>
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
                <button onClick={handleLogout} className="hover:text-primary transition">Logout</button>
              </div>
            ) : (
              <Link href="/login" className="hover:text-primary transition">Sign In</Link>
            )}
          </nav>
        </div>
      </header>

      {/* 轮播区域 */}
      {featured.length > 0 && (
        <section className="pt-24 pb-8 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="relative overflow-hidden rounded-2xl bg-card shadow-2xl" style={{ height: '380px' }}>
              {/* 幻灯片 */}
              {featured.map((novel, index) => (
                <div
                  key={novel.id}
                  className={`absolute inset-0 transition-opacity duration-700 ${
                    index === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}
                >
                  <Link href={`/novel/${novel.id}`}>
                    <div className="flex h-full">
                      <div className="w-1/3 flex-shrink-0">
                        {novel.cover_url ? (
                          <img src={novel.cover_url} alt={novel.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-primary/20 to-card flex items-center justify-center">
                            <span className="text-6xl font-serif text-primary/40">{novel.title?.charAt(0)}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 p-8 flex flex-col justify-center">
                        <h2 className="font-serif text-3xl md:text-4xl text-primary mb-2">{novel.title}</h2>
                        <p className="text-foreground/60 mb-4">by {novel.author}</p>
                        <p className="text-foreground/80 line-clamp-4 leading-relaxed">{novel.description}</p>
                        <div className="mt-6">
                          <span className="inline-block bg-primary text-background px-6 py-2 rounded-full text-sm font-medium hover:bg-primary/90 transition">
                            Start Reading
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}

              {/* 轮播控制点 */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {featured.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`w-3 h-3 rounded-full transition ${
                      index === currentSlide ? 'bg-primary' : 'bg-foreground/30 hover:bg-foreground/50'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* You May Like 全部小说 */}
      <section className="pt-8 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-serif text-primary mb-8 text-center">You May Like</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {novels.length === 0 ? (
              <p className="text-foreground/40 text-center col-span-full">No novels available yet. Check back soon!</p>
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
