// Çekirdek yardımcılar, ticaret, yatırım, faiz, tarih ve enerji hesapları.
// Beklenen değerler elle (formülle) hesaplanıp yazıldı; ters işlem (roundtrip) testleri tutarlılığı sınar.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addMonths, annuity, bracketTax, diffYmd, parseTrNumber, round2, weekday } from '../core.ts';
import { basabas, fatura, indirim, indirimOrani, karMarji, marjdanSatis, markuptanSatis, pesinMiTaksit, roi, yuzde } from '../ticaret.ts';
import { altinAyar, basitKarZarar, carpanlar, hisseKarZarar, ikiyeKatlanma, ortalamaMaliyet, pozisyonBuyuklugu } from '../yatirim.ts';
import { gunlukFaiz, kartBorcKapatma, krediOzet, oranDonustur, taksittenFaizOrani } from '../faiz.ts';
import { gunFarki, isGunuSay, tarihEkle, yas } from '../tarih.ts';
import { elektrikTuketimi, sarjMaliyeti, yakitMaliyeti, yakitTuketimi } from '../enerji.ts';
import { GELIR_VERGISI_TARIFESI } from '../params.ts';

test('parseTrNumber: Türkçe ve düz biçimler', () => {
  assert.equal(parseTrNumber('1.234.567,89'), 1234567.89);
  assert.equal(parseTrNumber('100.000'), 100000);
  assert.equal(parseTrNumber('3.5'), 3.5);
  assert.equal(parseTrNumber('3,5'), 3.5);
  assert.equal(parseTrNumber('1234.56'), 1234.56);
  assert.equal(parseTrNumber('₺ 25.000,50'), 25000.5);
  assert.equal(parseTrNumber('%17,5'), 17.5);
  assert.equal(parseTrNumber('-2,5'), -2.5);
  assert.ok(Number.isNaN(parseTrNumber('')));
  assert.ok(Number.isNaN(parseTrNumber('abc')));
  assert.ok(Number.isNaN(parseTrNumber('1,2,3')));
});

test('round2 kayan nokta artığını temizler', () => {
  assert.equal(round2(5532.525), 5532.53);
  assert.equal(round2(1.005), 1.01);
  assert.equal(round2(-1.005), -1.01);
  assert.equal(round2(200.025), 200.03);
});

test('takvim: diffYmd, addMonths, weekday', () => {
  assert.deepEqual(diffYmd('2023-01-31', '2023-02-28'), { years: 0, months: 0, days: 28 });
  assert.deepEqual(diffYmd('2023-01-31', '2023-03-01'), { years: 0, months: 1, days: 1 });
  assert.deepEqual(diffYmd('2000-03-15', '2026-03-14'), { years: 25, months: 11, days: 27 });
  assert.deepEqual(diffYmd('2026-01-01', '2026-01-01'), { years: 0, months: 0, days: 0 });
  assert.equal(addMonths('2024-01-31', 1), '2024-02-29');
  assert.equal(addMonths('2025-01-31', 1), '2025-02-28');
  assert.equal(addMonths('2025-11-15', 3), '2026-02-15');
  assert.equal(weekday('2026-01-01'), 4); // Perşembe
  assert.equal(weekday('2026-09-28'), 1); // Pazartesi
});

test('bracketTax sınırlarda süreklidir', () => {
  const b = GELIR_VERGISI_TARIFESI[2026].ucret;
  assert.equal(bracketTax(0, b), 0);
  assert.equal(bracketTax(-5, b), 0);
  assert.equal(round2(bracketTax(190000.01, b) - bracketTax(190000, b)), 0);
});

test('yüzde modları', () => {
  assert.equal(yuzde('yuzdesi', 250, 20), 50);
  assert.equal(yuzde('oran', 50, 250), 20);
  assert.equal(yuzde('degisim', 200, 250), 25);
  assert.equal(yuzde('degisim', 250, 200), -20);
  assert.equal(round2(yuzde('ekle', 1000, 18)), 1180);
  assert.equal(yuzde('cikar', 1000, 25), 750);
  assert.ok(Number.isNaN(yuzde('oran', 5, 0)));
});

