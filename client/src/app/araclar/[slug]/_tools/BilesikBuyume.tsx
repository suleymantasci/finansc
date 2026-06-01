'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { fmtPct, fmtNum } from './_shared/calc';
import { ResultCard, ResultRow, ToolInfo } from './_shared/ToolInfo';

const schema = z.object({
  periodType: z.string(),
  startValue: z.coerce.number().min(0.01, 'Başlangıç değeri giriniz'),
  endValue: z.coerce.number().min(0.01, 'Bitiş değeri giriniz'),
  periods: z.coerce.number().min(1, 'Dönem sayısı giriniz'),
});
type FormData = z.infer<typeof schema>;

export function BilesikBuyume() {
  const [result, setResult] = useState<{ cagr: number; totalGrowth: number } | null>(null);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema), defaultValues: { periodType: 'year' },
  });

  const onSubmit = (data: FormData) => {
    const cagr = (Math.pow(data.endValue / data.startValue, 1 / data.periods) - 1) * 100;
    const totalGrowth = ((data.endValue - data.startValue) / data.startValue) * 100;
    setResult({ cagr, totalGrowth });
  };

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
          <Button type="button" variant="outline" onClick={() => { reset(); setResult(null); }}>Sıfırla</Button>
        </div>
      </form>

      {result && (
        <ResultCard>
          <ResultRow label="Bileşik Büyüme Oranı (CAGR)" value={fmtPct(result.cagr)} highlight />
          <ResultRow label="Toplam Büyüme" value={fmtPct(result.totalGrowth)} />
        </ResultCard>
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
