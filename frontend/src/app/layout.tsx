import type { Metadata } from 'next'
import { Inter, Noto_Sans_Arabic } from 'next/font/google'
import './globals.css'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })
const notoSansArabic = Noto_Sans_Arabic({ 
  subsets: ['arabic'],
  variable: '--font-arabic'
})

export const metadata: Metadata = {
  title: 'KingdomScout | Saudi Real Estate Deals',
  description: 'Discover undervalued property deals across Saudi Arabia. Real-time alerts, price history, and investment scoring.',
  keywords: 'Saudi Arabia real estate, property investment, Riyadh, Jeddah, Makkah, undervalued properties',
  openGraph: {
    title: 'KingdomScout',
    description: 'Premium property alerts for Saudi investors',
    type: 'website',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" className={notoSansArabic.variable}>
      <body className={`${inter.className} font-arabic`}>
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster position="top-left" />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
