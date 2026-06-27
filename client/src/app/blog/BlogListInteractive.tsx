'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

interface CategoryFilterProps {
  /** Initial category list, computed server-side from latest posts. */
  categories: string[];
  /** Currently active category from URL (already known at server render). */
  activeCategory: string | null;
}

/**
 * Category filter (client island). Only renders after hydration if the
 * user wants to switch category — initial render is server-rendered
 * pagination so Googlebot sees the links.
 */
export function BlogListInteractive({ categories, activeCategory }: CategoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (categories.length === 0) return null;

  const navigate = (newCategory: string | null) => {
    const page = Number(searchParams.get('sayfa')) || 1;
    const params = new URLSearchParams();
    if (page > 1) params.set('sayfa', String(page));
    if (newCategory) params.set('kategori', newCategory);
    const qs = params.toString();
    router.push(`/blog${qs ? `?${qs}` : ''}`, { scroll: false });
  };

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      <button
        onClick={() => navigate(null)}
        className={cn(
          'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
          !activeCategory
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground hover:bg-surface-hover',
        )}
      >
        Tümü
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => navigate(cat)}
          className={cn(
            'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
            activeCategory === cat
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-surface-hover',
          )}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}