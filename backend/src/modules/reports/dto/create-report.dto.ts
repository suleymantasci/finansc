import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ReportType, ReportStatus } from '../entities/report.entity';

export class CreateReportDto {
  @IsEnum(ReportType)
  type!: ReportType;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  slug!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  pageTitle!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  message?: string;
}

export class UpdateReportStatusDto {
  @IsEnum(ReportStatus)
  status!: ReportStatus;
}
