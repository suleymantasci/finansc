import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Tool, ToolCategory } from './entities/tool.entity';

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

  async update(id: string, data: Partial<Pick<Tool, 'isActive' | 'sortOrder'>>) {
    const tool = await this.toolRepo.findOne({ where: { id } });
    if (!tool) throw new NotFoundException('Araç bulunamadı');
    Object.assign(tool, data);
    return this.toolRepo.save(tool);
  }

  async create(data: { slug: string; title: string; category?: ToolCategory; description?: string }) {
    const existing = await this.toolRepo.findOne({ where: { slug: data.slug } });
    if (existing) return existing;
    const tool = this.toolRepo.create({
      slug: data.slug,
      title: data.title,
      category: data.category ?? ToolCategory.DIGER,
      description: data.description ?? null,
      isActive: true,
    });
    return this.toolRepo.save(tool);
  }

  /** Frontend'deki slug listesini DB ile senkronize et. Eksikleri ekler, mevcutları değiştirmez. */
  async sync(items: { slug: string; title: string; category?: string }[]) {
    if (!items.length) return { created: 0, existing: 0 };

    const slugs = items.map((i) => i.slug);
    const existing = await this.toolRepo.find({ where: { slug: In(slugs) } });
    const existingSlugs = new Set(existing.map((t) => t.slug));

    const toCreate = items
      .filter((i) => !existingSlugs.has(i.slug))
      .map((i) =>
        this.toolRepo.create({
          slug: i.slug,
          title: i.title,
          category: (i.category as ToolCategory) ?? ToolCategory.DIGER,
          isActive: true,
        }),
      );

    if (toCreate.length > 0) {
      await this.toolRepo.save(toCreate);
    }

    return { created: toCreate.length, existing: existing.length };
  }
}
