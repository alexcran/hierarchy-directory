import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Build a Bishop Directory',
  description: 'Select Catholic bishops, configure the layout, and download a printable PDF directory for visits, briefings, or parish reference.',
  alternates: { canonical: 'https://hierarchy.directory/build-directory' },
  openGraph: {
    title: 'Build a Bishop Directory | Hierarchy.Directory',
    description: 'Select Catholic bishops, configure the layout, and download a printable PDF directory for visits, briefings, or parish reference.',
    url: 'https://hierarchy.directory/build-directory',
  },
}

export default function BuildDirectoryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
