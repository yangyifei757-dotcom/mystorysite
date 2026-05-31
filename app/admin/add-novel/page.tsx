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
  const [result, setResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

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
        setResult({ type: 'success', text: data.message })
      } else {
        setResult({ type: 'error', text: data.error || 'Unknown error' })
      }
    } catch (err: any) {
      setResult({ type: 'error', text: 'Network error: ' + err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-serif text-primary mb-8">📖 Upload a Novel</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="title" placeholder="Title *" value={form.title} onChange={handleChange} className="w-full p-3 rounded bg-card border border-border" required />
        <input name="author" placeholder="Author *" value={form.author} onChange={handleChange} className="w-full p-3 rounded bg-card border border-border" required />
        <textarea name="description" placeholder="Description" value={form.description} onChange={handleChange} className="w-full p-3 rounded bg-card border border-border" rows={3} />
        <input name="coverUrl" placeholder="Cover Image URL (https://...)" value={form.coverUrl} onChange={handleChange} className="w-full p-3 rounded bg-card border border-border" />
        <input name="tags" placeholder="Tags (comma separated, e.g. fantasy,romance)" value={form.tags} onChange={handleChange} className="w-full p-3 rounded bg-card border border-border" />
        <div>
          <label className="block text-sm mb-1">Full Novel Text *</label>
          <textarea name="content" placeholder="Paste entire book content. Chapters should start with 'Chapter 1', 'Chapter 2', etc." value={form.content} onChange={handleChange} className="w-full p-3 rounded bg-card border border-border font-mono text-sm" rows={20} required />
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm mb-1">Paywall starts after chapter #</label>
            <input name="payAfterChapter" type="number" value={form.payAfterChapter} onChange={handleChange} className="w-full p-3 rounded bg-card border border-border" min="0" />
          </div>
          <div className="flex-1">
            <label className="block text-sm mb-1">Upload Password *</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} className="w-full p-3 rounded bg-card border border-border" required />
          </div>
        </div>
        <button type="submit" disabled={loading} className="w-full py-3 bg-primary text-background rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50">
          {loading ? 'Uploading...' : 'Upload Novel'}
        </button>
      </form>

      {result && (
        <div className={`mt-6 p-4 rounded-xl text-center ${result.type === 'success' ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'}`}>
          {result.text}
        </div>
      )}
    </div>
  )
}
