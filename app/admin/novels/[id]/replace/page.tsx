'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

const ADMIN_PASSWORD = 'mynovel2026'

export default function ReplaceNovelPage() {
  const params = useParams()
  const router = useRouter()
  const novelId = params.id as string

  const [authorized, setAuthorized] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [novel, setNovel] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [splitBy, setSplitBy] = useState('Chapter')
  const [replacing, setReplacing] = useState(false)
  const [message, setMessage] = useState('')
  const [confirmChecked, setConfirmChecked] = useState(false)

  useEffect(() => {
    const savedPassword = localStorage.getItem('admin_password')
    if (savedPassword === ADMIN_PASSWORD) {
      setAuthorized(true)
      fetchNovel()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchNovel = async () => {
    const { data } = await supabase.from('novels').select('*').eq('id', novelId).single()
    setNovel(data)
    setLoading(false)
  }

  const handleLogin = async () => {
    if (passwordInput === ADMIN_PASSWORD) {
      setAuthorized(true)
      localStorage.setItem('admin_password', passwordInput)
      fetchNovel()
    } else {
      alert('Wrong password')
    }
  }

  // 支持选择本地文件，读取文本
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setContent((reader.result as string) || '')
    }
    reader.readAsText(file)
  }

  const handleReplace = async () => {
    if (!content.trim()) {
      setMessage('❌ Please paste or upload content first.')
      return
    }
    if (!confirmChecked) {
      setMessage('❌ Please confirm you understand this will delete all existing chapters.')
      return
    }

    setReplacing(true)
    setMessage('Replacing...')

    const adminPassword = localStorage.getItem('admin_password') || ''
    const res = await fetch('/api/replace-novel-chapters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        novelId,
        password: adminPassword,
        content,
        splitBy,
      }),
    })

    const data = await res.json()
    if (res.ok && data.success) {
      setMessage('✅ ' + data.message)
      setContent('')
      setConfirmChecked(false)
      setTimeout(() => router.push(`/admin/novels/${novelId}/chapters`), 1500)
    } else {
      setMessage('❌ ' + (data.error || 'Replace failed'))
    }
    setReplacing(false)
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
    return <div className="min-h-screen flex items-center justify-center text-foreground/50">Loading...</div>
  }

  return (
    <main className="min-h-screen bg-background pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href={`/admin/novels/${novelId}/chapters`} className="text-sm text-primary hover:underline">
            ← Back to Chapters
          </Link>
          <h1 className="text-2xl font-serif text-primary mt-2">
            Replace All Chapters
          </h1>
          <p className="text-sm text-foreground/60 mt-1">
            Novel: <strong>{novel?.title}</strong>
          </p>
        </div>

        {/* 警告 */}
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-800 font-semibold mb-1">⚠️ Warning</p>
          <p className="text-sm text-red-700">
            This will <strong>permanently delete all existing chapters</strong> of this novel and replace them with the new content below. This action cannot be undone.
          </p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
          {/* 上传文件 */}
          <div>
            <label className="block text-sm text-foreground/60 mb-1">
              Upload a text file (.txt) containing the full novel content
            </label>
            <input
              type="file"
              accept=".txt,text/plain"
              onChange={handleFileChange}
              className="w-full p-3 rounded bg-background border border-border text-foreground"
            />
          </div>

          {/* 或者粘贴 */}
          <div>
            <label className="block text-sm text-foreground/60 mb-1">
              Or paste the full novel content below
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste entire book content here. Chapters should start with 'Chapter 1', 'Chapter 2', etc."
              rows={20}
              className="w-full p-3 rounded bg-background border border-border text-foreground font-mono text-sm"
            />
            <p className="text-xs text-foreground/40 mt-1">
              {content.length} characters · {content.split('\n').length} lines
            </p>
          </div>

          {/* 拆分关键词 */}
          <div>
            <label className="block text-sm text-foreground/60 mb-1">
              Split chapters by keyword (default: Chapter)
            </label>
            <input
              type="text"
              value={splitBy}
              onChange={(e) => setSplitBy(e.target.value)}
              className="w-full p-3 rounded bg-background border border-border text-foreground"
              placeholder="Chapter"
            />
          </div>

          {/* 确认复选框 */}
          <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <input
              type="checkbox"
              id="confirmReplace"
              checked={confirmChecked}
              onChange={(e) => setConfirmChecked(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="confirmReplace" className="text-sm text-red-800">
              I understand this will delete all existing chapters.
            </label>
          </div>

          <button
            onClick={handleReplace}
            disabled={replacing || !content.trim() || !confirmChecked}
            className="w-full py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition disabled:opacity-50"
          >
            {replacing ? 'Replacing...' : 'Replace All Chapters'}
          </button>

          {message && <p className="text-sm text-center text-primary">{message}</p>}
        </div>
      </div>
    </main>
  )
}
