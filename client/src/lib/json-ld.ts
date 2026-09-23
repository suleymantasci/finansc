/**
 * JSON-LD'yi <script> içine güvenle yazmak için serileştirir.
 * JSON.stringify "</script>" dizisini kaçırmaz; kullanıcı girdisi (arama sorgusu)
 * veya veritabanı içeriği (blog başlığı) script bloğunu kapatıp XSS'e yol açabilir.
 * <, >, & ve satır ayırıcıları unicode kaçışına çevrilir — JSON anlamı değişmez.
 */
const LS = new RegExp(String.fromCharCode(0x2028), 'g');
const PS = new RegExp(String.fromCharCode(0x2029), 'g');

export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(LS, '\\u2028')
    .replace(PS, '\\u2029');
}
