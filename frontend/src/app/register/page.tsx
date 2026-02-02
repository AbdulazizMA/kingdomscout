'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan');
  const { register } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await register({
        ...formData,
        preferredLanguage: 'ar'
      });
      toast.success('مرحباً بك في KingdomScout!');
      
      // Redirect to dashboard (subscriptions disabled - now free)
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'فشل إنشاء الحساب');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold">إنشاء حساب جديد</h2>
        <p className="mt-2 text-gray-600">
          لديك حساب بالفعل؟{' '}
          <Link href="/login" className="text-primary hover:underline">
            سجل دخولك
          </Link>
        </p>
        <div className="mt-4 inline-flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
          مجاني 100% - لا يوجد اشتراك
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">الاسم الأول</label>
              <Input
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">الاسم الأخير</label>
              <Input
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">البريد الإلكتروني</label>
            <Input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">رقم الهاتف (اختياري)</label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="05X XXX XXXX"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">كلمة المرور</label>
            <Input
              type="password"
              required
              minLength={8}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="8 أحرف على الأقل"
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب مجاني'}
        </Button>

        <p className="text-xs text-center text-gray-500">
          بالتسجيل، أنت توافق على{' '}
          <Link href="/terms" className="underline">شروط الاستخدام</Link>{' '}
          و{' '}
          <Link href="/privacy" className="underline">سياسة الخصوصية</Link>.
        </p>
      </form>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <Suspense fallback={<div className="text-center">جاري التحميل...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
