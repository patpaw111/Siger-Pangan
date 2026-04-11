import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { subDays, format } from 'date-fns';
import { PriceRecord } from './entities/price-record.entity';

const CACHE_TTL_SECONDS = 3600; // 1 jam

@Injectable()
export class PriceService {
  private readonly logger = new Logger(PriceService.name);

  constructor(
    @InjectRepository(PriceRecord)
    private readonly priceRepo: Repository<PriceRecord>,
    @InjectRedis()
    private readonly redis: Redis,
  ) {}

  /**
   * Ambil harga terbaru semua komoditas.
   * Redis cache TTL: 1 jam.
   */
  async getLatestPrices(params: {
    marketTypeId: number;
    kabupaten?: string;
  }): Promise<PriceRecord[]> {
    const cacheKey = `prices:latest:m${params.marketTypeId}:${params.kabupaten ?? 'all'}`;

    // Cek cache
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      this.logger.debug(`Cache HIT: ${cacheKey}`);
      return JSON.parse(cached);
    }

    this.logger.debug(`Cache MISS: ${cacheKey}`);

    // Query terbaru per komoditas dari PostgreSQL
    const qb = this.priceRepo
      .createQueryBuilder('p')
      .distinctOn(['p.commodity_bi_id', 'p.region_name'])
      .where('p.market_type_id = :marketTypeId', { marketTypeId: params.marketTypeId })
      .andWhere('p.price IS NOT NULL')
      .orderBy('p.commodity_bi_id')
      .addOrderBy('p.region_name')
      .addOrderBy('p.price_date', 'DESC');

    if (params.kabupaten) {
      qb.andWhere('LOWER(p.region_name) LIKE LOWER(:kabupaten)', {
        kabupaten: `%${params.kabupaten}%`,
      });
    }

    const result = await qb.getMany();

    // Simpan ke cache
    await this.redis.setex(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(result));
    return result;
  }

  /**
   * Ambil histori harga satu komoditas untuk chart.
   */
  async getPriceHistory(params: {
    commodityId?: string;
    commodityName?: string;
    marketTypeId: number;
    kabupaten?: string;
    days: number;
  }): Promise<PriceRecord[]> {
    const cacheKey = `prices:history:${params.commodityId ?? params.commodityName}:m${params.marketTypeId}:${params.kabupaten ?? 'all'}:${params.days}d`;

    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const fromDate = subDays(new Date(), params.days);

    const qb = this.priceRepo
      .createQueryBuilder('p')
      .where('p.market_type_id = :marketTypeId', { marketTypeId: params.marketTypeId })
      .andWhere('p.price_date >= :fromDate', { fromDate })
      .andWhere('p.price IS NOT NULL')
      .orderBy('p.price_date', 'ASC');

    if (params.commodityId) {
      qb.andWhere('p.commodity_bi_id = :id', { id: params.commodityId });
    } else if (params.commodityName) {
      qb.andWhere('LOWER(p.commodity_name) LIKE LOWER(:name)', {
        name: `%${params.commodityName}%`,
      });
    }

    if (params.kabupaten) {
      qb.andWhere('LOWER(p.region_name) LIKE LOWER(:kab)', {
        kab: `%${params.kabupaten}%`,
      });
    }

    const result = await qb.getMany();
    await this.redis.setex(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(result));
    return result;
  }

  /**
   * Bandingkan harga satu komoditas di semua kabupaten pada tanggal tertentu.
   */
  async comparePricesByRegion(params: {
    commodityId: string;
    marketTypeId: number;
    date: Date;
  }): Promise<any[]> {
    const dateStr = format(params.date, 'yyyy-MM-dd');
    const cacheKey = `prices:compare:${params.commodityId}:m${params.marketTypeId}:${dateStr}`;

    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    // Ambil harga dari 7 hari ke belakang (toleransi jika hari ini belum ada data)
    const fromDate = subDays(params.date, 7);

    const result = await this.priceRepo
      .createQueryBuilder('p')
      .select([
        'p.region_name AS "regionName"',
        'p.price AS "price"',
        'p.price_date AS "priceDate"',
        'p.denomination AS "denomination"',
      ])
      .distinctOn(['p.region_name'])
      .where('p.commodity_bi_id = :id', { id: params.commodityId })
      .andWhere('p.market_type_id = :marketTypeId', { marketTypeId: params.marketTypeId })
      .andWhere('p.price_date BETWEEN :fromDate AND :toDate', {
        fromDate,
        toDate: params.date,
      })
      .andWhere('p.price IS NOT NULL')
      .orderBy('p.region_name')
      .addOrderBy('p.price_date', 'DESC')
      .getRawMany();

    await this.redis.setex(cacheKey, 1800, JSON.stringify(result)); // 30 menit
    return result;
  }

  /**
   * Daftar komoditas unik yang ada di database.
   */
  async getAvailableCommodities(): Promise<any[]> {
    const cacheKey = 'prices:meta:commodities';
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const result = await this.priceRepo
      .createQueryBuilder('p')
      .select([
        'p.commodity_bi_id AS id',
        'p.commodity_name AS name',
        'p.category_bi_id AS "categoryId"',
        'p.category_name AS "categoryName"',
        'p.denomination AS denomination',
      ])
      .distinctOn(['p.commodity_bi_id'])
      .orderBy('p.commodity_bi_id')
      .getRawMany();

    await this.redis.setex(cacheKey, 86400, JSON.stringify(result)); // 24 jam
    return result;
  }

  /**
   * Daftar kabupaten/kota unik yang ada di database.
   */
  async getAvailableRegions(): Promise<string[]> {
    const cacheKey = 'prices:meta:regions';
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const result = await this.priceRepo
      .createQueryBuilder('p')
      .select('DISTINCT p.region_name AS name')
      .where('p.region_name IS NOT NULL')
      .orderBy('p.region_name')
      .getRawMany();

    const regions = result.map((r) => r.name).filter(Boolean);
    await this.redis.setex(cacheKey, 86400, JSON.stringify(regions));
    return regions;
  }

  /**
   * Invalidasi semua cache harga (dipanggil setelah scraping selesai).
   */
  async invalidatePriceCache(): Promise<void> {
    const keys = await this.redis.keys('prices:*');
    if (keys.length > 0) {
      await this.redis.del(...keys);
      this.logger.log(`♻️ Cache diinvalidasi: ${keys.length} key dihapus`);
    }
  }
}
