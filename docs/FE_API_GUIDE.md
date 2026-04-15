# 📚 Panduan Siger Pangan API — Untuk Tim Frontend & Mobile

Dokumentasi ini dibuat khusus sebagai panduan integrasi bagi tim Frontend (Web) & Mobile (Flutter/Kotlin) untuk memakai fitur **AI NLP Chatbot** dan API Backend Siger Pangan.

---

## 🛠️ 1. Persiapan Infrastruktur (Backend & Database)
Sebelum teman-teman Frontend dan Mobile bisa mencoba API, arsitektur *Backend Siger Pangan* di laptop `localhost` perlu dihidupkan terlebih dahulu.

**Langkah-langkah:**
1. Pastikan aplikasi **Docker Desktop** sudah menyala (hijau `Running`).
2. Beralihlah ke *branch* repositori Siger Pangan yang aktif (contoh: `be-feature/service-nlp`).
3. Buka Terminal di folder utama *root* project.
4. Nyalakan seluruh mesih (*Scraper, PostgreSQL, Redis, dan NLP*) dengan perintah ini:
   ```bash
   docker compose -f docker-compose.dev.yml up -d --build
   ```
5. Tunggu sekitar 1–2 menit sampai semuanya tercetak tulisan `Healthy` dan `Started`.
6. Jika Anda ingin memantaunya (misal Backend hang atau ada Error HTTP 500), pantau log secara langsung dengan perintah:
   ```bash
   docker logs -f siger-web-scraper-dev
   ```

---

## ⚡ 2. Base URL Utama

Aplikasi Siger Pangan berjalan lokal di **Port 3000** (Service NestJS).
Semua *Endpoint* wajib mengarah ke format berikut:

```http
http://localhost:3000/api/v1
```
*(Catatan buat Tim Mobile: Kalau Anda ngetes dari HP/Emulator Android, ganti `localhost` ke IP Address WIFI Komputer Server / Laptop masing-masing. Jangan lupa sesuaikan Port-nya ke `3000`)*.

---

## 🤖 3. API Chatbot Pintar Bersuara NLP

Endpoint ini menerima "Ketikkan Chat dari User" (mentahan alami), melemparnya ke server Python NLP di *background*, mengekstrak maksudnya (entity), lalu mengeluarkan *response* ramah ditambah kumpulan data *JSON* harga asli.

**🔹 Request**
* **Method:** `POST`
* **Route:** `/chatbot/chat`
* **Headers:** `Content-Type: application/json`
* **Body (JSON):**

```json
{
  "text": "Berapa harga daging sapi di bandar lampung dong min?"
}
```

**🔹 Response `(Status: 200 OK)`**
Sistem akan mengembalikan format yang sangat rapi dan siap dirender di aplikasi chat Web/Mobile. Di bawah ini adalah spesifikasi kuncinya (`type`):

```json
{
  "type": "data",
  "response": "Berikut harga yang Anda cari:",
  "nlpContext": {
    "intent": "query_price",
    "confidence": 0.95,
    "timeExpression": "latest"
  },
  "data": {
     "komoditi": "Daging Sapi",
     "wilayah": "Kota Bandar Lampung",
     "harga": "Rp 135.000",
     "tanggal": "15-Apr-2026"
  }
}
```

### Penjelasan Variabel `type` untuk Logika Perenderan Frontend:
Tim Mobile / React JS WAJIB mengecek properti `type` dari respons ini:
*   `"type": "text"` 👉 Artinya balasannya cuma _Text Murni_ biasa (sapaan / bot gagal memahami konteks). Anda cukup membuatkan _Buble Chat_ teks saja.
*   `"type": "data"` 👉 Artinya harga DITEMUKAN. Anda diwajibkan nge-render ulang bentuk `data` menjadi kartu tabel keren di UI Chat HP.
*   `"type": "menu"` 👉 (Opsional kedepannya) Bot mencoba menyajikan menu pilihan.

---

## 📝 4. API Bantuan (Scraper Manual & Harga)

Selain bot chat di atas, sebenarnya tim Frontend juga bebas memakai endpoint ini (biasanya dipakai untuk nampilin Menu Harga di Dashboard Utama aplikasi, tanpa butuh di-chat):

### Ambil Data Harga Komoditas Terakhir
**Endpoint:** `GET /prices/latest`
**Query Prams (Opsional):** `?commodity_id=1&region_id=0`
**Fungsi**: Memanggil seluruh / sebagian filter data harga pangan yg telah di-scrape.

### Trigger Scraper Paksa (Admin Only)
**Endpoint:** `POST /scraper/trigger`
**Fungsi**: Memaksa agar server mengambil data HTTP BI hari ini (BI Web) secara real-time. Biasa dirangkap di halaman tombol *Reload Data Admin*.

---

## 🐛 5. Menguji / Testing Singkat Tanpa Postman

Untuk tim yang tidak mau repot buka *Postman / Hoppscotch*, kami punya script sakti di repositori (sudah jadi satu).
Anda cukup masuk ke terminal `Powershell` bawaan Windows, lalu panggil ini:

```powershell
.\test-bot.ps1 -Pertanyaan "berapa harga beras hari ini?"
```

Script akan menghantam API Backend dan mem-format keluaran log-nya cantik memisahkan JSON untuk Anda di-monitor warna warni di Layar Hitam!
