// ── Blog içeriği: sunucu tarafı temizleme + içindekiler ──
// İçerik veritabanından HTML olarak gelir ve dangerouslySetInnerHTML ile basılır.
// Güvenlik: izin listesi dışındaki her şey atılır (script, stil, olay nitelikleri,
// javascript: bağlantıları). Veritabanı analizi (2026-09-24): içerikte tam HTML
// belgesi sarmalayıcısı ve gömülü <script type="application/ld+json"> bulunan
// yazılar vardı; bunlar ayıklanır, metin korunur.

import sanitizeHtml from 'sanitize-html';

export interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

const TR_MAP: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u' };

function slugify(text: string): string {
  return text
    .toLocaleLowerCase('tr-TR')
    .replace(/[çğıöşüâîû]/g, (ch) => TR_MAP[ch] ?? ch)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

const decode = (s: string) =>
  s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');

export function prepareArticle(raw: string): { html: string; toc: TocItem[] } {
  const clean = sanitizeHtml(raw ?? '', {
    allowedTags: [
      'p', 'br', 'hr', 'strong', 'b', 'em', 'i', 'u', 's', 'sup', 'sub', 'small', 'mark', 'span',
      'a', 'ul', 'ol', 'li', 'h2', 'h3', 'h4', 'blockquote', 'q', 'cite',
      'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
      'img', 'figure', 'figcaption', 'code', 'pre', 'dl', 'dt', 'dd', 'div',
    ],
    allowedAttributes: {
      a: ['href', 'title', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height', 'loading', 'decoding'],
      th: ['colspan', 'rowspan', 'scope'],
      td: ['colspan', 'rowspan'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesAppliedToAttributes: ['href', 'src'],
    allowProtocolRelative: false,
    // İçeriği tamamen atılacak etiketler (metinleri de görünmesin)
    nonTextTags: ['script', 'style', 'textarea', 'option', 'noscript', 'title', 'head'],
    transformTags: {
      // Sayfanın tek H1'i başlıktır; içerikteki H1'ler H2 olur
      h1: 'h2',
      a: (tagName, attribs) => {
        const href = attribs.href ?? '';
        const external = /^https?:\/\//i.test(href) && !/^https?:\/\/(www\.)?finanscozum\.net/i.test(href);
        const out: Record<string, string> = { href };
        if (attribs.title) out.title = attribs.title;
        if (external) {
          out.target = '_blank';
          out.rel = 'noopener noreferrer';
        }
        return { tagName, attribs: out };
      },
      img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: 'lazy', decoding: 'async', alt: attribs.alt ?? '' } }),
    },
  });

  // Başlıklara çapa kimliği + içindekiler
  const toc: TocItem[] = [];
  const used = new Map<string, number>();
  let html = clean.replace(/<(h2|h3)>([\s\S]*?)<\/\1>/g, (_m, tag: string, inner: string) => {
    const text = decode(inner.replace(/<[^>]+>/g, '')).trim();
    let id = slugify(text) || 'bolum';
    const n = used.get(id) ?? 0;
    used.set(id, n + 1);
    if (n > 0) id = `${id}-${n + 1}`;
    toc.push({ id, text, level: tag === 'h2' ? 2 : 3 });
    return `<${tag} id="${id}">${inner}</${tag}>`;
  });

  // Tablolar: mobilde yatay kaydırılabilir, klavyeyle odaklanabilir kap
  html = html
    .replace(/<table>/g, '<div class="table-wrap" role="region" aria-label="Tablo" tabindex="0"><table>')
    .replace(/<\/table>/g, '</table></div>');

  return { html, toc };
}
