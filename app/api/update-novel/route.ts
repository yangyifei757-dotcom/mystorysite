import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_PASSWORD = 'mynovel2026' // 与上传 API 保持一致

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id, password, title, author, description, coverUrl, tags, status, freeChapters } = body

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!id) {
      return NextResponse.json({ error: 'Novel ID is required' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (author !== undefined) updateData.author = author
    if (description !== undefined) updateData.description = description
    if (coverUrl !== undefined) updateData.cover_url = coverUrl
    if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : tags.split(',').map((t: string) => t.trim())
    if (status !== undefined) updateData.status = status
    if (freeChapters !== undefined) updateData.free_chapters = parseInt(freeChapters) || 0

    const { error } = await supabaseAdmin
      .from('novels')
      .update(updateData)
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error('Update novel error:', err)
    return NextResponse.json({ error: 'Internal server error: ' + err.message }, { status: 500 })
  }
}
