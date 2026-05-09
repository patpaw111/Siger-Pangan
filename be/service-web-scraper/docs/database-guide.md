# 🗃️ Database Access Guide — Siger Pangan Dev

Panduan lengkap mengakses database PostgreSQL di lingkungan development lokal.

---

## Prasyarat

Pastikan Docker sudah running:

```bash
docker compose -f docker-compose.dev.yml up -d
```

Cek semua container sudah `healthy`:

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

Output yang diharapkan:
```
NAMES                   STATUS            PORTS
siger-adminer-dev       Up X minutes      0.0.0.0:8080->8080/tcp
siger-web-scraper-dev   Up X minutes      0.0.0.0:3000->3000/tcp
siger-postgres-dev      Up X minutes (healthy)  0.0.0.0:5432->5432/tcp
siger-redis-dev         Up X minutes (healthy)  0.0.0.0:6379->6379/tcp
```

---

## 1. 🌐 Adminer (Web GUI — Rekomendasi)

Cara paling mudah tanpa install tools tambahan.

**URL:** http://localhost:8080

### Login
| Field    | Value                |
|----------|----------------------|
| System   | PostgreSQL           |
| Server   | `postgres`           |
| Username | `siger_user`         |
| Password | `siger_dev_password` |
| Database | `siger_pangan_dev`   |

### Fitur yang tersedia:
- **Select data** → lihat isi tabel
- **Show structure** → skema kolom, index, FK
- **SQL command** → jalankan query SQL bebas
- **Export** → export ke SQL / CSV

---

## 2. 🖥️ psql CLI (via Docker)

Akses langsung ke PostgreSQL tanpa install client:

```bash
# Masuk ke psql shell
docker exec -it siger-postgres-dev psql -U siger_user -d siger_pangan_dev

# Atau jalankan query langsung
docker exec siger-postgres-dev psql -U siger_user -d siger_pangan_dev -c "SELECT * FROM price_records LIMIT 5;"
```

### Query berguna:

```sql
-- Lihat semua tabel
\dt

-- Lihat struktur tabel
\d price_records
\d scraper_runs

-- Hitung total records
SELECT COUNT(*) FROM price_records;

-- 10 harga terbaru
SELECT commodity_name, price_date, price, market_type_name
FROM price_records
ORDER BY price_date DESC, commodity_name
LIMIT 10;

-- Harga per komoditas (format Rupiah)
SELECT
  commodity_name,
  category_name,
  TO_CHAR(price, 'Rp FM999,999,999') AS harga,
  price_date
FROM price_records
WHERE price IS NOT NULL
ORDER BY price_date DESC, price DESC
LIMIT 20;

-- Statistik run scraper
SELECT job_id, status, records_inserted, records_updated, duration_ms, started_at
FROM scraper_runs
ORDER BY started_at DESC;
```

---

## 3. 🔌 Database Client (DBeaver / TablePlus / DataGrip)

Gunakan kredensial berikut untuk connect dari aplikasi eksternal:

```
Host:     localhost
Port:     5432
Database: siger_pangan_dev
User:     siger_user
Password: siger_dev_password
SSL:      disable
```

---

## Struktur Database

### Tabel `price_records`

