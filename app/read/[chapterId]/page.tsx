'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

export default function ReadPage() {
  const params = useParams()
  const chapterId = params.chapterId as string
  const router = useRouter()

  const [chapter, setChapter] = useState<any>(null)
  const [canRead, setCanRead] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAccess = async () => {
      const { data: chapterData } = await supabase
        .from('chapters')
        .select('*, novel:novel_id(*)')
        .eq('id', chapterId)
        .single()

      setChapter(chapterData)

      if (!chapterData) {
        setLoading(false)
        return
      }

      if (!chapterData.is_locked) {
        setCanRead(true)
        setLoading(false)
        return
      }

      // 付费章节：检查用户权限
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/pricing?message=Please login or subscribe')
        return
      }

      // 检查是否已购买
      const { data: unlock } = await supabase
        .from('chapter_unlocks')
        .select('id')
        .eq('user_id', user.id)
        .eq('chapter_id', chapterId)
        .single()

      if (unlock) {
        setCanRead(true)
        setLoading(false)
        return
      }

      // 检查订阅
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('status, current_period_end')
        .eq('user_id', user.id)
        .single()

      if (sub && sub.status === 'active' && new Date(sub.current_period_end) > new Date()) {
        setCanRead(true)
      } else {
        router.push('/pricing?message=Please subscribe to read')
      }
      setLoading(false)
    }

    checkAccess()
  }, [chapterId, router])

  if (loading) {
    return <div className="text-white p-20 text-center">Checking access...</div>
  }

  if (!chapter) {
    return <div className="text-white p-20 text-center">Chapter not found</div>
  }

  if (!canRead) {
    return null // 路由器会重定向
  }

  return (
    <main className="min-h-screen bg-background flex flex-col items-center px-4 py-16">
      <article className="max-w-2xl w-full">
        <Link href={`/novel/${chapter.novel_id}`} className="text-primary text-sm mb-8 inline-block hover:underline">
          ← Back to {chapter.novel?.title}
        </Link>
        <h1 className="font-serif text-3xl text-primary mb-8">
          Chapter {chapter.order_num}: {chapter.title}
        </h1>
        <div className="prose prose-invert prose-lg leading-relaxed text-foreground/90 font-serif">
          {chapter.content.split('\n').map((p: string, i: number) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        <div className="mt-12 flex justify-between">
          <button className="text-foreground/60 hover:text-primary transition">← Previous</button>
          <button className="text-foreground/60 hover:text-primary transition">Next →</button>
        </div>
      </article>
    </main>
  )
}
