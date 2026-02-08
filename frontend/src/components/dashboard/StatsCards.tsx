'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import axios from 'axios';
import { TrendingUp, Home, MapPin, Clock } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export function StatsCards() {
  const t = useTranslations('dashboard');
  const { data } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/api/properties/meta/stats`);
      return response.data;
    },
  });

  const cards = [
    {
      label: t('totalProperties'),
      value: data?.totalProperties || 0,
      icon: Home,
      color: 'bg-blue-500',
    },
    {
      label: t('hotDeals'),
      value: data?.totalHotDeals || 0,
      icon: TrendingUp,
      color: 'bg-red-500',
    },
    {
      label: t('goodDeals'),
      value: data?.totalDeals || 0,
      icon: TrendingUp,
      color: 'bg-orange-500',
    },
    {
      label: t('citiesCovered'),
      value: data?.citiesCount || 0,
      icon: MapPin,
      color: 'bg-green-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="bg-white p-5 rounded-xl border">
            <div className="flex items-center gap-3">
              <div className={`${card.color} w-10 h-10 rounded-lg flex items-center justify-center`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{card.label}</p>
                <p className="text-xl font-bold">{card.value}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
