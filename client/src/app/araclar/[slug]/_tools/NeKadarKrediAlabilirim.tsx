'use client';
import { isToolHydrated } from './_shared/hydration';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { annuityPayment, fmtTL } from './_shared/calc';
import { ResultCard, ResultRow, ToolInfo } from './_shared/ToolInfo';
import { ShareButton } from '@/components/shared/ShareButton';

const TYPES = [
  { value: 'ihtiyac', label: 'İhtiyaç Kredisi', bsmv: 0.05, kkdf: 0.15 },
  { value: 'konut', label: 'Konut Kredisi', bsmv: 0, kkdf: 0 },
  { value: 'tasit', label: 'Taşıt Kredisi', bsmv: 0.05, kkdf: 0.15 },
];

const schema = z.object({
  type: z.string(),
  income: z.coerce.number().min(1, 'Gelir giriniz'),
  spouseIncome: z.coerce.number().min(0),
  otherIncome: z.coerce.number().min(0),
  existingInstallment: z.coerce.number().min(0),
  term: z.coerce.number().min(1),
  rate: z.coerce.number().min(0.01),
});
type FormData = z.infer<typeof schema>;
type CalcResult = { maxInstallment: number; maxLoan: number; totalPayment: number };
const defaults: FormData = { type: 'ihtiyac', income: 0, spouseIncome: 0, otherIncome: 0, existingInstallment: 0, term: 0, rate: 0 };

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
    income: num('income'),
    spouseIncome: num('spouseIncome'),
    otherIncome: num('otherIncome'),
    existingInstallment: num('existingInstallment'),
    term: num('term'),
    rate: num('rate'),
  };
}

function writeFormToUrl(form: FormData) {
  if (typeof window === 'undefined') return;
  const sp = new URLSearchParams(window.location.search);
  for (const k of ['type', 'income', 'spouseIncome', 'otherIncome', 'existingInstallment', 'term', 'rate'] as (keyof FormData)[]) {
    const v = form[k];
    const def = defaults[k];
    if (v === def || (typeof v === 'number' && v === 0)) sp.delete(k as string);
    else sp.set(k as string, String(v));
  }
  const qs = sp.toString();
  window.history.replaceState(null, '', qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
}

function compute(data: FormData): CalcResult {
  const totalIncome = data.income + data.spouseIncome + data.otherIncome;
  const maxInstallment = (totalIncome / 2) - data.existingInstallment;
  if (maxInstallment <= 0 || data.term <= 0 || data.rate <= 0) {
    return { maxInstallment: Math.max(0, maxInstallment), maxLoan: 0, totalPayment: 0 };
  }
  const t = TYPES.find(x => x.value === data.type) || TYPES[0];
  const r = data.rate / 100;
  const pow = Math.pow(1 + r, data.term);
  const maxLoanBase = maxInstallment * (pow - 1) / (r * pow);
  const verify = annuityPayment(maxLoanBase, r, data.term);
  const interestFirstMonth = maxLoanBase * r;
  const taxOnFirstMonth = interestFirstMonth * (t.bsmv + t.kkdf);
  const actualMonthly = verify + taxOnFirstMonth;
  const adjustedLoan = maxLoanBase * (maxInstallment / actualMonthly);
  return {
    maxInstallment,
    maxLoan: Math.max(0, adjustedLoan),
    totalPayment: maxInstallment * data.term,
  };
}

export function NeKadarKrediAlabilirim() {
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
      <p className="text-sm text-muted-foreground mb-4">Gelirinize göre alabileceğiniz maksimum kredi tutarını hesaplayın. Bankalar genellikle hane gelirinin yarısını taksit sınırı olarak uygular.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Select label="Kredi Türü" options={TYPES.map(t => ({ value: t.value, label: t.label }))} {...register('type')} />
        <Input label="Aylık Gelir (₺)" type="number" step="0.01" placeholder="Örn. 30000" {...register('income')} error={errors.income?.message} />
        <Input label="Eşin Geliri (₺)" type="number" step="0.01" defaultValue="0" {...register('spouseIncome')} />
        <Input label="Diğer Hane Geliri (₺)" type="number" step="0.01" defaultValue="0" {...register('otherIncome')} />
        <Input label="Mevcut Kredi Taksitleri (₺)" type="number" step="0.01" defaultValue="0" {...register('existingInstallment')} />
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
            <ResultRow label="Maks. Aylık Taksit" value={fmtTL(result.maxInstallment)} />
            <ResultRow label="Alabileceğiniz Kredi" value={fmtTL(result.maxLoan)} highlight />
            <ResultRow label="Toplam Geri Ödeme" value={fmtTL(result.totalPayment)} />
          </ResultCard>
        </>
      )}

      <ToolInfo
        title="Ne Kadar Kredi Alabilirim?"
        description="Bankalar kredi verirken hane halkının toplam gelirinin yarısını aşmayacak şekilde taksit tutarı belirler. Mevcut kredi taksitleriniz de bu sınırdan düşülür."
        faqs={[
          { q: 'Gelirin yarısı kuralı nedir?', a: 'Bankalar aylık taksit tutarının hane gelirinin yarısını geçmemesini şart koşar. Bu BDDK düzenlemesidir.' },
          { q: 'Eşin geliri dahil ediliyor mu?', a: 'Evet, eşin çalışması durumunda geliri hane gelirine eklenerek kredi limiti artırılabilir.' },
        ]}
      />
    </>
  );
}
