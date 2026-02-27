import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Saudi Gateway Realty | Invest in Saudi Arabia Real Estate',
  description:
    'Your trusted partner for foreign real estate investment in Saudi Arabia. Access curated opportunities, market insights, and expert guidance powered by Vision 2030.',
  keywords:
    'Saudi Arabia real estate, foreign investment Saudi, Vision 2030 property, Riyadh investment, NEOM, Saudi property market',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
