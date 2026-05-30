import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const UPLOAD_PASSWORD = "mynovel2026" // 改成你的密码，表单里就填这个

export async function POST(request: Request) {
  const formData = await request.formData()
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const tags = formData.get('tags') as string
  const payAfterChapter = parseInt(formData.get('payAfterChapter') as string) || 3
  const content = formData.get('content') as string
  const password = formData.get('password') as string
  const coverFile = formData.get('cover') as File

  if (password !== UPLOAD_PASSWORD) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }

  // 用 service_role key 初始化 Supabase 管理员客户端
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. 上传封面到 Storage
  let coverUrl = ''
  if (coverFile && coverFile.size > 0) {
    const fileExt = coverFile.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const { error: uploadError } = await supabaseAdmin.storage
      .from('covers')
      .upload(fileName, coverFile, {
        contentType: coverFile.type,
        upsert: false,
      })
    if (uploadError) {
      return NextResponse.json({ error: 'Cover upload failed: ' + uploadError.message }, { status: 500 })
    }
    // 获取公开 URL
    const { data: urlData } = supabaseAdmin.storage.from('covers').getPublicUrl(fileName)
    coverUrl = urlData.publicUrl
  }

  // 2. 插入小说记录
  const { data: novel, error: novelError } = await supabaseAdmin
    .from('novels')
    .insert({
      title,
      author: 'Unknown', // 可后续增加作者字段，这里先固定
      description,
      cover_url: coverUrl,
      tags: tags ? tags.split(',').map((t: string) => t.trim()) : [],
      status: 'ongoing',
    })
    .select('id')
    .single()

  if (novelError || !novel) {
    return NextResponse.json({ error: 'Failed to create novel: ' + novelError?.message }, { status: 500 })
  }

  // 3. 拆分章节
  const chapters = splitTextIntoChapters(content)

  // 4. 批量插入章节，根据 payAfterChapter 设置 is_locked
  const chapterInserts = chapters.map((ch, index) => ({
    novel_id: novel.id,
    title: ch.title,
    content: ch.body,
    order_num: index + 1,
    is_locked: index >= payAfterChapter, // 前 payAfterChapter 章免费
    coin_price: 10,
  }))

  const { error: chapterError } = await supabaseAdmin.from('chapters').insert(chapterInserts)
  if (chapterError) {
    return NextResponse.json({ error: 'Chapters insert failed: ' + chapterError.message }, { status: 500 })
  }

  return NextResponse.json({ message: `Novel "${title}" uploaded with ${chapters.length} chapters!` })
}

function splitTextIntoChapters(text: string) {
  // 按 "Chapter X" 或 "CHAPTER X" 拆分
  const regex = /(Chapter\s+\d+)/gi
  const parts = text.split(regex).filter(Boolean)
  const chapters: { title: string; body: string }[] = []

  for (let i = 0; i < parts.length; i += 2) {
    const title = parts[i].trim()
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
