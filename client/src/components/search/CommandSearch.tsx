'use client';

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Search, X, Calculator, Coins, Landmark, LineChart, Building2, CornerDownLeft } from 'lucide-react';
import { searchStatic, type SearchItem } from '@/lib/search/static-index';
import { cn } from '@/lib/utils';

/**
 * Komut paleti tarzı arama.
 * - Yazarken statik indeksten anında öneri (0 ağ isteği)
 * - ↑/↓ ile gezin, Enter ile git; seçim yoksa /arama?q= sonuç sayfası
 * - WAI-ARIA combobox deseni (listbox + aria-activedescendant)
 */

const TYPE_META: Record<SearchItem['type'], { label: string; icon: typeof Search }> = {
  arac: { label: 'Araç', icon: Calculator },
  altin: { label: 'Altın', icon: Coins },
  doviz: { label: 'Döviz', icon: Landmark },
  endeks: { label: 'Endeks', icon: LineChart },
  hisse: { label: 'Hisse', icon: Building2 },
};

/** Boş sorguda gösterilen kısayollar — en çok aranan sayfalar */
export const POPULAR_LINKS: { label: string; href: string; type: SearchItem['type'] }[] = [
  { label: 'Gram altın', href: '/altin/gram-altin', type: 'altin' },
  { label: 'Dolar kuru', href: '/doviz/dolar', type: 'doviz' },
  { label: 'Kredi hesaplama', href: '/araclar/ihtiyac-kredisi', type: 'arac' },
  { label: 'Maaş hesaplama', href: '/araclar/maas-hesaplama', type: 'arac' },
  { label: 'BIST 100', href: '/borsa/endeksler/XU100', type: 'endeks' },
  { label: 'THYAO', href: '/borsa/hisseler/THYAO', type: 'hisse' },
];

interface Option {
  key: string;
  title: string;
  desc?: string;
  href: string;
  type: SearchItem['type'];
}

