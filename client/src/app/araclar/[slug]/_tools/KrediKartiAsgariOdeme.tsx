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
  debt: z.coerce.number().min(1, 'Borç tutarı giriniz'),
  limit: z.coerce.number().min(1, 'Kart limiti giriniz'),
});

export function KrediKartiAsgariOdeme() {
  const [result, setResult] = useState<{ rate: number; minPayment: number } | null>(null);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<{ debt: number; limit: number }>({ resolver: zodResolver(schema) });

  const onSubmit = (data: { debt: number; limit: number }) => {
    const rate = data.limit <= 50000 ? 0.20 : 0.40;
    const minPayment = data.debt * rate;
    setResult({ rate: rate * 100, minPayment });
  };

  return (
    <>
      <p className="text-sm text-muted-foreground mb-4">Kredi kartı asgari ödeme tutarınızı hesaplayın. Kart limiti 50.000 TL ve altı için %20, üzeri için %40 asgari ödeme oranı uygulanır.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Dönem Borcu (₺)" type="number" step="0.01" placeholder="Örn. 15000" {...register('debt')} error={errors.debt?.message} />
        <Input label="Kart Limiti (₺)" type="number" step="0.01" placeholder="Örn. 40000" {...register('limit')} error={errors.limit?.message} />
        <div className="flex gap-2">
          <Button type="submit" className="flex-1">Hesapla</Button>
          <Button type="button" variant="outline" onClick={() => { reset(); setResult(null); }}>Sıfırla</Button>
        </div>
      </form>

      {result && (
        <ResultCard>
          <ResultRow label="Asgari Ödeme Oranı" value={fmtPct(result.rate)} />
          <ResultRow label="Asgari Ödeme Tutarı" value={fmtTL(result.minPayment)} />
        </ResultCard>
      )}

      <ToolInfo
        title="Kredi Kartı Asgari Ödeme Nedir?"
        description="Kredi kartı asgari ödeme tutarı, her ay ödenmesi gereken minimum tutardır. Kart limiti 50.000 TL ve altında ise dönem borcunun %20'si, 50.000 TL üzerinde ise %40'ı asgari ödeme tutarını oluşturur."
        faqs={[
          { q: 'Asgari ödeme yapınca faiz işler mi?', a: 'Evet, kalan borç üzerinden akdi faiz oranı üzerinden faiz işlemeye devam eder.' },
          { q: 'Asgari ödeme yapmamak ne olur?', a: 'Asgari ödeme yapılmaması durumunda gecikme faizi uygulanır ve kredi notunuz düşer.' },
        ]}
      />
    </>
  );
}
