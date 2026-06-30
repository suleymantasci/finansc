'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Sun, Moon, LogIn, User } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { NAV_ITEMS, SITE_NAME } from '@/lib/constants';
import { SearchPanel } from '@/components/shared/SearchPanel';
import { useAuthStore } from '@/stores/auth.store';
import { LiveTicker } from './LiveTicker';
import { DataMenu } from './DataMenu';

function Header() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-40">
      {/* Ticker Strip */}
      <LiveTicker />

      {/* Main Header */}
      <div className="border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-extrabold tracking-tight text-primary">
              Finans
            </span>
            <span className="text-xl font-extrabold tracking-tight text-foreground">
              Çözüm
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 md:flex">
            <DataMenu items={NAV_ITEMS} pathname={pathname || ''} />
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Search — magnifier icon + overlay (modern Algolia/Linear style) */}
            <SearchPanel />

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
              aria-label="Tema değiştir"
            >
              {mounted ? (
                theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </button>

            {/* Auth */}
            {user ? (
              <Link
                href="/hesabim"
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
              >
                <User className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                href="/giris"
                className="hidden items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 md:flex"
              >
                <LogIn className="h-4 w-4" />
                Giriş Yap
              </Link>
            )}

            {/* Mobile Menu */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-surface-hover md:hidden"
              aria-label="Menü"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Dropdown */}
        {mobileOpen && (
          <nav className="border-t border-border bg-background px-4 py-3 md:hidden">
            <DataMenu items={NAV_ITEMS} pathname={pathname || ''} />
            {!user && (
              <Link
                href="/giris"
                onClick={() => setMobileOpen(false)}
                className="mt-2 block rounded-lg bg-primary px-3 py-2.5 text-center text-sm font-medium text-primary-foreground"
              >
                Giriş Yap
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}

export { Header };
