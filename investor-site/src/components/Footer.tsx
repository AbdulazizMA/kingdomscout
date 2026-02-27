import Link from 'next/link';
import { TrendingUp, Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-gray-50">
      <div className="container-wide py-16">
        <div className="grid gap-12 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
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
            <p className="mt-4 text-sm text-gray-500">
              Your trusted partner for real estate investment in the Kingdom of Saudi Arabia.
              Powered by data, driven by Vision 2030.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900">
              Explore
            </h3>
            <ul className="mt-4 space-y-3">
              {[
                { name: 'Investment Opportunities', href: '/opportunities' },
                { name: 'Market Insights', href: '/insights' },
                { name: 'About Us', href: '/about' },
                { name: 'Contact', href: '/contact' },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-500 transition-colors hover:text-brand-600"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Investment Focus */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900">
              Investment Focus
            </h3>
            <ul className="mt-4 space-y-3">
              {[
                'Riyadh Residential',
                'Jeddah Commercial',
                'NEOM & Mega Projects',
                'Eastern Province',
                'Land Investments',
              ].map((item) => (
                <li key={item}>
                  <span className="text-sm text-gray-500">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900">
              Get in Touch
            </h3>
            <ul className="mt-4 space-y-3">
              <li className="flex items-center gap-2 text-sm text-gray-500">
                <Mail className="h-4 w-4 text-brand-600" />
                <span>aalkuthami@gmail.com</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-500">
                <Phone className="h-4 w-4 text-brand-600" />
                <span>+966 56 105 6054</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-500">
                <MapPin className="h-4 w-4 text-brand-600" />
                <span>Riyadh, Kingdom of Saudi Arabia</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between border-t border-gray-200 pt-8 md:flex-row">
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} Saudi Gateway Realty. All rights reserved.
          </p>
          <p className="mt-2 text-xs text-gray-400 md:mt-0">
            Licensed by the Saudi Ministry of Commerce | RERA Registered
          </p>
        </div>
      </div>
    </footer>
  );
}
