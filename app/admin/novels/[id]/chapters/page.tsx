'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { useParams } from 'next/navigation'

const ADMIN_PASSWORD = 'mynovel2026'

function formatChapterTitle(orderNum: number, title: string | null | undefined) {
  const defaultTitle = `Chapter ${orderNum}`
  if (!title || title === defaultTitle || title.trim() === `Chapter ${orderNum}`) {
    return defaultTitle
  }
  return `Chapter ${orderNum}: ${title}`
}

export default function ChapterListPage() {
  const params = useParams()
  const novelId = params.id as string

  const [authorized, setAuthorized] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [novel, setNovel] = useState<any>(null)
  const [chapters, setChapters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedPassword = localStorage.getItem('admin_password')
    if (savedPassword === ADMIN_PASSWORD) {
      setAuthorized(true)
      fetchData()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchData = async () => {
    const { data: novelData } = await supabase
      .from('novels')
      .select('*')
      .eq('id', novelId)
      .single()

    const { data: chaptersData } = await supabase
      .from('chapters')
      .select('id, title, order_num, is_locked, content')
      .eq('novel_id', novelId)
      .order('order_num', { ascending: true })

    setNovel(novelData)
    setChapters(chaptersData || [])
    setLoading(false)
  }

  const handleLogin = async () => {
    if (passwordInput === ADMIN_PASSWORD) {
      setAuthorized(true)
      localStorage.setItem('admin_password', passwordInput)
      fetchData()
    } else {
      alert('Wrong password')
    }
  }

  if (!authorized) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-sm w-full bg-card p-8 rounded-2xl border border-border space-y-4">
          <h1 className="text-xl font-serif text-primary text-center">Admin Access</h1>
          <input
            type="password"
            placeholder="Password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            className="w-full p-3 rounded bg-background border border-border text-foreground"
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />
          <button onClick={handleLogin} className="w-full py-3 bg-primary text-background rounded-xl font-bold hover:bg-primary/90 transition">
            Login
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <Link href="/admin/novels" className="text-sm text-primary hover:underline">
              ← Back to Novels
            </Link>
            <h1 className="text-2xl font-serif text-primary mt-2">
              {novel?.title || 'Chapters'}
            </h1>
            <p className="text-sm text-foreground/50">
              {chapters.length} chapters · {novel?.free_chapters >= 999 ? 'Free novel' : `${novel?.free_chapters || 3} free`}
            </p>
          </div>
          <Link
            href={`/admin/novels/${novelId}/replace`}
            className="px-5 py-2 bg-red-600 text-white rounded-full text-sm hover:bg-red-700 transition"
          >
            🔄 Replace All Chapters
          </Link>
        </div>

        {loading ? (
          <p className="text-foreground/50">Loading...</p>
        ) : chapters.length === 0 ? (
          <p className="text-foreground/50">No chapters found.</p>
        ) : (
          <div className="space-y-2">
            {chapters.map((ch: any) => (
              <Link
                key={ch.id}
                href={`/admin/chapters/${ch.id}`}
                className="flex justify-between items-center p-4 bg-card rounded-xl border border-border hover:border-primary/40 transition"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {formatChapterTitle(ch.order_num, ch.title)}
                  </p>
                  <p className="text-xs text-foreground/40 mt-0.5">
                    {ch.content?.length || 0} characters
                  </p>
                </div>
                <span className="text-xs text-primary">Edit →</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
