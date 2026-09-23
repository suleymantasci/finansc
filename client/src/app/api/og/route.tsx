import { ImageResponse } from 'next/og';
import { SITE_NAME } from '@/lib/constants';

// Route segment config — bu endpoint Node.js runtime'da çalışır
export const runtime = 'nodejs';
export const contentType = 'image/png';

// Cache: 1 gün. Hisseler/döviz fiyatı sık değişir ama OG image her istekte
// yeniden oluşturulsun istemiyoruz (sosyal crawler spam riski).
// 24 saat yeterli, fiyat kısmı zaten meta description'da günceldir.
export const revalidate = 86400; // 24 saat (saniye)

/**
 * Dinamik Open Graph image endpoint.
 *
 * URL: /api/og?type=...&title=...&subtitle=...&category=...&url=...
 *
 * type: 'hisse' | 'endeks' | 'doviz' | 'altin' | 'blog' | 'arac' | 'default'
 * title: ana başlık (örn "Türk Hava Yolları (THYAO)")
 * subtitle: alt başlık (örn "Hisse Senedi Fiyatı Bugün")
 * category: badge yazısı (örn "BORSA")
 * url: opsiyonel footer URL (örn "finanscozum.net/borsa/hisseler/THYAO")
 *
 * 1200x630 (Open Graph / Twitter card standardı)
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = (searchParams.get('type') || 'default') as
    | 'hisse' | 'endeks' | 'doviz' | 'altin' | 'emtia' | 'blog' | 'arac' | 'default';
  const title = searchParams.get('title') || SITE_NAME;
  const subtitle = searchParams.get('subtitle') || '';
  const category = (searchParams.get('category') || '').toUpperCase();
  const url = searchParams.get('url') || 'finanscozum.net';

  // Type'a göre kategori badge rengi
  const badgeColors: Record<string, string> = {
    // Marka paleti: altın vurgu, borsa için yükseliş yeşili
    hisse: '#22c38e',
    endeks: '#22c38e',
    doviz: '#d4a94f',
    altin: '#d4a94f',
    emtia: '#d4a94f',
    blog: '#d4a94f',
    arac: '#d4a94f',
    default: '#d4a94f',
  };
  const badgeColor = badgeColors[type] || badgeColors.default;

  // Type'a göre sağ tarafta görsel temsil (icon-style shape, sıfır metin)
  const visual = getVisualForType(type, title);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: 'linear-gradient(135deg, #0a0b0d 0%, #111317 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#ece8df',
          position: 'relative',
        }}
      >
        {/* Sol taraf — metin paneli (55% width) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '660px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: '60px 50px',
            background: 'linear-gradient(180deg, #0a0b0d 0%, #0a0b0d 100%)',
          }}
        >
          {/* Top — brand + category badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Logo dot */}
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: 7,
                background: '#d4a94f',
                marginRight: 4,
              }}
            />
            <div
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: '#ece8df',
                letterSpacing: -0.5,
                marginRight: 20,
              }}
            >
              FinansÇözüm
            </div>
            {category && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: badgeColor,
                  color: '#0a0b0d',
                  padding: '6px 14px',
                  borderRadius: 999,
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: 1.2,
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    background: '#0a0b0d',
                  }}
                />
                {category}
              </div>
            )}
          </div>

          {/* Spacer */}
          <div style={{ display: 'flex', flex: 1 }} />

          {/* Title — ana başlık */}
          <div
            style={{
              display: 'flex',
              fontSize: title.length > 30 ? 44 : 56,
              fontWeight: 800,
              color: '#ece8df',
              lineHeight: 1.1,
              letterSpacing: -1,
              marginBottom: 16,
              maxWidth: 560,
            }}
          >
            {title}
          </div>

          {/* Subtitle */}
          {subtitle && (
            <div
              style={{
                display: 'flex',
                fontSize: 22,
                color: '#9a958b',
                lineHeight: 1.3,
                maxWidth: 560,
                marginBottom: 8,
              }}
            >
              {subtitle}
            </div>
          )}

          {/* Spacer */}
          <div style={{ display: 'flex', flex: 1 }} />

          {/* Footer — domain + url */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 16,
              color: '#64748b',
            }}
          >
            <div
              style={{
                width: 4,
                height: 18,
                background: '#d4a94f',
                borderRadius: 2,
                marginRight: 6,
              }}
            />
            <div style={{ display: 'flex', color: '#ece8df', fontWeight: 600 }}>
              {url}
            </div>
          </div>
        </div>

        {/* Sağ taraf — görsel alan (45% width) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 540,
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #111317 0%, #22252b 100%)',
            borderLeft: '1px solid rgba(245, 158, 11, 0.2)',
          }}
        >
          {visual}
        </div>

        {/* Üst-alt border accents */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: 4,
            background: 'linear-gradient(90deg, #d4a94f 0%, transparent 60%)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: '40%',
            height: 4,
            background: 'linear-gradient(90deg, transparent 0%, #d4a94f 100%)',
            display: 'flex',
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}

