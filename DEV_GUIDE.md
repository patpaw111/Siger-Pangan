# 📖 Development Guide - Siger Pangan

Dokumen ini berisi standar prosedur operasional untuk pengembangan proyek **Siger Pangan**. Semua pengembang wajib mengikuti alur ini untuk menjaga kualitas kode dan kerapihan riwayat Git.

---

## 🔍 1. Riset Awal & Konteks
Sebelum melakukan perubahan kode, pengembang **WAJIB** memahami standar proyek melalui file berikut:
- **[BRANCH.md](file:///c:/Users/User/Music/PBS-PROJECT/Siger-Pangan/BRANCH.md)**: Aturan penamaan branch dan alur workflow Git.
- **[docs/](file:///c:/Users/User/Music/PBS-PROJECT/Siger-Pangan/docs/)**: Dokumentasi teknis tambahan.
- **[FE_API_GUIDE.md](file:///c:/Users/User/Music/PBS-PROJECT/Siger-Pangan/FE_API_GUIDE.md)**: Panduan integrasi API untuk Frontend.

## 🌿 2. Manajemen Git & Branch
Semua fitur baru harus dikerjakan dengan mengikuti alur branch yang ketat:
- **Jangan bekerja langsung di branch utama integrasi (`dev/fe`, `dev/be`, dll)**.
- Buat branch fitur baru dari base branch yang sesuai.
  - Contoh: `fe-feature/nama-fitur` atau `be-feature/nama-fitur`.
- Gunakan branch khusus untuk setiap scope pekerjaan (misal: `dashboard`, `foundation`, `auth`, dll).
- Lakukan merge ke branch integrasi setelah fitur selesai diuji secara lokal.

## 🛠 3. Strategi Commit (Granular Commits)
Gunakan riwayat commit yang mendetail untuk memudahkan pelacakan perubahan:
- **DILARANG** melakukan satu commit besar untuk banyak perubahan (Big Commit).
- Lakukan commit secara **bertahap** (step-by-step) untuk setiap langkah kecil.
- Gunakan format **Conventional Commits**:
  - `feat(...)`: Fitur baru.
  - `fix(...)`: Perbaikan bug.
  - `chore(...)`: Maintenance/config.
  - `docs(...)`: Dokumentasi.
  - `style(...)`: Perubahan UI/styling tanpa perubahan logika.

## 🚀 4. Alur Eksekusi
1. **Planning**: Tentukan langkah-langkah kecil untuk implementasi fitur.
2. **Development**: Implementasi kode satu per satu langkah.
3. **Verification**: Jalankan aplikasi secara lokal untuk memastikan tidak ada error sebelum melakukan push.

---
*Panduan ini dibuat untuk memastikan proyek tetap terorganisir dan profesional.*
