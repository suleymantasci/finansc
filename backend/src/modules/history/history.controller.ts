import { Controller, Get, Param, Query, Sse, BadRequestException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Observable, map } from 'rxjs';
import { HistoryService } from './history.service';
import { Public } from '../../common/decorators';

const KEY_RE = /^[a-zA-Z0-9:_\-.]{2,64}$/;
const INTERVALS = ['1h', '1d', '1w', '1mo', '1y'];

/**
 * Grafik verisi.
 *
 *   GET  /api/history/instruments              → enstrüman listesi
 *   GET  /api/history/:instrument              → seri (snapshot)
 *   GET  /api/history/:instrument/sources      → mevcut kaynaklar
 *   SSE  /api/history/:instrument/stream       → son mum güncellemesi
 */
@ApiTags('History')
@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Public()
  @Get('instruments')
  getInstruments(@Query('kind') kind?: string, @Query('q') q?: string) {
    return this.historyService.getInstruments(kind, q);
  }

  @Public()
  @Get(':instrument')
  getSeries(
    @Param('instrument') instrument: string,
    @Query('interval') interval?: string,
    @Query('range') range?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('source') source?: string,
  ) {
    if (!KEY_RE.test(instrument)) throw new BadRequestException('Geçersiz enstrüman');
    if (interval && !INTERVALS.includes(interval)) {
      throw new BadRequestException(`interval şunlardan biri olmalı: ${INTERVALS.join(', ')}`);
    }
    return this.historyService.getSeries(instrument, { interval, range, from, to, source });
  }

  @Public()
  @Get(':instrument/sources')
  getSources(@Param('instrument') instrument: string) {
    if (!KEY_RE.test(instrument)) throw new BadRequestException('Geçersiz enstrüman');
    return this.historyService.getSources(instrument);
  }

  @Public()
  @Sse(':instrument/stream')
  stream(@Param('instrument') instrument: string): Observable<{ data: string }> {
    if (!KEY_RE.test(instrument)) throw new BadRequestException('Geçersiz enstrüman');
    return this.historyService
      .getStream(instrument)
      .pipe(map((event) => ({ data: (event as unknown as { data: string }).data })));
  }
}
