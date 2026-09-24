// ── Maaş Hesaplama PDF Export ──────────────────────────────────────
//
// jsPDF + jspdf-autotable ile gerçek PDF (HTML→PDF screenshot DEĞİL).
// A4 dikey, FinansÇözüm branding, 12 aylık tablo, kullanılan oranlar,
// yasal uyarı. Client-side generate — sunucu yükü yok.

import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import type { YearlyTableResult } from './maas-engine';
import { fmtTL, fmtPct } from './maas-engine';
import {
  EMPLOYEE_TYPE_LABELS,
  DISABILITY_LABELS,
  type MaasFormData,
  type TaxDataYear,
} from './tax-data';

const PAGE_MARGIN = 14;
const PAGE_WIDTH = 210; // A4 mm
const PAGE_HEIGHT = 297;

/**
 * jsPDF'in varsayılan Helvetica fontu Türkçe karakterleri (ı, ş, ğ, ü, ö, ç, İ, Ş, Ğ)
 * ve ₺ sembolünü desteklemez. En yakın Latin eşdeğerine çevirir.
 */
function tr(text: string): string {
  return text
    .replace(/₺/g, 'TL')
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'I')
    .replace(/ş/g, 's')
    .replace(/Ş/g, 'S')
    .replace(/ğ/g, 'g')
    .replace(/Ğ/g, 'G')
    .replace(/ü/g, 'u')
    .replace(/Ü/g, 'U')
    .replace(/ö/g, 'o')
    .replace(/Ö/g, 'O')
    .replace(/ç/g, 'c')
    .replace(/Ç/g, 'C');
}

