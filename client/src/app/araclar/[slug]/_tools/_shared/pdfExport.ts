// ── Maaş Hesaplama PDF Export ──────────────────────────────────────
//
// jsPDF + jspdf-autotable ile gerçek PDF (HTML→PDF screenshot DEĞİL).
// A4 dikey, FinansÇözüm branding, sonuç tablosu, kullanılan oranlar,
// yasal uyarı. Client-side generate — sunucu yükü yok.

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { MaasResult } from './maas-engine';
import { fmtTL, fmtPct } from './maas-engine';
import {
  EMPLOYEE_TYPE_LABELS,
  MARITAL_STATUS_LABELS,
  DISABILITY_LABELS,
  type MaasFormData,
  type TaxDataYear,
} from './tax-data';

const PAGE_MARGIN = 14;
const PAGE_WIDTH = 210; // A4 mm
const PAGE_HEIGHT = 297;

export function generateMaasPdf(
  result: MaasResult,
  form: MaasFormData,
  taxData: TaxDataYear,
): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  // ── Header: Brand + Title ──
  doc.setFillColor(16, 185, 129); // primary yeşil
  doc.rect(0, 0, PAGE_WIDTH, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('FinansÇözüm', PAGE_MARGIN, 13);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Maaş Hesaplama Raporu', PAGE_MARGIN, 19);

  doc.setFontSize(8);
  const today = new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.text(today, PAGE_WIDTH - PAGE_MARGIN, 13, { align: 'right' });
  doc.text(`finanscozum.net/araclar/maas-hesaplama`, PAGE_WIDTH - PAGE_MARGIN, 19, { align: 'right' });

  // ── Özet Bilgiler ──
  let y = 30;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Hesaplama Bilgileri', PAGE_MARGIN, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const monthName = new Date(2000, form.month - 1, 1).toLocaleDateString('tr-TR', { month: 'long' });
  const infoLines = [
    `Yıl/Ay: ${form.year} / ${monthName}`,
    `Çalışan: ${EMPLOYEE_TYPE_LABELS[form.employeeType]}`,
    `Hesaplama Yönü: ${form.direction === 'brutten-nete' ? 'Brütten Nete' : 'Netten Brüte'}`,
    `${form.direction === 'brutten-nete' ? 'Brüt' : 'Net'} Maaş: ${fmtTL(form.amount, 2)}`,
    `Medeni Durum: ${MARITAL_STATUS_LABELS[form.maritalStatus]} | Çocuk: ${form.childCount} | Engellilik: ${DISABILITY_LABELS[form.disability]}`,
    `Kümülatif Matrah: ${fmtTL(form.cumulativeMatrah, 2)}`,
  ];
  infoLines.forEach((line) => {
    doc.text(line, PAGE_MARGIN, y);
    y += 4.5;
  });

  // ── Özet Kartlar (Brüt / Net / Kesinti / İşveren) ──
  y += 3;
  doc.setDrawColor(200);
  doc.line(PAGE_MARGIN, y, PAGE_WIDTH - PAGE_MARGIN, y);
  y += 6;

  const summaryCols = form.showEmployerCost ? 4 : 3;
  const summaryWidth = (PAGE_WIDTH - 2 * PAGE_MARGIN) / summaryCols;
  const summaryData: { label: string; value: string; color: [number, number, number] }[] = [
    { label: 'Brüt Maaş', value: fmtTL(result.gross, 0), color: [59, 130, 246] },
    { label: 'Net Maaş', value: fmtTL(result.net, 0), color: [16, 185, 129] },
    { label: 'Toplam Kesinti', value: fmtTL(result.totalDeduction, 0), color: [239, 68, 68] },
  ];
  if (form.showEmployerCost) {
    summaryData.push({ label: 'İşveren Maliyeti', value: fmtTL(result.totalEmployerCost, 0), color: [249, 115, 22] });
  }

  summaryData.forEach((s, i) => {
    const x = PAGE_MARGIN + i * summaryWidth;
    doc.setFillColor(s.color[0], s.color[1], s.color[2]);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.rect(x + 1, y, summaryWidth - 2, 18, 'F');
    doc.text(s.label, x + summaryWidth / 2, y + 6, { align: 'center' });
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(s.value, x + summaryWidth / 2, y + 14, { align: 'center' });
  });
  y += 22;

  // ── Detay Tablosu (jspdf-autotable) ──
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Detaylı Gelir/Gider Tablosu', PAGE_MARGIN, y);
  y += 2;

  const tableData = result.lines.map((l) => [
    l.label,
    l.kind === 'income' ? '+' : l.amount < 0 ? '−' : '',
    fmtTL(Math.abs(l.amount), 2),
    l.rate !== undefined ? fmtPct(l.rate, 2) : '—',
  ]);

  autoTable(doc, {
    startY: y + 2,
    head: [['Kalem', '', 'Tutar (₺)', 'Oran']],
    body: tableData,
    theme: 'striped',
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 90, halign: 'left' },
      1: { cellWidth: 8, halign: 'center' },
      2: { cellWidth: 50, halign: 'right', font: 'courier' },
      3: { cellWidth: 34, halign: 'right' },
    },
    didParseCell: (data) => {
      if (data.row.index >= 0) {
        const line = result.lines[data.row.index];
        if (line?.highlight) {
          data.cell.styles.fillColor = [220, 252, 231];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });

  // ── Kullanılan Oranlar (2. sayfa) ──
  const finalY = (doc as any).lastAutoTable?.finalY ?? y + 50;
  if (finalY > PAGE_HEIGHT - 80) {
    doc.addPage();
  } else {
    y = finalY + 8;
  }

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`${taxData.year} Yılı İçin Kullanılan Oranlar`, PAGE_MARGIN, y);
  y += 5;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const rateLines = [
    `• SGK primi (işçi): ${fmtPct(taxData.sgkEmployee, 1)} | İşveren: ${fmtPct(taxData.sgkEmployer, 1)}`,
    `• İşsizlik sigortası (işçi): ${fmtPct(taxData.unemploymentEmployee, 1)} | İşveren: ${fmtPct(taxData.unemploymentEmployer, 1)}`,
    `• Damga vergisi: ${fmtPct(taxData.stampTax, 3)} (binde 7.59)`,
    `• Asgari ücret istisnası: ${taxData.minimumWageExemption ? 'Uygulanıyor' : 'Uygulanmıyor'}`,
    `• Brüt asgari ücret: ${fmtTL(taxData.minWageBrut, 0)} | Net asgari ücret: ${fmtTL(taxData.minWageNet, 0)}`,
  ];
  rateLines.forEach((line) => {
    doc.text(line, PAGE_MARGIN, y);
    y += 4.5;
  });

  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.text(`${taxData.year} Gelir Vergisi Dilimleri (Ücretli)`, PAGE_MARGIN, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  taxData.incomeTaxBrackets.forEach((b, i) => {
    const next = taxData.incomeTaxBrackets[i + 1];
    doc.text(
      `${i + 1}. dilim: ${b.limit.toLocaleString('tr-TR')} TL – ${next ? next.limit.toLocaleString('tr-TR') + ' TL' : 've üzeri'} → %${(b.rate * 100).toFixed(0)}`,
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
    'Bu rapor bilgi amaçlıdır, yasal bağlayıcılığı yoktur. Bordro hesaplamaları için işvereninize veya mali müşavirinize danışın.',
    PAGE_MARGIN,
    footerY + 4,
  );
  doc.text('Kaynak: Gelir İdaresi Başkanlığı (GİB), Sosyal Güvenlik Kurumu (SGK), Resmi Gazete.', PAGE_MARGIN, footerY + 8);
  doc.text('© ' + new Date().getFullYear() + ' FinansÇözüm — finanscozum.net', PAGE_MARGIN, footerY + 12);

  // ── Save ──
  const filename = `maas-hesaplama-${form.year}-${form.month}-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
