'use client';

import { ShareBar } from './ShareBar';

interface ShareButtonProps {
  /** Paylaşılacak absolute URL (tıklama anındaki adres yoksa kullanılır) */
  shareUrl: string;
  className?: string;
  /** Eski API uyumluluğu; paylaşım metni sayfa başlığından alınır */
  label?: string;
}

/**
 * Elle yazılmış araçların kullandığı "Sonucu Paylaş" API'si. Artık yalnızca link kopyalamıyor:
 * sistem paylaşım menüsü ve sosyal ağ düğmelerini de gösterir. Araçlar değerleri URL'ye
 * yazdığı için link tıklama anındaki adresten okunur (shareUrl render anında eskiyebilir).
 */
export function ShareButton({ shareUrl, className }: ShareButtonProps) {
  return (
    <ShareBar
      compact
      className={className}
      text="FinansÇözüm hesaplama sonucu"
      getUrl={() => (typeof window !== 'undefined' ? window.location.href : shareUrl)}
    />
  );
}
