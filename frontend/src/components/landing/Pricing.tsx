'use client';

import { Check } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { useTranslations } from 'next-intl';

export function Pricing() {
  const t = useTranslations('pricing');

  const features = [
    t('feature1'), t('feature2'), t('feature3'), t('feature4'),
    t('feature5'), t('feature6'), t('feature7'),
  ];

  return (
    <section className="py-20 bg-white" id="pricing">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {t('title')}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        <div className="bg-primary text-white rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-block bg-white/20 text-white text-sm font-medium px-4 py-1 rounded-full mb-4">
              {t('badge')}
            </div>

            <h3 className="text-2xl font-bold mb-2">{t('allFeatures')}</h3>
            <p className="text-white/80 mb-6">
              {t('featureDesc')}
            </p>

            <div className="mb-2">
              <span className="text-5xl font-bold">{t('free')}</span>
            </div>
            <p className="text-white/60 text-sm">
              {t('noSubscription')}
            </p>
          </div>

          <ul className="space-y-4 mb-8 max-w-md mx-auto">
            {features.map((feature) => (
              <li key={feature} className="flex items-center gap-3">
                <Check className="w-5 h-5 flex-shrink-0 text-white" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <div className="text-center space-y-4">
            <Link href="/deals">
              <Button
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto px-12"
              >
                {t('browseBtn')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
