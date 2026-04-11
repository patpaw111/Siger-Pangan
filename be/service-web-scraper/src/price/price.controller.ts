import { Controller, Get, Query, ParseIntPipe, DefaultValuePipe, Logger } from '@nestjs/common';
import { PriceService } from './price.service';

@Controller('prices')
export class PriceController {
  private readonly logger = new Logger(PriceController.name);

  constructor(private readonly priceService: PriceService) {}

  /**
   * GET /api/v1/prices/latest
   * Ambil harga terbaru semua komoditas (untuk dashboard utama Flutter)
   * 
   * Query params:
   * - marketTypeId: 1=Tradisional, 2=Modern, 3=Pedagang Besar (default: 1)
   * - kabupaten: nama kabupaten (optional)
   */
  @Get('latest')
  async getLatestPrices(
    @Query('marketTypeId', new DefaultValuePipe(1), ParseIntPipe) marketTypeId: number,
    @Query('kabupaten') kabupaten?: string,
  ) {
    const data = await this.priceService.getLatestPrices({ marketTypeId, kabupaten });
    return { success: true, data, total: data.length };
  }

  /**
   * GET /api/v1/prices/history
   * Ambil histori harga satu komoditas (untuk chart tren di Flutter)
   * 
   * Query params:
   * - commodityId: 'com_1' ~ 'com_21' ATAU commodityName: 'Beras Kualitas Medium I'
   * - marketTypeId: 1/2/3 (default: 1)
   * - kabupaten: nama kabupaten (optional)
   * - days: berapa hari ke belakang (default: 30)
   */
  @Get('history')
  async getPriceHistory(
    @Query('commodityId') commodityId: string,
    @Query('commodityName') commodityName: string,
    @Query('marketTypeId', new DefaultValuePipe(1), ParseIntPipe) marketTypeId: number,
    @Query('kabupaten') kabupaten?: string,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number = 30,
  ) {
    const data = await this.priceService.getPriceHistory({
      commodityId,
      commodityName,
      marketTypeId,
      kabupaten,
      days,
    });
    return { success: true, data, total: data.length };
  }

  /**
   * GET /api/v1/prices/compare
   * Bandingkan harga satu komoditas antar kabupaten (heat map Flutter)
   * 
   * Query params:
   * - commodityId: 'com_3' (Beras Medium I)
   * - marketTypeId: 1/2/3
   * - date: 'YYYY-MM-DD' (default: hari ini)
   */
  @Get('compare')
  async comparePricesByRegion(
    @Query('commodityId') commodityId: string,
    @Query('marketTypeId', new DefaultValuePipe(1), ParseIntPipe) marketTypeId: number,
    @Query('date') date?: string,
  ) {
    const data = await this.priceService.comparePricesByRegion({
      commodityId,
      marketTypeId,
      date: date ? new Date(date) : new Date(),
    });
    return { success: true, data };
  }

  /**
   * GET /api/v1/prices/commodities
   * Daftar semua komoditas yang tersedia di database
   */
  @Get('commodities')
  async getCommodities() {
    const data = await this.priceService.getAvailableCommodities();
    return { success: true, data };
  }

  /**
   * GET /api/v1/prices/regions
   * Daftar kabupaten/kota yang ada di database
   */
  @Get('regions')
  async getRegions() {
    const data = await this.priceService.getAvailableRegions();
    return { success: true, data };
  }
}
