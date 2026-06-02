// ── CitableSnippet — AI motorları için özet kutusu ──
// ChatGPT, Perplexity, Google SGE gibi motorlar bu tür 40-60 kelimelik
// net cevapları "citation" olarak kullanır.

interface Props {
  children: React.ReactNode;
  label?: string;
  // SpeakableSpecification xpath'te kullanılacak id
  id?: string;
}

export function CitableSnippet({ children, label = 'Özet', id = 'snippet-summary' }: Props) {
  return (
    <aside
      id={id}
      aria-label={label}
      className="my-6 rounded-lg border-l-4 border-primary bg-gradient-to-br from-primary/5 to-primary/10 p-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">
          ℹ
        </span>
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
          {label}
        </span>
      </div>
      <div className="text-sm leading-relaxed text-foreground">{children}</div>
    </aside>
  );
}
