'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Coins, Banknote, CandlestickChart, Calculator, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

const MOBILE_TABS = [
  { label: 'Altın', href: '/altin', icon: Coins },
  { label: 'Döviz', href: '/doviz', icon: Banknote },
  { label: 'Borsa', href: '/borsa', icon: CandlestickChart },
  { label: 'Araçlar', href: '/araclar', icon: Calculator },
  { label: 'Bilgi', href: '/blog', icon: BookOpen },
] as const;

function MobileNav() {
  const pathname = usePathname() || '';

  return (
    <nav
      aria-label="Alt menü"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
    >
      <ul className="flex items-stretch justify-around px-1">
        {MOBILE_TABS.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'relative flex min-h-[56px] flex-col items-center justify-center gap-1 text-[11px] transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                {isActive && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" aria-hidden="true" />}
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.2 : 1.8} aria-hidden="true" />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export { MobileNav };
