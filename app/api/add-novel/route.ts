import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  const { title, author, description, coverUrl, tags, content, splitBy, secret } = await request.json()

  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. 插入小说
  const { data: novel, error: novelError } = await supabaseAdmin
    .from('novels')
    .insert({
      title,
      author,
      description,
      cover_url: coverUrl || null,
      tags: tags ? tags.split(',').map((t: string) => t.trim()) : [],
      status: 'ongoing'
    })
    .select('id')
    .single()

  if (novelError || !novel) {
    return NextResponse.json({ error: 'Failed to create novel: ' + novelError?.message }, { status: 500 })
  }

  // 2. 按分割关键词拆分章节
  const chapters = splitTextIntoChapters(content, splitBy || 'Chapter')

  // 3. 批量插入章节
  const chapterInserts = chapters.map((ch, index) => ({
    novel_id: novel.id,
    title: ch.title || `Chapter ${index + 1}`,
    content: ch.body,
    order_num: index + 1,
    is_locked: index >= 3, // 前三章免费
    coin_price: 10
  }))

  const { error: chapterError } = await supabaseAdmin.from('chapters').insert(chapterInserts)
  if (chapterError) {
    return NextResponse.json({ error: 'Chapters insert failed: ' + chapterError.message }, { status: 500 })
  }

  return NextResponse.json({ message: `Novel "${title}" added with ${chapters.length} chapters!` })
}

function splitTextIntoChapters(text: string, splitKey: string) {
  const escapedKey = splitKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escapedKey}\\s*\\d+)`, 'gi')
  const parts = text.split(regex).filter(Boolean)
  const chapters: { title: string; body: string }[] = []

  for (let i = 0; i < parts.length; i += 2) {
    const title = parts[i]?.trim()
    const body = (parts[i + 1] || '').trim()
    if (title && body) {
      chapters.push({ title, body })
    }
  }

  if (chapters.length === 0) {
    chapters.push({ title: 'Chapter 1', body: text.trim() })
  }

  return chapters
}
