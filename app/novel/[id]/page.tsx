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
  const [debugInfo, setDebugInfo] = useState<string>('')

  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      // 获取小说信息
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

      // 获取当前用户
      const { data: { session } } = await supabase.auth.getSession()
      const currentUser = session?.user || null

      let debug = `User: ${currentUser ? currentUser.email : 'Not logged in'} | `

      if (currentUser) {
        const { data: sub, error: subError } = await supabase
          .from('subscriptions')
          .select('status, current_period_end')
          .eq('user_id', currentUser.id)
          .maybeSingle()

        debug += `Sub: ${sub ? 'found' : 'not found'} | `
        if (subError) {
          debug += `Error: ${subError.message} | `
        }
        if (sub && sub.status === 'active' && new Date(sub.current_period_end) > new Date()) {
          if (isMounted) setHasSubscription(true)
          debug += 'Active ✅'
        } else if (sub) {
          debug += `Status: ${sub.status} | End: ${sub.current_period_end} | `
          debug += `Now: ${new Date().toISOString()} | Valid: ${new Date(sub.current_period_end) > new Date() ? 'yes' : 'no'}`
        }
      } else {
        debug += 'No user session'
      }

      if (isMounted) {
        setDebugInfo(debug)
        setLoading(false)
      }
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
      {/* 临时调试信息 */}
      <div style={{ background: 'yellow', color: 'black', padding: '8px', fontSize: '12px', marginBottom: '10px' }}>
        Debug: {debugInfo}
      </div>

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

        {/* 内容区 */}
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
    </main>
  )
}
