'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { fmtTL, fmtPct } from './_shared/calc';
import { ResultCard, ResultRow, ToolInfo } from './_shared/ToolInfo';

const schema = z.object({
  investment: z.coerce.number().min(0.01, 'Yatırım tutarı giriniz'),
  endValue: z.coerce.number().min(0.01, 'Vade sonu tutarı giriniz'),
  inflationRate: z.coerce.number().min(0, 'Enflasyon oranı giriniz'),
});

export function ReelGetiri() {
  const [result, setResult] = useState<{ nominal: number; real: number; nominalReturn: number; realReturn: number } | null>(null);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<{ investment: number; endValue: number; inflationRate: number }>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: { investment: number; endValue: number; inflationRate: number }) => {
    const nominal = (data.endValue - data.investment) / data.investment;
    const inflation = data.inflationRate / 100;
    const real = (1 + nominal) / (1 + inflation) - 1;
    setResult({
      nominal: nominal * 100,
      real: real * 100,
      nominalReturn: data.endValue - data.investment,
      realReturn: data.investment * real,
    });
  };

  return (
    <>
      <p className="text-sm text-muted-foreground mb-4">Yatırımınızın enflasyondan arındırılmış gerçek getirisini hesaplayın.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Yatırım Tutarı (₺)" type="number" step="0.01" placeholder="Örn. 100000" {...register('investment')} error={errors.investment?.message} />
        <Input label="Vade Sonundaki Tutar (₺)" type="number" step="0.01" placeholder="Örn. 150000" {...register('endValue')} error={errors.endValue?.message} />
        <Input label="Dönem Enflasyon Oranı (%)" type="number" step="0.01" placeholder="Örn. 45.80" {...register('inflationRate')} error={errors.inflationRate?.message} />
        <div className="flex gap-2">
          <Button type="submit" className="flex-1">Hesapla</Button>
          <Button type="button" variant="outline" onClick={() => { reset(); setResult(null); }}>Sıfırla</Button>
        </div>
      </form>

      {result && (
        <ResultCard>
          <ResultRow label="Nominal Getiri Oranı" value={fmtPct(result.nominal)} />
          <ResultRow label="Nominal Getiri Tutarı" value={fmtTL(result.nominalReturn)} />
          <ResultRow label="Reel Getiri Oranı" value={fmtPct(result.real)} highlight />
          <ResultRow label="Reel Getiri Tutarı" value={fmtTL(result.realReturn)} />
        </ResultCard>
      )}

      <ToolInfo
        title="Reel Getiri Nedir?"
        description="Reel getiri, bir yatırımın enflasyondan arındırılmış gerçek getirisini ifade eder. Fisher denklemi ile hesaplanır: Reel Getiri = (1 + Nominal Getiri) / (1 + Enflasyon) - 1"
        faqs={[
          { q: 'Reel getiri neden önemli?', a: 'Nominal getiri yanıltıcı olabilir. Reel getiri, paranızın satın alma gücünün gerçekten artıp artmadığını gösterir.' },
          { q: 'Negatif reel getiri ne demek?', a: 'Yatırımınızın enflasyonun altında kaldığı, satın alma gücünüzün azaldığı anlamına gelir.' },
        ]}
      />
    </>
  );
}
