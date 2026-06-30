import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InflationService } from './inflation.service';
import { Public } from '../../common/decorators';

@ApiTags('Inflation')
@Controller('inflation')
export class InflationController {
  constructor(private readonly inflationService: InflationService) {}

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