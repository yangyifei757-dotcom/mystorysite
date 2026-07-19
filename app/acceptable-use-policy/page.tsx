import Link from 'next/link'

export default function AcceptableUsePolicyPage() {
  return (
    <main className="min-h-screen bg-background pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto prose prose-sm text-foreground">
        <h1 className="text-2xl font-serif text-primary">Acceptable Use Policy</h1>
        <p>Last updated: July 2026</p>

        <h2>1. Purpose</h2>
        <p>
          This Acceptable Use Policy outlines the rules and guidelines for using IvyNovel's platform.
          By accessing or using IvyNovel, you agree to comply with this policy.
        </p>

        <h2>2. Prohibited Content</h2>
        <p>
          Users and authors are strictly prohibited from creating, uploading, publishing,
          or distributing any content that falls into the following categories:
        </p>
        <ul>
          <li>Content whose sole or primary purpose is sexual gratification</li>
          <li>Explicit or pornographic material</li>
          <li>Sexually suggestive content that lacks artistic or narrative merit</li>
          <li>Content that promotes or depicts illegal activities</li>
          <li>Content that infringes on the intellectual property rights of others</li>
          <li>Content that violates any applicable laws or regulations</li>
        </ul>

        <h2>3. Content Standards</h2>
        <p>
          Romance fiction with sensual or intimate scenes is permitted as part of
          legitimate storytelling, provided such scenes serve the broader narrative
          and are not the primary focus of the work.
        </p>

        <h2>4. Marketing and Promotion</h2>
        <p>
          Marketing materials, promotional copy, and public-facing content may not
          use terms such as "NSFW," "18+," "uncensored," "no filter," or similar
          labels that suggest explicit content.
        </p>

        <h2>5. Enforcement</h2>
        <p>
          IvyNovel reserves the right to remove any content that violates this policy
          and to suspend or terminate accounts that repeatedly breach these rules.
        </p>

        <h2>6. Contact</h2>
        <p>
          If you have questions about this policy, please contact us at{' '}
          yangyifei757@gmail.com.
        </p>
      </div>
    </main>
  )
}
