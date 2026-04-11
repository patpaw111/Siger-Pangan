import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index, Unique } from 'typeorm';

@Entity('price_records')
@Unique(['commodityBiId', 'marketTypeId', 'regionBiId', 'priceDate', 'priceType'])
export class PriceRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Identifikasi Komoditas
  @Column({ name: 'commodity_bi_id', length: 20 }) // com_1 ~ com_21
  @Index()
  commodityBiId: string;

  @Column({ name: 'commodity_name', length: 200 })
  commodityName: string;

  @Column({ name: 'category_bi_id', length: 20 }) // cat_1 ~ cat_10
  categoryBiId: string;

  @Column({ name: 'category_name', length: 150 })
  categoryName: string;

  @Column({ name: 'denomination', length: 20, default: 'kg' })
  denomination: string;

  // Lokasi
  @Column({ name: 'region_bi_id', type: 'int', nullable: true })
  @Index()
  regionBiId: number | null; // ID dari BI API (kabupaten)

  @Column({ name: 'region_name', length: 150, nullable: true })
  regionName: string | null;

  @Column({ name: 'province_bi_id', type: 'int', default: 10 })
  provinceBiId: number; // 10 = Lampung

  // Jenis Pasar
  @Column({ name: 'market_type_id', type: 'int' })
  marketTypeId: number; // 1=Tradisional, 2=Modern, 3=Pedagang Besar

  @Column({ name: 'market_type_name', length: 50 })
  marketTypeName: string;

  // Harga
  @Column({ name: 'price', type: 'decimal', precision: 14, scale: 2, nullable: true })
  price: number | null;

  @Column({ name: 'price_type', length: 30, default: 'harga' })
  priceType: string; // 'harga', 'harga_tertinggi', 'harga_terendah', 'harga_rata_rata'

  // Tanggal
  @Column({ name: 'price_date', type: 'date' })
  @Index()
  priceDate: Date;

  // Metadata
  @Column({ name: 'source', length: 100, default: 'BI Harga Pangan' })
  source: string;

  @Column({ name: 'is_validated', default: false })
  isValidated: boolean;

  @CreateDateColumn({ name: 'scraped_at' })
  scrapedAt: Date;
}
