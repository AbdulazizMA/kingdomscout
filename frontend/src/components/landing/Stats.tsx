'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { TrendingUp, Users, Home, Clock } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function Stats() {
  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/api/properties/meta/stats`);
      return response.data;
    },
  });

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K+`;
    }
    return `${num}+`;
  };

  const statsData = [
    {
      icon: Home,
      value: stats ? formatNumber(stats.totalProperties) : '...',
      label: 'عقار محلل',
      description: 'كل إعلان يتم فحصه للقيمة',
    },
    {
      icon: TrendingUp,
      value: stats ? formatNumber(stats.totalDeals) : '...',
      label: 'صفقة مكتشفة',
      description: 'أقل من السوق بـ 10% أو أكثر',
    },
    {
      icon: Users,
      value: '15+',
      label: 'مدينة مغطاة',
      description: 'جميع المدن الرئيسية',
    },
    {
      icon: Clock,
      value: '4 ساعات',
      label: 'تردد التحديث',
      description: 'أسرع من المنافسين',
    },
  ];

  return (
    <section className="py-16 bg-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {statsData.map((stat) => (
            <div key={stat.label} className="text-center text-white">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 rounded-xl mb-4">
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="text-3xl lg:text-4xl font-bold mb-1">
                {stat.value}
              </div>
              <div className="font-medium mb-1">{stat.label}</div>
              <div className="text-sm text-white/70">{stat.description}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
