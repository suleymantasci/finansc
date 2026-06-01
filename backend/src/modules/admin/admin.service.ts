import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { BlogService } from '../blog/blog.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly blogService: BlogService,
  ) {}

  async getStats() {
    const totalUsers = await this.userRepo.count();
    const totalPosts = await this.blogService.getCount();
    const totalViews = await this.blogService.getTotalViews();

    // Users active today (created or updated today)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const activeToday = await this.userRepo.count({
      where: { updatedAt: MoreThanOrEqual(todayStart) },
    });

    return { totalUsers, totalPosts, totalViews, activeToday };
  }

  async getUsers() {
    const users = await this.userRepo.find({
      order: { createdAt: 'DESC' },
    });
    return {
      data: users.map((u) => ({
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt,
      })),
    };
  }
}
