'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  SlidersHorizontal,
  MapPin,
  Building2,
  TrendingUp,
  ArrowRight,
  Star,
  Bed,
  Ruler,
  X,
} from 'lucide-react';

/* Sample data - in production this would come from the backend API */
const SAMPLE_PROPERTIES = [
  {
    id: '1',
    title: 'Premium 3BR Apartment in Al Olaya District',
    city: 'Riyadh',
    district: 'Al Olaya',
    price: 1250000,
    pricePerSqm: 5200,
    size: 240,
    bedrooms: 3,
    investmentScore: 87,
    dealType: 'hot_deal',
    yield: 7.8,
    priceVsMarket: -18,
    propertyType: 'apartment',
    imageUrl: null,
  },
  {
    id: '2',
    title: 'Modern Villa in Al Nakheel',
    city: 'Riyadh',
    district: 'Al Nakheel',
    price: 3500000,
    pricePerSqm: 4375,
    size: 800,
    bedrooms: 5,
    investmentScore: 79,
    dealType: 'good_deal',
    yield: 6.2,
    priceVsMarket: -12,
    propertyType: 'villa',
    imageUrl: null,
  },
  {
    id: '3',
    title: 'Commercial Land Plot - Al Hamra',
    city: 'Jeddah',
    district: 'Al Hamra',
    price: 8500000,
    pricePerSqm: 2125,
    size: 4000,
    bedrooms: 0,
    investmentScore: 92,
    dealType: 'hot_deal',
    yield: 0,
    priceVsMarket: -25,
    propertyType: 'land',
    imageUrl: null,
  },
  {
    id: '4',
    title: '2BR Apartment Near Corniche',
    city: 'Jeddah',
    district: 'Al Shati',
    price: 890000,
    pricePerSqm: 5563,
    size: 160,
    bedrooms: 2,
    investmentScore: 74,
    dealType: 'good_deal',
    yield: 7.5,
    priceVsMarket: -11,
    propertyType: 'apartment',
    imageUrl: null,
  },
  {
    id: '5',
    title: 'Duplex Villa - Al Khobar Waterfront',
    city: 'Al Khobar',
    district: 'Al Khobar Waterfront',
    price: 4200000,
    pricePerSqm: 4667,
    size: 900,
    bedrooms: 6,
    investmentScore: 81,
    dealType: 'good_deal',
    yield: 6.8,
    priceVsMarket: -14,
    propertyType: 'villa',
    imageUrl: null,
  },
  {
    id: '6',
    title: 'Investment Building - 12 Units',
    city: 'Dammam',
    district: 'Al Faisaliyah',
    price: 12000000,
    pricePerSqm: 3000,
    size: 4000,
    bedrooms: 0,
    investmentScore: 88,
    dealType: 'hot_deal',
    yield: 9.2,
    priceVsMarket: -22,
    propertyType: 'building',
    imageUrl: null,
  },
];

const CITIES = ['All Cities', 'Riyadh', 'Jeddah', 'Dammam', 'Al Khobar', 'Makkah', 'Madinah'];
const TYPES = ['All Types', 'Apartment', 'Villa', 'Land', 'Building', 'Commercial'];
const SORT_OPTIONS = ['Investment Score', 'Price: Low to High', 'Price: High to Low', 'Yield', 'Discount'];

function formatPrice(price: number): string {
  if (price >= 1000000) return `${(price / 1000000).toFixed(1)}M SAR`;
  if (price >= 1000) return `${(price / 1000).toFixed(0)}K SAR`;
  return `${price} SAR`;
}

function DealBadge({ dealType }: { dealType: string }) {
  if (dealType === 'hot_deal') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
        <Star className="h-3 w-3 fill-current" />
        Hot Deal
      </span>
    );
  }
  if (dealType === 'good_deal') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
        Good Deal
      </span>
    );
  }
  return null;
}

function PropertyCard({ property }: { property: (typeof SAMPLE_PROPERTIES)[0] }) {
  return (
    <div className="card group overflow-hidden p-0">
      {/* Image placeholder */}
      <div className="relative flex h-48 items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
        <Building2 className="h-12 w-12 text-gray-300" />
        <div className="absolute left-3 top-3">
          <DealBadge dealType={property.dealType} />
        </div>
        <div className="absolute right-3 top-3 rounded-full bg-navy-900/80 px-3 py-1 text-xs font-bold text-white">
          Score: {property.investmentScore}/100
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-brand-600">
              {property.title}
            </h3>
            <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
              <MapPin className="h-3.5 w-3.5" />
              {property.city} - {property.district}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-baseline justify-between">
          <p className="text-2xl font-bold text-gray-900">{formatPrice(property.price)}</p>
          <p className="text-sm text-gray-500">
            {property.pricePerSqm.toLocaleString()} SAR/m&sup2;
          </p>
        </div>

        {/* Key metrics */}
        <div className="mt-4 grid grid-cols-3 gap-3 border-t border-gray-100 pt-4">
          {property.bedrooms > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <Bed className="h-4 w-4" />
              {property.bedrooms} Beds
            </div>
          )}
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <Ruler className="h-4 w-4" />
            {property.size} m&sup2;
          </div>
          {property.yield > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-brand-600">
              <TrendingUp className="h-4 w-4" />
              {property.yield}% Yield
            </div>
          )}
        </div>

        {/* Market comparison */}
        {property.priceVsMarket < 0 && (
          <div className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-center text-sm font-medium text-green-700">
            {Math.abs(property.priceVsMarket)}% Below Market Average
          </div>
        )}

        <Link
          href="/contact"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-100"
        >
          Request Details
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

export default function OpportunitiesPage() {
  const [city, setCity] = useState('All Cities');
  const [type, setType] = useState('All Types');
  const [sort, setSort] = useState('Investment Score');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = SAMPLE_PROPERTIES.filter((p) => {
    if (city !== 'All Cities' && p.city !== city) return false;
    if (type !== 'All Types' && p.propertyType !== type.toLowerCase()) return false;
    return true;
  }).sort((a, b) => {
    if (sort === 'Investment Score') return b.investmentScore - a.investmentScore;
    if (sort === 'Price: Low to High') return a.price - b.price;
    if (sort === 'Price: High to Low') return b.price - a.price;
    if (sort === 'Yield') return b.yield - a.yield;
    if (sort === 'Discount') return a.priceVsMarket - b.priceVsMarket;
    return 0;
  });

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-white border-b border-gray-100 py-12">
        <div className="container-wide">
          <h1 className="text-3xl font-bold text-gray-900">Investment Opportunities</h1>
          <p className="mt-2 text-gray-500">
            AI-curated properties with the highest investment potential across Saudi Arabia.
            All listings are scored, verified, and analyzed for foreign investor suitability.
          </p>

          {/* Filters */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              {CITIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>

            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              {TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>

            <span className="ml-auto text-sm text-gray-400">
              {filtered.length} properties found
            </span>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-8">
        <div className="container-wide">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="py-20 text-center">
              <Building2 className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-lg font-medium text-gray-600">No properties match your filters</p>
              <p className="mt-1 text-sm text-gray-400">Try adjusting your search criteria</p>
            </div>
          )}

          {/* CTA */}
          <div className="mt-16 rounded-2xl bg-brand-600 p-8 text-center sm:p-12">
            <h2 className="text-2xl font-bold text-white">
              Don&apos;t see what you&apos;re looking for?
            </h2>
            <p className="mt-3 text-brand-100">
              Our team can source specific properties based on your investment criteria,
              budget, and preferred location.
            </p>
            <Link href="/contact" className="btn-gold mt-6">
              Tell Us What You Need
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
