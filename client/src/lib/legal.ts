/**
 * Site işletmecisinin (veri sorumlusu / içerik sağlayıcı) tanıtıcı bilgileri.
 * KVKK md.10 aydınlatma yükümlülüğü, 5651 sayılı Kanun md.3 ve 6563 sayılı Kanun md.3 gereği
 * gerçek kişi ise ad-soyad, tüzel kişi ise unvan; açık adres ve iletişim bilgisi yayında olmalıdır.
 *
 * DOLDURULMASI GEREKEN: name ve address boşken sayfalar yalnızca e-posta ile
 * "finanscozum.net işletmecisi" ifadesini gösterir — bu, yükümlülüğü tam karşılamaz.
 * Ayrıntı: docs/hukuk/RAPOR.md
 */
export const LEGAL = {
  /** Gerçek kişi ad-soyad veya şirket unvanı */
  name: '' as string,
  /** Açık posta adresi */
  address: '' as string,
  /** Şirketse MERSİS no / vergi dairesi ve no (isteğe bağlı gösterim) */
  registry: '' as string,
  email: 'info@finanscozum.net',
  /** Kişisel veri başvuruları için (KEP varsa eklenebilir) */
  kvkkEmail: 'info@finanscozum.net',
  /** Sunucu barındırma: sağlayıcı ve ülke (yurt dışına aktarım bilgisi için) */
  hosting: 'Hostinger (sunucu konumu: Almanya)',
} as const;

export const LEGAL_OPERATOR = LEGAL.name || 'finanscozum.net işletmecisi';
