'use client';

import { useState, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { fmtPct, fmtNum } from './_shared/calc';
import { ResultCard, ResultRow, ToolInfo } from './_shared/ToolInfo';
import { ShareButton } from '@/components/shared/ShareButton';

const schema = z.object({
  periodType: z.string(),
  startValue: z.coerce.number().min(0.01, 'Başlangıç değeri giriniz'),
  endValue: z.coerce.number().min(0.01, 'Bitiş değeri giriniz'),
  periods: z.coerce.number().min(1, 'Dönem sayısı giriniz'),
});
type FormData = z.infer<typeof schema>;

const defaults: FormData = { periodType: 'year', startValue: 0, endValue: 0, periods: 0 };

function readFormFromUrl(params: URLSearchParams): FormData {
  const num = (k: keyof FormData): number => {
    const v = params.get(k as string);
    if (v === null || v === '') return defaults[k] as number;
    const n = Number(v);
    return Number.isFinite(n) ? n : (defaults[k] as number);
  };
  return {
    periodType: params.get('periodType') ?? defaults.periodType,
    startValue: num('startValue'),
    endValue: num('endValue'),
    periods: num('periods'),
  };
}

function writeFormToUrl(form: FormData) {
  if (typeof window === 'undefined') return;
  const sp = new URLSearchParams(window.location.search);
  for (const k of ['periodType', 'startValue', 'endValue', 'periods'] as (keyof FormData)[]) {
    const v = form[k];
    const def = defaults[k];
    if (v === def || (typeof v === 'number' && v === 0) || v === '') {
      sp.delete(k as string);
    } else {
      sp.set(k as string, String(v));
    }
  }
  const qs = sp.toString();
  window.history.replaceState(
    null, '',
    qs ? `${window.location.pathname}?${qs}` : window.location.pathname,
  );
}

export function BilesikBuyume() {
  return (
    <Suspense fallback={null}>
      <BilesikBuyumeInner />
    </Suspense>
  );
}

function BilesikBuyumeInner() {
  const initialForm = readFormFromUrl(
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams(),
  );
  const hasInitialData = initialForm.startValue > 0 && initialForm.endValue > 0 && initialForm.periods > 0;
  const [result, setResult] = useState<{ cagr: number; totalGrowth: number } | null>(
    hasInitialData ? computeCagr(initialForm) : null,
  );
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema), defaultValues: initialForm,
  });

  const onSubmit = (data: FormData) => {
    setResult(computeCagr(data));
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
      <p className="text-sm text-muted-foreground mb-4">Bileşik büyüme oranını (CAGR) hesaplayın. Bir yatırımın veya değerin belirli bir dönemdeki ortalama yıllık büyüme oranını bulun.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Select label="Dönem Türü" options={[
          { value: 'year', label: 'Yıl' },
          { value: 'month', label: 'Ay' },
        ]} {...register('periodType')} />
        <Input label="Başlangıç Değeri" type="number" step="0.01" placeholder="Örn. 100000" {...register('startValue')} error={errors.startValue?.message} />
        <Input label="Bitiş Değeri" type="number" step="0.01" placeholder="Örn. 150000" {...register('endValue')} error={errors.endValue?.message} />
        <Input label="Dönem Sayısı" type="number" placeholder="Örn. 5" {...register('periods')} error={errors.periods?.message} />
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
            <ResultRow label="Bileşik Büyüme Oranı (CAGR)" value={fmtPct(result.cagr)} highlight />
            <ResultRow label="Toplam Büyüme" value={fmtPct(result.totalGrowth)} />
          </ResultCard>
        </>
      )}

      <ToolInfo
        title="Bileşik Büyüme Oranı (CAGR) Nedir?"
        description="CAGR (Compound Annual Growth Rate), bir yatırımın belirli bir dönemdeki yıllık ortalama büyüme oranıdır. Başlangıç ve bitiş değerleri ile dönem sayısı kullanılarak hesaplanır. Formül: CAGR = (Bitiş/Başlangıç)^(1/n) - 1"
        faqs={[
          { q: 'CAGR ne işe yarar?', a: 'Farklı yatırımların performansını karşılaştırmak için kullanılır. Dönemler arasındaki dalgalanmaları düzleştirerek ortalama büyüme oranını gösterir.' },
          { q: 'CAGR ile basit getiri farkı nedir?', a: 'Basit getiri toplam kazancı gösterirken, CAGR bunu yıllık ortalamaya çevirir.' },
        ]}
      />
    </>
  );
}

function computeCagr(data: FormData) {
  const cagr = (Math.pow(data.endValue / data.startValue, 1 / data.periods) - 1) * 100;
  const totalGrowth = ((data.endValue - data.startValue) / data.startValue) * 100;
  return { cagr, totalGrowth };
}
