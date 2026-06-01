import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report, ReportStatus } from './entities/report.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepo: Repository<Report>,
  ) {}

  async create(data: Pick<Report, 'type' | 'slug' | 'pageTitle' | 'message'>) {
    const report = this.reportRepo.create(data);
    return this.reportRepo.save(report);
  }

  async findAll() {
    return this.reportRepo.find({ order: { createdAt: 'DESC' } });
  }

  async updateStatus(id: string, status: ReportStatus) {
    const report = await this.reportRepo.findOne({ where: { id } });
    if (!report) return null;
    report.status = status;
    return this.reportRepo.save(report);
  }
}
