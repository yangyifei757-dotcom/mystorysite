'use client'

import { Suspense, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'

function SearchResults() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!query.trim()) return
    setLoading(true)

    const fetchResults = async () => {
      const { data, error } = await supabase
        .from('novels')
        .select('*')
        .or(`title.ilike.%${query}%,author.ilike.%${query}%`)
        .in('status', ['published', 'restricted'])
        .order('created_at', { ascending: false })
        .limit(20)

      if (!error && data) setResults(data)
      setLoading(false)
    }

    fetchResults()
  }, [query])

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-serif text-foreground mb-6">
        {query ? `Results for "${query}"` : 'Search'}
      </h1>

      {loading ? (
        <p className="text-foreground/40">Searching...</p>
      ) : results.length === 0 ? (
        <p className="text-foreground/40">No novels found. Try a different keyword.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {results.map((novel: any) => (
            <Link key={novel.id} href={`/novel/${novel.id}`} className="group flex flex-col">
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-card group-hover:shadow-card-hover transition-all">
                {novel.cover_url ? (
                  <Image
                    src={novel.cover_url}
                    alt={novel.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                    sizes="(max-width: 640px) 50vw, 25vw"
                  />
                ) : (
                  <div className="h-full w-full bg-accent flex items-center justify-center text-4xl text-primary font-serif">{novel.title?.charAt(0)}</div>
                )}
              </div>
              <div className="mt-2 px-1">
                <h3 className="font-serif text-sm font-medium line-clamp-1">{novel.title}</h3>
                <p className="text-xs text-foreground/50">{novel.author}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <main className="min-h-screen bg-background pt-24 pb-20 px-4">
      <Suspense fallback={<div className="text-foreground/40">Loading search...</div>}>
        <SearchResults />
      </Suspense>
    </main>
  )
}
