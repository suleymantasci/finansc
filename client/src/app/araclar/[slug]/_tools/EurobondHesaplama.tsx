'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { fmtTL, fmtPct, fmtNum } from './_shared/calc';
import { ResultCard, ResultRow, ToolInfo } from './_shared/ToolInfo';

const schema = z.object({
  currency: z.string(),
  couponPayment: z.string(),
  cleanPrice: z.coerce.number().min(0.01, 'Temiz alış fiyatı giriniz'),
  quantity: z.coerce.number().min(1, 'Adet giriniz'),
  couponRate: z.coerce.number().min(0),
  yearsToMaturity: z.coerce.number().min(0.1, 'Vade giriniz'),
});
type FormData = z.infer<typeof schema>;

export function EurobondHesaplama() {
  const [result, setResult] = useState<{ totalCost: number; annualCoupon: number; totalCoupons: number; maturityValue: number; ytm: number } | null>(null);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema), defaultValues: { currency: 'USD', couponPayment: 'semiannual' },
  });

  const onSubmit = (data: FormData) => {
    const nominal = 1000; // Standard eurobond nominal
    const cleanCost = (data.cleanPrice / 100) * nominal * data.quantity;
    const periodsPerYear = data.couponPayment === 'annual' ? 1 : 2;
    const couponPerPeriod = (data.couponRate / 100 / periodsPerYear) * nominal * data.quantity;
    const totalPeriods = Math.round(data.yearsToMaturity * periodsPerYear);
    const maturityValue = nominal * data.quantity;
    const totalCoupons = couponPerPeriod * totalPeriods;

    // Simple YTM approximation
    const annualCoupon = couponPerPeriod * periodsPerYear;
    const ytm = ((annualCoupon + (maturityValue - cleanCost) / data.yearsToMaturity) / ((maturityValue + cleanCost) / 2)) * 100;

    setResult({ totalCost: cleanCost, annualCoupon, totalCoupons, maturityValue, ytm });
  };

  return (
    <>
      <p className="text-sm text-muted-foreground mb-4">Eurobond yatırımınızın vadeye kadar getirisini (YTM) ve toplam kupon ödemelerini hesaplayın.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Select label="Para Birimi" options={[
          { value: 'USD', label: 'USD ($)' },
          { value: 'EUR', label: 'EUR (€)' },
        ]} {...register('currency')} />
        <Select label="Kupon Ödeme Periyodu" options={[
          { value: 'semiannual', label: '6 Ayda Bir' },
          { value: 'annual', label: 'Yıllık' },
        ]} {...register('couponPayment')} />
        <Input label="Kupon Faiz Oranı (%)" type="number" step="0.01" placeholder="Örn. 7.50" {...register('couponRate')} error={errors.couponRate?.message} />
        <Input label="Temiz Alış Fiyatı (%)" type="number" step="0.01" placeholder="Örn. 95.50" {...register('cleanPrice')} error={errors.cleanPrice?.message} />
        <Input label="Adet (Nominal)" type="number" placeholder="Örn. 10" {...register('quantity')} error={errors.quantity?.message} />
        <Input label="Vadeye Kalan Süre (Yıl)" type="number" step="0.1" placeholder="Örn. 5" {...register('yearsToMaturity')} error={errors.yearsToMaturity?.message} />
        <div className="flex gap-2">
          <Button type="submit" className="flex-1">Hesapla</Button>
          <Button type="button" variant="outline" onClick={() => { reset(); setResult(null); }}>Sıfırla</Button>
        </div>
      </form>

      {result && (
        <ResultCard>
          <ResultRow label="Toplam Alış Maliyeti" value={fmtNum(result.totalCost, 2)} />
          <ResultRow label="Yıllık Kupon Geliri" value={fmtNum(result.annualCoupon, 2)} />
          <ResultRow label="Toplam Kupon Geliri" value={fmtNum(result.totalCoupons, 2)} />
          <ResultRow label="Vade Sonu Değeri" value={fmtNum(result.maturityValue, 2)} />
          <ResultRow label="Vadeye Kadar Getiri (YTM)" value={fmtPct(result.ytm)} highlight />
        </ResultCard>
      )}

      <ToolInfo
        title="Eurobond Nedir?"
        description="Eurobond, devletlerin veya kurumların uluslararası piyasalarda döviz cinsinden ihraç ettiği borçlanma aracıdır. Genellikle 6 ayda bir kupon (faiz) ödemesi yapar ve vade sonunda nominal değer geri ödenir."
        faqs={[
          { q: 'YTM (Yield to Maturity) nedir?', a: 'Vadeye kadar getiri oranıdır. Eurobond vade sonuna kadar tutulduğunda elde edilecek yıllık getiriyi gösterir.' },
          { q: 'Eurobond risksiz midir?', a: 'Devlet eurobondları görece güvenli olmakla birlikte, kur riski ve ülke riski taşır.' },
        ]}
      />
    </>
  );
}
