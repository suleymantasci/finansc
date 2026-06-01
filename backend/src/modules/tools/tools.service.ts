import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tool } from './entities/tool.entity';

@Injectable()
export class ToolsService {
  constructor(
    @InjectRepository(Tool)
    private readonly toolRepo: Repository<Tool>,
  ) {}

  async findAll() {
    return this.toolRepo.find({ order: { sortOrder: 'ASC', title: 'ASC' } });
  }

  async findActive() {
    return this.toolRepo.find({ where: { isActive: true }, order: { sortOrder: 'ASC', title: 'ASC' } });
  }

  async findBySlug(slug: string) {
    return this.toolRepo.findOne({ where: { slug } });
  }

  async update(id: string, data: Partial<Pick<Tool, 'isActive'>>) {
    const tool = await this.toolRepo.findOne({ where: { id } });
    if (!tool) throw new NotFoundException('Araç bulunamadı');
    Object.assign(tool, data);
    return this.toolRepo.save(tool);
  }
}
