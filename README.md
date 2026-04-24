# Siger Pangan 🌾
**Platform Informasi Harga Pangan — Provinsi Lampung**

> *True Microservices Architecture* dengan akses API Publik via Cloudflare Zero Trust Tunnel.

---

## 🗂️ Struktur Proyek (Microservices)

Proyek ini telah bermigrasi dari Monolith ke *True Microservices*, di mana setiap service berjalan secara independen dengan *logical database*-nya masing-masing.

```
Siger-Pangan/
├── docker-compose.dev.yml      ← Infrastruktur Utama (Local & Tunnel)
├── .env                        ← Konfigurasi Root & Token Cloudflare
│
├── be/
│   ├── service-web-scraper/    ← 🟦 NestJS (Port 3000) - API Gateway & Scraper Bot
│   ├── service-auth/           ← 🟧 NestJS (Port 3001) - Auth, JWT, Admin CMS
│   ├── service-catalog/        ← 🟩 NestJS (Port 3002) - CRUD Komoditas & Wilayah
│   └── service-nlp/            ← 🟨 FastAPI (Port 50051) - Chatbot Engine via gRPC
│
├── proto/
│   └── nlp.proto               ← gRPC contract untuk service-nlp
│
└── docs/                       ← Dokumentasi Tugas & Roadmap Backend
```

---

## 🌐 Arsitektur Jaringan & Domain (PENTING UNTUK FRONTEND)

Proyek ini menggunakan **Cloudflare Zero Trust Tunnel** agar Backend yang berjalan di lokal komputer bisa diakses secara Publik dari mana saja tanpa VPS.

**Skema Domain Utama:**
- **`sigerpangan.my.id`** ➔ Di-hosting di **Vercel** (Untuk Frontend / Website Admin CMS).
- **`api.sigerpangan.my.id`** ➔ Di-routing via **Cloudflare Tunnel** langsung ke Docker `service-web-scraper` (Backend).

**Base URL untuk Tim Frontend & Mobile:**
> 👉 **`https://api.sigerpangan.my.id`**

*(Tim Frontend/Mobile wajib memasukkan URL di atas ke dalam file `.env` aplikasi mereka, misalnya sebagai `VITE_BASE_API_URL` atau `API_BASE_URL`)*.

---

## 🔧 Tech Stack

| Layer | Teknologi | Fungsi |
|---|---|---|
| API Gateway & Routing | **Cloudflared Tunnel** | Pengganti Nginx, routing HTTPS publik ke lokal |
| Microservices | **NestJS & FastAPI** | Logika bisnis terpisah (Scraper, Auth, Catalog, NLP) |
| Database | **PostgreSQL** | *Logical Database* terpisah (`siger_auth`, `siger_catalog`, dll) |
| Cache & Broker | **Redis** | Cache API dan *Message Broker* antar service |
| Job Queue | **BullMQ** | Penjadwalan *Scraping* harian (CronJob) |
| Container | **Docker Compose** | Orkestrasi seluruh service |

---

## 🚀 Cara Menjalankan (Development)

Sistem telah dikonfigurasi agar Anda hanya perlu menjalankan 1 perintah untuk menghidupkan seluruh ekosistem (Database, Cache, Microservices, dan Public Tunnel).

### Prerequisites
1. Docker Desktop harus dalam keadaan aktif (*running*).
2. Memiliki Token Cloudflare Zero Trust (Sudah terpasang di file `.env`).

### Menjalankan Server
Buka terminal di root folder `Siger-Pangan`, lalu jalankan:

```bash
docker compose -f docker-compose.dev.yml up -d
```

### Melihat Log (Penting untuk Debugging)
Karena semua berjalan di background (`-d`), gunakan perintah berikut untuk melihat error atau status masing-masing service:

```bash
# Log Web Scraper / Gateway
docker logs -f siger-web-scraper-dev

# Log Auth Service
docker logs -f siger-auth-dev

# Log Cloudflare Tunnel (Untuk cek status koneksi domain)
docker logs -f siger-cloudflare-tunnel
```

---

## 📊 Akses Internal (Database GUI)

Untuk mengecek isi database secara visual tanpa DBeaver/TablePlus, Anda bisa menggunakan **Adminer** yang sudah ter- *include* di Docker:

1. Buka browser: `http://localhost:8080`
2. **System**: PostgreSQL
3. **Server**: `postgres`
4. **Username**: `siger_user`
5. **Password**: `siger_dev_password`
6. **Database**: Ketik nama database yang ingin dilihat (contoh: `siger_pangan_dev`, `siger_auth_dev`, atau `siger_catalog_dev`).

---

## 👥 Branching Strategy (Git)

Proyek ini menggunakan strategi *Feature Branching*.
- `main` : Kode stabil (Production)
- `dev/be` : Integrasi antar backend developer
- `be-feature/*` : Branch pengerjaan fitur. Contoh: `be-feature/admin-cms`

**Alur Kerja:**
1. Pull dari `dev/be` terbaru.
2. Buat branch baru: `git checkout -b be-feature/nama-fitur`
3. Push dan buat PR (Pull Request) ke `dev/be`.
