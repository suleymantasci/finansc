import {
  Controller,
  Get,
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
  @Get()
  findAll(@Query('active') active?: string) {
    if (active === 'true') return this.toolsService.findActive();
    return this.toolsService.findAll();
  }

  @Public()
  @Get(':slug')
  async findBySlug(@Param('slug') slug: string) {
    const tool = await this.toolsService.findBySlug(slug);
    if (!tool) throw new NotFoundException('Araç bulunamadı');
    return tool;
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { isActive: boolean },
  ) {
    return this.toolsService.update(id, { isActive: body.isActive });
  }
}
