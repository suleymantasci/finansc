// Referans değerler: SGK/verginet 2026/1 sirküleri (asgari ücret ve işveren maliyeti),
// İŞKUR işsizlik ödeneği tavanı, SGK borçlanma tutarları, SGK 2023/13 EYT tablosu.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  asgariUcret, dogumIzni, fazlaMesai, ihbarTazminati, issizlikMaasi, kidemTazminati, raporParasi, yillikIzin,
} from '../calisma.ts';
import { besHakEdisOrani, besHesapla, borclanma, emeklilikHesapla, eytPrimGunu, finansalOzgurluk, kademeliYas } from '../sgk.ts';

test('asgari ücret 2026 — SGK sirküleri 2026/1 ile birebir', () => {
  const a = asgariUcret('2026-06-01');
  assert.equal(a.brut, 33030);
  assert.equal(a.sgkIsci, 4624.2);
  assert.equal(a.issizlikIsci, 330.3);
  assert.equal(a.net, 28075.5);
  assert.equal(a.sgkIsveren, 7184.03);
  assert.equal(a.isverenMaliyeti, 40874.63);
  assert.equal(asgariUcret('2026-06-01', 2).isverenMaliyeti, 40214.03);
  assert.equal(asgariUcret('2026-06-01', 5).isverenMaliyeti, 39223.13);
  assert.equal(a.gunlukBrut, 1101);
});

test('asgari ücret net 2024 ve 2025 resmi tutarlar', () => {
  assert.equal(asgariUcret('2024-03-01').net, 17002.12);
  assert.equal(asgariUcret('2025-03-01').net, 22104.67);
});

test('işsizlik maaşı 2026: asgari ücretliye 13.111,72; tavan 26.223,44', () => {
  const asg = issizlikMaasi(33030, 900, '2026-09-01');
  assert.equal(asg.aylikBrut, 13212);
  assert.equal(asg.aylikNet, 13111.72);
  assert.equal(asg.sureGun, 240);
  const yuksek = issizlikMaasi(120000, 1200, '2026-09-01');
  assert.equal(yuksek.aylikBrut, 26424);
  assert.equal(yuksek.aylikNet, 26223.44);
  assert.equal(yuksek.tavanUygulandi, true);
  assert.equal(yuksek.sureGun, 300);
  assert.equal(issizlikMaasi(40000, 599, '2026-09-01').sureGun, 0);
  assert.equal(issizlikMaasi(40000, 600, '2026-09-01').sureGun, 180);
});

test('kıdem tazminatı: tam yıllar, kesirli süre, tavan ve 1 yıl şartı', () => {
  const k = kidemTazminati('2020-01-01', '2025-12-31', 40000);
  assert.deepEqual(k.sure, { years: 6, months: 0, days: 0 });
  assert.equal(k.brut, 240000);
  assert.equal(k.damga, 1821.6);
  assert.equal(k.net, 238178.4);

  const kesirli = kidemTazminati('2023-03-15', '2026-09-28', 50000);
  assert.deepEqual(kesirli.sure, { years: 3, months: 6, days: 14 });
  assert.equal(kesirli.brut, 176917.81);

  const tavan = kidemTazminati('2016-01-01', '2026-09-28', 100000, 5000);
  assert.equal(tavan.tavan, 73729.87);
  assert.equal(tavan.esasUcret, 73729.87);
  assert.equal(tavan.tavanUygulandi, true);
  // Ocak 2026 çıkışında 1. dönem tavanı
  assert.equal(kidemTazminati('2016-01-01', '2026-01-10', 100000).tavan, 64948.77);

  const kisa = kidemTazminati('2026-01-01', '2026-12-30', 40000);
  assert.equal(kisa.hakVar, false);
  assert.equal(kisa.brut, 0);
});

test('ihbar tazminatı: süreler ve gelir vergisi dilim geçişi', () => {
  const i = ihbarTazminati('2024-06-01', '2026-06-01', 30000);
  assert.equal(i.hafta, 6);
  assert.equal(i.brut, 42000);
  assert.equal(i.gelirVergisi, 6300);
  assert.equal(i.damga, 318.78);
  assert.equal(i.net, 35381.22);
  // 180.000 kümülatif matrahta 10.000 TL %15, 32.000 TL %20 dilimde
  assert.equal(ihbarTazminati('2024-06-01', '2026-06-01', 30000, 0, 180000).gelirVergisi, 7900);
  assert.equal(ihbarTazminati('2026-01-01', '2026-03-01', 30000).hafta, 2);
  assert.equal(ihbarTazminati('2025-01-01', '2026-01-01', 30000).hafta, 4);
  assert.equal(ihbarTazminati('2020-01-01', '2026-01-01', 30000).hafta, 8);
});

