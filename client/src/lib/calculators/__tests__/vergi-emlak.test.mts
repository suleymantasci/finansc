// Referans değerler: GİB 2024–2026 gelir vergisi tarifeleri (dilim sonu kümülatif vergi
// tutarları), damga vergisi oranları, 6183 gecikme zammı ve 3095 kanuni faiz oranları.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  damgaVergisi, donemselFaiz, gecikmeZammi, gelirVergisi, kdvDahilden, kdvHaricten, kdvTevkifati,
  kiraGeliriVergisi, serbestMeslek, stopajBruttenNete, stopajNettenBrute, temettu,
} from '../vergi.ts';
import { emlakVergisi, emlakciKomisyonu, evAmortisman, tapuHarci } from '../emlak.ts';

test('gelir vergisi — GİB tarifesindeki kümülatif tutarlar', () => {
  const t = (m: number, y: number, tur: 'ucret' | 'ucretDisi') => gelirVergisi(m, y, tur).vergi;
  assert.equal(t(190000, 2026, 'ucret'), 28500);
  assert.equal(t(400000, 2026, 'ucret'), 70500);
  assert.equal(t(1500000, 2026, 'ucret'), 367500);
  assert.equal(t(5300000, 2026, 'ucret'), 1697500);
  assert.equal(t(1000000, 2026, 'ucretDisi'), 232500);
  assert.equal(t(5300000, 2026, 'ucretDisi'), 1737500);
  assert.equal(t(1200000, 2025, 'ucret'), 293000);
  assert.equal(t(800000, 2025, 'ucretDisi'), 185000);
  assert.equal(t(4300000, 2025, 'ucretDisi'), 1410000);
  assert.equal(t(3000000, 2024, 'ucret'), 958800);
  assert.equal(t(580000, 2024, 'ucretDisi'), 135000);
  const g = gelirVergisi(6000000, 2026, 'ucret');
  assert.equal(g.vergi, 1697500 + 700000 * 0.4);
  assert.equal(g.marjinalOran, 0.4);
  assert.equal(g.dilimler.reduce((a, d) => a + d.vergi, 0), g.vergi);
});

test('KDV dahil/hariç ve tevkifat', () => {
  assert.deepEqual(kdvHaricten(1000, 0.2), { haric: 1000, kdv: 200, dahil: 1200 });
  assert.deepEqual(kdvDahilden(1200, 0.2), { haric: 1000, kdv: 200, dahil: 1200 });
  assert.deepEqual(kdvDahilden(110, 0.1), { haric: 100, kdv: 10, dahil: 110 });
  const t = kdvTevkifati(10000, 0.2, 9);
  assert.equal(t.kdv, 2000);
  assert.equal(t.tevkifEdilen, 1800);
  assert.equal(t.saticiyaKdv, 200);
  assert.equal(t.aliciOdemesi, 10200);
  assert.equal(t.faturaToplami, 12000);
});

test('damga vergisi: sözleşme binde 9,48, kira binde 1,89 × süre, azami tutar', () => {
  assert.equal(damgaVergisi('sozlesme', 1000000).vergi, 9480);
  const k = damgaVergisi('kira', 20000, 12);
  assert.equal(k.matrah, 240000);
  assert.equal(k.vergi, 453.6);
  assert.equal(damgaVergisi('ucret', 50000).vergi, 379.5);
  const buyuk = damgaVergisi('sozlesme', 5e10);
  assert.equal(buyuk.vergi, 29115961.1);
  assert.equal(buyuk.azamiUygulandi, true);
});

test('stopaj ve serbest meslek makbuzu brüt↔net', () => {
  assert.deepEqual(stopajBruttenNete(25000, 0.2), { brut: 25000, stopaj: 5000, net: 20000 });
  assert.deepEqual(stopajNettenBrute(20000, 0.2), { brut: 25000, stopaj: 5000, net: 20000 });
  const s = serbestMeslek(10000, 'brut', 0.2, 0.2);
  assert.deepEqual(s, { brut: 10000, stopaj: 2000, netUcret: 8000, kdv: 2000, tahsilEdilecek: 10000 });
  assert.equal(serbestMeslek(8000, 'net', 0.2, 0.2).brut, 10000);
  assert.equal(serbestMeslek(12000, 'tahsilat', 0, 0.2).brut, 10000);
});

