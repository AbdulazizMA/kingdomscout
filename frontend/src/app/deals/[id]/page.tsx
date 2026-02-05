'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import {
  MapPin, Bed, Bath, Maximize, Calendar, TrendingDown,
  ArrowLeft, ExternalLink, Phone, Heart, Share2, Building2,
  Check, AlertCircle
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
        return { text: 'Hot Deal', className: 'bg-red-500' };
      case 'good_deal':
        return { text: 'Good Deal', className: 'bg-orange-500' };
      default:
        return { text: 'Fair Price', className: 'bg-blue-500' };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 w-32 bg-gray-200 rounded mb-8" />
            <div className="grid md:grid-cols-2 gap-8">
              <div className="aspect-[4/3] bg-gray-200 rounded-xl" />
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4" />
                <div className="h-6 bg-gray-200 rounded w-1/2" />
                <div className="h-12 bg-gray-200 rounded w-1/3" />
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Property Not Found</h1>
            <p className="text-gray-600 mb-8">The property you're looking for doesn't exist or has been removed.</p>
            <Link href="/deals">
              <Button>Browse All Properties</Button>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to listings
        </button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white rounded-xl overflow-hidden border">
              <div className="relative aspect-[16/9]">
                {property.mainImageUrl ? (
                  <img
                    src={property.mainImageUrl}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    <Building2 className="w-24 h-24 text-gray-400" />
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className={`${badge.className} text-white text-sm font-bold px-4 py-2 rounded-full`}>
                    {badge.text}
                  </span>
                  {discount > 0 && (
                    <span className="bg-green-500 text-white text-sm font-bold px-4 py-2 rounded-full flex items-center gap-1">
                      <TrendingDown className="w-4 h-4" />
                      {discount.toFixed(0)}% Below Market
                    </span>
                  )}
                </div>

                {property.investmentScore && (
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur text-gray-900 font-bold px-4 py-2 rounded-full">
                    Investment Score: {property.investmentScore}/100
                  </div>
                )}
              </div>

              {/* Additional Images */}
              {property.imageUrls && property.imageUrls.length > 0 && (
                <div className="p-4 border-t">
                  <div className="flex gap-2 overflow-x-auto">
                    {property.imageUrls.slice(0, 5).map((url, index) => (
                      <img
                        key={index}
                        src={url}
                        alt={`${property.title} - Image ${index + 1}`}
                        className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Property Details */}
            <div className="bg-white rounded-xl border p-6">
              <h1 className="text-2xl font-bold mb-2">{property.title}</h1>

              <div className="flex items-center text-gray-600 mb-4">
                <MapPin className="w-5 h-5 mr-2" />
                {property.district?.nameEn && `${property.district.nameEn}, `}
                {property.city?.nameEn}
              </div>

              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-3xl font-bold text-primary">
                  {formatPrice(property.price)} SAR
                </span>
                {property.sizeSqm && property.pricePerSqm && (
                  <span className="text-gray-500">
                    ({formatPrice(Number(property.pricePerSqm))}/m²)
                  </span>
                )}
              </div>

              {/* Key Features */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {property.bedrooms && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Bed className="w-5 h-5" />
                    <span>{property.bedrooms} Bedrooms</span>
                  </div>
                )}
                {property.bathrooms && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Bath className="w-5 h-5" />
                    <span>{property.bathrooms} Bathrooms</span>
                  </div>
                )}
                {property.sizeSqm && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Maximize className="w-5 h-5" />
                    <span>{property.sizeSqm} m²</span>
                  </div>
                )}
                {property.buildingAgeYears !== undefined && property.buildingAgeYears !== null && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-5 h-5" />
                    <span>{property.buildingAgeYears} years old</span>
                  </div>
                )}
              </div>

              {property.description && (
                <div className="border-t pt-6">
                  <h2 className="text-lg font-semibold mb-3">Description</h2>
                  <p className="text-gray-600 whitespace-pre-line">{property.description}</p>
                </div>
              )}
            </div>

            {/* Investment Analysis */}
            <div className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-semibold mb-4">Investment Analysis</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price per m²</span>
                    <span className="font-medium">
                      {property.pricePerSqm ? `${formatPrice(Number(property.pricePerSqm))} SAR` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">District Average</span>
                    <span className="font-medium">
                      {property.districtAvgPricePerSqm ? `${formatPrice(Number(property.districtAvgPricePerSqm))} SAR/m²` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">vs Market</span>
                    <span className={`font-medium ${property.priceVsMarketPercent && property.priceVsMarketPercent < 0 ? 'text-green-600' : 'text-gray-900'}`}>
                      {property.priceVsMarketPercent ? `${property.priceVsMarketPercent > 0 ? '+' : ''}${Number(property.priceVsMarketPercent).toFixed(1)}%` : 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Est. Monthly Rent</span>
                    <span className="font-medium">
                      {property.estimatedMonthlyRent ? `${formatPrice(Number(property.estimatedMonthlyRent))} SAR` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Est. Annual Yield</span>
                    <span className="font-medium text-green-600">
                      {property.estimatedAnnualYieldPercent ? `${Number(property.estimatedAnnualYieldPercent).toFixed(1)}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Investment Score</span>
                    <span className="font-bold text-primary">
                      {property.investmentScore || 'N/A'}/100
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <div className="bg-white rounded-xl border p-6 sticky top-4">
              <h3 className="text-lg font-semibold mb-4">Contact Seller</h3>

              {property.contactName && (
                <div className="mb-4">
                  <p className="text-gray-600">Listed by</p>
                  <p className="font-medium flex items-center gap-2">
                    {property.contactName}
                    {property.isVerifiedContact && (
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Verified
                      </span>
                    )}
                  </p>
                </div>
              )}

              {property.contactPhone && (
                <a
                  href={`tel:${property.contactPhone}`}
                  className="w-full bg-primary text-white rounded-lg py-3 flex items-center justify-center gap-2 hover:bg-primary/90 transition mb-3"
                >
                  <Phone className="w-5 h-5" />
                  {property.contactPhone}
                </a>
              )}

              {property.sourceUrl && (
                <a
                  href={property.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full border border-gray-300 rounded-lg py-3 flex items-center justify-center gap-2 hover:bg-gray-50 transition"
                >
                  <ExternalLink className="w-5 h-5" />
                  View Original Listing
                </a>
              )}

              <div className="flex gap-2 mt-4">
                <button className="flex-1 border border-gray-300 rounded-lg py-2 flex items-center justify-center gap-2 hover:bg-gray-50 transition">
                  <Heart className="w-5 h-5" />
                  Save
                </button>
                <button className="flex-1 border border-gray-300 rounded-lg py-2 flex items-center justify-center gap-2 hover:bg-gray-50 transition">
                  <Share2 className="w-5 h-5" />
                  Share
                </button>
              </div>
            </div>

            {/* Property Info */}
            <div className="bg-white rounded-xl border p-6">
              <h3 className="text-lg font-semibold mb-4">Property Info</h3>

              <div className="space-y-3 text-sm">
                {property.propertyType && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type</span>
                    <span className="font-medium">{property.propertyType.nameEn}</span>
                  </div>
                )}
                {property.floor !== undefined && property.floor !== null && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Floor</span>
                    <span className="font-medium">{property.floor}</span>
                  </div>
                )}
                {property.furnished !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Furnished</span>
                    <span className="font-medium">{property.furnished ? 'Yes' : 'No'}</span>
                  </div>
                )}
                {property.isVerified && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Verified</span>
                    <span className="font-medium text-green-600 flex items-center gap-1">
                      <Check className="w-4 h-4" /> Yes
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Views</span>
                  <span className="font-medium">{property.viewCount || 0}</span>
                </div>
                {property.scrapedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Listed</span>
                    <span className="font-medium">
                      {new Date(property.scrapedAt).toLocaleDateString()}
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
