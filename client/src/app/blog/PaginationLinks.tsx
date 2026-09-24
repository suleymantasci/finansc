import Link from 'next/link';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationLinksProps {
  currentPage: number;
  totalPages: number;
  category?: string | null;
  /**
   * Server-rendered <a> tags (no JS required) — Googlebot crawls them as links.
   * Use ?sayfa=N query param convention to match existing client island.
   */
}

/** Generate page number array with ellipsis for large page counts */
function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | '...')[] = [1];

  if (current > 3) pages.push('...');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push('...');

  pages.push(total);
  return pages;
}

function buildHref(page: number, category?: string | null): string {
  const params = new URLSearchParams();
  if (page > 1) params.set('sayfa', String(page));
  if (category) params.set('kategori', category);
  const qs = params.toString();
  return `/blog${qs ? `?${qs}` : ''}`;
}

export function PaginationLinks({ currentPage, totalPages, category }: PaginationLinksProps) {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(currentPage, totalPages);

  const navButtonClass = cn(
    'flex size-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground',
    'aria-disabled:opacity-30 aria-disabled:pointer-events-none',
  );

  return (
    <nav className="mt-12 flex flex-wrap items-center justify-center gap-1.5" aria-label="Sayfalama">
      {/* First */}
      <Link
        href={buildHref(1, category)}
        aria-disabled={currentPage <= 1}
        className={navButtonClass}
        aria-label="İlk sayfa"
      >
        <ChevronsLeft className="h-4 w-4" />
      </Link>
      {/* Prev */}
      <Link
        href={buildHref(Math.max(1, currentPage - 1), category)}
        aria-disabled={currentPage <= 1}
        className={navButtonClass}
        aria-label="Önceki sayfa"
      >
        <ChevronLeft className="h-4 w-4" />
      </Link>

      {/* Page numbers */}
      {pages.map((p, idx) =>
        p === '...' ? (
          <span
            key={`dots-${idx}`}
            className="flex h-8 w-8 items-center justify-center text-xs text-muted-foreground"
          >
            …
          </span>
        ) : (
          <Link
            key={p}
            href={buildHref(p as number, category)}
            className={cn(
              'num flex size-10 items-center justify-center rounded-full text-[13px] font-medium transition-colors',
              p === currentPage
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground',
            )}
            aria-current={p === currentPage ? 'page' : undefined}
          >
            {p}
          </Link>
        ),
      )}

      {/* Next */}
      <Link
        href={buildHref(Math.min(totalPages, currentPage + 1), category)}
        aria-disabled={currentPage >= totalPages}
        className={navButtonClass}
        aria-label="Sonraki sayfa"
      >
        <ChevronRight className="h-4 w-4" />
      </Link>
      {/* Last */}
      <Link
        href={buildHref(totalPages, category)}
        aria-disabled={currentPage >= totalPages}
        className={navButtonClass}
        aria-label="Son sayfa"
      >
        <ChevronsRight className="h-4 w-4" />
      </Link>
    </nav>
  );
}