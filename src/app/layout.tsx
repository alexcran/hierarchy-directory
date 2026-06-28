import type { Metadata } from 'next'
import { Cormorant_Garamond, Public_Sans } from 'next/font/google'
import { SelectionProvider } from '@/contexts/SelectionContext'
import { BreadcrumbProvider } from '@/contexts/BreadcrumbContext'
import { TopBar } from '@/components/layout/TopBar'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { SelectionBar } from '@/components/layout/SelectionBar'
import { Footer } from '@/components/layout/Footer'
import { NavigationProgress } from '@/components/layout/NavigationProgress'
import './globals.css'

const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
})

const publicSans = Public_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Hierarchy.Directory',
  description: 'A visual directory of the hierarchy of the Catholic Church. Currently featuring the bishops and dioceses of the United States.',
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
            <div className="pt-16 flex flex-col min-h-screen">
              <Breadcrumbs />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <SelectionBar />
          </SelectionProvider>
        </BreadcrumbProvider>
      </body>
    </html>
  )
}
