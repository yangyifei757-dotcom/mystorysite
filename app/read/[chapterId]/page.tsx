import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export default async function ReadPage({ params }: { params: { chapterId: string } }) {
  const { chapterId } = params
  const { data: chapter } = await supabase.from('chapters').select('*, novel:novel_id(*)').eq('id', chapterId).single()
  if (!chapter) return <div className="text-white p-20 text-center">Chapter not found</div>

  return (
    <main className="min-h-screen bg-background flex flex-col items-center px-4 py-16">
      <article className="max-w-2xl w-full">
        <Link href={`/novel/${chapter.novel_id}`} className="text-primary text-sm mb-8 inline-block hover:underline">
          ← Back to {chapter.novel?.title}
        </Link>
        <h1 className="font-serif text-3xl text-primary mb-8">Chapter {chapter.order_num}: {chapter.title}</h1>
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
