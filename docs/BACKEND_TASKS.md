# 📋 Daftar Tugas Backend (Siger Pangan) - Microservices Edition

Berikut adalah daftar **Microservices** dan fitur yang harus diselesaikan untuk mendukung penuh kebutuhan dari tim **Web CMS (Admin)** dan **Mobile Apps**.

*(Sistem saat ini sudah menggunakan Cloudflare Tunnel: `https://api.sigerpangan.my.id` sebagai API Gateway utama yang diarahkan ke Port 3000)*.

## 🟢 Prioritas 1: Fondasi Admin & Autentikasi (Branch: `be-feature/admin-cms`)
**Status:** Sedang Dikerjakan (In Progress)

### 1. `service-auth` (Port: 3001)
Service ini menangani sekuritas, registrasi admin, dan verifikasi identitas.
- [ ] **Tabel Database (`siger_auth_dev`)**
  - Pembuatan tabel `users` (id, email, password_hash, role).
- [ ] **Login & Registrasi System**
  - Implementasi login menggunakan *Bcrypt* (Hash password).
  - Generate & Validasi *JWT Token* (JSON Web Token) untuk memproteksi API admin.
- [ ] **Endpoint**
  - `POST /auth/login`
  - `POST /auth/register` (opsional, atau seeder admin pertama).

### 2. `service-catalog` (Port: 3002)
Service ini menangani pengelolaan data master (Komoditas dan Wilayah) yang dilakukan oleh Admin CMS.
- [ ] **Master Data CRUD**
  - Endpoint CRUD untuk tabel `commodities` (tambah, edit, hapus nama/gambar komoditas).
  - Endpoint CRUD untuk tabel `regions` (tambah, edit, hapus wilayah pasar).
  - Tambah kolom `latitude` & `longitude` di tabel `regions` untuk fitur Peta di Mobile.
- [ ] **Database (`siger_catalog_dev`)**
  - Migrasi struktur tabel katalog mandiri.

---

## 🟡 Prioritas 2: Integrasi Komunikasi Antar Service (Inter-Service)

Karena database sudah terpisah (terisolasi), service tidak bisa saling melakukan *JOIN SQL*.
- [ ] **Event-Driven Broker (Redis / BullMQ)**
  - Ketika Admin menghapus komoditas di `service-catalog`, kirim *Event* ke `service-web-scraper` agar data *price records* yang terkait komoditas tersebut ikut terhapus atau ditandai.
- [ ] **API Gateway Proxying**
  - Mengonfigurasi `service-web-scraper` (Port 3000) agar mem-*forward* rute `/api/v1/auth/*` ke Port 3001 dan `/api/v1/catalog/*` ke Port 3002. (Atau gunakan Nginx internal di kemudian hari).

---

## 🔴 Prioritas 3: Log & Reporting (Branch: TBD)

### 3. `service-nlp` (Port: 50051) & Integrasi History
- [ ] **NLP History Tracking**
  - Simpan setiap interaksi user (Mobile) vs bot (NLP) ke database sejarah untuk analisis admin.
  - Endpoint: `GET /chatbot/history`

### 4. `service-report` (Microservice Baru)
- [ ] **Export Engine**
  - Mengolah data harga menjadi file Excel/CSV/PDF untuk Admin CMS.
  - Endpoint: `GET /reports/export`

---

## 🟣 Prioritas 4: User Experience & Real-time (Branch: TBD)

### 5. `service-notifier` (Microservice Baru)
- [ ] **Push Notification Alarm**
  - Scheduler (Cron) tambahan untuk mengecek apakah ada lonjakan harga yang melebihi batas kewajaran.
  - Integrasi Firebase Cloud Messaging (FCM) untuk menembak notifikasi ke HP warga/pengguna.

### 6. `service-web-scraper` (Optimasi Lanjutan)
- [ ] **Price History Optimization**
  - Filter rentang waktu (7 hari, 30 hari) untuk grafik harga di aplikasi mobile.
  - Implementasi *Redis Caching* tingkat lanjut agar grafik harga termuat dalam hitungan milidetik.
