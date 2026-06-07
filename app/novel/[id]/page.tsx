import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export default async function NovelPage({ params }: { params: { id: string } }) {
  const { id } = params
  const { data: novel } = await supabase.from('novels').select('*').eq('id', id).single()
  const { data: chapters } = await supabase
    .from('chapters')
    .select('*')
    .eq('novel_id', id)
    .order('order_num', { ascending: true })

  if (!novel) return <div className="text-white p-20 text-center">Novel not found</div>

  // 获取当前登录用户
  const { data: { user } } = await supabase.auth.getUser()
  let hasActiveSubscription = false

  if (user) {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('status, current_period_end')
      .eq('user_id', user.id)
      .single()

    if (sub && sub.status === 'active' && new Date(sub.current_period_end) > new Date()) {
      hasActiveSubscription = true
    }
  }

  return (
    <main className="min-h-screen bg-background pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-10">
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
            {chapters?.map((chapter: any) => {
              const isFree = !chapter.is_locked
              const canAccess = isFree || hasActiveSubscription

              return (
                <div key={chapter.id} className="flex justify-between items-center p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition">
                  <span className="text-foreground/80">
                    Chapter {chapter.order_num}: {chapter.title}
                  </span>
                  {canAccess ? (
                    <Link href={`/read/${chapter.id}`} className="text-sm bg-primary text-background px-4 py-1 rounded-full hover:bg-primary/90 transition">
                      Read
                    </Link>
                  ) : (
                    <Link href="/pricing" className="text-sm bg-primary/20 text-primary px-3 py-1 rounded-full">
                      🔒 Unlock with 10 coins
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
