import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contact Hierarchy.Directory with data corrections, portrait submissions, or general inquiries. Report missing or incorrect records here.',
  alternates: { canonical: 'https://hierarchy.directory/contact' },
  openGraph: {
    title: 'Contact | Hierarchy.Directory',
    description: 'Contact Hierarchy.Directory with data corrections, portrait submissions, or general inquiries.',
    url: 'https://hierarchy.directory/contact',
  },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
