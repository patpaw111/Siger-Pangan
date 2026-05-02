import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Region } from './entities/region.entity';
import { CreateRegionDto, UpdateRegionDto } from './dto/region.dto';

@Injectable()
export class RegionsService {
  constructor(
    @InjectRepository(Region)
    private readonly regionRepository: Repository<Region>,
  ) {}

  async findAll(): Promise<Region[]> {
    return this.regionRepository.find({ order: { type: 'ASC', name: 'ASC' } });
  }

  async findOne(id: string): Promise<Region> {
    const region = await this.regionRepository.findOne({ where: { id } });
    if (!region) {
      throw new NotFoundException(`Wilayah dengan ID ${id} tidak ditemukan`);
    }
    return region;
  }

  async create(createRegionDto: CreateRegionDto): Promise<Region> {
    const newRegion = this.regionRepository.create(createRegionDto);
    return this.regionRepository.save(newRegion);
  }

  async update(id: string, updateRegionDto: UpdateRegionDto): Promise<Region> {
    const region = await this.findOne(id);
    const updated = Object.assign(region, updateRegionDto);
    return this.regionRepository.save(updated);
  }

  async remove(id: string): Promise<void> {
    const region = await this.findOne(id);
    await this.regionRepository.remove(region);
  }
}
