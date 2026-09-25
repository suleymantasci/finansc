'use client';
import { isToolHydrated } from './_shared/hydration';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { simpleInterest, fmtTL } from './_shared/calc';
import { ResultCard, ResultRow, ToolInfo } from './_shared/ToolInfo';
import { ShareButton } from '@/components/shared/ShareButton';

const schema = z.object({
  principal: z.coerce.number().min(1, 'Anapara giriniz'),
  rate: z.coerce.number().min(0.01, 'Faiz oranı giriniz'),
  days: z.coerce.number().min(1, 'Vade giriniz'),
});
type FormData = z.infer<typeof schema>;

const defaults: FormData = { principal: 0, rate: 0, days: 0 };

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
    principal: num('principal'),
    rate: num('rate'),
    days: num('days'),
  };
}

function writeFormToUrl(form: FormData) {
  if (typeof window === 'undefined') return;
  const sp = new URLSearchParams(window.location.search);
  for (const k of ['principal', 'rate', 'days'] as (keyof FormData)[]) {
    const v = form[k];
    if (v === defaults[k]) sp.delete(k as string);
    else sp.set(k as string, String(v));
  }
  const qs = sp.toString();
  window.history.replaceState(
    null, '',
    qs ? `${window.location.pathname}?${qs}` : window.location.pathname,
  );
}

export function BonoHesaplama() {
  const initialForm = readFormFromUrl();
  const hasInitialData = initialForm.principal > 0 && initialForm.rate > 0 && initialForm.days > 0;
  const [result, setResult] = useState<{ gross: number; tax: number; net: number } | null>(
    hasInitialData ? computeBono(initialForm) : null,
  );
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: initialForm });

  const onSubmit = (data: FormData) => {
    setResult(computeBono(data));
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
      <p className="text-sm text-muted-foreground mb-4">Hazine bonosu yatırımınızdan elde edeceğiniz getiriyi hesaplayın. Bono getirisi üzerinden %15 stopaj uygulanır.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Anapara (₺)" type="number" step="0.01" placeholder="Örn. 100000" {...register('principal')} error={errors.principal?.message} />
        <Input label="Yıllık Faiz Oranı (%)" type="number" step="0.01" placeholder="Örn. 25" {...register('rate')} error={errors.rate?.message} />
        <Input label="Vadeye Kalan Gün" type="number" placeholder="Örn. 90" {...register('days')} error={errors.days?.message} />
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
            <ResultRow label="Brüt Getiri" value={fmtTL(result.gross)} />
            <ResultRow label="Stopaj (%15)" value={fmtTL(result.tax)} />
            <ResultRow label="Net Getiri" value={fmtTL(result.net)} highlight />
          </ResultCard>
        </>
      )}

      <ToolInfo
        title="Bono Hesaplama Nedir?"
        description="Hazine bonosu, devletin kısa vadeli (1 yıla kadar) borçlanma aracıdır. Getirisi = (Anapara / 100) × (Faiz / 365) × Gün formülüyle hesaplanır. Brüt getiri üzerinden %15 stopaj kesilir."
        faqs={[
          { q: 'Bono ile tahvil arasındaki fark nedir?', a: 'Bono 1 yıldan kısa vadeli, tahvil 1 yıldan uzun vadeli devlet borçlanma aracıdır.' },
          { q: 'Bono güvenli midir?', a: 'Devlet garantisi altında olduğu için en güvenli yatırım araçlarından biridir.' },
        ]}
      />
    </>
  );
}

function computeBono(data: FormData) {
  const gross = simpleInterest(data.principal, data.rate, data.days);
  const tax = gross * 0.15;
  return { gross, tax, net: gross - tax };
}
