'use client'

import { useState } from 'react'

export default function AddNovelPage() {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [content, setContent] = useState('')
  const [payAfterChapter, setPayAfterChapter] = useState('3')
  const [password, setPassword] = useState('')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverUrl, setCoverUrl] = useState('')
  const [isPublished, setIsPublished] = useState(true)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    const formData = new FormData()
    formData.append('title', title)
    formData.append('author', author)
    formData.append('description', description)
    formData.append('tags', tags)
    formData.append('content', content)
    formData.append('payAfterChapter', payAfterChapter)
    formData.append('password', password)
    formData.append('isPublished', String(isPublished))
    if (coverFile) {
      formData.append('cover', coverFile)
    } else if (coverUrl.trim()) {
      formData.append('coverUrl', coverUrl.trim())
    }

    try {
      const res = await fetch('/api/add-novel', {
        method: 'POST',
        body: formData,
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
        <input placeholder="Title *" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 rounded bg-card border border-border" required />
        <input placeholder="Author *" value={author} onChange={e => setAuthor(e.target.value)} className="w-full p-3 rounded bg-card border border-border" required />
        <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} className="w-full p-3 rounded bg-card border border-border" rows={3} />
        <input placeholder="Tags (comma separated, e.g. fantasy,romance)" value={tags} onChange={e => setTags(e.target.value)} className="w-full p-3 rounded bg-card border border-border" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Cover Image (Upload file)</label>
            <input
              type="file"
              accept="image/*"
              onChange={e => {
                const file = e.target.files?.[0] || null
                setCoverFile(file)
                if (file) setCoverUrl('') // 清空URL，优先使用文件
              }}
              className="w-full p-3 rounded bg-card border border-border"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Cover Image URL (optional)</label>
            <input
              placeholder="https://..."
              value={coverUrl}
              onChange={e => {
                setCoverUrl(e.target.value)
                if (e.target.value) setCoverFile(null) // 清空文件，优先使用URL
              }}
              className="w-full p-3 rounded bg-card border border-border"
            />
            <p className="text-xs text-foreground/50 mt-1">File upload overrides URL.</p>
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1">Full Novel Text *</label>
          <textarea
            placeholder="Paste entire book content. Chapters should start with 'Chapter 1', 'Chapter 2', etc."
            value={content}
            onChange={e => setContent(e.target.value)}
            className="w-full p-3 rounded bg-card border border-border font-mono text-sm"
            rows={20}
            required
          />
        </div>

        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm mb-1">Paywall starts after chapter #</label>
            <input type="number" value={payAfterChapter} onChange={e => setPayAfterChapter(e.target.value)} className="w-full p-3 rounded bg-card border border-border" min="0" />
          </div>
          <div className="flex-1">
            <label className="block text-sm mb-1">Upload Password *</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 rounded bg-card border border-border" required />
          </div>
        </div>

        <div className="flex items-center gap-3 py-2">
          <input
            type="checkbox"
            id="isPublished"
            checked={isPublished}
            onChange={e => setIsPublished(e.target.checked)}
            className="w-5 h-5"
          />
          <label htmlFor="isPublished" className="text-sm">Publish immediately (online)</label>
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
