'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

const ADMIN_PASSWORD = 'mynovel2026'

export default function AdminNovelsPage() {
  const [authorized, setAuthorized] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [novels, setNovels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingNovel, setEditingNovel] = useState<any>(null)
  const [editForm, setEditForm] = useState<any>({
    title: '',
    author: '',
    description: '',
    cover_url: '',
    tags: '',
    status: 'published',
    free_chapters: 3,
  })
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [message, setMessage] = useState('')

  const fetchNovels = async () => {
    const { data, error } = await supabase
      .from('novels')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) {
      setNovels(data)
    }
    setLoading(false)
  }

  const handleLogin = async () => {
    if (passwordInput === ADMIN_PASSWORD) {
      setAuthorized(true)
      localStorage.setItem('admin_password', passwordInput)
      await fetchNovels()
    } else {
      alert('Wrong password')
    }
  }

  const startEdit = (novel: any) => {
    setEditingNovel(novel)
    setEditForm({
      title: novel.title || '',
      author: novel.author || '',
      description: novel.description || '',
      cover_url: novel.cover_url || '',
      tags: Array.isArray(novel.tags) ? novel.tags.join(',') : novel.tags || '',
      status: novel.status || 'draft',
      free_chapters: novel.free_chapters || 3,
    })
    setCoverFile(null)
    setMessage('')
  }

  const cancelEdit = () => {
    setEditingNovel(null)
  }

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCoverFile(e.target.files[0])
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

  const saveEdit = async () => {
    if (!editingNovel) return
    setMessage('Saving...')

    let coverBase64 = null
    let coverFileName = null
    let coverFileType = null

    if (coverFile) {
      coverBase64 = await fileToBase64(coverFile)
      coverFileName = coverFile.name
      coverFileType = coverFile.type
    }

    const adminPassword = localStorage.getItem('admin_password') || ''

    const res = await fetch('/api/update-novel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editingNovel.id,
        password: adminPassword,
        title: editForm.title,
        author: editForm.author,
        description: editForm.description,
        coverUrl: editForm.cover_url,
        coverBase64,
        coverFileName,
        coverFileType,
        tags: editForm.tags,
        status: editForm.status,
        freeChapters: editForm.free_chapters,
      }),
    })

    const data = await res.json()
    if (res.ok) {
      setMessage('✅ Updated successfully')
      setEditingNovel(null)
      await fetchNovels()
    } else {
      setMessage('❌ ' + (data.error || 'Update failed'))
    }
  }

  const deleteNovel = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    // 删除小说
    const { error } = await supabase.from('novels').delete().eq('id', id)
    if (error) {
      alert('Delete failed: ' + error.message)
    } else {
      await fetchNovels()
      alert('Deleted')
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
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-serif text-primary">📋 Manage Novels</h1>
          <Link href="/admin/add-novel" className="px-5 py-2 bg-primary text-background rounded-full text-sm hover:bg-primary/90 transition">
            + Add New Novel
          </Link>
        </div>

        {message && <p className="mb-4 text-sm text-primary">{message}</p>}

        {editingNovel && (
          <div className="mb-8 bg-card rounded-2xl border border-primary/30 p-6 shadow-lg">
            <h2 className="text-xl font-serif text-primary mb-4">Editing: {editingNovel.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-foreground/60 mb-1">Title</label>
                <input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="w-full p-2 rounded bg-background border border-border text-foreground" />
              </div>
              <div>
                <label className="block text-sm text-foreground/60 mb-1">Author</label>
                <input value={editForm.author} onChange={(e) => setEditForm({ ...editForm, author: e.target.value })} className="w-full p-2 rounded bg-background border border-border text-foreground" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-foreground/60 mb-1">Description</label>
                <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={3} className="w-full p-2 rounded bg-background border border-border text-foreground" />
              </div>
              <div>
                <label className="block text-sm text-foreground/60 mb-1">Cover Image</label>
                <input type="file" accept="image/*" onChange={handleCoverChange} className="w-full p-2 rounded bg-background border border-border text-foreground" />
                {editForm.cover_url && (
                  <p className="text-xs text-foreground/50 mt-1">Current: {editForm.cover_url}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-foreground/60 mb-1">Tags (comma separated)</label>
                <input value={editForm.tags} onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })} className="w-full p-2 rounded bg-background border border-border text-foreground" />
              </div>
              <div>
                <label className="block text-sm text-foreground/60 mb-1">Status</label>
                <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className="w-full p-2 rounded bg-background border border-border text-foreground">
                  <option value="published">Published</option>
                  <option value="draft">Draft (Hidden)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-foreground/60 mb-1">Free Chapters</label>
                <input type="number" min="0" value={editForm.free_chapters} onChange={(e) => setEditForm({ ...editForm, free_chapters: e.target.value })} className="w-full p-2 rounded bg-background border border-border text-foreground" />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={saveEdit} className="px-5 py-2 bg-primary text-background rounded-full text-sm hover:bg-primary/90 transition">Save Changes</button>
              <button onClick={cancelEdit} className="px-5 py-2 border border-primary/30 text-primary rounded-full text-sm hover:bg-primary/5 transition">Cancel</button>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-foreground/50">Loading...</p>
        ) : novels.length === 0 ? (
          <p className="text-foreground/50">No novels yet. Click "Add New Novel" to upload one.</p>
        ) : (
          <div className="overflow-x-auto bg-card rounded-2xl shadow-card">
            <table className="w-full text-left">
              <thead className="border-b border-border">
                <tr>
                  <th className="p-3 text-sm font-medium">Cover</th>
                  <th className="p-3 text-sm font-medium">Title</th>
                  <th className="p-3 text-sm font-medium">Author</th>
                  <th className="p-3 text-sm font-medium">Status</th>
                  <th className="p-3 text-sm font-medium">Free Ch.</th>
                  <th className="p-3 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {novels.map((novel: any) => (
                  <tr key={novel.id} className="border-b border-border/50 hover:bg-accent/20">
                    <td className="p-3">
                      {novel.cover_url ? (
                        <img src={novel.cover_url} alt="" className="w-10 h-14 object-cover rounded" />
                      ) : (
                        <div className="w-10 h-14 bg-accent rounded" />
                      )}
                    </td>
                    <td className="p-3 font-medium">{novel.title}</td>
                    <td className="p-3 text-foreground/60">{novel.author}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${novel.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {novel.status}
                      </span>
                    </td>
                    <td className="p-3">{novel.free_chapters || 3}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button onClick={() => startEdit(novel)} className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full hover:bg-primary/30 transition">Edit</button>
                        <button onClick={() => deleteNovel(novel.id, novel.title)} className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded-full hover:bg-red-200 transition">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}
