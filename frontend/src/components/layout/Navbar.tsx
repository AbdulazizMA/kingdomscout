'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Menu, X, Home } from 'lucide-react';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const { logout } = useAuthStore();

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">
              Kingdom
              <span className="text-primary">Scout</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/deals" className="text-gray-600 hover:text-primary transition">
              عقارات للبيع
            </Link>
            <Link href="/#how-it-works" className="text-gray-600 hover:text-primary transition">
              كيف يعمل
            </Link>
            <Link href="/#faq" className="text-gray-600 hover:text-primary transition">
              الأسئلة الشائعة
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost">لوحة التحكم</Button>
                </Link>
                <Button variant="outline" onClick={logout}>
                  تسجيل الخروج
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">تسجيل الدخول</Button>
                </Link>
                <Link href="/register">
                  <Button>حساب مجاني</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-4">
              <Link href="/deals" className="text-gray-600">عقارات للبيع</Link>
              <Link href="/#how-it-works" className="text-gray-600">كيف يعمل</Link>
              <Link href="/#faq" className="text-gray-600">الأسئلة الشائعة</Link>
              {isAuthenticated ? (
                <>
                  <Link href="/dashboard">لوحة التحكم</Link>
                  <button onClick={logout}>تسجيل الخروج</button>
                </>
              ) : (
                <>
                  <Link href="/login">تسجيل الدخول</Link>
                  <Link href="/register">حساب مجاني</Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
