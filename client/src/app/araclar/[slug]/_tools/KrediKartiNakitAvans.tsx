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

export function KrediKartiNakitAvans() {
  const [result, setResult] = useState<{ monthly: number; totalInterest: number; bsmv: number; kkdf: number; total: number } | null>(null);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema), defaultValues: { rate: 4.25 },
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
      <p className="text-sm text-muted-foreground mb-4">Kredi kartından çektiğiniz taksitli nakit avansın aylık ödeme ve toplam maliyetini hesaplayın.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Avans Tutarı (₺)" type="number" step="0.01" placeholder="Örn. 5000" {...register('amount')} error={errors.amount?.message} />
        <Input label="Vade (Ay, maks 12)" type="number" placeholder="Örn. 6" {...register('term')} error={errors.term?.message} />
        <Input label="Aylık Faiz Oranı (%)" type="number" step="0.01" defaultValue="4.25" {...register('rate')} error={errors.rate?.message} />
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
        title="Taksitli Nakit Avans Nedir?"
        description="Kredi kartından nakit para çekme işleminin taksitlendirilmiş halidir. Normal nakit avansa göre faiz oranı genellikle daha yüksektir. Faiz üzerinden BSMV %15 ve KKDF %15 uygulanır."
        faqs={[
          { q: 'Nakit avans faiz oranı alışverişten farklı mı?', a: 'Evet, nakit avans faiz oranı genellikle alışveriş faiz oranından daha yüksektir.' },
          { q: 'Nakit avans limiti nedir?', a: 'Nakit avans limiti kart limitinizin belirli bir yüzdesidir ve banka tarafından belirlenir.' },
        ]}
      />
    </>
  );
}
