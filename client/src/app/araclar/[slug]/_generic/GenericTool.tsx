'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Minus, Plus, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ShareBar } from '@/components/shared/ShareBar';
import { isToolHydrated } from '../_tools/_shared/hydration';
import { isIsoDate, parseTrNumber } from '@/lib/calculators/core';
import { isResult, type CalcResult, type DataStatus, type Field, type ResultRow, type ToolSpec, type Values } from '@/lib/tools/types';

type Raw = Record<string, string | boolean | string[][]>;

/** İndirilen dış veriler (aynı oturumda araçlar arası paylaşılır) */
const DATA_CACHE = new Map<string, unknown>();

const trNum = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 6 });

/** Sayıyı giriş kutusunda gösterilecek Türkçe metne çevirir (45000 → "45.000", 3.25 → "3,25"). */
function toText(n: number | null | undefined): string {
  return n == null || !Number.isFinite(n) ? '' : trNum.format(n);
}

function dateDefault(f: Extract<Field, { type: 'date' }>, today: string): string {
  return typeof f.default === 'function' ? f.default(today) : f.default === 'today' ? today : f.default;
}

function defaultRaw(f: Field, today: string): Raw[string] {
  switch (f.type) {
    case 'number': return toText(f.default);
    case 'text': return f.default;
    case 'select': return f.default;
    case 'date': return dateDefault(f, today);
    case 'toggle': return f.default;
    case 'rows': return f.default.map((r) => r.map((c) => toText(c)));
  }
}

function defaults(spec: ToolSpec, today: string): Raw {
  return Object.fromEntries(spec.fields.map((f) => [f.key, defaultRaw(f, today)]));
}

// URL: sayılar düz ondalık (45000, 3.25), satırlar "a_b~c_d", onay kutusu 1/0.
function encode(f: Field, raw: Raw[string]): string {
  switch (f.type) {
    case 'number': { const n = parseTrNumber(raw as string); return Number.isFinite(n) ? String(n) : ''; }
    case 'toggle': return raw ? '1' : '0';
    case 'rows': return (raw as string[][]).map((r) => r.map((c) => { const n = parseTrNumber(c); return Number.isFinite(n) ? String(n) : ''; }).join('_')).join('~');
    default: return raw as string;
  }
}

function decode(f: Field, s: string): Raw[string] | undefined {
  switch (f.type) {
    case 'number': { const n = Number(s); return Number.isFinite(n) ? toText(n) : undefined; }
    case 'toggle': return s === '1';
    case 'text': return s.slice(0, 200);
    case 'select': return f.options.some((o) => o.value === s) ? s : undefined;
    case 'date': return isIsoDate(s) ? s : undefined;
    case 'rows': return s.split('~').slice(0, f.maxRows ?? 50).map((r) => {
      const cells = r.split('_');
      return f.columns.map((_, i) => { const n = Number(cells[i]); return cells[i] && Number.isFinite(n) ? toText(n) : ''; });
    });
  }
}

function readUrl(spec: ToolSpec, base: Raw): Raw {
  if (typeof window === 'undefined' || !isToolHydrated()) return base;
  const sp = new URLSearchParams(window.location.search);
  const out = { ...base };
  // Eski biçimli parametreler (ör. cf=100,200) önce uygulanır; yeni biçim varsa üzerine yazar
  const legacy = spec.legacyQuery?.(sp) ?? {};
  for (const f of spec.fields) {
    const lv = legacy[f.key];
    if (lv === undefined) continue;
    if (f.type === 'rows' && Array.isArray(lv)) out[f.key] = lv.map((r) => r.map((c) => toText(c)));
    else if (f.type === 'number' && typeof lv === 'number') out[f.key] = toText(lv);
    else if (typeof lv === 'string' || typeof lv === 'boolean') out[f.key] = lv;
  }
  for (const f of spec.fields) {
    const s = sp.get(f.key);
    if (s == null || legacy[f.key] !== undefined) continue;
    const v = decode(f, s);
    if (v !== undefined) out[f.key] = v;
  }
  return out;
}

function buildQuery(spec: ToolSpec, raw: Raw, base: Raw): string {
  const sp = new URLSearchParams();
  for (const f of spec.fields) {
    const e = encode(f, raw[f.key]);
    if (e !== encode(f, base[f.key]) && e !== '') sp.set(f.key, e);
  }
  return sp.toString();
}

