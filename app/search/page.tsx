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
      const { data: titleAuthorResults, error: titleAuthorError } = await supabase
        .from('novels')
        .select('*')
        .or(`title.ilike.%${query}%,author.ilike.%${query}%`)
        .in('status', ['published', 'restricted'])

      const { data: tagResults, error: tagError } = await supabase
        .from('novels')
        .select('*')
        .contains('tags', [query])
        .in('status', ['published', 'restricted'])

      if (titleAuthorError || tagError) {
        console.error('搜索错误:', titleAuthorError || tagError)
        setLoading(false)
        return
      }

      const combined = [...(titleAuthorResults || []), ...(tagResults || [])]
      const unique = combined.filter((novel, index, self) =>
        index === self.findIndex((n) => n.id === novel.id)
      )
      unique.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      setResults(unique.slice(0, 20))
      setLoading(false)
    }

    fetchResults()
  }, [query])

  return (
    <div className="max-w-4xl mx-auto">
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
          <p className="text-foreground/50 mb-2">More stories in this category coming soon. Check back later!</p>
          <p className="text-sm text-foreground/40">Meanwhile, explore other tags or subscribe for unlimited access to all current stories.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {results.map((novel: any) => (
            <Link key={novel.id} href={`/novel/${novel.id}`} className="group flex flex-col">
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-card group-hover:shadow-card-hover transition-all">
                {novel.cover_url ? (
                  <Image
                    src={novel.cover_url}
                    alt={novel.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                    sizes="(max-width: 640px) 50vw, 25vw"
                  />
                ) : (
                  <div className="h-full w-full bg-accent flex items-center justify-center text-4xl text-primary font-serif">{novel.title?.charAt(0)}</div>
                )}
              </div>
              <div className="mt-2 px-1">
                <h3 className="font-serif text-sm font-medium line-clamp-1">{novel.title}</h3>
                <p className="text-xs text-foreground/50">{novel.author}</p>
              </div>
            </Link>
          ))}
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
