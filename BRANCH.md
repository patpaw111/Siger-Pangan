# 📁 Git Workflow & Branching Strategy - Siger Pangan

Dokumen ini berisi standar prosedur operasional untuk manajemen branch di repositori **Siger Pangan**. Semua anggota tim wajib mengikuti alur ini untuk menghindari konflik kode dan menjaga kestabilan aplikasi.

---

## 🌳 Struktur Hirarki Branch

Struktur branch diatur berdasarkan isolasi platform sebelum digabungkan ke lingkungan testing dan produksi.

| Level | Branch Name | Base Dari | Fungsi |
| :--- | :--- | :--- | :--- |
| **Lvl 1** | `main` | - | **Production:** Kode stabil, siap rilis (User Ready). |
| **Lvl 2** | `stage` | `main` | **Staging:** Integrasi antar platform untuk testing akhir. |
| **Lvl 3** | `dev/be` | `stage` | **Development Backend:** Base integrasi tim Backend. |
| **Lvl 3** | `dev/fe` | `stage` | **Development Frontend:** Base integrasi tim Frontend. |
| **Lvl 3** | `dev/mobile` | `stage` | **Development Mobile:** Base integrasi tim Mobile. |
| **Lvl 4** | `prefix-feature/*`| `dev/*` | **Feature Branch:** Tempat coding fitur individu. |

---

## 🛠 Panduan Workflow

### 1. Membuat Fitur Baru
Pilih base branch sesuai platform kamu, kemudian buat branch fitur baru.

**Contoh untuk Backend:**
```bash
git checkout dev/be
git pull origin dev/be
git checkout -b be-feature/nama-fitur-kamu

**Contoh untuk Dev/Mobile:**
```bash
git checkout dev/mobile
git pull origin dev/mobile
git checkout -b mobile-feature/nama-fitur-kamu