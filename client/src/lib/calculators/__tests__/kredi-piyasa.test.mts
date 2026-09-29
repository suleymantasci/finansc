// Kredi, kart, menkul kıymet, iskonto, TÜFE endeksi ve IBAN hesapları.
// Beklenen değerler elle hesaplandı; ters işlem testleri planların tutarlılığını sınar.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { annuity, round2 } from '../core.ts';
import {
  KREDI_VERGI, asgariOdemeOrani, erkenKapatmaTazminati, kalanAnapara, kartGecikme, kartTaksit, krediGecikme,
  krediPlani, krediYapilandirma, neKadarKredi, yillikMaliyetOrani,
} from '../kredi.ts';
import {
  basitGetiri, cagr, endeksDegisim, endeksSerisi, eurobond, hasIcerik, ibanDogrula, icVerimOrani, iskonto,
  netBugunkuDeger, onikiAylikOrtalamaDegisim, ortalamaVade, sermayeIslemi, vadeliFiyat,
} from '../piyasa.ts';

test('kredi planı: taksit, anapara toplamı ve vergiler tutarlı', () => {
  const p = krediPlani(100000, 0.03, 12, KREDI_VERGI.ihtiyac);
  assert.equal(p.taksit, round2(annuity(100000, 0.039, 12)));
  assert.equal(p.satirlar.length, 12);
  assert.equal(p.satirlar[11].kalan, 0);
  const anapara = p.satirlar.reduce((s, r) => s + r.anapara, 0);
  assert.ok(Math.abs(anapara - 100000) < 0.1);
  // İlk ay: faiz 3.000, BSMV 450, KKDF 450
  assert.equal(p.satirlar[0].faiz, 3000);
  assert.equal(p.satirlar[0].bsmv, 450);
  assert.equal(p.satirlar[0].kkdf, 450);
  assert.ok(Math.abs(p.toplamFaiz + p.toplamBsmv + p.toplamKkdf - (p.toplamOdeme - 100000)) < 0.1);
  const konut = krediPlani(1000000, 0.025, 120, KREDI_VERGI.konut);
  assert.equal(konut.taksit, round2(annuity(1000000, 0.025, 120)));
  assert.equal(konut.toplamBsmv, 0);
  const ticari = krediPlani(100000, 0.03, 12, KREDI_VERGI.ticari);
  assert.equal(ticari.satirlar[0].bsmv, 150);
  assert.equal(ticari.satirlar[0].kkdf, 0);
});

test('kalan anapara plan tablosuyla aynı', () => {
  const p = krediPlani(200000, 0.028, 36, KREDI_VERGI.tasit);
  assert.equal(round2(kalanAnapara(200000, 0.028, 36, 12, KREDI_VERGI.tasit)), p.satirlar[11].kalan);
  assert.equal(kalanAnapara(200000, 0.028, 36, 0, KREDI_VERGI.tasit), 200000);
  assert.equal(kalanAnapara(200000, 0.028, 36, 36, KREDI_VERGI.tasit), 0);
});

test('ne kadar kredi: taksit sınırı ve ters hesap', () => {
  const r = neKadarKredi(60000, 0.5, 5000, 0.03, 36, KREDI_VERGI.ihtiyac);
  assert.equal(r.azamiTaksit, 25000);
  assert.equal(round2(annuity(r.azamiKredi, 0.039, 36)), 25000);
  assert.equal(neKadarKredi(10000, 0.5, 6000, 0.03, 36, KREDI_VERGI.ihtiyac).azamiKredi, 0);
});

test('kredi gecikme faizi: akdi × 1,30, gün esası, vergiler', () => {
  const g = krediGecikme(10000, 0.04, 15, KREDI_VERGI.ihtiyac);
  assert.equal(round2(g.gecikmeOrani * 100), 5.2);
  assert.equal(g.faiz, 260);
  assert.equal(g.bsmv, 39);
  assert.equal(g.kkdf, 39);
  assert.equal(g.toplamEk, 338);
  assert.equal(krediGecikme(10000, 0.04, 15, KREDI_VERGI.konut).toplamEk, 260);
});

