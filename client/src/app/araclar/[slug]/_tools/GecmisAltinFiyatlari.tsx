'use client';

import { useState } from 'react';
import { fetchHistory } from '@/lib/history';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { fmtTL, fmtNum } from './_shared/calc';
import { ResultCard, ResultRow, ToolInfo } from './_shared/ToolInfo';
import { ShareButton } from '@/components/shared/ShareButton';

const GOLD_TYPES = [
  { value: 'gram24', label: 'Gram Altın (24 Ayar)', gram: 1, ayar: 24 },
  { value: 'gram22', label: 'Gram Altın (22 Ayar)', gram: 1, ayar: 22 },
  { value: 'gram18', label: 'Gram Altın (18 Ayar)', gram: 1, ayar: 18 },
  { value: 'gram14', label: 'Gram Altın (14 Ayar)', gram: 1, ayar: 14 },
  { value: 'ons', label: 'Ons Altın', gram: 31.1034768, ayar: 24 },
  { value: 'ceyrek', label: 'Çeyrek Altın', gram: 1.754, ayar: 22 },
  { value: 'yarim', label: 'Yarım Altın', gram: 3.50, ayar: 22 },
  { value: 'tam', label: 'Tam/Ziynet Altın', gram: 7.00, ayar: 22 },
  { value: 'cumhuriyet', label: 'Cumhuriyet Altını', gram: 7.20, ayar: 22 },
];

const schema = z.object({
  direction: z.string(),
  goldType: z.string(),
  amount: z.coerce.number().min(0.01, 'Miktar giriniz'),
  gramPrice: z.coerce.number().min(0.01, 'O tarihte gram fiyatını giriniz'),
});
type FormData = z.infer<typeof schema>;

const defaults: FormData = { direction: 'toMoney', goldType: 'gram24', amount: 0, gramPrice: 0 };

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
    direction: sp.get('direction') ?? defaults.direction,
    goldType: sp.get('goldType') ?? defaults.goldType,
    amount: num('amount'),
    gramPrice: num('gramPrice'),
  };
}

function writeFormToUrl(form: FormData) {
  if (typeof window === 'undefined') return;
  const sp = new URLSearchParams(window.location.search);
  for (const k of ['direction', 'goldType', 'amount', 'gramPrice'] as (keyof FormData)[]) {
    const v = form[k];
    const def = defaults[k];
    if (v === def || (typeof v === 'number' && v === 0)) {
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

export function GecmisAltinFiyatlari() {
  const initialForm = readFormFromUrl();
  const hasInitialData = initialForm.amount > 0 && initialForm.gramPrice > 0;
  const [result, setResult] = useState<{ value: number; label: string } | null>(
    hasInitialData ? computeGecmisAltin(initialForm) : null,
  );
  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(schema), defaultValues: initialForm,
  });

  const direction = watch('direction');

  // Tarihten otomatik fiyat çekme — kullanıcı artık gram fiyatını elle
  // girmek zorunda değil. Seçilen günün kapanışı API'den gelir.
  const [priceDate, setPriceDate] = useState('');
  const [lookupState, setLookupState] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');

  const lookupPrice = async (date: string) => {
    setPriceDate(date);
    if (!date) return;
    setLookupState('loading');
    try {
      const to = new Date(date);
      const from = new Date(to.getTime() - 10 * 86400000); // tatil/hafta sonu payı
      const series = await fetchHistory('gold:serbest-piyasa:gram-altin', {
        interval: '1d',
        from: from.toISOString().slice(0, 10),
        to: date,
      });
      const last = series.points?.[series.points.length - 1];
      if (!last) {
        setLookupState('error');
        return;
      }
      setValue('gramPrice', Number(last.c.toFixed(2)));
      setLookupState('ok');
    } catch {
      setLookupState('error');
    }
  };

  const onSubmit = (data: FormData) => {
    setResult(computeGecmisAltin(data));
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
      <p className="text-sm text-muted-foreground mb-4">Geçmiş bir tarihteki altın fiyatı ile hesaplama yapın. O tarihteki gram altın fiyatını girerek değer hesaplayabilirsiniz.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Select label="İşlem Türü" options={[
          { value: 'toMoney', label: 'Altından Paraya' },
          { value: 'toGold', label: 'Paradan Altına' },
        ]} {...register('direction')} />
        <Select label="Altın Türü" options={GOLD_TYPES.map(t => ({ value: t.value, label: t.label }))} {...register('goldType')} />
        <div className="space-y-1">
          <label className="block text-sm font-medium" htmlFor="gecmis-altin-tarih">
            Tarih Seçin
          </label>
          <input
            id="gecmis-altin-tarih"
            type="date"
            value={priceDate}
            max={new Date().toISOString().slice(0, 10)}
            min="2021-01-01"
            onChange={(e) => lookupPrice(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <p className="text-xs text-muted-foreground">
            {lookupState === 'loading' && 'Fiyat getiriliyor…'}
            {lookupState === 'ok' && 'O günün gram altın kapanışı otomatik dolduruldu.'}
            {lookupState === 'error' && 'Bu tarih için fiyat bulunamadı, elle girebilirsiniz.'}
            {lookupState === 'idle' && 'Tarih seçerseniz gram fiyatı otomatik gelir.'}
          </p>
        </div>
        <Input label="O Tarihteki Gram Fiyatı (₺)" type="number" step="0.01" placeholder="Geçmiş tarihte gram altın fiyatı" {...register('gramPrice')} error={errors.gramPrice?.message} />
        <Input
          label={direction === 'toMoney' ? 'Miktar (gram/ons/adet)' : 'Tutar (₺)'}
          type="number" step="0.01" placeholder="Örn. 10"
          {...register('amount')} error={errors.amount?.message}
        />
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
            <ResultRow label={result.label} value={result.label.includes('Miktarı') ? fmtNum(result.value, 4) : fmtTL(result.value)} />
          </ResultCard>
        </>
      )}

      <ToolInfo
        title="Geçmiş Altın Fiyatları Nedir?"
        description="Geçmiş altın fiyatları hesaplama aracı ile eski tarihlerdeki altın fiyatlarıyla hesaplama yapabilirsiniz. Tarih seçtiğinizde o günün gram altın kapanış fiyatı otomatik gelir; isterseniz elle de girebilirsiniz."
        faqs={[
          { q: 'Geçmiş altın fiyatlarını nereden bulabilirim?', a: 'Bu araçta tarih seçmeniz yeterli — son 5 yılın günlük gram altın kapanış fiyatları sistemimizde kayıtlıdır. Daha eski tarihler için TÜİK ve TCMB arşivlerinden yararlanabilirsiniz.' },
        ]}
      />
    </>
  );
}

function computeGecmisAltin(data: FormData) {
  const type = GOLD_TYPES.find(t => t.value === data.goldType) || GOLD_TYPES[0];
  const pureGram = type.gram * (type.ayar / 24);
  if (data.direction === 'toMoney') {
    const value = data.amount * pureGram * data.gramPrice;
    return { value, label: 'Parasal Değeri' };
  } else {
    const value = data.amount / (pureGram * data.gramPrice);
    return { value, label: `${type.label} Miktarı` };
  }
}
