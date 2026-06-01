'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { amortizationSchedule, fmtTL, fmtPct } from './_shared/calc';
import { ResultCard, ResultRow, ToolInfo } from './_shared/ToolInfo';

const schema = z.object({
  amount: z.coerce.number().min(1, 'Tutar giriniz'),
  rate: z.coerce.number().min(0.01, 'Faiz oranı giriniz'),
  term: z.coerce.number().min(1, 'Vade giriniz').max(300, 'Maks 300 ay'),
  hasOtherProperty: z.boolean().optional(),
});
type FormData = z.infer<typeof schema>;

export function KonutKredisi() {
  const [result, setResult] = useState<{ monthly: number; total: number; interest: number; totalBsmv: number; totalKkdf: number; monthlyCostRate: number; bsmvRate: number } | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [schedule, setSchedule] = useState<ReturnType<typeof amortizationSchedule>>([]);

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { hasOtherProperty: false },
  });

  const hasOther = watch('hasOtherProperty');

  const onSubmit = (data: FormData) => {
    const bsmvRate = data.hasOtherProperty ? 0.15 : 0;
    const rows = amortizationSchedule(data.amount, data.rate, data.term, bsmvRate, 0);
    const totalPayment = rows.reduce((s, r) => s + r.totalPayment, 0);
    const totalBsmvSum = rows.reduce((s, r) => s + r.bsmv, 0);
    const totalInterest = rows.reduce((s, r) => s + r.interest, 0);
    const monthlyCostRate = (data.rate / 100) * (1 + bsmvRate) * 100;
    setResult({ monthly: rows[0].totalPayment, total: totalPayment, interest: totalInterest, totalBsmv: totalBsmvSum, totalKkdf: 0, monthlyCostRate, bsmvRate });
    setSchedule(rows);
    setShowSchedule(false);
  };

  return (
    <>
      <p className="text-sm text-muted-foreground mb-4">
        Konut kredisi taksit, toplam geri ödeme ve faiz tutarını hesaplayın. Konut kredilerinde KKDF uygulanmaz. İlk konut alımında BSMV de %0&apos;dır.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Kredi Tutarı (₺)" type="number" step="0.01" placeholder="Örn. 500000" {...register('amount')} error={errors.amount?.message} />
        <Input label="Vade (Ay)" type="number" placeholder="Örn. 120 (Maks 300)" {...register('term')} error={errors.term?.message} />
        <Input label="Aylık Faiz Oranı (%)" type="number" step="0.01" placeholder="Örn. 2.59" {...register('rate')} error={errors.rate?.message} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register('hasOtherProperty')} className="rounded border-border" />
          Başka konut sahibiyim (BSMV %15 uygulanır)
        </label>
        <div className="flex gap-2">
          <Button type="submit" className="flex-1">Hesapla</Button>
          <Button type="button" variant="outline" onClick={() => { reset(); setResult(null); }}>Sıfırla</Button>
        </div>
      </form>

      {result && (
        <>
          <ResultCard>
            <ResultRow label="Aylık Taksit" value={fmtTL(result.monthly)} />
            <ResultRow label="Toplam Geri Ödeme" value={fmtTL(result.total)} />
            <ResultRow label="Toplam Faiz" value={fmtTL(result.interest)} highlight />
            {result.totalBsmv > 0 && <ResultRow label="Toplam BSMV" value={fmtTL(result.totalBsmv)} />}
            <ResultRow label="KKDF" value="Muaf" />
            <ResultRow label="Aylık Maliyet Oranı" value={fmtPct(result.monthlyCostRate)} />
          </ResultCard>

          <button onClick={() => setShowSchedule(!showSchedule)} className="mt-3 text-sm text-primary hover:underline">
            {showSchedule ? 'Ödeme Planını Gizle' : 'Ödeme Planını Göster'}
          </button>

          {showSchedule && (
            <div className="mt-3 overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-border bg-muted">
                  <th className="px-3 py-2 text-left">Ay</th>
                  <th className="px-3 py-2 text-right">Taksit</th>
                  <th className="px-3 py-2 text-right">Anapara</th>
                  <th className="px-3 py-2 text-right">Faiz</th>
                  <th className="px-3 py-2 text-right">KKDF</th>
                  {result.bsmvRate > 0 && <th className="px-3 py-2 text-right">BSMV</th>}
                  <th className="px-3 py-2 text-right">Kalan</th>
                </tr></thead>
                <tbody>
                  {schedule.map((r) => (
                    <tr key={r.month} className="border-b border-border last:border-0">
                      <td className="px-3 py-1.5">{r.month}</td>
                      <td className="px-3 py-1.5 text-right font-mono">{fmtTL(r.totalPayment)}</td>
                      <td className="px-3 py-1.5 text-right font-mono">{fmtTL(r.principal)}</td>
                      <td className="px-3 py-1.5 text-right font-mono">{fmtTL(r.interest)}</td>
                      <td className="px-3 py-1.5 text-right font-mono">{fmtTL(r.kkdf)}</td>
                      {result.bsmvRate > 0 && <td className="px-3 py-1.5 text-right font-mono">{fmtTL(r.bsmv)}</td>}
                      <td className="px-3 py-1.5 text-right font-mono">{fmtTL(r.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <ToolInfo
        title="Konut Kredisi Nedir?"
        description="Konut kredisi, konut satın almak isteyen kişilerin bankalardan kullandığı uzun vadeli bir kredi türüdür. Konut kredilerinde KKDF alınmaz. İlk konut alımında BSMV de muaftır, ancak başka bir konuta sahip olunması durumunda faiz üzerinden %15 BSMV uygulanır."
        faqs={[
          { q: 'Konut kredisinde KKDF alınır mı?', a: 'Hayır, konut kredileri KKDF\'den muaftır.' },
          { q: 'BSMV ne zaman uygulanır?', a: 'Başka bir konuta sahip olunması durumunda faiz üzerinden %15 BSMV uygulanır. İlk konut alımında BSMV yoktur.' },
          { q: 'Maksimum vade ne kadardır?', a: 'Konut kredilerinde vade 300 aya (25 yıl) kadar çıkabilmektedir.' },
        ]}
      />
    </>
  );
}
