import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ToolsService } from './tools.service';
import { ToolsController } from './tools.controller';
import { Tool } from './entities/tool.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tool])],
  controllers: [ToolsController],
  providers: [ToolsService],
})
export class ToolsModule {}