test('yıllık maliyet oranı: masrafsız efektif orana eşit, masrafla artar', () => {
  const y0 = yillikMaliyetOrani(100000, 0.03, 12, KREDI_VERGI.ihtiyac, 0)!;
  assert.ok(Math.abs(y0.aylik - 0.039) < 1e-9);
  assert.ok(Math.abs(y0.yillik - (1.039 ** 12 - 1)) < 1e-9);
  const y1 = yillikMaliyetOrani(100000, 0.03, 12, KREDI_VERGI.ihtiyac, 500)!;
  assert.ok(y1.aylik > y0.aylik);
  assert.equal(y1.netKullanilan, 99500);
});

test('yapılandırma, erken kapatma, asgari ödeme', () => {
  const y = krediYapilandirma(100000, 0.04, 24, 12, KREDI_VERGI.ihtiyac, 0, 0, 0.04, 12)!;
  // Aynı faiz ve kalan vadeyle yeniden kredi: taksit ve toplam değişmez
  assert.ok(Math.abs(y.yeniTaksit - y.eskiTaksit) < 0.02);
  assert.ok(Math.abs(y.fark) < 0.2);
  assert.deepEqual(erkenKapatmaTazminati(50000, 24), { oran: 0.01, tazminat: 500 });
  assert.deepEqual(erkenKapatmaTazminati(50000, 48), { oran: 0.02, tazminat: 1000 });
  assert.equal(asgariOdemeOrani(50000), 0.2);
  assert.equal(asgariOdemeOrani(50001), 0.4);
});

test('kart gecikme: ödenmeyen asgariye gecikme, kalanına akdi faiz', () => {
  const g = kartGecikme(20000, 40000, 1000, 0.0375, 0.0405, 30);
  assert.equal(g.asgari, 4000);
  assert.equal(g.odenmeyenAsgari, 3000);
  assert.equal(g.akdiyeTabi, 16000);
  assert.equal(g.gecikmeFaizi, 121.5);
  assert.equal(g.akdiFaiz, 600);
  assert.equal(g.vergi, 216.45);
  assert.equal(g.toplamFaiz, 937.95);
  // Asgari ödendiyse gecikme faizi yok
  assert.equal(kartGecikme(20000, 40000, 4000, 0.0375, 0.0405, 30).gecikmeFaizi, 0);
  const t = kartTaksit(12000, 0.0425, 6);
  assert.equal(t.taksit, round2(annuity(12000, 0.0425 * 1.3, 6)));
});

test('bono / tahvil / repo basit getiri', () => {
  const b = basitGetiri(100000, 0.4, 91, 0);
  assert.equal(b.brut, 9972.6);
  assert.equal(b.stopaj, 0);
  assert.equal(basitGetiri(100000, 0.4, 91, 0.15).stopaj, 1495.89);
});

test('eurobond: başa baş fiyatta YTM kupona eşit', () => {
  const e = eurobond(100, 6, 5, 10, 2)!;
  assert.ok(Math.abs(e.ytm - 0.06) < 1e-9);
  assert.equal(e.maliyet, 10000);
  assert.equal(e.yillikKupon, 600);
  assert.equal(e.toplamKupon, 3000);
  const ind = eurobond(95, 6, 5, 1, 2)!;
  assert.ok(ind.ytm > 0.06 && Math.abs(ind.ytm - ind.ytmYaklasik) < 0.002);
  const yillik = eurobond(100, 7, 3, 1, 1)!;
  assert.ok(Math.abs(yillik.ytm - 0.07) < 1e-9);
});

