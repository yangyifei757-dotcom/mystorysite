export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-background pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto prose prose-sm text-foreground">
        <h1 className="text-2xl font-serif text-primary">Refund Policy</h1>
        <p>Last updated: {new Date().getFullYear()}</p>
        <p>Subscriptions can be cancelled at any time. You will continue to have access until the end of your billing period.</p>
        <p>We do not offer partial refunds for unused time. If you experience a technical issue, please contact yangyifei757@gmail.com and we’ll make it right.</p>
      </div>
    </main>
  )
}
