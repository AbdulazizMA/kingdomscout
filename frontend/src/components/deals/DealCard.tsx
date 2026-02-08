'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { MapPin, Bed, Bath, Maximize, TrendingDown, Building2 } from 'lucide-react';

interface Deal {
  id: string;
  title: string;
  price: number;
  sizeSqm?: number;
  bedrooms?: number;
  bathrooms?: number;
  mainImageUrl?: string;
  investmentScore?: number;
  dealType?: string;
  priceVsMarketPercent?: number;
  pricePerSqm?: number;
  sourceUrl?: string;
  city?: { nameEn: string; nameAr?: string; slug: string };
  district?: { nameEn: string; nameAr?: string };
  propertyType?: { nameEn: string; nameAr?: string };
}

interface DealCardProps {
  deal: Deal;
}

export function DealCard({ deal }: DealCardProps) {
  const t = useTranslations('dealCard');
  const locale = useLocale();

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      const m = price / 1000000;
      return m % 1 === 0 ? `${m.toFixed(0)}M` : `${m.toFixed(1)}M`;
    }
    if (price >= 1000) {
      return `${Math.round(price / 1000).toLocaleString()}K`;
    }
    return price.toLocaleString();
  };

  const getDealBadge = () => {
    switch (deal.dealType) {
      case 'hot_deal':
        return { text: t('hotDeal'), className: 'bg-red-500' };
      case 'good_deal':
        return { text: t('goodDeal'), className: 'bg-orange-500' };
      case 'overpriced':
        return { text: t('overpriced'), className: 'bg-gray-500' };
      default:
        return { text: t('fairPrice'), className: 'bg-blue-500' };
    }
  };

  const badge = getDealBadge();
  const discount = deal.priceVsMarketPercent && deal.priceVsMarketPercent < 0
    ? Math.abs(deal.priceVsMarketPercent)
    : 0;

  const cityName = locale === 'ar' ? (deal.city?.nameAr || deal.city?.nameEn) : deal.city?.nameEn;
  const districtName = locale === 'ar' ? (deal.district?.nameAr || deal.district?.nameEn) : deal.district?.nameEn;
  const location = [districtName, cityName].filter(Boolean).join(', ');
  const pricePerSqm = deal.pricePerSqm
    ? Number(deal.pricePerSqm)
    : deal.sizeSqm && Number(deal.sizeSqm) > 0
      ? deal.price / Number(deal.sizeSqm)
      : null;

  return (
    <Link href={`/deals/${deal.id}`}>
      <div className="group bg-white rounded-xl border hover:shadow-lg transition-all duration-300 overflow-hidden h-full flex flex-col">
        {/* Image */}
        <div className="relative w-full" style={{ paddingBottom: '66.67%' }}>
          {deal.mainImageUrl ? (
            <img
              src={deal.mainImageUrl}
              alt={deal.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center gap-2">
              <Building2 className="w-10 h-10 text-gray-300" />
              <span className="text-gray-400 text-sm">{t('noImage')}</span>
            </div>
          )}

          {/* Top-left badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 max-w-[calc(100%-70px)]">
            <span className={`${badge.className} text-white text-xs font-semibold px-2 py-0.5 rounded-full`}>
              {badge.text}
            </span>
            {discount > 0 && (
              <span className="bg-green-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <TrendingDown className="w-3 h-3" />
                {discount.toFixed(0)}%
              </span>
            )}
          </div>

          {/* Top-right score */}
          {deal.investmentScore != null && deal.investmentScore > 0 && (
            <div className={`absolute top-2.5 right-2.5 font-bold px-2 py-0.5 rounded-full text-xs ${
              deal.investmentScore >= 80 ? 'bg-green-500 text-white' :
              deal.investmentScore >= 60 ? 'bg-yellow-400 text-gray-900' :
              'bg-white/90 text-gray-700'
            }`}>
              {deal.investmentScore}
            </div>
          )}

          {/* Bottom-left property type */}
          {deal.propertyType?.nameEn && (
            <div className="absolute bottom-2.5 left-2.5 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full capitalize">
              {locale === 'ar' ? (deal.propertyType?.nameAr || deal.propertyType?.nameEn) : deal.propertyType.nameEn}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3.5 flex flex-col flex-1">
          <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition mb-1.5 min-h-[2.5rem]">
            {deal.title}
          </h3>

          {location && (
            <div className="flex items-center text-gray-500 text-xs mb-2.5">
              <MapPin className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
              <span className="truncate">{location}</span>
            </div>
          )}

          <div className="mt-auto">
            <div className="flex items-baseline gap-1.5 mb-2.5">
              <span className="text-lg font-bold text-primary">
                {formatPrice(deal.price)} {t('sar')}
              </span>
              {pricePerSqm && (
                <span className="text-gray-400 text-xs whitespace-nowrap">
                  {Math.round(pricePerSqm).toLocaleString()}/m²
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-500 pt-2.5 border-t border-gray-100">
              {deal.bedrooms != null && (
                <div className="flex items-center gap-1">
                  <Bed className="w-3.5 h-3.5" />
                  <span>{deal.bedrooms}</span>
                </div>
              )}
              {deal.bathrooms != null && (
                <div className="flex items-center gap-1">
                  <Bath className="w-3.5 h-3.5" />
                  <span>{deal.bathrooms}</span>
                </div>
              )}
              {deal.sizeSqm != null && (
                <div className="flex items-center gap-1">
                  <Maximize className="w-3.5 h-3.5" />
                  <span>{Number(deal.sizeSqm).toLocaleString()} m²</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
