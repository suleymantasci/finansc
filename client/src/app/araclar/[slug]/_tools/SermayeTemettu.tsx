'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { fmtTL, fmtNum } from './_shared/calc';
import { ResultCard, ResultRow, ToolInfo } from './_shared/ToolInfo';
import { ShareButton } from '@/components/shared/ShareButton';

const schema = z.object({
  type: z.string(),
  shares: z.coerce.number().min(1, 'Hisse adedi giriniz'),
  price: z.coerce.number().min(0.01, 'Hisse fiyatı giriniz'),
  rate: z.coerce.number().min(0, 'Oran giriniz'),
});
type FormData = z.infer<typeof schema>;
type CalcResult = { newShares: number; newPrice: number; totalValue: number; description: string };
const defaults: FormData = { type: 'temettu', shares: 0, price: 0, rate: 0 };

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
    shares: num('shares'),
    price: num('price'),
    rate: num('rate'),
  };
}

function writeFormToUrl(form: FormData) {
  if (typeof window === 'undefined') return;
  const sp = new URLSearchParams(window.location.search);
  for (const k of ['type', 'shares', 'price', 'rate'] as (keyof FormData)[]) {
    const v = form[k];
    const def = defaults[k];
    if (v === def || (typeof v === 'number' && v === 0) || v === '') sp.delete(k as string);
    else sp.set(k as string, String(v));
  }
  const qs = sp.toString();
  window.history.replaceState(null, '', qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
}

function compute(data: FormData): CalcResult {
  const r = data.rate / 100;
  if (data.type === 'temettu') {
    const dividendPerShare = data.price * r;
    const totalDividend = dividendPerShare * data.shares;
    return {
      newShares: data.shares,
      newPrice: data.price - dividendPerShare,
      totalValue: totalDividend,
      description: `Toplam temettü: ${fmtTL(totalDividend)}, Hisse başı: ${fmtTL(dividendPerShare)}`,
    };
  } else if (data.type === 'bedelsiz') {
    const newShares = data.shares * (1 + r);
    const newPrice = data.price / (1 + r);
    return {
      newShares: Math.floor(newShares),
      newPrice,
      totalValue: Math.floor(newShares) * newPrice,
      description: `Bedelsiz sonrası ${Math.floor(newShares)} adet hisse, fiyat ${fmtTL(newPrice)}`,
    };
  } else if (data.type === 'bedelli') {
    const newShares = data.shares * (1 + r);
    const rightsCost = data.shares * r;
    const newPrice = (data.shares * data.price + rightsCost) / newShares;
    return {
      newShares: Math.floor(newShares),
      newPrice,
      totalValue: Math.floor(newShares) * newPrice,
      description: `Bedelli sonrası ${Math.floor(newShares)} adet, rüçhan maliyeti: ${fmtTL(rightsCost)}`,
    };
  } else {
    const newShares = data.shares * (1 - r);
    const newPrice = data.price / (1 - r);
    return {
      newShares: Math.floor(newShares),
      newPrice,
      totalValue: Math.floor(newShares) * newPrice,
      description: `Azaltma sonrası ${Math.floor(newShares)} adet hisse, fiyat ${fmtTL(newPrice)}`,
    };
  }
}

export function SermayeTemettu() {
  const initialForm = readFormFromUrl();
  const [result, setResult] = useState<CalcResult | null>(
    initialForm.shares > 0 && initialForm.price > 0 && initialForm.rate > 0 ? compute(initialForm) : null,
  );
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<FormData>({
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

  const type = watch('type');
  const rateLabel = type === 'temettu' ? 'Temettü Verimi (%)' : 'Oran (%)';

  return (
    <>
      <p className="text-sm text-muted-foreground mb-4">Temettü dağıtımı, bedelsiz/bedelli sermaye artırımı veya sermaye azaltımı sonrası hisse durumunuzu hesaplayın.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Select label="İşlem Türü" options={[
          { value: 'temettu', label: 'Temettü Dağıtımı' },
          { value: 'bedelsiz', label: 'Bedelsiz Sermaye Artırımı' },
          { value: 'bedelli', label: 'Bedelli Sermaye Artırımı' },
          { value: 'azaltim', label: 'Sermaye Azaltımı' },
        ]} {...register('type')} />
        <Input label="Hisse Adedi" type="number" placeholder="Örn. 1000" {...register('shares')} error={errors.shares?.message} />
        <Input label="Hisse Fiyatı (₺)" type="number" step="0.01" placeholder="Örn. 25.50" {...register('price')} error={errors.price?.message} />
        <Input label={rateLabel} type="number" step="0.01" placeholder="Örn. 50" {...register('rate')} error={errors.rate?.message} />
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
            <ResultRow label="Yeni Hisse Adedi" value={fmtNum(result.newShares, 0)} />
            <ResultRow label="Yeni Hisse Fiyatı" value={fmtTL(result.newPrice)} />
            <ResultRow label="Toplam Değer" value={fmtTL(result.totalValue)} highlight />
            <p className="text-sm text-muted-foreground mt-2">{result.description}</p>
          </ResultCard>
        </>
      )}

      <ToolInfo
        title="Sermaye ve Temettü Hesaplama Nedir?"
        description="Hisse senedi yatırımlarında temettü dağıtımı, bedelsiz/bedelli sermaye artırımı ve sermaye azaltımı sonrası portföy durumunuzu hesaplayan araçtır."
        faqs={[
          { q: 'Bedelsiz sermaye artırımı nedir?', a: 'Şirketin iç kaynaklarını kullanarak sermayesini artırmasıdır. Hissedarlar ek ödeme yapmadan yeni hisse alır.' },
          { q: 'Bedelli sermaye artırımı nedir?', a: 'Hissedarların nominal fiyattan (genelde 1 TL) yeni hisse satın aldığı sermaye artırımıdır.' },
          { q: 'Temettü verimi nasıl hesaplanır?', a: 'Temettü Verimi = (Hisse Başı Temettü / Hisse Fiyatı) × 100' },
        ]}
      />
    </>
  );
}
