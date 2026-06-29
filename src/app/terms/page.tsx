import type { Metadata } from 'next'
import { MarkdownLegalPage } from '@/components/legal/MarkdownLegalPage'

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: 'Terms of Use for Hierarchy.Directory. Factual data is available under CC0 (public domain). Portraits are used for informational purposes and are the property of their respective copyright owners.',
  alternates: { canonical: '/terms' },
}

export default function TermsPage() {
  return <MarkdownLegalPage fileName="terms-of-use.md" />
}
