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
  remainingTerm: z.string(),
  earlyPayment: z.coerce.number().min(1, 'Tutar giriniz'),
});

export function KrediErkenKapatma() {
  const [result, setResult] = useState<{ penalty: number; rate: number } | null>(null);
  const { register, handleSubmit, formState: { errors }, reset } = useForm({ resolver: zodResolver(schema), defaultValues: { remainingTerm: 'short' } });

  const onSubmit = (data: { remainingTerm: string; earlyPayment: number }) => {
    const rate = data.remainingTerm === 'short' ? 0.01 : 0.02;
    setResult({ penalty: data.earlyPayment * rate, rate: rate * 100 });
  };

  return (
    <>
      <p className="text-sm text-muted-foreground mb-4">Konut kredisi erken kapatma cezasını hesaplayın. Kalan vadeye göre %1 veya %2 oranında ceza uygulanır.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Select
          label="Kalan Kredi Vadesi"
          options={[
            { value: 'short', label: '36 ay ve altı' },
            { value: 'long', label: '36 aydan fazla' },
          ]}
          {...register('remainingTerm')}
        />
        <Input label="Erken Ödeme Tutarı (₺)" type="number" step="0.01" placeholder="Örn. 50000" {...register('earlyPayment')} error={errors.earlyPayment?.message} />
        <div className="flex gap-2">
          <Button type="submit" className="flex-1">Hesapla</Button>
          <Button type="button" variant="outline" onClick={() => { reset(); setResult(null); }}>Sıfırla</Button>
        </div>
      </form>

      {result && (
        <ResultCard>
          <ResultRow label="Ceza Oranı" value={fmtPct(result.rate)} />
          <ResultRow label="Erken Kapatma Cezası" value={fmtTL(result.penalty)} highlight />
        </ResultCard>
      )}

      <ToolInfo
        title="Kredi Erken Kapatma Cezası Nedir?"
        description="Konut kredilerinde erken kapatma durumunda bankalar yasal olarak ceza uygulayabilir. Kalan vadesi 36 ay ve altında olan kredilerde %1, 36 ayın üzerinde olan kredilerde ise %2 oranında erken ödeme cezası alınabilir. Bu düzenleme sadece konut kredileri için geçerlidir."
        faqs={[
          { q: 'Tüketici kredilerinde erken kapatma cezası var mı?', a: 'Hayır, ihtiyaç kredileri ve taşıt kredileri cezasız erken kapatılabilir.' },
          { q: 'Erken kapatma cezası nasıl hesaplanır?', a: 'Erken ödenen tutar üzerinden kalan vadeye göre %1 veya %2 ceza uygulanır.' },
        ]}
      />
    </>
  );
}