test('sermaye işlemleri teorik fiyat', () => {
  const bz = sermayeIslemi('bedelsiz', 100, 50, 1);
  assert.equal(bz.yeniAdet, 200);
  assert.equal(bz.yeniFiyat, 25);
  const bl = sermayeIslemi('bedelli', 100, 50, 1);
  assert.equal(bl.yeniFiyat, 25.5);
  assert.equal(bl.nakit, -100);
  const t = sermayeIslemi('temettu', 100, 50, 0.1);
  assert.equal(t.yeniFiyat, 45);
  assert.equal(t.nakit, 500);
});

test('NBD, İVO, CAGR, vadeli fiyat', () => {
  assert.ok(Math.abs(netBugunkuDeger(0.1, [110], 100)) < 1e-9);
  assert.ok(Math.abs(icVerimOrani(100, [110])! - 0.1) < 1e-9);
  const irr = icVerimOrani(100, [60, 60])!;
  assert.ok(Math.abs(netBugunkuDeger(irr, [60, 60], 100)) < 1e-6);
  assert.equal(round2(irr * 100), 13.07);
  assert.equal(round2(cagr(100000, 150000, 5) * 100), 8.45);
  assert.equal(round2(vadeliFiyat(100, 0.365, 0, 100)), 110);
});

test('iskonto ve ortalama vade', () => {
  const d = iskonto('dis', 10000, 0.36, 90)!;
  assert.equal(round2(d.iskonto), 900);
  assert.equal(round2(d.diger), 9100);
  const i = iskonto('ic', 9100, 0.36, 90)!;
  assert.equal(round2(i.diger), 10000);
  assert.equal(round2(iskonto('bilesik', 10000, 0.36, 360)!.diger), 13600);
  assert.equal(ortalamaVade([{ tutar: 1000, gun: 30 }, { tutar: 3000, gun: 90 }])!.gun, 75);
});

test('TÜFE endeksi: dönem değişimi ve 12 aylık ortalama', () => {
  const noktalar = [];
  for (let t = 0; t < 36; t++) noktalar.push({ year: 2023 + Math.floor(t / 12), month: (t % 12) + 1, value: 100 * 1.02 ** t });
  const s = endeksSerisi(noktalar);
  assert.ok(Math.abs(endeksDegisim(s, 2023, 1, 2024, 1)!.oran - (1.02 ** 12 - 1)) < 1e-12);
  // Sabit aylık %2'de 12 aylık ortalama değişim de 1,02¹² − 1
  assert.ok(Math.abs(onikiAylikOrtalamaDegisim(s, 2025, 12)! - (1.02 ** 12 - 1)) < 1e-12);
  assert.equal(onikiAylikOrtalamaDegisim(s, 2024, 6), null); // 24 ay veri yok
  assert.equal(endeksDegisim(s, 2020, 1, 2024, 1), null);
});

test('IBAN: MOD-97, TR uzunluğu, 5 haneli banka kodu', () => {
  const w = ibanDogrula('TR33 0006 1005 1978 6457 8413 26');
  assert.equal(w.gecerli, true);
  assert.equal(w.bankaKodu, '0061');
  const kontrol = (govde: string) => {
    let m = 0;
    for (const ch of `${govde}TR00`) for (const d of ch >= 'A' ? String(ch.charCodeAt(0) - 55) : ch) m = (m * 10 + Number(d)) % 97;
    return String(98 - m).padStart(2, '0');
  };
  const govde = '0006400000011234567890'; // İş Bankası (00064) + rezerv 0 + 16 hane hesap
  const iban = `TR${kontrol(govde)}${govde}`;
  const r = ibanDogrula(iban);
  assert.equal(r.gecerli, true);
  assert.equal(r.banka, 'Türkiye İş Bankası');
  assert.equal(ibanDogrula(iban.slice(0, 25)).gecerli, false);
  assert.equal(ibanDogrula(iban.replace(/.$/, (c) => String((Number(c) + 1) % 10))).gecerli, false);
});

test('altın has içeriği', () => {
  assert.equal(round2(hasIcerik('gram24', 10)), 10);
  assert.equal(round2(hasIcerik('ceyrek', 1) * 1000) / 1000, round2((1.754 * 0.916) / 0.995 * 1000) / 1000);
});
