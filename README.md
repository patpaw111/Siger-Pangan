# 🌾 Siger Pangan 

**Sistem Informasi Harga Pangan Provinsi Lampung** 

Selamat datang di repositori resmi **Siger Pangan**! Siger Pangan adalah sebuah platform digital cerdas yang bertujuan untuk menyajikan informasi harga komoditas pangan secara *real-time* dan transparan di seluruh wilayah Provinsi Lampung.

---

## 🎯 Apa itu Siger Pangan?

Bagi masyarakat umum, naik turunnya harga bahan pokok (seperti beras, cabai, bawang, atau daging ayam) sering kali membingungkan. Siger Pangan hadir sebagai solusi untuk memantau harga pangan harian agar warga bisa berbelanja dengan lebih hemat dan bijak.

Proyek ini menghadirkan ekosistem digital yang terdiri dari dua aplikasi utama:

1. **📱 Aplikasi Mobile (Untuk Warga / Masyarakat Umum)**
   Aplikasi Android/iOS yang bisa diunduh warga untuk mengecek harga pangan hari ini di pasar terdekat, melihat grafik perubahan harga, dan bahkan **mengobrol dengan Chatbot AI pintar** layaknya bertanya ke pedagang langsung! (Contoh: *"Berapa harga cabai di Pasar Gintung hari ini?"*).
   
2. **💻 Web Dashboard CMS (Untuk Petugas Dinas & Surveyor)**
   Website khusus yang sangat aman untuk petugas pasar (surveyor) di lapangan. Mereka menggunakan website ini untuk memperbarui dan memvalidasi harga bahan pokok di pasar setiap paginya, agar data yang dilihat warga selalu akurat.

## ✨ Fitur Utama
- **Pantau Harga Real-Time:** Menampilkan data komoditas pangan yang terus diperbarui setiap hari.
- **Tanya AI (Chatbot Cerdas):** Asisten virtual cerdas yang memahami pertanyaan warga menggunakan bahasa sehari-hari berkat teknologi *Natural Language Processing* (NLP).
- **Data Akurat & Terintegrasi:** Data bersumber dari input petugas lapangan yang dipadukan secara otomatis (bot scraper) dengan portal resmi pemerintah (Bank Indonesia).

---

## 🛠️ Untuk Pengembang (Developer Area)

Repositori ini menggunakan arsitektur **Monorepo** yang berisi kode lengkap untuk seluruh platform.

### Struktur Repositori
- **`/mobile`** : Kode untuk Aplikasi Android/iOS (Dibuat dengan **Flutter**).
- **`/web-cms`** : Kode untuk Website Dashboard Admin (Dibuat dengan **Next.js & React**).
- **`/be`** : Kumpulan layanan *Backend Microservices* (Dibuat dengan **NestJS** & **Python FastAPI**).

### Menjalankan Server secara Lokal
Jika Anda adalah developer yang ingin berkontribusi, kami menggunakan **Docker** agar seluruh sistem pendukung (Database PostgreSQL, Redis, API, dan Bot AI) bisa dihidupkan dengan mudah:

1. Pastikan **Docker Desktop** sudah terinstal dan dalam keadaan hidup.
2. Buka terminal di folder utama proyek ini, lalu jalankan satu perintah sakti berikut:
   ```bash
   docker compose -f docker-compose.dev.yml up -d
   ```
3. Selesai! Semua sistem berjalan otomatis di latar belakang.

### Mengakses API Publik
Bagi tim pengembang antarmuka (Mobile & Frontend), Anda tidak perlu menghidupkan server lokal jika komputer Anda terasa berat! Server kami telah diekspos secara publik melalui *Cloudflare Zero Trust Tunnel*. Cukup masukkan URL berikut ke aplikasi Anda:
👉 `https://api.sigerpangan.my.id`

---
*Dibuat dengan ❤️ oleh Tim Pengembang Siger Pangan untuk masyarakat Provinsi Lampung.*