test('indirim, kâr marjı, başabaş, ROI', () => {
  const tek = indirim(1000, [20]);
  assert.equal(tek.indirimli, 800);
  assert.equal(tek.tasarruf, 200);
  assert.equal(round2(tek.toplamOran), 20);
  const ard = indirim(1000, [20, 10]);
  assert.equal(ard.indirimli, 720);
  assert.equal(round2(ard.toplamOran), 28);
  assert.equal(indirimOrani(1000, 750), 25);
  const k = karMarji(80, 100);
  assert.equal(k.kar, 20);
  assert.equal(k.marj, 20);
  assert.equal(k.markup, 25);
  assert.equal(marjdanSatis(80, 20), 100);
  assert.equal(markuptanSatis(80, 25), 100);
  const b = basabas(10000, 50, 30)!;
  assert.equal(b.adet, 500);
  assert.equal(b.ciro, 25000);
  assert.equal(basabas(10000, 30, 30), null);
  const r = roi(100, 150, 2);
  assert.equal(r.roi, 50);
  assert.equal(round2(r.yillik!), 22.47);
});

test('peşin mi taksit mi: zımni faiz tersine doğrulama', () => {
  const esit = pesinMiTaksit(10000, 1000, 10, 0.03);
  assert.equal(esit.vadeFarki, 0);
  assert.equal(esit.zimniAylikFaiz, 0);
  assert.equal(esit.avantaj, 'taksit'); // vade farksız taksit, getiri varsa avantajlı
  const p = pesinMiTaksit(11000, 1000, 12, 0.02);
  assert.ok(p.zimniAylikFaiz! > 0);
  assert.equal(round2(annuity(11000, p.zimniAylikFaiz!, 12)), 1000);
  // Getiri zımni faizden düşükse peşin avantajlı
  assert.equal(pesinMiTaksit(11000, 1000, 12, 0.001).avantaj, 'pesin');
});

test('fatura: satır iskontosu ve KDV dağılımı', () => {
  const f = fatura([
    { adet: 2, birimFiyat: 100, kdv: 20 },
    { adet: 1, birimFiyat: 500, kdv: 10, iskonto: 10 },
  ]);
  assert.equal(f.araToplam, 700);
  assert.equal(f.iskonto, 50);
  assert.equal(f.matrah, 650);
  assert.equal(f.kdvToplam, 85);
  assert.equal(f.genelToplam, 735);
  assert.deepEqual(f.kdvDagilim, [{ oran: 10, matrah: 450, kdv: 45 }, { oran: 20, matrah: 200, kdv: 40 }]);
});

test('ortalama maliyet ve hisse kâr/zarar (komisyon + BSMV)', () => {
  const o = ortalamaMaliyet([{ adet: 100, fiyat: 10 }, { adet: 100, fiyat: 20 }], 0, 18);
  assert.equal(o.ortalama, 15);
  assert.equal(o.karZarar, 600);
  assert.equal(o.getiri, 20);
  const h = hisseKarZarar(10, 12, 1000, 2);
  assert.equal(h.alisKomisyon, 21);
  assert.equal(h.toplamMaliyet, 10021);
  assert.equal(h.satisKomisyon, 25.2);
  assert.equal(h.karZarar, 1953.8);
  // Başabaş fiyattan satınca kâr/zarar sıfır
  const bb = hisseKarZarar(10, h.basabasFiyat, 1000, 2);
  assert.ok(Math.abs(bb.karZarar) < 0.02);
  const a = basitKarZarar(2500, 3000, 10);
  assert.equal(a.karZarar, 5000);
  assert.equal(a.getiri, 20);
});

test('pozisyon büyüklüğü, çarpanlar, katlanma, altın ayarı', () => {
  const p = pozisyonBuyuklugu(100000, 2, 50, 48, 56)!;
  assert.equal(p.riskTutari, 2000);
  assert.equal(p.adet, 1000);
  assert.equal(p.pozisyonTutari, 50000);
  assert.equal(p.odulRisk, 3);
  // Sermaye sınırı: risk izin verse de sermayeden fazla alınamaz
  assert.equal(pozisyonBuyuklugu(10000, 10, 100, 99.9, null)!.adet, 100);
  const c = carpanlar(50, 1000000, 5000000, 25000000);
  assert.equal(c.piyasaDegeri, 50000000);
  assert.equal(c.fk, 10);
  assert.equal(c.pddd, 2);
  assert.equal(c.hbk, 5);
  assert.equal(carpanlar(50, 1000000, -1, null).fk, null);
  const k = ikiyeKatlanma(10)!;
  assert.equal(round2(k.kesin), 7.27);
  assert.equal(k.kural72, 7.2);
  const al = altinAyar(10, '22', 4000);
  assert.equal(round2(al.hasGram), 9.16);
  assert.equal(al.deger, 36640);
});

test('mevduat günlük faiz ve oran dönüşümü', () => {
  const g = gunlukFaiz(100000, 0.45, 32, 0.175);
  assert.equal(g.brut, 3945.21);
  assert.equal(g.stopaj, 690.41);
  assert.equal(g.net, 3254.8);
  const o = oranDonustur(0.03, 'aylik');
  assert.equal(round2(o.yillikBasit * 100), 36);
  assert.equal(round2(o.yillikBilesik * 100), 42.58);
  const geri = oranDonustur(o.yillikBilesik, 'yillikBilesik');
  assert.ok(Math.abs(geri.aylik - 0.03) < 1e-12);
});

