'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { DealCard } from '@/components/deals/DealCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Filter } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function DealsPage() {
  const [filters, setFilters] = useState({
    city: '',
    type: '',
    minPrice: '',
    maxPrice: '',
    dealType: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['deals', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.city) params.append('city', filters.city);
      if (filters.type) params.append('type', filters.type);
      if (filters.dealType) params.append('dealType', filters.dealType);
      
      const response = await axios.get(`${API_URL}/api/properties?${params}`);
      return response.data;
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Property Deals</h1>
          <p className="text-gray-600 mt-2">
            Discover undervalued properties across Saudi Arabia.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg border mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5" />
            <span className="font-medium">Filters</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <select
              className="border rounded-md px-3 py-2"
              value={filters.city}
              onChange={(e) => setFilters({ ...filters, city: e.target.value })}
            >
              <option value="">All Cities</option>
              <option value="riyadh">Riyadh</option>
              <option value="jeddah">Jeddah</option>
              <option value="makkah">Makkah</option>
              <option value="madinah">Madinah</option>
            </select>

            <select
              className="border rounded-md px-3 py-2"
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            >
              <option value="">All Types</option>
              <option value="apartment">Apartment</option>
              <option value="villa">Villa</option>
              <option value="land">Land</option>
              <option value="commercial">Commercial</option>
            </select>

            <select
              className="border rounded-md px-3 py-2"
              value={filters.dealType}
              onChange={(e) => setFilters({ ...filters, dealType: e.target.value })}
            >
              <option value="">All Deals</option>
              <option value="hot_deal">🔥 Hot Deals</option>
              <option value="good_deal">⭐ Good Deals</option>
            </select>

            <Input
              type="number"
              placeholder="Min Price (SAR)"
              value={filters.minPrice}
              onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
            />

            <Input
              type="number"
              placeholder="Max Price (SAR)"
              value={filters.maxPrice}
              onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
            />
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid md:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-96 bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="mb-4 text-gray-600">
              Found {data?.pagination?.total || 0} properties
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {data?.properties?.map((property: any) => (
                <DealCard key={property.id} deal={property} />
              ))}
            </div>
            
            {/* Pagination */}
            {data?.pagination && data.pagination.pages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                {Array.from({ length: Math.min(data.pagination.pages, 10) }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className={`px-4 py-2 rounded-lg ${
                      page === data.pagination.page
                        ? 'bg-primary text-white'
                        : 'bg-white border hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
