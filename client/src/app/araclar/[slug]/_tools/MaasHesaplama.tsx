'use client';

import { useState, useRef, useMemo, useCallback, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calculator, Clock, Utensils, Percent, Receipt } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { maasFormSchema } from './_shared/maas-schema';
import {
  EMPLOYEE_TYPE_LABELS,
  DISABILITY_LABELS,
  AVAILABLE_YEARS,
  getTaxData,
  type MaasFormData,
} from './_shared/tax-data';
import { calculateYearlyTable, fmtTL, type YearlyTableResult } from './_shared/maas-engine';
import { MaasChart } from './_shared/MaasChart';
import { YearlyMaasTable } from './_shared/YearlyMaasTable';
import { ShareButton } from '@/components/shared/ShareButton';

// ── Default değerler ─────────────────────────────────────────────

const currentMonth = new Date().getMonth(); // 0-indexed

const defaults: MaasFormData = {
  year: AVAILABLE_YEARS[AVAILABLE_YEARS.length - 1],
  month: currentMonth + 1,
  direction: 'brutten-nete',
  employeeType: '4a-ucretli',
  amount: 50000,
  disability: 'yok',
  cumulativeMatrah: 0,
  minWageCumulativeMatrah: 0,
  showEmployerCost: false,
};

// ── URL state helpers (her tool kendi read/write'unu yazar — generic YASAK) ──

// URL'den MaasFormData oku (her alan kendi default'una düşer)
function readMaasFormFromUrl(params: URLSearchParams): MaasFormData {
  const num = (k: string, d: number) => {
    const v = params.get(k);
    if (v === null || v === '') return d;
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
  };
  const str = (k: string, d: string) => params.get(k) ?? d;
  const bool = (k: string, d: boolean) => {
    const v = params.get(k);
    if (v === 'true' || v === '1') return true;
    if (v === 'false' || v === '0') return false;
    return d;
  };
  return {
    year: num('year', defaults.year),
    month: num('month', defaults.month),
    direction: str('direction', defaults.direction) as MaasFormData['direction'],
    employeeType: str('employeeType', defaults.employeeType) as MaasFormData['employeeType'],
    amount: num('amount', defaults.amount),
    disability: str('disability', defaults.disability) as MaasFormData['disability'],
    cumulativeMatrah: num('cumulativeMatrah', defaults.cumulativeMatrah),
    minWageCumulativeMatrah: num('minWageCumulativeMatrah', defaults.minWageCumulativeMatrah),
    showEmployerCost: bool('showEmployerCost', defaults.showEmployerCost),
  };
}

// 12 aylık tutarları URL'den oku (m=50000,50000,50000 veya m1=...,m2=...)
function readMonthlyFromUrl(params: URLSearchParams): number[] {
  const single = params.get('m');
  if (single) {
    return Array.from({ length: 12 }, (_, i) => {
      const v = single.split(',')[i];
      const n = v === undefined ? 0 : Number(v);
      return Number.isFinite(n) ? n : 0;
    });
  }
  return Array.from({ length: 12 }, (_, i) => {
    const v = params.get(`m${i + 1}`);
    if (v === null) return 0;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  });
}

// Form + monthly amounts → URL'e senkron (default'a eşitse yazma, m trailing 0'ları kırp)
function writeMaasUrl(form: MaasFormData, amounts: number[]) {
  if (typeof window === 'undefined') return;
  const sp = new URLSearchParams(window.location.search);

  // Form alanları
  const fields: Array<[string, string | number | boolean]> = [
    ['year', form.year],
    ['month', form.month],
    ['direction', form.direction],
    ['employeeType', form.employeeType],
    ['amount', form.amount],
    ['disability', form.disability],
    ['cumulativeMatrah', form.cumulativeMatrah],
    ['minWageCumulativeMatrah', form.minWageCumulativeMatrah],
    ['showEmployerCost', form.showEmployerCost],
  ];
  for (const [k, v] of fields) {
    const def = (defaults as Record<string, unknown>)[k];
    if (v === def || v === '' || v === undefined || v === null) {
      sp.delete(k);
    } else {
      sp.set(k, String(v));
    }
  }

  // Monthly amounts — m1..m12 → m (virgüllü, sadece trailing 0'lar kırpılır).
  // Leading 0'lar KORUNUR çünkü ay sırasını gösterir (1. ay = Ocak = 0,
  // Ağustos'tan başlıyorsa ilk 7 eleman 0 kalmalı).
  for (let i = 1; i <= 12; i++) sp.delete(`m${i}`);
  const nonzero = amounts.some((a) => a > 0);
  if (nonzero) {
    let last = 11;
    while (last > 0 && amounts[last] === 0) last--;
    sp.set('m', amounts.slice(0, last + 1).join(','));
  } else {
    sp.delete('m');
  }

  const qs = sp.toString();
  const newPath = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  window.history.replaceState(null, '', newPath);
}

