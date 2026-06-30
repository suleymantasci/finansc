'use client';

import { Suspense, useState, useEffect, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  className?: string;
}

// Outer — Suspense wrapper. Inner useSearchParams kullandigi icin
// zorunlu (Next 14+ static export / prerender).
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
        placeholder="Ara\u00e7, d\u00f6viz, alt\u0131n, hisse, blog\u2026"
        className="w-40 rounded-md border border-border bg-background px-3 py-1.5 text-sm sm:w-56"
      />
    </div>
  );
}

function SearchInputInner({ className }: SearchInputProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState<string>(searchParams.get('q') ?? '');

  useEffect(() => {
    setQ(searchParams.get('q') ?? '');
  }, [searchParams]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const trimmed: string = q.trim();
    if (trimmed.length < 2) return;
    router.push('/arama?q=' + encodeURIComponent(trimmed));
  };

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className={cn('flex items-center gap-2', className)}
    >
      <label htmlFor="header-search" className="sr-only">
        Sitede ara
      </label>
      <input
        id="header-search"
        type="search"
        inputMode="search"
        autoComplete="off"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Ara\u00e7, d\u00f6viz, alt\u0131n, hisse, blog\u2026"
        className="w-40 rounded-md border border-border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40 sm:w-56"
      />
      <button
        type="submit"
        aria-label="Ara"
        disabled={q.trim().length < 2}
        className="rounded-md border border-border bg-card px-2 py-1.5 text-sm hover:bg-muted disabled:opacity-40"
      >
        Ara
      </button>
    </form>
  );
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
