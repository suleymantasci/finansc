'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { amortizationSchedule, fmtTL, fmtPct } from './_shared/calc';
import { ResultCard, ResultRow, ToolInfo } from './_shared/ToolInfo';
import { ShareButton } from '@/components/shared/ShareButton';

const TYPES = [
  { value: 'ihtiyac', label: 'İhtiyaç Kredisi', bsmv: 0.15, kkdf: 0.15 },
  { value: 'konut', label: 'Konut Kredisi', bsmv: 0, kkdf: 0 },
  { value: 'tasit', label: 'Taşıt Kredisi', bsmv: 0.15, kkdf: 0.15 },
];

const schema = z.object({
  type: z.string(),
  amount: z.coerce.number().min(1, 'Tutar giriniz'),
  rate: z.coerce.number().min(0.01, 'Faiz oranı giriniz'),
  term: z.coerce.number().min(1, 'Vade giriniz').max(360, 'Maks 360 ay'),
});
type FormData = z.infer<typeof schema>;
type CalcResult = { monthly: number; total: number; interest: number; totalBsmv: number; totalKkdf: number; bsmv: number; kkdf: number };
const defaults: FormData = { type: 'ihtiyac', amount: 0, rate: 0, term: 0 };

function readFormFromUrl(): FormData {
  if (typeof window === 'undefined') return defaults;
  const sp = new URLSearchParams(window.location.search);
  const num = (k: keyof FormData): number => {
    const v = sp.get(k as string);
    if (v === null || v === '') return defaults[k] as number;
    const n = Number(v);
    return Number.isFinite(n) ? n : (defaults[k] as number);
  };
  return {
    type: sp.get('type') ?? defaults.type,
    amount: num('amount'),
    rate: num('rate'),
    term: num('term'),
  };
}

function writeFormToUrl(form: FormData) {
  if (typeof window === 'undefined') return;
  const sp = new URLSearchParams(window.location.search);
  for (const k of ['type', 'amount', 'rate', 'term'] as (keyof FormData)[]) {
    const v = form[k];
    const def = defaults[k];
    if (v === def || (typeof v === 'number' && v === 0)) sp.delete(k as string);
    else sp.set(k as string, String(v));
  }
  const qs = sp.toString();
  window.history.replaceState(null, '', qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
}

function compute(data: FormData): CalcResult | null {
  if (data.amount <= 0 || data.rate <= 0 || data.term <= 0) return null;
  const t = TYPES.find(x => x.value === data.type) || TYPES[0];
  const rows = amortizationSchedule(data.amount, data.rate, data.term, t.bsmv, t.kkdf);
  const total = rows.reduce((s, r) => s + r.totalPayment, 0);
  const totalBsmv = rows.reduce((s, r) => s + r.bsmv, 0);
  const totalKkdf = rows.reduce((s, r) => s + r.kkdf, 0);
  const interest = rows.reduce((s, r) => s + r.interest, 0);
  return { monthly: rows[0].totalPayment, total, interest, totalBsmv, totalKkdf, bsmv: t.bsmv, kkdf: t.kkdf };
}

export function KrediHesaplama() {
  const initialForm = readFormFromUrl();
  const [result, setResult] = useState<CalcResult | null>(compute(initialForm));
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema), defaultValues: initialForm,
  });

  const onSubmit = (data: FormData) => {
    setResult(compute(data));
    writeFormToUrl(data);
  };

  const handleReset = () => {
    reset();
    setResult(null);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', window.location.pathname);
    }
  };

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}${window.location.search}`
    : '';

  return (
    <>
      <p className="text-sm text-muted-foreground mb-4">Kredi türünü seçerek taksit tutarını ve toplam geri ödeme tutarını hesaplayın.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Select label="Kredi Türü" options={TYPES.map(t => ({ value: t.value, label: t.label }))} {...register('type')} />
        <Input label="Kredi Tutarı (₺)" type="number" step="0.01" placeholder="Örn. 100000" {...register('amount')} error={errors.amount?.message} />
        <Input label="Vade (Ay)" type="number" placeholder="Örn. 36" {...register('term')} error={errors.term?.message} />
        <Input label="Aylık Faiz Oranı (%)" type="number" step="0.01" placeholder="Örn. 3.49" {...register('rate')} error={errors.rate?.message} />
        <div className="flex gap-2">
          <Button type="submit" className="flex-1">Hesapla</Button>
          <Button type="button" variant="outline" onClick={handleReset}>Sıfırla</Button>
        </div>
      </form>

      {result && (
        <>
          <div className="flex items-center justify-between gap-2 mt-6 flex-wrap">
            <p className="text-sm text-muted-foreground">Sonucu paylaş — link'i kopyalayıp gönderebilirsiniz.</p>
            <ShareButton shareUrl={shareUrl} />
          </div>
          <ResultCard>
            <ResultRow label="Aylık Taksit" value={fmtTL(result.monthly)} />
            <ResultRow label="Toplam Geri Ödeme" value={fmtTL(result.total)} />
            <ResultRow label="Toplam Faiz" value={fmtTL(result.interest)} highlight />
            {result.bsmv > 0 && <ResultRow label={`BSMV (${fmtPct(result.bsmv * 100)})`} value={fmtTL(result.totalBsmv)} />}
            {result.kkdf > 0 && <ResultRow label={`KKDF (${fmtPct(result.kkdf * 100)})`} value={fmtTL(result.totalKkdf)} />}
          </ResultCard>
        </>
      )}

      <ToolInfo
        title="Kredi Hesaplama Nedir?"
        description="Kredi hesaplama aracı ile ihtiyaç, konut ve taşıt kredisi taksit tutarlarını karşılaştırmalı olarak hesaplayabilirsiniz. Her kredi türüne göre BSMV ve KKDF oranları otomatik uygulanır."
        faqs={[
          { q: 'BSMV ve KKDF oranları nedir?', a: 'İhtiyaç ve taşıt kredilerinde BSMV %15, KKDF %15 uygulanır. Konut kredilerinde her ikisi de %0\'dır (ilk konut alımında).' },
          { q: 'Hangi kredi türü daha avantajlıdır?', a: 'Konut kredileri BSMV ve KKDF muafiyeti sayesinde genellikle en düşük maliyetli kredi türüdür.' },
        ]}
      />
    </>
  );
}