| Kolom              | Tipe         | Keterangan                              |
|--------------------|--------------|-----------------------------------------|
| `id`               | UUID         | Primary key (auto-generated)            |
| `commodity_bi_id`  | VARCHAR(20)  | ID komoditas BI (`com_1` - `com_21`)    |
| `commodity_name`   | VARCHAR(200) | Nama komoditas (e.g. "Beras Kualitas Super I") |
| `category_bi_id`   | VARCHAR(20)  | ID kategori BI (`cat_1` - `cat_10`)     |
| `category_name`    | VARCHAR(150) | Nama kategori (e.g. "Beras", "Daging Sapi") |
| `denomination`     | VARCHAR(20)  | Satuan (`kg`, `liter`, dll.)            |
| `region_bi_id`     | INTEGER NULL | ID kabupaten/kota (null = semua daerah) |
| `region_name`      | VARCHAR(150) | Nama daerah (null = agregat provinsi)   |
| `province_bi_id`   | INTEGER      | ID provinsi (10 = Lampung)              |
| `market_type_id`   | INTEGER      | 1=Tradisional, 2=Modern, 3=Pedagang Besar |
| `market_type_name` | VARCHAR(50)  | Nama jenis pasar                        |
| `price`            | INTEGER NULL | **Harga dalam Rupiah (IDR)** — e.g. `14400` = Rp 14.400 |
| `price_type`       | VARCHAR(30)  | `harga`, `harga_tertinggi`, dll.        |
| `price_date`       | DATE         | Tanggal harga diambil                   |
| `source`           | VARCHAR(100) | Sumber data (`BI Harga Pangan`)         |
| `is_validated`     | BOOLEAN      | Sudah divalidasi manual? (default false)|
| `scraped_at`       | TIMESTAMP    | Waktu data di-scrape                    |

> ⚠️ **Catatan Satuan Harga:**
> Kolom `price` disimpan dalam **Rupiah penuh** (integer). Contoh:
> - `14400` = **Rp 14.400** per kg
> - `135000` = **Rp 135.000** per kg
> - `null` = tidak ada data pada tanggal tersebut (tanda `-` di BI)

### Tabel `scraper_runs`

Mencatat setiap kali scraping dijalankan (log).

| Kolom              | Keterangan                                     |
|--------------------|------------------------------------------------|
| `id`               | UUID                                           |
| `job_id`           | ID job BullMQ                                  |
| `status`           | `running` / `success` / `failed`               |
| `market_type_id`   | Jenis pasar yang di-scrape                     |
| `records_inserted` | Jumlah record baru yang dimasukkan             |
| `records_updated`  | Jumlah record yang diupdate (upsert)           |
| `records_skipped`  | Jumlah record yang dilewati (duplikat)         |
| `date_range_start` | Tanggal mulai scraping                         |
| `date_range_end`   | Tanggal akhir scraping                         |
| `duration_ms`      | Durasi proses dalam milidetik                  |
| `started_at`       | Waktu mulai (auto)                             |
| `completed_at`     | Waktu selesai                                  |
| `error_message`    | Pesan error jika gagal                         |

---

## Trigger Scraping Manual

```bash
# Scrape 10 hari terakhir, semua jenis pasar
curl -X POST http://localhost:3000/api/v1/scraper/trigger \
  -H "Content-Type: application/json" \
  -d '{"startDate":"2026-04-01","endDate":"2026-04-11","marketTypeIds":[1,2,3]}'

# Cek status antrian
curl http://localhost:3000/api/v1/scraper/status
```

> PowerShell:
> ```powershell
> Invoke-RestMethod -Uri "http://localhost:3000/api/v1/scraper/trigger" `
>   -Method POST -ContentType "application/json" `
>   -Body '{"startDate":"2026-04-01","endDate":"2026-04-11","marketTypeIds":[1]}'
> ```

---

## Referensi Kode Komoditas & Kategori

### Kategori (`category_bi_id`)
| ID      | Nama            |
|---------|-----------------|
| `cat_1` | Beras           |
| `cat_2` | Daging Ayam     |
| `cat_3` | Daging Sapi     |
| `cat_4` | Telur Ayam      |
| `cat_5` | Bawang          |
| `cat_6` | Cabai           |
| `cat_7` | Kacang Hijau    |
| `cat_8` | Minyak Goreng   |
| `cat_9` | Tepung Terigu   |
| `cat_10`| Gula Pasir      |

### Jenis Pasar (`market_type_id`)
| ID | Nama             |
|----|------------------|
| 1  | Pasar Tradisional|
| 2  | Pasar Modern     |
| 3  | Pedagang Besar   |
