import type { MetadataRoute } from 'next';

// robots.txt — iki user-agent'ta aynı disallow listesi tutarlı olmalı.
// Önceki sürümde Googlebot için /giris, /kayit, /sifremi-unuttum
// eksikti (Pit 25 benzeri tutarsızlık). Şimdi her iki kural aynı.
const DISALLOW = ['/admin/', '/hesabim/', '/api/', '/giris', '/kayit', '/sifremi-unuttum'];

// 2026: AI engine'lerden trafik ChatGPT/Perplexity/Claude/Gemini üzerinden geliyor.
// Explicit allow sinyali crawl oranını artırır. llms.txt zaten ayrıca yayınlanacak.
const AI_BOTS = [
  'GPTBot',          // OpenAI — training
  'OAI-SearchBot',   // OpenAI — ChatGPT search results (independent from GPTBot)
  'ChatGPT-User',    // OpenAI — ChatGPT browsing
  'ClaudeBot',       // Anthropic — training
  'Claude-User',     // Anthropic — Claude with browsing
  'PerplexityBot',   // Perplexity — indexer
  'Perplexity-User', // Perplexity — live fetch
  'Google-Extended', // Google — Gemini / AI Overview (separate from Googlebot)
  'Applebot-Extended', // Apple — Apple Intelligence
  'Amazonbot',       // Amazon — Alexa / Rufus
  'CCBot',           // Common Crawl (used by many LLMs for training)
  'Meta-ExternalAgent', // Meta AI
  'DeepSeekBot',     // DeepSeek
  'Bytespider',      // ByteDance — Doubao/TikTok AI
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: DISALLOW,
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: DISALLOW,
      },
      // AI engines — explicit allow so they don't get filtered by default rules
      ...AI_BOTS.map((bot) => ({
        userAgent: bot,
        allow: '/',
        disallow: DISALLOW,
      })),
    ],
    sitemap: 'https://finanscozum.net/sitemap.xml',
    // AI engine index file hint (optional — most engines discover via root)
    host: 'https://finanscozum.net',
  };
}