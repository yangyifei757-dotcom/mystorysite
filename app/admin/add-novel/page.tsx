'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AddNovelPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    title: '',
    author: '',
    description: '',
    coverUrl: '',
    tags: 'Romance',
    content: '',
    payAfterChapter: '3',
    status: 'published', // 新增状态字段
  })
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Please upload an image smaller than 2MB.')
        e.target.value = ''
        return
      }
      setCoverFile(file)
    }
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const adminPassword = localStorage.getItem('admin_password') || ''

      let coverBase64 = null
      let coverFileName = null
      let coverFileType = null

      if (coverFile) {
        coverBase64 = await fileToBase64(coverFile)
        coverFileName = coverFile.name
        coverFileType = coverFile.type
      }

      const res = await fetch('/api/add-novel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          author: form.author,
          description: form.description,
          coverUrl: form.coverUrl,
          coverBase64,
          coverFileName,
          coverFileType,
          tags: form.tags,
          content: form.content,
          payAfterChapter: parseInt(form.payAfterChapter) || 3,
          status: form.status, // 传递状态
          password: adminPassword,
        }),
      })

      const data = await res.json()
      if (res.ok && data.message) {
        setMessage('✅ ' + data.message)
        setTimeout(() => router.push('/admin/novels'), 1500)
      } else {
        setMessage('❌ ' + (data.error || 'Unknown error'))
      }
    } catch (err: any) {
      setMessage('❌ Network error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto bg-card p-8 rounded-2xl border border-border">
        <h1 className="text-3xl font-serif text-primary mb-8">📖 Upload a Novel</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input name="title" placeholder="Title *" value={form.title} onChange={handleChange} className="w-full p-3 rounded bg-background border border-border text-foreground" required />
          <input name="author" placeholder="Author *" value={form.author} onChange={handleChange} className="w-full p-3 rounded bg-background border border-border text-foreground" required />
          <textarea name="description" placeholder="Description" value={form.description} onChange={handleChange} className="w-full p-3 rounded bg-background border border-border text-foreground" rows={3} />
          <div>
            <label className="block text-sm mb-1 text-foreground/70">Cover Image (max 2MB)</label>
            <input type="file" accept="image/*" onChange={handleFileChange} className="w-full p-3 rounded bg-background border border-border text-foreground" />
          </div>
          <input name="coverUrl" placeholder="Or enter cover image URL (optional)" value={form.coverUrl} onChange={handleChange} className="w-full p-3 rounded bg-background border border-border text-foreground" />
          <div>
            <label className="block text-sm mb-1 text-foreground/70">Tag (single select)</label>
            <select name="tags" value={form.tags} onChange={handleChange} className="w-full p-3 rounded bg-background border border-border text-foreground">
              <option value="Romance">Romance</option>
              <option value="Mafia">Mafia</option>
              <option value="Werewolf">Werewolf</option>
              <option value="Steamy">Steamy</option>
              <option value="Urban">Urban</option>
              <option value="Mature">Mature</option> {/* 新增标签选项 */}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1 text-foreground/70">Status</label>
            <select name="status" value={form.status} onChange={handleChange} className="w-full p-3 rounded bg-background border border-border text-foreground">
              <option value="published">Published (Public)</option>
              <option value="restricted">Restricted (Hidden from homepage)</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1 text-foreground/70">Full Novel Text *</label>
            <textarea name="content" placeholder="Paste entire book content. Chapters should start with 'Chapter 1', 'Chapter 2', etc." value={form.content} onChange={handleChange} className="w-full p-3 rounded bg-background border border-border text-foreground font-mono text-sm" rows={20} required />
          </div>
          <div>
            <label className="block text-sm mb-1 text-foreground/70">Paywall starts after chapter # (free chapters)</label>
            <input name="payAfterChapter" type="number" min="0" value={form.payAfterChapter} onChange={handleChange} className="w-full p-3 rounded bg-background border border-border text-foreground" />
          </div>
          <button type="submit" disabled={loading} className="w-full py-3 bg-primary text-background rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50">
            {loading ? 'Uploading...' : 'Upload Novel'}
          </button>
        </form>
        {message && <p className="mt-4 text-center text-sm text-primary">{message}</p>}
      </div>
    </main>
  )
}
