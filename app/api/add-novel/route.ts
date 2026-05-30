import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const UPLOAD_PASSWORD = "mynovel2026" // 你可以改成自己的密码

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const tags = formData.get('tags') as string
    const payAfterChapter = parseInt(formData.get('payAfterChapter') as string) || 3
    const content = formData.get('content') as string
    const password = formData.get('password') as string
    const coverFile = formData.get('cover') as File | null

    // 1. 密码检查
    if (password !== UPLOAD_PASSWORD) {
      return NextResponse.json({ error: 'Invalid password.' }, { status: 401 })
    }

    // 检查必要环境变量
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Missing Supabase environment variables.' }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    // 2. 处理封面上传（可选）
    let coverUrl = ''
    if (coverFile && coverFile.size > 0) {
      const fileExt = coverFile.name.split('.').pop() || 'jpg'
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`

      const { error: uploadError } = await supabaseAdmin.storage
        .from('covers')
        .upload(fileName, coverFile, {
          contentType: coverFile.type,
          upsert: false,
        })

      if (uploadError) {
        return NextResponse.json({ error: 'Cover upload failed: ' + uploadError.message }, { status: 500 })
      }

      const { data: urlData } = supabaseAdmin.storage.from('covers').getPublicUrl(fileName)
      coverUrl = urlData.publicUrl
    }

    // 3. 插入小说记录
    const { data: novel, error: novelError } = await supabaseAdmin
      .from('novels')
      .insert({
        title,
        author: 'Unknown',
        description,
        cover_url: coverUrl,
        tags: tags ? tags.split(',').map((t: string) => t.trim()) : [],
        status: 'ongoing',
      })
      .select('id')
      .single()

    if (novelError || !novel) {
      return NextResponse.json({ error: 'Novel insert failed: ' + (novelError?.message || 'No data returned') }, { status: 500 })
    }

    // 4. 拆分章节
    const chapters = splitTextIntoChapters(content)
    if (chapters.length === 0) {
      return NextResponse.json({ error: 'No chapters found in content.' }, { status: 400 })
    }

    // 5. 批量插入章节
    const chapterInserts = chapters.map((ch, index) => ({
      novel_id: novel.id,
      title: ch.title,
      content: ch.body,
      order_num: index + 1,
      is_locked: index >= payAfterChapter,
      coin_price: 10,
    }))

    const { error: chapterError } = await supabaseAdmin.from('chapters').insert(chapterInserts)
    if (chapterError) {
      return NextResponse.json({ error: 'Chapters insert failed: ' + chapterError.message }, { status: 500 })
    }

    return NextResponse.json({
      message: `Novel "${title}" uploaded with ${chapters.length} chapters!`,
      novelId: novel.id,
    })

  } catch (err: any) {
    // 捕获一切未预料的错误
    console.error('Add novel error:', err)
    return NextResponse.json({ error: 'Internal server error: ' + (err.message || 'Unknown') }, { status: 500 })
  }
}

function splitTextIntoChapters(text: string) {
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
