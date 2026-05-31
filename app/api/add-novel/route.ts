import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const UPLOAD_PASSWORD = 'mynovel2026' // 改成你自己的密码

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const title = formData.get('title') as string
    const author = formData.get('author') as string
    const description = formData.get('description') as string
    const tags = formData.get('tags') as string
    const content = formData.get('content') as string
    const payAfterChapter = parseInt((formData.get('payAfterChapter') as string) || '3')
    const password = formData.get('password') as string
    const isPublished = (formData.get('isPublished') as string) === 'true'
    const coverFile = formData.get('cover') as File | null
    const coverUrlInput = formData.get('coverUrl') as string | null

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

    // 处理封面：优先文件上传，否则用输入的URL，最后用随机图
    let finalCoverUrl = ''
    if (coverFile && coverFile.size > 0) {
      const fileExt = coverFile.name.split('.').pop() || 'jpg'
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`
      const { error: uploadError } = await supabaseAdmin.storage
        .from('covers')
        .upload(fileName, coverFile, { contentType: coverFile.type, upsert: false })
      if (uploadError) {
        return NextResponse.json({ error: 'Cover upload failed: ' + uploadError.message }, { status: 500 })
      }
      const { data: urlData } = supabaseAdmin.storage.from('covers').getPublicUrl(fileName)
      finalCoverUrl = urlData.publicUrl
    } else if (coverUrlInput?.trim()) {
      finalCoverUrl = coverUrlInput.trim()
    } else {
      finalCoverUrl = 'https://picsum.photos/400/600'
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
        status: 'ongoing',
        is_published: isPublished,
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
      message: `✅ "${title}" uploaded with ${chapters.length} chapters! ${isPublished ? 'Now live.' : 'Saved as draft.'}`,
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
