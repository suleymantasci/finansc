// Türkçe sayı biçimlendirme (sonuç kartları ve paylaşım metni için).
// Intl nesneleri bir kez kurulur; her çağrıda yeniden oluşturmak hesap sırasında pahalı.

const nf = new Map<string, Intl.NumberFormat>();
function fmt(min: number, max: number): Intl.NumberFormat {
  const k = `${min}:${max}`;
  let f = nf.get(k);
  if (!f) {
    f = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: min, maximumFractionDigits: max });
    nf.set(k, f);
  }
  return f;
}

/** 1234567.8 → '1.234.567,80 ₺' */
export function tl(n: number): string {
  if (!Number.isFinite(n)) return '—';
  return `${fmt(2, 2).format(n)} ₺`;
}

/** Oran (ondalık, 0.175) → '%17,5' */
export function pct(ratio: number, decimals = 2): string {
  if (!Number.isFinite(ratio)) return '—';
  return `%${fmt(0, decimals).format(ratio * 100)}`;
}

/** Yüzde değeri zaten ×100 ise (17.5) → '%17,5' */
export function pctv(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return '—';
  return `%${fmt(0, decimals).format(value)}`;
}

export function num(n: number, decimals = 2, minDecimals = 0): string {
  if (!Number.isFinite(n)) return '—';
  return fmt(minDecimals, decimals).format(n);
}

export function int(n: number): string {
  if (!Number.isFinite(n)) return '—';
  return fmt(0, 0).format(Math.round(n));
}

/** Yıl kesrini '7 yıl 3 ay' biçimine çevirir */
export function yilAy(years: number): string {
  if (!Number.isFinite(years)) return '—';
  let y = Math.floor(years);
  let m = Math.round((years - y) * 12);
  if (m === 12) { y += 1; m = 0; }
  if (y === 0) return `${m} ay`;
  return m ? `${y} yıl ${m} ay` : `${y} yıl`;
}
