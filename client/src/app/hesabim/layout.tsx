'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Heart, Settings, LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/hesabim', label: 'Hesabım', icon: User },
  { href: '/hesabim/favoriler', label: 'Favoriler', icon: Heart },
  { href: '/hesabim/ayarlar', label: 'Ayarlar', icon: Settings },
];

export default function HesabimLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8 pb-20 md:pb-8">
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar */}
        <aside className="w-full lg:w-56 shrink-0">
          <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap',
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground',
                  )}
                >
                  <Icon className="h-4 w-4" /> {item.label}
                </Link>
              );
            })}
            <button
              onClick={() => { clearAuth(); window.location.href = '/'; }}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-danger transition-colors hover:bg-danger/10 whitespace-nowrap"
            >
              <LogOut className="h-4 w-4" /> Çıkış Yap
            </button>
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
