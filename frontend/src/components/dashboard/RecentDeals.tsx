'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { useTranslations, useLocale } from 'next-intl';
import axios from 'axios';
import { ArrowRight, Building2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export function RecentDeals() {
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const { data } = useQuery({
    queryKey: ['recent-deals'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/api/properties?limit=5&sortBy=date&sortOrder=desc`);
      return response.data;
    },
  });

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M SAR`;
    }
    if (price >= 1000) {
      return `${Math.round(price / 1000)}K SAR`;
    }
    return `${price} SAR`;
  };

  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold">{t('recentProperties')}</h3>
        <Link href="/deals?sortBy=date&sortOrder=desc" className="text-sm text-primary flex items-center gap-1 hover:underline">
          {t('viewAll')}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="space-y-3">
        {data?.properties?.slice(0, 5).map((deal: any) => (
          <Link key={deal.id} href={`/deals/${deal.id}`}>
            <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition">
              <div className="w-14 h-14 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden relative">
                {deal.mainImageUrl ? (
                  <Image
                    src={deal.mainImageUrl}
                    alt={deal.title}
                    fill
                    sizes="56px"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-gray-300" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{deal.title}</p>
                <p className="text-xs text-gray-500">{locale === 'ar' ? (deal.city?.nameAr || deal.city?.nameEn || t('unknown')) : (deal.city?.nameEn || t('unknown'))}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-semibold text-sm">{formatPrice(deal.price)}</p>
                {deal.investmentScore != null && (
                  <p className={`text-xs ${deal.investmentScore >= 70 ? 'text-green-600' : 'text-gray-500'}`}>
                    Score: {deal.investmentScore}
                  </p>
                )}
              </div>
            </div>
          </Link>
        ))}
        {(!data?.properties || data.properties.length === 0) && (
          <p className="text-gray-400 text-sm text-center py-4">{t('noProperties')}</p>
        )}
      </div>
    </div>
  );
}
