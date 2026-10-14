import { Throttle } from '@nestjs/throttler';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InflationService } from './inflation.service';
import { Public } from '../../common/decorators';
import { CalculateTufeDto } from './dto/calculate-tufe.dto';

@ApiTags('Inflation')
// SSR/ISR trafiğine izin veren, public kötüye kullanımı sınırlayan istek bütçesi.
@Throttle({ default: { limit: 600, ttl: 60000 } })
@Controller('inflation')
export class InflationController {
  constructor(private readonly inflationService: InflationService) {}

  // ── TÜFE (aylık değişim oranları) ─────────────────────────

  @Public()
  @Get('tufe')
  getTufeAll() {
    return this.inflationService.getTufeAll();
  }

  @Public()
  @Get('tufe/latest')
  getTufeLatest() {
    return this.inflationService.getTufeLatest();
  }

  // ── TÜFE Endeks (2003=100 bazlı tam seri, parasal değer hesabı) ──

  @Public()
  @Get('tufe/endeks')
  getTufeEndeksAll() {
    return this.inflationService.getTufeEndeksAll();
  }

  @Public()
  @Get('tufe/endeks/latest')
  getTufeEndeksLatest() {
    return this.inflationService.getTufeEndeksLatest();
  }

  @Public()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @Post('tufe/endeks/calculate')
  calculateTufe(@Body() dto: CalculateTufeDto) {
    return this.inflationService.calculateTufeEndeks({
      baseYear: dto.baseYear,
      baseMonth: dto.baseMonth,
      targetYear: dto.targetYear,
      targetMonth: dto.targetMonth,
      amount: dto.amount,
    });
  }

  // ── ÜFE (aylık değişim oranları) ──────────────────────────

  @Public()
  @Get('ufe')
  getUfeAll() {
    return this.inflationService.getUfeAll();
  }

  @Public()
  @Get('ufe/latest')
  getUfeLatest() {
    return this.inflationService.getUfeLatest();
  }
}