'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { fmtNum } from './_shared/calc';
import { ResultCard, ResultRow, ToolInfo } from './_shared/ToolInfo';

const schema = z.object({
  amount: z.coerce.number().min(0.01, 'Miktar giriniz'),
  rate: z.coerce.number().min(0.0001, 'Kur giriniz'),
});

export function GecmisDovizKurlari() {
  const [result, setResult] = useState<number | null>(null);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<{ amount: number; rate: number }>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: { amount: number; rate: number }) => {
    setResult(data.amount * data.rate);
  };

  return (
    <>
      <p className="text-sm text-muted-foreground mb-4">Geçmiş bir tarihteki döviz kuru ile hesaplama yapın. O tarihte geçerli olan kuru girerek çeviri yapabilirsiniz.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Miktar" type="number" step="0.01" placeholder="Örn. 1000" {...register('amount')} error={errors.amount?.message} />
        <Input label="O Tarihteki Döviz Kuru" type="number" step="0.0001" placeholder="Örn. 18.7450" {...register('rate')} error={errors.rate?.message} />
        <div className="flex gap-2">
          <Button type="submit" className="flex-1">Hesapla</Button>
          <Button type="button" variant="outline" onClick={() => { reset(); setResult(null); }}>Sıfırla</Button>
        </div>
      </form>

      {result !== null && (
        <ResultCard>
          <ResultRow label="Sonuç" value={fmtNum(result, 4)} />
        </ResultCard>
      )}

      <ToolInfo
        title="Geçmiş Döviz Kurları Nedir?"
        description="Geçmiş döviz kurları hesaplama aracı ile eski tarihlerdeki döviz kurlarıyla hesaplama yapabilirsiniz. Geçmiş kur bilgisini TCMB arşivinden veya finans sitelerinden bulabilirsiniz."
        faqs={[
          { q: 'Geçmiş kurları nereden bulabilirim?', a: 'TCMB\'nin resmi web sitesinden günlük kapanış kurlarına ulaşabilirsiniz.' },
          { q: 'Parite nedir?', a: 'İki ülke parasının karşılıklı değeridir. Örneğin USD/TRY paritesi.' },
        ]}
      />
    </>
  );
}
