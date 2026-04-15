# 📋 Daftar Tugas Backend (Siger Pangan) - Microservices Edition

Berikut adalah daftar **Microservices** dan fitur yang harus diselesaikan untuk mendukung penuh kebutuhan dari tim **Web CMS (Admin)** dan **Mobile Apps**.

## 🟢 Prioritas 1: Fondasi Admin (Branch: `be-feature/admin-cms`)

### 1. `service-auth` (Microservice)
- [ ] **Authentication System**
  - Implementasi login menggunakan *Bcrypt* (Hash password).
  - Generate & Validasi *JWT Token* (JSON Web Token) untuk memprotesi API admin.
  - Database: `siger_auth_dev` (PostgreSQL)
  - Endpoint: `POST /auth/login`

### 2. `service-catalog` (Microservice)
- [ ] **Master Data CRUD**
  - Endpoint CRUD untuk tabel `commodities` dan `regions`.
  - Tambah kolom `latitude` & `longitude` di tabel `regions`.
  - Database: `siger_catalog_dev` (PostgreSQL)
  - Endpoint: `GET, POST, PUT, DELETE /commodities` dan `/regions`

---

## 🟡 Prioritas 2: Log & Reporting (Branch: `be-feature/history-log-nlp` & `be-feature/reports-exporter`)

### 3. `service-chat-log` (TBD)
- [ ] **NLP History Tracking**
  - Simpan setiap interaksi user vs bot ke database sejarah.
  - Branch: `be-feature/history-log-nlp`
  - Endpoint: `GET /chatbot/history`

### 4. `service-report` (TBD)
- [ ] **Export Engine**
  - Mengolah data harga menjadi file Excel/CSV.
  - Branch: `be-feature/reports-exporter`
  - Endpoint: `GET /reports/export`

---

## 🔴 Prioritas 3: User Experience & Real-time (Branch: `be-feature/mobile-notification`)

### 5. `service-notifier` (TBD)
- [ ] **Push Notification Alarm**
  - Scheduler (Cron) untuk cek kenaikan harga signifikan.
  - Integrasi Firebase Cloud Messaging (FCM).
  - Branch: `be-feature/mobile-notification`

### 6. `service-price` (Core/Web-Scraper Enhancement)
- [ ] **Price History Optimization**
  - Filter rentang waktu (7 hari, 30 hari) untuk grafik mobile.
  - Implementasi Redis Caching untuk performa tinggi.

