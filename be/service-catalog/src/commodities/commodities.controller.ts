import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CommoditiesService } from './commodities.service';
import { CreateCommodityDto, UpdateCommodityDto } from './dto/commodity.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles.enum';

@Controller('api/v1/catalog/commodities')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommoditiesController {
  constructor(private readonly commoditiesService: CommoditiesService) {}

  @Get()
  // Semua user login (termasuk USER biasa) bisa melihat daftar komoditas
  findAll() {
    return this.commoditiesService.findAll();
  }

  @Get(':id')
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