test('rapor parası: hastalıkta ilk 2 gün ödenmez, yatarakta 1/2', () => {
  const r = raporParasi('hastalik', false, 99090, 90, 10, '2026-05-01');
  assert.equal(r.gunlukKazanc, 1101);
  assert.equal(r.gunlukOdenek, 734);
  assert.equal(r.odenecekGun, 8);
  assert.equal(r.toplam, 5872);
  assert.equal(raporParasi('is-kazasi', true, 99090, 90, 10, '2026-05-01').toplam, 5505);
  // Günlük kazanç üst sınırı 2026: 9.909 TL
  assert.equal(raporParasi('analik', false, 3000000, 90, 1, '2026-05-01').gunlukKazanc, 9909);
});

test('yıllık izin: kademeler, yaş istisnası, yer altı', () => {
  assert.equal(yillikIzin('2025-10-01', '2026-09-28', 30).izinGun, 0);
  assert.equal(yillikIzin('2021-09-28', '2026-09-28', 30).izinGun, 14); // tam 5 yıl
  assert.equal(yillikIzin('2020-01-01', '2026-09-28', 30).izinGun, 20);
  assert.equal(yillikIzin('2010-01-01', '2026-09-28', 40).izinGun, 26);
  const genc = yillikIzin('2024-01-01', '2026-09-28', 18);
  assert.equal(genc.izinGun, 20);
  assert.equal(genc.yasIstisnasi, true);
  assert.equal(yillikIzin('2024-01-01', '2026-09-28', 50).izinGun, 20);
  assert.equal(yillikIzin('2024-01-01', '2026-09-28', 30, true).izinGun, 18);
  assert.equal(yillikIzin('2020-01-01', '2026-09-28', 30).sonrakiHakEdis, '2027-01-01');
});

test('fazla mesai: 225 saat esası, %50 ve %25 zam', () => {
  const f = fazlaMesai(45000, 10, 4, 1, 0.15);
  assert.equal(f.saatlikUcret, 200);
  assert.equal(f.fazlaCalisma, 3000);
  assert.equal(f.fazlaSurelerle, 1000);
  assert.equal(f.tatil, 1500);
  assert.equal(f.toplamBrut, 5500);
  assert.equal(f.sgk, 770);
  assert.equal(f.issizlik, 55);
  assert.equal(f.gelirVergisi, 701.25);
  assert.equal(f.damga, 41.75);
  assert.equal(f.toplamNet, 3932);
});

test('doğum izni: 1.5.2026 sonrası 8+16 hafta, çoğulda 10+16, devretme', () => {
  const d = dogumIzni('2026-10-01', false);
  assert.equal(d.yeniKural, true);
  assert.equal(d.baslangic, '2026-08-06');
  assert.equal(d.iseDonus, '2027-01-21');
  assert.equal(d.bitis, '2027-01-20');
  assert.equal(d.toplamHafta, 24);
  const c = dogumIzni('2026-10-01', true);
  assert.equal(c.toplamHafta, 26);
  const devir = dogumIzni('2026-10-01', false, 2);
  assert.equal(devir.devredilenHafta, 6);
  assert.equal(devir.sonrasiHafta, 22);
  assert.equal(devir.toplamHafta, 24);
  assert.equal(dogumIzni('2026-03-01', false).toplamHafta, 16);
});

test('EYT prim günü tablosu (SGK 2023/13)', () => {
  assert.equal(eytPrimGunu('kadin', '1984-01-01'), 5000);
  assert.equal(eytPrimGunu('kadin', '1985-05-23'), 5000);
  assert.equal(eytPrimGunu('kadin', '1985-05-24'), 5075);
  assert.equal(eytPrimGunu('kadin', '1990-01-01'), 5375);
  assert.equal(eytPrimGunu('kadin', '1999-09-08'), 5975);
  assert.equal(eytPrimGunu('erkek', '1976-01-01'), 5000);
  assert.equal(eytPrimGunu('erkek', '1980-11-24'), 5075);
  assert.equal(eytPrimGunu('erkek', '1990-01-01'), 5525);
  assert.equal(eytPrimGunu('erkek', '1998-11-24'), 5975);
});

