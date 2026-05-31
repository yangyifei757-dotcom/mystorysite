import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const UPLOAD_PASSWORD = 'mynovel2026' // 你可以改成自己的密码

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, author, description, coverUrl, tags, content, payAfterChapter, password } = body

    // 1. 密码验证
    if (password !== UPLOAD_PASSWORD) {
      return NextResponse.json({ error: 'Incorrect upload password.' }, { status: 401 })
    }

    // 2. 基本字段验证
    if (!title || !author || !content) {
      return NextResponse.json({ error: 'Title, author, and content are required.' }, { status: 400 })
    }

    // 3. 初始化 Supabase 管理员客户端
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Server configuration error: Missing Supabase keys.' }, { status: 500 })
    }
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    // 4. 处理封面 URL（如果没填，用随机图）
    const finalCoverUrl = coverUrl || 'https://picsum.photos/400/600'

    // 5. 插入小说，默认状态设为 published
    const { data: novel, error: novelError } = await supabaseAdmin
      .from('novels')
      .insert({
        title,
        author,
        description: description || '',
        cover_url: finalCoverUrl,
        tags: tags ? tags.split(',').map((t: string) => t.trim()) : [],
        status: 'published', // 改为了 published
      })
      .select('id')
      .single()

    if (novelError || !novel) {
      return NextResponse.json({ error: 'Failed to insert novel: ' + (novelError?.message || 'No data') }, { status: 500 })
    }

    // 6. 拆分章节（按 "Chapter X" 格式）
    const chapters = splitChapters(content)
    if (chapters.length === 0) {
      return NextResponse.json({ error: 'No chapters found. Make sure content contains "Chapter 1", "Chapter 2", etc.' }, { status: 400 })
    }

    // 7. 批量插入章节
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
      message: `✅ Success! "${title}" uploaded with ${chapters.length} chapters.`,
    })

  } catch (err: any) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Internal server error: ' + (err.message || 'Unknown') }, { status: 500 })
  }
}

// 简单的章节拆分函数
function splitChapters(text: string): { title: string; body: string }[] {
  // 按 "Chapter 1", "Chapter 2" ... 拆分
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

  // 如果没拆出任何章节，把全文当第一章
  if (chapters.length === 0 && text.trim().length > 0) {
    chapters.push({ title: 'Chapter 1', body: text.trim() })
  }

  return chapters
}
