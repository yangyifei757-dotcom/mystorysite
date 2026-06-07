'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function NovelPage() {
  const params = useParams()
  const id = params.id as string

  const [novel, setNovel] = useState<any>(null)
  const [chapters, setChapters] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [hasSubscription, setHasSubscription] = useState(false)
  const [loading, setLoading] = useState(true)
  const [debugInfo, setDebugInfo] = useState<any>({})

  useEffect(() => {
    const fetchData = async () => {
      // 获取小说信息
      const { data: novelData } = await supabase.from('novels').select('*').eq('id', id).single()
      const { data: chaptersData } = await supabase.from('chapters').select('*').eq('novel_id', id).order('order_num', { ascending: true })
      setNovel(novelData)
      setChapters(chaptersData || [])

      // 获取当前登录用户
      const { data: { session } } = await supabase.auth.getSession()
      const currentUser = session?.user || null
      setUser(currentUser)

      let subResult = null
      let subError = null
      let apiResult = null
      let apiError = null

      if (currentUser) {
        // 方式1：通过 Supabase 客户端查询
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', currentUser.id)
          .single()
        subResult = data
        subError = error

        // 方式2：直接用 fetch 调用 REST API（使用 anon key）
        try {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dajwjltopgbbzdavvoac.supabase.co'
          const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'
          const res = await fetch(
            `${supabaseUrl}/rest/v1/subscriptions?user_id=eq.${currentUser.id}&select=*`,
            {
              headers: {
                'apikey': anonKey,
                'Authorization': `Bearer ${anonKey}`,
                'Content-Type': 'application/json',
              },
            }
          )
          if (res.ok) {
            apiResult = await res.json()
          } else {
            apiError = await res.text()
          }
        } catch (fetchErr: any) {
          apiError = fetchErr.message
        }

        // 判断订阅是否有效
        if (subResult && subResult.status === 'active' && new Date(subResult.current_period_end) > new Date()) {
          setHasSubscription(true)
        } else if (apiResult && apiResult.length > 0) {
          // 客户端查不到但 API 查到了
          const apiSub = apiResult[0]
          if (apiSub.status === 'active' && new Date(apiSub.current_period_end) > new Date()) {
            setHasSubscription(true)
          }
        }
      }

      setDebugInfo({
        userId: currentUser?.id,
        clientResult: subResult,
        clientError: subError?.message,
        apiResult,
        apiError,
        apiUrl: currentUser ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/subscriptions?user_id=eq.${currentUser.id}` : '',
      })
      setLoading(false)
    }

    fetchData()
  }, [id])

  if (loading) return <div className="text-white p-20 text-center">Loading...</div>
  if (!novel) return <div className="text-white p-20 text-center">Novel not found</div>

  return (
    <main className="min-h-screen bg-background pt-24 pb-16 px-4">
      {/* 调试信息（展示所有查询细节） */}
      <div className="max-w-4xl mx-auto mb-4 p-4 bg-gray-800 rounded text-xs text-gray-300 space-y-1">
        <div><strong>User ID:</strong> {debugInfo.userId || 'null'}</div>
        <div><strong>Client result:</strong> {JSON.stringify(debugInfo.clientResult)}</div>
        <div><strong>Client error:</strong> {debugInfo.clientError || 'none'}</div>
        <div><strong>API result:</strong> {JSON.stringify(debugInfo.apiResult)}</div>
        <div><strong>API error:</strong> {debugInfo.apiError || 'none'}</div>
        <div><strong>Subscription active:</strong> {hasSubscription ? 'Yes ✅' : 'No ❌'}</div>
      </div>

      {/* 原有内容 */}
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-10">
        {/* 封面 */}
        <div className="w-full md:w-1/3">
          <div className="rounded-2xl overflow-hidden shadow-2xl aspect-[3/4] bg-card">
            {novel.cover_url && (
              <img src={novel.cover_url} alt={novel.title} className="h-full w-full object-cover" />
            )}
          </div>
        </div>
        <div className="flex-1">
          <h1 className="font-serif text-4xl text-primary mb-2">{novel.title}</h1>
          <p className="text-lg text-foreground/70 mb-4">by {novel.author}</p>
          <p className="text-foreground/80 leading-relaxed mb-8">{novel.description}</p>

          <h2 className="text-2xl font-serif mb-4">Chapters</h2>
          <div className="space-y-3">
            {chapters.map((chapter: any) => {
              const isFree = !chapter.is_locked
              const canAccess = isFree || hasSubscription

              return (
                <div key={chapter.id} className="flex justify-between items-center p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition">
                  <div className="flex items-center gap-2">
                    <span className="text-foreground/80">
                      Chapter {chapter.order_num}: {chapter.title}
                    </span>
                    {!hasSubscription && (
                      isFree ? (
                        <span className="text-xs bg-green-900/40 text-green-300 px-2 py-0.5 rounded font-medium">Free</span>
                      ) : (
                        <span className="text-gray-400 text-lg">🔒</span>
                      )
                    )}
                  </div>
                  {canAccess ? (
                    <Link href={`/read/${chapter.id}`} className="text-sm bg-primary text-background px-4 py-1 rounded-full hover:bg-primary/90 transition">
                      Read
                    </Link>
                  ) : (
                    <Link href="/pricing" className="text-sm bg-primary/20 text-primary px-3 py-1 rounded-full hover:bg-primary/30 transition">
                      🔒
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </main>
  )
}
