'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { amortizationSchedule, fmtTL, fmtPct } from './calc';
import { ResultCard, ResultRow } from './ToolInfo';

const schema = z.object({
  amount: z.coerce.number().min(1, 'Tutar giriniz'),
  rate: z.coerce.number().min(0.01, 'Faiz oranı giriniz'),
  term: z.coerce.number().min(1, 'Vade giriniz').max(360, 'Maks 360 ay'),
});
type FormData = z.infer<typeof schema>;

interface CreditCalcProps {
  bsmv?: number;
  kkdf?: number;
  maxTerm?: number;
  title: string;
  description: string;
}

export function CreditCalc({ bsmv = 0.15, kkdf = 0.15, maxTerm = 360, title, description }: CreditCalcProps) {
  const [result, setResult] = useState<{ monthly: number; total: number; interest: number; totalBsmv: number; totalKkdf: number; monthlyCostRate: number } | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [schedule, setSchedule] = useState<ReturnType<typeof amortizationSchedule>>([]);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema.extend({ term: z.coerce.number().min(1).max(maxTerm) })),
  });

  const onSubmit = (data: FormData) => {
    const rows = amortizationSchedule(data.amount, data.rate, data.term, bsmv, kkdf);
    const totalPayment = rows.reduce((s, r) => s + r.totalPayment, 0);
    const totalBsmvSum = rows.reduce((s, r) => s + r.bsmv, 0);
    const totalKkdfSum = rows.reduce((s, r) => s + r.kkdf, 0);
    const totalInterest = rows.reduce((s, r) => s + r.interest, 0);
    const monthlyCostRate = (data.rate / 100) * (1 + bsmv + kkdf) * 100;
    setResult({ monthly: rows[0].totalPayment, total: totalPayment, interest: totalInterest, totalBsmv: totalBsmvSum, totalKkdf: totalKkdfSum, monthlyCostRate });
    setSchedule(rows);
    setShowSchedule(false);
  };

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Kredi Tutarı (₺)" type="number" step="0.01" placeholder="Örn. 100000" {...register('amount')} error={errors.amount?.message} />
        <Input label="Vade (Ay)" type="number" placeholder={`Örn. 36 (Maks ${maxTerm})`} {...register('term')} error={errors.term?.message} />
        <Input label="Aylık Faiz Oranı (%)" type="number" step="0.01" placeholder="Örn. 3.49" {...register('rate')} error={errors.rate?.message} />
        <div className="flex gap-2">
          <Button type="submit" className="flex-1">Hesapla</Button>
          <Button type="button" variant="outline" onClick={() => { reset(); setResult(null); setSchedule([]); }}>Sıfırla</Button>
        </div>
      </form>

      {result && (
        <>
          <ResultCard>
            <ResultRow label="Aylık Taksit" value={fmtTL(result.monthly)} />
            <ResultRow label="Toplam Geri Ödeme" value={fmtTL(result.total)} />
            <ResultRow label="Toplam Faiz" value={fmtTL(result.interest)} highlight />
            {bsmv > 0 && <ResultRow label={`BSMV (${fmtPct(bsmv * 100)})`} value={fmtTL(result.totalBsmv)} />}
            {kkdf > 0 && <ResultRow label={`KKDF (${fmtPct(kkdf * 100)})`} value={fmtTL(result.totalKkdf)} />}
            <ResultRow label="Aylık Maliyet Oranı" value={fmtPct(result.monthlyCostRate)} />
          </ResultCard>

          <button
            onClick={() => setShowSchedule(!showSchedule)}
            className="mt-3 text-sm text-primary hover:underline"
          >
            {showSchedule ? 'Ödeme Planını Gizle' : 'Ödeme Planını Göster'}
          </button>

          {showSchedule && schedule.length > 0 && (
            <div className="mt-3 overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted">
                    <th className="px-3 py-2 text-left">Ay</th>
                    <th className="px-3 py-2 text-right">Taksit</th>
                    <th className="px-3 py-2 text-right">Anapara</th>
                    <th className="px-3 py-2 text-right">Faiz</th>
                    {kkdf > 0 && <th className="px-3 py-2 text-right">KKDF</th>}
                    {bsmv > 0 && <th className="px-3 py-2 text-right">BSMV</th>}
                    <th className="px-3 py-2 text-right">Kalan</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((r) => (
                    <tr key={r.month} className="border-b border-border last:border-0">
                      <td className="px-3 py-1.5">{r.month}</td>
                      <td className="px-3 py-1.5 text-right font-mono">{fmtTL(r.totalPayment)}</td>
                      <td className="px-3 py-1.5 text-right font-mono">{fmtTL(r.principal)}</td>
                      <td className="px-3 py-1.5 text-right font-mono">{fmtTL(r.interest)}</td>
                      {kkdf > 0 && <td className="px-3 py-1.5 text-right font-mono">{fmtTL(r.kkdf)}</td>}
                      {bsmv > 0 && <td className="px-3 py-1.5 text-right font-mono">{fmtTL(r.bsmv)}</td>}
                      <td className="px-3 py-1.5 text-right font-mono">{fmtTL(r.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
