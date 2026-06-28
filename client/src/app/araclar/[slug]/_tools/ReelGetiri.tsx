'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { fmtTL, fmtPct } from './_shared/calc';
import { ResultCard, ResultRow, ToolInfo } from './_shared/ToolInfo';
import { ShareButton } from '@/components/shared/ShareButton';

const schema = z.object({
  investment: z.coerce.number().min(0.01, 'Yatırım tutarı giriniz'),
  endValue: z.coerce.number().min(0.01, 'Vade sonu tutarı giriniz'),
  inflationRate: z.coerce.number().min(0, 'Enflasyon oranı giriniz'),
});
type FormData = z.infer<typeof schema>;
type CalcResult = { nominal: number; real: number; nominalReturn: number; realReturn: number };
const defaults: FormData = { investment: 0, endValue: 0, inflationRate: 0 };

function readFormFromUrl(): FormData {
  if (typeof window === 'undefined') return defaults;
  const sp = new URLSearchParams(window.location.search);
  const num = (k: keyof FormData): number => {
    const v = sp.get(k as string);
    if (v === null || v === '') return defaults[k];
    const n = Number(v);
    return Number.isFinite(n) ? n : defaults[k];
  };
  return { investment: num('investment'), endValue: num('endValue'), inflationRate: num('inflationRate') };
}

function writeFormToUrl(form: FormData) {
  if (typeof window === 'undefined') return;
  const sp = new URLSearchParams(window.location.search);
  for (const k of ['investment', 'endValue', 'inflationRate'] as (keyof FormData)[]) {
    const v = form[k];
    if (v === 0) sp.delete(k as string);
    else sp.set(k as string, String(v));
  }
  const qs = sp.toString();
  window.history.replaceState(null, '', qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
}

function compute(data: FormData): CalcResult {
  const nominal = (data.endValue - data.investment) / data.investment;
  const inflation = data.inflationRate / 100;
  const real = (1 + nominal) / (1 + inflation) - 1;
  return {
    nominal: nominal * 100,
    real: real * 100,
    nominalReturn: data.endValue - data.investment,
    realReturn: data.investment * real,
  };
}

export function ReelGetiri() {
  const initialForm = readFormFromUrl();
  const [result, setResult] = useState<CalcResult | null>(
    initialForm.investment > 0 && initialForm.endValue > 0 && initialForm.inflationRate > 0
      ? compute(initialForm) : null,
  );
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: initialForm });

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
      <p className="text-sm text-muted-foreground mb-4">Yatırımınızın enflasyondan arındırılmış gerçek getirisini hesaplayın.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Yatırım Tutarı (₺)" type="number" step="0.01" placeholder="Örn. 100000" {...register('investment')} error={errors.investment?.message} />
        <Input label="Vade Sonundaki Tutar (₺)" type="number" step="0.01" placeholder="Örn. 150000" {...register('endValue')} error={errors.endValue?.message} />
        <Input label="Dönem Enflasyon Oranı (%)" type="number" step="0.01" placeholder="Örn. 45.80" {...register('inflationRate')} error={errors.inflationRate?.message} />
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
            <ResultRow label="Nominal Getiri Oranı" value={fmtPct(result.nominal)} />
            <ResultRow label="Nominal Getiri Tutarı" value={fmtTL(result.nominalReturn)} />
            <ResultRow label="Reel Getiri Oranı" value={fmtPct(result.real)} highlight />
            <ResultRow label="Reel Getiri Tutarı" value={fmtTL(result.realReturn)} />
          </ResultCard>
        </>
      )}

      <ToolInfo
        title="Reel Getiri Nedir?"
        description="Reel getiri, bir yatırımın enflasyondan arındırılmış gerçek getirisini ifade eder. Fisher denklemi ile hesaplanır: Reel Getiri = (1 + Nominal Getiri) / (1 + Enflasyon) - 1"
        faqs={[
          { q: 'Reel getiri neden önemli?', a: 'Nominal getiri yanıltıcı olabilir. Reel getiri, paranızın satın alma gücünün gerçekten artıp artmadığını gösterir.' },
          { q: 'Negatif reel getiri ne demek?', a: 'Yatırımınızın enflasyonun altında kaldığı, satın alma gücünüzün azaldığı anlamına gelir.' },
        ]}
      />
    </>
  );
}
