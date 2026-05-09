# 🌾 Siger Pangan 

**Sistem Informasi Harga Pangan Provinsi Lampung** 
Sebuah platform terpadu yang menyajikan informasi harga komoditas pangan secara *real-time* berbasis *Microservices Architecture*.

---

## 🏗️ Arsitektur Proyek (Monorepo)

Repositori ini menggunakan struktur **Monorepo** yang memisahkan masing-masing layanan (Backend, Frontend, dan Mobile) ke dalam folder sejajar agar mudah dikelola oleh masing-masing divisi.

```text
Siger-Pangan/
├── be/                 ← [Backend] Microservices (NestJS & FastAPI)
├── mobile/             ← [Mobile] Aplikasi Android/iOS (Flutter)
├── web-cms/            ← [Frontend] Dashboard Admin (Next.js)
│
├── infra/              ← [DevOps] Konfigurasi Grafana & Prometheus
├── nginx/              ← [DevOps] API Gateway Routing
└── proto/              ← [DevOps] Kontrak gRPC antar Microservices
```

### ⚙️ Detail Layanan Backend (`/be`)
Sistem Backend mengimplementasikan arsitektur *True Microservices* di mana setiap *service* memiliki *logical database* PostgreSQL-nya sendiri:
- **`service-web-scraper`** (Port 3000): Menarik data harga dari website BI & mengatur *Job Queue* (BullMQ). Bertindak juga sebagai *main entrypoint*.
- **`service-auth`** (Port 3001): Menangani Autentikasi (JWT/Google) dan Manajemen Pengguna.
- **`service-catalog`** (Port 3002): Mengelola data Komoditas dan Wilayah Pasar.
- **`service-nlp`** (Port 50051): Mesin Chatbot AI berbasis Python FastAPI yang berkomunikasi via gRPC.

---

## 🌐 Jaringan & API Publik

Sistem menggunakan **Cloudflare Zero Trust Tunnel** untuk mengekspos API Gateway lokal ke jaringan publik yang aman (HTTPS) tanpa membutuhkan konfigurasi *Port Forwarding* manual.

> **Base URL API Utama (Untuk tim Frontend & Mobile):**
> 👉 `https://api.sigerpangan.my.id`

*(Harap gunakan Base URL ini di file `.env` aplikasi Frontend dan Mobile Anda)*

---

## 🚀 Panduan Menjalankan Sistem (Development)

Untuk menghidupkan seluruh ekosistem (Database, Cache, API Gateway, Microservices, dan Cloudflare Tunnel), Anda hanya membutuhkan Docker!

### Prasyarat
1. Telah menginstal **Docker Desktop** (Pastikan statusnya *running*).
2. Memiliki file `.env` di *root directory* yang berisi token konfigurasi Cloudflare.

### Menjalankan Docker
Buka Terminal di folder utama *Siger-Pangan* dan jalankan:
```bash
docker compose -f docker-compose.dev.yml up -d
```

### Memantau Log
Untuk melihat proses *running* atau *debugging*, gunakan perintah berikut:
```bash
# Memantau lalu lintas API Gateway
docker logs -f siger-nginx-dev

# Memantau sistem Auth
docker logs -f siger-auth-dev
```

### Akses Database (Adminer GUI)
Sistem otomatis menyediakan GUI untuk mengelola Database PostgreSQL:
- **URL**: `http://localhost:8080`
- **Username**: `siger_user`
- **Password**: `siger_dev_password`
- **Database**: Ketik nama DB (contoh: `siger_pangan_dev`, `siger_auth_dev`, atau `siger_catalog_dev`).

---

## 🌳 Panduan Git (Branching Workflow)

Untuk menjaga kestabilan kode, kami menggunakan strategi *Feature Branching*:

- **`main`** ➔ Cabang stabil untuk keperluan *Production* (DILARANG PUSH LANGSUNG).
- **`stage`** ➔ Tempat berkumpulnya kode untuk *Integration Testing* sebelum dirilis ke `main`.
- **`dev/be`**, **`dev/fe`**, **`dev/mobile`** ➔ Base camp utama untuk masing-masing divisi.
- **`nama-divisi-feature/...`** ➔ Cabang pribadi saat sedang mengetik kode (Contoh: `be-feature/admin-cms`).

**Alur Menulis Kode:**
1. Anda berada di cabang: `dev/mobile`
2. Buat cabang baru: `git checkout -b mobile-feature/login-ui`
3. Kerjakan kode, lalu `git push`.
4. Buat *Pull Request* (PR) di GitHub menuju cabang `dev/mobile` (atau `stage`).
