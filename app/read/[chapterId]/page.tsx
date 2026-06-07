import { supabase } from '@/lib/supabaseClient'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ReadPage({ params }: { params: { chapterId: string } }) {
  const { chapterId } = params

  // 获取章节和关联小说
  const { data: chapter } = await supabase
    .from('chapters')
    .select('*, novel:novel_id(*)')
    .eq('id', chapterId)
    .single()

  if (!chapter) {
    return <div className="text-white p-20 text-center">Chapter not found</div>
  }

  // 获取当前用户
  const { data: { user } } = await supabase.auth.getUser()

  // 如果是免费章节，直接可读
  if (!chapter.is_locked) {
    return <ReadContent chapter={chapter} />
  }

  // 付费章节：检查权限
  let canRead = false

  if (user) {
    // 检查是否已购买该章
    const { data: unlock } = await supabase
      .from('chapter_unlocks')
      .select('id')
      .eq('user_id', user.id)
      .eq('chapter_id', chapterId)
      .single()

    if (unlock) {
      canRead = true
    } else {
      // 检查是否有有效订阅
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('status, current_period_end')
        .eq('user_id', user.id)
        .single()

      if (sub && sub.status === 'active' && new Date(sub.current_period_end) > new Date()) {
        canRead = true
      }
    }
  }

  if (!canRead) {
    redirect('/pricing?message=Please subscribe or unlock this chapter')
  }

  return <ReadContent chapter={chapter} />
}

// 阅读器内容组件
function ReadContent({ chapter }: { chapter: any }) {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center px-4 py-16">
      <article className="max-w-2xl w-full">
        <Link href={`/novel/${chapter.novel_id}`} className="text-primary text-sm mb-8 inline-block hover:underline">
          ← Back to {chapter.novel?.title}
        </Link>
        <h1 className="font-serif text-3xl text-primary mb-8">
          Chapter {chapter.order_num}: {chapter.title}
        </h1>
        <div className="prose prose-invert prose-lg leading-relaxed text-foreground/90 font-serif">
          {chapter.content.split('\n').map((p: string, i: number) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        <div className="mt-12 flex justify-between">
          <button className="text-foreground/60 hover:text-primary transition">← Previous</button>
          <button className="text-foreground/60 hover:text-primary transition">Next →</button>
        </div>
      </article>
    </main>
  )
}
