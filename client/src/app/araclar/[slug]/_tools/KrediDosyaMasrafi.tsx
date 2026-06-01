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
  amount: z.coerce.number().min(1, 'Tutar giriniz'),
});

export function KrediDosyaMasrafi() {
  const [result, setResult] = useState<number | null>(null);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<{ amount: number }>({ resolver: zodResolver(schema) });

  const onSubmit = (data: { amount: number }) => {
    setResult(data.amount * 0.005);
  };

  return (
    <>
      <p className="text-sm text-muted-foreground mb-4">Kredi dosya masrafı (binde 5) tutarını hesaplayın.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Kredi Tutarı (₺)" type="number" step="0.01" placeholder="Örn. 100000" {...register('amount')} error={errors.amount?.message} />
        <div className="flex gap-2">
          <Button type="submit" className="flex-1">Hesapla</Button>
          <Button type="button" variant="outline" onClick={() => { reset(); setResult(null); }}>Sıfırla</Button>
        </div>
      </form>

      {result !== null && (
        <ResultCard>
          <ResultRow label="Dosya Masrafı (Binde 5)" value={fmtTL(result)} />
        </ResultCard>
      )}

      <ToolInfo
        title="Kredi Dosya Masrafı Nedir?"
        description="Kredi dosya masrafı, bankaların kredi kullandırma sürecinde tahsil ettiği ücrettir. BDDK düzenlemeleri gereğince dosya masrafı kredi tutarının binde 5'ini geçemez."
        faqs={[
          { q: 'Dosya masrafı zorunlu mu?', a: 'Bankalar dosya masrafı talep edebilir ancak yasal üst sınır kredi tutarının binde 5\'idir.' },
          { q: 'Dosya masrafı iade alınabilir mi?', a: 'Bazı durumlarda tüketici hakem heyeti kararıyla iade alınabilir.' },
        ]}
      />
    </>
  );
}
