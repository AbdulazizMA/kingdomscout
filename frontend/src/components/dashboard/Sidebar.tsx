import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Home, 
  Heart, 
  Search, 
  Settings,
  CreditCard,
  Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'نظرة عامة', icon: LayoutDashboard },
  { href: '/deals', label: 'العقارات', icon: Home },
  { href: '/dashboard/favorites', label: 'المفضلة', icon: Heart },
  { href: '/dashboard/searches', label: 'البحث المحفوظ', icon: Search },
  { href: '/dashboard/alerts', label: 'التنبيهات', icon: Bell },
  { href: '/dashboard/subscription', label: 'الاشتراك', icon: CreditCard },
  { href: '/dashboard/settings', label: 'الإعدادات', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="bg-white rounded-xl border p-4">
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition",
                isActive 
                  ? "bg-primary/10 text-primary font-medium" 
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
