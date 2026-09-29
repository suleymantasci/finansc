import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import type { ToolInfoContent } from '@/lib/tools/types';
import type { ToolEntry } from '@/lib/tools/catalog';

/**
 * Araç açıklaması — sunucuda çizilir (arama motorları ve yapay zekâ tarayıcıları için).
 * SSS yerel <details> ile; JavaScript olmadan da açılır.
 */
export function ToolArticle({ name, info, related }: { name: string; info?: ToolInfoContent; related: ToolEntry[] }) {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 lg:px-8 md:pb-12">
      {info && (
        <article className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <section aria-labelledby="nasil" className="space-y-4">
            <h2 id="nasil" className="font-display text-3xl text-foreground">{name} nasıl hesaplanır?</h2>
            {info.how.map((p, i) => <p key={i} className="text-[15px] leading-relaxed text-muted-foreground">{p}</p>)}
            {info.formula && (
              <div className="atlas-card p-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Formül</h3>
                <ul className="space-y-1.5 font-mono text-[13px] text-foreground">
                  {info.formula.map((f, i) => <li key={i} className="break-words">{f}</li>)}
                </ul>
              </div>
            )}
            {info.sources && info.sources.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Kaynaklar</h3>
                <ul className="space-y-1 text-sm">
                  {info.sources.map((s) => (
                    <li key={s.url}>
                      <a href={s.url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline">
                        {s.label} <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {info.faqs.length > 0 && (
            <section aria-labelledby="sss">
              <h2 id="sss" className="font-display mb-4 text-3xl text-foreground">Sıkça sorulan sorular</h2>
              <div className="divide-y divide-border rounded-xl border border-border">
                {info.faqs.map((f, i) => (
                  <details key={i} className="group p-4" open={i === 0}>
                    <summary className="cursor-pointer list-none text-[15px] font-medium text-foreground marker:hidden">
                      <span className="flex items-start justify-between gap-3">
                        {f.q}
                        <span aria-hidden="true" className="text-muted-foreground transition-transform group-open:rotate-45">+</span>
                      </span>
                    </summary>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
                  </details>
                ))}
              </div>
            </section>
          )}
        </article>
      )}

      {related.length > 0 && (
        <nav aria-labelledby="ilgili" className="mt-12">
          <h2 id="ilgili" className="font-display mb-4 text-2xl text-foreground">İlgili hesaplama araçları</h2>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((t) => (
              <li key={t.slug}>
                <Link href={`/araclar/${t.slug}`} className="atlas-card atlas-card-link block p-4">
                  <span className="block text-[15px] font-medium text-foreground">{t.short}</span>
                  <span className="mt-0.5 block text-[13px] leading-snug text-muted-foreground">{t.card}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
