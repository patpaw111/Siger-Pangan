import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SipanganPriceRecord } from '../scraper/entities/sipangan-price-record.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class PriceService {
  private readonly logger = new Logger(PriceService.name);

  constructor(
    @InjectRepository(SipanganPriceRecord)
    private readonly priceRepo: Repository<SipanganPriceRecord>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * Mengambil harga terbaru dari semua komoditas
   */
  async getLatestPrices(options: {
    levelHargaId?: number;
    kabupaten?: string;
  }): Promise<SipanganPriceRecord[]> {
    const { levelHargaId = 3, kabupaten } = options;
    
    // 1. Cek Cache
    const cacheKey = `sipangan_latest_prices_${levelHargaId}_${kabupaten ?? 'all'}`;
    const cachedData = await this.cacheManager.get<SipanganPriceRecord[]>(cacheKey);
    
    if (cachedData) {
      this.logger.debug(`Cache HIT: ${cacheKey}`);
      return cachedData;
    }
    
    this.logger.debug(`Cache MISS: ${cacheKey}`);

    const qb = this.priceRepo.createQueryBuilder('p')
      .select([
        'p.id',
        'p.commodityId',
        'p.commodityName',
        'p.levelHarga',
        'p.levelHargaName',
        'p.regionName',
        'p.price',
        'p.priceDate',
        'p.source',
        'p.scrapedAt'
      ])
      .distinctOn(['p.commodity_id', 'p.region_name'])
      .where('p.level_harga = :levelHargaId', { levelHargaId });

    if (kabupaten) {
      qb.andWhere('p.region_name ILIKE :kabupaten', { kabupaten: `%${kabupaten}%` });
    }

    qb.orderBy('p.commodity_id', 'ASC')
      .addOrderBy('p.region_name', 'ASC')
      .addOrderBy('p.price_date', 'DESC');

    const records = await qb.getMany();

    // 3. Simpan ke Cache selama 1 jam (3600000 ms)
    await this.cacheManager.set(cacheKey, records, 3600000);

    return records;
  }

  /**
   * Mengambil riwayat harga sebuah komoditas dalam N hari ke belakang
   */
  async getPriceHistory(options: {
    commodityId?: string;
    commodityName?: string;
    levelHargaId?: number;
    kabupaten?: string;
    days?: number;
  }): Promise<SipanganPriceRecord[]> {
    const { commodityId, commodityName, levelHargaId = 3, kabupaten, days = 30 } = options;

    const cacheKey = `sipangan_history_${commodityId ?? 'x'}_${commodityName ?? 'x'}_${levelHargaId}_${kabupaten ?? 'all'}_${days}`;
    const cachedData = await this.cacheManager.get<SipanganPriceRecord[]>(cacheKey);
    
    if (cachedData) {
      this.logger.debug(`Cache HIT: ${cacheKey}`);
      return cachedData;
    }

    const qb = this.priceRepo.createQueryBuilder('p')
      .where('p.level_harga = :levelHargaId', { levelHargaId });

    if (commodityId) {
      qb.andWhere('p.commodity_id = :commodityId', { commodityId: parseInt(commodityId, 10) });
    } else if (commodityName) {
      qb.andWhere('p.commodity_name ILIKE :commodityName', { commodityName: `%${commodityName}%` });
    }

    if (kabupaten) {
      qb.andWhere('p.region_name ILIKE :kabupaten', { kabupaten: `%${kabupaten}%` });
    }

    // Filter tanggal N hari ke belakang
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    qb.andWhere('p.price_date >= :cutoffDate', { cutoffDate });

    qb.orderBy('p.price_date', 'ASC');

    const records = await qb.getMany();
    await this.cacheManager.set(cacheKey, records, 3600000);

    return records;
  }

  /**
   * Mengambil daftar komoditas yang tersedia
   */
  async getAvailableCommodities(): Promise<{ id: number; name: string }[]> {
    const cacheKey = 'sipangan_available_commodities';
    const cachedData = await this.cacheManager.get<any[]>(cacheKey);
    
    if (cachedData) return cachedData;

    const result = await this.priceRepo.createQueryBuilder('p')
      .select('p.commodity_id', 'id')
      .addSelect('p.commodity_name', 'name')
      .distinct(true)
      .orderBy('p.commodity_name', 'ASC')
      .getRawMany();

    await this.cacheManager.set(cacheKey, result, 86400000); // 24 jam
    return result;
  }

  /**
   * Mengambil daftar region/kabupaten yang tersedia
   */
  async getAvailableRegions(): Promise<string[]> {
    const cacheKey = 'sipangan_available_regions';
    const cachedData = await this.cacheManager.get<string[]>(cacheKey);
    
    if (cachedData) return cachedData;

    const result = await this.priceRepo.createQueryBuilder('p')
      .select('p.region_name', 'name')
      .distinct(true)
      .orderBy('p.region_name', 'ASC')
      .getRawMany();

    const mapped = result.map(r => r.name);
    await this.cacheManager.set(cacheKey, mapped, 86400000); // 24 jam
    return mapped;
  }
}
