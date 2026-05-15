import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CommoditiesService } from './commodities.service';
import { CreateCommodityDto, UpdateCommodityDto } from './dto/commodity.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles.enum';
import { Public } from '../auth/decorators/public.decorator';

// NOTE: Prefix hanya 'commodities' karena Nginx sudah mem-proxy
// /api/v1/catalog/ → service-catalog:3000
// Jika prefix diset ke 'api/v1/catalog/commodities', maka path menjadi double.
@Controller('commodities')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommoditiesController {
  constructor(private readonly commoditiesService: CommoditiesService) {}

  @Get()
  @Public() // Bisa diakses tanpa login — data publik untuk dashboard
  findAll() {
    return this.commoditiesService.findAll();
  }

  @Get(':id')
  @Public() // Bisa diakses tanpa login
  findOne(@Param('id') id: string) {
    return this.commoditiesService.findOne(id);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN)
  create(@Body() createCommodityDto: CreateCommodityDto) {
    return this.commoditiesService.create(createCommodityDto);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() updateCommodityDto: UpdateCommodityDto) {
    return this.commoditiesService.update(id, updateCommodityDto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.commoditiesService.remove(id);
  }
}