test('kademeli yaş tablosu (5510 md. 28)', () => {
  assert.equal(kademeliYas('kadin', 2035), 58);
  assert.equal(kademeliYas('erkek', 2036), 61);
  assert.equal(kademeliYas('erkek', 2044), 65);
  assert.equal(kademeliYas('kadin', 2046), 64);
  assert.equal(kademeliYas('kadin', 2048), 65);
});

test('emeklilik tarihi: üç dönem', () => {
  const eyt = emeklilikHesapla({ statu: '4a', cinsiyet: 'kadin', dogum: '1972-04-01', giris: '1994-03-01', primGun: 5800, bugun: '2026-09-28', yillikPrim: 360 });
  assert.equal(eyt.donem, 'eyt');
  assert.equal(eyt.gerekenGun, 5675); // 24.5.1993–23.5.1994 satırı
  assert.equal(eyt.emeklilikTarihi, '2026-09-28');

  const ara = emeklilikHesapla({ statu: '4a', cinsiyet: 'erkek', dogum: '1980-06-15', giris: '2001-02-01', primGun: 7000, bugun: '2026-09-28', yillikPrim: 360 });
  assert.equal(ara.donem, '1999-2008');
  assert.equal(ara.emeklilikTarihi, '2040-06-15');

  const yeni = emeklilikHesapla({ statu: '4a', cinsiyet: 'erkek', dogum: '1990-05-10', giris: '2010-01-01', primGun: 5000, bugun: '2026-09-28', yillikPrim: 360 });
  assert.equal(yeni.donem, '2008-sonrasi');
  assert.equal(yeni.gerekenYas, 60);
  assert.equal(yeni.emeklilikTarihi, '2050-05-10');

  const bagkur = emeklilikHesapla({ statu: '4b', cinsiyet: 'kadin', dogum: '1990-05-10', giris: '2012-01-01', primGun: 0, bugun: '2026-09-28', yillikPrim: 360 });
  assert.equal(bagkur.gerekenGun, 9000);
  // 9000 gün 25 yılda (2051) tamamlanır → 65 yaş
  assert.equal(bagkur.gerekenYas, 65);
});

test('borçlanma 2026: doğum %32, askerlik %45 (SGK tutarları)', () => {
  const d = borclanma('dogum', 720, null, '2026-03-01');
  assert.equal(d.gunlukAlt, 1101);
  assert.equal(d.gunlukPrim, 352.32);
  assert.equal(d.toplam, 253670.4);
  const a = borclanma('askerlik', 540, null, '2026-03-01');
  assert.equal(a.gunlukPrim, 495.45);
  assert.equal(a.toplam, 267543);
  assert.equal(borclanma('askerlik', 1, 50000, '2026-03-01').gunlukKazanc, 9909);
  assert.equal(borclanma('askerlik', 1, 10, '2026-03-01').gunlukKazanc, 1101);
});

test('BES 2026: %20 devlet katkısı, yıllık üst sınır 79.272 TL', () => {
  const b = besHesapla(33030, 1, 0, 30, '2026-02-01');
  assert.equal(b.devletKatkiOrani, 0.2);
  assert.equal(b.yillikTavan, 79272);
  assert.equal(b.toplamDevletKatkisi, 79272);
  assert.equal(b.toplamKatki, 396360);
  const kucuk = besHesapla(1000, 1, 0, 30, '2026-02-01');
  assert.equal(kucuk.toplamDevletKatkisi, 2400);
  assert.equal(besHakEdisOrani(2, 40), 0);
  assert.equal(besHakEdisOrani(3, 40), 0.15);
  assert.equal(besHakEdisOrani(6, 40), 0.35);
  assert.equal(besHakEdisOrani(10, 50), 0.6);
  assert.equal(besHakEdisOrani(10, 56), 1);
  // Getirisiz 10 yıl: katkı birikimi = toplam katkı
  const on = besHesapla(1000, 10, 0, 46, '2026-02-01');
  assert.equal(on.katkiBirikimi, 120000);
  assert.equal(on.hakEdisOrani, 1);
});

test('finansal özgürlük: %4 kuralı hedefi', () => {
  const f = finansalOzgurluk(50000, 0.04, 0, 100000, 0);
  assert.equal(f.hedef, 15000000);
  assert.equal(f.ay, 150);
});
