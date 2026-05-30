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
    splitBy: 'Chapter',
    secret: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const res = await fetch('/api/add-novel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const data = await res.json()
    setMessage(data.message || data.error || 'Done')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-serif text-primary mb-8">Add Novel (One Click)</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          placeholder="Title"
          value={form.title}
          onChange={e => setForm({...form, title: e.target.value})}
          className="w-full p-3 rounded bg-card border border-border"
          required
        />
        <input
          placeholder="Author"
          value={form.author}
          onChange={e => setForm({...form, author: e.target.value})}
          className="w-full p-3 rounded bg-card border border-border"
          required
        />
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={e => setForm({...form, description: e.target.value})}
          className="w-full p-3 rounded bg-card border border-border"
          rows={3}
        />
        <input
          placeholder="Cover Image URL (https://...)"
          value={form.coverUrl}
          onChange={e => setForm({...form, coverUrl: e.target.value})}
          className="w-full p-3 rounded bg-card border border-border"
        />
        <input
          placeholder="Tags (comma separated, e.g. fantasy,romance)"
          value={form.tags}
          onChange={e => setForm({...form, tags: e.target.value})}
          className="w-full p-3 rounded bg-card border border-border"
        />
        <div>
          <label className="block text-sm mb-1">Full Novel Text</label>
          <textarea
            placeholder="Paste the entire book content here. Chapters will be split automatically."
            value={form.content}
            onChange={e => setForm({...form, content: e.target.value})}
            className="w-full p-3 rounded bg-card border border-border font-mono text-sm"
            rows={20}
            required
          />
        </div>
        <input
          placeholder="Split chapters by keyword (e.g. Chapter, CHAPTER, 第)"
          value={form.splitBy}
          onChange={e => setForm({...form, splitBy: e.target.value})}
          className="w-full p-3 rounded bg-card border border-border"
        />
        <input
          type="password"
          placeholder="Admin Secret (set in Vercel env)"
          value={form.secret}
          onChange={e => setForm({...form, secret: e.target.value})}
          className="w-full p-3 rounded bg-card border border-border"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-primary text-background rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? 'Adding...' : 'Add Novel Now'}
        </button>
      </form>
      {message && (
        <p className="mt-4 text-center text-sm text-primary">{message}</p>
      )}
    </div>
  )
}
