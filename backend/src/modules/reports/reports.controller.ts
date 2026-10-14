import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { Public, Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';
import { UserRole } from '../users/entities/user.entity';
import { ReportType, ReportStatus } from './entities/report.entity';
import { Throttle } from '@nestjs/throttler';
import { CreateReportDto, UpdateReportStatusDto } from './dto/create-report.dto';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Public()
  @Throttle({ default: { limit: 3, ttl: 300000 } })
  @Post()
  create(
    @Body()
    body: CreateReportDto,
  ) {
    if (!body.type || !body.slug || !body.pageTitle) {
      throw new BadRequestException('type, slug ve pageTitle zorunludur');
    }
    if (!Object.values(ReportType).includes(body.type as ReportType)) {
      throw new BadRequestException('Geçersiz type değeri');
    }
    return this.reportsService.create({
      type: body.type as ReportType,
      slug: body.slug,
      pageTitle: body.pageTitle,
      message: body.message || null,
    });
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  findAll() {
    return this.reportsService.findAll();
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateReportStatusDto,
  ) {
    if (!Object.values(ReportStatus).includes(body.status as ReportStatus)) {
      throw new BadRequestException('Geçersiz status değeri');
    }
    return this.reportsService.updateStatus(id, body.status as ReportStatus);
  }
}
