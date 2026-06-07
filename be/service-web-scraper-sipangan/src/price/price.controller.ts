import { Controller, Get, Query, ParseIntPipe, DefaultValuePipe, Logger } from '@nestjs/common';
import { PriceService } from './price.service';

@Controller('api/v1/sipangan-scraper/prices')
export class PriceController {
  private readonly logger = new Logger(PriceController.name);

  constructor(private readonly priceService: PriceService) {}

  /**
   * GET /api/v1/sipangan-scraper/prices/latest
   * Ambil harga terbaru semua komoditas
   */
  @Get('latest')
  async getLatestPrices(
    @Query('levelHargaId', new DefaultValuePipe(3), ParseIntPipe) levelHargaId: number,
    @Query('kabupaten') kabupaten?: string,
  ) {
    const data = await this.priceService.getLatestPrices({ levelHargaId, kabupaten });
    return { success: true, data, total: data.length };
  }

  /**
   * GET /api/v1/sipangan-scraper/prices/history
   * Ambil histori harga komoditas (untuk tren)
   */
  @Get('history')
  async getPriceHistory(
    @Query('commodityId') commodityId: string,
    @Query('commodityName') commodityName: string,
    @Query('levelHargaId', new DefaultValuePipe(3), ParseIntPipe) levelHargaId: number,
    @Query('kabupaten') kabupaten?: string,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number = 30,
  ) {
    const data = await this.priceService.getPriceHistory({
      commodityId,
      commodityName,
      levelHargaId,
      kabupaten,
      days,
    });
    return { success: true, data, total: data.length };
  }

  /**
   * GET /api/v1/sipangan-scraper/prices/commodities
   * Daftar semua komoditas yang tersedia
   */
  @Get('commodities')
  async getCommodities() {
    const data = await this.priceService.getAvailableCommodities();
    return { success: true, data };
  }

  /**
   * GET /api/v1/sipangan-scraper/prices/regions
   * Daftar kabupaten/kota yang tersedia
   */
  @Get('regions')
  async getRegions() {
    const data = await this.priceService.getAvailableRegions();
    return { success: true, data };
  }
}
