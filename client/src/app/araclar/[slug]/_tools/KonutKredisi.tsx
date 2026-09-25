'use client';
import { isToolHydrated } from './_shared/hydration';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { amortizationSchedule, fmtTL, fmtPct } from './_shared/calc';
import { ResultCard, ResultRow, ToolInfo } from './_shared/ToolInfo';
import { ShareButton } from '@/components/shared/ShareButton';

const schema = z.object({
  amount: z.coerce.number().min(1, 'Tutar giriniz'),
  rate: z.coerce.number().min(0.01, 'Faiz oranı giriniz'),
  term: z.coerce.number().min(1, 'Vade giriniz').max(300, 'Maks 300 ay'),
  hasOtherProperty: z.boolean().optional(),
});
type FormData = z.infer<typeof schema>;
type CalcResult = { monthly: number; total: number; interest: number; totalBsmv: number; totalKkdf: number; monthlyCostRate: number; bsmvRate: number };
const defaults: FormData = { amount: 0, rate: 0, term: 0, hasOtherProperty: false };

function readFormFromUrl(): FormData {
  if (typeof window === 'undefined' || !isToolHydrated()) return defaults;
  const sp = new URLSearchParams(window.location.search);
  const num = (k: keyof FormData): number => {
    const v = sp.get(k as string);
    if (v === null || v === '') return defaults[k] as number;
    const n = Number(v);
    return Number.isFinite(n) ? n : (defaults[k] as number);
  };
  const bool = (k: keyof FormData): boolean => {
    const v = sp.get(k as string);
    if (v === 'true' || v === '1') return true;
    if (v === 'false' || v === '0') return false;
    return defaults[k] as boolean;
  };
  return { amount: num('amount'), rate: num('rate'), term: num('term'), hasOtherProperty: bool('hasOtherProperty') };
}

function writeFormToUrl(form: FormData) {
  if (typeof window === 'undefined') return;
  const sp = new URLSearchParams(window.location.search);
  for (const k of ['amount', 'rate', 'term', 'hasOtherProperty'] as (keyof FormData)[]) {
    const v = form[k];
    const def = defaults[k];
    if (v === def || (typeof v === 'number' && v === 0)) sp.delete(k as string);
    else sp.set(k as string, String(v));
  }
  const qs = sp.toString();
  window.history.replaceState(null, '', qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
}

function compute(data: FormData): { result: CalcResult; schedule: ReturnType<typeof amortizationSchedule> } | null {
  if (data.amount <= 0 || data.rate <= 0 || data.term <= 0) return null;
  const bsmvRate = data.hasOtherProperty ? 0.15 : 0;
  const rows = amortizationSchedule(data.amount, data.rate, data.term, bsmvRate, 0);
  if (rows.length === 0) return null;
  const total = rows.reduce((s, r) => s + r.totalPayment, 0);
  const totalBsmvSum = rows.reduce((s, r) => s + r.bsmv, 0);
  const totalInterest = rows.reduce((s, r) => s + r.interest, 0);
  const monthlyCostRate = (data.rate / 100) * (1 + bsmvRate) * 100;
  return {
    result: { monthly: rows[0].totalPayment, total, interest: totalInterest, totalBsmv: totalBsmvSum, totalKkdf: 0, monthlyCostRate, bsmvRate },
    schedule: rows,
  };
}

export function KonutKredisi() {
  const initialForm = readFormFromUrl();
  const initial = compute(initialForm);
  const [result, setResult] = useState<CalcResult | null>(initial?.result ?? null);
  const [schedule, setSchedule] = useState<ReturnType<typeof amortizationSchedule>>(initial?.schedule ?? []);
  const [showSchedule, setShowSchedule] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema), defaultValues: initialForm,
  });

  const onSubmit = (data: FormData) => {
    const r = compute(data);
    setResult(r?.result ?? null);
    setSchedule(r?.schedule ?? []);
    setShowSchedule(false);
    writeFormToUrl(data);
  };

  const handleReset = () => {
    reset();
    setResult(null);
    setSchedule([]);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', window.location.pathname);
    }
  };

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}${window.location.search}`
    : '';

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
          <Button type="button" variant="outline" onClick={handleReset}>Sıfırla</Button>
        </div>
      </form>

      {result && (
        <>
          <div className="flex items-center justify-between gap-2 mt-6 flex-wrap">
            <p className="text-sm text-muted-foreground">Sonucu paylaş — link'i kopyalayıp gönderebilirsiniz.</p>
            <ShareButton shareUrl={shareUrl} />
          </div>
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
                <thead><tr className="border-b border-border bg-elevated">
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
                      <td className="px-3 py-1.5 text-right num">{fmtTL(r.totalPayment)}</td>
                      <td className="px-3 py-1.5 text-right num">{fmtTL(r.principal)}</td>
                      <td className="px-3 py-1.5 text-right num">{fmtTL(r.interest)}</td>
                      <td className="px-3 py-1.5 text-right num">{fmtTL(r.kkdf)}</td>
                      {result.bsmvRate > 0 && <td className="px-3 py-1.5 text-right num">{fmtTL(r.bsmv)}</td>}
                      <td className="px-3 py-1.5 text-right num">{fmtTL(r.balance)}</td>
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
