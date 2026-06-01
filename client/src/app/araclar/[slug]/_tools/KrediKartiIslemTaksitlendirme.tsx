'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { annuityPayment, fmtTL } from './_shared/calc';
import { ResultCard, ResultRow, ToolInfo } from './_shared/ToolInfo';

const schema = z.object({
  amount: z.coerce.number().min(1, 'Tutar giriniz'),
  term: z.coerce.number().min(2, 'Vade giriniz').max(12, 'Maks 12 ay'),
  rate: z.coerce.number().min(0.01, 'Faiz oranı giriniz'),
});
type FormData = z.infer<typeof schema>;

export function KrediKartiIslemTaksitlendirme() {
  const [result, setResult] = useState<{ monthly: number; totalInterest: number; bsmv: number; kkdf: number; total: number } | null>(null);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema), defaultValues: { rate: 3.75 },
  });

  const onSubmit = (data: FormData) => {
    const r = data.rate / 100;
    const monthly = annuityPayment(data.amount, r, data.term);
    const totalPayment = monthly * data.term;
    const totalInterest = totalPayment - data.amount;
    const bsmv = totalInterest * 0.15;
    const kkdf = totalInterest * 0.15;
    const monthlyWithTax = monthly + (bsmv + kkdf) / data.term;
    setResult({ monthly: monthlyWithTax, totalInterest, bsmv, kkdf, total: totalPayment + bsmv + kkdf });
  };

  return (
    <>
      <p className="text-sm text-muted-foreground mb-4">Peşin yapılan kredi kartı işleminizi taksitlendirdiğinizde oluşacak aylık ödeme tutarını hesaplayın.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Peşin İşlem Tutarı (₺)" type="number" step="0.01" placeholder="Örn. 5000" {...register('amount')} error={errors.amount?.message} />
        <Input label="Vade (Ay, maks 12)" type="number" placeholder="Örn. 6" {...register('term')} error={errors.term?.message} />
        <Input label="Aylık Faiz Oranı (%)" type="number" step="0.01" defaultValue="3.75" {...register('rate')} error={errors.rate?.message} />
        <div className="flex gap-2">
          <Button type="submit" className="flex-1">Hesapla</Button>
          <Button type="button" variant="outline" onClick={() => { reset(); setResult(null); }}>Sıfırla</Button>
        </div>
      </form>

      {result && (
        <ResultCard>
          <ResultRow label="Aylık Taksit" value={fmtTL(result.monthly)} />
          <ResultRow label="Toplam Faiz" value={fmtTL(result.totalInterest)} highlight />
          <ResultRow label="BSMV (%15)" value={fmtTL(result.bsmv)} />
          <ResultRow label="KKDF (%15)" value={fmtTL(result.kkdf)} />
          <ResultRow label="Toplam Ödeme" value={fmtTL(result.total)} />
        </ResultCard>
      )}

      <ToolInfo
        title="Kredi Kartı İşlem Taksitlendirme Nedir?"
        description="Peşin yapılan kredi kartı harcamalarının sonradan taksitlere bölünmesi işlemidir. Taksitlendirme yapıldığında faiz uygulanır ve üzerine BSMV %15 ile KKDF %15 eklenir."
        faqs={[
          { q: 'Hangi işlemler taksitlendirilebilir?', a: 'Bankanızın izin verdiği peşin alışveriş işlemleri sonradan taksitlendirilebilir.' },
          { q: 'Taksitlendirme ücretsiz mi?', a: 'Hayır, taksitlendirme işleminde aylık faiz oranı üzerinden faiz ve vergi uygulanır.' },
        ]}
      />
    </>
  );
}