test('taksitten faiz oranı: kredi taksitinin tersi', () => {
  const k = krediOzet(100000, 0.03, 12, 'bireysel');
  assert.equal(k.taksit, round2(annuity(100000, 0.039, 12)));
  const r = taksittenFaizOrani(100000, k.taksit, 12, 'bireysel')!;
  assert.ok(Math.abs(r.aylikAkdi - 0.03) < 1e-6);
  assert.equal(taksittenFaizOrani(100000, 8000, 12, 'bireysel'), null); // toplam < tutar
  const konut = krediOzet(1000000, 0.025, 120, 'konut');
  assert.equal(konut.taksit, round2(annuity(1000000, 0.025, 120)));
});

test('kredi kartı borcu kapatma', () => {
  const tek = kartBorcKapatma(10000, 0.04, 11000);
  assert.equal(tek.ay, 1);
  assert.equal(tek.toplamFaiz, 400);
  assert.equal(tek.toplamVergi, 120);
  assert.equal(tek.toplamOdeme, 10520);
  assert.equal(kartBorcKapatma(10000, 0.04, 520).biterMi, false);
  const uzun = kartBorcKapatma(10000, 0.04, 1000);
  assert.equal(uzun.biterMi, true);
  assert.ok(uzun.ay! > 10);
  assert.equal(round2(uzun.toplamOdeme - uzun.toplamFaiz - uzun.toplamVergi), 10000);
});

test('tarih: gün farkı, yaş, iş günü, tarihe ekleme', () => {
  assert.equal(gunFarki('2026-01-01', '2026-12-31', true).gun, 365);
  assert.equal(gunFarki('2026-01-01', '2026-12-31', false).gun, 364);
  assert.equal(gunFarki('2026-12-31', '2026-01-01', false).gun, 364);
  const y = yas('1990-05-10', '2026-09-28')!;
  assert.deepEqual(y.ymd, { years: 36, months: 4, days: 18 });
  assert.equal(y.sonrakiDogumGunu, '2027-05-10');
  assert.equal(y.yeniYas, 37);
  const dg = yas('1990-09-28', '2026-09-28')!;
  assert.equal(dg.kalanGun, 0);
  assert.equal(dg.yeniYas, 36);
  const subat = yas('2000-02-29', '2026-02-28')!;
  assert.equal(subat.kalanGun, 0);
  assert.equal(subat.yeniYas, 26);
  // Ocak 2026: 22 hafta içi gün, 1 Ocak tatil
  const ocak = isGunuSay('2026-01-01', '2026-01-31', false);
  assert.equal(ocak.isGunu, 21);
  assert.equal(ocak.tatilGunu, 1);
  assert.equal(ocak.haftaSonu, 9);
  // Mart 2026 Ramazan Bayramı: 19 Mart arife (yarım), 20 Mart Cuma tatil
  const mart = isGunuSay('2026-03-16', '2026-03-20', false);
  assert.equal(mart.isGunu, 3.5);
  assert.equal(isGunuSay('2026-03-16', '2026-03-20', false, false).isGunu, 5);
  assert.equal(tarihEkle('2026-03-18', 2, 'isgunu'), '2026-03-23');
  assert.equal(tarihEkle('2026-01-31', 1, 'ay'), '2026-02-28');
  assert.equal(tarihEkle('2026-09-28', -30, 'gun'), '2026-08-29');
});

test('yakıt, şarj ve elektrik', () => {
  const y = yakitMaliyeti(450, 6.5, 50, 3, false);
  assert.equal(y.litre, 29.25);
  assert.equal(y.maliyet, 1462.5);
  assert.equal(y.kisiBasi, 487.5);
  assert.equal(yakitMaliyeti(450, 6.5, 50, 1, true).maliyet, 2925);
  assert.equal(yakitTuketimi(40, 500, null)!.litre100, 8);
  assert.equal(yakitTuketimi(40, 500, null)!.kmLitre, 12.5);
  const s = sarjMaliyeti(60, 20, 80, 3, 0.9, 16)!;
  assert.equal(s.batarya, 36);
  assert.equal(s.maliyet, 120);
  assert.equal(s.menzil, 225);
  const e = elektrikTuketimi(2000, 1, 30, 3);
  assert.equal(e.toplamKwh, 60);
  assert.equal(e.toplamMaliyet, 180);
});
