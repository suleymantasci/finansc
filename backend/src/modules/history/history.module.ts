import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { HistoryService } from './history.service';
import { HistoryController } from './history.controller';

@Module({
  imports: [HttpModule.register({ timeout: 20000 })],
  controllers: [HistoryController],
  providers: [HistoryService],
  exports: [HistoryService],
})
export class HistoryModule {}
