'use client'

import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'
import { useEffect, useState } from 'react'

export default function Home() {
  const [novels, setNovels] = useState<any[]>([])
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
      setNovels(data || [])

      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (novels.length < 3) return
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % novels.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [novels])

  // 获取当前轮播的5本书
  const bannerNovels = novels.slice(0, 5)

  // 根据 currentSlide 重新排列封面顺序（中间浮起效果）
  const getBannerItems = () => {
    if (bannerNovels.length < 3) return bannerNovels
    const items = []
    for (let i = -2; i <= 2; i++) {
      const index = (currentSlide + i + bannerNovels.length) % bannerNovels.length
      items.push({ novel: bannerNovels[index], position: i })
    }
    return items
  }

  return (
    <main className="min-h-screen bg-background pb-20">
      {/* 顶部导航 */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="IvyNovel Logo"
                width={180}
                height={60}
                className="h-12 w-auto"
                priority
              />
              <span className="text-2xl font-serif font-bold text-primary tracking-wide">
                IvyNovel
              </span>
            </Link>
            <Link href="/pricing" className="text-sm font-medium text-foreground/70 hover:text-primary transition">
              Pricing
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Banner：五部封面轮播 */}
      <section className="pt-20 pb-8 px-4">
        <div className="max-w-6xl mx-auto relative overflow-hidden">
          <div className="flex items-center justify-center gap-3 md:gap-6 h-[320px] md:h-[420px]">
            {getBannerItems().map((item, idx) => {
              const { novel, position } = item
              const isCenter = position === 0
              const isAdjacent = Math.abs(position) === 1
              const scale = isCenter ? 1.15 : isAdjacent ? 0.95 : 0.8
              const opacity = isCenter ? 1 : isAdjacent ? 0.6 : 0.3
              const zIndex = isCenter ? 20 : 10 - Math.abs(position)
              const translateY = isCenter ? -16 : 0

              return (
                <Link
                  key={novel.id}
                  href={`/novel/${novel.id}`}
                  className="flex-shrink-0 transition-all duration-700 ease-in-out relative"
                  style={{
                    zIndex,
                    opacity,
                    transform: `scale(${scale}) translateY(${translateY}px)`,
                  }}
                >
                  <div
                    className="rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-shadow duration-300"
                    style={{
                      width: isCenter
                        ? '220px'
                        : isAdjacent
                          ? '170px'
                          : '130px',
                      height: isCenter
                        ? '330px'
                        : isAdjacent
                          ? '255px'
                          : '195px',
                    }}
                  >
                    {novel.cover_url ? (
                      <Image
                        src={novel.cover_url}
                        alt={novel.title}
                        fill
                        className="object-cover object-center"
                        sizes="(max-width: 768px) 130px, 220px"
                      />
                    ) : (
                      <div className="h-full w-full bg-accent flex items-center justify-center text-4xl text-primary font-serif">
                        {novel.title?.charAt(0)}
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>

          {/* 轮播指示点 */}
          {bannerNovels.length > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {bannerNovels.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentSlide
                      ? 'w-6 bg-primary'
                      : 'w-2 bg-primary/30'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 搜索栏 */}
      <div className="max-w-6xl mx-auto px-4 pb-6">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const q = (e.target as any).q.value
            if (q.trim()) window.location.href = `/search?q=${encodeURIComponent(q.trim())}`
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            name="q"
            placeholder="Search novels or authors..."
            className="flex-1 p-3 rounded-xl border border-border bg-white text-foreground text-sm focus:outline-none focus:border-primary"
          />
          <button
            type="submit"
            className="px-5 py-3 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition"
          >
            Search
          </button>
        </form>
      </div>

      {/* You May Like 区域 */}
      <section className="max-w-6xl mx-auto px-4 pb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-serif text-foreground">You May Like</h2>
        </div>
        {novels.length === 0 ? (
          <div className="text-center py-20 text-foreground/40 bg-card rounded-2xl shadow-card">
            <p className="text-lg">✨ Our stories are brewing...</p>
            <p className="text-sm mt-2">Check back soon for handpicked romantic tales.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {novels.map((novel: any) => (
              <Link key={novel.id} href={`/novel/${novel.id}`} className="group flex flex-col">
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-card group-hover:shadow-card-hover transition-all duration-300">
                  {novel.cover_url ? (
                    <Image
                      src={novel.cover_url}
                      alt={novel.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="h-full w-full bg-accent flex items-center justify-center text-4xl text-primary font-serif">
                      {novel.title?.charAt(0)}
                    </div>
                  )}
                  {novel.tags?.[0] && (
                    <span className="absolute top-2 left-2 bg-white/90 text-foreground text-[10px] px-1.5 py-0.5 rounded-md shadow z-10">
                      {novel.tags[0]}
                    </span>
                  )}
                </div>
                <div className="mt-2 px-1">
                  <h3 className="font-serif text-sm font-medium text-foreground line-clamp-1">{novel.title}</h3>
                  <p className="text-xs text-foreground/50 mt-0.5">{novel.author}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Footer 法律链接 */}
      <div className="max-w-6xl mx-auto px-4 pb-6 flex justify-center gap-6 text-xs text-foreground/40">
        <Link href="/privacy-policy" className="hover:text-primary transition">Privacy Policy</Link>
        <Link href="/terms-of-service" className="hover:text-primary transition">Terms of Service</Link>
      </div>

      {/* 底部导航栏 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-border z-50">
        <div className="max-w-lg mx-auto flex justify-around py-2">
          <Link href="/library" className="flex flex-col items-center text-xs text-foreground/60 hover:text-primary transition">
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
            </svg>
            Library
          </Link>
          <Link href="/" className="flex flex-col items-center text-xs text-primary font-medium">
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Discovery
          </Link>
          <Link href={user ? "/mine" : "/login"} className="flex flex-col items-center text-xs text-foreground/60 hover:text-primary transition">
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {user ? 'Mine' : 'Sign In'}
          </Link>
        </div>
      </nav>
    </main>
  )
}
