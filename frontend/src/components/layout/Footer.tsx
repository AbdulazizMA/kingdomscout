'use client';

import Link from 'next/link';
import { Home } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function Footer() {
  const t = useTranslations('footer');
  const tn = useTranslations('nav');

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-white">
                Kingdom
                <span className="text-primary">Scout</span>
              </span>
            </Link>
            <p className="text-sm">
              {t('tagline')}
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-white mb-4">{t('product')}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/deals" className="hover:text-white">{tn('properties')}</Link></li>
              <li><Link href="/#how-it-works" className="hover:text-white">{tn('howItWorks')}</Link></li>
              <li><Link href="/dashboard" className="hover:text-white">{tn('dashboard')}</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-white mb-4">{t('company')}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-white">{t('aboutUs')}</Link></li>
              <li><Link href="/contact" className="hover:text-white">{t('contact')}</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-white mb-4">{t('legal')}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/privacy" className="hover:text-white">{t('privacy')}</Link></li>
              <li><Link href="/terms" className="hover:text-white">{t('terms')}</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-sm text-center">
          <p>&copy; {new Date().getFullYear()} {t('copyright')}</p>
        </div>
      </div>
    </footer>
  );
}
