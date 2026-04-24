import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Commodity } from './entities/commodity.entity';
import { CreateCommodityDto, UpdateCommodityDto } from './dto/commodity.dto';

@Injectable()
export class CommoditiesService {
  constructor(
    @InjectRepository(Commodity)
    private readonly commodityRepository: Repository<Commodity>,
  ) {}

  async findAll(): Promise<Commodity[]> {
    return this.commodityRepository.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<Commodity> {
    const commodity = await this.commodityRepository.findOne({ where: { id } });
    if (!commodity) {
      throw new NotFoundException(`Komoditas dengan ID ${id} tidak ditemukan`);
    }
    return commodity;
  }

  async create(createCommodityDto: CreateCommodityDto): Promise<Commodity> {
    const newCommodity = this.commodityRepository.create(createCommodityDto);
    return this.commodityRepository.save(newCommodity);
  }

  async update(id: string, updateCommodityDto: UpdateCommodityDto): Promise<Commodity> {
    const commodity = await this.findOne(id);
    const updated = Object.assign(commodity, updateCommodityDto);
    return this.commodityRepository.save(updated);
  }

  async remove(id: string): Promise<void> {
    const commodity = await this.findOne(id);
    await this.commodityRepository.remove(commodity);
  }
}
