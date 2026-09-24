import fs from 'node:fs';
import path from 'node:path';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { Breadcrumb, type BreadcrumbItem } from '@/components/shared/Breadcrumb';

/**
 * Detay sayfası başlığı — referans: Gram Altın detay görseli.
 * Sol: breadcrumb, amblem + serif H1 + alt başlık. Sağ: kategori görseli
 * (public/atlas/detail-<category>.webp varsa).
 */

function artExists(file: string) {
  try {
    return fs.existsSync(path.join(process.cwd(), 'public', file));
  } catch {
    return false;
  }
}

export function DetailHeader({
  crumbs,
  eyebrow,
  title,
  subtitle,
  emblem,
  actions,
  category,
}: {
  crumbs: BreadcrumbItem[];
  eyebrow: string;
  title: string;
  subtitle?: ReactNode;
  emblem: ReactNode;
  actions?: ReactNode;
  /** altin | doviz | borsa | emtia — görsel dosya adı */
  category: string;
}) {
  const art = `/atlas/detail-${category}.webp`;
  const hasArt = artExists(art);

  return (
    <header className="relative isolate overflow-hidden border-b border-border">
      {hasArt && (
        <div className="pointer-events-none absolute inset-y-0 right-0 -z-10 hidden w-[46%] lg:block" aria-hidden="true">
          <Image src={art} alt="" fill sizes="46vw" className="object-cover object-center opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
        </div>
      )}
      <div className="mx-auto max-w-[1440px] px-4 pb-8 pt-6 lg:px-8 lg:pb-10">
        <Breadcrumb items={crumbs} />
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex min-w-0 items-start gap-4">
            <div className="grid size-14 shrink-0 place-items-center rounded-2xl border border-border bg-card text-primary shadow-sm sm:size-16" aria-hidden="true">
              {emblem}
            </div>
            <div className="min-w-0">
              <p className="eyebrow text-primary">{eyebrow}</p>
              <h1 className="font-display mt-2 text-balance text-4xl text-foreground sm:text-5xl">{title}</h1>
              {subtitle && <div className="mt-2 text-pretty text-[15px] text-muted-foreground">{subtitle}</div>}
            </div>
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      </div>
    </header>
  );
}
