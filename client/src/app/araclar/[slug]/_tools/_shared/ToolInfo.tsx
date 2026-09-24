'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FAQ { q: string; a: string }

export function ToolInfo({ title, description, faqs }: { title: string; description: string; faqs: FAQ[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-8 atlas-card p-5">
      <h2 className="font-display text-2xl text-foreground sm:text-3xl mb-2">{title}</h2>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      {faqs.length > 0 && (
        <>
          <button
            onClick={() => setOpen(!open)}
            className="mt-4 flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            {open ? 'Soruları Gizle' : 'Sıkça Sorulan Sorular'}
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {open && (
            <div className="mt-3 space-y-4">
              {faqs.map((f, i) => (
                <div key={i}>
                  <h3 className="text-sm font-semibold">{f.q}</h3>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** Reusable result row */
export function ResultRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`font-bold ${highlight ? 'text-down' : ''}`}>{value}</span>
    </div>
  );
}

/** Result card wrapper */
export function ResultCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-6 space-y-3 atlas-card p-5">
      {children}
    </div>
  );
}
