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
  currentTerm: z.coerce.number().min(2, 'Mevcut taksit sayısı giriniz'),
  newTerm: z.coerce.number().min(2, 'Yeni taksit sayısı giriniz'),
  rate: z.coerce.number().min(0.01, 'Faiz oranı giriniz'),
});
type FormData = z.infer<typeof schema>;

export function KrediKartiEkTaksit() {
  const [result, setResult] = useState<{ oldMonthly: number; newMonthly: number; totalInterest: number; totalBsmv: number; totalKkdf: number; total: number } | null>(null);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema), defaultValues: { rate: 3.75 },
  });

  const onSubmit = (data: FormData) => {
    const r = data.rate / 100;
    const bsmv = 0.15, kkdf = 0.15;
    const oldMonthly = data.amount / data.currentTerm;
    const newMonthly = annuityPayment(data.amount, r, data.newTerm);
    const totalPayment = newMonthly * data.newTerm;
    const totalInterest = totalPayment - data.amount;
    const totalBsmv = totalInterest * bsmv;
    const totalKkdf = totalInterest * kkdf;
    setResult({ oldMonthly, newMonthly: newMonthly + (newMonthly - data.amount / data.newTerm) * (bsmv + kkdf), totalInterest, totalBsmv, totalKkdf, total: totalPayment + totalBsmv + totalKkdf });
  };

  return (
    <>
      <p className="text-sm text-muted-foreground mb-4">Mevcut taksitli işleminizi daha fazla taksitlendirdiğinizde oluşacak yeni taksit tutarını ve toplam maliyeti hesaplayın.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Taksitli İşlem Tutarı (₺)" type="number" step="0.01" placeholder="Örn. 10000" {...register('amount')} error={errors.amount?.message} />
        <Input label="Mevcut Taksit Sayısı" type="number" placeholder="Örn. 3" {...register('currentTerm')} error={errors.currentTerm?.message} />
        <Input label="Yeni Taksit Sayısı" type="number" placeholder="Örn. 9" {...register('newTerm')} error={errors.newTerm?.message} />
        <Input label="Aylık Faiz Oranı (%)" type="number" step="0.01" defaultValue="3.75" {...register('rate')} error={errors.rate?.message} />
        <div className="flex gap-2">
          <Button type="submit" className="flex-1">Hesapla</Button>
          <Button type="button" variant="outline" onClick={() => { reset(); setResult(null); }}>Sıfırla</Button>
        </div>
      </form>

      {result && (
        <ResultCard>
          <ResultRow label="Mevcut Aylık Taksit" value={fmtTL(result.oldMonthly)} />
          <ResultRow label="Yeni Aylık Taksit" value={fmtTL(result.newMonthly)} />
          <ResultRow label="Toplam Faiz" value={fmtTL(result.totalInterest)} highlight />
          <ResultRow label="BSMV (%15)" value={fmtTL(result.totalBsmv)} />
          <ResultRow label="KKDF (%15)" value={fmtTL(result.totalKkdf)} />
          <ResultRow label="Toplam Maliyet" value={fmtTL(result.total)} />
        </ResultCard>
      )}

      <ToolInfo
        title="Kredi Kartı Ek Taksit Nedir?"
        description="Ek taksit, mevcut taksitli işleminizin taksit sayısını artırarak aylık ödeme tutarınızı düşürmenizi sağlayan bir uygulamadır. Ancak taksit sayısı arttıkça toplam faiz maliyeti de artar. Faiz üzerinden BSMV %15 ve KKDF %15 uygulanır."
        faqs={[
          { q: 'Ek taksit avantajlı mı?', a: 'Aylık taksitiniz düşer ancak toplam ödediğiniz tutar artar. Nakit akışı sıkıntısı yaşayanlar için tercih edilebilir.' },
          { q: 'Ek taksit tüm kartlarda geçerli mi?', a: 'Bankanızın sunduğu ek taksit imkânına ve ilgili işlemin uygunluğuna bağlıdır.' },
        ]}
      />
    </>
  );
}
