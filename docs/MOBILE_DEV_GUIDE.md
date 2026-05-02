# 📱 Panduan Pengembangan Aplikasi Mobile — Siger Pangan

**Penanggung Jawab:** Muhammad Ihya Ulumudin
**Dokumen ini dibuat untuk:** Panduan teknis pengerjaan aplikasi mobile Siger Pangan secara terstruktur dan efisien dari awal hingga build APK/IPA siap rilis.

---

## 🌟 Gambaran Besar: Apa yang Kamu Bangun?

**Siger Pangan** adalah aplikasi informasi harga komoditas pangan berbasis lokasi yang ditujukan untuk **warga/konsumen di Provinsi Lampung**. Pengguna bisa memantau harga bahan pangan di berbagai pasar secara real-time, melihat tren kenaikan harga, bertanya kepada asisten AI (Chatbot), dan mendapatkan notifikasi otomatis jika harga di pasar terdekat melonjak drastis.

### Teknologi yang Direkomendasikan

| Kebutuhan | Teknologi |
|---|---|
| **Framework** | Flutter (Dart) — untuk Android & iOS sekaligus |
| **State Management** | Riverpod (atau BLoC, sesuai preferensi) |
| **HTTP Client / API** | Dio (dengan Interceptor untuk JWT) |
| **Peta** | `flutter_map` + OpenStreetMap (Gratis) atau Google Maps |
| **Penyimpanan Lokal** | Hive (NoSQL, super cepat) atau `flutter_secure_storage` untuk Token |
| **Notifikasi** | Firebase Cloud Messaging (FCM) |
| **Grafik Harga** | `fl_chart` |
| **Chatbot UI** | Custom Widget (desain seperti WhatsApp) |

### Arsitektur Backend yang Terhubung

Aplikasi Mobile akan berkomunikasi ke satu alamat API Gateway:

```
Mobile App
    │
    ▼
https://api.sigerpangan.my.id  ← Satu URL untuk semua service
    │
    ├──► /api/v1/auth/*        → service-auth    (Login, Profil)
    ├──► /api/v1/catalog/*     → service-catalog (Komoditas, Wilayah)
    ├──► /api/v1/prices/*      → service-scraper (Data Harga Real-time) [Coming Soon]
    └──► /api/v1/chatbot/*     → service-nlp     (Tanya Jawab AI)       [Coming Soon]
```

> **Catatan Penting:** File dokumentasi API lengkap (format OpenAPI/Swagger) sudah tersedia di:
> `docs/siger-pangan-api.openapi.json`
> Import file ini ke **Apidog** untuk melihat semua detail request & response yang dibutuhkan.

---

## 📋 Urutan Pengerjaan (10 Tugas Terstruktur)

Ikuti urutan ini dengan ketat. Setiap tugas adalah fondasi untuk tugas berikutnya.

---

### ✅ TUGAS 1: Setup Project (State Management & API Client)

**Tujuan:** Menyiapkan fondasi proyek yang kuat agar tidak perlu refactor besar di kemudian hari.

**Yang harus dikerjakan:**

1.  **Buat project Flutter baru** dengan struktur folder yang bersih:
    ```
    lib/
    ├── core/
    │   ├── api/          ← Semua logika HTTP (Dio client, interceptor)
    │   ├── constants/    ← URL, nama route, warna, dll
    │   └── storage/      ← Logika Hive / SecureStorage
    ├── features/
    │   ├── auth/         ← Login, Register, Profil
    │   ├── home/         ← Home Screen
    │   ├── prices/       ← Daftar & Detail Harga
    │   ├── chatbot/      ← Antarmuka Chatbot
    │   └── map/          ← Peta Sebaran Harga
    └── shared/
        ├── widgets/      ← Widget yang dipakai banyak halaman
        └── models/       ← Semua model data (User, Commodity, Price, dll)
    ```

2.  **Konfigurasi Dio API Client** dengan Interceptor JWT:
    - Setiap request otomatis menyisipkan header `Authorization: Bearer <token>`.
    - Jika server membalas `401 Unauthorized`, otomatis arahkan pengguna ke halaman Login.
    - Base URL di-set ke: `https://api.sigerpangan.my.id`

