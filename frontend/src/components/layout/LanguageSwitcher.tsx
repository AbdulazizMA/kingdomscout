'use client';

import { useLocale } from 'next-intl';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const locale = useLocale();

  const switchLocale = () => {
    const newLocale = locale === 'ar' ? 'en' : 'ar';
    document.cookie = `locale=${newLocale};path=/;max-age=${365 * 24 * 60 * 60}`;
    window.location.reload();
  };

  return (
    <button
      onClick={switchLocale}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border hover:bg-gray-50 text-sm transition"
      aria-label="Switch language"
    >
      <Globe className="w-4 h-4" />
      {locale === 'ar' ? 'EN' : 'عربي'}
    </button>
  );
}
