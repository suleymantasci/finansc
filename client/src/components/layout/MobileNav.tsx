'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Coins, TrendingUp, Calculator, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const MOBILE_TABS = [
  { label: 'Ana Sayfa', href: '/', icon: Home },
  { label: 'Altın', href: '/altin', icon: Coins },
  { label: 'Borsa', href: '/borsa', icon: TrendingUp },
  { label: 'Araçlar', href: '/araclar', icon: Calculator },
  { label: 'Profil', href: '/hesabim', icon: User },
] as const;

function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/90 backdrop-blur-md md:hidden">
      <div className="flex items-center justify-around py-1.5">
        {MOBILE_TABS.map((tab) => {
          const isActive = tab.href === '/'
            ? pathname === '/'
            : pathname.startsWith(tab.href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex min-w-[44px] flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[10px] font-medium transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground',
              )}
            >
              <Icon className={cn('h-5 w-5', isActive && 'stroke-[2.5]')} />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export { MobileNav };
