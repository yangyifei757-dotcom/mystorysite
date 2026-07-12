export default function PricingPage() {
  const plans = [
    {
      name: 'Weekly',
      price: '$2.99',
      interval: 'week',
      description: 'Billed weekly',
      stripeLink: 'https://buy.stripe.com/test_https://buy.stripe.com/test_dRmdR9dgl7gve3GftYdwc00',
    },
    {
      name: 'Monthly',
      price: '$4.99',
      interval: 'month',
      description: 'First month, then $9.99/month',
      stripeLink: 'https://buy.stripe.com/test_https://buy.stripe.com/test_cNiaEX2BHdETf7K95Adwc01',
      popular: true,
    },
    {
      name: 'Yearly',
      price: '$99.99',
      interval: 'year',
      description: 'Billed annually',
      stripeLink: 'https://buy.stripe.com/test_https://buy.stripe.com/test_8x23cv6RX58ngbOftYdwc02',
    },
  ]

  return (
    <main className="min-h-screen bg-background pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="font-serif text-5xl text-primary mb-6">Choose Your Reading Journey</h1>
        <p className="text-foreground/60 max-w-xl mx-auto mb-16">
          Unlock unlimited stories with a membership. Start with a discounted first month.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`p-8 rounded-2xl bg-card border hover:border-primary/40 transition shadow-lg ${
                plan.popular ? 'border-primary ring-1 ring-primary' : 'border-border'
              }`}
            >
              {plan.popular && (
                <span className="text-xs bg-primary text-background px-2 py-1 rounded-full uppercase tracking-wider">
                  Popular
                </span>
              )}
              <h3 className="text-2xl font-serif text-primary mt-4 mb-4">{plan.name}</h3>
              <p className="text-4xl font-bold text-foreground mb-2">{plan.price}</p>
              <p className="text-sm text-foreground/50 mb-6">{plan.description}</p>
              <a
                href={plan.stripeLink}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3 bg-primary text-background rounded-xl font-medium hover:bg-primary/90 transition text-center"
              >
                Subscribe
              </a>
            </div>
          ))}
        </div>

        <p className="mt-16 text-foreground/40 text-sm">
          After payment, your account will be upgraded shortly. If you have any issues, please contact support.
        </p>
      </div>
    </main>
  )
}