3.  **Setup State Management (Riverpod):**
    - Buat `ProviderScope` di `main.dart`.
    - Buat `authProvider` untuk menyimpan status login (apakah user sudah login atau belum).

4.  **Setup Penyimpanan Lokal:**
    - Gunakan `flutter_secure_storage` untuk menyimpan JWT Token secara aman (terenkripsi di Keychain iOS / Keystore Android).

**Endpoint yang digunakan di tugas ini:** Belum ada, ini murni setup.

---

### ✅ TUGAS 2: Slicing UI Landing Page & Home Screen

**Tujuan:** Membuat kerangka visual utama aplikasi.

**Yang harus dikerjakan:**

1.  **Landing Page / Onboarding:**
    - Tampilkan logo Siger Pangan, tagline, dan 2 tombol: **"Login"** dan **"Daftar"**.
    - (Opsional) Buat 2–3 slide onboarding yang menjelaskan fitur utama app.

2.  **Halaman Login:**
    - Form: Input Email, Input Password (dengan toggle show/hide), Tombol **"Login"**.
    - Tombol **"Login dengan Google"** (akan diimplementasi di Tugas 3, tapi UI-nya dibuat sekarang).
    - Link **"Belum punya akun? Daftar"** yang mengarah ke halaman Registrasi.
    - **Integrasi API:**
        - `POST /api/v1/auth/login` → body: `{ email, password }`
        - Simpan `access_token` dari respons ke `flutter_secure_storage`.
        - Setelah sukses, arahkan ke **Home Screen**.

3.  **Halaman Registrasi:**
    - Form: Input Email, Input Password, Konfirmasi Password, Tombol **"Daftar"**.
    - **Integrasi API:**
        - `POST /api/v1/auth/register` → body: `{ email, password }`
        - Setelah sukses registrasi, arahkan otomatis ke halaman Login.

4.  **Home Screen (Shell Utama):**
    - Buat Bottom Navigation Bar dengan 4 tab:
        - 🏠 **Beranda** — Ringkasan harga & berita terbaru.
        - 📊 **Harga** — Daftar lengkap harga komoditas (Tugas 3).
        - 💬 **Chatbot** — Antarmuka asisten AI (Tugas 5).
        - 👤 **Profil** — Data akun pengguna.
    - **Halaman Beranda:** Tampilkan nama user (ambil dari `GET /api/v1/auth/me`), kartu komoditas yang sedang "trending" (harga naik tertinggi), dan shortcut ke fitur utama.

