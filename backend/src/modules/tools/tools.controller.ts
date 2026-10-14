import { Throttle } from '@nestjs/throttler';
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ToolsService } from './tools.service';
import { Public, Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Tools')
@Controller('tools')
export class ToolsController {
  constructor(private readonly toolsService: ToolsService) {}

  @Public()
  @Throttle({ default: { limit: 600, ttl: 60000 } })
  @Get()
  findAll(@Query('active') active?: string) {
    if (active === 'true') return this.toolsService.findActive();
    return this.toolsService.findAll();
  }

  @Public()
  @Throttle({ default: { limit: 600, ttl: 60000 } })
  @Get(':slug')
  async findBySlug(@Param('slug') slug: string) {
    const tool = await this.toolsService.findBySlug(slug);
    if (!tool) throw new NotFoundException('Araç bulunamadı');
    return tool;
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() body: { slug: string; title: string; category?: string; description?: string }) {
    return this.toolsService.create(body as any);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('sync')
  sync(@Body() body: { items: { slug: string; title: string; category?: string }[] }) {
    return this.toolsService.sync(body.items);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { isActive?: boolean; sortOrder?: number },
  ) {
    return this.toolsService.update(id, body);
  }
}
