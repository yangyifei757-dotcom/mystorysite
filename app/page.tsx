'use client'

import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'
import { useEffect, useRef, useState } from 'react'
import { track } from '@vercel/analytics'

function mulberry32(seed: number) {
  return function() {
    let t = (seed += 0x6D2B79F5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function getThreeDaySeed() {
  const now = new Date()
  return Math.floor(now.getTime() / (3 * 24 * 60 * 60 * 1000))
}

function formatChapterTitle(orderNum: number, title: string | null | undefined) {
  const defaultTitle = `Chapter ${orderNum}`
  if (!title || title === defaultTitle || title.trim() === `Chapter ${orderNum}`) {
    return defaultTitle
  }
  return `Chapter ${orderNum}: ${title}`
}

export default function Home() {
  const [novels, setNovels] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [continueReading, setContinueReading] = useState<any>(null)
  const [showContinueModal, setShowContinueModal] = useState(false)

  const [hotNovels, setHotNovels] = useState<any[]>([])
  const [recommendNovels, setRecommendNovels] = useState<any[]>([])
  const [risingNovels, setRisingNovels] = useState<any[]>([])
  const [newReleaseNovels, setNewReleaseNovels] = useState<any[]>([])

  const [youMayLikeNovels, setYouMayLikeNovels] = useState<any[]>([])
  const [remainingYouMayLike, setRemainingYouMayLike] = useState<any[]>([])
  const [loadingMoreYouMayLike, setLoadingMoreYouMayLike] = useState(false)
  const youMayLikeRef = useRef<HTMLDivElement>(null)

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

      if (user) {
        const { data: progress } = await supabase
          .from('reading_progress')
          .select('*, chapter:chapter_id(*, novel:novel_id(*))')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })

        if (progress && progress.length > 0) {
          const seenNovels = new Set()
          const uniqueProgress = progress.filter((item: any) => {
            const novelId = item.chapter?.novel?.id
            if (novelId && !seenNovels.has(novelId)) {
              seenNovels.add(novelId)
              return true
            }
            return false
          })
          if (uniqueProgress.length > 0) {
            setContinueReading(uniqueProgress[0])
            setShowContinueModal(true)
          }
        }
      }

      setLoading(false)
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (novels.length === 0) return

    const random = mulberry32(getThreeDaySeed())
    const shuffled = [...novels].sort(() => random() - 0.5)

    setHotNovels(shuffled.slice(0, 3))

    const usedIds = new Set<string>()
    const recommend = shuffled.slice(0, 6)
    recommend.forEach(n => usedIds.add(n.id))
    setRecommendNovels(recommend)

    const risingPool = shuffled.filter(n => !usedIds.has(n.id))
    const rising = risingPool.slice(0, 6)
    rising.forEach(n => usedIds.add(n.id))
    setRisingNovels(rising)

    const newRelease = novels.filter(n => !usedIds.has(n.id)).slice(0, 6)
    newRelease.forEach(n => usedIds.add(n.id))
    setNewReleaseNovels(newRelease)

    const remainingForYouMayLike = shuffled.filter(n => !usedIds.has(n.id))
    setYouMayLikeNovels(remainingForYouMayLike.slice(0, 15))
    setRemainingYouMayLike(remainingForYouMayLike.slice(15))
  }, [novels])

  useEffect(() => {
    if (novels.length < 3) return
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % novels.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [novels])

  useEffect(() => {
    const handleScroll = () => {
      if (!youMayLikeRef.current) return
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      const scrollHeight = document.documentElement.scrollHeight
      const clientHeight = window.innerHeight

      if (
        scrollTop + clientHeight >= scrollHeight - 200 &&
        remainingYouMayLike.length > 0 &&
        !loadingMoreYouMayLike
      ) {
        setLoadingMoreYouMayLike(true)
        const nextNovel = remainingYouMayLike[0]
        setRemainingYouMayLike(prev => prev.slice(1))
        setYouMayLikeNovels(prev => {
          if (prev.some(n => n.id === nextNovel.id)) return prev
          return [...prev, nextNovel]
        })
        setLoadingMoreYouMayLike(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [remainingYouMayLike, loadingMoreYouMayLike])

  const bannerNovels = novels.slice(0, 5)
  const getBannerItems = () => {
    if (bannerNovels.length < 3) return bannerNovels
    const items = []
    for (let i = -2; i <= 2; i++) {
      const index = (currentSlide + i + bannerNovels.length) % bannerNovels.length
      items.push({ novel: bannerNovels[index], position: i })
    }
    return items
  }

  const renderNovelCard = (novel: any) => {
    const tag = Array.isArray(novel.tags) ? novel.tags[0] : novel.tags
    return (
      <Link
        key={novel.id}
        href={`/novel/${novel.id}`}
        className="group flex gap-4 p-4 bg-card rounded-xl shadow-card hover:shadow-card-hover transition-all duration-300"
        onClick={() => track('click_recommend_novel', { novel_id: novel.id })}
      >
        <div className="relative w-24 h-32 md:w-28 md:h-40 flex-shrink-0 rounded-lg overflow-hidden">
          {novel.cover_url ? (
            <Image
              src={novel.cover_url}
              alt={novel.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 96px, 112px"
            />
          ) : (
            <div className="h-full w-full bg-accent flex items-center justify-center text-2xl text-primary font-serif">
              {novel.title?.charAt(0)}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col h-full justify-between">
          <div>
            <h3 className="font-['Jost'] font-black text-lg md:text-xl leading-tight text-foreground mb-1 line-clamp-2 min-h-[2.5rem] md:min-h-[3rem]">
              {novel.title}
            </h3>
            <p className="text-xs text-foreground/50 mb-1">by {novel.author}</p>
            {tag && (
              <span className="inline-block text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full mb-2">
                {tag}
              </span>
            )}
          </div>
          <p className="text-sm text-foreground/60 line-clamp-2">
            {novel.description}
          </p>
        </div>
      </Link>
    )
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
        <span className="text-2xl font-['Jost'] font-black text-primary tracking-wide">
          IvyNovel
        </span>
      </Link>
    </div>
    <div className="flex items-center gap-4">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          const q = (e.target as any).q.value
          if (q.trim()) window.location.href = `/search?q=${encodeURIComponent(q.trim())}`
        }}
        className="relative"
      >
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/40">🔍</span>
        <input
          type="text"
          name="q"
          placeholder="Search..."
          className="pl-9 pr-3 py-1.5 rounded-full border border-border bg-white text-foreground text-sm w-32 md:w-48 focus:outline-none focus:border-primary transition"
        />
      </form>
      <Link href="/pricing" className="text-sm font-medium text-foreground/70 hover:text-primary transition">
        Pricing
      </Link>
    </div>
  </div>
</header>

      {/* Hero Banner */}
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
                  onClick={() => track('click_banner_novel', { novel_id: novel.id })}
                >
                  <div
                    className="rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-shadow duration-300"
                    style={{
                      width: isCenter ? '220px' : isAdjacent ? '170px' : '130px',
                      height: isCenter ? '330px' : isAdjacent ? '255px' : '195px',
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

          {bannerNovels.length > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {bannerNovels.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentSlide ? 'w-6 bg-primary' : 'w-2 bg-primary/30'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 搜索栏 + 热门标签 */}
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
          <button type="submit" className="px-5 py-3 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition">
            Search
          </button>
        </form>

        {/* 热门标签 */}
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {['Romance', 'Mature', 'Werewolf', 'Urban', 'Heiress'].map((term) => {
  let extraClass = 'text-xs bg-accent text-accent-foreground'
  if (term === 'Romance') {
    extraClass = 'text-lg font-bold text-primary bg-primary/10 border border-primary/30'
  } else if (term === 'Mature') {
    extraClass = 'text-lg font-bold text-purple-700 bg-purple-100 border border-purple-300'
  }
  return (
    <Link
      key={term}
      href={`/search?q=${encodeURIComponent(term)}`}
      className={`px-4 py-1.5 rounded-full hover:opacity-80 transition ${extraClass}`}
    >
      {term}
    </Link>
  )
})}
        </div>
      </div>

      {/* Recommend 区域 */}
      <section className="max-w-6xl mx-auto px-4 pb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-['Jost'] font-black text-foreground">Recommend</h2>
        </div>
        {recommendNovels.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {recommendNovels.map((novel: any) => renderNovelCard(novel))}
          </div>
        ) : (
          <p className="text-foreground/40 text-center py-10">No recommendations yet.</p>
        )}
      </section>

      {/* Hot 区域 */}
      {hotNovels.length === 3 && (
        <section className="max-w-6xl mx-auto px-4 pb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-['Jost'] font-black text-foreground">Hot</h2>
          </div>
          <div className="overflow-x-auto pb-2">
            <div className="flex items-end gap-4 md:gap-10 w-max mx-auto">
              <Link href={`/novel/${hotNovels[1].id}`} className="relative flex-shrink-0" onClick={() => track('click_hot_novel', { novel_id: hotNovels[1].id, rank: 2 })}>
                <div className="w-40 h-56 md:w-52 md:h-72 rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300">
                  {hotNovels[1].cover_url ? (
                    <Image src={hotNovels[1].cover_url} alt={hotNovels[1].title} fill className="object-cover" sizes="(max-width: 768px) 160px, 208px" />
                  ) : (
                    <div className="h-full w-full bg-accent flex items-center justify-center text-4xl text-primary font-serif">{hotNovels[1].title?.charAt(0)}</div>
                  )}
                </div>
                <span className="absolute bottom-2 left-2 text-5xl md:text-6xl font-black text-yellow-400 drop-shadow-lg">2</span>
              </Link>
              <Link href={`/novel/${hotNovels[0].id}`} className="relative flex-shrink-0" onClick={() => track('click_hot_novel', { novel_id: hotNovels[0].id, rank: 1 })}>
                <div className="w-52 h-72 md:w-72 md:h-96 rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300">
                  {hotNovels[0].cover_url ? (
                    <Image src={hotNovels[0].cover_url} alt={hotNovels[0].title} fill className="object-cover" sizes="(max-width: 768px) 208px, 288px" />
                  ) : (
                    <div className="h-full w-full bg-accent flex items-center justify-center text-5xl text-primary font-serif">{hotNovels[0].title?.charAt(0)}</div>
                  )}
                </div>
                <span className="absolute bottom-2 left-2 text-6xl md:text-7xl font-black text-yellow-400 drop-shadow-lg">1</span>
              </Link>
              <Link href={`/novel/${hotNovels[2].id}`} className="relative flex-shrink-0" onClick={() => track('click_hot_novel', { novel_id: hotNovels[2].id, rank: 3 })}>
                <div className="w-40 h-56 md:w-52 md:h-72 rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300">
                  {hotNovels[2].cover_url ? (
                    <Image src={hotNovels[2].cover_url} alt={hotNovels[2].title} fill className="object-cover" sizes="(max-width: 768px) 160px, 208px" />
                  ) : (
                    <div className="h-full w-full bg-accent flex items-center justify-center text-4xl text-primary font-serif">{hotNovels[2].title?.charAt(0)}</div>
                  )}
                </div>
                <span className="absolute bottom-2 left-2 text-5xl md:text-6xl font-black text-yellow-400 drop-shadow-lg">3</span>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Rising 区域 */}
      <section className="max-w-6xl mx-auto px-4 pb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-['Jost'] font-black text-foreground">Rising</h2>
        </div>
        {risingNovels.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {risingNovels.map((novel: any) => renderNovelCard(novel))}
          </div>
        ) : (
          <p className="text-foreground/40 text-center py-10">More stories coming soon.</p>
        )}
      </section>

      {/* New Releases 区域 */}
      <section className="max-w-6xl mx-auto px-4 pb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-['Jost'] font-black text-foreground">New Releases</h2>
        </div>
        {newReleaseNovels.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {newReleaseNovels.map((novel: any) => renderNovelCard(novel))}
          </div>
        ) : (
          <p className="text-foreground/40 text-center py-10">New stories coming soon.</p>
        )}
      </section>

      {/* You May Like 区域 */}
      <section ref={youMayLikeRef} className="max-w-6xl mx-auto px-4 pb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-['Jost'] font-black text-foreground">You May Like</h2>
        </div>
        {youMayLikeNovels.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {youMayLikeNovels.map((novel: any) => renderNovelCard(novel))}
          </div>
        ) : (
          <p className="text-foreground/40 text-center py-10">Explore more stories below.</p>
        )}
        {remainingYouMayLike.length > 0 && (
          <p className="text-center text-xs text-foreground/40 mt-4">Scroll down to load more stories...</p>
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

      {/* 继续阅读弹窗 */}
      {showContinueModal && continueReading && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowContinueModal(false)} />
          <div className="relative bg-card rounded-2xl shadow-2xl p-6 max-w-md w-full">
            <button onClick={() => setShowContinueModal(false)} className="absolute top-3 right-3 text-foreground/40 hover:text-foreground text-xl">✕</button>
            <h2 className="text-2xl font-['Jost'] font-black text-foreground mb-4">Continue Reading</h2>
            <div className="flex gap-4 mb-6">
              <div className="relative w-20 h-28 flex-shrink-0 rounded-lg overflow-hidden">
                {continueReading.chapter.novel?.cover_url ? (
                  <Image src={continueReading.chapter.novel.cover_url} alt={continueReading.chapter.novel.title} fill className="object-cover" sizes="80px" />
                ) : (
                  <div className="h-full w-full bg-accent flex items-center justify-center text-2xl text-primary font-serif">{continueReading.chapter.novel?.title?.charAt(0)}</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-['Jost'] font-bold text-lg text-foreground line-clamp-1">{continueReading.chapter.novel?.title}</h3>
                <p className="text-xs text-foreground/50 mb-1">by {continueReading.chapter.novel?.author}</p>
                <p className="text-xs text-foreground/60">{formatChapterTitle(continueReading.chapter.order_num, continueReading.chapter.title)}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link href={`/read/${continueReading.chapter_id}`} className="flex-1 text-center bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition" onClick={() => { setShowContinueModal(false); track('click_continue_reading_modal', { novel_id: continueReading.chapter.novel_id }) }}>
                Continue
              </Link>
              <button onClick={() => setShowContinueModal(false)} className="flex-1 text-center border border-primary/30 text-primary py-3 rounded-xl font-medium hover:bg-primary/5 transition">
                Not Now
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
