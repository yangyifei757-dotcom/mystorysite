import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const UPLOAD_PASSWORD = 'mynovel2026'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      title, author, description, coverUrl,
      coverBase64, coverFileName, coverFileType,
      tags, content, payAfterChapter, password
    } = body

    if (password !== UPLOAD_PASSWORD) {
      return NextResponse.json({ error: 'Incorrect upload password.' }, { status: 401 })
    }

    if (!title || !author || !content) {
      return NextResponse.json({ error: 'Title, author, and content are required.' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Server configuration error: Missing Supabase keys.' }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    let finalCoverUrl = coverUrl || ''

    // 处理封面上传（如果有 base64）
    if (coverBase64 && coverFileName) {
      // 将 Data URL 转换为 Buffer
      const base64Data = coverBase64.split(',')[1] // 移除 data:image/png;base64, 前缀
      const buffer = Buffer.from(base64Data, 'base64')

      const fileExt = coverFileName.split('.').pop()
      const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`
      const contentType = coverFileType || 'image/jpeg'

      const { error: uploadError } = await supabaseAdmin.storage
        .from('covers')
        .upload(uniqueName, buffer, {
          contentType,
          upsert: false,
        })

      if (uploadError) {
        return NextResponse.json({ error: 'Cover upload failed: ' + uploadError.message }, { status: 500 })
      }

      const { data: urlData } = supabaseAdmin.storage.from('covers').getPublicUrl(uniqueName)
      finalCoverUrl = urlData.publicUrl
    }

    // 插入小说
    const { data: novel, error: novelError } = await supabaseAdmin
      .from('novels')
      .insert({
        title,
        author,
        description: description || '',
        cover_url: finalCoverUrl,
        tags: tags ? tags.split(',').map((t: string) => t.trim()) : [],
        status: 'published',
      })
      .select('id')
      .single()

    if (novelError || !novel) {
      return NextResponse.json({ error: 'Failed to insert novel: ' + (novelError?.message || 'No data') }, { status: 500 })
    }

    // 拆分章节
    const chapters = splitChapters(content)
    if (chapters.length === 0) {
      return NextResponse.json({ error: 'No chapters found. Make sure content contains "Chapter 1", "Chapter 2", etc.' }, { status: 400 })
    }

    const payAfter = payAfterChapter || 3
    const chapterRows = chapters.map((ch, index) => ({
      novel_id: novel.id,
      title: ch.title,
      content: ch.body,
      order_num: index + 1,
      is_locked: index >= payAfter,
      coin_price: 10,
    }))

    const { error: chapterError } = await supabaseAdmin.from('chapters').insert(chapterRows)
    if (chapterError) {
      return NextResponse.json({ error: 'Failed to insert chapters: ' + chapterError.message }, { status: 500 })
    }

    return NextResponse.json({
      message: `Novel "${title}" uploaded with ${chapters.length} chapters!`,
    })

  } catch (err: any) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Internal server error: ' + (err.message || 'Unknown') }, { status: 500 })
  }
}

function splitChapters(text: string): { title: string; body: string }[] {
  const regex = /(Chapter\s+\d+[^\n]*)/gi
  const parts = text.split(regex).filter(s => s.trim().length > 0)

  const chapters: { title: string; body: string }[] = []
  for (let i = 0; i < parts.length; i += 2) {
    const title = parts[i].trim()
    const body = parts[i + 1]?.trim() || ''
    if (title && body) {
      chapters.push({ title, body })
    }
  }

  if (chapters.length === 0 && text.trim().length > 0) {
    chapters.push({ title: 'Chapter 1', body: text.trim() })
  }

  return chapters
}
