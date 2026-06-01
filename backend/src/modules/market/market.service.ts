import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { ReplaySubject, Observable } from 'rxjs';
import { EventSource } from 'eventsource';

@Injectable()
export class MarketService implements OnModuleInit {
  private readonly logger = new Logger(MarketService.name);
  private readonly baseUrl: string;

  // SSE fan-out — ReplaySubject(1) caches last message for instant delivery to new subscribers
  private readonly goldStreams = new Map<string, { subject: ReplaySubject<MessageEvent>; active: boolean }>();
  private readonly borsaSubject = new ReplaySubject<MessageEvent>(1);
  private borsaSSEActive = false;
  private readonly currencyStreams = new Map<string, { subject: ReplaySubject<MessageEvent>; active: boolean }>();

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.baseUrl = this.config.get<string>('EXTERNAL_API_BASE_URL')!;
  }

  onModuleInit() {
    // Start upstream SSE connections eagerly so data is cached before the first client connects
    this.ensureBorsaSSE();
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

  async getStocks() {
    const { data } = await firstValueFrom(
      this.http.get(`${this.baseUrl}/api/borsa/stocks`),
    );
    // API returns { success, data: [...] }
    if (data?.data && Array.isArray(data.data)) return data.data;
    if (Array.isArray(data)) return data;
    return [];
  }

  async getIndices() {
    const { data } = await firstValueFrom(
      this.http.get(`${this.baseUrl}/api/borsa/indices`),
    );
    // API returns { success, data: { xu100: {...}, xu030: {...}, ... } }
    if (data?.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
      return Object.values(data.data);
    }
    if (Array.isArray(data)) return data;
    return [];
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
