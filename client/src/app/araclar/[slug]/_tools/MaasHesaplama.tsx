'use client';

import { useState, useRef, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Download, TrendingUp, TrendingDown, Calculator, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { ReportErrorButton } from '@/components/shared/ReportErrorButton';
import {
  maasFormSchema,
  EMPLOYEE_TYPE_LABELS,
  MARITAL_STATUS_LABELS,
  DISABILITY_LABELS,
  AVAILABLE_YEARS,
  getTaxData,
  getAgiMonthly,
  type MaasFormData,
} from './_shared/tax-data';
import { bruttenNete, nettenBrute, fmtTL, type MaasResult } from './_shared/maas-engine';
import { generateMaasPdf } from './_shared/pdfExport';
import { MaasChart } from './_shared/MaasChart';
import { MaasResultTable } from './_shared/MaasResultTable';

// ── Default değerler ─────────────────────────────────────────────

const defaults: MaasFormData = {
  year: AVAILABLE_YEARS[AVAILABLE_YEARS.length - 1],
  month: new Date().getMonth() + 1,
  direction: 'brutten-nete',
  employeeType: '4a-ucretli',
  amount: 30000,
  maritalStatus: 'bekar',
  childCount: 0,
  disability: 'yok',
  cumulativeMatrah: 0,
  showEmployerCost: false,
};

export function MaasHesaplama() {
  const [result, setResult] = useState<MaasResult | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<MaasFormData>({
    resolver: zodResolver(maasFormSchema),
    defaultValues: defaults,
  });

  const watchedYear = watch('year');
  const watchedAmount = watch('amount');
  const watchedDirection = watch('direction');
  const taxData = useMemo(() => getTaxData(watchedYear), [watchedYear]);

  const onSubmit = (data: MaasFormData) => {
    const r = data.direction === 'brutten-nete' ? bruttenNete(data) : nettenBrute(data);
    setResult(r);
    // Mobilde sonuç bölümüne kaydır
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handlePdfDownload = () => {
    if (!result) return;
    const formValues = watch();
    generateMaasPdf(result, formValues, taxData);
  };

  return (
    <div className="w-full space-y-6">
      <p className="text-sm text-muted-foreground leading-relaxed">
        Brütten nete veya netten brüte maaş hesaplaması yapın. 2024-2025 yılları için güncel SGK primi,
        işsizlik sigortası, gelir vergisi dilimleri, damga vergisi ve AGİ (Asgari Geçim İndirimi)
        oranları kullanılır. İşveren maliyetini de dahil edebilir, sonucu PDF olarak indirebilirsiniz.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* ── Satır 1: Yıl + Ay + Yön + Çalışan Tipi ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Select
            label="Yıl"
            options={AVAILABLE_YEARS.map((y) => ({ value: String(y), label: String(y) }))}
            {...register('year')}
          />
          <Select
            label="Ay"
            options={Array.from({ length: 12 }, (_, i) => ({
              value: String(i + 1),
              label: new Date(2000, i, 1).toLocaleDateString('tr-TR', { month: 'long' }),
            }))}
            {...register('month')}
          />
          <Select
            label="Hesaplama Yönü"
            options={[
              { value: 'brutten-nete', label: 'Brütten Nete' },
              { value: 'netten-brute', label: 'Netten Brüte' },
            ]}
            {...register('direction')}
          />
          <Select
            label="Çalışan Durumu"
            options={Object.entries(EMPLOYEE_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))}
            {...register('employeeType')}
          />
        </div>

        {/* ── Satır 2: Maaş + Kümülatif Matrah ── */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label={watchedDirection === 'brutten-nete' ? 'Brüt Maaş (₺)' : 'Net Maaş (₺)'}
            type="number"
            step="0.01"
            placeholder={watchedDirection === 'brutten-nete' ? 'Örn. 30000' : 'Örn. 25000'}
            {...register('amount')}
            error={errors.amount?.message}
            hint={
              watchedYear
                ? `${watchedYear} brüt asgari ücret: ${fmtTL(taxData.minWageBrut, 0)}`
                : undefined
            }
          />
          <Input
            label="Kümülatif Vergi Matrahı (₺, yıl başından beri)"
            type="number"
            step="0.01"
            placeholder="0"
            {...register('cumulativeMatrah')}
            error={errors.cumulativeMatrah?.message}
            hint="Yıl içinde maaş değiştiyse bu ay dahil önceki ayların gelir vergisi matrahı toplamı"
          />
        </div>

        {/* ── Satır 3: Medeni Durum + Çocuk + Engellilik ── */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Select
            label="Medeni Durum"
            options={Object.entries(MARITAL_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))}
            {...register('maritalStatus')}
          />
          <Input
            label="Çocuk Sayısı"
            type="number"
            min="0"
            max="10"
            placeholder="0"
            {...register('childCount')}
            error={errors.childCount?.message}
            hint={`AGİ: ${fmtTL(getAgiMonthly(watchedYear, watch('maritalStatus'), Number(watch('childCount')) || 0), 0)}/ay`}
          />
          <Select
            label="Engellilik İndirimi"
            options={Object.entries(DISABILITY_LABELS).map(([v, l]) => ({ value: v, label: l }))}
            {...register('disability')}
          />
        </div>

        {/* ── Satır 4: İşveren Maliyeti Toggle ── */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            {...register('showEmployerCost')}
            className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary/30"
          />
          <span className="text-sm font-medium">İşveren maliyetini de göster (SGK + işsizlik işveren payı)</span>
        </label>

        {/* ── Submit ── */}
        <div className="flex gap-2">
          <Button type="submit" className="flex-1">
            <Calculator className="mr-2 h-4 w-4" />
            Hesapla
          </Button>
          <Button type="button" variant="outline" onClick={() => { reset(); setResult(null); }}>
            Sıfırla
          </Button>
        </div>
      </form>

      {/* ── Sonuç Bölümü ── */}
      {result && (
        <div ref={resultRef} className="space-y-6 pt-4 border-t border-border">
          {/* Uyarılar */}
          {result.warnings.length > 0 && (
            <div className="space-y-2">
              {result.warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/20 p-3 text-sm text-amber-900 dark:text-amber-200">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{w}</p>
                </div>
              ))}
            </div>
          )}

          {/* Özet Kartlar — Brüt, Net, Kesinti, İşveren */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryCard label="Brüt Maaş" value={fmtTL(result.gross, 0)} color="neutral" />
            <SummaryCard
              label="Net Maaş"
              value={fmtTL(result.net, 0)}
              color="success"
              icon={<TrendingUp className="h-4 w-4" />}
            />
            <SummaryCard
              label="Toplam Kesinti"
              value={fmtTL(result.totalDeduction, 0)}
              color="warning"
              icon={<TrendingDown className="h-4 w-4" />}
            />
            {watch('showEmployerCost') && (
              <SummaryCard
                label="İşveren Maliyeti"
                value={fmtTL(result.totalEmployerCost, 0)}
                color="info"
              />
            )}
          </div>

          {/* Grafik */}
          <MaasChart result={result} showEmployer={watch('showEmployerCost') ?? false} />

          {/* Detay Tablosu */}
          <MaasResultTable lines={result.lines} />

          {/* PDF İndir + Hata Bildir */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Button type="button" onClick={handlePdfDownload} variant="primary">
              <Download className="mr-2 h-4 w-4" />
              PDF İndir
            </Button>
            <ReportErrorButton
              type="tool"
              slug="maas-hesaplama"
              pageTitle="Maaş Hesaplama"
            />
          </div>
        </div>
      )}

      {/* ── SEO İçerik: Açıklama + Dilimler + AGİ + FAQ ── */}
      <MaasSeoContent taxData={taxData} />
    </div>
  );
}

// ── Sub Components ───────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string;
  color: 'success' | 'warning' | 'info' | 'neutral';
  icon?: React.ReactNode;
}) {
  const colorMap = {
    success: 'border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-100',
    warning: 'border-amber-200 bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-100',
    info: 'border-blue-200 bg-blue-50 dark:bg-blue-950/20 text-blue-900 dark:text-blue-100',
    neutral: 'border-border bg-card text-foreground',
  };
  return (
    <div className={`rounded-xl border p-4 ${colorMap[color]}`}>
      <p className="text-xs font-medium opacity-80">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums sm:text-2xl">{value}</p>
      {icon && <div className="mt-1 opacity-60">{icon}</div>}
    </div>
  );
}

function MaasSeoContent({ taxData }: { taxData: ReturnType<typeof getTaxData> }) {
  return (
    <div className="mt-10 space-y-8 text-sm leading-relaxed">
      {/* Brütten Nete Nasıl Hesaplanır */}
      <section>
        <h2 className="text-xl font-bold mb-3">Brütten Nete Nasıl Hesaplanır?</h2>
        <p className="text-muted-foreground">
          Brüt maaştan çalışanın eline geçen net maaşı bulmak için sırasıyla şu kesintiler yapılır:
          SGK primi (işçi payı <strong>%14</strong>), işsizlik sigortası (işçi payı <strong>%1</strong>),
          kalan tutar üzerinden gelir vergisi (kümülatif matraha göre dilimli: %15, %20, %27, %35),
          brüt üzerinden damga vergisi (<strong>binde 7.59</strong>) ve asgari ücret istisnası
          uygulanır. Son olarak hesaplanan gelir vergisinden AGİ (Asgari Geçim İndirimi) düşülür.
        </p>
        <p className="text-muted-foreground mt-2">
          <strong>Asgari ücret istisnası:</strong> Brüt asgari ücret ve altındaki maaşlarda gelir vergisi ve
          damga vergisi tamamen muaftır. Asgari ücretin üzerindeki maaşlarda ise asgari ücrete kadar olan
          kısım için kısmi istisna uygulanır.
        </p>
      </section>

      {/* 2026 Gelir Vergisi Dilimleri */}
      <section>
        <h2 className="text-xl font-bold mb-3">{taxData.year} Yılı Gelir Vergisi Dilimleri (Ücretli)</h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">Dilim</th>
                <th className="px-4 py-2 text-right font-semibold">Alt Sınır (TL)</th>
                <th className="px-4 py-2 text-right font-semibold">Üst Sınır (TL)</th>
                <th className="px-4 py-2 text-right font-semibold">Vergi Oranı</th>
              </tr>
            </thead>
            <tbody>
              {taxData.incomeTaxBrackets.map((b, i) => {
                const next = taxData.incomeTaxBrackets[i + 1];
                return (
                  <tr key={i} className="border-t border-border">
                    <td className="px-4 py-2">{i + 1}. dilim</td>
                    <td className="px-4 py-2 text-right tabular-nums">{b.limit.toLocaleString('tr-TR')}</td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {next ? next.limit.toLocaleString('tr-TR') : 've üzeri'}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums font-semibold">
                      %{(b.rate * 100).toFixed(0)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Kaynak: GİB {taxData.year} Gelir Vergisi Genel Tebliği. Kümülatif matrah, yıl başından beri
          biriken gelir vergisi matrahıdır.
        </p>
      </section>

      {/* AGİ Tablosu */}
      <section>
        <h2 className="text-xl font-bold mb-3">{taxData.year} Yılı AGİ (Asgari Geçim İndirimi) Tutarları</h2>
        <p className="text-muted-foreground mb-3">
          AGİ, çalışanın medeni durumu ve çocuk sayısına göre yıllık olarak hesaplanan ve aylık gelir
          vergisinden düşülen tutardır. Mevcut hesaplama motorumuzda otomatik uygulanır.
        </p>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Medeni Durum</th>
                <th className="px-3 py-2 text-right font-semibold">0 Çocuk</th>
                <th className="px-3 py-2 text-right font-semibold">1 Çocuk</th>
                <th className="px-3 py-2 text-right font-semibold">2 Çocuk</th>
                <th className="px-3 py-2 text-right font-semibold">3 Çocuk</th>
                <th className="px-3 py-2 text-right font-semibold">4+ Çocuk</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border">
                <td className="px-3 py-2">Bekâr</td>
                {[0, 1, 2, 3, 4].map((c) => (
                  <td key={c} className="px-3 py-2 text-right tabular-nums">
                    {fmtTL(taxData.agiTable.bekar[c as 0 | 1 | 2 | 3 | 4].annual / 12, 0)}
                  </td>
                ))}
              </tr>
              <tr className="border-t border-border">
                <td className="px-3 py-2">Evli (eş çalışmıyor)</td>
                {[0, 1, 2, 3, 4].map((c) => (
                  <td key={c} className="px-3 py-2 text-right tabular-nums">
                    {fmtTL(taxData.agiTable['evli-es-calismiyor'][c as 0 | 1 | 2 | 3 | 4].annual / 12, 0)}
                  </td>
                ))}
              </tr>
              <tr className="border-t border-border">
                <td className="px-3 py-2">Evli (eş çalışıyor)</td>
                {[0, 1, 2, 3, 4].map((c) => (
                  <td key={c} className="px-3 py-2 text-right tabular-nums">
                    {fmtTL(taxData.agiTable['evli-es-calisiyor'][c as 0 | 1 | 2 | 3 | 4].annual / 12, 0)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          * Tutarlar aylık (TL/ay) gösterilmiştir. Engellilik indirimi ayrıca eklenir.
        </p>
      </section>

      {/* FAQ */}
      <section>
        <h2 className="text-xl font-bold mb-3">Sıkça Sorulan Sorular (SSS)</h2>
        <div className="space-y-3">
          {[
            {
              q: 'Brütten nete hesaplama nasıl yapılır?',
              a: 'Brüt maaştan sırasıyla SGK primi (%14), işsizlik sigortası (%1), gelir vergisi (kümülatif matraha göre %15-20-27-35 dilimli) ve damga vergisi (binde 7.59) kesilir. Asgari ücret istisnası uygulanır ve gelir vergisinden AGİ düşülür. Kalan tutar net maaşı verir.',
            },
            {
              q: 'Netten brüte hesaplama nasıl yapılır?',
              a: 'Net maaşı elde etmek için gereken brüt maaşı bulmak iteratif (binary search) yöntemle hesaplanır. Her brüt denemesi için brütten nete hesaplama yapılır, hedef nete yaklaşana kadar brüt artırılıp azaltılır.',
            },
            {
              q: 'Asgari ücret istisnası nedir?',
              a: '2022 yılından itibaren uygulanan istisna kapsamında, brüt asgari ücret ve altındaki maaşlarda gelir vergisi ve damga vergisi tamamen muaftır. Asgari ücretin üzerindeki maaşlarda ise asgari ücrete kadar olan kısım için kısmi istisna uygulanır.',
            },
            {
              q: 'AGİ (Asgari Geçim İndirimi) nedir?',
              a: "AGİ, çalışanın medeni durumu ve çocuk sayısına göre yıllık olarak belirlenen ve aylık gelir vergisinden düşülen tutardır. Bekâr çalışan için en düşük, evli ve 4+ çocuklu çalışan için en yüksek tutardadır. Engellilik derecesine göre ayrıca indirim uygulanır.",
            },
            {
              q: 'İşveren maliyeti neleri kapsar?',
              a: 'İşveren maliyeti, brüt maaş + SGK primi işveren payı (%15.5 veya %20.5 teşvik kapsamı) + işsizlik sigortası işveren payı (%2) toplamından oluşur. Bir çalışanın toplam maliyeti genellikle brüt maaşın %117-122’si kadardır.',
            },
            {
              q: 'Kümülatif vergi matrahı neden önemli?',
              a: 'Gelir vergisi dilimleri yıl başından beri biriken kümülatif matrah üzerinden uygulanır. Yıl içinde maaş artışı veya iş değişikliği olan çalışanlar yılın başındaki dilimlerden tekrar başlamaz. Aracımız, yıl başından beri ödediğiniz gelir vergisi matrahını girip tam doğru hesaplama yapmanızı sağlar.',
            },
            {
              q: 'SGK tavanı nedir?',
              a: 'SGK primi, brüt asgari ücretin 7.5 katını aşan maaşlarda bu tavan üzerinden hesaplanır. 2025 yılı SGK tavanı = 26.005,50 × 7,5 = 195.041,25 TL. Bu tutarın üzerindeki maaşlar için SGK primi sabit kalır.',
            },
            {
              q: 'Stajyer/çırak maaşı hesaplaması farklı mı?',
              a: 'Evet. Stajyer ve çıraklar için SGK primi %7, gelir vergisi ve damga vergisi muaftır. Sadece asgari ücret seviyesinde olabilirler.',
            },
            {
              q: 'PDF raporunda neler yer alır?',
              a: "PDF raporunda brütten nete / netten brüte hesaplama özeti, detaylı gelir-gider tablosu, grafik, kullanılan 2025 oranları (SGK, işsizlik, gelir vergisi dilimleri, damga vergisi), AGİ tablosu, yasal uyarı ve FinansÇözüm branding yer alır. Resmi PDF formatındadır (A4 dikey).",
            },
            {
              q: 'Bu hesaplama yasal olarak bağlayıcı mı?',
              a: 'Hayır. Aracımız bilgi amaçlıdır ve yatırım tavsiyesi niteliği taşımaz. Bordro hesaplamaları için işvereninizden veya mali müşavirinizden doğrulama almanız önerilir. Hesaplama motoru, 2025 yılı için geçerli olan SGK primi, işsizlik sigortası, gelir vergisi dilimleri ve AGİ oranlarını kullanır.',
            },
          ].map((f, i) => (
            <details key={i} className="group rounded-lg border border-border bg-card p-3">
              <summary className="cursor-pointer text-sm font-semibold flex items-center justify-between">
                {f.q}
                <span className="text-xs text-muted-foreground group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
