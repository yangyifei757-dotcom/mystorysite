'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

const FONT_SIZES = [16, 18, 20, 22, 24]
const BG_STYLES = {
  warm: 'bg-[#FDFAF6] text-[#3D2C2E]',
  sepia: 'bg-[#F5ECD7] text-[#4A3B2F]',
  dark: 'bg-[#1E1B1A] text-[#D4C5B9]',
}

export default function ReadPage() {
  const params = useParams()
  const chapterId = params.chapterId as string
  const router = useRouter()

  const [chapter, setChapter] = useState<any>(null)
  const [novel, setNovel] = useState<any>(null)
  const [canRead, setCanRead] = useState(false)
  const [loading, setLoading] = useState(true)
  const [fontSize, setFontSize] = useState(18)
  const [bgMode, setBgMode] = useState<keyof typeof BG_STYLES>('warm')

  useEffect(() => {
    const checkAccess = async () => {
      const { data: chapterData, error: chapterError } = await supabase
        .from('chapters')
        .select('*, novel:novel_id(*)')
        .eq('id', chapterId)
        .single()

      if (chapterError || !chapterData) {
        setLoading(false)
        return
      }

      setChapter(chapterData)
      setNovel(chapterData.novel)

      if (!chapterData.is_locked) {
        setCanRead(true)
        setLoading(false)
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      const currentUser = session?.user || null
      if (!currentUser) {
        router.push('/pricing?message=Please login')
        return
      }

      const { data: sub } = await supabase
        .from('subscriptions')
        .select('status, current_period_end')
        .eq('user_id', currentUser.id)
        .single()

      if (sub && sub.status === 'active' && new Date(sub.current_period_end) > new Date()) {
        setCanRead(true)
      } else {
        router.push('/pricing?message=Subscribe to read')
      }
      setLoading(false)
    }

    checkAccess()
  }, [chapterId, router])

  const goToChapter = async (orderNum: number) => {
    if (!novel?.id) return
    const { data } = await supabase
      .from('chapters')
      .select('id')
      .eq('novel_id', novel.id)
      .eq('order_num', orderNum)
      .single()
    if (data?.id) router.push(`/read/${data.id}`)
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-foreground/50">Loading chapter...</div>
  }

  if (!chapter) {
    return <div className="min-h-screen flex items-center justify-center text-foreground/50">Chapter not found</div>
  }

  if (!canRead) return null

  const paragraphs = chapter.content?.split('\n').filter(Boolean) || []
  const currentIndex = chapter.order_num

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
        <h1 className="text-2xl mb-8 font-bold">Chapter {chapter.order_num}: {chapter.title}</h1>
        {paragraphs.map((p: string, i: number) => (
          <p key={i} className="mb-4">{p}</p>
        ))}
      </article>

      {/* 底部导航 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-border px-4 py-3 flex justify-between items-center">
        <button
          onClick={() => goToChapter(currentIndex - 1)}
          disabled={currentIndex <= 1}
          className="px-4 py-2 text-sm rounded-full border border-primary/30 text-primary disabled:opacity-30 hover:bg-primary/5 transition"
        >
          ← Previous
        </button>
        <span className="text-xs text-foreground/50">Ch. {currentIndex}</span>
        <button
          onClick={() => goToChapter(currentIndex + 1)}
          className="px-4 py-2 text-sm rounded-full bg-primary text-white hover:bg-primary/90 transition"
        >
          Next →
        </button>
      </div>
    </div>
  )
}
