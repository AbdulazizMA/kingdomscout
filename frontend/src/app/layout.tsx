import type { Metadata } from 'next'
import { Inter, Noto_Sans_Arabic } from 'next/font/google'
import './globals.css'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { Toaster } from 'react-hot-toast'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getLocale } from 'next-intl/server'

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const messages = await getMessages()
  const dir = locale === 'ar' ? 'rtl' : 'ltr'

  return (
    <html lang={locale} dir={dir} className={notoSansArabic.variable}>
      <body className={`${inter.className} font-arabic`}>
        <NextIntlClientProvider messages={messages}>
          <QueryProvider>
            <AuthProvider>
              {children}
              <Toaster position={dir === 'rtl' ? 'top-right' : 'top-left'} />
            </AuthProvider>
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
