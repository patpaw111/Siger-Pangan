# 📋 Daftar Tugas Backend (Siger Pangan)

Berikut adalah daftar modul, service, dan fitur yang harus diselesaikan di Backend (NestJS & FastAPI) untuk mendukung penuh kebutuhan dari tim **Web CMS (Admin)** dan **Mobile Apps**.

## 🟢 Prioritas 1: Kebutuhan Dasar Web CMS (Sedang/Akan Dikerjakan)
- [ ] **Modul Authentication (AuthService)**
  - Implementasi login menggunakan *Bcrypt* (Hash password).
  - Generate & Validasi *JWT Token* (JSON Web Token) untuk memproteksi API khusus admin.
  - Endpoint: `POST /api/v1/auth/login`
- [ ] **Modul Master Data CRUD (Komoditas & Wilayah)**
  - Endpoint pembuatan, edit, dan hapus data (CRUD) untuk tabel komoditas dan wilayah.
  - Tambah kolom `latitude` & `longitude` di tabel *Region/Wilayah* untuk fitur Map Mobile Apps.
  - Endpoint: `GET, POST, PUT, DELETE /api/v1/commodities` dan `/api/v1/regions`

## 🟡 Prioritas 2: Integrasi Lanjutan & Reporting
- [ ] **Modul Chat History (Log NLP)**
  - Pembuatan tabel `chat_histories` di PostgreSQL.
  - Menanamkan trigger di `ChatbotService` untuk selalu *Save* semua kata-kata yang diketik user beserta respon bot.
  - Endpoint: `GET /api/v1/chatbot/history` (Termasuk filter tanggal).
- [ ] **Modul Ekspor Laporan Harga**
  - Membuat Data Generator Service yang mengolah format JSON menjadi Buffer Excel/CSV.
  - Endpoint: `GET /api/v1/reports/export?format=excel`

## 🔴 Prioritas 3: Kebutuhan Spesifik Mobile Users & Optimasi
- [ ] **Time-Series Chart API Enhancement**
  - Mengubah struktur pengembalian endpoint `GET /api/v1/prices/history` agar bisa di-filter khusus *7 Hari Terakhir*, *1 Bulan Terakhir*, dsb, agar rendering grafik antarmuka Mobile terasa ringan (tidak melempar ribuan data sekaligus).
- [ ] **Notification Scheduler (Peringatan Kenaikan)**
  - Membuat *Cron Job* harian di NestJS yang membandingkan selisih harga (contoh: Harga sembako naik 10%).
  - Mengintegrasikan package **Firebase Admin SDK (FCM)** untuk mengirim *Push Notification* blast otomatis ke device HP.
- [ ] **Optimasi Caching (Redis)**
  - Memasang Redis cache interceptor pada respon API `/prices/latest` agar request data dari ribuan user Mobile tidak menyiksa database PostgreSQL langsung.
