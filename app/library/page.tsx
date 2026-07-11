'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LibraryPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchLibrary = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // 获取该用户所有阅读进度，按更新时间倒序
      const { data, error } = await supabase
        .from('reading_progress')
        .select('*, chapter:chapter_id(*, novel:novel_id(*))')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (error || !data) {
        setLoading(false)
        return
      }

      // 去重：每部小说只保留最近阅读的一条记录
      const novelMap = new Map<string, any>()
      data.forEach((item: any) => {
        const novelId = item.chapter?.novel?.id
        if (novelId && !novelMap.has(novelId)) {
          novelMap.set(novelId, item)
        }
      })

      setItems(Array.from(novelMap.values()))
      setLoading(false)
    }

    fetchLibrary()
  }, [router])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-foreground/50">Loading your library...</div>
  }

  return (
    <main className="min-h-screen bg-background pt-24 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-serif text-foreground mb-8">📚 My Library</h1>

        {items.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl shadow-card">
            <p className="text-foreground/40 text-lg">Your library is empty.</p>
            <p className="text-foreground/30 text-sm mt-2">Start reading a story to see it here!</p>
            <Link href="/" className="inline-block mt-6 bg-primary text-white px-6 py-2 rounded-full text-sm hover:bg-primary/90 transition">
              Discover Stories
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item: any) => (
              <div key={item.id} className="flex items-center gap-4 p-4 bg-card rounded-xl shadow-card hover:shadow-card-hover transition">
                <div className="w-12 h-16 rounded-md overflow-hidden flex-shrink-0 bg-accent">
                  {item.chapter?.novel?.cover_url ? (
                    <img src={item.chapter.novel.cover_url} alt={item.chapter.novel.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-primary font-serif text-lg">
                      {item.chapter?.novel?.title?.charAt(0) || '?'}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/novel/${item.chapter?.novel?.id}`} className="font-serif text-foreground hover:text-primary transition line-clamp-1">
                    {item.chapter?.novel?.title || 'Unknown Novel'}
                  </Link>
                  <p className="text-xs text-foreground/50 mt-1">
                    {item.chapter?.title || 'Chapter'} · Last read {new Date(item.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <Link href={`/read/${item.chapter_id}`} className="flex-shrink-0 text-sm bg-primary text-white px-4 py-2 rounded-full hover:bg-primary/90 transition">
                  Continue
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
