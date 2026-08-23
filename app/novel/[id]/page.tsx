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
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
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

      // 获取推荐小说
      if (novelData) {
        const tags = novelData.tags || []
        let recommendationsData: any[] = []

        if (tags.length > 0) {
          const { data: similar } = await supabase
            .from('novels')
            .select('*')
            .eq('status', 'published')
            .neq('id', id)
            .overlaps('tags', tags)
            .limit(6)

          recommendationsData = similar || []
        }

        if (recommendationsData.length < 6) {
          const existingIds = recommendationsData.map((n: any) => n.id)
          const { data: latest } = await supabase
            .from('novels')
            .select('*')
            .eq('status', 'published')
            .neq('id', id)
            .not('id', 'in', `(${existingIds.join(',')})`)
            .order('created_at', { ascending: false })
            .limit(6 - recommendationsData.length)

          if (latest) recommendationsData = [...recommendationsData, ...latest]
        }

        if (isMounted) setRecommendations(recommendationsData.slice(0, 6))
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

  const freeChapters = novel.free_chapters || 3
  const firstChapter = chapters.find(ch => ch.order_num === 1)
  const nextChapter = chapters.find(ch => ch.order_num === 2) || chapters.find(ch => ch.order_num > 1)

  const showFirstChapter = firstChapter && firstChapter.order_num <= freeChapters

  const tag = Array.isArray(novel.tags) ? novel.tags[0] : novel.tags

  return (
    <main className="min-h-screen bg-background pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 顶部：封面 + 基础信息 */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-10 mb-8">
          {/* 封面 */}
          <div className="w-full md:w-1/3 flex-shrink-0 mx-auto md:mx-0">
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl bg-card max-w-[260px] md:max-w-none mx-auto">
              {novel.cover_url ? (
                <Image
                  src={novel.cover_url}
                  alt={novel.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              ) : (
                <div className="h-full w-full bg-accent flex items-center justify-center text-6xl text-primary font-serif">
                  {novel.title?.charAt(0)}
                </div>
              )}
            </div>
          </div>

          {/* 右侧：书名、作者、Tag（与封面对齐） */}
          <div className="flex-1 flex flex-col justify-start md:justify-start md:pt-2">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground leading-tight mb-3">
              {novel.title}
            </h1>
            <p className="text-lg text-foreground/60 mb-4">by {novel.author}</p>
            {tag && (
              <span className="inline-block self-start text-sm bg-primary/10 text-primary px-3 py-1 rounded-full">
                {tag}
              </span>
            )}
          </div>
        </div>

        {/* 简介（Synopsis） */}
        <div className="mb-8">
          <h2 className="text-xl font-serif font-semibold text-foreground mb-2">Synopsis</h2>
          <p className="text-foreground/70 leading-relaxed">
            {novel.description || "No synopsis available."}
          </p>
        </div>

        {/* 第一章内容预览 */}
        {firstChapter && showFirstChapter ? (
          <div className="mb-8">
            <h2 className="text-xl font-serif font-semibold text-foreground mb-4">
              {formatChapterTitle(firstChapter.order_num, firstChapter.title)}
            </h2>
            <div className="prose prose-sm max-w-none text-foreground/80 leading-relaxed">
              {firstChapter.content?.split('\n').filter(Boolean).slice(0, 10).map((p: string, i: number) => (
                <p key={i} className="mb-4">{p}</p>
              ))}
            </div>
            {/* Continue Reading 按钮 */}
            {nextChapter && (
              <Link
                href={`/read/${nextChapter.id}`}
                className="block w-full md:w-auto inline-block text-center bg-primary text-white px-10 py-4 rounded-xl text-lg font-bold hover:bg-primary/90 transition shadow-lg mt-4"
              >
                Continue Reading
              </Link>
            )}
          </div>
        ) : (
          <div className="mb-8 p-6 bg-card rounded-xl border border-border text-center">
            <p className="text-foreground/50 mb-4">This chapter is locked. Subscribe to read the full story.</p>
            {firstChapter && (
              <Link href={`/read/${firstChapter.id}`} className="inline-block bg-primary text-white px-6 py-3 rounded-full font-medium hover:bg-primary/90 transition">
                Start Reading
              </Link>
            )}
          </div>
        )}

        {/* 推荐区域 */}
        {recommendations.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl md:text-3xl font-serif text-foreground mb-6">You may also like</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              {recommendations.map((rec: any) => (
                <Link key={rec.id} href={`/novel/${rec.id}`} className="group flex flex-col">
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-card group-hover:shadow-card-hover transition-all duration-300">
                    {rec.cover_url ? (
                      <Image src={rec.cover_url} alt={rec.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" />
                    ) : (
                      <div className="h-full w-full bg-accent flex items-center justify-center text-3xl text-primary font-serif">{rec.title?.charAt(0)}</div>
                    )}
                  </div>
                  <div className="mt-2 px-1">
                    <h3 className="font-serif text-sm font-medium text-foreground line-clamp-1">{rec.title}</h3>
                    <p className="text-xs text-foreground/50">{rec.author}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
