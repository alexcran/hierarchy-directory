import type { Metadata } from 'next'
import { MarkdownLegalPage } from '@/components/legal/MarkdownLegalPage'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for Hierarchy.Directory. We use minimal analytics and do not sell or share personal data.',
  alternates: { canonical: '/privacy' },
}

export default function PrivacyPage() {
  return <MarkdownLegalPage fileName="privacy-policy.md" />
}