export function MaasHesaplama() {
  return (
    <Suspense fallback={null}>
      <MaasHesaplamaInner />
    </Suspense>
  );
}

function MaasHesaplamaInner() {
  // İlk çizim sunucuyla aynı olmalı (varsayılan değerler). URL render sırasında okunursa sunucu
  // parametresiz ürettiği için hydration eski değeri koruyordu (ana sayfadan ?amount=… ile gelince
  // brüt maaş eski kalıyordu). URL aşağıdaki useEffect'te, yüklendikten sonra okunur.
  const initialForm = defaults;
  const initialMonthly: number[] = Array(12).fill(0);
  const [yearlyResult, setYearlyResult] = useState<YearlyTableResult | null>(null);
  const [monthlyAmounts, setMonthlyAmounts] = useState<number[]>(initialMonthly);
  const resultRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<MaasFormData>({
    resolver: zodResolver(maasFormSchema),
    defaultValues: initialForm,
  });

  const watchedYear = watch('year');
  const watchedDirection = watch('direction');
  const watchedShowEmployer = watch('showEmployerCost');
  const taxData = useMemo(() => getTaxData(watchedYear), [watchedYear]);

  const runCalculation = useCallback(
    (form: MaasFormData, amounts: number[]) => {
      const { month: _m, cumulativeMatrah: _c, ...baseForm } = form;
      const result = calculateYearlyTable(baseForm, amounts);
      setYearlyResult(result);
    },
    [],
  );

  // URL'deki değerlerle formu doldur ve hemen hesapla. Aylık liste (m=…) yoksa ama tutar (amount)
  // varsa, seçilen aydan yıl sonuna kadar o tutar kullanılır — ana sayfa bağlantısı yalnız amount taşır.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (![...params.keys()].length) return;
    const form = readMaasFormFromUrl(params);
    let amounts = readMonthlyFromUrl(params);
    if (!amounts.some((a) => a > 0) && params.has('amount') && form.amount > 0) {
      amounts = Array.from({ length: 12 }, (_, i) => (i >= form.month - 1 ? form.amount : 0));
    }
    reset(form);
    if (amounts.some((a) => a > 0)) {
      setMonthlyAmounts(amounts);
      runCalculation(form, amounts);
    }
    // Yalnız ilk yüklemede
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Direction değiştiğinde mevcut verilerle yeniden hesapla
  useEffect(() => {
    if (!yearlyResult) return;
    const hasData = monthlyAmounts.some((a) => a > 0);
    if (!hasData) return;
    const formValues = watch();
    runCalculation(formValues, monthlyAmounts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedDirection]);

  const onSubmit = (data: MaasFormData) => {
    // Seçilen aydan yıl sonuna kadar girilen maaşı doldur
    const amounts = Array(12).fill(0);
    for (let i = data.month - 1; i < 12; i++) {
      amounts[i] = data.amount;
    }
    setMonthlyAmounts(amounts);
    runCalculation(data, amounts);
    writeMaasUrl(data, amounts);

    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleMonthAmountChange = useCallback(
    (monthIndex: number, amount: number) => {
      setMonthlyAmounts((prev) => {
        const next = [...prev];
        next[monthIndex] = amount;
        return next;
      });
      // Yeniden hesapla (bir sonraki render'da)
      setTimeout(() => {
        const formValues = watch();
        const { month: _m, cumulativeMatrah: _c, ...baseForm } = formValues;
        setMonthlyAmounts((current) => {
          const result = calculateYearlyTable(baseForm, current);
          setYearlyResult(result);
          writeMaasUrl(formValues, current);
          return current;
        });
      }, 0);
    },
    [watch],
  );

  // jsPDF (~600 KB) yalnızca tıklanınca yüklenir; sayfa ve ana sayfa önyüklemesi hafif kalır
  const handlePdfDownload = async () => {
    if (!yearlyResult) return;
    const formValues = watch();
    const { generateMaasPdf } = await import('./_shared/pdfExport');
    generateMaasPdf(yearlyResult, formValues, taxData);
  };

  return (
    <div className="w-full space-y-6">
      <p className="text-sm text-muted-foreground leading-relaxed">
        Brütten nete ve netten brüte maaş hesaplama aracı. Güncel SGK primi,
        işsizlik sigortası, gelir vergisi dilimleri ve damga vergisi oranları ile
        12 aylık yıllık tablo ve kümülatif vergi matrahı otomatik hesaplanır.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* ── Yön (radio) ── */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" value="brutten-nete" {...register('direction')} className="accent-primary" />
            <span className="text-sm font-medium">Brütten Nete</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" value="netten-brute" {...register('direction')} className="accent-primary" />
            <span className="text-sm font-medium">Netten Brüte</span>
          </label>
        </div>

        {/* ── Form alanları: Yıl + Ay + Maaş + Çalışma + Engellilik ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
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
          <Input
            label={watchedDirection === 'brutten-nete' ? 'Maaş (Brüt ₺)' : 'Maaş (Net ₺)'}
            type="number"
            step="0.01"
            placeholder="Örn. 50000"
            {...register('amount')}
            error={errors.amount?.message}
          />
          <Select
            label="Çalışma durumu"
            options={Object.entries(EMPLOYEE_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))}
            {...register('employeeType')}
          />
          <Select
            label="Engellilik durumu"
            options={Object.entries(DISABILITY_LABELS).map(([v, l]) => ({ value: v, label: l }))}
            {...register('disability')}
          />
        </div>

        {/* ── İşveren maliyeti toggle ── */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            {...register('showEmployerCost')}
            className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary/30"
          />
          <span className="text-sm font-medium">İşveren maliyetini göster</span>
        </label>

        {/* ── Submit ── */}
        <div className="flex gap-2">
          <Button type="submit" className="flex-1 sm:flex-none">
            <Calculator className="mr-2 h-4 w-4" />
            Yeniden Hesapla
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              reset();
              setYearlyResult(null);
              setMonthlyAmounts(Array(12).fill(0));
              // URL'i temizle
              if (typeof window !== 'undefined') {
                window.history.replaceState(null, '', window.location.pathname);
              }
            }}
          >
            Sıfırla
          </Button>
        </div>
      </form>

      {/* ── Sonuç Bölümü ── */}
      {yearlyResult && (
        <div ref={resultRef} className="space-y-8 pt-4 border-t border-border">
          {/* Paylaş — sonuç URL'i kopyala */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-sm text-muted-foreground">
              Bu sonucu paylaş — link'i kopyalayıp gönderebilirsiniz.
            </p>
            <ShareButton
              shareUrl={
                typeof window !== 'undefined'
                  ? `${window.location.origin}${window.location.pathname}${window.location.search}`
                  : ''
              }
            />
          </div>

          {/* 12 Aylık Tablo */}
          <YearlyMaasTable
            yearlyResult={yearlyResult}
            monthlyAmounts={monthlyAmounts}
            onMonthAmountChange={handleMonthAmountChange}
            showEmployer={watchedShowEmployer ?? false}
            onPdfDownload={handlePdfDownload}
            direction={watchedDirection}
          />

          {/* Maaş Analizi */}
          <div className="space-y-4">
            <h2 className="font-display text-2xl text-foreground sm:text-3xl">Maaş Analizi</h2>

            {/* Özet Kartlar */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <AnalysisCard
                icon={<Clock className="h-5 w-5 text-blue-500" />}
                label="Saatlik Ücret"
                sublabel="(Aylık ort. / 180 saat)"
                value={fmtTL(yearlyResult.averageNet / 180, 2)}
              />
              <AnalysisCard
                icon={<Utensils className="h-5 w-5 text-orange-500" />}
                label="Günlük Ücret"
                sublabel="(Aylık ort. / 22 gün)"
                value={fmtTL(yearlyResult.averageNet / 22, 2)}
              />
              <AnalysisCard
                icon={<Percent className="h-5 w-5 text-red-500" />}
                label="Kesinti Oranı"
                sublabel="(Ortalama)"
                value={`%${(yearlyResult.deductionRate * 100).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              />
              <AnalysisCard
                icon={<Receipt className="h-5 w-5 text-purple-500" />}
                label="Yıllık Vergi"
                sublabel="(Gelir vergisi toplamı)"
                value={fmtTL(yearlyResult.totalTax, 0)}
              />
            </div>

            {/* Donut Grafik — Aylık Ortalama */}
            {yearlyResult.totals.gross > 0 && (() => {
              const activeCount = Math.max(1, yearlyResult.rows.filter(r => r.gross > 0).length);
              return (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Aylık Ortalama Maaş Analizi</h3>
                  <MaasChart
                    result={{
                      gross: yearlyResult.totals.gross / activeCount,
                      net: yearlyResult.averageNet,
                      totalDeduction: (yearlyResult.totals.gross - yearlyResult.totals.net) / activeCount,
                      totalEmployerCost: yearlyResult.totals.totalEmployerCost / activeCount,
                      cumulativeMatrah: 0,
                      minWageCumulativeMatrah: 0,
                      lines: [
                        { label: 'SGK Primi', amount: yearlyResult.totals.sgkEmployee / activeCount, kind: 'deduction' },
                        { label: 'İşsizlik Sigortası', amount: yearlyResult.totals.unemployment / activeCount, kind: 'deduction' },
                        { label: 'Gelir Vergisi', amount: yearlyResult.totals.incomeTax / activeCount, kind: 'deduction' },
                        { label: 'Damga Vergisi', amount: yearlyResult.totals.stampTax / activeCount, kind: 'deduction' },
                      ],
                      warnings: [],
                    }}
                    showEmployer={watchedShowEmployer ?? false}
                  />
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── SEO İçerik: Açıklama + Dilimler + FAQ ── */}
      <MaasSeoContent taxData={taxData} />
    </div>
  );
}

// ── Sub Components ───────────────────────────────────────────────

function AnalysisCard({
  icon,
  label,
  sublabel,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  value: string;
}) {
  return (
    <div className="atlas-card p-4 flex flex-col items-center text-center gap-2">
      <div className="rounded-full bg-muted p-2">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        {sublabel && <p className="text-[10px] text-muted-foreground/60">{sublabel}</p>}
      </div>
      <p className="text-lg font-bold tabular-nums">{value}</p>
    </div>
  );
}

function MaasSeoContent({ taxData }: { taxData: ReturnType<typeof getTaxData> }) {
  return (
    <div className="mt-10 space-y-8 text-sm leading-relaxed">
      {/* Brütten Nete Nasıl Hesaplanır */}
      <section>
        <h2 className="font-display text-2xl text-foreground sm:text-3xl mb-3">Brütten Nete Nasıl Hesaplanır?</h2>
        <p className="text-muted-foreground">
          Brüt maaştan çalışanın eline geçen net maaşı bulmak için sırasıyla şu kesintiler yapılır:
          SGK primi (işçi payı <strong>%14</strong>), işsizlik sigortası (işçi payı <strong>%1</strong>),
          kalan tutar üzerinden gelir vergisi (kümülatif matraha göre dilimli), brüt üzerinden damga
          vergisi (<strong>binde 7,59</strong>) ve asgari ücret istisnası uygulanır.
        </p>
        <p className="text-muted-foreground mt-2">
          <strong>Asgari ücret istisnası:</strong> 2022 yılından itibaren brüt asgari ücret ve altındaki
          maaşlarda gelir vergisi ve damga vergisi tamamen muaftır. Asgari ücretin üzerindeki maaşlarda
          ise asgari ücrete kadar olan kısım için kısmi istisna uygulanır.
        </p>
      </section>

      {/* Gelir Vergisi Dilimleri */}
      <section>
        <h2 className="font-display text-2xl text-foreground sm:text-3xl mb-3">{taxData.year} Yılı Gelir Vergisi Dilimleri (Ücretli)</h2>
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
                      %{(b.rate * 100).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
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

      {/* FAQ */}
      <section>
        <h2 className="font-display text-2xl text-foreground sm:text-3xl mb-3">Brütten Nete Maaş Hesaplama Hakkında Merak Edilenler</h2>
        <div className="space-y-3">
          {[
            {
              q: 'Net Maaş Nedir?',
              a: 'Net maaş çalışanın maaşını alırken en çok karşılaştığı sorudur. Net maaş, isminden de anlaşıldığı gibi işverenin yaptığı tüm kesintilerin sonucunda size verdiğiniz karşılığı olarak direkt verdiği tutardır. Net maaş, brütten vergilerin ve diğer kesintilerin çıkarılmasından sonra ortaya çıkar. Brüt maaş kesintileri otomatik olarak yapılır ve sizden herhangi bir ödeme talep edilmez.',
            },
            {
              q: 'Brüt Maaş Nedir?',
              a: 'Brüt maaş, çalışana yapılan tüm kesintiler öncesindeki toplam maaş tutarıdır. SGK primi, işsizlik sigortası, gelir vergisi ve damga vergisi gibi kesintiler brüt maaş üzerinden hesaplanır.',
            },
            {
              q: 'Net Maaş ve Brüt Maaş Arasındaki Farklar Nelerdir?',
              a: 'Brüt maaş kesinti öncesi toplam tutarı, net maaş ise tüm yasal kesintiler sonrası çalışanın eline geçen tutarı ifade eder. Aradaki fark SGK primi, işsizlik sigortası, gelir vergisi ve damga vergisinden oluşur.',
            },
            {
              q: 'Brütten Net Maaş Hesaplanırken Baz Alınan Oranlar',
              a: `SGK primi işçi payı %14, işsizlik sigortası işçi payı %1, damga vergisi binde 7,59. Gelir vergisi kümülatif matraha göre dilimli olarak uygulanır: ${taxData.incomeTaxBrackets.map((b) => `%${(b.rate * 100).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`).join(', ')}. Asgari ücret istisnası kapsamında brüt asgari ücrete kadar olan kısım gelir vergisinden muaftır.`,
            },
            {
              q: 'Kümülatif vergi matrahı neden önemli?',
              a: 'Gelir vergisi dilimleri yıl başından beri biriken kümülatif matrah üzerinden uygulanır. Yıl içinde aynı maaşı alsanız bile yılın sonlarına doğru üst dilimlere geçersiniz ve net maaşınız düşer. 12 aylık tablomuz bu etkiyi otomatik hesaplar.',
            },
            {
              q: 'Brütten Net Maaş Nasıl Hesaplanır?',
              a: 'Brüt maaştan sırasıyla SGK primi (%14), işsizlik sigortası (%1) kesilir. Kalan tutar gelir vergisi matrahıdır. Bu matrah üzerinden kümülatif dilimlere göre gelir vergisi hesaplanır. Brüt maaş üzerinden damga vergisi (binde 7,59) uygulanır. Asgari ücret istisnası düşülür. Tüm kesintiler toplamı brütten çıkarılarak net maaş bulunur.',
            },
            {
              q: 'İşveren maliyeti neleri kapsar?',
              a: `İşveren maliyeti, brüt maaş + SGK primi işveren payı (%${(taxData.sgkEmployer * 100).toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}) + işsizlik sigortası işveren payı (%${(taxData.unemploymentEmployer * 100).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}) toplamından oluşur.`,
            },
            {
              q: 'Bu hesaplama yasal olarak bağlayıcı mı?',
              a: 'Hayır. Aracımız bilgi amaçlıdır ve yatırım tavsiyesi niteliği taşımaz. Bordro hesaplamaları için işvereninizden veya mali müşavirinizden doğrulama almanız önerilir.',
            },
          ].map((f, i) => (
            <details key={i} className="group atlas-card p-3">
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
