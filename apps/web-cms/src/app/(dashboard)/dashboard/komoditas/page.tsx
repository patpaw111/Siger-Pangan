import React from 'react';

export default function KomoditasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Manajemen Komoditas</h1>
        <p className="text-slate-500 mt-1">Kelola data pangan (Beras, Cabai, Bawang, dsb).</p>
      </div>

      <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-sm text-center">
        <p className="text-slate-400">Tabel data komoditas akan muncul di sini.</p>
      </div>
    </div>
  );
}
