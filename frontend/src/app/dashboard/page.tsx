'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { RecentDeals } from '@/components/dashboard/RecentDeals';
import { SavedSearches } from '@/components/dashboard/SavedSearches';

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <Sidebar />
          </div>

          <div className="lg:col-span-3 space-y-8">
            <div>
              <h1 className="text-2xl font-bold">لوحة التحكم</h1>
              <p className="text-gray-600">مرحباً بعودتك! إليك ما يحدث مع عقاراتك.</p>
            </div>

            <StatsCards />

            <div className="grid md:grid-cols-2 gap-8">
              <RecentDeals />
              <SavedSearches />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
