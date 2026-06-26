// ── Gold ─────────────────────────────────────────
export interface GoldPrice {
  source: string;
  goldType: string;
  buyPrice: number;
  sellPrice: number;
  change: number | null;
  changePercent: number | null;
  timestamp: string;
}

// ── Currency ─────────────────────────────────────
export interface Currency {
  name: string;
  buyPrice: number;
  sellPrice: number;
  changePercent: number | null;
  time: string;
  timestamp: string;
}

export interface CrossRate {
  code: string;
  name: string;
  lastPrice: number;
  buyPrice: number;
  sellPrice: number;
  changePercent: number | null;
  time: string;
  timestamp: string;
}

// ── Stock ────────────────────────────────────────
export interface Stock {
  symbol: string;
  name: string;
  lastPrice: number;
  buyPrice: number;
  sellPrice: number;
  low: number;
  high: number;
  change: number | null;
  changePercent: number | null;
  volume: number;
  turnover: number;
  time: string;
  indices: string[];
  [key: string]: unknown;
}

// ── Index ────────────────────────────────────────
export interface MarketIndex {
  symbol: string;
  name: string;
  value: number;
  change: number | null;
  changePercent: number | null;
  low: number;
  high: number;
  time: string;
  [key: string]: unknown;
}

// ── Auth ─────────────────────────────────────────
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin';
  birthDate?: string | null;
  phone?: string | null;
  city?: string | null;
  gender?: string | null;
  themePref?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

// ── Blog ─────────────────────────────────────────
export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  thumbnailUrl: string | null;
  category: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  status: 'draft' | 'published';
  isFeatured: boolean;
  authorId: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Tool ─────────────────────────────────────────
export interface Tool {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  icon: string | null;
  isActive: boolean;
  sortOrder: number;
}

// ── Favorite ─────────────────────────────────────
export interface Favorite {
  id: string;
  userId: string;
  type: 'stock' | 'gold';
  symbol: string;
  createdAt: string;
}

// ── Ad Slot ──────────────────────────────────────
export interface AdSlotConfig {
  id: string;
  page: string;
  position: string;
  slotIndex: number;
  adsenseUnit: string | null;
  isActive: boolean;
}

// ── API Response ─────────────────────────────────
export interface ApiError {
  statusCode: number;
  message: string | string[];
  timestamp: string;
  path: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
