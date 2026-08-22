import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_PASSWORD = 'mynovel2026'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      id, password, title, author, description,
      coverUrl, coverBase64, coverFileName, coverFileType,
      tags, status, freeChapters
    } = body

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

    let finalCoverUrl = coverUrl || ''

    if (coverBase64 && coverFileName) {
      const base64Data = coverBase64.split(',')[1]
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

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (author !== undefined) updateData.author = author
    if (description !== undefined) updateData.description = description
    if (finalCoverUrl) updateData.cover_url = finalCoverUrl
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
