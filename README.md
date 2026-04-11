
# Siger Pangan 🌾
**Platform Informasi Harga Pangan — Provinsi Lampung**

> Microservices architecture untuk memantau harga pangan real-time, dilengkapi chatbot berbasis NLP.

---

## 🗂️ Struktur Proyek

```
Siger-Pangan/
├── docker-compose.yml          ← Semua service production
├── docker-compose.dev.yml      ← Override untuk development
├── .env.example                ← Template environment variables root
│
├── be/
│   ├── service-web-scraper/    ← 🟦 NestJS (Core, Scraper, API Gateway)
│   └── service-nlp/            ← 🟨 FastAPI (NLP Processor via gRPC)
│
├── proto/
│   └── nlp.proto               ← gRPC contract (single source of truth)
│
├── nginx/
│   └── nginx.conf              ← API Gateway config
│
└── infra/
    ├── postgres/init.sql       ← Database schema & seed data
    ├── prometheus/             ← Metrics config
    └── grafana/                ← Dashboard & datasource config
```

---

## 🔧 Tech Stack

| Layer | Teknologi | Fungsi |
|---|---|---|
| API Gateway | **Nginx** | Load balancing, rate limiting, SSL |
| Core Service | **NestJS** | REST API, scraping, orchestrator |
| NLP Service | **FastAPI + gRPC** | Intent classification, entity extraction |
| Database | **PostgreSQL** | Penyimpanan data utama |
| Cache | **Redis** | Cache harga, session, BullMQ broker |
| Job Queue | **BullMQ** | Jadwal & antrian scraping |
| Scraper | **Playwright** | Web scraping PIHPS Nasional |
| Search | **MeiliSearch** | Full-text search komoditas |
| Monitoring | **Prometheus + Grafana** | Health & performance metrics |
| Container | **Docker** | Isolasi & portabilitas service |

---

## 🚀 Cara Menjalankan

### Prerequisites
- Docker Desktop sudah terinstall
- Git

### Development (Infra saja via Docker, service di host)

```bash
# 1. Clone repository
git clone <repo-url>
cd Siger-Pangan

# 2. Siapkan environment variables
cp .env.example .env
cp be/service-web-scraper/.env.example be/service-web-scraper/.env
cp be/service-nlp/.env.example be/service-nlp/.env

# 3. Jalankan infrastruktur (PostgreSQL, Redis, MeiliSearch, Prometheus, Grafana)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres redis meilisearch prometheus grafana

# 4. Jalankan NestJS di host
cd be/service-web-scraper
npm install
npm run start:dev

# 5. Jalankan FastAPI di host (terminal baru)
cd be/service-nlp
pip install -r requirements.txt
python -m spacy download xx_ent_wiki_sm
python -m app.server
```

### Production (Semua via Docker)

```bash
# Build dan jalankan semua service
docker compose up -d --build

# Lihat log
docker compose logs -f service-nestjs
docker compose logs -f service-fastapi
```

---

## 🌐 Endpoint & Dashboard

| Service | URL | Keterangan |
|---|---|---|
| API (via Nginx) | http://localhost/api/v1/ | REST API utama |
| NestJS (langsung) | http://localhost:3000 | Dev only |
| FastAPI Health | http://localhost:8000/health | Dev only |
| MeiliSearch | http://localhost:7700 | Search engine UI |
| Grafana | http://localhost:3001 | Monitoring dashboard |
| Prometheus | http://localhost:9090 | Raw metrics |

---

## 📡 Data Flow

```
[PIHPS Website]
      ↓ Playwright (Setiap 6 jam via BullMQ CronJob)
[NestJS Scraper]
      ↓ Upsert data
[PostgreSQL] ←→ [Redis Cache]
      ↓
[Flutter / Next.js] ← GET /api/v1/prices

[Flutter User Chat]
      ↓ POST /api/v1/chatbot/message
[NestJS ChatbotService]
      ↓ gRPC: AnalyzeMessage()
[FastAPI NLP]
      ↓ Intent + Entity
[NestJS] → Query DB → Format Respons
      ↓
[Flutter] ← Jawaban chatbot
```

---

## 📁 Environment Variables

Setiap service memiliki file `.env.example`. Salin dan isi sebelum menjalankan:

- `/.env.example` — Variabel root (PostgreSQL, Redis, dll)
- `/be/service-web-scraper/.env.example` — Konfigurasi NestJS
- `/be/service-nlp/.env.example` — Konfigurasi FastAPI

---

## 👥 Kontribusi

1. Buat branch baru: `git checkout -b feature/nama-fitur`
2. Commit perubahan
3. Buat Pull Request ke branch `develop`
