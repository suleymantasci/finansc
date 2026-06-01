'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Wrench, Megaphone, Users, ArrowLeft, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/blog', label: 'Bilgi Merkezi', icon: FileText },
  { href: '/admin/araclar', label: 'Araçlar', icon: Wrench },
  { href: '/admin/bildirimler', label: 'Hata Bildirimleri', icon: AlertTriangle },
  { href: '/admin/reklamlar', label: 'Reklamlar', icon: Megaphone },
  { href: '/admin/kullanicilar', label: 'Kullanıcılar', icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8 pb-20 md:pb-8">
      <div className="mb-4">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Siteye Dön
        </Link>
      </div>
      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="w-full lg:w-52 shrink-0">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Admin Panel</p>
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
          </nav>
        </aside>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
