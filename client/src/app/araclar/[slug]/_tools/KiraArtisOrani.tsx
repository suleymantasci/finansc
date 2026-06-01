'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { fmtTL, fmtPct } from './_shared/calc';
import { ResultCard, ResultRow, ToolInfo } from './_shared/ToolInfo';

const schema = z.object({
  propertyType: z.string(),
  rate: z.coerce.number().min(0, 'Artış oranı giriniz'),
  currentRent: z.coerce.number().min(1, 'Kira tutarı giriniz'),
});

export function KiraArtisOrani() {
  const [result, setResult] = useState<{ newRent: number; increase: number; rate: number } | null>(null);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<{ propertyType: string; rate: number; currentRent: number }>({
    resolver: zodResolver(schema), defaultValues: { propertyType: 'konut' },
  });

  const onSubmit = (data: { propertyType: string; rate: number; currentRent: number }) => {
    const r = data.rate / 100;
    const increase = data.currentRent * r;
    setResult({ newRent: data.currentRent + increase, increase, rate: data.rate });
  };

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
          <Button type="button" variant="outline" onClick={() => { reset(); setResult(null); }}>Sıfırla</Button>
        </div>
      </form>

      {result && (
        <ResultCard>
          <ResultRow label="Artış Oranı" value={fmtPct(result.rate)} />
          <ResultRow label="Artış Tutarı" value={fmtTL(result.increase)} />
          <ResultRow label="Yeni Kira Tutarı" value={fmtTL(result.newRent)} highlight />
        </ResultCard>
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
