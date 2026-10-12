import Link from 'next/link';
import { Calculator } from 'lucide-react';
import { TOOL_BY_SLUG } from '@/lib/tools/catalog';
import { TOOL_ICONS } from '@/lib/tools/icons';

/** Veri sayfalarından ilgili hesaplama araçlarına iç bağlantı bloğu (sunucuda çizilir). */
export function ToolLinks({ title = 'İlgili hesaplama araçları', slugs }: { title?: string; slugs: string[] }) {
  const tools = slugs.map((s) => TOOL_BY_SLUG[s]).filter(Boolean);
  if (tools.length === 0) return null;
  return (
    <section aria-labelledby="tool-links" className="atlas-card p-5 sm:p-6">
      <h2 id="tool-links" className="font-display text-xl text-foreground">
        {title}
      </h2>
      <ul className="mt-4 space-y-1">
        {tools.map((t) => {
          const Icon = TOOL_ICONS[t.icon] ?? Calculator;
          return (
            <li key={t.slug}>
              <Link
                href={`/araclar/${t.slug}`}
                className="group flex items-start gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted"
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span>
                  <span className="block text-sm font-medium text-foreground group-hover:text-primary">{t.short}</span>
                  <span className="block text-[12px] text-muted-foreground">{t.card}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
