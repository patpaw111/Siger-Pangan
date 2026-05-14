# Laporan Pengerjaan Frontend (Web CMS Siger Pangan)

**Nama**: Muhammad Nur Imam Faqih Abdullah  
**NPM**: 23312181  
**Tugas**: Integrasi Sistem Autentikasi, Google OAuth, dan Role-Based Access Control (RBAC) pada Web CMS.

---

## 1. Konfigurasi Environment & API Frontend
**Catatan Pengerjaan:**
Menghubungkan aplikasi Web CMS Next.js ke production API Backend (`https://api.sigerpangan.my.id/api/v1`). Pekerjaan meliputi pembuatan file `.env.local` untuk menyimpan variabel `NEXT_PUBLIC_API_URL` dan memperbarui `src/lib/api.ts` agar tidak terjadi *hardcode* ke *localhost*. Ini memastikan aplikasi web selalu menunjuk ke server produksi dengan aman.

> **[SPACE UNTUK SCREENSHOT]**  
> *Saran Screenshot: File `.env.local` dan isi kode `src/lib/api.ts`.*

---

## 2. Implementasi Sistem Login Standar
**Catatan Pengerjaan:**
Menyelesaikan halaman login (`src/app/login/page.tsx`) dengan mengimplementasikan validasi klien yang ketat menggunakan Zod dan React Hook Form. Frontend dirancang untuk memberikan *feedback* instan (seperti "Email tidak valid" atau "Password salah") tanpa membocorkan pesan *error internal server* ke publik. Token JWT yang didapat kemudian disimpan secara aman ke dalam `localStorage`.

> **[SPACE UNTUK SCREENSHOT]**  
> *Saran Screenshot: Halaman UI Login saat menampilkan error merah (Validasi Zod) dan saat berhasil login.*

---

## 3. Integrasi SSO Google OAuth 2.0 (Web Flow)
**Catatan Pengerjaan:**
Mengintegrasikan fitur "Masuk dengan Google" ke Frontend. Dikarenakan *flow* untuk web menggunakan pola *redirect callback*, telah dibuat rute khusus di `src/app/auth/callback/page.tsx` yang bertugas untuk menangkap parameter `token` JWT dari URL (yang di-*redirect* oleh backend), menyimpannya ke `localStorage`, dan mengalihkan pengguna ke halaman Dashboard tanpa perlu *reload* manual.

> **[SPACE UNTUK SCREENSHOT]**  
> *Saran Screenshot: Halaman pop-up "Sign in with Google" dan/atau halaman *loading* callback (`auth/callback/page.tsx`).*

---

## 4. Implementasi Role-Based Access Control (RBAC)
**Catatan Pengerjaan:**
Menerapkan sistem pelindung (*Guard*) berbasis Role pada lapisan Layout Dashboard (`src/app/(dashboard)/layout.tsx`). Sistem membaca dan memverifikasi token ke endpoint `/auth/me`. Jika akun yang login hanya memiliki role `USER` biasa (contohnya akun baru hasil SSO Google), sistem akan langsung menolak akses, menghapus token, dan memunculkan notifikasi *"Akses Ditolak: Web CMS hanya untuk Super Admin dan Surveyor"*.

> **[SPACE UNTUK SCREENSHOT]**  
> *Saran Screenshot: Notifikasi Alert / popup browser *"Akses Ditolak"* saat user biasa mencoba masuk ke Dashboard.*

---

## 5. Security & Pentesting UI Login
**Catatan Pengerjaan:**
Melakukan uji ketahanan UI pada form Login. Uji coba meliputi percobaan *SQL Injection* standar (seperti `' OR 1=1 --`), input kosong, dan percobaan kredensial asal. Hasil pentesting menunjukkan bahwa sistem frontend dan backend telah selaras mengamankan data; menolak *bad request*, mencegah *bypass*, dan *Browser Console* tetap bersih tanpa mengekspos rincian tumpukan error (stack trace) dari server ke client.

> **[SPACE UNTUK SCREENSHOT]**  
> *Saran Screenshot: Panel Inspect Element -> tab Network/Console yang menunjukkan bersihnya respon 401/400 dari API tanpa membocorkan error Node.js.*

---

## 6. Resolusi Konflik NestJS & Express Redirect (Bugfix)
**Catatan Pengerjaan:**
Menemukan dan memperbaiki *bug* `ERR_HTTP_HEADERS_SENT` yang terjadi di dalam Backend (NestJS). *Error* ini dipicu oleh tabrakan antara fungsi `res.redirect()` milik Express.js dengan mekanisme penanganan pengecualian (*Exception Filter*) bawaan NestJS saat melakukan validasi Google OAuth Guard. Solusi yang diimplementasikan adalah merombak alur pengalihan (*redirect*) menggunakan dekorator `@Redirect()` murni milik NestJS, sehingga memastikan *callback URL* ke *client* berjalan lancar dan mengembalikan token yang benar ke Web CMS.

> **[SPACE UNTUK SCREENSHOT]**  
> *Saran Screenshot: Kode `auth.controller.ts` bagian `@Redirect()` dan log Docker yang menunjukkan hilangnya pesan error.*

---

## 7. Penanganan Nginx 502 Bad Gateway & CORS Error
**Catatan Pengerjaan:**
Melakukan *troubleshooting* pada *API Gateway* (Nginx) yang menyebabkan Web CMS mendapatkan pesan *CORS Error* secara tiba-tiba di antarmuka *Login*. Ditemukan bahwa saat *container* Docker Backend (NestJS) dimuat ulang, Nginx masih menyimpan (*cache*) alamat IP internal Docker yang lama. Hal ini menyebabkan kegagalan koneksi (*Connection Refused*) dan Nginx mengembalikan respon HTML 502 yang diblokir oleh peramban klien sebagai *CORS Error*. Pemecahannya adalah melakukan penyegaran jaringan Nginx agar kembali memetakan *upstream router* dengan benar.

> **[SPACE UNTUK SCREENSHOT]**  
> *Saran Screenshot: Log Nginx Error (502 Bad Gateway/Connection Refused) dan terminal saat menjalankan `docker restart siger-nginx-dev`.*

---

## 8. Setup Keamanan Repositori (GitHub Rulesets & Branch Protection)
**Catatan Pengerjaan:**
Bertanggung jawab dalam mengonfigurasi tata kelola Repositori GitHub untuk tim. Menerapkan **GitHub Rulesets** (format JSON) untuk melindungi 4 cabang (*branch*) utama yaitu: `main`, `stage`, `dev/fe`, dan `dev/be`. Aturan ini mewajibkan setiap anggota tim (*kontributor*) untuk mengajukan *Pull Request* (PR) dan mendapatkan setidaknya 1 *Approval* sebelum kode dapat digabungkan. Di saat yang sama, mekanisme ini mengonfigurasi *Bypass List* agar Admin (Pemilik Repositori) dapat melakukan dorongan kode (*direct push*) tanpa hambatan.

> **[SPACE UNTUK SCREENSHOT]**  
> *Saran Screenshot: File `github-ruleset.json` dan/atau tampilan tab Rulesets di GitHub Repository Settings.*

---

*Laporan ini disusun sebagai dokumentasi teknis pengembangan sisi Frontend (Web CMS) platform Siger Pangan.*
