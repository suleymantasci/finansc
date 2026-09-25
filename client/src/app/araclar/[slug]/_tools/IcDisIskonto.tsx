'use client';
import { isToolHydrated } from './_shared/hydration';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { fmtTL } from './_shared/calc';
import { ResultCard, ResultRow, ToolInfo } from './_shared/ToolInfo';
import { ShareButton } from '@/components/shared/ShareButton';

const schema = z.object({
  type: z.string(),
  value: z.coerce.number().min(0.01, 'Değer giriniz'),
  rate: z.coerce.number().min(0.01, 'İskonto oranı giriniz'),
  days: z.coerce.number().min(1, 'Vade giriniz'),
});
type FormData = z.infer<typeof schema>;
const defaults: FormData = { type: 'outer', value: 0, rate: 0, days: 0 };

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
    value: num('value'),
    rate: num('rate'),
    days: num('days'),
  };
}

function writeFormToUrl(form: FormData) {
  if (typeof window === 'undefined') return;
  const sp = new URLSearchParams(window.location.search);
  for (const k of ['type', 'value', 'rate', 'days'] as (keyof FormData)[]) {
    const v = form[k];
    const def = defaults[k];
    if (v === def || (typeof v === 'number' && v === 0)) {
      sp.delete(k as string);
    } else {
      sp.set(k as string, String(v));
    }
  }
  const qs = sp.toString();
  window.history.replaceState(null, '', qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
}

export function IcDisIskonto() {
  const initialForm = readFormFromUrl();
  const hasInitialData = initialForm.value > 0 && initialForm.rate > 0 && initialForm.days > 0;
  const [result, setResult] = useState<{ discount: number; otherValue: number } | null>(
    hasInitialData ? computeIskonto(initialForm) : null,
  );
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema), defaultValues: initialForm,
  });

  const onSubmit = (data: FormData) => {
    setResult(computeIskonto(data));
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
      <p className="text-sm text-muted-foreground mb-4">Basit dış iskonto, basit iç iskonto veya bileşik iç iskonto hesaplaması yapın.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Select label="Hesaplama Türü" options={[
          { value: 'outer', label: 'Basit Dış İskonto (Nominal → Peşin)' },
          { value: 'inner', label: 'Basit İç İskonto (Peşin → Nominal)' },
          { value: 'compound', label: 'Bileşik İç İskonto (Peşin → Nominal)' },
        ]} {...register('type')} />
        <Input label="Değer (₺)" type="number" step="0.01" placeholder="Nominal veya peşin değer" {...register('value')} error={errors.value?.message} />
        <Input label="İskonto Faiz Oranı (% / Yıl)" type="number" step="0.01" placeholder="Örn. 25" {...register('rate')} error={errors.rate?.message} />
        <Input label="Vadeye Kalan Süre (Gün)" type="number" placeholder="Örn. 90" {...register('days')} error={errors.days?.message} />
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
            <ResultRow label="İskonto Tutarı" value={fmtTL(result.discount)} highlight />
            <ResultRow label="Diğer Değer" value={fmtTL(result.otherValue)} />
          </ResultCard>
        </>
      )}

      <ToolInfo
        title="İç ve Dış İskonto Nedir?"
        description="İskonto, vadesi gelmemiş bir alacağın bugünkü değerini bulmak için yapılan indirim işlemidir. Dış iskontoda nominal değer üzerinden iskonto tutarı hesaplanarak peşin değer bulunur. İç iskontoda ise peşin değer üzerinden iskonto hesaplanarak nominal değere ulaşılır."
        faqs={[
          { q: 'Dış iskonto formülü nedir?', a: 'İskonto = Nominal × Oran × Vade / 360. Peşin Değer = Nominal - İskonto.' },
          { q: 'İç iskonto formülü nedir?', a: 'Nominal = Peşin × 360 / (360 - Oran × Vade)' },
        ]}
      />
    </>
  );
}

function computeIskonto(data: FormData) {
  const r = data.rate / 100;
  if (data.type === 'outer') {
    const discount = (data.value * r * data.days) / 360;
    return { discount, otherValue: data.value - discount };
  } else if (data.type === 'inner') {
    const nominal = (data.value * 360) / (360 - r * data.days);
    const discount = nominal - data.value;
    return { discount, otherValue: nominal };
  } else {
    const periods = data.days / 360;
    const nominal = data.value * Math.pow(1 + r, periods);
    const discount = nominal - data.value;
    return { discount, otherValue: nominal };
  }
}