test('konut kira geliri 2026: 58.000 istisna, götürü gider, ücret dışı tarife', () => {
  const k = kiraGeliriVergisi(240000, 2026, true, 'goturu');
  assert.equal(k.istisna, 58000);
  assert.equal(k.vergiyeTabi, 182000);
  assert.equal(k.gider, 27300);
  assert.equal(k.matrah, 154700);
  assert.equal(k.vergi, 23205);
  const g = kiraGeliriVergisi(240000, 2026, true, 'gercek', 60000);
  assert.equal(g.gider, 45500); // 60.000 × 182.000/240.000
  assert.equal(kiraGeliriVergisi(50000, 2026, true, 'goturu').beyanGerekli, false);
});

test('temettü: %15 stopaj ve verim', () => {
  const t = temettu(1000, 2.5, 50);
  assert.equal(t.brut, 2500);
  assert.equal(t.stopaj, 375);
  assert.equal(t.net, 2125);
  assert.equal(t.verim, 0.05);
});

test('gecikme zammı: tam ay + gün kesri, oran değişiminde bölme', () => {
  const g = gecikmeZammi(10000, '2026-01-15', '2026-03-20');
  assert.equal(g.donemler.length, 1);
  assert.equal(g.donemler[0].ay, 2);
  assert.equal(g.donemler[0].kalanGun, 5);
  assert.equal(g.zam, 801.67);
  const iki = gecikmeZammi(10000, '2025-10-13', '2025-12-13');
  assert.equal(iki.donemler.length, 2);
  assert.equal(iki.donemler[0].tutar, 450);
  assert.equal(iki.donemler[1].tutar, 370);
  assert.equal(iki.zam, 820);
});

test('kanuni faiz: 31.7.2026 itibarıyla %24 → %31', () => {
  const f = donemselFaiz(100000, '2026-07-01', '2026-08-31');
  assert.equal(f.donemler.length, 2);
  assert.equal(f.donemler[0].gun, 30);
  assert.equal(f.donemler[0].tutar, 1972.6);
  assert.equal(f.donemler[1].gun, 31);
  assert.equal(f.donemler[1].tutar, 2632.88);
  assert.equal(f.faiz, 4605.48);
  assert.equal(donemselFaiz(100000, '2025-01-01', '2026-01-01', 0.5).faiz, 50000);
});

test('tapu harcı, emlak vergisi, emlakçı komisyonu, amortisman', () => {
  const t = tapuHarci(5000000, 3000000, 6681);
  assert.equal(t.aliciHarci, 100000);
  assert.equal(t.toplamHarc, 200000);
  assert.equal(t.aliciToplam, 106681);
  assert.equal(tapuHarci(1000000, 1500000, 0).matrah, 1500000);

  assert.deepEqual(emlakVergisi(2000000, 'konut', true), { oran: 0.002, yillik: 4000, taksit: 2000 });
  assert.equal(emlakVergisi(2000000, 'arsa', false, 0.5).yillik, 3000);

  assert.deepEqual(emlakciKomisyonu('satis', 3000000), { taraf: 60000, tarafKdv: 12000, tarafToplam: 72000, genelToplam: 144000 });
  assert.equal(emlakciKomisyonu('kira', 20000).tarafToplam, 24000);

  const a = evAmortisman(3600000, 15000, 0, 0);
  assert.equal(a.sabitKiraYil, 20);
  assert.equal(a.brutGetiri, 0.05);
  assert.equal(a.artisliKiraYil, 20);
  assert.ok(evAmortisman(3600000, 15000, 0, 0.3).artisliKiraYil! < 10);
});
