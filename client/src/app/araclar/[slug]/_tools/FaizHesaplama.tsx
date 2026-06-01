'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { fmtTL, fmtPct } from './_shared/calc';
import { ResultCard, ResultRow, ToolInfo } from './_shared/ToolInfo';

const schema = z.object({
  type: z.string(),
  principal: z.coerce.number().min(1, 'Anapara giriniz'),
  rate: z.coerce.number().min(0.01, 'Faiz oranı giriniz'),
  periods: z.coerce.number().min(1, 'Dönem sayısı giriniz'),
});
type FormData = z.infer<typeof schema>;

export function FaizHesaplama() {
  const [result, setResult] = useState<{ interest: number; total: number } | null>(null);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema), defaultValues: { type: 'simple' },
  });

  const onSubmit = (data: FormData) => {
    const r = data.rate / 100;
    if (data.type === 'simple') {
      const interest = data.principal * r * data.periods;
      setResult({ interest, total: data.principal + interest });
    } else {
      const total = data.principal * Math.pow(1 + r, data.periods);
      setResult({ interest: total - data.principal, total });
    }
  };

  return (
    <>
      <p className="text-sm text-muted-foreground mb-4">Basit veya bileşik faiz ile yatırım getirinizi hesaplayın.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Select label="Faiz Türü" options={[
          { value: 'simple', label: 'Basit Faiz' },
          { value: 'compound', label: 'Bileşik Faiz' },
        ]} {...register('type')} />
        <Input label="Anapara (₺)" type="number" step="0.01" placeholder="Örn. 100000" {...register('principal')} error={errors.principal?.message} />
        <Input label="Faiz Oranı (% / Dönem)" type="number" step="0.01" placeholder="Örn. 3.5" {...register('rate')} error={errors.rate?.message} />
        <Input label="Dönem Sayısı" type="number" placeholder="Örn. 12" {...register('periods')} error={errors.periods?.message} />
        <div className="flex gap-2">
          <Button type="submit" className="flex-1">Hesapla</Button>
          <Button type="button" variant="outline" onClick={() => { reset(); setResult(null); }}>Sıfırla</Button>
        </div>
      </form>

      {result && (
        <ResultCard>
          <ResultRow label="Faiz Getirisi" value={fmtTL(result.interest)} />
          <ResultRow label="Toplam Tutar" value={fmtTL(result.total)} highlight />
        </ResultCard>
      )}

      <ToolInfo
        title="Faiz Hesaplama Nedir?"
        description="Basit faizde getiri = Anapara × Oran × Dönem formülüyle hesaplanır. Bileşik faizde ise her dönem kazanılan faiz anaparaya eklenerek sonraki dönemde de faiz kazanır: Toplam = Anapara × (1 + Oran)^Dönem."
        faqs={[
          { q: 'Basit ve bileşik faiz farkı nedir?', a: 'Basit faizde getiri her dönem sabit kalır. Bileşik faizde ise faiz üzerine de faiz işler, bu nedenle getiri katlanarak artar.' },
          { q: 'Hangi faiz türü daha avantajlıdır?', a: 'Yatırımcı için bileşik faiz daha avantajlıdır çünkü kazanılan faiz de faiz getirir.' },
        ]}
      />
    </>
  );
}
