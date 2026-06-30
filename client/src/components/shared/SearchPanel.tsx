'use client';

import { Suspense, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, X } from 'lucide-react';
import { SearchForm } from './SearchInput';
import { cn } from '@/lib/utils';

/**
 * SearchPanel — Header arama icin modern search panel.
 *
 * UX (Algolia DocSearch / Linear style):
 * - Magnifier icon button header'da, profile + theme icon'dan once (sol).
 * - Icon tiklandiginda overlay acilir: header ALTINDA (mt-4) centered
 *   search input + backdrop blur ile sayfa bulaniklastirilir.
 * - Esc, X butonu, veya backdrop tiklamasi ile kapanir.
 * - Auto-focus: input tiklamadan focuslanir.
 * - Submit → /arama?q=... sayfasina yonlendirir.
 *
 * Generic YASAK kurali: Bu, header'a ozgu spesifik bir UI component'i
 * — baska sayfada kullanilmiyor. Tek dosya, tek amac.
 */

interface SearchPanelProps {
  className?: string;
}

export function SearchPanel({ className }: SearchPanelProps) {
  return (
    <Suspense fallback={<SearchPanelFallback />}>
      <SearchPanelInner className={className} />
    </Suspense>
  );
}

function SearchPanelFallback() {
  // useSearchParams Suspense fallback — sadece icon goster, overlay degil.
  return (
    <button
      type="button"
      aria-label="Ara"
      className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
      disabled
    >
      <Search className="h-4 w-4" />
    </button>
  );
}

function SearchPanelInner({ className }: SearchPanelProps) {
  const [open, setOpen] = useState<boolean>(false);

  // Esc ile kapat, body scroll lock.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  // SSR-safe portal target — body'ye append. Header sticky + z-40
  // stacking context overlay'i viewport'a genişletmesini
  // engelliyordu, portal bu sorunu çözer (DOM ağacında body's
  // sonunda yer alır, viewport'a tam yayılır).
  const overlay: JSX.Element | null = open ? (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Site içi arama"
      className="fixed inset-0 z-[100]"
    >
      {/* Backdrop — tüm ekranı kaplar (%60 siyah + blur). */}
      <button
        type="button"
        aria-label="Aramayı kapat"
        className="absolute inset-0 cursor-default bg-black/60 opacity-100 backdrop-blur-md dark:bg-black/80"
        onClick={() => setOpen(false)}
      />

      {/* Panel — header altinda centered */}
      <div className="relative mx-auto mt-[max(80px,calc(3.5rem+1rem))] flex w-full max-w-2xl justify-center px-4">
        <div className="w-full overflow-hidden rounded-xl border border-border bg-background shadow-2xl ring-1 ring-black/5 transition-all duration-200 ease-out">
          <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Sitede ara</span>
            <button
              type="button"
              aria-label="Kapat"
              onClick={() => setOpen(false)}
              className="ml-auto rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-3">
            <SearchForm
              autoFocus
              className="w-full"
              onSubmit={() => setOpen(false)}
              onClose={() => setOpen(false)}
            />
          </div>
          <div className="border-t border-border bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
            <kbd className="rounded border border-border bg-background px-1.5 py-0.5 text-[10px]">Esc</kbd>
            {' '}ile kapat, {' '}
            <kbd className="rounded border border-border bg-background px-1.5 py-0.5 text-[10px]">Enter</kbd>
            {' '}ile ara
          </div>
        </div>
      </div>
    </div>
  ) : null;

  // createPortal: Overlay body'ye append, header stacking context'ten
  // bagimsiz. useEffect mount/unmount SSR-safe kontrolu.
  const portalTarget: HTMLElement | null = typeof document !== 'undefined'
    ? document.body
    : null;

  return (
    <>
      <button
        type="button"
        aria-label="Site içi aramayı aç"
        onClick={() => setOpen(true)}
        className={cn(
          'rounded-lg p-2 text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground',
          className,
        )}
      >
        <Search className="h-4 w-4" />
      </button>

      {/* Portal — overlay body's sonuna, header stacking context
          disinda render. Header sticky z-index 40 sorunu
          (overlay sadece header'a yayiliyordu) bu sayde cozuluyor. */}
      {open && portalTarget ? createPortal(overlay, portalTarget) : null}
    </>
  );
}
