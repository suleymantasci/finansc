import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

interface CacheEntry<T> {
  data: T;
  ts: number;
}

@Injectable()
export class InflationService {
  private readonly logger = new Logger(InflationService.name);
  private readonly baseUrl: string;

  // Cache: tasci-api zaten 6 saat cache'liyor, biz sadece 5dk koruma yapıyoruz
  // (burst koruması — aynı anda birden fazla sayfa istek atmasın diye)
  private tufeCache: CacheEntry<unknown> | null = null;
  private ufeCache: CacheEntry<unknown> | null = null;
  private static readonly CACHE_TTL_MS = 5 * 60 * 1000;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.baseUrl = this.config.get<string>('EXTERNAL_API_BASE_URL')!;
  }

  async getTufeAll() {
    return this.fetchWithCache('tufe', () =>
      firstValueFrom(this.http.get(`${this.baseUrl}/api/tufe`)),
    );
  }

  async getTufeLatest() {
    return this.fetchWithCache('tufe-latest', () =>
      firstValueFrom(this.http.get(`${this.baseUrl}/api/tufe/latest`)),
    );
  }

  async getUfeAll() {
    return this.fetchWithCache('ufe', () =>
      firstValueFrom(this.http.get(`${this.baseUrl}/api/ufe`)),
    );
  }

  async getUfeLatest() {
    return this.fetchWithCache('ufe-latest', () =>
      firstValueFrom(this.http.get(`${this.baseUrl}/api/ufe/latest`)),
    );
  }

  private async fetchWithCache(
    key: string,
    fetcher: () => Promise<{ data: any }>,
  ) {
    const now = Date.now();
    const cache = key.startsWith('tufe') ? this.tufeCache : this.ufeCache;
    const isLatest = key.endsWith('-latest');

    if (cache && now - cache.ts < InflationService.CACHE_TTL_MS) {
      // latest için cache geçerli, all için de aynı kaynaktan
      return cache.data;
    }

    try {
      const { data } = await fetcher();
      const entry: CacheEntry<unknown> = { data, ts: now };
      if (key.startsWith('tufe')) {
        this.tufeCache = entry;
      } else {
        this.ufeCache = entry;
      }
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`[${key}] upstream fetch failed: ${msg}`);
      // Stale cache varsa onu döndür (mevcut pattern — market.service'ta da var)
      if (cache) return cache.data;
      throw err;
    }
  }
}