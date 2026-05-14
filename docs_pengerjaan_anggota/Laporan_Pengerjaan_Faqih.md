Nama    : Muhammad Nur Imam Faqih Abdullah
Kelas   : IF 23 FX
NPM     : 23312181

Laporan Pengerjaan Backend Siger Pangan:

1. Perancangan Arsitektur Sistem & Microservices
- Merancang dan memecah backend menjadi beberapa microservice mandiri agar lebih scalable.
- Setiap service berjalan di dalam container Docker yang terisolasi. Service yang dibuat meliputi:
  a. Service Auth: Mengelola autentikasi (JWT & Google OAuth 2.0 Web/Mobile) dan Role-Based Access Control (RBAC).
  b. Service Catalog: Mengelola master data komoditas pangan dan wilayah/pasar.
  c. Service Web Scraper: Mengambil data harga pangan dari API Bank Indonesia secara otomatis menggunakan cron job dan BullMQ.
  d. Service NLP: Chatbot AI berbasis FastAPI dan Google Gemini untuk menjawab query natural language seputar harga.
- Menggunakan Nginx sebagai API Gateway untuk melakukan reverse proxy dan me-routing traffic ke masing-masing container microservice.

[MASUKKAN SCREENSHOT: Terminal status "docker ps" yang menampilkan semua container siger- berjalan]

2. Setup Database & Caching
- Menggunakan PostgreSQL sebagai database utama, lengkap dengan skema dan seed data awal (15 kabupaten/kota Lampung, 16 komoditas).
- Mengimplementasikan Redis untuk caching pada setiap endpoint API dengan Time-To-Live (TTL) 1 jam agar response time lebih cepat dan mengurangi beban server.

[MASUKKAN SCREENSHOT: Tampilan tabel/data di DBeaver atau PostgreSQL]

3. Setup Domain & Cloudflare Tunnel
- Membeli dan melakukan setup custom domain pribadi untuk backend: `sigerpangan.my.id`.
- Menggunakan Cloudflare Tunnel (cloudflared) untuk mengekspos API lokal/server ke public internet dengan aman tanpa harus membuka port router secara manual (port-forwarding).
- Trafik dari domain dialihkan secara aman langsung ke Nginx API Gateway.

[MASUKKAN SCREENSHOT: Dashboard Cloudflare Tunnel yang berstatus "Healthy" atau pengaturan DNS Domain]

4. Dokumentasi API & Panduan Integrasi Frontend
- Menyusun dokumentasi spesifikasi OpenAPI/Swagger (siger-pangan-api.openapi.json) secara lengkap untuk seluruh endpoint.
- Membuat panduan integrasi sistem untuk tim Frontend Mobile (Flutter) dan Web CMS (Next.js) yang menjelaskan cara mengakses dan menampilkan data dari masing-masing API.

[MASUKKAN SCREENSHOT: Tampilan endpoint di Apidog/Postman atau file spesifikasi JSON di VSCode]

---
Tech Stack Keseluruhan:
NestJS, FastAPI, PostgreSQL, Redis, BullMQ, Docker, Nginx, Cloudflare Tunnel, gRPC, Google Auth Library, Google Generative AI (Gemini).
