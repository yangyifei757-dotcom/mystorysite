import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

export default async function Home() {
  let novels: any[] = []
  let error = null

  try {
    const { data, error: dbError } = await supabase.from('novels').select('*').limit(6)
      .from('novels')
      .select('*')
      .eq('status', 'published')
      .limit(6)
    novels = data || []
    error = dbError
  } catch (e) {
    error = e
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="fixed top-0 w-full z-50 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-serif text-primary tracking-wide">Whisper Tales</h1>
          <nav className="flex gap-4 text-sm text-foreground/80">
            <Link href="/pricing" className="hover:text-primary transition">Pricing</Link>
            <Link href="/login" className="hover:text-primary transition">Sign In</Link>
          </nav>
        </div>
      </header>

      <section className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-serif text-center mb-4 leading-tight">
            Stories that <span className="text-primary">stay with you</span>
          </h2>
          <p className="text-center text-foreground/60 max-w-2xl mx-auto mb-16">
            Hand-picked tales of romance, fantasy, and mystery. Unlock one chapter at a time—or become a member for unlimited reading.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {novels.length === 0 ? (
              <p className="text-foreground/40 text-center col-span-full">No novels available yet. Check back soon!</p>
            ) : (
              novels.map((novel: any) => (
                <Link key={novel.id} href={`/novel/${novel.id}`} className="group">
                  <div className="relative overflow-hidden rounded-2xl bg-card hover:ring-2 hover:ring-primary/30 transition-all duration-300 shadow-lg">
                    <div className="aspect-[3/4] bg-gradient-to-b from-primary/10 to-card">
                      {novel.cover_url ? (
                        <img
                          src={novel.cover_url}
                          alt={novel.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-foreground/20 text-6xl font-serif">
                          {novel.title?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/80 to-transparent">
                      <h3 className="font-serif text-2xl text-white mb-1">{novel.title}</h3>
                      <p className="text-sm text-gray-300">by {novel.author}</p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
