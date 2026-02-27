'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, TrendingUp } from 'lucide-react';

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Opportunities', href: '/opportunities' },
  { name: 'Market Insights', href: '/insights' },
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-md">
      <nav className="container-wide flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-lg font-bold text-gray-900">Saudi Gateway</span>
            <span className="text-[10px] font-medium uppercase tracking-widest text-gold-600">
              Realty
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-8 md:flex">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm font-medium text-gray-600 transition-colors hover:text-brand-600"
            >
              {item.name}
            </Link>
          ))}
          <Link href="/contact" className="btn-primary text-sm">
            Book Consultation
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-gray-100 bg-white px-4 py-4 md:hidden">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="block py-3 text-base font-medium text-gray-700"
              onClick={() => setMobileOpen(false)}
            >
              {item.name}
            </Link>
          ))}
          <Link
            href="/contact"
            className="btn-primary mt-4 block w-full text-center"
            onClick={() => setMobileOpen(false)}
          >
            Book Consultation
          </Link>
        </div>
      )}
    </header>
  );
}
