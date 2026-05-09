# 🏗️ Analisis Arsitektur "True Microservices" - Siger Pangan

Jika kita mengadopsi struktur sejati Microservice untuk proyek Siger Pangan, sistem tidak lagi bergantung pada satu `siger-web-scraper` pusat. Kita akan memecah *Bounded Context* (domain tugas) ke dalam *service* yang 100% independen secara *database* maupun logika.

## 🛠️ Rancangan Topologi Modul (Yang Harus Kita Buat Baru)

Berikut adalah daftar `Service` beserta _Database_ yang harus kita buat untuk mencapai status *True Microservices*:

| Nama Microservice | Tech Stack | Database (Isolated) | Tanggung Jawab / Tugas Utama |
| :--- | :--- | :--- | :--- |
| **`service-api-gateway`** | NextJS / NestJS | *Tidak ada DB* | Berupa jembatan/BFF (Backend for Frontend). Tempat mem-filter semua request Mobile/Web lalu disebar ke service spesifik. (Routing). |
| **`service-auth`** | NestJS | **PostgreSQL** (`auth_db`) | Hanya berurusan dengan `Users`, *Roles*, Hash Password, dan validasi JWT Token. |
| **`service-catalog`** | NestJS | **PostgreSQL** (`catalog_db`) | Master Data. Hanya memuat tabel `Commodity` dan `Region` (Wilayah). |
| **`service-price-engine`** | NestJS | **PostgreSQL / TimescaleDB** (`price_db`) | Hanya menyimpan Harga Pangan secara *Time-Series*. (Tidak tahu nama berasnya apa, ia hanya menyimpan relasi `commodity_id`). |
| **`service-scraper`** | NestJS | **MongoDB** (`scraper_raw_db`) | Pekerja Keras. Hanya jalan buat nge-scrape BI, simpan data mentah ke Mongo, lalu mengirim sinyal (*Event*) ke `service-price-engine` untuk mencatat harga. |
| **`service-nlp`** *(Sudah Ada)* | Python/FastAPI| *Tidak ada DB* / `Redis` | Otak pemeroses teks menjadi *intent*. |
| **`service-chat-logger`** | NestJS | **MongoDB** (`chat_db`) | Menangani penyimpan riwayat jutaan teks Chat warga tanpa membebani database utama. |
| **`service-notifier`** | NestJS | **Redis** (Antrian) | Khusus untuk mem-blast *Push Notification* (FCM) dan memantau persentil kenaikan harga. |

---

## ✅ Keunggulan (Kenapa pola ini Keren Untuk Anda?)
1.  **Resiliensi Tinggi**: Jika *service-scraper* mengalami memory leak atau mati nge-hang (biasanya karena scraping), aplikasi Mobile tidak akan ikut mati. User masih bisa melihat riwayat harga dan nge-chat bot.
2.  **Skalabilitas Spesifik**: Bot NLP lagi viral di pakai 90.000 warga Lampung sehari? Kita tinggal perbanyak *container* `service-nlp` menjadi 5 biji. Service lain diam.
3.  **Teknologi Fleksibel (Polyglot)**: Kita bisa pakai *MongoDB* untuk log riwayat (karena sifatnya teks tidak terstruktur), lalu pakai *PostgreSQL* untuk data user, dan *Python* untuk NLP.
4.  **Portfolio Portofolio Kelas Dewa**: Membangun ini hingga selesai akan menempatkan arsitektur aplikasi Anda setara dengan sistem di Startup besar (Gojek / Tokopedia), sangat bagus untuk CV.

---

## ⚠️ Tantangan Sistem (Apa yang menanti kita Jika Sepakat?)
Konsep ini sangat ideal, tetapi bersiaplah menghadapi hal-hal berikut:

### 1. Komunikasi Antar-Service Akan Sulit (Network Overhead)
Di Monolith, kalau Anda mau tahu nama Beras dari harga *Rp.10.000*, Anda cukup me-*Join/Include/Relasi* database.
Di Microservices, **Anda tidak boleh menembus Database milik Service Lain**. Apabila *API Gateway* mau menampilkan harga, dia harus menembak API `service-price-engine`, lalu *price-engine* akan menyuruh *Gateway* (atau dirinya sendiri) menembak HTTP API ke `service-catalog` untuk mendapatkan _String_ Nama Beras. 

### 2. Kebutuhan Message Broker (Event Driven)
Karena service saling terpisah, ketika `service-scraper` mendapat harga terbaru, dia tidak bisa asal *"insert"* ke database sebelah. Dia harus melempar pesan pakai kurir "Event-Bus" **(Kafka, RabbitMQ, atau BullMQ / Redis)** yang kemudian pesannya "ditangkap" oleh `service-price-engine` dan `service-notifier`.

### 3. Sangat Memakan RAM Laptop / Server
Kita akan butuh menjalankan minimal:
*   6 container Nest.JS + 1 Python NLP
*   3 container Databse PostgreSQL yang beda _port_
*   1 container MongoDB
*   1 container Redis
*   1 API Gateway (Nginx / Nest)
Total **~13 Docker Containers**. VPS atau PC lokal Anda minimal disarankan memiliki RAM 8GB ke atas agar *developer experience*-nya nyaman saat me-*recompile* kodingan.

### 4. Pengerjaan Lebih Lama
Bagi tim Anda (Frontend / Mobile), mereka tidak akan merasa bedanya. Namun bagi Anda sebagai _Developer Backend_, fitur yang harusnya selesai setengah jam, mungkin akan memakan waktu 2 hingga 3 kali lebih lama karena anda harus menulis kodingan komunikasi lintas _network API_.

---

## 🎯 Kesimpulan & Rekomendasi
Pilihan ada di tangan Anda, sebagai penyusun Arsitektur Siger Pangan:

-   **Opsi A (Sisi Kiri - Clean Monolith/Modulith)**: Kita biarkan seperti sekarang dengan 1 Database SQL. Semua fitur ditaruh beda *Module Folder*. Cepat selesai, murah di VPS, gampang dimaintain. Tim FE/Mobile cepat bahagia.
-   **Opsi B (Sisi Kanan - True Microservices)**: Kita bongkar ulang dari sekarang. Kita buatkan wadah NestJS terpisah untuk Auth, Catalog, dll beserta *connection string* database yang beda-beda, layaknya startup betulan.

(Apapun pilihan Anda, saya sebagai AI siap membantu Anda meng-koding arsitektur tersebut!).
