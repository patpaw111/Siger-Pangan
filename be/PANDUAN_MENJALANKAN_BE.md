# 📖 Panduan Menjalankan Backend (Untuk Tim FE & Mobile)

Dokumen ini berisi panduan step-by-step untuk menjalankan, menggunakan, dan memperbarui Backend Siger Pangan secara lokal. Karena kita menggunakan **Docker**, Anda **tidak perlu menginstal Node.js, PostgreSQL, atau Redis** secara manual di komputer Anda.

---

## 🚀 1. Persiapan Awal (Hanya Dilakukan Sekali)

1. Pastikan **Docker Desktop** sudah terinstal dan berjalan.
2. Buka terminal (atau command prompt/PowerShell) di folder root proyek `Siger-Pangan`.
3. Pindah ke branch `dev/be` untuk mendapatkan kode backend terbaru:
   ```bash
   git checkout dev/be
   ```
4. Tarik (_pull_) kode terbaru:
   ```bash
   git pull origin dev/be
   ```

---

## 🏃 2. Cara Menjalankan Backend (Setiap Kali Coding)

Kita sudah menyiapkan `docker-compose.dev.yml` agar backend bisa langsung jalan dengan satu perintah!

1. Buka terminal di folder **root proyek** (`Siger-Pangan`).
2. Jalankan perintah ini:
   ```bash
   docker compose -f docker-compose.dev.yml up -d
   ```
3. Tunggu hingga proses selesai. Perintah di atas akan menyalakan semua ini sekaligus di latar belakang (`-d` = detached):
   - **PostgreSQL** (Database) di Port `5432`
   - **Redis** (Cache) di Port `6379`
   - **Adminer** (Web Database GUI) di Port `8080`
   - **NestJS Service** (Backend API + Scraper) di Port `3000`

---

## ✅ 3. Cara Memastikan Backend Sudah Jalan

**A. Cek API via Browser:**
Buka link berikut di browser Anda:
👉 [http://localhost:3000/api/v1/prices/latest](http://localhost:3000/api/v1/prices/latest)
(Jika muncul JSON berisi data harga `price` komoditas, artinya backend Anda sudah berjalan lancar!)

**B. Cek Database via Adminer:**
Buka link berikut di browser:
👉 [http://localhost:8080](http://localhost:8080)
- **System**: PostgreSQL
- **Server**: postgres
- **Username**: siger_user
- **Password**: siger_dev_password
- **Database**: siger_pangan_dev

*(Untuk dokumentasi API lengkap, import `be/service-web-scraper/docs/openapi.json` ke dalam Apidog).*

---

## 🔄 4. Cara Update Backend Jika Ada Perubahan Baru

Jika tim Backend mengabarkan pesan seperti _"Bro, API-nya udah di-update ya ke branch dev/be"_, ini yang harus Anda lakukan:

**Step 1:** Tarik kode terbaru dari Git (jalankan di folder root proyek):
```bash
git checkout dev/be
git pull origin dev/be
```
*(Kembali ke branch tugas Anda jika sedang mengerjakan misal `dev/fe` setelah mengambil pull).*

**Step 2:** Memaksa Docker me-rebuild backend (_Build Ulang_):
Karena ada kode baru yang harus dimasukkan ke dalam wadah Docker, jalankan:
```bash
docker compose -f docker-compose.dev.yml up -d --build
```

**Selesai!** Backend otomatis terapdate dengan fitur terbaru.

---

## 🛑 5. Cara Mematikan Backend

Jika sudah selesai coding dan ingin menutup semuanya agar RAM tidak termakan:

```bash
# Matikan semua service backend
docker compose -f docker-compose.dev.yml down
```

### Trouble Shooting (Jika Error):
- _"Port is already allocated"_ : Artinya ada aplikasi lain yang memakai port 3000 (misal: frontend React) atau 5432 (PostgreSQL lokal yang Anda instal). Matikan aplikasi tersebut lebih dulu.
- Data API kurang / Data kosong: Trigger sinkronisasi ulang database dengan menjalankan request POST ke `http://localhost:3000/api/v1/scraper/trigger` tanpa body.