interface Parsed { values: Values; errors: Record<string, string>; complete: boolean }

function parse(spec: ToolSpec, raw: Raw): Parsed {
  const values: Values = {};
  const errors: Record<string, string> = {};
  let complete = true;
  // Önce select/toggle değerleri: showIf koşulları bunlara bakar
  for (const f of spec.fields) if (f.type === 'select' || f.type === 'toggle') values[f.key] = raw[f.key] as string | boolean;
  for (const f of spec.fields) {
    const visible = !f.showIf || f.showIf(values);
    if (f.type === 'number') {
      const n = parseTrNumber(raw[f.key] as string);
      values[f.key] = n;
      if (!visible) continue;
      if (!Number.isFinite(n)) {
        if ((raw[f.key] as string).trim() !== '') errors[f.key] = 'Geçerli bir sayı girin';
        if (!f.optional) complete = false;
        continue;
      }
      if (f.min != null && n < f.min) errors[f.key] = `En az ${toText(f.min)} olmalı`;
      else if (f.max != null && n > f.max) errors[f.key] = `En fazla ${toText(f.max)} olmalı`;
      else if (f.integer && !Number.isInteger(n)) errors[f.key] = 'Tam sayı girin';
    } else if (f.type === 'text') {
      const t = (raw[f.key] as string).trim();
      values[f.key] = t;
      if (visible && !t && !f.optional) complete = false;
    } else if (f.type === 'date') {
      const d = raw[f.key] as string;
      values[f.key] = d;
      if (visible && !isIsoDate(d)) { if (!f.optional) complete = false; if (d) errors[f.key] = 'Geçerli bir tarih seçin'; }
    } else if (f.type === 'rows') {
      values[f.key] = (raw[f.key] as string[][]).map((r) => r.map((c) => { const n = parseTrNumber(c); return Number.isFinite(n) ? n : 0; }));
    }
  }
  return { values, errors, complete: complete && Object.keys(errors).length === 0 };
}

