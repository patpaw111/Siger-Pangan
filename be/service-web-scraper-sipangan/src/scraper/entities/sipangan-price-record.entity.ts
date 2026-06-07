import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';

@Entity('sipangan_price_records')
@Unique([
  'commodityId',
  'levelHarga',
  'regionName',
  'priceDate',
])
export class SipanganPriceRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ── Komoditas ────────────────────────────────────────────
  @Column({ name: 'commodity_id', type: 'int' })
  @Index()
  commodityId: number;

  @Column({ name: 'commodity_name', length: 200 })
  commodityName: string;

  // ── Level Harga ──────────────────────────────────────────
  @Column({ name: 'level_harga', type: 'int' })
  @Index()
  levelHarga: number; // 1 = Produsen, 3 = Eceran

  @Column({ name: 'level_harga_name', length: 50 })
  levelHargaName: string;

  // ── Wilayah ──────────────────────────────────────────────
  @Column({ name: 'region_name', length: 200 })
  @Index()
  regionName: string;

  // ── Harga ────────────────────────────────────────────────
  @Column({ name: 'price', type: 'int', nullable: true })
  price: number | null;

  // ── Tanggal ──────────────────────────────────────────────
  @Column({ name: 'price_date', type: 'date' })
  @Index()
  priceDate: Date;

  // ── Metadata ─────────────────────────────────────────────
  @Column({
    name: 'source',
    length: 100,
    default: 'SiPangan Lampung',
  })
  source: string;

  @CreateDateColumn({ name: 'scraped_at' })
  scrapedAt: Date;
}
