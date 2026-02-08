'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function CTA() {
  const t = useTranslations('cta');

  return (
    <section className="py-20 bg-primary">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
          {t('title')}
        </h2>
        <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
          {t('subtitle')}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/deals">
            <Button size="lg" variant="secondary" className="gap-2">
              {t('browseBtn')}
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <p className="mt-6 text-sm text-white/70">
          {t('freeNote')}
        </p>
      </div>
    </section>
  );
}
