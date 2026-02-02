'use client';

import Link from 'next/link';
import { MapPin, Bed, Bath, Maximize, TrendingDown, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';

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
  city?: { nameEn: string; slug: string };
  district?: { nameEn: string };
  propertyType?: { nameEn: string };
}

interface DealCardProps {
  deal: Deal;
  showContact?: boolean;
}

export function DealCard({ deal, showContact = false }: DealCardProps) {
  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M`;
    }
    if (price >= 1000) {
      return `${(price / 1000).toFixed(0)}K`;
    }
    return price.toString();
  };

  const getDealBadge = () => {
    switch (deal.dealType) {
      case 'hot_deal':
        return { text: 'Hot Deal', className: 'bg-red-500' };
      case 'good_deal':
        return { text: 'Good Deal', className: 'bg-orange-500' };
      default:
        return { text: 'Fair Price', className: 'bg-blue-500' };
    }
  };

  const badge = getDealBadge();
  const discount = deal.priceVsMarketPercent && deal.priceVsMarketPercent < 0 
    ? Math.abs(deal.priceVsMarketPercent) 
    : 0;

  return (
    <Link href={`/deals/${deal.id}`}>
      <div className="group bg-white rounded-xl border hover:shadow-xl transition-all duration-300 overflow-hidden">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          {deal.mainImageUrl ? (
            <img
              src={deal.mainImageUrl}
              alt={deal.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
              <span className="text-gray-400">No Image</span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            <span className={`${badge.className} text-white text-xs font-bold px-3 py-1 rounded-full`}>
              {badge.text}
            </span>
            {discount > 0 && (
              <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <TrendingDown className="w-3 h-3" />
                {discount.toFixed(0)}% OFF
              </span>
            )}
          </div>

          {/* Score badge */}
          {deal.investmentScore && (
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur text-gray-900 font-bold px-3 py-1 rounded-full text-sm">
              Score: {deal.investmentScore}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition">
              {deal.title}
            </h3>
          </div>

          <div className="flex items-center text-gray-500 text-sm mb-4">
            <MapPin className="w-4 h-4 mr-1" />
            {deal.district?.nameEn}, {deal.city?.nameEn}
          </div>

          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-2xl font-bold text-primary">
              {formatPrice(deal.price)} SAR
            </span>
            {deal.sizeSqm && (
              <span className="text-gray-500 text-sm">
                ({Math.round(deal.price / deal.sizeSqm).toLocaleString()}/m²)
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600">
            {deal.bedrooms && (
              <div className="flex items-center gap-1">
                <Bed className="w-4 h-4" />
                {deal.bedrooms}
              </div>
            )}
            {deal.bathrooms && (
              <div className="flex items-center gap-1">
                <Bath className="w-4 h-4" />
                {deal.bathrooms}
              </div>
            )}
            {deal.sizeSqm && (
              <div className="flex items-center gap-1">
                <Maximize className="w-4 h-4" />
                {deal.sizeSqm} m²
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
