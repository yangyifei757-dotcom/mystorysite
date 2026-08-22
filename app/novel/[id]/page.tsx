'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import Image from 'next/image'
import { useParams } from 'next/navigation'

function formatChapterTitle(orderNum: number, title: string | null | undefined) {
  const defaultTitle = `Chapter ${orderNum}`
  if (!title || title === defaultTitle || title.trim() === `Chapter ${orderNum}`) {
    return defaultTitle
  }
  return `Chapter ${orderNum}: ${title}`
}

export default function NovelPage() {
  const params = useParams()
  const id = params.id as string

  const [novel, setNovel] = useState<any>(null)
  const [chapters, setChapters] = useState<any[]>([])
  const [hasSubscription, setHasSubscription] = useState(false)
  const [loading, setLoading] = useState(true)

  // 新增：推荐小说列表
  const [recommendations, setRecommendations] = useState<any[]>([])

  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      // 获取当前小说和章节
      const { data: novelData } = await supabase.from('novels').select('*').eq('id', id).single()
      const { data: chaptersData } = await supabase
        .from('chapters')
        .select('*')
        .eq('novel_id', id)
        .order('order_num', { ascending: true })

      if (!isMounted) return
      setNovel(novelData)
      setChapters(chaptersData || [])
      if (novelData) document.title = `${novelData.title} - IvyNovel`

      // 获取当前登录用户订阅状态
      const { data: { session } } = await supabase.auth.getSession()
      const currentUser = session?.user || null

      if (currentUser) {
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('status, current_period_end')
          .eq('user_id', currentUser.id)
          .order('current_period_end', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (sub && sub.status === 'active' && new Date(sub.current_period_end) > new Date()) {
          if (isMounted) setHasSubscription(true)
        }
      }

      // 获取推荐小说
      if (novelData) {
        // 优先推荐相同标签的小说，排除当前小说
        const tags = novelData.tags || []
        let recommendationsData: any[] = []

        if (tags.length > 0) {
          const { data: similar } = await supabase
            .from('novels')
            .select('*')
            .eq('status', 'published')
            .neq('id', id)
            .overlaps('tags', tags)
            .limit(8)

          recommendationsData = similar || []
        }

        // 如果推荐不足，用最新小说补齐
        if (recommendationsData.length < 8) {
          const existingIds = recommendationsData.map((n: any) => n.id)
          const { data: latest } = await supabase
            .from('novels')
            .select('*')
            .eq('status', 'published')
            .neq('id', id)
            .not('id', 'in', `(${existingIds.join(',')})`)
            .order('created_at', { ascending: false })
            .limit(8 - recommendationsData.length)

          if (latest) recommendationsData = [...recommendationsData, ...latest]
        }

        if (isMounted) setRecommendations(recommendationsData.slice(0, 8))
      }

      if (isMounted) setLoading(false)
    }

    fetchData()

    return () => {
      isMounted = false
    }
  }, [id])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-foreground/50">Loading...</div>
  }

  if (!novel) {
    return <div className="min-h-screen flex items-center justify-center text-foreground/50">Novel not found</div>
  }

  return (
    <main className="min-h-screen bg-background pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-10">
        {/* 封面 */}
        <div className="w-full md:w-1/3">
          <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl bg-card">
            {novel.cover_url ? (
              <Image
                src={novel.cover_url}
                alt={novel.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            ) : (
              <div className="h-full w-full bg-accent flex items-center justify-center text-4xl text-primary font-serif">{novel.title?.charAt(0)}</div>
            )}
          </div>
        </div>

        {/* 信息区 */}
        <div className="flex-1">
          <h1 className="font-serif text-4xl text-primary mb-2">{novel.title}</h1>
          <p className="text-lg text-foreground/70 mb-4">by {novel.author}</p>
          <p className="text-foreground/80 leading-relaxed mb-8">{novel.description}</p>

          <h2 className="text-2xl font-serif mb-4">Chapters</h2>
          <div className="space-y-3">
            {chapters.map((chapter: any) => {
              const isFree = !chapter.is_locked
              const canAccess = isFree || hasSubscription

              return (
                <div key={chapter.id} className="flex justify-between items-center p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition">
                  <div className="flex items-center gap-2">
                    <span className="text-foreground/80">
                      {formatChapterTitle(chapter.order_num, chapter.title)}
                    </span>
                    {!hasSubscription && (
                      isFree ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">Free</span>
                      ) : (
                        <span className="text-gray-400 text-lg">🔒</span>
                      )
                    )}
                  </div>
                  {canAccess ? (
                    <Link href={`/read/${chapter.id}`} className="text-sm bg-primary text-white px-4 py-1 rounded-full hover:bg-primary/90 transition">
                      Read
                    </Link>
                  ) : (
                    <Link href="/pricing" className="text-sm bg-primary/20 text-primary px-3 py-1 rounded-full hover:bg-primary/30 transition">
                      🔒
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 推荐区域：You may also like */}
      {recommendations.length > 0 && (
        <div className="max-w-6xl mx-auto mt-16">
          <h2 className="text-2xl md:text-3xl font-serif text-foreground mb-6">You may also like</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">
            {recommendations.map((rec: any) => (
              <Link
                key={rec.id}
                href={`/novel/${rec.id}`}
                className="flex-shrink-0 w-32 md:w-40 group"
              >
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-card group-hover:shadow-card-hover transition-all duration-300">
                  {rec.cover_url ? (
                    <Image
                      src={rec.cover_url}
                      alt={rec.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 128px, 160px"
                    />
                  ) : (
                    <div className="h-full w-full bg-accent flex items-center justify-center text-3xl text-primary font-serif">
                      {rec.title?.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  <h3 className="font-serif text-sm font-medium text-foreground line-clamp-1">{rec.title}</h3>
                  <p className="text-xs text-foreground/50">{rec.author}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}