export function generateMaasPdf(
  yearlyResult: YearlyTableResult,
  form: MaasFormData,
  taxData: TaxDataYear,
): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  // ── Header: Brand + Title ──
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 0, PAGE_WIDTH, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(tr('FinansCozum'), PAGE_MARGIN, 13);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(tr('Maas Hesaplama Raporu'), PAGE_MARGIN, 19);

  doc.setFontSize(8);
  const today = new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.text(tr(today), PAGE_WIDTH - PAGE_MARGIN, 13, { align: 'right' });
  doc.text('finanscozum.net/araclar/maas-hesaplama', PAGE_WIDTH - PAGE_MARGIN, 19, { align: 'right' });

  // ── Özet Bilgiler ──
  let y = 30;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(tr('Hesaplama Bilgileri'), PAGE_MARGIN, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const infoLines = [
    `Yil: ${form.year}`,
    `Calisan: ${tr(EMPLOYEE_TYPE_LABELS[form.employeeType])}`,
    `Hesaplama Yonu: ${form.direction === 'brutten-nete' ? 'Brutten Nete' : 'Netten Brute'}`,
    `Aylik Maas: ${tr(fmtTL(form.amount, 2))}`,
    `Engellilik: ${tr(DISABILITY_LABELS[form.disability])}`,
  ];
  infoLines.forEach((line) => {
    doc.text(line, PAGE_MARGIN, y);
    y += 4.5;
  });

  // ── Özet Kartlar ──
  y += 3;
  doc.setDrawColor(200);
  doc.line(PAGE_MARGIN, y, PAGE_WIDTH - PAGE_MARGIN, y);
  y += 6;

  const activeMonths = yearlyResult.rows.filter((r) => r.gross > 0).length;
  const summaryCols = form.showEmployerCost ? 4 : 3;
  const summaryWidth = (PAGE_WIDTH - 2 * PAGE_MARGIN) / summaryCols;
  const summaryData: { label: string; value: string; color: [number, number, number] }[] = [
    { label: 'Yillik Brut', value: tr(fmtTL(yearlyResult.totals.gross, 0)), color: [59, 130, 246] },
    { label: 'Yillik Net', value: tr(fmtTL(yearlyResult.totals.net, 0)), color: [16, 185, 129] },
    { label: 'Yillik Vergi', value: tr(fmtTL(yearlyResult.totalTax, 0)), color: [239, 68, 68] },
  ];
  if (form.showEmployerCost) {
    summaryData.push({ label: 'Isveren Maliyeti', value: tr(fmtTL(yearlyResult.totals.totalEmployerCost, 0)), color: [249, 115, 22] });
  }

  summaryData.forEach((s, i) => {
    const x = PAGE_MARGIN + i * summaryWidth;
    doc.setFillColor(s.color[0], s.color[1], s.color[2]);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.rect(x + 1, y, summaryWidth - 2, 18, 'F');
    doc.text(s.label, x + summaryWidth / 2, y + 6, { align: 'center' });
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(s.value, x + summaryWidth / 2, y + 14, { align: 'center' });
  });
  y += 22;

  // ── 12 Aylık Tablo ──
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(tr(`${form.year} Yillik Maas Tablosu (${activeMonths} ay)`), PAGE_MARGIN, y);
  y += 2;

  const head = form.showEmployerCost
    ? [['Ay', 'Brut', 'Net', 'G.Vergisi', 'Issizlik', 'Damga', 'SGK Isci', 'SGK Isveren', 'Isv. Maliyet']]
    : [['Ay', 'Brut', 'Net', 'G.Vergisi', 'Issizlik', 'Damga', 'SGK Isci']];

  const body = yearlyResult.rows.map((r) => {
    const row = [
      tr(r.monthName),
      fmtNum(r.gross),
      fmtNum(r.net),
      fmtNum(r.incomeTax),
      fmtNum(r.unemployment),
      fmtNum(r.stampTax),
      fmtNum(r.sgkEmployee),
    ];
    if (form.showEmployerCost) {
      row.push(fmtNum(r.sgkEmployer), fmtNum(r.totalEmployerCost));
    }
    return row;
  });

  // Toplam satırı
  const totalsRow = [
    'TOPLAM',
    fmtNum(yearlyResult.totals.gross),
    fmtNum(yearlyResult.totals.net),
    fmtNum(yearlyResult.totals.incomeTax),
    fmtNum(yearlyResult.totals.unemployment),
    fmtNum(yearlyResult.totals.stampTax),
    fmtNum(yearlyResult.totals.sgkEmployee),
  ];
  if (form.showEmployerCost) {
    totalsRow.push(fmtNum(yearlyResult.totals.sgkEmployer), fmtNum(yearlyResult.totals.totalEmployerCost));
  }
  body.push(totalsRow);

  autoTable(doc, {
    startY: y + 2,
    head,
    body,
    theme: 'striped',
    styles: { fontSize: 6.5, cellPadding: 1.2 },
    headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold', fontSize: 6 },
    columnStyles: {
      0: { cellWidth: 16, halign: 'left' },
    },
    didParseCell: (data) => {
      // Toplam satırı bold
      if (data.row.index === body.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [220, 252, 231];
      }
      // Sağa hizala (sayılar)
      if (data.column.index > 0) {
        data.cell.styles.halign = 'right';
        data.cell.styles.font = 'courier';
      }
    },
  });

  // ── Kullanılan Oranlar ──
  const finalY = (doc as any).lastAutoTable?.finalY ?? y + 50;
  if (finalY > PAGE_HEIGHT - 80) {
    doc.addPage();
    y = PAGE_MARGIN + 10;
  } else {
    y = finalY + 8;
  }

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(tr(`${taxData.year} Yili Kullanilan Oranlar`), PAGE_MARGIN, y);
  y += 5;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const rateLines = [
    `SGK primi (isci): ${fmtPct(taxData.sgkEmployee, 1)} | Isveren: ${fmtPct(taxData.sgkEmployer, 1)}`,
    `Issizlik sigortasi (isci): ${fmtPct(taxData.unemploymentEmployee, 1)} | Isveren: ${fmtPct(taxData.unemploymentEmployer, 1)}`,
    `Damga vergisi: ${fmtPct(taxData.stampTax, 3)} (binde 7,59)`,
    `Asgari ucret istisnasi: ${taxData.minimumWageExemption ? 'Uygulaniyor' : 'Uygulanmiyor'}`,
    `Brut asgari ucret: ${tr(fmtTL(taxData.minWageBrut, 0))} | Net: ${tr(fmtTL(taxData.minWageNet, 0))}`,
  ];
  rateLines.forEach((line) => {
    doc.text(tr(line), PAGE_MARGIN, y);
    y += 4.5;
  });

  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.text(tr(`${taxData.year} Gelir Vergisi Dilimleri (Ucretli)`), PAGE_MARGIN, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  taxData.incomeTaxBrackets.forEach((b, i) => {
    const next = taxData.incomeTaxBrackets[i + 1];
    doc.text(
      tr(`${i + 1}. dilim: ${b.limit.toLocaleString('tr-TR')} TL - ${next ? next.limit.toLocaleString('tr-TR') + ' TL' : 've uzeri'} -> %${(b.rate * 100).toFixed(0)}`),
      PAGE_MARGIN,
      y,
    );
    y += 4.5;
  });

  // ── Yasal Uyarı (Footer) ──
  const footerY = PAGE_HEIGHT - 22;
  doc.setDrawColor(200);
  doc.line(PAGE_MARGIN, footerY, PAGE_WIDTH - PAGE_MARGIN, footerY);
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.setFont('helvetica', 'normal');
  doc.text(
    tr('Bu rapor bilgi amaclidir, yasal baglayiciligi yoktur. Bordro hesaplamalari icin isvereninize veya mali musavirinize danisin.'),
    PAGE_MARGIN,
    footerY + 4,
  );
  doc.text(tr('Kaynak: Gelir Idaresi Baskanligi (GIB), Sosyal Guvenlik Kurumu (SGK), Resmi Gazete.'), PAGE_MARGIN, footerY + 8);
  doc.text(tr('(c) ' + new Date().getFullYear() + ' FinansCozum - finanscozum.net'), PAGE_MARGIN, footerY + 12);

  // ── Save ──
  const filename = `maas-hesaplama-${form.year}-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

function fmtNum(v: number): string {
  return v.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
