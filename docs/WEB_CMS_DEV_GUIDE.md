# 🌐 Panduan Pengembangan Website CMS (Frontend Web)

> Dokumen ini disusun khusus untuk **Frontend Web Developer** yang akan membangun panel admin / CMS untuk Siger Pangan.
> CMS ini digunakan oleh **Admin** dan **Surveyor** untuk mengelola master data, memonitor harga, dan mengontrol mesin scraper.

---

## 🏗️ 1. Sekilas Tentang Website CMS Siger Pangan

Website CMS (Content Management System) adalah "dapur" dari platform Siger Pangan. Berbeda dengan Mobile App yang ditujukan untuk masyarakat umum (role `USER`), website ini ditujukan untuk pengelola sistem.

### 💻 Rekomendasi Tech Stack
- **Framework:** Next.js (App Router) atau React (Vite)
- **Styling:** Tailwind CSS + Shadcn UI (untuk komponen UI yang cepat dan rapi)
- **State Management & Fetching:** React Query / SWR (sangat disarankan untuk kemudahan integrasi REST API)
- **Form Handling:** React Hook Form + Zod

### 🔑 Sistem Role di Web
1. **`SUPER_ADMIN`**: Akses penuh ke semua fitur (Dashboard, Master Data, Scraper, Manajemen Akun).
2. **`SURVEYOR`**: Akses terbatas (misalnya hanya bisa melihat master data dan input harga manual ke depannya). Saat ini, pastikan halaman konfigurasi/master data disembunyikan untuk role ini.

---

## 🚀 2. Rincian Fitur yang Harus Dibuat (Per Halaman)

Berikut adalah struktur halaman (routing) dan fitur yang harus Anda buat:

### A. Halaman Autentikasi (`/login`)
- **Desain:** Form login sederhana dengan ilustrasi/logo Siger Pangan.
- **Fitur:**
  - Login menggunakan Email & Password (`POST /api/v1/auth/login`).
  - Login menggunakan Akun Google (`GET /api/v1/auth/google` - Redirect flow).
- **Flow:** Setelah sukses login, simpan `access_token` (JWT) di Cookies / LocalStorage dan arahkan user ke halaman `/dashboard`.

### B. Layout Utama (Dashboard Layout)
- **Desain:** Memiliki **Sidebar** di sebelah kiri untuk navigasi menu, dan **Topbar** yang berisi nama user, foto profil (dari Google), dan tombol Logout.
- **Menu Sidebar:**
  - 📊 Dashboard
  - 📦 Master Komoditas
  - 🗺️ Master Wilayah
  - ⚙️ Kontrol Scraper
  - 👥 Manajemen User (Hanya tampil untuk `SUPER_ADMIN`)

### C. Halaman Dashboard (`/dashboard`)
- **Tujuan:** Menampilkan ringkasan status sistem.
- **Isi Konten:**
  - **Widget Statistik:** Jumlah komoditas aktif, jumlah wilayah, jumlah antrian scraper yang sukses/gagal.
  - **Tabel Harga Terbaru:** Menampilkan sekilas harga terkini (Panggil `GET /api/v1/prices/latest`).

### D. Halaman Master Komoditas (`/commodities`)
- **Tujuan:** Mengelola daftar sembako/pangan yang didukung aplikasi.
- **Fitur:**
  - **Tabel Data:** Menampilkan daftar komoditas (`GET /api/v1/catalog/commodities`).
  - **Tambah (Create):** Modal/Form untuk menambah komoditas baru (nama, satuan) → `POST /api/v1/catalog/commodities`.
  - **Edit (Update):** Modal/Form untuk mengedit nama/satuan → `PATCH /api/v1/catalog/commodities/:id`.
  - **Hapus (Delete):** Konfirmasi hapus komoditas → `DELETE /api/v1/catalog/commodities/:id`.

### E. Halaman Master Wilayah/Pasar (`/regions`)
- **Tujuan:** Mengelola daftar provinsi, kota/kabupaten, dan pasar beserta titik koordinatnya.
- **Fitur:**
  - **Tabel Data:** Menampilkan daftar wilayah (`GET /api/v1/catalog/regions`).
  - **Tambah (Create):** Form berisi Nama, Tipe (PROVINCE/CITY/REGENCY/MARKET), Latitude, dan Longitude → `POST /api/v1/catalog/regions`.
  - **Edit & Hapus:** Sama seperti komoditas.

