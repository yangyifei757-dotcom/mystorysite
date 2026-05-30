import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const UPLOAD_PASSWORD = "mynovel2026"

export async function POST(request: Request) {
  try {
    // Step 1: Parse form
    const formData = await request.formData()
    const title = formData.get('title') as string
    const content = formData.get('content') as string
    const password = formData.get('password') as string
    const description = (formData.get('description') as string) || ''
    const tags = (formData.get('tags') as string) || ''
    const payAfterChapter = parseInt((formData.get('payAfterChapter') as string) || '3')
    const coverFile = formData.get('cover') as File | null

    // Step 2: Check password
    if (password !== UPLOAD_PASSWORD) {
      return NextResponse.json({ step: 'password_check', error: 'Invalid password' }, { status: 401 })
    }

    // Step 3: Check environment
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ step: 'env_check', error: 'Missing env vars' }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    // Step 4: Upload cover if present
    let coverUrl = ''
    if (coverFile && coverFile.size > 0) {
      const fileExt = coverFile.name.split('.').pop() || 'jpg'
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`
      const { error: uploadError } = await supabaseAdmin.storage
        .from('covers')
        .upload(fileName, coverFile, { contentType: coverFile.type, upsert: false })
      if (uploadError) {
        return NextResponse.json({ step: 'cover_upload', error: uploadError.message }, { status: 500 })
      }
      const { data: urlData } = supabaseAdmin.storage.from('covers').getPublicUrl(fileName)
      coverUrl = urlData.publicUrl
    }

    // Step 5: Insert novel
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
      return NextResponse.json({ step: 'novel_insert', error: novelError?.message || 'No data' }, { status: 500 })
    }

    // Step 6: Split chapters
    const chapters = splitTextIntoChapters(content)
    if (chapters.length === 0) {
      return NextResponse.json({ step: 'split_chapters', error: 'No chapters found' }, { status: 400 })
    }

    // Step 7: Insert chapters
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
      return NextResponse.json({ step: 'chapters_insert', error: chapterError.message }, { status: 500 })
    }

    // Success
    return NextResponse.json({
      step: 'all_done',
      message: `Novel "${title}" uploaded with ${chapters.length} chapters!`,
      novelId: novel.id,
    })

  } catch (err: any) {
    console.error('Unhandled error:', err)
    return NextResponse.json({ step: 'unhandled', error: err.message || 'Unknown' }, { status: 500 })
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