function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function GenericTool({ spec, title, today: serverToday }: { spec: ToolSpec; title: string; today: string }) {
  const [today, setToday] = useState(serverToday);
  const base = useMemo(() => defaults(spec, today), [spec, today]);
  const [raw, setRaw] = useState<Raw>(() => readUrl(spec, defaults(spec, serverToday)));
  const touched = useRef<Set<string>>(new Set());

  // Sunucu tarihi (build/ISR) ile kullanıcının günü farklıysa, dokunulmamış tarih alanlarını güncelle
  useEffect(() => {
    const t = localToday();
    if (t === serverToday) return;
    setToday(t);
    setRaw((prev) => {
      const next = { ...prev };
      const oldBase = defaults(spec, serverToday);
      for (const f of spec.fields) {
        if (f.type === 'date' && !touched.current.has(f.key) && prev[f.key] === oldBase[f.key]) next[f.key] = dateDefault(f, t);
      }
      return next;
    });
  }, [spec, serverToday]);

  const parsed = useMemo(() => parse(spec, raw), [spec, raw]);

  // Dış veri (canlı fiyat, TÜFE, geçmiş kur): anahtar değişince indir, sonucu önbellekte tut
  const dataKey = spec.data && parsed.complete ? spec.data.key(parsed.values) : null;
  const [loaded, setLoaded] = useState<{ key: string; status: DataStatus; data?: unknown } | null>(null);
  const valuesRef = useRef(parsed.values);
  valuesRef.current = parsed.values;
  useEffect(() => {
    if (!spec.data || !dataKey) return;
    const cached = DATA_CACHE.get(dataKey);
    if (cached) { setLoaded({ key: dataKey, status: 'ready', data: cached }); return; }
    const ctrl = new AbortController();
    setLoaded({ key: dataKey, status: 'loading' });
    const t = setTimeout(() => {
      spec.data!.load(valuesRef.current, ctrl.signal)
        .then((d) => { DATA_CACHE.set(dataKey, d); if (!ctrl.signal.aborted) setLoaded({ key: dataKey, status: 'ready', data: d }); })
        .catch(() => { if (!ctrl.signal.aborted) setLoaded({ key: dataKey, status: 'error' }); });
    }, 250);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [spec, dataKey]);
  const dataStatus: DataStatus = !spec.data || !dataKey ? 'none' : loaded?.key === dataKey ? loaded.status : 'loading';
  const data = dataStatus === 'ready' ? loaded?.data : undefined;

  const output = useMemo(() => {
    if (!parsed.complete) return null;
    try { return spec.compute(parsed.values, { today, data, dataStatus }); } catch { return { error: 'Bu değerlerle hesaplama yapılamadı.' }; }
  }, [spec, parsed, today, data, dataStatus]);

  // Değerleri adres çubuğuna yaz (paylaşılabilir link); yazmayı kısa süre geciktir
  const query = useMemo(() => buildQuery(spec, raw, base), [spec, raw, base]);
  useEffect(() => {
    if (!isToolHydrated()) return;
    const t = setTimeout(() => {
      const url = query ? `${window.location.pathname}?${query}` : window.location.pathname;
      if (url !== `${window.location.pathname}${window.location.search}`) window.history.replaceState(window.history.state, '', url);
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  const set = (key: string, v: Raw[string]) => {
    touched.current.add(key);
    setRaw((p) => ({ ...p, [key]: v }));
  };

  const shareUrl = () => `${window.location.origin}${window.location.pathname}${query ? `?${query}` : ''}`;
  const shareText = output && isResult(output) ? `${title}: ${output.shareText ?? `${output.headline.label} ${output.headline.value}`}` : title;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start">
      <form className="atlas-card grid min-w-0 grid-cols-1 gap-4 p-5 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()} noValidate>
        {spec.intro && <p className="text-sm leading-relaxed text-muted-foreground sm:col-span-2">{spec.intro}</p>}
        {spec.fields.map((f) => {
          if (f.showIf && !f.showIf(parsed.values)) return null;
          return (
            <FieldInput
              key={f.key}
              field={f}
              value={raw[f.key]}
              error={parsed.errors[f.key]}
              placeholder={f.type === 'number' && f.placeholderFrom && data !== undefined ? f.placeholderFrom(data, parsed.values) : undefined}
              onChange={(v) => set(f.key, v)}
            />
          );
        })}
        <div className="flex justify-end sm:col-span-2">
          <button
            type="button"
            onClick={() => { touched.current.clear(); setRaw(defaults(spec, today)); }}
            className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Örnek değerlere dön
          </button>
        </div>
      </form>

      <section aria-live="polite" aria-label="Hesaplama sonucu" className="min-w-0 lg:sticky lg:top-24">
        {output == null && (
          <div className="atlas-card p-6 text-sm text-muted-foreground">
            {dataStatus === 'loading' ? 'Güncel veriler yükleniyor…' : dataStatus === 'error' ? 'Veri şu an alınamadı; ilgili değeri elle girerek hesaplayabilirsiniz.' : 'Sonucu görmek için alanları doldurun.'}
          </div>
        )}
        {output && 'error' in output && (
          <div className="atlas-card flex items-start gap-2 border-down/40 p-5 text-sm text-down" role="alert">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> {output.error}
          </div>
        )}
        {output && isResult(output) && <ResultView r={output} />}
        {output && isResult(output) && (
          <ShareBar className="mt-4" getUrl={shareUrl} text={shareText} title={title} />
        )}
      </section>
    </div>
  );
}

// ── Alanlar ─────────────────────────────────────────────────────────────

const inputCls = 'h-11 w-full rounded-lg border border-border bg-elevated px-3.5 text-[15px] text-foreground placeholder:text-muted-foreground/70 transition-colors hover:border-border-strong focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

function FieldInput({ field: f, value, error, placeholder, onChange }: { field: Field; value: Raw[string]; error?: string; placeholder?: string; onChange: (v: Raw[string]) => void }) {
  const id = `f-${f.key}`;
  const wide = f.wide || f.type === 'rows' || (f.type === 'select' && f.segmented && f.options.length > 3) || f.type === 'toggle';
  const label = (
    <label htmlFor={id} className="block text-sm font-medium text-foreground">{f.label}</label>
  );
  const help = error
    ? <p className="text-xs text-down" role="alert">{error}</p>
    : f.help ? <p className="text-xs leading-snug text-muted-foreground">{f.help}</p> : null;

  if (f.type === 'toggle') {
    return (
      <div className={cn('space-y-1', wide && 'sm:col-span-2')}>
        <label htmlFor={id} className="flex cursor-pointer items-center gap-3 text-sm text-foreground">
          <input id={id} type="checkbox" checked={value as boolean} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5 accent-[var(--color-primary)]" />
          {f.label}
        </label>
        {help}
      </div>
    );
  }

  if (f.type === 'select' && f.segmented) {
    return (
      <div className={cn('space-y-1.5', wide && 'sm:col-span-2')} role="group" aria-labelledby={`${id}-l`}>
        <span id={`${id}-l`} className="block text-sm font-medium text-foreground">{f.label}</span>
        <div className="flex flex-wrap gap-1.5">
          {f.options.map((o) => (
            <button
              key={o.value}
              type="button"
              aria-pressed={value === o.value}
              onClick={() => onChange(o.value)}
              className={cn(
                'min-h-10 rounded-lg border px-3 py-1.5 text-sm transition-colors',
                value === o.value ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-elevated text-muted-foreground hover:border-border-strong hover:text-foreground',
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
        {help}
      </div>
    );
  }

  if (f.type === 'select') {
    return (
      <div className={cn('space-y-1.5', wide && 'sm:col-span-2')}>
        {label}
        <select id={id} value={value as string} onChange={(e) => onChange(e.target.value)} className={inputCls}>
          {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {help}
      </div>
    );
  }

  if (f.type === 'date') {
    return (
      <div className={cn('space-y-1.5', wide && 'sm:col-span-2')}>
        {label}
        <input id={id} type="date" value={value as string} onChange={(e) => onChange(e.target.value)} className={cn(inputCls, error && 'border-down')} />
        {help}
      </div>
    );
  }

  if (f.type === 'rows') return <RowsInput field={f} value={value as string[][]} onChange={onChange} />;

  if (f.type === 'text') {
    return (
      <div className={cn('space-y-1.5', 'sm:col-span-2')}>
        {label}
        <input
          id={id}
          type="text"
          inputMode={f.inputMode}
          autoComplete="off"
          autoCapitalize={f.uppercase ? 'characters' : undefined}
          spellCheck={false}
          value={value as string}
          placeholder={f.placeholder}
          onChange={(e) => onChange(f.uppercase ? e.target.value.toUpperCase() : e.target.value)}
          className={cn(inputCls, 'num tracking-wide', error && 'border-down')}
        />
        {help}
      </div>
    );
  }

  return (
    <div className={cn('space-y-1.5', wide && 'sm:col-span-2')}>
      {label}
      <NumberBox id={id} value={value as string} unit={f.unit} placeholder={placeholder ?? f.placeholder} invalid={!!error} onChange={onChange} />
      {help}
    </div>
  );
}

function NumberBox({ id, value, unit, placeholder, invalid, onChange, ariaLabel }: { id?: string; value: string; unit?: string; placeholder?: string; invalid?: boolean; onChange: (v: string) => void; ariaLabel?: string }) {
  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => { const n = parseTrNumber(value); if (Number.isFinite(n)) onChange(toText(n)); }}
        className={cn(inputCls, 'num', unit && 'pr-16', invalid && 'border-down')}
      />
      {unit && <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm text-muted-foreground">{unit}</span>}
    </div>
  );
}

function RowsInput({ field: f, value, onChange }: { field: Extract<Field, { type: 'rows' }>; value: string[][]; onChange: (v: string[][]) => void }) {
  const setCell = (r: number, c: number, v: string) => onChange(value.map((row, i) => (i === r ? row.map((x, j) => (j === c ? v : x)) : row)));
  return (
    <fieldset className="space-y-2 sm:col-span-2">
      <legend className="mb-1.5 text-sm font-medium text-foreground">{f.label}</legend>
      {value.map((row, r) => (
        <div key={r} className="flex items-center gap-2">
          <span className="num w-5 shrink-0 text-right text-xs text-muted-foreground">{r + 1}</span>
          <div className="grid min-w-0 flex-1 gap-2" style={{ gridTemplateColumns: `repeat(${f.columns.length}, minmax(0, 1fr))` }}>
            {f.columns.map((c, j) => (
              <NumberBox key={c.key} value={row[j] ?? ''} unit={c.unit} placeholder={c.label} ariaLabel={`${r + 1}. satır ${c.label}`} onChange={(v) => setCell(r, j, v)} />
            ))}
          </div>
          <button
            type="button"
            onClick={() => onChange(value.filter((_, i) => i !== r))}
            disabled={value.length <= 1}
            aria-label={`${r + 1}. satırı sil`}
            className="grid size-9 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground hover:border-down/50 hover:text-down disabled:opacity-30"
          >
            <Minus className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ))}
      <div className="flex items-center justify-between gap-2 pl-7 text-xs text-muted-foreground">
        <span>{f.columns.map((c) => c.label).join(' · ')}</span>
        {value.length < (f.maxRows ?? 50) && (
          <button type="button" onClick={() => onChange([...value, f.columns.map(() => '')])} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-foreground hover:border-primary/60 hover:text-primary">
            <Plus className="h-3.5 w-3.5" aria-hidden="true" /> {f.addLabel ?? 'Satır ekle'}
          </button>
        )}
      </div>
    </fieldset>
  );
}

// ── Sonuç ───────────────────────────────────────────────────────────────

const toneCls = { up: 'text-up', down: 'text-down', primary: 'text-primary' } as const;

function Rows({ rows }: { rows: ResultRow[] }) {
  return (
    <dl className="divide-y divide-border">
      {rows.map((r, i) => (
        <div key={i} className="flex items-baseline justify-between gap-4 py-2.5">
          <dt className="min-w-0 text-sm text-muted-foreground">
            {r.label}
            {r.hint && <span className="block text-xs text-muted-foreground/80">{r.hint}</span>}
          </dt>
          <dd className={cn('num shrink-0 text-right text-[15px] tabular-nums', r.strong ? 'font-semibold text-foreground' : 'text-foreground', r.tone && toneCls[r.tone])}>{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function ResultView({ r }: { r: CalcResult }) {
  const [allRows, setAllRows] = useState(false);
  return (
    <div className="atlas-card overflow-hidden">
      <div className="border-b border-border bg-elevated/60 p-5">
        <p className="eyebrow text-muted-foreground">{r.headline.label}</p>
        <p className={cn('font-display num mt-1 break-words text-3xl leading-tight sm:text-4xl', r.headline.tone ? toneCls[r.headline.tone] : 'text-foreground')}>{r.headline.value}</p>
        {r.headline.sub && <p className="mt-1.5 text-sm text-muted-foreground">{r.headline.sub}</p>}
      </div>
      <div className="space-y-5 p-5">
        {r.warnings?.map((w, i) => (
          <p key={i} className="flex items-start gap-2 rounded-lg border border-primary/40 bg-primary/5 p-3 text-sm text-foreground">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" /> {w}
          </p>
        ))}
        {r.rows && <Rows rows={r.rows} />}
        {r.sections?.map((s) => (
          <div key={s.title}>
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{s.title}</h3>
            <Rows rows={s.rows} />
          </div>
        ))}
        {r.table && (
          <div>
            {r.table.caption && <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{r.table.caption}</h3>}
            <div className="-mx-5 overflow-x-auto px-5">
              <table className="w-full min-w-[18rem] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    {r.table.columns.map((c, i) => <th key={i} scope="col" className={cn('py-2 pr-3 font-medium', i > 0 && 'text-right')}>{c}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {(r.table.collapseAfter && !allRows ? r.table.rows.slice(0, r.table.collapseAfter) : r.table.rows).map((row, i) => (
                    <tr key={i} className="border-b border-border/60 last:border-0">
                      {row.map((c, j) => <td key={j} className={cn('num py-2 pr-3 align-top', j > 0 ? 'text-right tabular-nums' : 'text-muted-foreground')}>{c}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
              {r.table.collapseAfter && r.table.rows.length > r.table.collapseAfter && (
                <button type="button" onClick={() => setAllRows((x) => !x)} className="py-2 text-sm text-primary hover:underline">
                  {allRows ? 'Daha az göster' : `Tümünü göster (${r.table.rows.length} satır)`}
                </button>
              )}
            </div>
            {r.table.note && <p className="mt-2 text-xs text-muted-foreground">{r.table.note}</p>}
          </div>
        )}
        {r.notes && (
          <ul className="space-y-1.5 text-xs leading-relaxed text-muted-foreground">
            {r.notes.map((n, i) => <li key={i}>• {n}</li>)}
          </ul>
        )}
      </div>
    </div>
  );
}
