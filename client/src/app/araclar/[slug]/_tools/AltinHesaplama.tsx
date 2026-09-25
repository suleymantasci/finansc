'use client';
import { isToolHydrated } from './_shared/hydration';

import { useState, Suspense } from 'react';
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
  { value: 'ceyrek', label: 'Çeyrek Altın (22 Ayar)', gram: 1.754, ayar: 22 },
  { value: 'yarim', label: 'Yarım Altın (22 Ayar)', gram: 3.50, ayar: 22 },
  { value: 'tam', label: 'Tam/Ziynet Altın (22 Ayar)', gram: 7.00, ayar: 22 },
  { value: 'cumhuriyet', label: 'Ata/Cumhuriyet Altın (22 Ayar)', gram: 7.20, ayar: 22 },
];

const schema = z.object({
  direction: z.string(),
  goldType: z.string(),
  amount: z.coerce.number().min(0.01, 'Miktar giriniz'),
  gramPrice: z.coerce.number().min(0.01, 'Gram fiyatı giriniz'),
});
type FormData = z.infer<typeof schema>;

const defaults: FormData = { direction: 'toMoney', goldType: 'gram24', amount: 0, gramPrice: 0 };

function readFormFromUrl(params: URLSearchParams): FormData {
  const num = (k: keyof FormData): number => {
    const v = params.get(k as string);
    if (v === null || v === '') return defaults[k] as number;
    const n = Number(v);
    return Number.isFinite(n) ? n : (defaults[k] as number);
  };
  return {
    direction: params.get('direction') ?? defaults.direction,
    goldType: params.get('goldType') ?? defaults.goldType,
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

export function AltinHesaplama() {
  return (
    <Suspense fallback={null}>
      <AltinHesaplamaInner />
    </Suspense>
  );
}

function AltinHesaplamaInner() {
  const initialForm = readFormFromUrl(
    typeof window !== 'undefined' && isToolHydrated() ? new URLSearchParams(window.location.search) : new URLSearchParams(),
  );
  const hasInitialData = initialForm.amount > 0 && initialForm.gramPrice > 0;
  const [result, setResult] = useState<{ value: number; label: string } | null>(
    hasInitialData ? computeAltin(initialForm) : null,
  );
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<FormData>({
    resolver: zodResolver(schema), defaultValues: initialForm,
  });

  const direction = watch('direction');

  const onSubmit = (data: FormData) => {
    setResult(computeAltin(data));
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
      <p className="text-sm text-muted-foreground mb-4">Altın türünü ve miktarını girerek parasal değerini veya belirli bir tutara karşılık gelen altın miktarını hesaplayın.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Select label="İşlem Türü" options={[
          { value: 'toMoney', label: 'Altından Paraya Çevir' },
          { value: 'toGold', label: 'Paradan Altına Çevir' },
        ]} {...register('direction')} />
        <Select label="Altın Türü" options={GOLD_TYPES.map(t => ({ value: t.value, label: t.label }))} {...register('goldType')} />
        <Input label="Gram Altın Fiyatı (₺)" type="number" step="0.01" placeholder="Güncel gram fiyatını giriniz" {...register('gramPrice')} error={errors.gramPrice?.message} />
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
        title="Altın Hesaplama Nedir?"
        description="Altın hesaplama aracı ile farklı altın türlerinin parasal değerini veya belirli bir tutara denk gelen altın miktarını hesaplayabilirsiniz. 1 ons = 31,1034768 gramdır. Çeyrek altın 22 ayar 1,754 gram, yarım 3,50 gram, tam (ziynet) 7,00 gram, cumhuriyet 7,20 gramdır."
        faqs={[
          { q: 'Gram altın fiyatı nasıl hesaplanır?', a: '1 ons fiyatı / 31,1034768 formülü ile gram fiyatı bulunur.' },
          { q: 'Ayar ne anlama gelir?', a: '24 ayar saf altını ifade eder. 22 ayar %91,6, 18 ayar %75, 14 ayar %58,5 saflık oranına sahiptir.' },
        ]}
      />
    </>
  );
}

function computeAltin(data: FormData) {
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
