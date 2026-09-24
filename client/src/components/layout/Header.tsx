'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Sun, Moon, User } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { NAV_ITEMS } from '@/lib/constants';
import { CommandPalette } from '@/components/search/CommandSearch';
import { useAuthStore } from '@/stores/auth.store';
import { LiveTicker } from './LiveTicker';
import { DataMenu } from './DataMenu';
import { MobileMenuDrawer } from './MobileMenuDrawer';
import { Logo } from './Logo';

/** Güneş/ay anahtarı — tema durumunu görsel olarak da gösterir */
function ThemeSwitch() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = !mounted || resolvedTheme !== 'light';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Koyu tema"
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      className="relative flex h-9 w-[4.25rem] shrink-0 items-center rounded-full border border-border bg-card/60 px-1 transition-colors hover:border-border-strong"
    >
      <Sun className={cn('absolute left-2 h-3.5 w-3.5 transition-opacity', dark ? 'opacity-40' : 'opacity-0')} aria-hidden="true" />
      <Moon className={cn('absolute right-2 h-3.5 w-3.5 transition-opacity', dark ? 'opacity-0' : 'opacity-40')} aria-hidden="true" />
      <span
        className={cn(
          'grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground shadow transition-transform duration-300',
          dark ? 'translate-x-[1.95rem]' : 'translate-x-0',
        )}
        aria-hidden="true"
      >
        {dark ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
      </span>
    </button>
  );
}

function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuthStore();

  return (
    <header className="sticky top-0 z-40">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-[200] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        İçeriğe geç
      </a>

      <LiveTicker />

      <div className="border-b border-border bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/85">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-3 px-4 sm:gap-6 lg:px-8">
          <Logo />

          <nav aria-label="Ana menü" className="hidden items-center gap-0.5 whitespace-nowrap lg:flex">
            <DataMenu items={NAV_ITEMS} pathname={pathname || ''} />
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <CommandPalette />
            <ThemeSwitch />

            {user ? (
              <Link
                href="/hesabim"
                aria-label="Hesabım"
                className="hidden h-9 w-9 place-items-center sm:grid rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground"
              >
                <User className="h-4 w-4" aria-hidden="true" />
              </Link>
            ) : (
              <Link
                href="/giris"
                className="hidden h-9 items-center rounded-full px-3 text-sm text-muted-foreground transition-colors hover:text-foreground xl:flex"
              >
                Giriş yap
              </Link>
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground lg:hidden"
              aria-label={mobileOpen ? 'Menüyü kapat' : 'Menüyü aç'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-4 w-4" aria-hidden="true" /> : <Menu className="h-4 w-4" aria-hidden="true" />}
            </button>
          </div>
        </div>

        <MobileMenuDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />
      </div>
    </header>
  );
}

export { Header };
