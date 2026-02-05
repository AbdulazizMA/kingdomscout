'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, TrendingDown, Clock, Shield, Search } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 to-white py-20 lg:py-32">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
              <span className="flex h-2 w-2 bg-primary rounded-full ml-2"></span>
              نغطي أكثر من 20 مدينة سعودية
            </div>

            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              اكتشف أفضل
              <br />
              <span className="text-primary">الصفقات العقارية</span>
              <br />
              قبل الجميع
            </h1>

            <p className="text-lg text-gray-600 mb-8 max-w-lg">
              نحلل سوق العقارات السعودي كل 4 ساعات للعثور على عقارات بأسعار أقل من السوق بـ 10-30%. 
              تصفح مجاناً واكتشف الفرص الاستثمارية.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link href="/deals">
                <Button size="lg" className="gap-2">
                  <Search className="w-4 h-4" />
                  تصفح العقارات
                </Button>
              </Link>
              <Link href="/register">
                <Button size="lg" variant="outline">
                  إنشاء حساب مجاني
                </Button>
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-green-500" />
                <span>متوسط 18% أقل من السوق</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <span>تحديث كل 4 ساعات</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-500" />
                <span>إعلانات موثقة فقط</span>
              </div>
            </div>
          </motion.div>

          {/* Hero Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative"
          >
            <div className="relative bg-white rounded-2xl shadow-2xl p-6 border">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b">
                  <div>
                    <h3 className="font-semibold text-lg">آخر الصفقات المضافة</h3>
                    <p className="text-gray-500 text-sm">محدثة يومياً</p>
                  </div>
                  <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                    +12 اليوم
                  </div>
                </div>

                {/* Sample deal items */}
                {[
                  { city: 'الرياض', type: 'فيلا', price: '1,200,000', discount: '22%', area: 'الياسمين' },
                  { city: 'جدة', type: 'شقة', price: '850,000', discount: '15%', area: 'الشاطئ' },
                  { city: 'مكة', type: 'عمارة', price: '2,500,000', discount: '18%', area: 'العزيزية' },
                ].map((deal, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <span className="text-primary font-bold">{deal.city[0]}</span>
                      </div>
                      <div>
                        <p className="font-medium">{deal.type} - {deal.area}</p>
                        <p className="text-gray-500 text-sm">{deal.city}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-primary">{deal.price} ريال</p>
                      <p className="text-green-600 text-sm">{deal.discount} أقل</p>
                    </div>
                  </div>
                ))}

                <Link href="/deals">
                  <Button variant="outline" className="w-full gap-2">
                    عرض جميع الصفقات
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
