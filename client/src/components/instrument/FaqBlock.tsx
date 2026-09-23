import { Plus } from 'lucide-react';
import { FAQSchema } from '@/components/seo/FAQSchema';

/** SSS: görünür akordeon + FAQPage JSON-LD (aynı içerik — Google kuralı) */
export function FaqBlock({ title, faqs, id = 'sss' }: { title: string; faqs: { q: string; a: string }[]; id?: string }) {
  if (faqs.length === 0) return null;
  return (
    <section aria-labelledby={id} className="atlas-card p-5 sm:p-6">
      <h2 id={id} className="font-display text-2xl text-foreground">
        {title}
      </h2>
      <div className="mt-4 divide-y divide-border border-y border-border">
        {faqs.map((f, i) => (
          <details key={f.q} className="group" open={i === 0}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[15px] font-medium text-foreground [&::-webkit-details-marker]:hidden">
              <h3 className="font-medium">{f.q}</h3>
              <Plus className="h-4 w-4 shrink-0 text-primary transition-transform group-open:rotate-45" aria-hidden="true" />
            </summary>
            <p className="pb-5 pr-8 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
          </details>
        ))}
      </div>
      <FAQSchema faqs={faqs} />
    </section>
  );
}
