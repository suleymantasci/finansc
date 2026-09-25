'use client';
import { isToolHydrated } from './_shared/hydration';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { fmtTL, fmtPct } from './_shared/calc';
import { ResultCard, ResultRow, ToolInfo } from './_shared/ToolInfo';
import { ShareButton } from '@/components/shared/ShareButton';

const schema = z.object({
  propertyType: z.string(),
  rate: z.coerce.number().min(0, 'Artış oranı giriniz'),
  currentRent: z.coerce.number().min(1, 'Kira tutarı giriniz'),
});
type FormData = z.infer<typeof schema>;
const defaults: FormData = { propertyType: 'konut', rate: 0, currentRent: 0 };

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
    propertyType: sp.get('propertyType') ?? defaults.propertyType,
    rate: num('rate'),
    currentRent: num('currentRent'),
  };
}

function writeFormToUrl(form: FormData) {
  if (typeof window === 'undefined') return;
  const sp = new URLSearchParams(window.location.search);
  for (const k of ['propertyType', 'rate', 'currentRent'] as (keyof FormData)[]) {
    const v = form[k];
    const def = defaults[k];
    if (v === def || (typeof v === 'number' && v === 0)) sp.delete(k as string);
    else sp.set(k as string, String(v));
  }
  const qs = sp.toString();
  window.history.replaceState(null, '', qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
}

export function KiraArtisOrani() {
  const initialForm = readFormFromUrl();
  const hasInitialData = initialForm.rate > 0 && initialForm.currentRent > 0;
  const [result, setResult] = useState<{ newRent: number; increase: number; rate: number } | null>(
    hasInitialData ? (() => {
      const r = initialForm.rate / 100;
      const increase = initialForm.currentRent * r;
      return { newRent: initialForm.currentRent + increase, increase, rate: initialForm.rate };
    })() : null,
  );
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema), defaultValues: initialForm,
  });

  const onSubmit = (data: FormData) => {
    const r = data.rate / 100;
    const increase = data.currentRent * r;
    setResult({ newRent: data.currentRent + increase, increase, rate: data.rate });
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
      <p className="text-sm text-muted-foreground mb-4">Kira artış tutarını hesaplayın. Konutlarda yasal üst sınır TÜFE 12 aylık ortalamalara göre değişim oranıdır. Artış oranını TÜİK verilerinden öğrenebilirsiniz.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Select label="Kiralanan" options={[
          { value: 'konut', label: 'Konut' },
          { value: 'isyeri', label: 'İş Yeri' },
        ]} {...register('propertyType')} />
        <Input label="Artış Oranı (%)" type="number" step="0.01" placeholder="Örn. 45.80" {...register('rate')} error={errors.rate?.message} />
        <Input label="Mevcut Kira Tutarı (₺)" type="number" step="0.01" placeholder="Örn. 10000" {...register('currentRent')} error={errors.currentRent?.message} />
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
            <ResultRow label="Artış Oranı" value={fmtPct(result.rate)} />
            <ResultRow label="Artış Tutarı" value={fmtTL(result.increase)} />
            <ResultRow label="Yeni Kira Tutarı" value={fmtTL(result.newRent)} highlight />
          </ResultCard>
        </>
      )}

      <ToolInfo
        title="Kira Artış Oranı Nedir?"
        description="Kira artışı, her yıl sözleşme yenilendiğinde kira bedelinde yapılan güncellemedir. Konutlarda yasal üst sınır TÜFE 12 aylık ortalamalara göre değişim oranıdır. İşyerlerinde ise tarafların sözleşmede belirlediği oran uygulanır (ancak TÜFE sınırını geçemez)."
        faqs={[
          { q: 'Konut zam oranı nereden öğrenilir?', a: 'TÜİK tarafından her ayın ilk haftasında açıklanan TÜFE 12 aylık ortalamalara göre değişim oranına bakılır.' },
          { q: 'Kiracı zammı kabul etmek zorunda mı?', a: 'Yasal sınır dahilindeki zam uygulanır. Üzerindeki zam istenemez.' },
          { q: 'İşyeri kiralarında sınır var mı?', a: '1 Temmuz 2020 sonrası işyeri kiralarında da TÜFE 12 aylık ortalamalara göre değişim oranı sınırı uygulanmaktadır.' },
        ]}
      />
    </>
  );
}
