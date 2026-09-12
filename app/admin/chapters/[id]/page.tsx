'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

const ADMIN_PASSWORD = 'mynovel2026'

export default function EditChapterPage() {
  const params = useParams()
  const router = useRouter()
  const chapterId = params.id as string

  const [authorized, setAuthorized] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [chapter, setChapter] = useState<any>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  useEffect(() => {
    const savedPassword = localStorage.getItem('admin_password')
    if (savedPassword === ADMIN_PASSWORD) {
      setAuthorized(true)
      fetchChapter()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchChapter = async () => {
    const { data } = await supabase
      .from('chapters')
      .select('*')
      .eq('id', chapterId)
      .single()

    if (data) {
      setChapter(data)
      setTitle(data.title || '')
      setContent(data.content || '')
    }
    setLoading(false)
  }

  const handleLogin = async () => {
    if (passwordInput === ADMIN_PASSWORD) {
      setAuthorized(true)
      localStorage.setItem('admin_password', passwordInput)
      fetchChapter()
    } else {
      alert('Wrong password')
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    const adminPassword = localStorage.getItem('admin_password') || ''

    const res = await fetch('/api/update-chapter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: chapterId,
        password: adminPassword,
        title,
        content,
      }),
    })

    const data = await res.json()
    if (res.ok) {
      setMessage('✅ Chapter updated successfully')
    } else {
      setMessage('❌ ' + (data.error || 'Update failed'))
    }
    setSaving(false)
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

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-foreground/50">Loading chapter...</div>
  }

  if (!chapter) {
    return <div className="min-h-screen flex items-center justify-center text-foreground/50">Chapter not found</div>
  }

  return (
    <main className="min-h-screen bg-background pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link
            href={`/admin/novels/${chapter.novel_id}/chapters`}
            className="text-sm text-primary hover:underline"
          >
            ← Back to Chapters
          </Link>
          <h1 className="text-2xl font-serif text-primary mt-2">
            Edit Chapter {chapter.order_num}
          </h1>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <div>
            <label className="block text-sm text-foreground/60 mb-1">Chapter Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 rounded bg-background border border-border text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm text-foreground/60 mb-1">
              Content ({content.length} characters)
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={25}
              className="w-full p-3 rounded bg-background border border-border text-foreground font-mono text-sm"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-primary text-background rounded-xl font-bold hover:bg-primary/90 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {message && <p className="text-sm text-primary">{message}</p>}
        </div>
      </div>
    </main>
  )
}
