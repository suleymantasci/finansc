import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { ReplaySubject, Observable } from 'rxjs';
import { EventSource } from 'eventsource';
import type { BorsaStock, BorsaIndex } from './market.types';
import { BORSA_ENABLED } from '../../common/borsa';

interface CacheEntry<T> {
  data: T;
  ts: number;
}

@Injectable()
export class MarketService implements OnModuleInit {
  private readonly logger = new Logger(MarketService.name);
  private readonly baseUrl: string;

  // SSE fan-out — ReplaySubject(1) caches last message for instant delivery to new subscribers
  private readonly goldStreams = new Map<string, { subject: ReplaySubject<MessageEvent>; active: boolean }>();
  private readonly borsaSubject = new ReplaySubject<MessageEvent>(1);
  private borsaSSEActive = false;
  private readonly currencyStreams = new Map<string, { subject: ReplaySubject<MessageEvent>; active: boolean }>();

  // Stocks + indices cache (search ve statik listeler için).
  // 5dk TTL — upstream verisi 15dk gecikmeli, daha sik gerekmez.
  private stocksCache: CacheEntry<BorsaStock[]> | null = null;
  private indicesCache: CacheEntry<BorsaIndex[]> | null = null;
  private static readonly CACHE_TTL_MS = 5 * 60 * 1000;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.baseUrl = this.config.get<string>('EXTERNAL_API_BASE_URL')!;
  }

  onModuleInit() {
    // Start upstream SSE connections eagerly so data is cached before the first client connects
    if (BORSA_ENABLED) this.ensureBorsaSSE();
    this.ensureGoldSSEForSource('harem');
    this.ensureCurrencySSE('serbest-piyasa');
    this.ensureCurrencySSE('merkez-bankasi');
  }

  async getGoldPrices() {
    const { data } = await firstValueFrom(
      this.http.get(`${this.baseUrl}/api/gold/prices`),
    );
    // API returns { success, prices: { harem: [...], altinkaynak: [...], ... } }
    if (data?.prices && typeof data.prices === 'object' && !Array.isArray(data.prices)) {
      return Object.values(data.prices).flat();
    }
    // Fallback: already an array
    if (Array.isArray(data)) return data;
    return [];
  }

  /** Döviz kurları (REST anlık görüntü) — sunucu tarafı render (SSR/ISR) için; canlı güncelleme SSE'den. */
  async getCurrencies(source: 'serbest-piyasa' | 'merkez-bankasi') {
    const { data } = await firstValueFrom(this.http.get(`${this.baseUrl}/api/currency/${source}`, { timeout: 10000 }));
    const list = data?.data?.currencies ?? data?.data ?? data;
    return Array.isArray(list) ? list : [];
  }

  async getStocks() {
    return this.fetchStocksWithCache();
  }

  async getIndices() {
    return this.fetchIndicesWithCache();
  }

  async searchStocks(query?: string): Promise<BorsaStock[]> {
    const all = await this.fetchStocksWithCache();
    if (!query || query.trim().length < 1) return all.slice(0, 50);
    const q = query.toLocaleLowerCase('tr-TR').trim();
    return all
      .filter(
        (s) =>
          s.symbol.toLocaleLowerCase('tr-TR').includes(q) ||
          s.name.toLocaleLowerCase('tr-TR').includes(q),
      )
      .slice(0, 20);
  }

  async searchIndices(query?: string): Promise<BorsaIndex[]> {
    const all = await this.fetchIndicesWithCache();
    if (!query || query.trim().length < 1) return all.slice(0, 50);
    const q = query.toLocaleLowerCase('tr-TR').trim();
    return all
      .filter(
        (i) =>
          i.symbol.toLocaleLowerCase('tr-TR').includes(q) ||
          i.name.toLocaleLowerCase('tr-TR').includes(q),
      )
      .slice(0, 20);
  }

  private async fetchStocksWithCache(): Promise<BorsaStock[]> {
    const now = Date.now();
    if (this.stocksCache && now - this.stocksCache.ts < MarketService.CACHE_TTL_MS) {
      return this.stocksCache.data;
    }
    try {
      const { data } = await firstValueFrom(
        this.http.get(`${this.baseUrl}/api/borsa/stocks`),
      );
      // API returns { success, data: [...] } veya direkt [...]
      const arr: BorsaStock[] = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
        ? data
        : [];
      this.stocksCache = { data: arr, ts: now };
      this.logger.log(`Cached ${arr.length} stocks`);
      return arr;
    } catch (err) {
      this.logger.warn('Stocks fetch failed, returning stale cache');
      return this.stocksCache?.data ?? [];
    }
  }

  private async fetchIndicesWithCache(): Promise<BorsaIndex[]> {
    const now = Date.now();
    if (this.indicesCache && now - this.indicesCache.ts < MarketService.CACHE_TTL_MS) {
      return this.indicesCache.data;
    }
    try {
      const { data } = await firstValueFrom(
        this.http.get(`${this.baseUrl}/api/borsa/indices`),
      );
      const obj = data?.data;
      const arr: BorsaIndex[] =
        obj && typeof obj === 'object' && !Array.isArray(obj)
          ? Object.values(obj)
          : Array.isArray(obj)
          ? obj
          : [];
      this.indicesCache = { data: arr, ts: now };
      this.logger.log(`Cached ${arr.length} indices`);
      return arr;
    } catch (err) {
      this.logger.warn('Indices fetch failed, returning stale cache');
      return this.indicesCache?.data ?? [];
    }
  }

  getGoldStream(): Observable<MessageEvent> {
    return this.getGoldStreamBySource('harem');
  }

  getGoldStreamBySource(source: string): Observable<MessageEvent> {
    this.ensureGoldSSEForSource(source);
    return this.goldStreams.get(source)!.subject.asObservable();
  }

  getBorsaStream(): Observable<MessageEvent> {
    this.ensureBorsaSSE();
    return this.borsaSubject.asObservable();
  }

  getCurrencyStream(source: string): Observable<MessageEvent> {
    this.ensureCurrencySSE(source);
    return this.currencyStreams.get(source)!.subject.asObservable();
  }

  private ensureGoldSSEForSource(source: string) {
    if (!this.goldStreams.has(source)) {
      this.goldStreams.set(source, { subject: new ReplaySubject<MessageEvent>(1), active: false });
    }
    const entry = this.goldStreams.get(source)!;
    if (entry.active) return;
    entry.active = true;

    const url = `${this.baseUrl}/api/gold/${source}/stream`;
    this.logger.log(`Connecting to gold SSE: ${url}`);
    const es = new EventSource(url);

    es.onmessage = (event) => {
      entry.subject.next(event as any);
    };

    es.onerror = () => {
      this.logger.warn(`Gold SSE (${source}) connection error, reconnecting...`);
      entry.active = false;
      es.close();
      setTimeout(() => this.ensureGoldSSEForSource(source), 5000);
    };
  }

  private ensureBorsaSSE() {
    if (this.borsaSSEActive) return;
    this.borsaSSEActive = true;

    const es = new EventSource(`${this.baseUrl}/api/borsa/stream`);

    es.onmessage = (event) => {
      this.borsaSubject.next(event as any);
    };

    es.onerror = () => {
      this.logger.warn('Borsa SSE connection error, reconnecting...');
      this.borsaSSEActive = false;
      es.close();
      setTimeout(() => this.ensureBorsaSSE(), 5000);
    };
  }

  private ensureCurrencySSE(source: string) {
    if (!this.currencyStreams.has(source)) {
      this.currencyStreams.set(source, { subject: new ReplaySubject<MessageEvent>(1), active: false });
    }
    const entry = this.currencyStreams.get(source)!;
    if (entry.active) return;
    entry.active = true;

    const url = `${this.baseUrl}/api/currency/${source}/stream`;
    this.logger.log(`Connecting to currency SSE: ${url}`);
    const es = new EventSource(url);

    es.onmessage = (event) => {
      entry.subject.next(event as any);
    };

    es.onerror = () => {
      this.logger.warn(`Currency SSE (${source}) connection error, reconnecting...`);
      entry.active = false;
      es.close();
      setTimeout(() => this.ensureCurrencySSE(source), 5000);
    };
  }
}
