import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdSlot } from './entities/ad-slot.entity';

@Injectable()
export class AdsService {
  constructor(
    @InjectRepository(AdSlot)
    private readonly adSlotRepo: Repository<AdSlot>,
  ) {}

  async findAll() {
    return this.adSlotRepo.find({ order: { page: 'ASC', position: 'ASC', slotIndex: 'ASC' } });
  }

  async create(data: Partial<AdSlot>) {
    const slot = this.adSlotRepo.create(data);
    return this.adSlotRepo.save(slot);
  }

  async update(id: string, data: Partial<Pick<AdSlot, 'isActive'>>) {
    const slot = await this.adSlotRepo.findOne({ where: { id } });
    if (!slot) throw new NotFoundException('Reklam slotu bulunamadı');
    Object.assign(slot, data);
    return this.adSlotRepo.save(slot);
  }

  async remove(id: string) {
    const result = await this.adSlotRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException('Reklam slotu bulunamadı');
    return { message: 'Reklam slotu silindi' };
  }
}