### F. Halaman Kontrol Scraper (`/scraper`)
- **Tujuan:** Memonitor dan memicu mesin pengambil data (scraper) dari Bank Indonesia.
- **Fitur:**
  - **Status Card:** Menampilkan jumlah job scraping yang *waiting, active, completed, failed* (`GET /api/v1/scraper/status`).
  - **Tombol "Mulai Scraping Manual":** Membuka modal form tanggal awal dan tanggal akhir, lalu men-trigger backend (`POST /api/v1/scraper/trigger`).

### G. Halaman Manajemen User (`/users`)
- **Tujuan:** Membuat akun khusus untuk pegawai (Surveyor) atau Admin tambahan.
- **Fitur:**
  - Form pembuatan user baru (Email, Password, Role) → `POST /api/v1/auth/users`.
  - *Catatan: User umum (masyarakat) mendaftar sendiri lewat Mobile App, admin hanya membuatkan akun internal.*

---

## 📅 3. Urutan Pengerjaan (Step-by-Step)

Agar pekerjaan terstruktur dan cepat selesai, ikuti urutan berikut:

### **Tahap 1: Setup & Autentikasi (Fokus ke Keamanan)**
1. Inisialisasi project React/Next.js.
2. Buat halaman `/login`.
3. Buat fungsi untuk menyimpan token JWT (disarankan di HttpOnly Cookie atau LocalStorage).
4. Buat file Axios/Fetch interceptor yang otomatis menyematkan header `Authorization: Bearer <token>` di setiap request.
5. Buat logika *Protected Route*: Jika tidak ada token atau token expired (cek via `GET /api/v1/auth/me`), lempar user kembali ke `/login`.

### **Tahap 2: Layouting & Master Data (Fokus ke CRUD)**
1. Buat layout utama (Sidebar + Topbar).
2. Kerjakan halaman **Master Komoditas** (Tabel, Form Tambah, Edit, Hapus). Pastikan UI responsif dan ada indikator loading.
3. Kerjakan halaman **Master Wilayah**.

### **Tahap 3: Fitur Spesifik Bisnis (Scraper & Users)**
1. Kerjakan halaman **Kontrol Scraper**. Buat fitur auto-refresh interval (misal tiap 5 detik) untuk mengecek status antrian scraper.
2. Kerjakan halaman **Manajemen User** (khusus Super Admin).
3. Kerjakan halaman **Dashboard** (Gabungkan data dari berbagai endpoint).

---

## 🔌 4. Panduan Integrasi API Singkat

Semua endpoint API secara lengkap bisa dilihat di `docs/siger-pangan-api.openapi.json` (buka menggunakan Postman, Swagger UI, atau Apidog).

**Base URL Backend:**
- Development: `http://localhost:8081`
- Production: `https://api.sigerpangan.my.id`

**Contoh Cara Call API (Axios):**

```javascript
import axios from 'axios';

// 1. Setup Axios Instance
const api = axios.create({
  baseURL: 'http://localhost:8081/api/v1'
});

// 2. Interceptor untuk menyematkan Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 3. Contoh Mengambil Data Komoditas
export const getCommodities = async () => {
  const response = await api.get('/catalog/commodities');
  return response.data;
};

// 4. Contoh Menambah Komoditas
export const createCommodity = async (data) => {
  // data = { name: "Beras", unit: "kg" }
  const response = await api.post('/catalog/commodities', data);
  return response.data;
};
```

**Contoh Google Login di Web CMS:**
Berbeda dengan mobile, web CMS menggunakan alur redirect.
Cukup buat tombol "Login dengan Google" yang mengarahkan user (menggunakan `href` biasa) ke URL:
`http://localhost:8081/api/v1/auth/google`

Backend akan memproses login di server Google, lalu me-redirect user kembali ke aplikasi dengan token. (Bisa disesuaikan deeplink/callback-nya di backend agar kembali ke dashboard CMS).

---
*Semangat mengembangkan Web CMS Siger Pangan! Jika ada error 500, segera cek log Docker di backend.*
