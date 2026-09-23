import type { ReactNode } from 'react';

/** "X nedir?" — AI motorlarının alıntılayabileceği kısa, kendi başına anlamlı özet */
export function AboutBlock({ id, title, children, facts }: { id: string; title: string; children: ReactNode; facts?: { label: string; value: string }[] }) {
  return (
    <section aria-labelledby={`${id}-title`} className="atlas-card p-5 sm:p-6">
      <h2 id={`${id}-title`} className="font-display text-2xl text-foreground">
        {title}
      </h2>
      <div id={id} className="mt-3 text-pretty text-[15px] leading-relaxed text-muted-foreground">
        {children}
      </div>
      {facts && facts.length > 0 && (
        <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-5 sm:grid-cols-4">
          {facts.map((f) => (
            <div key={f.label}>
              <dt className="text-[12px] text-muted-foreground">{f.label}</dt>
              <dd className="mt-1 text-sm font-medium text-foreground">{f.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
