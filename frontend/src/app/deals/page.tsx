'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { DealCard } from '@/components/deals/DealCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Filter, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

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
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    city: '',
    type: '',
    minPrice: '',
    maxPrice: '',
    dealType: '',
    sortBy: 'score',
    sortOrder: 'desc',
  });

  // Fetch cities from API
  const { data: citiesData } = useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/api/properties/meta/cities`);
      return response.data;
    },
    staleTime: 1000 * 60 * 30, // 30 min cache
  });

  // Fetch property types from API
  const { data: typesData } = useQuery({
    queryKey: ['propertyTypes'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/api/properties/meta/types`);
      return response.data;
    },
    staleTime: 1000 * 60 * 30,
  });

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  // Fetch properties
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

      const response = await axios.get(`${API_URL}/api/properties?${params}`);
      return response.data;
    },
  });

  const cities: City[] = citiesData?.cities || [];
  const propertyTypes: PropertyType[] = typesData?.types || [];
  const totalPages = data?.pagination?.pages || 1;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Property Deals</h1>
          <p className="text-gray-600 mt-2">
            Discover undervalued properties across Saudi Arabia from aqar.fm, bayut.sa, and haraj.com.sa
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg border mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5" />
            <span className="font-medium">Filters</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <select
              className="border rounded-md px-3 py-2 text-sm"
              value={filters.city}
              onChange={(e) => setFilters({ ...filters, city: e.target.value })}
            >
              <option value="">All Cities</option>
              {cities.map((city) => (
                <option key={city.slug} value={city.slug}>
                  {city.nameEn}
                </option>
              ))}
            </select>

            <select
              className="border rounded-md px-3 py-2 text-sm"
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            >
              <option value="">All Types</option>
              {propertyTypes.map((type) => (
                <option key={type.slug} value={type.slug}>
                  {type.nameEn}
                </option>
              ))}
            </select>

            <select
              className="border rounded-md px-3 py-2 text-sm"
              value={filters.dealType}
              onChange={(e) => setFilters({ ...filters, dealType: e.target.value })}
            >
              <option value="">All Deals</option>
              <option value="hot_deal">Hot Deals</option>
              <option value="good_deal">Good Deals</option>
              <option value="fair_price">Fair Price</option>
            </select>

            <select
              className="border rounded-md px-3 py-2 text-sm"
              value={`${filters.sortBy}_${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('_');
                setFilters({ ...filters, sortBy, sortOrder });
              }}
            >
              <option value="score_desc">Best Score</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="date_desc">Newest First</option>
              <option value="price_per_sqm_asc">Best Price/m2</option>
            </select>

            <Input
              type="number"
              placeholder="Min Price (SAR)"
              className="text-sm"
              value={filters.minPrice}
              onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
            />

            <Input
              type="number"
              placeholder="Max Price (SAR)"
              className="text-sm"
              value={filters.maxPrice}
              onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
            />
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-gray-600">Loading properties...</span>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-red-500 mb-4">Failed to load properties. Please try again.</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <span className="text-gray-600">
                Found {data?.pagination?.total || 0} properties
              </span>
              {data?.pagination?.pages > 1 && (
                <span className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </span>
              )}
            </div>

            {data?.properties?.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border">
                <p className="text-gray-500 text-lg mb-4">No properties found matching your filters.</p>
                <Button
                  onClick={() => setFilters({ city: '', type: '', minPrice: '', maxPrice: '', dealType: '', sortBy: 'score', sortOrder: 'desc' })}
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data?.properties?.map((property: any) => (
                  <DealCard key={property.id} deal={property} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => {
                    setPage(Math.max(1, page - 1));
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
                    setPage(Math.min(totalPages, page + 1));
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
      </div>

      <Footer />
    </div>
  );
}
