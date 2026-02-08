'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import axios from 'axios';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { DealCard } from '@/components/deals/DealCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Filter, ChevronLeft, ChevronRight, Loader2, X, SlidersHorizontal } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface City {
  id: string;
  nameEn: string;
  nameAr: string;
  slug: string;
}

interface PropertyType {
  id: string;
  nameEn: string;
  nameAr: string;
  slug: string;
}

export default function DealsPage() {
  const t = useTranslations('deals');

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ms-3 text-gray-600">{t('loading')}</span>
        </div>
        <Footer />
      </div>
    }>
      <DealsContent />
    </Suspense>
  );
}

function DealsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations('deals');
  const locale = useLocale();
  const [showFilters, setShowFilters] = useState(true);

  const [page, setPage] = useState(() => parseInt(searchParams.get('page') || '1'));
  const [filters, setFilters] = useState({
    city: searchParams.get('city') || '',
    type: searchParams.get('type') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    dealType: searchParams.get('dealType') || '',
    bedrooms: searchParams.get('bedrooms') || '',
    minSize: searchParams.get('minSize') || '',
    maxSize: searchParams.get('maxSize') || '',
    minScore: searchParams.get('minScore') || '',
    sortBy: searchParams.get('sortBy') || 'score',
    sortOrder: searchParams.get('sortOrder') || 'desc',
  });

  const syncToUrl = useCallback((f: typeof filters, p: number) => {
    const params = new URLSearchParams();
    if (f.city) params.set('city', f.city);
    if (f.type) params.set('type', f.type);
    if (f.minPrice) params.set('minPrice', f.minPrice);
    if (f.maxPrice) params.set('maxPrice', f.maxPrice);
    if (f.dealType) params.set('dealType', f.dealType);
    if (f.bedrooms) params.set('bedrooms', f.bedrooms);
    if (f.minSize) params.set('minSize', f.minSize);
    if (f.maxSize) params.set('maxSize', f.maxSize);
    if (f.minScore) params.set('minScore', f.minScore);
    if (f.sortBy !== 'score') params.set('sortBy', f.sortBy);
    if (f.sortOrder !== 'desc') params.set('sortOrder', f.sortOrder);
    if (p > 1) params.set('page', p.toString());
    const qs = params.toString();
    router.replace(qs ? `/deals?${qs}` : '/deals', { scroll: false });
  }, [router]);

  const { data: citiesData } = useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/api/properties/meta/cities`);
      return response.data;
    },
    staleTime: 1000 * 60 * 30,
  });

  const { data: typesData } = useQuery({
    queryKey: ['propertyTypes'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/api/properties/meta/types`);
      return response.data;
    },
    staleTime: 1000 * 60 * 30,
  });

  useEffect(() => {
    setPage(1);
    syncToUrl(filters, 1);
  }, [filters, syncToUrl]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['deals', filters, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '21');
      params.append('sortBy', filters.sortBy);
      params.append('sortOrder', filters.sortOrder);
      if (filters.city) params.append('city', filters.city);
      if (filters.type) params.append('type', filters.type);
      if (filters.dealType) params.append('dealType', filters.dealType);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.bedrooms) params.append('bedrooms', filters.bedrooms);
      if (filters.minSize) params.append('minSize', filters.minSize);
      if (filters.maxSize) params.append('maxSize', filters.maxSize);
      if (filters.minScore) params.append('minScore', filters.minScore);

      const response = await axios.get(`${API_URL}/api/properties?${params}`);
      return response.data;
    },
  });

  const cities: City[] = citiesData?.cities || [];
  const propertyTypes: PropertyType[] = typesData?.types || [];
  const totalPages = data?.pagination?.pages || 1;

  const activeFilterCount = [
    filters.city, filters.type, filters.dealType, filters.minPrice,
    filters.maxPrice, filters.bedrooms, filters.minSize, filters.maxSize, filters.minScore,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setFilters({
      city: '', type: '', minPrice: '', maxPrice: '', dealType: '',
      bedrooms: '', minSize: '', maxSize: '', minScore: '',
      sortBy: 'score', sortOrder: 'desc',
    });
  };

  const getCityName = (city: City) => locale === 'ar' ? (city.nameAr || city.nameEn) : city.nameEn;
  const getTypeName = (type: PropertyType) => locale === 'ar' ? (type.nameAr || type.nameEn) : type.nameEn;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{t('title')}</h1>
            <p className="text-gray-500 text-sm mt-1">
              {t('propertiesFound', { total: data?.pagination?.total || 0 })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              className="border rounded-lg px-3 py-2 text-sm bg-white"
              value={`${filters.sortBy}_${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('_');
                setFilters({ ...filters, sortBy, sortOrder });
              }}
            >
              <option value="score_desc">{t('sortBestScore')}</option>
              <option value="price_asc">{t('sortPriceLow')}</option>
              <option value="price_desc">{t('sortPriceHigh')}</option>
              <option value="date_desc">{t('sortNewest')}</option>
              <option value="price_per_sqm_asc">{t('sortBestPriceSqm')}</option>
            </select>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition ${
                showFilters ? 'bg-primary text-white border-primary' : 'bg-white hover:bg-gray-50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              {t('filters')}
              {activeFilterCount > 0 && (
                <span className={`text-xs rounded-full w-5 h-5 flex items-center justify-center ${
                  showFilters ? 'bg-white text-primary' : 'bg-primary text-white'
                }`}>
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white p-4 rounded-lg border mb-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <select
                className="border rounded-lg px-3 py-2 text-sm bg-white"
                value={filters.city}
                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
              >
                <option value="">{t('allCities')}</option>
                {cities.map((city) => (
                  <option key={city.slug} value={city.slug}>
                    {getCityName(city)}
                  </option>
                ))}
              </select>

              <select
                className="border rounded-lg px-3 py-2 text-sm bg-white"
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              >
                <option value="">{t('allTypes')}</option>
                {propertyTypes.map((type) => (
                  <option key={type.slug} value={type.slug}>
                    {getTypeName(type)}
                  </option>
                ))}
              </select>

              <select
                className="border rounded-lg px-3 py-2 text-sm bg-white"
                value={filters.dealType}
                onChange={(e) => setFilters({ ...filters, dealType: e.target.value })}
              >
                <option value="">{t('allDeals')}</option>
                <option value="hot_deal">{t('hotDeals')}</option>
                <option value="good_deal">{t('goodDeals')}</option>
                <option value="fair_price">{t('fairPrice')}</option>
              </select>

              <select
                className="border rounded-lg px-3 py-2 text-sm bg-white"
                value={filters.bedrooms}
                onChange={(e) => setFilters({ ...filters, bedrooms: e.target.value })}
              >
                <option value="">{t('anyBedrooms')}</option>
                <option value="1">{t('bedroom', { count: 1 })}</option>
                <option value="2">{t('bedrooms', { count: 2 })}</option>
                <option value="3">{t('bedrooms', { count: 3 })}</option>
                <option value="4">{t('bedrooms', { count: 4 })}</option>
                <option value="5">{t('bedroomsPlus')}</option>
              </select>

              <select
                className="border rounded-lg px-3 py-2 text-sm bg-white"
                value={filters.minScore}
                onChange={(e) => setFilters({ ...filters, minScore: e.target.value })}
              >
                <option value="">{t('anyScore')}</option>
                <option value="80">{t('scoreExcellent')}</option>
                <option value="70">{t('scoreGreat')}</option>
                <option value="60">{t('scoreGood')}</option>
                <option value="50">{t('scoreAverage')}</option>
              </select>

              <Input
                type="number"
                placeholder={t('minPrice')}
                className="text-sm"
                value={filters.minPrice}
                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
              />

              <Input
                type="number"
                placeholder={t('maxPrice')}
                className="text-sm"
                value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
              />

              <Input
                type="number"
                placeholder={t('minSize')}
                className="text-sm"
                value={filters.minSize}
                onChange={(e) => setFilters({ ...filters, minSize: e.target.value })}
              />

              <Input
                type="number"
                placeholder={t('maxSize')}
                className="text-sm"
                value={filters.maxSize}
                onChange={(e) => setFilters({ ...filters, maxSize: e.target.value })}
              />

              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="flex items-center justify-center gap-1.5 text-sm text-red-600 hover:text-red-700 border border-red-200 rounded-lg px-3 py-2 hover:bg-red-50 transition"
                >
                  <X className="w-4 h-4" />
                  {t('clearAll')}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ms-3 text-gray-600">{t('loadingProperties')}</span>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500 mb-4">{t('errorMessage')}</p>
            <Button onClick={() => window.location.reload()}>{t('retry')}</Button>
          </div>
        ) : (
          <>
            {data?.properties?.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl border">
                <p className="text-gray-500 text-lg mb-2">{t('noResults')}</p>
                <p className="text-gray-400 text-sm mb-6">{t('adjustFilters')}</p>
                <Button onClick={clearFilters}>{t('clearFilters')}</Button>
              </div>
            ) : (
              <>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {data?.properties?.map((property: any) => (
                    <DealCard key={property.id} deal={property} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <button
                      onClick={() => {
                        const newPage = Math.max(1, page - 1);
                        setPage(newPage);
                        syncToUrl(filters, newPage);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={page <= 1}
                      className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 7) {
                        pageNum = i + 1;
                      } else if (page <= 4) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 3) {
                        pageNum = totalPages - 6 + i;
                      } else {
                        pageNum = page - 3 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => {
                            setPage(pageNum);
                            syncToUrl(filters, pageNum);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                            pageNum === page
                              ? 'bg-primary text-white'
                              : 'bg-white border hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => {
                        const newPage = Math.min(totalPages, page + 1);
                        setPage(newPage);
                        syncToUrl(filters, newPage);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={page >= totalPages}
                      className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
