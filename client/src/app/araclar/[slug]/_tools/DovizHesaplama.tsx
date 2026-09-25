'use client';
import { isToolHydrated } from './_shared/hydration';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { fmtNum } from './_shared/calc';
import { ResultCard, ResultRow, ToolInfo } from './_shared/ToolInfo';
import { ShareButton } from '@/components/shared/ShareButton';

const schema = z.object({
  amount: z.coerce.number().min(0.01, 'Miktar giriniz'),
  fromRate: z.coerce.number().min(0.0001, 'Kaynak kur giriniz'),
  toRate: z.coerce.number().min(0.0001, 'Hedef kur giriniz'),
});
type FormData = z.infer<typeof schema>;

const defaults: FormData = { amount: 0, fromRate: 0, toRate: 0 };

function readFormFromUrl(): FormData {
  if (typeof window === 'undefined' || !isToolHydrated()) return defaults;
  const sp = new URLSearchParams(window.location.search);
  const num = (k: keyof FormData): number => {
    const v = sp.get(k as string);
    if (v === null || v === '') return defaults[k];
    const n = Number(v);
    return Number.isFinite(n) ? n : defaults[k];
  };
  return { amount: num('amount'), fromRate: num('fromRate'), toRate: num('toRate') };
}

function writeFormToUrl(form: FormData) {
  if (typeof window === 'undefined') return;
  const sp = new URLSearchParams(window.location.search);
  for (const k of ['amount', 'fromRate', 'toRate'] as (keyof FormData)[]) {
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

export function DovizHesaplama() {
  const initialForm = readFormFromUrl();
  const hasInitialData = initialForm.amount > 0 && initialForm.fromRate > 0 && initialForm.toRate > 0;
  const [result, setResult] = useState<{ converted: number } | null>(
    hasInitialData ? computeDoviz(initialForm) : null,
  );
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema), defaultValues: initialForm,
  });

  const onSubmit = (data: FormData) => {
    setResult(computeDoviz(data));
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
      <p className="text-sm text-muted-foreground mb-4">İki para birimi arasında döviz çevirisi yapın. Kaynak ve hedef para biriminin TL karşılıklarını girerek hesaplayın.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Miktar" type="number" step="0.01" placeholder="Örn. 1000" {...register('amount')} error={errors.amount?.message} />
        <Input label="Kaynak Para Birimi Kuru (1 birim = ? TL)" type="number" step="0.0001" placeholder="Örn. 38.50 (USD/TL)" {...register('fromRate')} error={errors.fromRate?.message} />
        <Input label="Hedef Para Birimi Kuru (1 birim = ? TL)" type="number" step="0.0001" placeholder="Örn. 1 (TL için)" {...register('toRate')} error={errors.toRate?.message} />
        <p className="text-xs text-muted-foreground">Not: TL&apos;ye çeviri için hedef kuru 1 giriniz. TL&apos;den dövize çeviri için kaynak kuru 1 giriniz.</p>
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
            <ResultRow label="Çevrilen Tutar" value={fmtNum(result.converted, 4)} />
          </ResultCard>
        </>
      )}

      <ToolInfo
        title="Döviz Hesaplama Nedir?"
        description="Döviz hesaplama aracı ile farklı para birimleri arasında çeviri yapabilirsiniz. Hesaplama, girilen kurlar üzerinden yapılmaktadır. Güncel kurları Döviz sayfamızdan öğrenebilirsiniz."
        faqs={[
          { q: 'Döviz kuru nedir?', a: 'Bir ülke parasının başka bir ülke parası cinsinden değeridir.' },
          { q: 'Alış ve satış kuru farkı nedir?', a: 'Alış kuru bankanın dövizi sizden alacağı fiyat, satış kuru size satacağı fiyattır. Satış kuru her zaman daha yüksektir.' },
        ]}
      />
    </>
  );
}

function computeDoviz(data: FormData) {
  return { converted: (data.amount * data.fromRate) / data.toRate };
}
