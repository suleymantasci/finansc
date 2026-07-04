'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, X } from 'lucide-react';
import { NAV_ITEMS, type NavItem } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';

/**
 * Mobil hamburger drawer — Header'daki ☰ butonu tetikler.
 * Tam ekran overlay, backdrop-blur, scroll kilitli.
 * Desktop'ta gizli (md:hidden).
 *
 * NEDEN createPortal(body)?
 *   Header parent div'inde `backdrop-blur-md` (backdrop-filter) var.
 *   CSS spec: backdrop-filter uygulanan bir element, position:fixed
 *   çocukları için **containing block** olur. Bu durumda drawer
 *   viewport yerine header'ın kendi kutusuna göre konumlanır ve
 *   flex-1 scrollable içerik sıkışıp kaybolur.
 *   createPortal ile drawer <body>'ye taşınır — containing block
 *   viewport olur, sorun kökten çözülür.
 *
 * Yapı:
 * 1. Düz linkler (NAV_ITEMS'da href olanlar) — büyük tap target'lı liste
 * 2. Dropdown item'lar (NAV_ITEMS'da children olanlar) — collapsible
 *    accordion (chevron ▾ rotate)
 * 3. En altta: Giriş / Profil — primary CTA
 */
interface MobileMenuDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function MobileMenuDrawer({ open, onClose }: MobileMenuDrawerProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();

  // SSR uyumluluğu — portal yalnızca client'ta, mount sonrası render
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Route değişince drawer kapansın
  useEffect(() => {
    if (open) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Scroll lock — drawer açıkken body scroll etmesin
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ESC ile kapama
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const directItems = NAV_ITEMS.filter(
    (i): i is Extract<NavItem, { href: string }> => 'href' in i,
  );
  const dropdownItems = NAV_ITEMS.filter(
    (
      i,
    ): i is Extract<
      NavItem,
      { label: string; icon: string; children: { label: string; href: string; description?: string }[] }
    > => 'children' in i,
  );

  const drawer = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Menü"
      className="fixed inset-0 z-[60] md:hidden"
    >
      {/* Backdrop — tıklayınca kapansın */}
      <button
        type="button"
        aria-label="Menüyü kapat"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Panel — sağdan slide-in */}
      <nav className="absolute right-0 top-0 flex h-full w-[85%] max-w-sm flex-col border-l border-border bg-background shadow-2xl">
        {/* Header — başlık + kapat butonu */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
          <span className="text-base font-semibold text-foreground">Menü</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-2 py-2">
          {/* Direkt linkler */}
          <ul className="space-y-1">
            {directItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'flex items-center rounded-lg px-3 py-3 text-base font-medium transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground hover:bg-surface-hover',
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Dropdown gruplar (Veriler) */}
          {dropdownItems.length > 0 && (
            <div className="mt-4 space-y-1 border-t border-border pt-4">
              {dropdownItems.map((item) => (
                <MobileDropdown key={item.label} item={item} pathname={pathname || ''} onClose={onClose} />
              ))}
            </div>
          )}
        </div>

        {/* Footer — Auth CTA */}
        <div className="shrink-0 border-t border-border p-3">
          {user ? (
            <Link
              href="/hesabim"
              onClick={onClose}
              className="block rounded-lg bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Hesabım
            </Link>
          ) : (
            <Link
              href="/giris"
              onClick={onClose}
              className="block rounded-lg bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Giriş Yap
            </Link>
          )}
        </div>
      </nav>
    </div>
  );

  return createPortal(drawer, document.body);
}

/** Mobil için özelleştirilmiş collapsible accordion — desktop'taki hover
 * dropdown'ın aksine dokunmatik için. Tek seferlik toggle (chevron rotate). */
type DropdownNavItem = Extract<
  NavItem,
  { label: string; icon: string; children: { label: string; href: string; description?: string }[] }
>;
interface MobileDropdownChild {
  label: string;
  href: string;
  description?: string;
}

function MobileDropdown({
  item,
  pathname,
  onClose,
}: {
  item: DropdownNavItem;
  pathname: string;
  onClose: () => void;
}) {
  const isChildActive = item.children.some(
    (c: MobileDropdownChild) =>
      pathname === c.href || pathname.startsWith(c.href + '/'),
  );
  const [open, setOpen] = useState(isChildActive);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={cn(
          'flex w-full items-center justify-between rounded-lg px-3 py-3 text-base font-medium transition-colors',
          isChildActive || open
            ? 'bg-primary/10 text-primary'
            : 'text-foreground hover:bg-surface-hover',
        )}
      >
        <span>{item.label}</span>
        <ChevronDown
          className={cn('h-4 w-4 transition-transform', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>
      {open && (
        <ul className="mt-1 ml-2 space-y-0.5 border-l border-border pl-2">
          {item.children.map((child: MobileDropdownChild) => {
            const active =
              pathname === child.href || pathname.startsWith(child.href + '/');
            return (
              <li key={child.href}>
                <Link
                  href={child.href}
                  onClick={onClose}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'block rounded-md px-3 py-2 text-sm transition-colors',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground',
                  )}
                >
                  <span className="font-medium">{child.label}</span>
                  {child.description && (
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {child.description}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}