'use client';
import { isToolHydrated } from './_shared/hydration';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { annuityPayment, amortizationSchedule, remainingPrincipal, fmtTL } from './_shared/calc';
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
  term: z.coerce.number().min(1),
  rate: z.coerce.number().min(0.01),
  paidMonths: z.coerce.number().min(0),
  earlyPenalty: z.coerce.number().min(0).max(100),
  newTerm: z.coerce.number().min(1),
  newRate: z.coerce.number().min(0.01),
  newCost: z.coerce.number().min(0),
});
type FormData = z.infer<typeof schema>;
type CalcResult = { oldRemaining: number; oldMonthly: number; oldTotal: number; newMonthly: number; newTotal: number; savings: number };
const defaults: FormData = { type: 'ihtiyac', amount: 0, term: 0, rate: 0, paidMonths: 0, earlyPenalty: 0, newTerm: 0, newRate: 0, newCost: 0 };

function readFormFromUrl(): FormData {
  if (typeof window === 'undefined' || !isToolHydrated()) return defaults;
  const sp = new URLSearchParams(window.location.search);
  const num = (k: keyof FormData): number => {
    const v = sp.get(k as string);
    if (v === null || v === '') return defaults[k] as number;
    const n = Number(v);
    return Number.isFinite(n) ? n : (defaults[k] as number);
  };
  return {
    type: sp.get('type') ?? defaults.type,
    amount: num('amount'), term: num('term'), rate: num('rate'),
    paidMonths: num('paidMonths'), earlyPenalty: num('earlyPenalty'),
    newTerm: num('newTerm'), newRate: num('newRate'), newCost: num('newCost'),
  };
}

function writeFormToUrl(form: FormData) {
  if (typeof window === 'undefined') return;
  const sp = new URLSearchParams(window.location.search);
  for (const k of ['type', 'amount', 'term', 'rate', 'paidMonths', 'earlyPenalty', 'newTerm', 'newRate', 'newCost'] as (keyof FormData)[]) {
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
  const oldMonthly = annuityPayment(data.amount, data.rate / 100, data.term);
  const remaining = remainingPrincipal(data.amount, data.rate, data.term, data.paidMonths, t.bsmv, t.kkdf);
  if (data.term - data.paidMonths <= 0) return null;
  const oldRows = amortizationSchedule(data.amount, data.rate, data.term, t.bsmv, t.kkdf);
  if (oldRows.length === 0) return null;
  const oldTotalRemaining = oldRows.slice(data.paidMonths).reduce((s, r) => s + r.totalPayment, 0);
  const penalty = remaining * (data.earlyPenalty / 100);
  const newPrincipal = remaining + penalty + data.newCost;
  if (data.newTerm <= 0 || data.newRate <= 0) {
    // Eski bilgiler yeterli, yeni hesaplanamıyor
    return {
      oldRemaining: remaining,
      oldMonthly: oldRows[data.paidMonths]?.totalPayment || oldMonthly,
      oldTotal: oldTotalRemaining,
      newMonthly: 0,
      newTotal: 0,
      savings: 0,
    };
  }
  const newRows = amortizationSchedule(newPrincipal, data.newRate, data.newTerm, t.bsmv, t.kkdf);
  if (newRows.length === 0) return null;
  return {
    oldRemaining: remaining,
    oldMonthly: oldRows[data.paidMonths]?.totalPayment || oldMonthly,
    oldTotal: oldTotalRemaining,
    newMonthly: newRows[0].totalPayment,
    newTotal: newRows.reduce((s, r) => s + r.totalPayment, 0),
    savings: oldTotalRemaining - newRows.reduce((s, r) => s + r.totalPayment, 0),
  };
}

export function KrediYapilandirma() {
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
      <p className="text-sm text-muted-foreground mb-4">Mevcut kredinizi yeni bir kredi ile yapılandırdığınızda (refinansman) oluşacak farkı karşılaştırın.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <h3 className="font-semibold text-sm pt-2">Mevcut Kredi</h3>
        <Select label="Kredi Türü" options={TYPES.map(t => ({ value: t.value, label: t.label }))} {...register('type')} />
        <Input label="Kredi Tutarı (₺)" type="number" step="0.01" {...register('amount')} error={errors.amount?.message} />
        <Input label="Vade (Ay)" type="number" {...register('term')} error={errors.term?.message} />
        <Input label="Aylık Faiz Oranı (%)" type="number" step="0.01" {...register('rate')} error={errors.rate?.message} />
        <Input label="Ödenen Taksit Sayısı" type="number" {...register('paidMonths')} error={errors.paidMonths?.message} />
        <Input label="Erken Ödeme Komisyonu (%)" type="number" step="0.01" defaultValue="0" {...register('earlyPenalty')} error={errors.earlyPenalty?.message} />
        <h3 className="font-semibold text-sm pt-2">Yeni Kredi</h3>
        <Input label="Yeni Vade (Ay)" type="number" {...register('newTerm')} error={errors.newTerm?.message} />
        <Input label="Yeni Aylık Faiz Oranı (%)" type="number" step="0.01" {...register('newRate')} error={errors.newRate?.message} />
        <Input label="Toplam Masraf (₺)" type="number" step="0.01" defaultValue="0" {...register('newCost')} error={errors.newCost?.message} />
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
            <ResultRow label="Kalan Anapara" value={fmtTL(result.oldRemaining)} />
            <h3 className="font-semibold text-sm pt-2">Mevcut Kredi</h3>
            <ResultRow label="Aylık Taksit" value={fmtTL(result.oldMonthly)} />
            <ResultRow label="Kalan Toplam Ödeme" value={fmtTL(result.oldTotal)} />
            <h3 className="font-semibold text-sm pt-2">Yeni Kredi</h3>
            <ResultRow label="Aylık Taksit" value={fmtTL(result.newMonthly)} />
            <ResultRow label="Toplam Ödeme" value={fmtTL(result.newTotal)} />
            <div className="border-t border-border pt-2 mt-2">
              <ResultRow label={result.savings >= 0 ? 'Tasarruf' : 'Ek Maliyet'} value={fmtTL(Math.abs(result.savings))} highlight />
            </div>
          </ResultCard>
        </>
      )}

      <ToolInfo
        title="Kredi Yapılandırma (Refinansman) Nedir?"
        description="Mevcut kredinizi daha uygun koşullarla yeni bir kredi ile yeniden yapılandırma işlemidir. Faiz oranlarının düşmesi durumunda mevcut kredinizi kapatıp daha düşük faizli yeni bir kredi kullanarak tasarruf edebilirsiniz."
        faqs={[
          { q: 'Refinansman ne zaman mantıklıdır?', a: 'Mevcut faiz oranınız piyasa ortalamasının üzerindeyse ve erken kapatma maliyetleri tasarrufu aşmıyorsa mantıklıdır.' },
          { q: 'Erken kapatma cezası var mı?', a: 'Konut kredilerinde kalan vadeye göre %1-2 erken kapatma cezası olabilir. Tüketici kredilerinde ceza yoktur.' },
        ]}
      />
    </>
  );
}
