export default function PricingPage() {
  const plans = [
    {
      name: 'Monthly',
      dailyPrice: '0.33',        // 基于原价 $9.99 折算
      monthlyPrice: '9.99',
      firstMonthPrice: '6.99',   // 首月优惠价，单独展示
      interval: 'month',
      description: 'Then $9.99/month after first month',
      paymentLink: 'https://www.creem.io/payment/prod_4ZI6kyf8A9qbLyDyYYb6Tx?offer=QZO318UTSZ',
      popular: true,
    },
    {
      name: 'Yearly',
      dailyPrice: '0.27',        // 基于 $99.99 折算，最低日费
      yearlyPrice: '99.99',
      interval: 'year',
      description: 'Billed annually — best value',
      paymentLink: 'https://www.creem.io/payment/prod_1vKDDSUKmfkSefSmmhlHa',
    },
  ]

  return (
    <main className="min-h-screen bg-background pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="font-serif text-5xl text-primary mb-6">Choose Your Reading Journey</h1>
        <p className="text-foreground/60 max-w-xl mx-auto mb-16">
          Unlimited romance stories. Less than a cup of coffee.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-lg mx-auto">
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

              {/* 日费突出显示 */}
              <p className="text-5xl font-bold text-foreground mb-1">
                ${plan.dailyPrice}
                <span className="text-xl text-foreground/50 font-normal">/day</span>
              </p>

              {/* 首月优惠标签（仅月订阅有） */}
              {plan.firstMonthPrice && (
                <p className="text-sm text-primary font-medium mt-2">
                  First month only ${plan.firstMonthPrice}
                </p>
              )}

              {/* 说明文字 */}
              <p className="text-sm text-foreground/50 mt-4 mb-6">{plan.description}</p>

              <a
                href={plan.paymentLink}
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
