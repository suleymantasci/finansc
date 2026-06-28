'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { annuityPayment, fmtTL, fmtPct } from './_shared/calc';
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
  term: z.coerce.number().min(1),
  rate: z.coerce.number().min(0.01),
  totalCost: z.coerce.number().min(0),
});
type FormData = z.infer<typeof schema>;
type CalcResult = { ymo: number; monthlyEffective: number; totalCost: number };
const defaults: FormData = { type: 'ihtiyac', amount: 0, term: 0, rate: 0, totalCost: 0 };

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
    term: num('term'),
    rate: num('rate'),
    totalCost: num('totalCost'),
  };
}

function writeFormToUrl(form: FormData) {
  if (typeof window === 'undefined') return;
  const sp = new URLSearchParams(window.location.search);
  for (const k of ['type', 'amount', 'term', 'rate', 'totalCost'] as (keyof FormData)[]) {
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
  const totalPayment = monthly * data.term;
  const totalInterest = totalPayment - data.amount;
  const totalBsmvKkdf = totalInterest * (t.bsmv + t.kkdf);
  const allCosts = totalPayment + totalBsmvKkdf + data.totalCost;
  const netAmount = data.amount - data.totalCost;
  const monthlyPaymentWithTax = monthly + (totalBsmvKkdf / data.term);
  let effRate = r;
  for (let i = 0; i < 1000; i++) {
    const pow = Math.pow(1 + effRate, data.term);
    const pv = monthlyPaymentWithTax * (pow - 1) / (effRate * pow);
    const fVal = pv - netAmount;
    if (Math.abs(fVal) < 0.01) break;
    const h = 0.0001;
    const pow2 = Math.pow(1 + effRate + h, data.term);
    const pv2 = monthlyPaymentWithTax * (pow2 - 1) / ((effRate + h) * pow2);
    const dPv2 = (pv2 - pv) / h;
    if (Math.abs(dPv2) < 1e-12) break;
    effRate = effRate - fVal / dPv2;
    if (effRate < 0) effRate = r;
  }
  const ymo = (Math.pow(1 + effRate, 12) - 1) * 100;
  return { ymo, monthlyEffective: effRate * 100, totalCost: allCosts };
}

export function KrediYillikMaliyetOrani() {
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
      <p className="text-sm text-muted-foreground mb-4">Kredinin tüm masraflar dahil yıllık maliyet oranını (YMO) hesaplayın. YMO, faiz dışındaki tüm maliyetleri de içeren efektif yıllık orandır.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Select label="Kredi Türü" options={TYPES.map(t => ({ value: t.value, label: t.label }))} {...register('type')} />
        <Input label="Kredi Tutarı (₺)" type="number" step="0.01" {...register('amount')} error={errors.amount?.message} />
        <Input label="Vade (Ay)" type="number" {...register('term')} error={errors.term?.message} />
        <Input label="Aylık Faiz Oranı (%)" type="number" step="0.01" {...register('rate')} error={errors.rate?.message} />
        <Input label="Toplam Masraf (Dosya Masrafı vb.) (₺)" type="number" step="0.01" defaultValue="0" {...register('totalCost')} error={errors.totalCost?.message} />
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
            <ResultRow label="Yıllık Maliyet Oranı (YMO)" value={fmtPct(result.ymo)} highlight />
            <ResultRow label="Aylık Efektif Oran" value={fmtPct(result.monthlyEffective)} />
            <ResultRow label="Toplam Maliyet" value={fmtTL(result.totalCost)} />
          </ResultCard>
        </>
      )}

      <ToolInfo
        title="Yıllık Maliyet Oranı (YMO) Nedir?"
        description="Yıllık maliyet oranı, bir kredinin faiz, vergi ve tüm masrafları dahil olmak üzere gerçek yıllık maliyetini gösteren orandır. Farklı bankaların kredi tekliflerini karşılaştırmak için en güvenilir göstergedir."
        faqs={[
          { q: 'YMO neden önemlidir?', a: 'Farklı bankaların faiz oranları aynı olsa bile masraflar farklı olabilir. YMO tüm maliyetleri içerdiği için gerçek karşılaştırma yapmanızı sağlar.' },
          { q: 'YMO ile faiz oranı arasındaki fark nedir?', a: 'Faiz oranı sadece borçlanma maliyetini gösterirken, YMO vergi, masraf ve diğer tüm giderleri de içerir.' },
        ]}
      />
    </>
  );
}