/**
 * Type'a göre sağ tarafta gösterilecek görsel temsil.
 * HİÇ METİN İÇERMEZ — sadece geometrik şekiller ile type'ı temsil eder.
 */
function getVisualForType(type: string, title: string) {
  switch (type) {
    case 'hisse':
    case 'endeks':
      return (
        // Çubuk grafik (rising) + yukarı ok
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 12,
            height: 220,
            marginBottom: 40,
          }}
        >
          {[60, 80, 100, 90, 130, 160, 180, 220].map((h, i) => (
            <div
              key={i}
              style={{
                width: 32,
                height: h,
                background: i >= 4 ? '#10b981' : '#475569',
                borderRadius: 4,
                display: 'flex',
              }}
            />
          ))}
        </div>
      );
    case 'doviz':
      return (
        // İki para birimi daireleri (overlap)
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            width: 280,
            height: 280,
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: 200,
              height: 200,
              borderRadius: 100,
              background: '#d4a94f',
              opacity: 0.85,
              display: 'flex',
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: 0,
              width: 180,
              height: 180,
              borderRadius: 90,
              background: '#d4a94f',
              opacity: 0.85,
              display: 'flex',
            }}
          />
        </div>
      );
    case 'emtia':
    case 'altin':
      return (
        // Altın külçe (diamond/hex shape)
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 280,
            height: 280,
            position: 'relative',
          }}
        >
          <div
            style={{
              width: 220,
              height: 220,
              background: 'linear-gradient(135deg, #f0d49a 0%, #d4a94f 50%, #d97706 100%)',
              transform: 'rotate(45deg)',
              borderRadius: 20,
              boxShadow: '0 20px 60px rgba(245, 158, 11, 0.4)',
              display: 'flex',
            }}
          />
        </div>
      );
    case 'blog':
      return (
        // Açık kitap/doküman ikonu
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div
            style={{
              width: 140,
              height: 180,
              background: '#ece8df',
              borderRadius: 4,
              transform: 'rotate(-6deg)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
              display: 'flex',
            }}
          />
          <div
            style={{
              width: 140,
              height: 180,
              background: '#e2e8f0',
              borderRadius: 4,
              transform: 'rotate(6deg)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
              display: 'flex',
            }}
          />
        </div>
      );
    case 'arac':
      return (
        // Hesap makinesi temsil
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            width: 200,
            height: 240,
            background: '#111317',
            borderRadius: 16,
            padding: 16,
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          }}
        >
          <div
            style={{
              width: '100%',
              height: 40,
              background: '#0a0b0d',
              borderRadius: 4,
              display: 'flex',
            }}
          />
          {[0, 1, 2, 3].map((row) => (
            <div key={row} style={{ display: 'flex', gap: 8 }}>
              {[0, 1, 2, 3].map((col) => (
                <div
                  key={col}
                  style={{
                    width: 36,
                    height: 36,
                    background: row === 3 ? '#d4a94f' : '#22252b',
                    borderRadius: 4,
                    display: 'flex',
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      );
    default:
      return (
        // Default — sadece amber gradient bg + logo dot
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 200,
            height: 200,
            borderRadius: 100,
            background: 'linear-gradient(135deg, #f0d49a 0%, #d4a94f 50%, #d97706 100%)',
            boxShadow: '0 30px 80px rgba(245, 158, 11, 0.4)',
          }}
        />
      );
  }
}
