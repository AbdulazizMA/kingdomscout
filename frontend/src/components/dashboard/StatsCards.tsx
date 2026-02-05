import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { TrendingUp, Heart, Search, Bell } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export function StatsCards() {
  const { data } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/api/user/dashboard`);
      return response.data;
    },
  });

  const stats = data?.stats || {};

  const cards = [
    {
      label: 'صفقات جديدة اليوم',
      value: stats.newDealsCount || 0,
      icon: TrendingUp,
      color: 'bg-green-500',
    },
    {
      label: 'مطابقة لك',
      value: stats.matchedDeals || 0,
      icon: Bell,
      color: 'bg-blue-500',
    },
    {
      label: 'المفضلة',
      value: stats.favoritesCount || 0,
      icon: Heart,
      color: 'bg-red-500',
    },
    {
      label: 'بحث محفوظ',
      value: stats.searchesCount || 0,
      icon: Search,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="bg-white p-6 rounded-xl border">
            <div className="flex items-center gap-4">
              <div className={`${card.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold">{card.value}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
