import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { TOOL_BY_SLUG, TOOL_GROUPS } from '@/lib/tools/catalog';

// Araç linki WhatsApp, X, Facebook, LinkedIn'de paylaşılınca görünen önizleme kartı.
// Türkçe karakterler (ş, ğ, ı, İ, ₺) için Noto Sans gömülür; public/ standalone imaja kopyalanır.

export const alt = 'FinansÇözüm hesaplama aracı';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const fontCache: { bold?: Buffer; regular?: Buffer } = {};
async function fonts() {
  const dir = join(process.cwd(), 'public', 'fonts');
  fontCache.bold ??= await readFile(join(dir, 'NotoSans-Bold.ttf'));
  fontCache.regular ??= await readFile(join(dir, 'NotoSans-Regular.ttf'));
  return fontCache as { bold: Buffer; regular: Buffer };
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = TOOL_BY_SLUG[slug];
  const title = tool ? tool.title.split('|')[0].trim() : 'Hesaplama Araçları';
  const card = tool?.card ?? 'Ücretsiz finansal hesaplama araçları';
  const group = tool ? TOOL_GROUPS.find((g) => g.id === tool.group)?.title ?? '' : '';
  const f = await fonts();

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '64px 72px', background: 'linear-gradient(135deg, #0e1014 0%, #161920 55%, #1f1a10 100%)', color: '#f3efe6', fontFamily: 'Noto Sans' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: '#d4a94f', color: '#14110a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, fontWeight: 700 }}>₺</div>
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: -0.5 }}>FinansÇözüm</div>
          {group && <div style={{ marginLeft: 'auto', fontSize: 22, color: '#d4a94f', border: '2px solid #d4a94f55', borderRadius: 999, padding: '8px 20px' }}>{group}</div>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: title.length > 38 ? 64 : 76, fontWeight: 700, lineHeight: 1.08, letterSpacing: -1.5 }}>{title}</div>
          <div style={{ fontSize: 32, color: '#b9b3a6', lineHeight: 1.3 }}>{card}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 26, color: '#9a958b' }}>
          <div style={{ display: 'flex' }}>Ücretsiz · Üyeliksiz · Anında sonuç</div>
          <div style={{ display: 'flex', color: '#d4a94f', fontWeight: 700 }}>finanscozum.net</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Noto Sans', data: f.regular, weight: 400, style: 'normal' },
        { name: 'Noto Sans', data: f.bold, weight: 700, style: 'normal' },
      ],
    },
  );
}
