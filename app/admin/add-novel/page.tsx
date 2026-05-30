'use client'

import { useState } from 'react'

export default function AddNovelPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [payAfterChapter, setPayAfterChapter] = useState('3')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [content, setContent] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setDebug('Sending request...')

    const formData = new FormData()
    formData.append('title', title)
    formData.append('description', description)
    formData.append('tags', tags)
    formData.append('payAfterChapter', payAfterChapter)
    formData.append('content', content)
    formData.append('password', password)
    if (coverFile) {
      formData.append('cover', coverFile)
    }

    try {
      const res = await fetch('/api/add-novel', {
        method: 'POST',
        body: formData,
      })
      setDebug('Got response, parsing...')
      const data = await res.json()
      setDebug('Done. Status: ' + res.status)
      setMessage(data.step || data.message || data.error || 'Unknown response')
    } catch (err: any) {
      setDebug('Fetch error: ' + err.message)
      setMessage('Network error. Check console.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-serif text-primary mb-8">Upload a Novel (Debug Mode)</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input placeholder="Title *" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 rounded bg-card border border-border" required />
        <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} className="w-full p-3 rounded bg-card border border-border" rows={3} />
        <input placeholder="Tags (comma separated)" value={tags} onChange={e => setTags(e.target.value)} className="w-full p-3 rounded bg-card border border-border" />
        <div>
          <label className="block text-sm mb-1">Cover Image (optional for now)</label>
          <input type="file" accept="image/*" onChange={e => setCoverFile(e.target.files?.[0] || null)} className="w-full p-3 rounded bg-card border border-border" />
        </div>
        <div>
          <label className="block text-sm mb-1">Full Novel Text *</label>
          <textarea placeholder="Paste book content with 'Chapter 1' headings" value={content} onChange={e => setContent(e.target.value)} className="w-full p-3 rounded bg-card border border-border font-mono text-sm" rows={20} required />
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm mb-1">Paywall after chapter #</label>
            <input type="number" value={payAfterChapter} onChange={e => setPayAfterChapter(e.target.value)} className="w-full p-3 rounded bg-card border border-border" min="0" />
          </div>
          <div className="flex-1">
            <label className="block text-sm mb-1">Upload Password *</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 rounded bg-card border border-border" required />
          </div>
        </div>
        <button type="submit" disabled={loading} className="w-full py-3 bg-primary text-background rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50">
          {loading ? 'Uploading...' : 'Upload Novel'}
        </button>
      </form>
      {debug && <p className="mt-2 text-xs text-foreground/50">Debug: {debug}</p>}
      {message && <p className="mt-4 text-center text-sm text-primary">{message}</p>}
    </div>
  )
}
