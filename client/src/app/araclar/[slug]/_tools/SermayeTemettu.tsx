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

const schema = z.object({
  type: z.string(),
  shares: z.coerce.number().min(1, 'Hisse adedi giriniz'),
  price: z.coerce.number().min(0.01, 'Hisse fiyatı giriniz'),
  rate: z.coerce.number().min(0, 'Oran giriniz'),
});

export function SermayeTemettu() {
  const [result, setResult] = useState<{ newShares: number; newPrice: number; totalValue: number; description: string } | null>(null);
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<{ type: string; shares: number; price: number; rate: number }>({
    resolver: zodResolver(schema), defaultValues: { type: 'temettu' },
  });

  const type = watch('type');

  const onSubmit = (data: { type: string; shares: number; price: number; rate: number }) => {
    const r = data.rate / 100;
    if (data.type === 'temettu') {
      // Temettü: Hisse başı temettü = Fiyat × Oran
      const dividendPerShare = data.price * r;
      const totalDividend = dividendPerShare * data.shares;
      const newPrice = data.price - dividendPerShare;
      setResult({
        newShares: data.shares,
        newPrice,
        totalValue: totalDividend,
        description: `Toplam temettü: ${fmtTL(totalDividend)}, Hisse başı: ${fmtTL(dividendPerShare)}`,
      });
    } else if (data.type === 'bedelsiz') {
      // Bedelsiz sermaye artırımı
      const newShares = data.shares * (1 + r);
      const newPrice = data.price / (1 + r);
      setResult({
        newShares: Math.floor(newShares),
        newPrice,
        totalValue: Math.floor(newShares) * newPrice,
        description: `Bedelsiz sonrası ${Math.floor(newShares)} adet hisse, fiyat ${fmtTL(newPrice)}`,
      });
    } else if (data.type === 'bedelli') {
      // Bedelli sermaye artırımı: Rüçhan hakkı kullanımı
      const newShares = data.shares * (1 + r);
      const rightsCost = data.shares * r * 1; // Nominal 1 TL
      const newPrice = (data.shares * data.price + rightsCost) / newShares;
      setResult({
        newShares: Math.floor(newShares),
        newPrice,
        totalValue: Math.floor(newShares) * newPrice,
        description: `Bedelli sonrası ${Math.floor(newShares)} adet, rüçhan maliyeti: ${fmtTL(rightsCost)}`,
      });
    } else {
      // Sermaye azaltımı
      const newShares = data.shares * (1 - r);
      const newPrice = data.price / (1 - r);
      setResult({
        newShares: Math.floor(newShares),
        newPrice,
        totalValue: Math.floor(newShares) * newPrice,
        description: `Azaltma sonrası ${Math.floor(newShares)} adet hisse, fiyat ${fmtTL(newPrice)}`,
      });
    }
  };

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
          <Button type="button" variant="outline" onClick={() => { reset(); setResult(null); }}>Sıfırla</Button>
        </div>
      </form>

      {result && (
        <ResultCard>
          <ResultRow label="Yeni Hisse Adedi" value={fmtNum(result.newShares, 0)} />
          <ResultRow label="Yeni Hisse Fiyatı" value={fmtTL(result.newPrice)} />
          <ResultRow label="Toplam Değer" value={fmtTL(result.totalValue)} highlight />
          <p className="text-sm text-muted-foreground mt-2">{result.description}</p>
        </ResultCard>
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
