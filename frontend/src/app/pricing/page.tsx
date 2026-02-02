'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Check, ArrowLeft } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

const features = [
  'وصول غير محدود للعقارات',
  'تنبيهات فورية (بريد + تلغرام)',
  'حفظ العقارات المفضلة',
  'رسم بياني لتاريخ الأسعار',
  'فلاتر متقدمة (المدينة، النوع، السعر، المساحة)',
  'إشعارات بالعقارات الجديدة',
  '100% مجاني - لا يوجد اشتراك',
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              مجاني بالكامل
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              KingdomScout مجاني 100%. لا اشتراكات، لا رسوم خفية.
              احصل على جميع الميزات مجاناً.
            </p>
          </div>

          <div className="bg-primary text-white rounded-2xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="inline-block bg-white/20 text-white text-sm font-medium px-4 py-1 rounded-full mb-4">
                مجاني بالكامل
              </div>
              
              <h2 className="text-2xl font-bold mb-2">جميع الميزات مجاناً</h2>
              <p className="text-white/80 mb-6">
                كل ما تحتاجه للعثور على أفضل الصفقات العقارية
              </p>

              <div className="mb-2">
                <span className="text-5xl font-bold">مجاني</span>
              </div>
              <p className="text-white/60 text-sm">
                لا يوجد اشتراك شهري
              </p>
            </div>

            <ul className="space-y-4 mb-8 max-w-md mx-auto">
              {features.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <Check className="w-5 h-5 flex-shrink-0 text-white" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="text-center space-y-4">
              <Link href="/deals">
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full sm:w-auto px-12 gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  تصفح العقارات الآن
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
