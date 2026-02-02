import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Plus, Bell } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function SavedSearches() {
  const { data } = useQuery({
    queryKey: ['saved-searches'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/api/user/searches`);
      return response.data;
    },
  });

  const searches = data?.searches || [];

  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold">البحث المحفوظ</h3>
        <Link href="/dashboard/searches/new">
          <Button size="sm" variant="outline">
            <Plus className="w-4 h-4 ml-1" />
            جديد
          </Button>
        </Link>
      </div>

      {searches.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>لا يوجد بحث محفوظ بعد</p>
          <Link href="/deals" className="text-primary text-sm">
            تصفح العقارات لإنشاء تنبيه
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {searches.map((search: any) => (
            <div key={search.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">{search.name}</p>
                <p className="text-sm text-gray-500">
                  {search.newDealsCount || 0} صفقات جديدة
                </p>
              </div>
              {search.emailAlerts && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                  التنبيهات مفعلة
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
