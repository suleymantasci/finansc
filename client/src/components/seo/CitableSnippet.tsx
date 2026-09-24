// ── CitableSnippet — AI motorları için özet kutusu ──
// ChatGPT, Perplexity, Google SGE gibi motorlar bu tür 40-60 kelimelik
// net cevapları "citation" olarak kullanır.

import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  label?: string;
  // SpeakableSpecification xpath'te kullanılacak id
  id?: string;
}

export function CitableSnippet({ children, label = 'Özet', id = 'snippet-summary' }: Props) {
  return (
    <aside
      id={id}
      aria-label={label}
      className="my-8 max-w-3xl border-l-2 border-primary pl-5"
    >
      <p className="eyebrow mb-2 text-primary">{label}</p>
      <div className="text-[15px] leading-relaxed text-foreground/85">{children}</div>
    </aside>
  );
}
