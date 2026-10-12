import { safeJsonLd } from '@/lib/json-ld';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { API_URL } from '@/lib/constants';
import { prepareArticle } from '@/lib/blog-content';
import { BlogArticle } from './BlogArticle';
import { SITE_NAME, SITE_URL } from '@/lib/constants';
import type { BlogPost } from '@/types';
import type { Metadata } from 'next';
import { fitDescription, fitTitle } from '@/lib/seo-title';

interface Props {
  params: Promise<{ slug: string }>;
}

export const revalidate = 300;

/**
 * Yazıyı getir. Yalnızca API 404 dönerse null (→ 404 sayfası).
 * Hız sınırı, zaman aşımı gibi geçici hatalarda hata fırlatılır: ISR eski sayfayı
 * korur, arama motoru var olan yazıyı "bulunamadı" olarak görmez.
 * React cache: metadata ve sayfa aynı isteği paylaşır.
 */
const getPost = cache(async (slug: string): Promise<BlogPost | null> => {
  const res = await fetch(`${API_URL}/api/blogs/${encodeURIComponent(slug)}`, {
    next: { revalidate: 300, tags: ['blogs'] },
    signal: AbortSignal.timeout(10000),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Blog API ${res.status}`);
  return (await res.json()) as BlogPost;
});

async function fetchPosts(params: Record<string, string>): Promise<BlogPost[]> {
  try {
    const qs = new URLSearchParams({ limit: '4', status: 'published', ...params });
    const res = await fetch(`${API_URL}/api/blogs?${qs}`, { next: { revalidate: 300, tags: ['blogs'] }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: BlogPost[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

/** Aynı kategoriden 3 yazı; kategori az yazılıysa son yazılarla tamamlanır. */
async function getRelated(post: BlogPost): Promise<BlogPost[]> {
  const same = post.category ? await fetchPosts({ category: post.category }) : [];
  let list = same.filter((p) => p.slug !== post.slug);
  if (list.length < 3) {
    const seen = new Set([post.slug, ...list.map((p) => p.slug)]);
    const latest = await fetchPosts({ limit: '6' });
    list = [...list, ...latest.filter((p) => !seen.has(p.slug))];
  }
  return list.slice(0, 3);
}

function extractFAQFromContent(html: string): { question: string; answer: string }[] {
  const faqRegex = /<h[23][^>]*>(.*?\?)<\/h[23]>\s*<p>([\s\S]*?)<\/p>/gi;
  const faqs: { question: string; answer: string }[] = [];
  let match: RegExpExecArray | null;
  while ((match = faqRegex.exec(html)) !== null) {
    const question = match[1].replace(/<[^>]*>/g, '').trim();
    const answer = match[2].replace(/<[^>]*>/g, '').trim();
    if (question && answer) faqs.push({ question, answer });
  }
  return faqs;
}

function estimateReadingTime(html: string): number {
  const text = html.replace(/<[^>]*>/g, '');
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  // Yazı bulunamadı → noindex + canonical yok. Root layout'un global canonical'ı leak etmesin
  if (!post) {
    return {
      title: 'Yazı Bulunamadı',
      robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
    };
  }
  const title = post.seoTitle || post.title;
  const description = fitDescription(post.seoDescription || post.excerpt);
  // OG image stratejisi:
  // 1) Blog API'sinde kendi uploads/ URL varsa → onu kullan (en özgün)
  // 2) Yoksa → /api/og?type=blog endpoint'i branded HTML-rendered PNG üretir
  //    (Unsplash 404 riski yok, kalıcı, mobil uyumlu)
  // 3) Son fallback: og-default.png (root layout'tan)
  const ogImage = post.thumbnailUrl && post.thumbnailUrl.includes('/uploads/')
    ? post.thumbnailUrl
    : `/api/og?type=blog&title=${encodeURIComponent(post.title)}&subtitle=${encodeURIComponent(post.excerpt || post.seoDescription || '')}&category=BLOG&url=${encodeURIComponent(`finanscozum.net/blog/${post.slug}`)}`;

  return {
    title: fitTitle(title).title,
    description,
    keywords: post.seoKeywords ? post.seoKeywords.split(',').map((k) => k.trim()) : undefined,
    alternates: {
      canonical: `${SITE_URL}/blog/${post.slug}`,
    },
    openGraph: {
      type: 'article',
      title,
      description,
      url: `${SITE_URL}/blog/${post.slug}`,
      siteName: SITE_NAME,
      locale: 'tr_TR',
      images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }],
      publishedTime: post.publishedAt || post.createdAt,
      modifiedTime: post.updatedAt,
      section: post.category || 'Finans',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function BlogSlugPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  const relatedPosts = post ? await getRelated(post) : [];

  // Yazı yoksa 404 → Pit 26: 200 + canonical=root → "duplicate of homepage" riskini kapat
  if (!post) notFound();

  const { html, toc } = prepareArticle(post.content);
  const readingTime = estimateReadingTime(html);
  const faqs = extractFAQFromContent(html);

  // NewsArticle JSON-LD (Google News + GEO + AI citation)
  const articleJsonLd = post ? {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt || '',
    image: [post.thumbnailUrl || `${SITE_URL}/og-default.png`],
    datePublished: post.publishedAt || post.createdAt,
    dateModified: post.updatedAt,
    inLanguage: 'tr-TR',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/blog/${post.slug}`,
    },
    author: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
        width: 512,
        height: 512,
      },
    },
    articleSection: post.category || 'Finans',
    wordCount: html.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length,
    timeRequired: `PT${readingTime}M`,
    keywords: post.seoKeywords || post.category,
    isAccessibleForFree: true,
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['h1', '.article-summary'],
    },
    about: [
      { '@type': 'Thing', name: 'Finans' },
      { '@type': 'Thing', name: 'Yatırım' },
      { '@type': 'Thing', name: post.category || 'Piyasalar' },
    ],
  } : null;

  // BreadcrumbList JSON-LD
  const breadcrumbJsonLd = post ? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Bilgi Merkezi', item: `${SITE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: `${SITE_URL}/blog/${post.slug}` },
    ],
  } : null;

  // FAQPage JSON-LD (only if questions found)
  const faqJsonLd = faqs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  } : null;

  return (
    <>
      {articleJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(articleJsonLd) }} />
      )}
      {breadcrumbJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }} />
      )}
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(faqJsonLd) }} />
      )}
      <BlogArticle post={post} html={html} toc={toc} relatedPosts={relatedPosts} readingTime={readingTime} />
    </>
  );
}
