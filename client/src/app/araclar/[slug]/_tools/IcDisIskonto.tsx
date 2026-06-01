'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { fmtTL } from './_shared/calc';
import { ResultCard, ResultRow, ToolInfo } from './_shared/ToolInfo';

const schema = z.object({
  type: z.string(),
  value: z.coerce.number().min(0.01, 'Değer giriniz'),
  rate: z.coerce.number().min(0.01, 'İskonto oranı giriniz'),
  days: z.coerce.number().min(1, 'Vade giriniz'),
});
type FormData = z.infer<typeof schema>;

export function IcDisIskonto() {
  const [result, setResult] = useState<{ discount: number; otherValue: number } | null>(null);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema), defaultValues: { type: 'outer' },
  });

  const onSubmit = (data: FormData) => {
    const r = data.rate / 100;
    if (data.type === 'outer') {
      // Dış iskonto: İskonto = Nominal × Oran × Vade / 360
      const discount = (data.value * r * data.days) / 360;
      setResult({ discount, otherValue: data.value - discount });
    } else if (data.type === 'inner') {
      // İç iskonto: İskonto = Peşin × Oran × Vade / 360, Nominal = Peşin + İskonto
      // Actually: Peşin Değer given, find nominal.
      // İç iskonto: İskonto = Nominal × r × d / (360 + r × d)
      // Or: given Peşin, Nominal = Peşin × 360 / (360 - r × d)
      const nominal = (data.value * 360) / (360 - r * data.days);
      const discount = nominal - data.value;
      setResult({ discount, otherValue: nominal });
    } else {
      // Bileşik iç iskonto
      const periods = data.days / 360;
      const nominal = data.value * Math.pow(1 + r, periods);
      const discount = nominal - data.value;
      setResult({ discount, otherValue: nominal });
    }
  };

  return (
    <>
      <p className="text-sm text-muted-foreground mb-4">Basit dış iskonto, basit iç iskonto veya bileşik iç iskonto hesaplaması yapın.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Select label="Hesaplama Türü" options={[
          { value: 'outer', label: 'Basit Dış İskonto (Nominal → Peşin)' },
          { value: 'inner', label: 'Basit İç İskonto (Peşin → Nominal)' },
          { value: 'compound', label: 'Bileşik İç İskonto (Peşin → Nominal)' },
        ]} {...register('type')} />
        <Input label="Değer (₺)" type="number" step="0.01" placeholder="Nominal veya peşin değer" {...register('value')} error={errors.value?.message} />
        <Input label="İskonto Faiz Oranı (% / Yıl)" type="number" step="0.01" placeholder="Örn. 25" {...register('rate')} error={errors.rate?.message} />
        <Input label="Vadeye Kalan Süre (Gün)" type="number" placeholder="Örn. 90" {...register('days')} error={errors.days?.message} />
        <div className="flex gap-2">
          <Button type="submit" className="flex-1">Hesapla</Button>
          <Button type="button" variant="outline" onClick={() => { reset(); setResult(null); }}>Sıfırla</Button>
        </div>
      </form>

      {result && (
        <ResultCard>
          <ResultRow label="İskonto Tutarı" value={fmtTL(result.discount)} highlight />
          <ResultRow label="Diğer Değer" value={fmtTL(result.otherValue)} />
        </ResultCard>
      )}

      <ToolInfo
        title="İç ve Dış İskonto Nedir?"
        description="İskonto, vadesi gelmemiş bir alacağın bugünkü değerini bulmak için yapılan indirim işlemidir. Dış iskontoda nominal değer üzerinden iskonto tutarı hesaplanarak peşin değer bulunur. İç iskontoda ise peşin değer üzerinden iskonto hesaplanarak nominal değere ulaşılır."
        faqs={[
          { q: 'Dış iskonto formülü nedir?', a: 'İskonto = Nominal × Oran × Vade / 360. Peşin Değer = Nominal - İskonto.' },
          { q: 'İç iskonto formülü nedir?', a: 'Nominal = Peşin × 360 / (360 - Oran × Vade)' },
        ]}
      />
    </>
  );
}
