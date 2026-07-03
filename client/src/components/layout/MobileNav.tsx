'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Coins, TrendingUp, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';

// Icon tipleri — sadece zaten mevcut icon'lar kullanılıyor (lucide-react 0.512
// uyumluluğu için). Döviz → Coins (sarı altınla aynı kategori), Bilgi Merkezi
// → Calculator (placeholder; orijinal tasarımda yeniden ayarlanabilir).
const MOBILE_TABS = [
  { label: 'Altın', href: '/altin', icon: Coins },
  { label: 'Döviz', href: '/doviz', icon: Coins },
  { label: 'Borsa', href: '/borsa', icon: TrendingUp },
  { label: 'Araçlar', href: '/araclar', icon: Calculator },
  { label: 'Bilgi', href: '/blog', icon: Calculator },
] as const;

function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/90 backdrop-blur-md md:hidden">
      <div className="flex items-center justify-around py-1.5">
        {MOBILE_TABS.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
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