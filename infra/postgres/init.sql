-- ============================================================
-- SIGER PANGAN — PostgreSQL Initial Schema
-- Dijalankan otomatis oleh Docker saat container pertama kali dibuat
-- ============================================================

-- ──────────────────────────────────────────────
-- Extensions
-- ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- Untuk fuzzy search nama komoditas

-- ──────────────────────────────────────────────
-- Table: regions (Kabupaten/Kota di Lampung)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS regions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(100) NOT NULL UNIQUE,  -- e.g. "Bandar Lampung"
    slug        VARCHAR(100) NOT NULL UNIQUE,  -- e.g. "bandar-lampung"
    pihps_code  VARCHAR(20),                  -- Kode dari PIHPS Nasional
    latitude    DECIMAL(10, 8),
    longitude   DECIMAL(11, 8),
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- Table: commodities (Komoditas Pangan)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS commodities (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name         VARCHAR(150) NOT NULL UNIQUE,  -- e.g. "Beras Medium"
    slug         VARCHAR(150) NOT NULL UNIQUE,  -- e.g. "beras-medium"
    category     VARCHAR(100),                  -- e.g. "Beras", "Sayuran", "Daging"
    unit         VARCHAR(20) DEFAULT 'kg',      -- Satuan: kg, liter, buah
    pihps_code   VARCHAR(20),
    aliases      TEXT[],                        -- Nama alias: ["beras", "nasi mentah"]
    created_at   TIMESTAMP DEFAULT NOW(),
    updated_at   TIMESTAMP DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- Table: price_records (Data Harga Harian)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS price_records (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    commodity_id  UUID NOT NULL REFERENCES commodities(id) ON DELETE CASCADE,
    region_id     UUID NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
    price         DECIMAL(12, 2) NOT NULL,      -- Harga dalam Rupiah
    price_date    DATE NOT NULL,                -- Tanggal harga berlaku
    source        VARCHAR(255) DEFAULT 'PIHPS', -- Sumber data
    is_validated  BOOLEAN DEFAULT FALSE,        -- Admin dinas sudah validasi?
    scraped_at    TIMESTAMP DEFAULT NOW(),      -- Waktu scraping
    created_at    TIMESTAMP DEFAULT NOW(),

    -- Constraint: satu harga per komoditas per daerah per hari
    UNIQUE(commodity_id, region_id, price_date)
);

-- Index untuk query yang sering dilakukan
CREATE INDEX IF NOT EXISTS idx_price_commodity_date ON price_records(commodity_id, price_date DESC);
CREATE INDEX IF NOT EXISTS idx_price_region_date    ON price_records(region_id, price_date DESC);
CREATE INDEX IF NOT EXISTS idx_price_date           ON price_records(price_date DESC);

-- ──────────────────────────────────────────────
-- Table: news (Berita Pangan)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS news (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title       VARCHAR(500) NOT NULL,
    content     TEXT NOT NULL,
    summary     TEXT,
    author      VARCHAR(200),
    source_url  VARCHAR(1000),
    image_url   VARCHAR(1000),
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP,
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- Table: users (Admin Dinas)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(200),
    role          VARCHAR(50) DEFAULT 'viewer',  -- 'super_admin', 'admin', 'viewer'
    dinas_unit    VARCHAR(200),                  -- Unit dinas terkait
    is_active     BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP,
    created_at    TIMESTAMP DEFAULT NOW(),
    updated_at    TIMESTAMP DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- Table: scraper_logs (Log Aktivitas Scraping)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scraper_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id          VARCHAR(100),               -- BullMQ job ID
    status          VARCHAR(50) NOT NULL,        -- 'success', 'failed', 'partial'
    records_scraped INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    error_message   TEXT,
    duration_ms     INTEGER,
    started_at      TIMESTAMP DEFAULT NOW(),
    completed_at    TIMESTAMP
);

-- ──────────────────────────────────────────────
-- Seed Data: Kabupaten/Kota Lampung
-- ──────────────────────────────────────────────
INSERT INTO regions (name, slug) VALUES
    ('Bandar Lampung',  'bandar-lampung'),
    ('Metro',           'metro'),
    ('Lampung Selatan', 'lampung-selatan'),
    ('Lampung Tengah',  'lampung-tengah'),
    ('Lampung Utara',   'lampung-utara'),
    ('Lampung Barat',   'lampung-barat'),
    ('Lampung Timur',   'lampung-timur'),
    ('Tanggamus',       'tanggamus'),
    ('Pringsewu',       'pringsewu'),
    ('Pesawaran',       'pesawaran'),
    ('Mesuji',          'mesuji'),
    ('Tulang Bawang',   'tulang-bawang'),
    ('Tulang Bawang Barat', 'tulang-bawang-barat'),
    ('Way Kanan',       'way-kanan'),
    ('Pesisir Barat',   'pesisir-barat')
ON CONFLICT (slug) DO NOTHING;

-- ──────────────────────────────────────────────
-- Seed Data: Komoditas Pangan Utama
-- ──────────────────────────────────────────────
INSERT INTO commodities (name, slug, category, unit, aliases) VALUES
    ('Beras Medium',        'beras-medium',        'Beras',    'kg',    ARRAY['beras', 'beras medium']),
    ('Beras Premium',       'beras-premium',       'Beras',    'kg',    ARRAY['beras premium', 'beras kualitas']),
    ('Jagung',              'jagung',              'Biji-bijian', 'kg', ARRAY['jagung']),
    ('Kedelai',             'kedelai',             'Biji-bijian', 'kg', ARRAY['kedelai', 'kacang kedelai']),
    ('Bawang Merah',        'bawang-merah',        'Sayuran',  'kg',    ARRAY['bawang merah', 'brambang']),
    ('Bawang Putih',        'bawang-putih',        'Sayuran',  'kg',    ARRAY['bawang putih']),
    ('Cabai Merah Keriting','cabai-merah-keriting', 'Sayuran', 'kg',    ARRAY['cabai merah', 'cabe merah', 'cabai keriting']),
    ('Cabai Rawit Merah',   'cabai-rawit-merah',   'Sayuran',  'kg',    ARRAY['cabai rawit', 'cabe rawit', 'cabai kecil']),
    ('Daging Sapi',         'daging-sapi',         'Daging',   'kg',    ARRAY['daging sapi', 'sapi']),
    ('Daging Ayam Ras',     'daging-ayam-ras',     'Daging',   'kg',    ARRAY['ayam', 'daging ayam', 'ayam ras']),
    ('Telur Ayam Ras',      'telur-ayam-ras',      'Telur',    'kg',    ARRAY['telur ayam', 'telur']),
    ('Minyak Goreng',       'minyak-goreng',       'Minyak',   'liter', ARRAY['minyak goreng', 'minyak']),
    ('Gula Pasir',          'gula-pasir',          'Gula',     'kg',    ARRAY['gula pasir', 'gula']),
    ('Tepung Terigu',       'tepung-terigu',       'Tepung',   'kg',    ARRAY['tepung terigu', 'tepung']),
    ('Ikan Kembung',        'ikan-kembung',        'Ikan',     'kg',    ARRAY['ikan kembung', 'kembung']),
    ('Ikan Bandeng',        'ikan-bandeng',        'Ikan',     'kg',    ARRAY['ikan bandeng', 'bandeng'])
ON CONFLICT (slug) DO NOTHING;
