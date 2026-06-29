import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Catholic Bishops of the United States',
  description: 'Browse and filter every active, retired, and historical Catholic bishop connected to the United States. Filter by rank, rite, diocese, religious order, and appointment date.',
  alternates: { canonical: 'https://hierarchy.directory/bishops' },
  openGraph: {
    title: 'Catholic Bishops of the United States | Hierarchy.Directory',
    description: 'Browse and filter every active, retired, and historical Catholic bishop connected to the United States.',
    url: 'https://hierarchy.directory/bishops',
  },
}

export default function BishopsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
