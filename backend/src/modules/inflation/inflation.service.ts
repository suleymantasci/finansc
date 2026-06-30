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
  // (burst koruması — aynı anda birden fazla sayfa istek atmasın diye).
  // Her endpoint ayrı cache field kullanır — latest ve all farklı payload döner.
  private tufeAllCache: CacheEntry<unknown> | null = null;
  private tufeLatestCache: CacheEntry<unknown> | null = null;
  private ufeAllCache: CacheEntry<unknown> | null = null;
  private ufeLatestCache: CacheEntry<unknown> | null = null;
  private static readonly CACHE_TTL_MS = 5 * 60 * 1000;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.baseUrl = this.config.get<string>('EXTERNAL_API_BASE_URL')!;
  }

  async getTufeAll(): Promise<unknown> {
    const result = await this.fetchWithCache(
      this.tufeAllCache,
      () => firstValueFrom(this.http.get(`${this.baseUrl}/api/tufe`)),
    );
    this.tufeAllCache = { data: result, ts: Date.now() };
    return result;
  }

  async getTufeLatest(): Promise<unknown> {
    const result = await this.fetchWithCache(
      this.tufeLatestCache,
      () => firstValueFrom(this.http.get(`${this.baseUrl}/api/tufe/latest`)),
    );
    this.tufeLatestCache = { data: result, ts: Date.now() };
    return result;
  }

  async getUfeAll(): Promise<unknown> {
    const result = await this.fetchWithCache(
      this.ufeAllCache,
      () => firstValueFrom(this.http.get(`${this.baseUrl}/api/ufe`)),
    );
    this.ufeAllCache = { data: result, ts: Date.now() };
    return result;
  }

  async getUfeLatest(): Promise<unknown> {
    const result = await this.fetchWithCache(
      this.ufeLatestCache,
      () => firstValueFrom(this.http.get(`${this.baseUrl}/api/ufe/latest`)),
    );
    this.ufeLatestCache = { data: result, ts: Date.now() };
    return result;
  }

  private async fetchWithCache(
    cache: CacheEntry<unknown> | null,
    fetcher: () => Promise<{ data: any }>,
  ): Promise<unknown> {
    const now = Date.now();
    if (cache && now - cache.ts < InflationService.CACHE_TTL_MS) {
      return cache.data;
    }
    try {
      const { data } = await fetcher();
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`upstream fetch failed: ${msg}`);
      if (cache) return cache.data;
      throw err;
    }
  }
}