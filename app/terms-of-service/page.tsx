export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-background pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto prose prose-sm text-foreground">
        <h1 className="text-2xl font-serif text-primary">Terms of Service</h1>
        <p>Last updated: {new Date().getFullYear()}</p>
        <p>By using IvyNovel, you agree to these terms.</p>

        <h2>Use of the service</h2>
        <p>You may read free chapters, and subscribe for full access. You are responsible for maintaining the confidentiality of your account.</p>

        <h2>Intellectual property</h2>
        <p>All novel content is owned by the respective authors. You may not copy or redistribute content without permission.</p>

        <h2>Acceptable Use Policy</h2>
        <p>
          IvyNovel is a platform for original romance fiction. We allow stories with moderate sensual themes that are part of a broader narrative. However, we strictly prohibit content that is sexually explicit, pornographic, NSFW, or sexually suggestive. This includes text, images, and any marketing materials.
        </p>
        <p>
          We reserve the right to remove any content that violates this policy and to suspend or terminate accounts that repeatedly or seriously breach these rules.
        </p>
        <p>
          If you believe any content on our platform violates this policy, please contact support@ivynovel.com.
        </p>

        <h2>Termination</h2>
        <p>We reserve the right to suspend accounts that violate these terms.</p>
      </div>
    </main>
  )
}
