import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Blog, BlogStatus } from './entities/blog.entity';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';

@Injectable()
export class BlogService {
  constructor(
    @InjectRepository(Blog)
    private readonly blogRepo: Repository<Blog>,
  ) {}

  async findAll(limit?: number) {
    const blogs = await this.blogRepo.find({
      order: { createdAt: 'DESC' },
      take: limit || 100,
    });
    return { data: blogs };
  }

  async findBySlug(slug: string) {
    const blog = await this.blogRepo.findOne({ where: { slug } });
    if (!blog) throw new NotFoundException('Blog yazısı bulunamadı');
    return blog;
  }

  async create(dto: CreateBlogDto, authorId: string) {
    const blog = this.blogRepo.create({
      ...dto,
      authorId,
      publishedAt: dto.status === BlogStatus.PUBLISHED ? new Date() : null,
    });
    return this.blogRepo.save(blog);
  }

  async update(id: string, dto: UpdateBlogDto) {
    const blog = await this.blogRepo.findOne({ where: { id } });
    if (!blog) throw new NotFoundException('Blog yazısı bulunamadı');

    if (dto.status === BlogStatus.PUBLISHED && !blog.publishedAt) {
      blog.publishedAt = new Date();
    }

    Object.assign(blog, dto);
    return this.blogRepo.save(blog);
  }

  async remove(id: string) {
    const result = await this.blogRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException('Blog yazısı bulunamadı');
    return { message: 'Blog yazısı silindi' };
  }

  async getTotalViews(): Promise<number> {
    const result = await this.blogRepo
      .createQueryBuilder('blog')
      .select('COALESCE(SUM(blog.viewCount), 0)', 'total')
      .getRawOne();
    return parseInt(result?.total || '0', 10);
  }

  async getCount(): Promise<number> {
    return this.blogRepo.count();
  }
}
