import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionIntroProps {
  title: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  className?: string;
  /** Başlık üstündeki küçük altın etiket */
  eyebrow?: string;
  /**
   * "page" (default) → server-side H1, used on listing pages as the primary SEO heading.
   * "section" → H2, used as a sub-section heading inside a page.
   */
  as?: 'page' | 'section';
}

function SectionIntro({ title, description, ctaLabel, ctaHref, className, eyebrow, as = 'page' }: SectionIntroProps) {
  const HeadingTag = as === 'page' ? 'h1' : 'h2';

  return (
    <div className={cn('mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className={as === 'page' ? 'max-w-3xl flex-1' : 'max-w-2xl'}>
        {eyebrow && <p className="eyebrow mb-3 text-primary">{eyebrow}</p>}
        <HeadingTag
          className={cn(
            'font-display text-balance text-foreground',
            as === 'page' ? 'text-4xl sm:text-5xl' : 'text-3xl sm:text-4xl',
          )}
        >
          {title}
        </HeadingTag>
        {description && (
          <p className={cn('mt-3 text-pretty text-muted-foreground', as === 'page' ? 'text-base sm:text-lg' : 'text-base')}>
            {description}
          </p>
        )}
      </div>
      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-primary decoration-primary/40 underline-offset-4 hover:underline"
        >
          {ctaLabel}
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

export { SectionIntro };
export type { SectionIntroProps };