function SearchBox({
  autoFocus,
  size = 'lg',
  onNavigate,
  onEscape,
}: {
  autoFocus?: boolean;
  size?: 'lg' | 'md';
  onNavigate?: () => void;
  onEscape?: () => void;
}) {
  const router = useRouter();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const options: Option[] = useMemo(() => {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      return POPULAR_LINKS.map((p) => ({ key: p.href, title: p.label, href: p.href, type: p.type }));
    }
    return searchStatic(trimmed, 8).map((i) => ({
      key: i.url,
      title: i.title,
      desc: i.desc,
      href: i.url,
      type: i.type,
    }));
  }, [q]);

  useEffect(() => setActive(0), [q]);
  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  function go(href: string) {
    setOpen(false);
    onNavigate?.();
    router.push(href);
  }

  function submitQuery() {
    const trimmed = q.trim();
    if (trimmed.length < 2) return;
    go('/arama?q=' + encodeURIComponent(trimmed));
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(options.length, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      // Son satır "tüm sonuçlar"; yazılı sorgu yoksa ilk kısayola git
      if (open && active < options.length) go(options[active].href);
      else submitQuery();
    } else if (e.key === 'Escape') {
      // Palette içindeyse tek Esc paleti kapatır; hero'da sadece öneri listesini
      if (onEscape) onEscape();
      else setOpen(false);
    }
  }

  const showList = open && options.length > 0;
  const hasQuery = q.trim().length >= 2;
  const activeId = showList ? `${listId}-opt-${active}` : undefined;

  return (
    <div className="relative">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submitQuery();
        }}
        className={cn(
          'group relative flex items-center gap-3 rounded-full border bg-card/80 backdrop-blur transition-[border-color,box-shadow]',
          'border-primary/40 shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-primary)_12%,transparent),0_18px_60px_-20px_color-mix(in_srgb,var(--color-primary)_45%,transparent)]',
          'focus-within:border-primary focus-within:shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-primary)_18%,transparent),0_18px_60px_-20px_color-mix(in_srgb,var(--color-primary)_55%,transparent)]',
          size === 'lg' ? 'h-14 pl-5 pr-2 sm:h-16 sm:pl-6' : 'h-12 pl-4 pr-1.5',
        )}
      >
        <Search className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <label htmlFor={`${listId}-input`} className="sr-only">
          Sitede ara: altın, döviz, hisse, hesaplama aracı
        </label>
        <input
          ref={inputRef}
          id={`${listId}-input`}
          type="search"
          role="combobox"
          aria-expanded={showList}
          aria-controls={`${listId}-list`}
          aria-activedescendant={activeId}
          aria-autocomplete="list"
          autoComplete="off"
          enterKeyHint="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKeyDown}
          placeholder="Ara: gram altın, kredi, THYAO…"
          className={cn(
            'min-w-0 flex-1 bg-transparent text-foreground placeholder:text-muted-foreground/80 focus:outline-none focus-visible:outline-none [&::-webkit-search-cancel-button]:hidden',
            size === 'lg' ? 'text-base sm:text-lg' : 'text-[15px]',
          )}
        />
        <kbd className="hidden shrink-0 items-center gap-0.5 rounded-md border border-border bg-background/60 px-2 py-1 text-[11px] font-medium text-muted-foreground sm:flex">
          <span aria-hidden="true">⌘</span>K
        </kbd>
        <button
          type="submit"
          aria-label="Ara"
          className={cn(
            'grid shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 active:scale-95',
            size === 'lg' ? 'h-10 w-10 sm:h-11 sm:w-11' : 'h-9 w-9',
          )}
        >
          <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </form>

      {showList && (
        <div
          className="absolute inset-x-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-border bg-elevated/95 shadow-2xl backdrop-blur-xl"
          onMouseDown={(e) => e.preventDefault()}
        >
          <p className="eyebrow px-4 pt-3 pb-1 text-muted-foreground">{hasQuery ? 'Sonuçlar' : 'Popüler'}</p>
          <ul id={`${listId}-list`} role="listbox" aria-label="Arama önerileri" className="max-h-[50vh] overflow-y-auto p-1.5">
            {options.map((o, i) => {
              const meta = TYPE_META[o.type];
              const Icon = meta.icon;
              return (
                <li
                  key={o.key}
                  id={`${listId}-opt-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(o.href)}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5',
                    i === active ? 'bg-primary/10' : 'hover:bg-surface-hover',
                  )}
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border bg-card text-primary">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">{o.title}</span>
                    {o.desc && <span className="block truncate text-xs text-muted-foreground">{o.desc}</span>}
                  </span>
                  <span className="shrink-0 text-[11px] text-muted-foreground">{meta.label}</span>
                </li>
              );
            })}
            {hasQuery && (
              <li
                id={`${listId}-opt-${options.length}`}
                role="option"
                aria-selected={active === options.length}
                onMouseEnter={() => setActive(options.length)}
                onClick={submitQuery}
                className={cn(
                  'mt-1 flex cursor-pointer items-center gap-2 rounded-xl border-t border-border px-3 py-2.5 text-sm',
                  active === options.length ? 'bg-primary/10 text-primary' : 'text-muted-foreground',
                )}
              >
                <Search className="h-4 w-4" aria-hidden="true" />
                <span>
                  “<span className="text-foreground">{q.trim()}</span>” için tüm sonuçlar
                </span>
                <CornerDownLeft className="ml-auto h-3.5 w-3.5" aria-hidden="true" />
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Hero'daki büyük arama kutusu */
export function HeroSearch() {
  return <SearchBox size="lg" />;
}

/** Header'daki tetikleyici + ⌘K / Ctrl+K / "/" ile açılan palet */
export function CommandPalette({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === '/' && !typing) {
        e.preventDefault();
        setOpen(true);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const overlay: ReactNode = (
    <div role="dialog" aria-modal="true" aria-label="Site içi arama" className="fixed inset-0 z-[100]">
      <button
        type="button"
        aria-label="Aramayı kapat"
        tabIndex={-1}
        className="absolute inset-0 cursor-default bg-background/70 backdrop-blur-md"
        onClick={() => setOpen(false)}
      />
      <div className="relative mx-auto mt-[12vh] w-full max-w-2xl px-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="eyebrow text-muted-foreground">Ne arıyorsunuz?</p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" /> Kapat <kbd className="ml-1 text-[10px]">Esc</kbd>
          </button>
        </div>
        <SearchBox size="md" autoFocus onNavigate={() => setOpen(false)} onEscape={() => setOpen(false)} />
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Site içi aramayı aç (Ctrl+K)"
        aria-keyshortcuts="Control+K Meta+K"
        className={cn(
          'flex h-9 items-center gap-2 rounded-full border border-border bg-card/60 pl-3 pr-1.5 text-sm text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground',
          className,
        )}
      >
        <Search className="h-4 w-4" aria-hidden="true" />
        <span className="hidden lg:inline">Ara…</span>
        <kbd className="hidden rounded-full border border-border bg-background/60 px-2 py-0.5 text-[10px] font-medium lg:inline">⌘K</kbd>
      </button>
      {open && mounted ? createPortal(overlay, document.body) : null}
    </>
  );
}

/** Hızlı erişim çipleri (hero altında) */
export function QuickChips({ className }: { className?: string }) {
  return (
    <ul className={cn('flex flex-wrap gap-2', className)} aria-label="Popüler aramalar">
      {POPULAR_LINKS.map((p) => (
        <li key={p.href}>
          <Link
            href={p.href}
            className="inline-flex h-8 items-center rounded-full border border-border bg-card/50 px-3.5 text-[13px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
          >
            {p.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
