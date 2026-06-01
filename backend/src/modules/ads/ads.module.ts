import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdsService } from './ads.service';
import { AdsController } from './ads.controller';
import { AdSlot } from './entities/ad-slot.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AdSlot])],
  controllers: [AdsController],
  providers: [AdsService],
})
export class AdsModule {}
