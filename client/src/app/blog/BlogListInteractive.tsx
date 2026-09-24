import Link from 'next/link';
import { categoryLabel } from '@/lib/blog-categories';
import { cn } from '@/lib/utils';

/**
 * Kategori filtresi — gerçek bağlantılar (JS gerekmez, arama motoru tarar).
 * categories: [ham değer, yazı sayısı] — büyük/küçük harf varyantları birleştirilmiş.
 */
export function BlogListInteractive({ categories, activeCategory }: { categories: [string, number][]; activeCategory: string | null }) {
  if (categories.length === 0) return null;
  const chip = (active: boolean) =>
    cn(
      'inline-flex h-9 shrink-0 items-center rounded-full px-4 text-[13px] transition-colors',
      active ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:text-foreground',
    );
  return (
    <nav aria-label="Kategoriler" className="scroll-strip -mx-4 mb-8 flex gap-2 px-4 sm:mx-0 sm:flex-wrap sm:px-0">
      <Link href="/blog" className={chip(!activeCategory)} aria-current={!activeCategory ? 'page' : undefined}>
        Tümü
      </Link>
      {categories.map(([cat, n]) => (
        <Link
          key={cat}
          href={`/blog?kategori=${encodeURIComponent(cat)}`}
          className={chip(activeCategory?.toLocaleLowerCase('tr-TR') === cat.toLocaleLowerCase('tr-TR'))}
          aria-current={activeCategory === cat ? 'page' : undefined}
        >
          {categoryLabel(cat)}
          <span className="num ml-2 text-[11px] opacity-70">{n}</span>
        </Link>
      ))}
    </nav>
  );
}
