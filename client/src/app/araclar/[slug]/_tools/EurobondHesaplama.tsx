'use client';
import { isToolHydrated } from './_shared/hydration';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { fmtTL, fmtPct, fmtNum } from './_shared/calc';
import { ResultCard, ResultRow, ToolInfo } from './_shared/ToolInfo';
import { ShareButton } from '@/components/shared/ShareButton';

const schema = z.object({
  currency: z.string(),
  couponPayment: z.string(),
  cleanPrice: z.coerce.number().min(0.01, 'Temiz alış fiyatı giriniz'),
  quantity: z.coerce.number().min(1, 'Adet giriniz'),
  couponRate: z.coerce.number().min(0),
  yearsToMaturity: z.coerce.number().min(0.1, 'Vade giriniz'),
});
type FormData = z.infer<typeof schema>;

const defaults: FormData = {
  currency: 'USD', couponPayment: 'semiannual',
  cleanPrice: 0, quantity: 0, couponRate: 0, yearsToMaturity: 0,
};

function readFormFromUrl(): FormData {
  if (typeof window === 'undefined' || !isToolHydrated()) return defaults;
  const sp = new URLSearchParams(window.location.search);
  const num = (k: keyof FormData): number => {
    const v = sp.get(k as string);
    if (v === null || v === '') return defaults[k] as number;
    const n = Number(v);
    return Number.isFinite(n) ? n : (defaults[k] as number);
  };
  return {
    currency: sp.get('currency') ?? defaults.currency,
    couponPayment: sp.get('couponPayment') ?? defaults.couponPayment,
    cleanPrice: num('cleanPrice'),
    quantity: num('quantity'),
    couponRate: num('couponRate'),
    yearsToMaturity: num('yearsToMaturity'),
  };
}

function writeFormToUrl(form: FormData) {
  if (typeof window === 'undefined') return;
  const sp = new URLSearchParams(window.location.search);
  for (const k of ['currency', 'couponPayment', 'cleanPrice', 'quantity', 'couponRate', 'yearsToMaturity'] as (keyof FormData)[]) {
    const v = form[k];
    const def = defaults[k];
    if (v === def || (typeof v === 'number' && v === 0)) {
      sp.delete(k as string);
    } else {
      sp.set(k as string, String(v));
    }
  }
  const qs = sp.toString();
  window.history.replaceState(
    null, '',
    qs ? `${window.location.pathname}?${qs}` : window.location.pathname,
  );
}

export function EurobondHesaplama() {
  const initialForm = readFormFromUrl();
  const hasInitialData = initialForm.cleanPrice > 0 && initialForm.quantity > 0 && initialForm.yearsToMaturity > 0;
  const [result, setResult] = useState<{ totalCost: number; annualCoupon: number; totalCoupons: number; maturityValue: number; ytm: number } | null>(
    hasInitialData ? computeEurobond(initialForm) : null,
  );
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema), defaultValues: initialForm,
  });

  const onSubmit = (data: FormData) => {
    setResult(computeEurobond(data));
    writeFormToUrl(data);
  };

  const handleReset = () => {
    reset();
    setResult(null);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', window.location.pathname);
    }
  };

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}${window.location.search}`
    : '';

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
            <ResultRow label="Toplam Alış Maliyeti" value={fmtNum(result.totalCost, 2)} />
            <ResultRow label="Yıllık Kupon Geliri" value={fmtNum(result.annualCoupon, 2)} />
            <ResultRow label="Toplam Kupon Geliri" value={fmtNum(result.totalCoupons, 2)} />
            <ResultRow label="Vade Sonu Değeri" value={fmtNum(result.maturityValue, 2)} />
            <ResultRow label="Vadeye Kadar Getiri (YTM)" value={fmtPct(result.ytm)} highlight />
          </ResultCard>
        </>
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

function computeEurobond(data: FormData) {
  const nominal = 1000;
  const cleanCost = (data.cleanPrice / 100) * nominal * data.quantity;
  const periodsPerYear = data.couponPayment === 'annual' ? 1 : 2;
  const couponPerPeriod = (data.couponRate / 100 / periodsPerYear) * nominal * data.quantity;
  const totalPeriods = Math.round(data.yearsToMaturity * periodsPerYear);
  const maturityValue = nominal * data.quantity;
  const totalCoupons = couponPerPeriod * totalPeriods;
  const annualCoupon = couponPerPeriod * periodsPerYear;
  const ytm = ((annualCoupon + (maturityValue - cleanCost) / data.yearsToMaturity) / ((maturityValue + cleanCost) / 2)) * 100;
  return { totalCost: cleanCost, annualCoupon, totalCoupons, maturityValue, ytm };
}
