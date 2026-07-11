import Link from 'next/link'

export default function NotFoundPage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center space-y-6">
        <h1 className="text-6xl font-serif text-primary">404</h1>
        <p className="text-2xl font-serif text-foreground">Page Not Found</p>
        <p className="text-foreground/50">The story you're looking for doesn't exist… yet.</p>
        <Link href="/" className="inline-block mt-4 px-6 py-3 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary/90 transition">
          Back to Discovery
        </Link>
      </div>
    </main>
  )
}
