# 📖 Panduan Integrasi Frontend — Siger Pangan API

> Dokumen ini menjelaskan **cara menggunakan setiap service backend** dari sisi frontend (Mobile Flutter & Website CMS).
> Terakhir diperbarui: 3 Mei 2026

---

## 📋 Daftar Isi

1. [Setup & Base URL](#1-setup--base-url)
2. [Service Auth — Autentikasi & User](#2-service-auth--autentikasi--user)
3. [Service Catalog — Master Data](#3-service-catalog--master-data)
4. [Service Web Scraper — Data Harga](#4-service-web-scraper--data-harga)
5. [Chatbot AI — Asisten Harga](#5-chatbot-ai--asisten-harga)
6. [Urutan Fitur yang Harus Dibuat](#6-urutan-fitur-yang-harus-dibuat)

---

## 1. Setup & Base URL

### Base URL

| Environment | URL |
|---|---|
| **Production** | `https://api.sigerpangan.my.id` |
| **Local Dev** | `http://localhost:8081` |
| **Direct (tanpa Nginx)** | Auth: `http://localhost:3001`, Catalog: `http://localhost:3002`, Scraper: `http://localhost:3000` |

### Header Autentikasi

Semua endpoint yang butuh login harus menyertakan header:

```
Authorization: Bearer <access_token>
```

Token didapat dari endpoint login atau Google Sign-In.

### Sistem Role

| Role | Platform | Hak Akses |
|---|---|---|
| `SUPER_ADMIN` | Website CMS | Akses penuh: CRUD komoditas, wilayah, user, trigger scraper |
| `SURVEYOR` | Website CMS | Hanya baca data + input harga manual (future) |
| `USER` | Mobile App | Lihat harga, chatbot, notifikasi |

---

## 2. Service Auth — Autentikasi & User

### 2.1 Registrasi (Mobile App)

User biasa mendaftar lewat Mobile App.

```
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "minimal6karakter"
}
```

**Response (201):**
```json
{
  "id": "uuid-here",
  "email": "user@example.com",
  "role": "USER",
  "created_at": "2026-05-03T..."
}
```

> ⚠️ Role otomatis dikunci menjadi `USER`. Tidak bisa mendaftar sebagai admin dari endpoint ini.

---

### 2.2 Login (Semua Platform)

```
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@sigerpangan.my.id",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "597f4ef5-...",
    "email": "admin@sigerpangan.my.id",
    "role": "SUPER_ADMIN"
  }
}
```

**Simpan `access_token` untuk dipakai di semua request selanjutnya.**

#### Di Flutter:
```dart
// Simpan token
final prefs = await SharedPreferences.getInstance();
await prefs.setString('access_token', response['access_token']);

// Pakai di request berikutnya
final headers = {
  'Authorization': 'Bearer ${prefs.getString('access_token')}',
  'Content-Type': 'application/json',
};
```

---

### 2.3 Login Google (Mobile App — Native, Tanpa Browser)

**Ini yang dipakai di Flutter.** User tidak pindah ke browser.

#### Setup Flutter:

1. Tambahkan dependency di `pubspec.yaml`:
   ```yaml
   dependencies:
     google_sign_in: ^6.2.1
   ```

2. Kode login:
   ```dart
   import 'package:google_sign_in/google_sign_in.dart';
   
   // Inisialisasi dengan Web Client ID (WAJIB untuk dapat idToken)
   final _googleSignIn = GoogleSignIn(
     serverClientId: '345765731288-ocnhm3r8co9gur38iigghra9ajaa9075.apps.googleusercontent.com',
   );
   
   Future<void> signInWithGoogle() async {
     // 1. Popup Google Sign-In muncul di dalam app
     final account = await _googleSignIn.signIn();
     if (account == null) return; // User cancel
   
     // 2. Dapatkan idToken
     final auth = await account.authentication;
     final idToken = auth.idToken;
   
     // 3. Kirim ke backend
     final response = await http.post(
       Uri.parse('$baseUrl/api/v1/auth/google/mobile'),
       headers: {'Content-Type': 'application/json'},
       body: jsonEncode({'idToken': idToken}),
     );
   
     // 4. Backend mengembalikan JWT + data user
     final data = jsonDecode(response.body);
     // data = {
     //   "access_token": "eyJ...",
     //   "user": {
     //     "id": "uuid",
     //     "email": "user@gmail.com",
     //     "name": "Nama User",
     //     "avatar_url": "https://lh3.googleusercontent.com/...",
     //     "role": "USER"
     //   }
     // }
   
     // 5. Simpan token & navigate ke home
     await prefs.setString('access_token', data['access_token']);
   }
   ```

> 🔑 **Web Client ID:** `345765731288-ocnhm3r8co9gur38iigghra9ajaa9075.apps.googleusercontent.com`
>
> Ini BUKAN Android Client ID. Web Client ID dipakai agar Flutter bisa mendapat `idToken` yang bisa diverifikasi oleh backend.

---

### 2.4 Login Google (Website CMS — Redirect)

Untuk website, buka URL ini di browser:

```
GET /api/v1/auth/google
```

Browser akan redirect ke Google → user pilih akun → redirect kembali ke app via deeplink `sigerpangan://auth?token=JWT_TOKEN`.

---

### 2.5 Ambil Profil User (Cek Token Masih Valid)

```
GET /api/v1/auth/me
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "userId": "597f4ef5-...",
  "email": "user@gmail.com",
  "role": "USER"
}
```

**Gunakan ini saat app pertama kali dibuka** untuk cek apakah token masih valid. Jika dapat 401, arahkan ke halaman login.

---

### 2.6 Buat User oleh Admin (Website CMS)

```
POST /api/v1/auth/users
Authorization: Bearer <token_super_admin>
Content-Type: application/json

{
  "email": "surveyor.tugu@sigerpangan.my.id",
  "password": "password123",
  "role": "SURVEYOR"
}
```

> Hanya `SUPER_ADMIN` yang bisa mengakses endpoint ini.

---

## 3. Service Catalog — Master Data

### 3.1 Daftar Komoditas

```
GET /api/v1/catalog/commodities
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "uuid-1",
    "name": "Beras Premium",
    "unit": "kg",
    "image_url": null
  },
  {
    "id": "uuid-2",
    "name": "Cabai Merah Keriting",
    "unit": "kg",
    "image_url": null
  }
]
```

#### Di Flutter — tampilkan di dropdown/list:
```dart
final response = await http.get(
  Uri.parse('$baseUrl/api/v1/catalog/commodities'),
  headers: authHeaders,
);
final commodities = jsonDecode(response.body) as List;
// Tampilkan di ListView atau DropdownButton
```

---

### 3.2 Daftar Wilayah/Pasar

```
GET /api/v1/catalog/regions
Authorization: Bearer <token>
```

**Response:** Array objek Region dengan koordinat GPS (`latitude`, `longitude`) untuk ditampilkan di **peta (Google Maps)**.

---

### 3.3 CRUD (Admin Only)

| Method | Endpoint | Keterangan |
|---|---|---|
| `POST` | `/api/v1/catalog/commodities` | Tambah komoditas baru |
| `PATCH` | `/api/v1/catalog/commodities/:id` | Update komoditas |
| `DELETE` | `/api/v1/catalog/commodities/:id` | Hapus komoditas |
| `POST` | `/api/v1/catalog/regions` | Tambah wilayah/pasar |
| `PATCH` | `/api/v1/catalog/regions/:id` | Update wilayah |
| `DELETE` | `/api/v1/catalog/regions/:id` | Hapus wilayah |

> Semua CRUD hanya bisa diakses oleh `SUPER_ADMIN`.

---

## 4. Service Web Scraper — Data Harga

**Ini adalah service utama yang dipakai Mobile App.** Data harga berasal dari scraping otomatis harian dari Bank Indonesia.

### 4.1 Harga Terbaru (Halaman Utama Mobile)

```
GET /api/v1/prices/latest
GET /api/v1/prices/latest?marketTypeId=1
GET /api/v1/prices/latest?marketTypeId=1&kabupaten=Bandar Lampung
```

| Parameter | Tipe | Default | Keterangan |
|---|---|---|---|
| `marketTypeId` | integer | 1 | 1=Tradisional, 2=Modern, 3=Pedagang Besar |
| `kabupaten` | string | (semua) | Filter berdasarkan kabupaten |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "commodityId": "com_3",
      "commodityName": "Beras Kualitas Medium I",
      "price": 12500,
      "denomination": "Kg",
      "regionName": "Bandar Lampung",
      "priceDate": "2026-05-02"
    }
  ],
  "total": 21
}
```

> 💰 **Harga dalam Rupiah (integer).** Format di Flutter: `NumberFormat.currency(locale: 'id', symbol: 'Rp', decimalDigits: 0).format(price)`

#### Di Flutter — Tampilkan di Home Screen:
```dart
final resp = await http.get(Uri.parse('$baseUrl/api/v1/prices/latest?marketTypeId=1'));
final data = jsonDecode(resp.body);
final prices = data['data'] as List;

// Tampilkan dalam Card/ListTile
for (final item in prices) {
  print('${item['commodityName']}: Rp${item['price']}/${item['denomination']}');
}
```

---

### 4.2 Histori Harga (Grafik/Chart)

```
GET /api/v1/prices/history?commodityId=com_3&days=30
GET /api/v1/prices/history?commodityName=Beras&days=7&kabupaten=Metro
```

| Parameter | Tipe | Default | Keterangan |
|---|---|---|---|
| `commodityId` | string | - | ID komoditas (com_1 s/d com_21) |
| `commodityName` | string | - | Alternatif: cari berdasarkan nama |
| `marketTypeId` | integer | 1 | Tipe pasar |
| `kabupaten` | string | (semua) | Filter kabupaten |
| `days` | integer | 30 | Rentang hari: 7, 30, atau 90 |

**Response:** Array data harga per tanggal → **gunakan untuk line chart.**

#### Di Flutter — Chart Package:
```dart
// Pakai package: fl_chart atau syncfusion_flutter_charts
// Data dari API sudah urut berdasarkan tanggal
```

---

### 4.3 Perbandingan Harga Antar Kabupaten (Heat Map)

```
GET /api/v1/prices/compare?commodityId=com_3
GET /api/v1/prices/compare?commodityId=com_3&date=2026-05-02
```

**Response:**
```json
{
  "success": true,
  "data": {
    "Bandar Lampung": 12500,
    "Metro": 13000,
    "Pringsewu": 12200,
    "Tanggamus": 12800
  }
}
```

#### Di Flutter — Tampilkan sebagai:
- **Heat Map** di peta Google Maps (warna berdasarkan harga)
- **Bar Chart** perbandingan antar kabupaten
- **Tabel** ranking harga termurah → termahal

---

### 4.4 Daftar Komoditas & Wilayah yang Tersedia

Untuk mengisi **dropdown filter** di Mobile App:

```
GET /api/v1/prices/commodities    → daftar komoditas yang ada datanya
GET /api/v1/prices/regions        → daftar kabupaten yang ada datanya
```

---

## 5. Chatbot AI — Asisten Harga

### 5.1 Kirim Pesan ke Chatbot

```
POST /api/v1/chatbot/chat
Content-Type: application/json

{
  "text": "Berapa harga beras di Bandar Lampung?"
}
```

**Response:**
```json
{
  "type": "rich_data",
  "response": "Harga Beras Kualitas Medium I di Bandar Lampung pada tanggal 2026-05-02 adalah Rp12500 per Kg.",
  "nlpContext": {
    "intent": "query_price",
    "confidence": 0.9,
    "commodity": "Beras Medium",
    "kabupaten": "Bandar Lampung"
  },
  "data": {
    "commodityName": "Beras Kualitas Medium I",
    "price": 12500,
    "denomination": "Kg",
    "regionName": "Bandar Lampung",
    "priceDate": "2026-05-02"
  }
}
```

### Response Types:

| Type | Keterangan | Cara Tampilkan |
|---|---|---|
| `text` | Jawaban teks biasa | Chat bubble biasa |
| `rich_data` | Jawaban + data harga | Chat bubble + Card harga |
| `error` | Service sedang error | Pesan error |

### Contoh Pertanyaan yang Didukung:

| Pertanyaan | Intent |
|---|---|
| "Berapa harga beras di Bandar Lampung?" | `query_price` |
| "Bandingkan harga daging sapi" | `compare_price` |
| "Harga cabai minggu ini naik atau turun?" | `price_trend` |
| "Komoditas apa saja yang dipantau?" | `list_commodity` |
| "Daerah mana saja yang tercakup?" | `list_region` |
| "Halo" / "Selamat pagi" | `greet` |
| "Bisa bantu apa?" | `help` |

#### Di Flutter — Chat UI:
```dart
// Pakai package: flutter_chat_ui atau buat sendiri
// Kirim pesan user → POST /chatbot/chat → tampilkan response di chat bubble
// Jika type == "rich_data", tampilkan Card tambahan dengan data harga
```

---

## 6. Urutan Fitur yang Harus Dibuat

### 📱 Mobile App (Flutter) — Urutan Pengerjaan

```
Minggu 1: Foundation
├── [1] Splash Screen + Onboarding
├── [2] Login (Email/Password)
├── [3] Login Google (google_sign_in)
├── [4] Register
└── [5] Persistent Auth (simpan token, auto-login)

Minggu 2: Fitur Utama
├── [6] Home Screen — Daftar harga terbaru (GET /prices/latest)
├── [7] Filter harga (dropdown komoditas + kabupaten)
├── [8] Detail Komoditas — Grafik tren harga (GET /prices/history)
└── [9] Perbandingan Harga — Chart/Tabel (GET /prices/compare)

Minggu 3: Fitur Lanjutan
├── [10] Chatbot AI (POST /chatbot/chat)
├── [11] Peta Harga — Google Maps + marker harga per kabupaten
├── [12] Profil User (GET /auth/me)
└── [13] Settings & Logout

Minggu 4: Polish
├── [14] Pull-to-refresh + Loading states
├── [15] Offline cache (simpan harga terakhir)
├── [16] Push Notification (future — FCM)
└── [17] Build APK/AAB untuk testing
```

### 🌐 Website CMS (Next.js) — Urutan Pengerjaan

```
Minggu 1: Foundation
├── [1] Login Admin (POST /auth/login)
├── [2] Dashboard — Statistik ringkasan harga
└── [3] Sidebar Navigation

Minggu 2: CRUD
├── [4] Manajemen Komoditas (CRUD /catalog/commodities)
├── [5] Manajemen Wilayah (CRUD /catalog/regions)
└── [6] Manajemen User (POST /auth/users)

Minggu 3: Monitoring
├── [7] Tabel Harga Real-time (GET /prices/latest)
├── [8] Grafik Tren Harga (GET /prices/history)
├── [9] Scraper Status (GET /scraper/status)
└── [10] Trigger Scraper Manual (POST /scraper/trigger)
```

---

## 📎 File Referensi

| File | Keterangan |
|---|---|
| `docs/siger-pangan-api.openapi.json` | **Import ke Apidog** untuk testing lengkap |
| `docs/MOBILE_DEV_GUIDE.md` | Setup awal project Flutter |
| `docs/FRONTEND_INTEGRATION_GUIDE.md` | Dokumen ini |
| `be/PANDUAN_MENJALANKAN_BE.md` | Cara menjalankan backend lokal |

---

## ❓ FAQ

**Q: Harga dalam format apa?**
A: Integer dalam Rupiah. Contoh: `12500` = Rp12.500

**Q: Endpoint mana yang butuh login?**
A: Semua kecuali `POST /auth/register`, `POST /auth/login`, `POST /auth/google/mobile`, dan `GET /auth/google`.

**Q: Bagaimana kalau token expired?**
A: Backend mengembalikan `401 Unauthorized`. Di Flutter, tangkap error ini dan arahkan ke halaman login.

**Q: Data harga diupdate kapan?**
A: Scraping otomatis setiap hari jam 06:00 WIB dari Bank Indonesia.
