'use client';

import { Suspense, useState, useEffect, useRef, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  className?: string;
}

// Pure form component — heredocumentation, form submit to /arama?q=....
// Outer code: <SearchForm className="..." /> ya da <SearchInput.Inner />
// dogrudan form kendisi (Suspense wrapper icermez). Prefix hard reset
// ile inline yapilir, cunku sadece bu sayfada kullaniliyor (Suleyman
// 'generic YASAK' kurali).
interface SearchFormProps {
  className?: string;
  autoFocus?: boolean;
  onSubmit?: () => void;
  onClose?: () => void;
}

export function SearchForm({ className, autoFocus, onSubmit, onClose }: SearchFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState<string>(searchParams.get('q') ?? '');
  const ref = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setQ(searchParams.get('q') ?? '');
  }, [searchParams]);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  const handle = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const trimmed = q.trim();
    if (trimmed.length < 2) return;
    router.push('/arama?q=' + encodeURIComponent(trimmed));
    onSubmit?.();
  };

  return (
    <form
      onSubmit={handle}
      role="search"
      className={cn('flex items-center gap-2', className)}
    >
      <input
        ref={ref}
        id={autoFocus ? 'overlay-search' : 'header-search'}
        type="search"
        inputMode="search"
        autoComplete="off"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose?.();
        }}
        placeholder="Araç, döviz, altın, hisse, blog…"
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
      <button
        type="submit"
        aria-label="Ara"
        disabled={q.trim().length < 2}
        className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40"
      >
        Ara
      </button>
    </form>
  );
}

// Backward compat — SearchInput eski API'sini koru (form icin).
// Hem Header overlay icin hem sayfada inline kullanilabilir.
// Suspense wrapper GEREKLI (useSearchParams prerender icin).
export function SearchInput(props: SearchInputProps) {
  return (
    <Suspense fallback={<SearchInputFallback {...props} />}>
      <SearchInputInner {...props} />
    </Suspense>
  );
}

function SearchInputFallback({ className }: SearchInputProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <input
        type="search"
        disabled
        placeholder="Araç, döviz, altın, hisse, blog…"
        className="w-40 rounded-md border border-border bg-background px-3 py-1.5 text-sm sm:w-56"
      />
    </div>
  );
}

function SearchInputInner(props: SearchInputProps) {
  return <SearchForm {...props} />;
}

// SearchTrigger + SearchOverlay — header'a eklenecek modern search UX.
// Algolia DocSearch / Linear tarzi: icon tıklanınca overlay acılır,
// sayfanin uzerinde blur + arka plan, header altina centered search input.

export function SearchTrigger() {
  return null;
}

interface SearchResultItemProps {
  href: string;
  type: string;
  title: string;
  desc: string;
}

export function SearchResultItem({ href, type, title, desc }: SearchResultItemProps) {
  return (
    <Link
      href={href}
      className="block rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
    >
      <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
        {type}
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{desc}</p>
    </Link>
  );
}
