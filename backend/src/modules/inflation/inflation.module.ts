import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { InflationController } from './inflation.controller';
import { InflationService } from './inflation.service';

@Module({
  imports: [HttpModule.register({ timeout: 12000 })],
  controllers: [InflationController],
  providers: [InflationService],
  exports: [InflationService],
})
export class InflationModule {}