'use client'

import { useState } from 'react'

export default function AddNovelPage() {
  const [form, setForm] = useState({
    title: '',
    author: '',
    description: '',
    coverUrl: '',
    tags: '',
    content: '',
    payAfterChapter: '3',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const res = await fetch('/api/add-novel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          author: form.author,
          description: form.description,
          coverUrl: form.coverUrl,
          tags: form.tags,
          content: form.content,
          payAfterChapter: parseInt(form.payAfterChapter) || 3,
          password: form.password,
        }),
      })

      const data = await res.json()
      if (res.ok && data.message) {
        setMessage('✅ ' + data.message)
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
          <input name="coverUrl" placeholder="Cover Image URL (https://...)" value={form.coverUrl} onChange={handleChange} className="w-full p-3 rounded bg-background border border-border text-foreground" />
          <input name="tags" placeholder="Tags (comma separated, e.g. romance,fantasy)" value={form.tags} onChange={handleChange} className="w-full p-3 rounded bg-background border border-border text-foreground" />
          <div>
            <label className="block text-sm mb-1 text-foreground/70">Full Novel Text *</label>
            <textarea name="content" placeholder="Paste entire book content. Chapters should start with 'Chapter 1', 'Chapter 2', etc." value={form.content} onChange={handleChange} className="w-full p-3 rounded bg-background border border-border text-foreground font-mono text-sm" rows={20} required />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm mb-1 text-foreground/70">Paywall starts after chapter #</label>
              <input name="payAfterChapter" type="number" min="0" value={form.payAfterChapter} onChange={handleChange} className="w-full p-3 rounded bg-background border border-border text-foreground" />
            </div>
            <div className="flex-1">
              <label className="block text-sm mb-1 text-foreground/70">Upload Password *</label>
              <input name="password" type="password" value={form.password} onChange={handleChange} className="w-full p-3 rounded bg-background border border-border text-foreground" required />
            </div>
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
