'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useTranslations, useLocale } from 'next-intl';
import axios from 'axios';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import {
  MapPin, Bed, Bath, Maximize, Calendar, TrendingDown,
  ArrowLeft, ExternalLink, Phone, Share2, Building2,
  Check, AlertCircle, CheckCircle
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface Property {
  id: string;
  title: string;
  description?: string;
  price: number;
  sizeSqm?: number;
  bedrooms?: number;
  bathrooms?: number;
  floor?: number;
  buildingAgeYears?: number;
  furnished?: boolean;
  mainImageUrl?: string;
  imageUrls?: string[];
  investmentScore?: number;
  dealType?: string;
  pricePerSqm?: number;
  priceVsMarketPercent?: number;
  districtAvgPricePerSqm?: number;
  estimatedMonthlyRent?: number;
  estimatedAnnualYieldPercent?: number;
  sourceUrl?: string;
  contactName?: string;
  contactPhone?: string;
  isVerifiedContact?: boolean;
  isVerified?: boolean;
  scrapedAt?: string;
  viewCount?: number;
  city?: { nameEn: string; nameAr: string; slug: string };
  district?: { nameEn: string; nameAr: string };
  propertyType?: { nameEn: string; nameAr: string };
  priceHistory?: Array<{ price: number; recordedAt: string }>;
}

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const t = useTranslations('propertyDetail');
  const td = useTranslations('dealCard');
  const locale = useLocale();

  const { data: property, isLoading, error } = useQuery<Property>({
    queryKey: ['property', id],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/api/properties/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  const formatPrice = (price: number) => {
    return price.toLocaleString('en-SA');
  };

  const getDealBadge = (dealType?: string) => {
    switch (dealType) {
      case 'hot_deal':
        return { text: td('hotDeal'), className: 'bg-red-500' };
      case 'good_deal':
        return { text: td('goodDeal'), className: 'bg-orange-500' };
      case 'overpriced':
        return { text: td('overpriced'), className: 'bg-gray-500' };
      default:
        return { text: td('fairPrice'), className: 'bg-blue-500' };
    }
  };

  const getName = (obj?: { nameEn: string; nameAr?: string }) => {
    if (!obj) return '';
    return locale === 'ar' ? (obj.nameAr || obj.nameEn) : obj.nameEn;
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: property?.title, url });
      } catch {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 w-32 bg-gray-200 rounded mb-8" />
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="aspect-[16/9] bg-gray-200 rounded-xl" />
                <div className="bg-white rounded-xl border p-6 space-y-4">
                  <div className="h-8 bg-gray-200 rounded w-3/4" />
                  <div className="h-6 bg-gray-200 rounded w-1/2" />
                  <div className="h-12 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
              <div className="space-y-6">
                <div className="bg-white rounded-xl border p-6 h-64" />
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-16">
            <AlertCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('notFound')}</h1>
            <p className="text-gray-600 mb-8">{t('notFoundMsg')}</p>
            <Link href="/deals">
              <Button>{t('browseAll')}</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const badge = getDealBadge(property.dealType);
  const discount = property.priceVsMarketPercent && property.priceVsMarketPercent < 0
    ? Math.abs(property.priceVsMarketPercent)
    : 0;

  const allImages = [
    ...(property.mainImageUrl ? [property.mainImageUrl] : []),
    ...(property.imageUrls || []).filter(u => u !== property.mainImageUrl),
  ];
  const currentImage = allImages[selectedImageIndex] || null;
  const locationText = [getName(property.district), getName(property.city)].filter(Boolean).join(', ');
  const sar = locale === 'ar' ? 'ر.س' : 'SAR';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('backToListings')}
        </button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-5">
            {/* Image Gallery */}
            <div className="bg-white rounded-xl overflow-hidden border">
              <div className="relative aspect-[16/9] bg-gray-100">
                {currentImage ? (
                  <img
                    src={currentImage}
                    alt={property.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center gap-2">
                    <Building2 className="w-20 h-20 text-gray-300" />
                    <span className="text-gray-400">{t('noImageAvailable')}</span>
                  </div>
                )}

                <div className="absolute top-4 start-4 flex gap-2">
                  <span className={`${badge.className} text-white text-sm font-bold px-4 py-1.5 rounded-full shadow`}>
                    {badge.text}
                  </span>
                  {discount > 0 && (
                    <span className="bg-green-500 text-white text-sm font-bold px-4 py-1.5 rounded-full flex items-center gap-1 shadow">
                      <TrendingDown className="w-4 h-4" />
                      {discount.toFixed(0)}% {t('belowMarket')}
                    </span>
                  )}
                </div>

                {property.investmentScore != null && property.investmentScore > 0 && (
                  <div className={`absolute top-4 end-4 backdrop-blur font-bold px-4 py-1.5 rounded-full shadow ${
                    property.investmentScore >= 80 ? 'bg-green-500/90 text-white' :
                    property.investmentScore >= 60 ? 'bg-yellow-400/90 text-gray-900' :
                    'bg-white/90 text-gray-700'
                  }`}>
                    {t('score')}: {property.investmentScore}/100
                  </div>
                )}

                {allImages.length > 1 && (
                  <div className="absolute bottom-4 end-4 bg-black/60 text-white text-xs px-3 py-1 rounded-full">
                    {selectedImageIndex + 1} / {allImages.length}
                  </div>
                )}
              </div>

              {allImages.length > 1 && (
                <div className="p-3 border-t">
                  <div className="flex gap-2 overflow-x-auto">
                    {allImages.slice(0, 8).map((url, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`relative w-20 h-20 rounded-lg flex-shrink-0 overflow-hidden border-2 transition ${
                          selectedImageIndex === index ? 'border-primary' : 'border-transparent hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={url}
                          alt={`${property.title} - ${index + 1}`}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Property Details */}
            <div className="bg-white rounded-xl border p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h1 className="text-xl font-bold mb-2">{property.title}</h1>
                  <div className="flex items-center text-gray-600 text-sm">
                    <MapPin className="w-4 h-4 me-1.5" />
                    {locationText}
                  </div>
                </div>
                {property.propertyType && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                    {getName(property.propertyType)}
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-3xl font-bold text-primary">
                  {formatPrice(property.price)} {sar}
                </span>
                {property.pricePerSqm && (
                  <span className="text-gray-500 text-sm">
                    ({formatPrice(Number(property.pricePerSqm))}/{locale === 'ar' ? 'م²' : 'm²'})
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {property.bedrooms != null && (
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2.5">
                    <Bed className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">{t('bedrooms')}</p>
                      <p className="font-medium text-sm">{property.bedrooms}</p>
                    </div>
                  </div>
                )}
                {property.bathrooms != null && (
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2.5">
                    <Bath className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">{t('bathrooms')}</p>
                      <p className="font-medium text-sm">{property.bathrooms}</p>
                    </div>
                  </div>
                )}
                {property.sizeSqm != null && (
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2.5">
                    <Maximize className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">{t('size')}</p>
                      <p className="font-medium text-sm">{Number(property.sizeSqm).toLocaleString()} {locale === 'ar' ? 'م²' : 'm²'}</p>
                    </div>
                  </div>
                )}
                {property.buildingAgeYears != null && (
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2.5">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">{t('buildingAge')}</p>
                      <p className="font-medium text-sm">{property.buildingAgeYears} {t('yrs')}</p>
                    </div>
                  </div>
                )}
              </div>

              {property.description && (
                <div className="border-t pt-5">
                  <h2 className="text-base font-semibold mb-3">{t('description')}</h2>
                  <p className="text-gray-600 text-sm whitespace-pre-line leading-relaxed">{property.description}</p>
                </div>
              )}
            </div>

            {/* Investment Analysis */}
            <div className="bg-white rounded-xl border p-6">
              <h2 className="text-base font-semibold mb-4">{t('investmentAnalysis')}</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600 text-sm">{t('pricePerSqm')}</span>
                    <span className="font-medium text-sm">
                      {property.pricePerSqm ? `${formatPrice(Number(property.pricePerSqm))} ${sar}` : t('na')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600 text-sm">{t('districtAvg')}</span>
                    <span className="font-medium text-sm">
                      {property.districtAvgPricePerSqm ? `${formatPrice(Number(property.districtAvgPricePerSqm))} ${sar}/${locale === 'ar' ? 'م²' : 'm²'}` : t('na')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 text-sm">{t('vsMarket')}</span>
                    <span className={`font-medium text-sm ${property.priceVsMarketPercent && property.priceVsMarketPercent < 0 ? 'text-green-600' : 'text-gray-900'}`}>
                      {property.priceVsMarketPercent
                        ? `${Number(property.priceVsMarketPercent) > 0 ? '+' : ''}${Number(property.priceVsMarketPercent).toFixed(1)}%`
                        : t('na')
                      }
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600 text-sm">{t('estMonthlyRent')}</span>
                    <span className="font-medium text-sm">
                      {property.estimatedMonthlyRent ? `${formatPrice(Number(property.estimatedMonthlyRent))} ${sar}` : t('na')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600 text-sm">{t('estAnnualYield')}</span>
                    <span className="font-medium text-sm text-green-600">
                      {property.estimatedAnnualYieldPercent ? `${Number(property.estimatedAnnualYieldPercent).toFixed(1)}%` : t('na')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 text-sm">{t('investmentScore')}</span>
                    <span className={`font-bold text-sm ${
                      (property.investmentScore || 0) >= 80 ? 'text-green-600' :
                      (property.investmentScore || 0) >= 60 ? 'text-yellow-600' :
                      'text-gray-600'
                    }`}>
                      {property.investmentScore || t('na')}/100
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <div className="bg-white rounded-xl border p-5 sticky top-20">
              <h3 className="font-semibold mb-4">{t('contactSeller')}</h3>

              {property.contactName && (
                <div className="mb-4">
                  <p className="text-gray-500 text-xs">{t('listedBy')}</p>
                  <p className="font-medium text-sm flex items-center gap-2">
                    {property.contactName}
                    {property.isVerifiedContact && (
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        {t('verified')}
                      </span>
                    )}
                  </p>
                </div>
              )}

              {property.contactPhone && (
                <a
                  href={`tel:${property.contactPhone}`}
                  className="w-full bg-primary text-white rounded-lg py-3 flex items-center justify-center gap-2 hover:bg-primary/90 transition mb-3 text-sm font-medium"
                >
                  <Phone className="w-4 h-4" />
                  {property.contactPhone}
                </a>
              )}

              {property.sourceUrl && (
                <a
                  href={property.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full border border-gray-300 rounded-lg py-3 flex items-center justify-center gap-2 hover:bg-gray-50 transition text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  {t('viewOriginal')}
                </a>
              )}

              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleShare}
                  className="flex-1 border border-gray-300 rounded-lg py-2.5 flex items-center justify-center gap-2 hover:bg-gray-50 transition text-sm"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {t('copied')}
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      {t('share')}
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-semibold mb-4">{t('propertyInfo')}</h3>

              <div className="space-y-3 text-sm">
                {property.propertyType && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('type')}</span>
                    <span className="font-medium">{getName(property.propertyType)}</span>
                  </div>
                )}
                {property.floor != null && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('floor')}</span>
                    <span className="font-medium">{property.floor}</span>
                  </div>
                )}
                {property.furnished != null && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('furnished')}</span>
                    <span className="font-medium">{property.furnished ? t('yes') : t('no')}</span>
                  </div>
                )}
                {property.isVerified && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('verified')}</span>
                    <span className="font-medium text-green-600 flex items-center gap-1">
                      <Check className="w-4 h-4" /> {t('yes')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('views')}</span>
                  <span className="font-medium">{property.viewCount || 0}</span>
                </div>
                {property.scrapedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('listed')}</span>
                    <span className="font-medium">
                      {new Date(property.scrapedAt).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-SA')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
