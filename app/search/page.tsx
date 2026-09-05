'use client'

import { Suspense, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'

function SearchResults() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSubscription, setHasSubscription] = useState(false)

  // 检查订阅状态
  useEffect(() => {
    const checkSubscription = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('status, current_period_end')
          .eq('user_id', session.user.id)
          .order('current_period_end', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (sub && sub.status === 'active' && new Date(sub.current_period_end) > new Date()) {
          setHasSubscription(true)
        }
      }
    }
    checkSubscription()
  }, [])

  useEffect(() => {
    if (!query.trim()) return
    setLoading(true)

    const fetchResults = async () => {
      // 查询小说，同时获取每本小说的第一章节 ID
      const { data: novels, error } = await supabase
        .from('novels')
        .select(`
          *,
          chapters (id, order_num)
        `)
        .or(`title.ilike.%${query}%,author.ilike.%${query}%`)
        .in('status', ['published', 'restricted'])
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('搜索错误:', error)
        setLoading(false)
        return
      }

      // 为每部小说找到 order_num 为 1 的章节 ID
      const processed = (novels || []).map((novel: any) => {
        const firstChapter = (novel.chapters || []).find((ch: any) => ch.order_num === 1)
        return {
          ...novel,
          firstChapterId: firstChapter?.id || null,
        }
      })

      setResults(processed)
      setLoading(false)
    }

    fetchResults()
  }, [query])

  return (
    <div className="max-w-4xl mx-auto">
      {/* 搜索词标题 */}
      {query && (
        <h1 className="text-2xl font-serif text-foreground mb-6">
          Results for “{query}”
        </h1>
      )}

      {/* 搜索框 */}
      <div className="mb-6">
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
            defaultValue={query}
            placeholder="Search novels or authors..."
            className="w-full pl-9 pr-3 py-2.5 rounded-full border border-border bg-white text-foreground text-sm focus:outline-none focus:border-primary transition"
          />
        </form>
      </div>

      {/* 热门标签 */}
      <div className="flex flex-wrap gap-3 mb-6">
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

      {/* 搜索状态 */}
      {loading ? (
        <p className="text-foreground/40">Searching...</p>
      ) : results.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-foreground/50 mb-2">No results for “{query}”.</p>
          <p className="text-sm text-foreground/40 mb-4">Try one of these popular tags:</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/search?q=Romance" className="text-xs bg-accent text-accent-foreground px-3 py-1 rounded-full hover:bg-primary/10 hover:text-primary transition">Romance</Link>
            <Link href="/search?q=Mature" className="text-xs bg-accent text-accent-foreground px-3 py-1 rounded-full hover:bg-primary/10 hover:text-primary transition">Mature</Link>
            <Link href="/search?q=Werewolf" className="text-xs bg-accent text-accent-foreground px-3 py-1 rounded-full hover:bg-primary/10 hover:text-primary transition">Werewolf</Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map((novel: any) => {
            const tag = Array.isArray(novel.tags) ? novel.tags[0] : novel.tags
            return (
              <div
                key={novel.id}
                className="flex gap-4 p-4 bg-card rounded-xl shadow-card hover:shadow-card-hover transition-all duration-300"
              >
                {/* 左侧封面 */}
                <Link href={`/novel/${novel.id}`} className="flex-shrink-0">
                  <div className="relative w-20 h-28 md:w-24 md:h-32 rounded-lg overflow-hidden">
                    {novel.cover_url ? (
                      <Image
                        src={novel.cover_url}
                        alt={novel.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 80px, 96px"
                      />
                    ) : (
                      <div className="h-full w-full bg-accent flex items-center justify-center text-2xl text-primary font-serif">
                        {novel.title?.charAt(0)}
                      </div>
                    )}
                  </div>
                </Link>

                {/* 中间信息 */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <h3 className="font-['Jost'] font-black text-lg md:text-xl leading-tight text-foreground mb-1">
                    {novel.title}
                  </h3>
                  <p className="text-xs text-foreground/50 mb-1">by {novel.author}</p>
                  {tag && (
                    <span className="inline-block self-start text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full mb-2">
                      {tag}
                    </span>
                  )}
                  <p className="text-sm text-foreground/60 line-clamp-2">
                    {novel.description}
                  </p>
                </div>

                {/* 右侧 Read 按钮 */}
                <div className="flex items-center">
                  {novel.firstChapterId ? (
                    <Link
                      href={`/read/${novel.firstChapterId}`}
                      className="inline-block bg-primary text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-primary/90 transition shadow"
                    >
                      Read
                    </Link>
                  ) : (
                    <span className="text-xs text-foreground/40">No chapters</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 订阅引导横幅（仅未订阅用户，结果下方） */}
      {!hasSubscription && !loading && (
        <div className="mt-8 p-4 bg-gradient-to-r from-primary/10 to-purple-100/50 rounded-xl border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-sm text-foreground/70 text-center sm:text-left">
            Unlock all stories with a membership.
          </span>
          <Link
            href="/pricing"
            className="text-sm font-bold text-primary hover:underline whitespace-nowrap"
          >
            Subscribe now →
          </Link>
        </div>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <main className="min-h-screen bg-background pb-20">
      {/* 顶部导航：与首页一致 */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
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
          <Link href="/pricing" className="text-sm font-medium text-foreground/70 hover:text-primary transition">
            Pricing
          </Link>
        </div>
      </header>

      {/* 主内容区 */}
      <div className="pt-24 px-4">
        <Suspense fallback={<div className="text-foreground/40">Loading search...</div>}>
          <SearchResults />
        </Suspense>
      </div>
    </main>
  )
}
