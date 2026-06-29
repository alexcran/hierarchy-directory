import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import localFont from 'next/font/local'
import { SelectionProvider } from '@/contexts/SelectionContext'
import { BreadcrumbProvider } from '@/contexts/BreadcrumbContext'
import { TopBar } from '@/components/layout/TopBar'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { SelectionBar } from '@/components/layout/SelectionBar'
import { Footer } from '@/components/layout/Footer'
import { NavigationProgress } from '@/components/layout/NavigationProgress'
import './globals.css'

const cormorantGaramond = localFont({
  src: [
    { path: '../../public/fonts/CormorantGaramond-Regular.ttf', weight: '400', style: 'normal' },
    { path: '../../public/fonts/CormorantGaramond-SemiBold.ttf', weight: '600', style: 'normal' },
    { path: '../../public/fonts/CormorantGaramond-Bold.ttf', weight: '700', style: 'normal' },
    { path: '../../public/fonts/CormorantGaramond-Italic.ttf', weight: '400', style: 'italic' },
    { path: '../../public/fonts/CormorantGaramond-SemiBoldItalic.ttf', weight: '600', style: 'italic' },
  ],
  variable: '--font-display',
  display: 'swap',
})

const publicSans = localFont({
  src: [
    { path: '../../public/fonts/PublicSans-Regular.ttf', weight: '400', style: 'normal' },
    { path: '../../public/fonts/PublicSans-SemiBold.ttf', weight: '600', style: 'normal' },
    { path: '../../public/fonts/PublicSans-Bold.ttf', weight: '700', style: 'normal' },
    { path: '../../public/fonts/PublicSans-Italic.ttf', weight: '400', style: 'italic' },
  ],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Hierarchy.Directory — A Visual Directory of the Hierarchy of the Catholic Church',
    template: '%s | Hierarchy.Directory',
  },
  description: 'A visual directory of the hierarchy of the Catholic Church. Currently featuring the bishops and dioceses of the United States.',
  icons: {
    icon: '/favicon.png',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    siteName: 'Hierarchy.Directory',
    title: 'Hierarchy.Directory — A Visual Directory of the Hierarchy of the Catholic Church',
    description: 'A visual directory of the hierarchy of the Catholic Church. Currently featuring the bishops and dioceses of the United States.',
    images: [{ url: '/hierarchy-directory-created-with-logo.png', alt: 'Hierarchy.Directory' }],
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${cormorantGaramond.variable} ${publicSans.variable} font-body bg-background text-text-primary antialiased`}
      >
        <BreadcrumbProvider>
          <SelectionProvider>
            <TopBar />
            <NavigationProgress />
            <div className="flex flex-col min-h-screen">
              <Breadcrumbs />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <SelectionBar />
          </SelectionProvider>
        </BreadcrumbProvider>
        <Analytics />
      </body>
    </html>
  )
}
