'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

const FONT_SIZES = [16, 18, 20, 22, 24]
const BG_STYLES = {
  warm: 'bg-[#FDFAF6] text-[#3D2C2E]',
  sepia: 'bg-[#F5ECD7] text-[#4A3B2F]',
  dark: 'bg-[#1E1B1A] text-[#D4C5B9]',
}

function formatChapterTitle(orderNum: number, title: string | null | undefined) {
  const defaultTitle = `Chapter ${orderNum}`
  if (!title || title === defaultTitle || title.trim() === `Chapter ${orderNum}`) {
    return defaultTitle
  }
  return `Chapter ${orderNum}: ${title}`
}

export default function ReadPage() {
  const params = useParams()
  const chapterId = params.chapterId as string
  const router = useRouter()

  const [chapter, setChapter] = useState<any>(null)
  const [novel, setNovel] = useState<any>(null)
  const [allChapters, setAllChapters] = useState<any[]>([])
  const [loadedChapters, setLoadedChapters] = useState<any[]>([])
  const [canRead, setCanRead] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [fontSize, setFontSize] = useState(18)
  const [bgMode, setBgMode] = useState<keyof typeof BG_STYLES>('warm')
  const [hasSubscription, setHasSubscription] = useState(false)
  const [isLastFreeChapter, setIsLastFreeChapter] = useState(false)
  const [showTOC, setShowTOC] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [nextOrderNum, setNextOrderNum] = useState<number | null>(null)
  const [freeChapters, setFreeChapters] = useState(3)
  const [showPaywall, setShowPaywall] = useState(false)

  const loadingMoreRef = useRef(false)

  useEffect(() => {
    let isMounted = true
    const checkAccess = async () => {
      const { data: chapterData, error: chapterError } = await supabase
        .from('chapters')
        .select('*, novel:novel_id(*)')
        .eq('id', chapterId)
        .single()

      if (chapterError || !chapterData) {
        if (isMounted) setLoading(false)
        return
      }

      if (!isMounted) return
      setChapter(chapterData)
      setNovel(chapterData.novel)
      const free = chapterData.novel?.free_chapters || 3
      setFreeChapters(free)

      const { data: chaptersList } = await supabase
        .from('chapters')
        .select('id, title, is_locked, order_num')
        .eq('novel_id', chapterData.novel.id)
        .order('order_num', { ascending: true })

      if (chaptersList && isMounted) {
        setAllChapters(chaptersList)
        const lastFree = chaptersList.filter((ch: any) => ch.order_num <= free).pop()
        if (lastFree && lastFree.id === chapterId) {
          setIsLastFreeChapter(true)
          // 如果当前就是最后免费章节，并且用户未订阅，直接显示付费墙
        }
      }

      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user || null
      setCurrentUser(user)

      let subscribed = false
      if (user) {
        await supabase.from('reading_progress').upsert({
          user_id: user.id,
          chapter_id: chapterId,
          progress: 0,
          updated_at: new Date().toISOString(),
        })

        const { data: sub } = await supabase
          .from('subscriptions')
          .select('status, current_period_end')
          .eq('user_id', user.id)
          .order('current_period_end', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (sub && sub.status === 'active' && new Date(sub.current_period_end) > new Date()) {
          subscribed = true
        }
      }
      setHasSubscription(subscribed)

      const isFreeChapter = chapterData.order_num <= free
      if (isFreeChapter) {
        setCanRead(true)
        setLoadedChapters([chapterData])
        setNextOrderNum(chapterData.order_num + 1)
        // 如果当前是最后免费章节且未订阅，显示付费墙
        if (chapterData.order_num === free && !subscribed) {
          setShowPaywall(true)
        }
      } else {
        if (!user) {
          router.push('/pricing?message=Please login to read')
          return
        }
        if (!subscribed) {
          router.push('/pricing?message=Subscribe to unlock this chapter')
          return
        }
        setCanRead(true)
        setLoadedChapters([chapterData])
        setNextOrderNum(chapterData.order_num + 1)
      }

      setLoading(false)
    }

    checkAccess()

    return () => {
      isMounted = false
    }
  }, [chapterId, router])

  const loadNextChapter = async () => {
    if (loadingMoreRef.current) return
    if (!nextOrderNum || !novel?.id || allChapters.length === 0) return

    const maxOrder = Math.max(...allChapters.map((ch: any) => ch.order_num))
    if (nextOrderNum > maxOrder) return

    const next = allChapters.find((ch: any) => ch.order_num === nextOrderNum)
    if (!next) return

    // 如果下一章是付费章节且未订阅，显示付费墙并停止加载
    const isFreeNext = next.order_num <= freeChapters
    if (!isFreeNext && !hasSubscription) {
      setShowPaywall(true)
      return
    }

    loadingMoreRef.current = true
    setLoadingMore(true)

    const { data } = await supabase
      .from('chapters')
      .select('*, novel:novel_id(*)')
      .eq('id', next.id)
      .single()

    if (data) {
      setLoadedChapters(prev => [...prev, data])
      setNextOrderNum(prev => (prev || 0) + 1)

      if (currentUser) {
        await supabase.from('reading_progress').upsert({
          user_id: currentUser.id,
          chapter_id: data.id,
          progress: 0,
          updated_at: new Date().toISOString(),
        })
      }
    }

    loadingMoreRef.current = false
    setLoadingMore(false)
  }

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      const scrollHeight = document.documentElement.scrollHeight
      const clientHeight = window.innerHeight
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        loadNextChapter()
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [nextOrderNum, hasSubscription, allChapters, loadingMore, currentUser, novel, showPaywall, freeChapters])

  const goToChapter = async (orderNum: number) => {
    if (!novel?.id) return
    const { data } = await supabase
      .from('chapters')
      .select('id')
      .eq('novel_id', novel.id)
      .eq('order_num', orderNum)
      .single()
    if (data?.id) {
      router.push(`/read/${data.id}`)
      setShowTOC(false)
      window.scrollTo(0, 0)
    }
  }

  const canAccessChapter = (ch: any) => {
    const isFree = ch.order_num <= freeChapters
    return isFree || hasSubscription
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-foreground/50">Loading chapter...</div>
  }

  if (!chapter) {
    return <div className="min-h-screen flex items-center justify-center text-foreground/50">Chapter not found</div>
  }

  if (!canRead) return null

  const currentLastOrder = loadedChapters.length > 0 ? loadedChapters[loadedChapters.length - 1].order_num : chapter.order_num

  return (
    <div className={`min-h-screen transition-colors duration-500 ${BG_STYLES[bgMode]}`}>
      {/* 顶部工具栏 */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-sm border-b border-border/50 px-4 py-2 flex items-center justify-between">
        <div className="flex gap-3">
          <Link href={`/novel/${novel?.id || ''}`} className="text-sm hover:text-primary transition">
            ← Novel
          </Link>
          <Link href="/" className="text-sm hover:text-primary transition">
            Home
          </Link>
        </div>
        <div className="flex gap-2 items-center text-sm">
          <button onClick={() => setShowTOC(true)} className="text-sm hover:text-primary transition">
            ☰ Chapters
          </button>
          <button onClick={() => setFontSize(prev => Math.max(FONT_SIZES[0], prev - 2))}>A-</button>
          <span className="text-xs">{fontSize}px</span>
          <button onClick={() => setFontSize(prev => Math.min(FONT_SIZES[FONT_SIZES.length - 1], prev + 2))}>A+</button>
          <select
            value={bgMode}
            onChange={(e) => setBgMode(e.target.value as keyof typeof BG_STYLES)}
            className="ml-2 bg-transparent border border-border rounded px-2 py-1 text-xs"
          >
            <option value="warm">Warm</option>
            <option value="sepia">Sepia</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </div>

      {/* 章节内容 */}
      <article className="max-w-2xl mx-auto px-4 pt-16 pb-32 font-serif" style={{ fontSize: `${fontSize}px`, lineHeight: '1.8' }}>
        {loadedChapters.map((ch: any, index: number) => (
          <div key={ch.id} className={index > 0 ? 'mt-16 border-t border-border/30 pt-8' : ''}>
            <h1 className="text-2xl mb-8 font-bold">
              {formatChapterTitle(ch.order_num, ch.title)}
            </h1>
            {ch.content?.split('\n').filter(Boolean).map((p: string, i: number) => (
              <p key={i} className="mb-4">{p}</p>
            ))}
          </div>
        ))}

        {loadingMore && (
          <div className="mt-8 text-center text-foreground/40 text-sm">Loading next chapter...</div>
        )}

        {/* 付费墙 */}
        {showPaywall && !hasSubscription && (
          <div className="mt-12 p-6 rounded-2xl bg-gradient-to-br from-[#FFF5F5] to-[#FFEBEE] border border-pink-200 shadow-lg text-center">
            <div className="text-3xl mb-3">🌹</div>
            <h3 className="text-xl font-serif text-foreground mb-2">Loved this story?</h3>
            <p className="text-foreground/60 text-sm mb-5 max-w-xs mx-auto">
              Unlimited romance stories for less than a cup of coffee.
            </p>
            <Link
              href="/pricing"
              className="inline-block bg-primary text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-primary/90 transition shadow-md hover:shadow-lg"
            >
              Subscribe Now
            </Link>
          </div>
        )}
      </article>

      {/* 底部导航 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-border px-4 py-3 flex justify-between items-center">
        <button
          onClick={() => goToChapter(currentLastOrder - 1)}
          disabled={currentLastOrder <= 1}
          className="px-4 py-2 text-sm rounded-full border border-primary/30 text-primary disabled:opacity-30 hover:bg-primary/5 transition"
        >
          ← Previous
        </button>
        <span className="text-xs text-foreground/50">Ch. {currentLastOrder}</span>
        <button
          onClick={() => {
            const maxOrder = Math.max(...allChapters.map((ch: any) => ch.order_num))
            if (currentLastOrder < maxOrder) {
              const next = allChapters.find((ch: any) => ch.order_num === currentLastOrder + 1)
              if (next && next.order_num > freeChapters && !hasSubscription) {
                router.push('/pricing')
              } else {
                goToChapter(currentLastOrder + 1)
              }
            }
          }}
          className="px-4 py-2 text-sm rounded-full bg-primary text-white hover:bg-primary/90 transition"
        >
          Next →
        </button>
      </div>

      {/* 章节目录抽屉 */}
      {showTOC && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowTOC(false)} />
          <div className="relative w-80 max-w-[85vw] bg-white h-full overflow-y-auto shadow-xl p-6 ml-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-serif font-bold">Chapters</h2>
              <button onClick={() => setShowTOC(false)} className="text-foreground/50 hover:text-foreground">✕</button>
            </div>
            <div className="space-y-2">
              {allChapters.map((ch: any) => {
                const isFree = ch.order_num <= freeChapters
                const isCurrent = ch.id === chapterId
                const canAccess = canAccessChapter(ch)
                return (
                  <div
                    key={ch.id}
                    onClick={() => {
                      if (canAccess) goToChapter(ch.order_num)
                      else router.push('/pricing')
                    }}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                      isCurrent ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-accent/30'
                    } ${!canAccess ? 'opacity-60' : ''}`}
                  >
                    <span className="text-sm truncate">
                      {formatChapterTitle(ch.order_num, ch.title)}
                    </span>
                    {!isFree && !hasSubscription ? (
                      <span className="text-gray-400 text-sm flex-shrink-0 ml-2">🔒</span>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
