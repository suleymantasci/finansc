'use client';
import { isToolHydrated } from './_shared/hydration';

import { useState } from 'react';
import { fetchHistory } from '@/lib/history';
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
  rate: z.coerce.number().min(0.0001, 'Kur giriniz'),
});
type FormData = z.infer<typeof schema>;
const defaults: FormData = { amount: 0, rate: 0 };

function readFormFromUrl(): FormData {
  if (typeof window === 'undefined' || !isToolHydrated()) return defaults;
  const sp = new URLSearchParams(window.location.search);
  const num = (k: keyof FormData): number => {
    const v = sp.get(k as string);
    if (v === null || v === '') return defaults[k];
    const n = Number(v);
    return Number.isFinite(n) ? n : defaults[k];
  };
  return { amount: num('amount'), rate: num('rate') };
}

function writeFormToUrl(form: FormData) {
  if (typeof window === 'undefined') return;
  const sp = new URLSearchParams(window.location.search);
  for (const k of ['amount', 'rate'] as (keyof FormData)[]) {
    const v = form[k];
    if (v === defaults[k]) sp.delete(k as string);
    else sp.set(k as string, String(v));
  }
  const qs = sp.toString();
  window.history.replaceState(null, '', qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
}

export function GecmisDovizKurlari() {
  const initialForm = readFormFromUrl();
  const hasInitialData = initialForm.amount > 0 && initialForm.rate > 0;
  const [result, setResult] = useState<number | null>(hasInitialData ? initialForm.amount * initialForm.rate : null);
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: initialForm });

  // Tarih + para birimi seçilince kuru API'den otomatik getir.
  // Kaynak: TCMB resmi kuru (merkez-bankasi serisi) — geçmiş hesaplamada
  // resmi kur kullanmak serbest piyasadan daha doğru bir referanstır.
  const [rateDate, setRateDate] = useState('');
  const [code, setCode] = useState('USD');
  const [lookupState, setLookupState] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');

  const lookupRate = async (nextCode: string, date: string) => {
    setCode(nextCode);
    setRateDate(date);
    if (!date) return;
    setLookupState('loading');
    try {
      const to = new Date(date);
      const from = new Date(to.getTime() - 10 * 86400000);
      let series = await fetchHistory(`fx:${nextCode}:merkez-bankasi`, {
        interval: '1d',
        from: from.toISOString().slice(0, 10),
        to: date,
      }).catch(() => null);
      if (!series || series.points.length === 0) {
        series = await fetchHistory(`fx:${nextCode}:serbest-piyasa`, {
          interval: '1d',
          from: from.toISOString().slice(0, 10),
          to: date,
        });
      }
      const last = series?.points?.[series.points.length - 1];
      if (!last) {
        setLookupState('error');
        return;
      }
      setValue('rate', Number(last.c.toFixed(4)));
      setLookupState('ok');
    } catch {
      setLookupState('error');
    }
  };

  const onSubmit = (data: FormData) => {
    setResult(data.amount * data.rate);
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
      <p className="text-sm text-muted-foreground mb-4">Geçmiş bir tarihteki döviz kuru ile hesaplama yapın. O tarihte geçerli olan kuru girerek çeviri yapabilirsiniz.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Miktar" type="number" step="0.01" placeholder="Örn. 1000" {...register('amount')} error={errors.amount?.message} />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-sm font-medium" htmlFor="gecmis-doviz-kod">Para Birimi</label>
            <select
              id="gecmis-doviz-kod"
              value={code}
              onChange={(e) => lookupRate(e.target.value, rateDate)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              {['USD', 'EUR', 'GBP', 'CHF', 'JPY', 'CAD', 'AUD', 'SAR', 'RUB', 'CNY'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium" htmlFor="gecmis-doviz-tarih">Tarih</label>
            <input
              id="gecmis-doviz-tarih"
              type="date"
              value={rateDate}
              max={new Date().toISOString().slice(0, 10)}
              min="2021-01-01"
              onChange={(e) => lookupRate(code, e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground -mt-2">
          {lookupState === 'loading' && 'Kur getiriliyor…'}
          {lookupState === 'ok' && 'O günün kuru otomatik dolduruldu.'}
          {lookupState === 'error' && 'Bu tarih için kur bulunamadı, elle girebilirsiniz.'}
          {lookupState === 'idle' && 'Tarih seçerseniz kur otomatik gelir.'}
        </p>
        <Input label="O Tarihteki Döviz Kuru" type="number" step="0.0001" placeholder="Örn. 18.7450" {...register('rate')} error={errors.rate?.message} />
        <div className="flex gap-2">
          <Button type="submit" className="flex-1">Hesapla</Button>
          <Button type="button" variant="outline" onClick={handleReset}>Sıfırla</Button>
        </div>
      </form>

      {result !== null && (
        <>
          <div className="flex items-center justify-between gap-2 mt-6 flex-wrap">
            <p className="text-sm text-muted-foreground">Sonucu paylaş — link'i kopyalayıp gönderebilirsiniz.</p>
            <ShareButton shareUrl={shareUrl} />
          </div>
          <ResultCard>
            <ResultRow label="Sonuç" value={fmtNum(result, 4)} />
          </ResultCard>
        </>
      )}

      <ToolInfo
        title="Geçmiş Döviz Kurları Nedir?"
        description="Geçmiş döviz kurları hesaplama aracı ile eski tarihlerdeki döviz kurlarıyla hesaplama yapabilirsiniz. Geçmiş kur bilgisini TCMB arşivinden veya finans sitelerinden bulabilirsiniz."
        faqs={[
          { q: 'Geçmiş kurları nereden bulabilirim?', a: 'TCMB\'nin resmi web sitesinden günlük kapanış kurlarına ulaşabilirsiniz.' },
          { q: 'Parite nedir?', a: 'İki ülke parasının karşılıklı değeridir. Örneğin USD/TRY paritesi.' },
        ]}
      />
    </>
  );
}