**Endpoint API yang digunakan:**
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/register`
- `GET /api/v1/auth/me`

---

### ✅ TUGAS 3: Fitur List Harga Pangan (Filter berdasarkan Wilayah)

**Tujuan:** Menampilkan daftar harga bahan pangan yang bisa difilter berdasarkan wilayah/pasar.

**Alur Kerja Fitur:**
1. Saat halaman terbuka, ambil daftar **Wilayah** dari API → tampilkan sebagai Dropdown atau Chip Filter di bagian atas.
2. Saat halaman terbuka, ambil daftar **Komoditas** dari API → tampilkan sebagai daftar kartu.
3. User memilih filter wilayah → daftar harga diperbarui sesuai wilayah yang dipilih.

**Yang harus dikerjakan:**

1.  **Buat model data** `Commodity` dan `Region` sesuai respons API.

2.  **Widget Filter Wilayah:**
    - Tampilkan sebagai `SingleChildScrollView` berisi `ChoiceChip` horizontal.
    - Sumber data: `GET /api/v1/catalog/regions` — ambil semua wilayah, filter hanya yang bertipe `MARKET`.

3.  **Widget Daftar Komoditas:**
    - Tampilkan setiap komoditas sebagai `Card` berisi: Nama, Satuan, dan Harga Terkini.
    - Sumber data komoditas: `GET /api/v1/catalog/commodities`
    - Sumber data harga: `GET /api/v1/prices?regionId=<id>` *(endpoint ini dari service-scraper — akan tersedia nanti. Sementara, gunakan data placeholder/mock).*
    - Tambahkan indikator panah (🔺 merah jika harga naik, 🔻 hijau jika turun) di sebelah harga.

4.  **Fitur Pencarian:**
    - `TextField` di bagian atas untuk mencari nama komoditas secara lokal (filter dari data yang sudah diambil, tanpa request API baru).

**Endpoint API yang digunakan:**
- `GET /api/v1/catalog/commodities`
- `GET /api/v1/catalog/regions`
- `GET /api/v1/prices?regionId={id}` *(mock dulu jika belum tersedia)*

---

### ✅ TUGAS 4: Halaman Detail Komoditas (Grafik Naik-Turun Harga)

**Tujuan:** Saat user mengetuk salah satu komoditas, tampilkan halaman detail dengan grafik historis harga.

**Yang harus dikerjakan:**

1.  **Layout Halaman Detail:**
    - Header: Nama Komoditas, Gambar (jika ada), Harga Terkini (besar).
    - Dropdown untuk memilih **rentang waktu**: `7 Hari`, `30 Hari`, `3 Bulan`.
    - Grafik garis (Line Chart) menggunakan library `fl_chart`.
    - Tabel ringkasan: Harga Tertinggi, Harga Terendah, Rata-rata.
    - Dropdown kedua untuk memilih **Pasar/Wilayah** (agar bisa membandingkan harga antar pasar).

2.  **Integrasi Grafik:**
    - Data grafik diambil dari: `GET /api/v1/prices/history?commodityId={id}&regionId={id}&days=7`
    - *(Gunakan data mock terlebih dahulu jika endpoint belum tersedia dari tim Backend).*

3.  **Tombol Aksi:**
    - Tombol "🔔 Pantau Harga" yang akan mengaktifkan notifikasi untuk komoditas ini (terhubung ke Tugas 7).

---

### ✅ TUGAS 5: Implementasi Chatbot Interface (Chat UI)

**Tujuan:** Membuat antarmuka percakapan yang menarik, mirip aplikasi chat.

> ⚠️ **Tugas ini murni UI terlebih dahulu.** Koneksi ke AI (NLP Service) dilakukan di Tugas 6.

**Yang harus dikerjakan:**

1.  **Layout Chat Screen:**
    - `ListView.builder` yang menampilkan gelembung chat (bubble).
    - Gelembung chat kanan (warna merah/oranye) = pesan dari User.
    - Gelembung chat kiri (warna abu-abu) = balasan dari Bot.
    - Setiap gelembung menampilkan teks dan timestamp.

2.  **Input Area:**
    - `TextField` di bagian bawah layar dengan tombol **Kirim**.
    - Saat tombol diklik, tambahkan pesan user ke daftar, lalu tampilkan animasi "Bot sedang mengetik..." (indikator titik-titik bergerak).

3.  **Pesan Sambutan:**
    - Saat pertama kali dibuka, bot secara otomatis mengirim pesan sambutan:
    > *"Halo! Saya Siger, asisten harga pangan Anda. Tanyakan apa saja tentang harga bahan pokok di Lampung! 🌾"*

4.  **Saran Pertanyaan Cepat (Quick Replies):**
    - Tampilkan beberapa tombol saran di bawah pesan sambutan, contoh:
        - "Berapa harga beras hari ini?"
        - "Pasar mana yang paling murah?"
        - "Harga cabai minggu lalu?"

---

### ✅ TUGAS 6: Integrasi NLP Service (Kirim Pesan & Terima Respons AI)

**Tujuan:** Menghubungkan UI Chatbot dari Tugas 5 ke backend AI (service-nlp).

**Yang harus dikerjakan:**

1.  **Buat fungsi `sendMessage()`** di State Management:
    - Kirim teks pertanyaan ke API: `POST /api/v1/chatbot/ask`
    - Body: `{ "question": "Berapa harga beras hari ini?" }`
    - Sambil menunggu respons, tampilkan animasi "sedang mengetik".
    - Setelah respons diterima, tambahkan gelembung jawaban Bot ke daftar chat.

2.  **Handle Error:**
    - Jika request gagal/timeout, tampilkan pesan error yang ramah:
    > *"Maaf, saya sedang sibuk. Coba lagi sebentar ya! 🙏"*

3.  **Riwayat Chat:**
    - Simpan riwayat percakapan di Hive agar history tidak hilang saat app ditutup.

**Endpoint API yang digunakan:**
- `POST /api/v1/chatbot/ask` *(akan tersedia dari service-nlp — koordinasikan dengan tim Backend)*

---

### ✅ TUGAS 7: Fitur Push Notification (Peringatan Kenaikan Harga)

**Tujuan:** Mengirimkan notifikasi push ke HP pengguna secara otomatis saat ada lonjakan harga.

**Yang harus dikerjakan:**

1.  **Setup Firebase:**
    - Buat project di Firebase Console, tambahkan app Android & iOS.
    - Tambahkan file `google-services.json` (Android) dan `GoogleService-Info.plist` (iOS) ke project Flutter.
    - Install package `firebase_core` dan `firebase_messaging`.

2.  **Izin Notifikasi:**
    - Saat pertama kali app dibuka, tampilkan dialog izin untuk menerima notifikasi.

3.  **Daftar FCM Token ke Backend:**
    - Setelah login berhasil, ambil `FCM Token` dari Firebase.
    - Kirim token tersebut ke API: `POST /api/v1/auth/fcm-token`
    - Body: `{ "fcm_token": "<token dari firebase>" }`
    - Backend akan menggunakan token ini untuk mengirimkan notifikasi push.

4.  **Handle Notifikasi:**
    - Saat notifikasi diterima dan app **sedang aktif** (`foreground`): tampilkan banner notifikasi in-app.
    - Saat notifikasi diterima dan app **di background/tertutup**: tampilkan notifikasi sistem HP.
    - Saat user **mengetuk notifikasi**: arahkan ke halaman Detail Komoditas yang relevan.

**Contoh notifikasi yang akan diterima:**
```json
{
  "title": "⚠️ Harga Cabai Merah Naik!",
  "body": "Harga cabai merah di Pasar Tugu naik 23% hari ini.",
  "data": {
    "type": "price_alert",
    "commodityId": "a1b2c3...",
    "regionId": "b2c3d4..."
  }
}
```

---

### ✅ TUGAS 8: Integrasi Map/Peta Sebaran Harga di Lampung

**Tujuan:** Menampilkan peta interaktif yang menunjukkan lokasi pasar-pasar di Lampung beserta harga terkini.

**Yang harus dikerjakan:**

1.  **Setup Peta:**
    - Gunakan package `flutter_map` dengan tile dari OpenStreetMap (gratis, tanpa API Key).
    - Titik awal peta difokuskan ke koordinat tengah Lampung: `Lat: -5.45, Lng: 105.26`.

2.  **Tampilkan Marker Pasar:**
    - Ambil semua wilayah bertipe `MARKET` dari: `GET /api/v1/catalog/regions`
    - Setiap pasar yang memiliki `latitude` dan `longitude` akan ditampilkan sebagai **marker** (pin) di peta.
    - Warna marker berdasarkan kondisi harga:
        - 🟢 Hijau = Harga stabil atau turun.
        - 🟡 Kuning = Harga naik sedikit (< 10%).
        - 🔴 Merah = Harga naik signifikan (> 10%).

3.  **Popup Info Pasar:**
    - Saat user mengetuk marker, tampilkan popup berisi:
        - Nama Pasar.
        - Daftar 3–5 komoditas dengan harga terkini di pasar tersebut.
        - Tombol **"Lihat Detail"** yang membawa ke halaman harga penuh pasar tersebut.

4.  **Lokasi Pengguna:**
    - Tambahkan tombol "📍 Lokasiku" yang mengarahkan peta ke posisi pengguna saat ini (minta izin lokasi).

---

### ✅ TUGAS 9: Optimasi Performa & Caching Data Offline

**Tujuan:** Memastikan aplikasi tetap cepat dan bisa digunakan meskipun koneksi internet buruk.

**Yang harus dikerjakan:**

1.  **Caching Data Harga:**
    - Setelah data berhasil diambil dari API, simpan ke **Hive** dengan timestamp.
    - Saat membuka kembali, tampilkan dulu data dari cache (agar tidak terasa kosong/loading lama), lalu perbarui di background.
    - Tampilkan keterangan: *"Data per [waktu terakhir update]"* jika sedang menampilkan cache.

2.  **Caching Gambar:**
    - Gunakan package `cached_network_image` untuk meng-cache gambar komoditas secara otomatis.

3.  **Efisiensi Request API:**
    - Jangan meminta ulang data yang sama dalam waktu < 5 menit (gunakan logika `stale-while-revalidate`).
    - Gunakan `RefreshIndicator` (pull-to-refresh) agar user bisa memperbarui data secara manual.

4.  **Optimasi Build:**
    - Aktifkan `--split-per-abi` saat build Android agar ukuran APK lebih kecil.
    - Pastikan tidak ada `print()` atau debug statement yang tersisa di production build.

5.  **Halaman Offline:**
    - Jika tidak ada koneksi DAN tidak ada cache, tampilkan halaman kosong yang ramah:
    > *"Tidak ada koneksi. Menampilkan data terakhir yang tersimpan."*

---

### ✅ TUGAS 10: Testing di Perangkat & Build APK/IPA

**Tujuan:** Memastikan aplikasi berjalan sempurna di perangkat nyata sebelum diserahkan.

**Yang harus dikerjakan:**

1.  **Testing Fungsional (Manual):**
    - [ ] Login / Logout berhasil dan token tersimpan dengan aman.
    - [ ] Daftar harga tampil dengan benar setelah filter wilayah diubah.
    - [ ] Grafik harga tampil dan dapat berganti rentang waktu.
    - [ ] Chatbot dapat menerima dan menampilkan balasan.
    - [ ] Notifikasi diterima saat app di background.
    - [ ] Peta menampilkan marker pasar dengan benar.
    - [ ] Data tetap tampil (dari cache) saat internet dimatikan.

2.  **Testing di Perangkat Nyata:**
    - Minimal tes di **1 perangkat Android** (disarankan Android 10 ke atas).
    - Minimal tes di **1 perangkat iOS** (disarankan iOS 14 ke atas, jika ada Mac/MacBook untuk build).

3.  **Build APK (Android):**
    ```bash
    flutter build apk --release --split-per-abi
    ```
    - File APK akan ada di: `build/app/outputs/flutter-apk/`
    - Kirimkan file `app-arm64-v8a-release.apk` untuk kebanyakan HP modern.

4.  **Build IPA (iOS) — Jika Diperlukan:**
    ```bash
    flutter build ipa --release
    ```
    - Memerlukan Mac dengan Xcode dan akun Apple Developer terdaftar.

---

## 🔗 Referensi Cepat

| Kebutuhan | Link / Path |
|---|---|
| **Dokumentasi API (Apidog)** | Import file `docs/siger-pangan-api.openapi.json` |
| **Base URL Production** | `https://api.sigerpangan.my.id` |
| **Token Admin untuk Testing** | Minta ke tim Backend (login dengan akun SUPER_ADMIN) |
| **Repositori GitHub** | `https://github.com/patpaw111/Siger-Pangan` |
| **Package Flutter Favorit** | `dio`, `riverpod`, `flutter_map`, `fl_chart`, `hive`, `firebase_messaging`, `cached_network_image` |

---

> 📌 **Prioritas Utama:** Selesaikan Tugas 1 → 2 → 3 terlebih dahulu sebelum mengerjakan yang lain, karena ketiga tugas tersebut adalah fondasi yang paling krusial. Jika ada endpoint API yang belum tersedia dari tim Backend, gunakan **data mock/dummy** terlebih dahulu agar pengerjaan UI tidak terhambat.
