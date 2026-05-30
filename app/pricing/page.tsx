export default function PricingPage() {
  return (
    <main className="min-h-screen bg-background pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="font-serif text-5xl text-primary mb-6">Choose Your Reading Journey</h1>
        <p className="text-foreground/60 max-w-xl mx-auto mb-16">
          Unlock unlimited stories with a membership, or grab coins to read chapter by chapter.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['Weekly', 'Monthly', 'Yearly'].map((plan) => (
            <div key={plan} className="p-8 rounded-2xl bg-card border border-border hover:border-primary/40 transition shadow-lg">
              <h3 className="text-2xl font-serif text-primary mb-4">{plan}</h3>
              <p className="text-4xl font-bold text-foreground mb-2">
                {plan === 'Weekly' ? '$2.99' : plan === 'Monthly' ? '$9.99' : '$99.99'}
              </p>
              <p className="text-sm text-foreground/50 mb-6">billed {plan.toLowerCase()}</p>
              <button className="w-full py-3 bg-primary text-background rounded-xl font-medium hover:bg-primary/90 transition">
                Subscribe
              </button>
            </div>
          ))}
        </div>
        <div className="mt-16">
          <h2 className="text-2xl font-serif text-primary mb-6">Or Buy Coins</h2>
          <div className="flex justify-center gap-4 flex-wrap">
            {[{ coins: 100, price: '$0.99' }, { coins: 500, price: '$4.49' }, { coins: 1200, price: '$9.99' }].map((pack) => (
              <div key={pack.coins} className="p-6 rounded-xl bg-card border border-border w-40">
                <p className="text-3xl font-bold text-foreground">{pack.coins}</p>
                <p className="text-sm text-foreground/50 mb-3">coins</p>
                <p className="text-xl text-primary">{pack.price}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
