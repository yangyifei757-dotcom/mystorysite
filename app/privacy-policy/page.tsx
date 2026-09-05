export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-background pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto prose prose-sm text-foreground">
        <h1 className="text-2xl font-serif text-primary">Privacy Policy</h1>
        <p>Last updated: {new Date().getFullYear()}</p>
        <p>We value your privacy. This policy explains what data we collect and how we use it.</p>

        <h2>Information we collect</h2>
        <p>We collect email addresses, reading progress, and subscription status solely to provide and improve our services.</p>

        <h2>How we use information</h2>
        <p>Your data is used to personalize your reading experience and process payments. We do not sell or share your personal information with third parties.</p>

        <h2>Content policy</h2>
        <p>We do not host sexually explicit content. Any such content is prohibited and will be removed.</p>

        <h2>Contact</h2>
        <p>If you have questions, contact us at support@ivynovel.com.</p>
      </div>
    </main>
  )
}
