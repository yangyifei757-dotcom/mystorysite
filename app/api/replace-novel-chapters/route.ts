import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_PASSWORD = 'mynovel2026'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { novelId, password, content, splitBy } = body

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!novelId || !content) {
      return NextResponse.json({ error: 'Novel ID and content are required' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    // 1. 先获取小说的 free_chapters 值，用于新章节的 is_locked 判断
    const { data: novel } = await supabaseAdmin
      .from('novels')
      .select('free_chapters')
      .eq('id', novelId)
      .single()

    const freeChapters = novel?.free_chapters ?? 3
    const payAfter = freeChapters >= 999 ? 9999 : freeChapters

    // 2. 删除旧章节
    const { error: deleteError } = await supabaseAdmin
      .from('chapters')
      .delete()
      .eq('novel_id', novelId)

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete old chapters: ' + deleteError.message }, { status: 500 })
    }

    // 3. 拆分新内容
    const chapters = splitChapters(content, splitBy || 'Chapter')
    if (chapters.length === 0) {
      return NextResponse.json({ error: 'No chapters found in content' }, { status: 400 })
    }

    // 4. 批量插入新章节
    const chapterRows = chapters.map((ch, index) => ({
      novel_id: novelId,
      title: ch.title,
      content: ch.body,
      order_num: index + 1,
      is_locked: index >= payAfter,
      coin_price: 10,
    }))

    const { error: insertError } = await supabaseAdmin.from('chapters').insert(chapterRows)
    if (insertError) {
      return NextResponse.json({ error: 'Failed to insert new chapters: ' + insertError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Replaced with ${chapters.length} new chapters.`,
    })
  } catch (err: any) {
    console.error('Replace chapters error:', err)
    return NextResponse.json({ error: 'Internal server error: ' + err.message }, { status: 500 })
  }
}

function splitChapters(text: string, splitKey: string): { title: string; body: string }[] {
  const escapedKey = splitKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escapedKey}\\s+\\d+[^\\n]*)`, 'gi')
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
