'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import axios from 'axios';
import { DealCard } from '@/components/deals/DealCard';
import { Button } from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function FeaturedDeals() {
  const { data, isLoading } = useQuery({
    queryKey: ['featured-deals'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/api/properties?limit=6&sortBy=score`);
      return response.data;
    },
  });

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              صفقات اليوم المميزة
            </h2>
            <p className="text-gray-600 max-w-2xl">
              هذه هي أعلى الصفقات تقييماً التي حددها نظامنا اليوم.
              عقارات بأسعار أقل من السوق بنسبة 10-30%.
            </p>
          </div>
          <Link href="/deals" className="hidden sm:block">
            <Button variant="outline" className="gap-2">
              عرض جميع العقارات
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-96 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-3 gap-8">
              {data?.properties?.slice(0, 6).map((property: any) => (
                <DealCard key={property.id} deal={property} />
              ))}
            </div>

            <div className="mt-8 text-center">
              <Link href="/deals">
                <Button variant="outline" size="lg" className="gap-2">
                  عرض جميع العقارات
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
