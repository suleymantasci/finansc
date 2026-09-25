'use client';
import { isToolHydrated } from './_shared/hydration';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { fmtTL } from './_shared/calc';
import { ResultCard, ResultRow, ToolInfo } from './_shared/ToolInfo';
import { ShareButton } from '@/components/shared/ShareButton';

const schema = z.object({
  spotPrice: z.coerce.number().min(0.01, 'Spot fiyat giriniz'),
  dividendYield: z.coerce.number().min(0, 'Temettü verimi giriniz'),
  days: z.coerce.number().min(1, 'Vade giriniz'),
  riskFreeRate: z.coerce.number().min(0, 'Risksiz faiz oranı giriniz'),
});
type FormData = z.infer<typeof schema>;
type CalcResult = { theoreticalPrice: number; costOfCarry: number };
const defaults: FormData = { spotPrice: 0, dividendYield: 0, days: 0, riskFreeRate: 0 };

function readFormFromUrl(): FormData {
  if (typeof window === 'undefined' || !isToolHydrated()) return defaults;
  const sp = new URLSearchParams(window.location.search);
  const num = (k: keyof FormData): number => {
    const v = sp.get(k as string);
    if (v === null || v === '') return defaults[k];
    const n = Number(v);
    return Number.isFinite(n) ? n : defaults[k];
  };
  return {
    spotPrice: num('spotPrice'),
    dividendYield: num('dividendYield'),
    days: num('days'),
    riskFreeRate: num('riskFreeRate'),
  };
}

function writeFormToUrl(form: FormData) {
  if (typeof window === 'undefined') return;
  const sp = new URLSearchParams(window.location.search);
  for (const k of ['spotPrice', 'dividendYield', 'days', 'riskFreeRate'] as (keyof FormData)[]) {
    const v = form[k];
    if (v === 0) sp.delete(k as string);
    else sp.set(k as string, String(v));
  }
  const qs = sp.toString();
  window.history.replaceState(null, '', qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
}

function compute(data: FormData): CalcResult {
  const r = data.riskFreeRate / 100;
  const d = data.dividendYield / 100;
  const t = data.days / 365;
  const theoreticalPrice = data.spotPrice * (1 + (r - d) * t);
  return { theoreticalPrice, costOfCarry: theoreticalPrice - data.spotPrice };
}

export function VadeliIslemFiyati() {
  const initialForm = readFormFromUrl();
  const [result, setResult] = useState<CalcResult | null>(
    initialForm.spotPrice > 0 && initialForm.days > 0 && initialForm.riskFreeRate > 0
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
      <p className="text-sm text-muted-foreground mb-4">Vadeli işlem (futures) sözleşmesinin teorik fiyatını hesaplayın. Taşıma maliyeti modeli kullanılır.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Dayanak Varlık (Spot) Fiyatı (₺)" type="number" step="0.01" placeholder="Örn. 100" {...register('spotPrice')} error={errors.spotPrice?.message} />
        <Input label="Temettü Verimi (% / Yıl)" type="number" step="0.01" placeholder="Örn. 2" {...register('dividendYield')} error={errors.dividendYield?.message} />
        <Input label="Vadeye Kalan Gün" type="number" placeholder="Örn. 90" {...register('days')} error={errors.days?.message} />
        <Input label="Risksiz Faiz Oranı (% / Yıl)" type="number" step="0.01" placeholder="Örn. 45" {...register('riskFreeRate')} error={errors.riskFreeRate?.message} />
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
            <ResultRow label="Teorik Vadeli Fiyat" value={fmtTL(result.theoreticalPrice)} highlight />
            <ResultRow label="Taşıma Maliyeti" value={fmtTL(result.costOfCarry)} />
          </ResultCard>
        </>
      )}

      <ToolInfo
        title="Vadeli İşlem Fiyatı Nedir?"
        description="Vadeli işlem (futures) sözleşmesinin teorik fiyatı, taşıma maliyeti modeliyle hesaplanır. Formül: F = S × (1 + (r - d) × t), burada S spot fiyat, r risksiz faiz, d temettü verimi, t vadedir."
        faqs={[
          { q: 'Taşıma maliyeti nedir?', a: 'Dayanak varlığı elde tutmanın maliyetidir (finansman maliyeti - temettü geliri).' },
          { q: 'Teorik fiyat ile piyasa fiyatı neden farklı olabilir?', a: 'Arz-talep dengesizliği, likidite farkı ve beklentiler gibi nedenlerle sapma olabilir.' },
        ]}
      />
    </>
  );
}
