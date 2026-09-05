'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { track } from '@vercel/analytics'

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
  const [showFullSynopsis, setShowFullSynopsis] = useState(false)

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
      if (novelData) {
        document.title = `${novelData.title} - IvyNovel`
        track('view_novel_detail', { novel_id: id, title: novelData.title })
      }

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
            .not('tags', 'cs', '{"Mature"}') // 排除 Mature 标签
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
            .not('tags', 'cs', '{"Mature"}') // 排除 Mature 标签
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
  const canReadFirst = firstChapter && firstChapter.order_num <= freeChapters

  const tag = Array.isArray(novel.tags) ? novel.tags[0] : novel.tags

  // 推荐卡片渲染函数（与首页 Recommend 保持一致）
  const renderRecommendationCard = (rec: any) => {
    const recTag = Array.isArray(rec.tags) ? rec.tags[0] : rec.tags
    return (
      <Link
        key={rec.id}
        href={`/novel/${rec.id}`}
        className="group flex gap-4 p-4 bg-card rounded-xl shadow-card hover:shadow-card-hover transition-all duration-300"
        onClick={() => track('click_recommendation', { novel_id: rec.id, source: 'detail_page' })}
      >
        <div className="relative w-24 h-32 md:w-28 md:h-40 flex-shrink-0 rounded-lg overflow-hidden">
          {rec.cover_url ? (
            <Image
              src={rec.cover_url}
              alt={rec.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 96px, 112px"
            />
          ) : (
            <div className="h-full w-full bg-accent flex items-center justify-center text-2xl text-primary font-serif">
              {rec.title?.charAt(0)}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col h-full justify-between">
          <div>
            <h3 className="font-['Jost'] font-black text-lg md:text-xl leading-tight text-foreground mb-1 line-clamp-2 min-h-[2.5rem] md:min-h-[3rem]">
              {rec.title}
            </h3>
            <p className="text-xs text-foreground/50 mb-1">by {rec.author}</p>
            {recTag && (
              <span className="inline-block text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full mb-2">
                {recTag}
              </span>
            )}
          </div>
          <p className="text-sm text-foreground/60 line-clamp-2">
            {rec.description}
          </p>
        </div>
      </Link>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-16">
      {/* 顶部：与首页一致的固定导航，Logo 左对齐 */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="IvyNovel Logo" width={180} height={60} className="h-12 w-auto" priority />
            <span className="text-2xl font-['Jost'] font-black text-primary tracking-wide">IvyNovel</span>
          </Link>
          <Link href="/pricing" className="text-sm font-medium text-foreground/70 hover:text-primary transition">
            Pricing
          </Link>
        </div>
      </header>

      {/* 主内容区 */}
      <div className="max-w-4xl mx-auto px-4 pt-24">
        {/* 封面 + 基础信息 */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-10 mb-8 mt-4">
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

          {/* 右侧信息 */}
          <div className="flex-1 flex flex-col justify-start md:justify-start md:pt-2">
            <h1 className="text-3xl md:text-4xl font-['Jost'] font-black text-foreground leading-tight mb-3">
              {novel.title}
            </h1>
            <p className="text-lg text-foreground/60 mb-4">by {novel.author}</p>
            {tag && (
              <span className="inline-block self-start text-sm bg-primary/10 text-primary px-3 py-1 rounded-full">
                {tag}
              </span>
            )}

            {/* Read 按钮 */}
            <div className="mt-6">
              {canReadFirst && firstChapter ? (
                <Link
                  href={`/read/${firstChapter.id}`}
                  className="inline-block bg-primary text-white px-10 py-3 rounded-full text-lg font-bold hover:bg-primary/90 transition shadow-lg"
                  onClick={() => track('click_read_first_chapter', { novel_id: id })}
                >
                  Read
                </Link>
              ) : (
                <Link
                  href="/pricing"
                  className="inline-block bg-primary text-white px-10 py-3 rounded-full text-lg font-bold hover:bg-primary/90 transition shadow-lg"
                  onClick={() => track('click_subscribe_from_detail', { novel_id: id })}
                >
                  Subscribe to Read
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Synopsis 区域，可折叠 */}
        <div className="mb-8">
          <h2 className="text-xl font-['Jost'] font-black text-foreground mb-2">Synopsis</h2>
          <p className={`text-foreground/70 leading-relaxed ${!showFullSynopsis ? 'line-clamp-3' : ''}`}>
            {novel.description || "No synopsis available."}
          </p>
          {novel.description && novel.description.length > 0 && (
            <button
              onClick={() => setShowFullSynopsis(!showFullSynopsis)}
              className="text-primary text-sm mt-2 hover:underline"
            >
              {showFullSynopsis ? 'Show Less' : 'More'}
            </button>
          )}
        </div>

        {/* 第一章内容预览 */}
        {firstChapter && showFirstChapter ? (
          <div className="mb-8">
            <h2 className="text-xl font-['Jost'] font-black text-foreground mb-4">
              {formatChapterTitle(firstChapter.order_num, firstChapter.title)}
            </h2>
            <div className="prose prose-sm max-w-none text-foreground/80 leading-relaxed">
              {firstChapter.content?.split('\n').filter(Boolean).slice(0, 10).map((p: string, i: number) => (
                <p key={i} className="mb-4">{p}</p>
              ))}
            </div>
            {nextChapter && (
              <div className="flex justify-center mt-6">
                <Link
                  href={`/read/${nextChapter.id}`}
                  className="inline-block bg-primary text-white px-10 py-4 rounded-xl text-lg font-bold hover:bg-primary/90 transition shadow-lg"
                  onClick={() => track('click_continue_reading', { novel_id: id, next_chapter_id: nextChapter.id })}
                >
                  Continue Reading
                </Link>
              </div>
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

        {/* 推荐区域：小封面左右布局，与首页 Recommend 相同，已排除 Mature */}
        {recommendations.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl md:text-3xl font-['Jost'] font-black text-foreground mb-6">You May Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {recommendations.map((rec: any) => renderRecommendationCard(rec))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
