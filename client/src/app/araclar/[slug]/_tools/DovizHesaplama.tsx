'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { fmtTL, fmtNum } from './_shared/calc';
import { ResultCard, ResultRow, ToolInfo } from './_shared/ToolInfo';

const schema = z.object({
  amount: z.coerce.number().min(0.01, 'Miktar giriniz'),
  fromRate: z.coerce.number().min(0.0001, 'Kaynak kur giriniz'),
  toRate: z.coerce.number().min(0.0001, 'Hedef kur giriniz'),
});

export function DovizHesaplama() {
  const [result, setResult] = useState<{ converted: number } | null>(null);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<{ amount: number; fromRate: number; toRate: number }>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: { amount: number; fromRate: number; toRate: number }) => {
    // fromRate: 1 birim kaynak para = ? TRY
    // toRate: 1 birim hedef para = ? TRY
    // Converted = amount * fromRate / toRate
    const converted = (data.amount * data.fromRate) / data.toRate;
    setResult({ converted });
  };

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
          <Button type="button" variant="outline" onClick={() => { reset(); setResult(null); }}>Sıfırla</Button>
        </div>
      </form>

      {result && (
        <ResultCard>
          <ResultRow label="Çevrilen Tutar" value={fmtNum(result.converted, 4)} />
        </ResultCard>
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
