'use client';

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
  amount: z.coerce.number().min(1, 'Tutar giriniz'),
  rate: z.coerce.number().min(0.01, 'Faiz oranı giriniz'),
  term: z.coerce.number().min(1, 'Vade giriniz'),
  paidMonths: z.coerce.number().min(0, 'Ödenen taksit sayısı giriniz'),
  delayDays: z.coerce.number().min(1, 'Gecikme süresi giriniz').max(365),
});
type FormData = z.infer<typeof schema>;
type CalcResult = { installment: number; delayInterest: number; delayBsmv: number; delayKkdf: number; total: number };
const defaults: FormData = { type: 'ihtiyac', amount: 0, rate: 0, term: 0, paidMonths: 0, delayDays: 0 };

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
    amount: num('amount'), rate: num('rate'), term: num('term'),
    paidMonths: num('paidMonths'), delayDays: num('delayDays'),
  };
}

function writeFormToUrl(form: FormData) {
  if (typeof window === 'undefined') return;
  const sp = new URLSearchParams(window.location.search);
  for (const k of ['type', 'amount', 'rate', 'term', 'paidMonths', 'delayDays'] as (keyof FormData)[]) {
    const v = form[k];
    const def = defaults[k];
    if (v === def || (typeof v === 'number' && v === 0)) sp.delete(k as string);
    else sp.set(k as string, String(v));
  }
  const qs = sp.toString();
  window.history.replaceState(null, '', qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
}

function compute(data: FormData): CalcResult {
  const t = TYPES.find(x => x.value === data.type) || TYPES[0];
  const r = data.rate / 100;
  const monthly = annuityPayment(data.amount, r, data.term);
  let balance = data.amount;
  for (let i = 0; i < data.paidMonths; i++) {
    balance -= (monthly - balance * r);
  }
  balance = Math.max(0, balance);
  const currentInterest = balance * r;
  const delayRate = r * 1.30;
  const dailyDelay = (monthly * delayRate) / 30;
  const delayInterest = dailyDelay * data.delayDays;
  const delayBsmv = delayInterest * t.bsmv;
  const delayKkdf = delayInterest * t.kkdf;
  const total = monthly + delayInterest + delayBsmv + delayKkdf + currentInterest * t.bsmv + currentInterest * t.kkdf;
  return { installment: monthly, delayInterest, delayBsmv, delayKkdf, total };
}

export function KrediGecikmeFaizi() {
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
      <p className="text-sm text-muted-foreground mb-4">Kredi taksitinizi geç ödemeniz durumunda oluşacak gecikme faizini hesaplayın. Gecikme faiz oranı, kredi faiz oranının 1,30 katıdır.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Select label="Kredi Türü" options={TYPES.map(t => ({ value: t.value, label: t.label }))} {...register('type')} />
        <Input label="Kredi Tutarı (₺)" type="number" step="0.01" placeholder="Örn. 100000" {...register('amount')} error={errors.amount?.message} />
        <Input label="Vade (Ay)" type="number" {...register('term')} error={errors.term?.message} />
        <Input label="Aylık Faiz Oranı (%)" type="number" step="0.01" {...register('rate')} error={errors.rate?.message} />
        <Input label="Ödenen Taksit Sayısı" type="number" {...register('paidMonths')} error={errors.paidMonths?.message} />
        <Input label="Gecikme Süresi (Gün)" type="number" placeholder="Örn. 15" {...register('delayDays')} error={errors.delayDays?.message} />
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
            <ResultRow label="Aylık Taksit" value={fmtTL(result.installment)} />
            <ResultRow label="Gecikme Faizi" value={fmtTL(result.delayInterest)} highlight />
            <ResultRow label="Gecikme BSMV" value={fmtTL(result.delayBsmv)} />
            <ResultRow label="Gecikme KKDF" value={fmtTL(result.delayKkdf)} />
            <ResultRow label="Toplam Ödenecek" value={fmtTL(result.total)} />
          </ResultCard>
        </>
      )}

      <ToolInfo
        title="Kredi Gecikme Faizi Nedir?"
        description="Kredi taksitlerinin zamanında ödenmemesi durumunda uygulanan ek faizdir. Gecikme faiz oranı, kredi faiz oranının 1,30 katı olarak hesaplanır. Gecikme süresince her gün için faiz işler ve üzerine BSMV ile KKDF eklenir."
        faqs={[
          { q: 'Gecikme faizi nasıl hesaplanır?', a: 'Gecikme faizi = Taksit tutarı × (kredi faiz oranı × 1.30) / 30 × gecikme gün sayısı formülüyle hesaplanır.' },
          { q: 'Gecikme faizi kredi notunu etkiler mi?', a: 'Evet, taksit gecikmesi kredi notunuzu (findeks puanınızı) olumsuz etkiler.' },
        ]}
      />
    </>
  );
}
