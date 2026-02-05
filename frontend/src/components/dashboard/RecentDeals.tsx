import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { ArrowLeft } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export function RecentDeals() {
  const { data } = useQuery({
    queryKey: ['recent-deals'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/api/properties?limit=5&sortBy=date`);
      return response.data;
    },
  });

  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold">أحدث العقارات</h3>
        <Link href="/deals" className="text-sm text-primary flex items-center gap-1">
          عرض الكل
          <ArrowLeft className="w-4 h-4" />
        </Link>
      </div>

      <div className="space-y-4">
        {data?.properties?.slice(0, 5).map((deal: any) => (
          <Link key={deal.id} href={`/deals/${deal.id}`}>
            <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition">
              <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                {deal.mainImageUrl ? (
                  <img
                    src={deal.mainImageUrl}
                    alt={deal.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                    لا صورة
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{deal.title}</p>
                <p className="text-sm text-gray-500">{deal.city?.nameAr || deal.city?.nameEn}</p>
              </div>
              <div className="text-left">
                <p className="font-semibold">{(deal.price / 1000000).toFixed(1)}M</p>
                <p className="text-xs text-green-600">تقييم: {deal.investmentScore || 'N/A'}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
