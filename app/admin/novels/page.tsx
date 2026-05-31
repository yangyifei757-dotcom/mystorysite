'use client'

import { useState, useEffect } from 'react'

export default function ManageNovels() {
  const [novels, setNovels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchNovels = async () => {
    const res = await fetch('/api/list-novels')
    const data = await res.json()
    setNovels(data.novels || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchNovels()
  }, [])

  const togglePublished = async (id: string, current: boolean) => {
    await fetch('/api/toggle-publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isPublished: !current }),
    })
    fetchNovels()
  }

  if (loading) return <div className="text-white p-10">Loading...</div>

  return (
    <div className="min-h-screen bg-background text-foreground p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-serif text-primary mb-8">NovelCrush - 📋 Manage Novels</h1>
      <div className="space-y-4">
        {novels.map((novel: any) => (
          <div key={novel.id} className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-4">
              {novel.cover_url && <img src={novel.cover_url} alt="" className="w-12 h-16 object-cover rounded" />}
              <div>
                <p className="text-lg font-medium">{novel.title}</p>
                <p className="text-sm text-foreground/60">by {novel.author}</p>
              </div>
            </div>
            <button
              onClick={() => togglePublished(novel.id, novel.is_published)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                novel.is_published
                  ? 'bg-green-900/40 text-green-300 hover:bg-green-800/40'
                  : 'bg-red-900/40 text-red-300 hover:bg-red-800/40'
              }`}
            >
              {novel.is_published ? '🟢 Online' : '🔴 Offline'}
            </button>
          </div>
        ))}
        {novels.length === 0 && <p className="text-foreground/50">No novels yet.</p>}
      </div>
    </div>
  )
}
