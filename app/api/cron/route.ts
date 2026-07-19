import { NextResponse } from 'next/server'

export async function GET() {
  // 这个简单的请求会触发 Supabase 客户端初始化，就算有活动
  return NextResponse.json({ ok: true, time: new Date().toISOString() })
}
