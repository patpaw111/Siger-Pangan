'use client';

import React from 'react';
import { Package, Map, Search, TrendingUp } from 'lucide-react';
import StatsCard from '@/components/StatsCard';

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
        <p className="text-slate-500 mt-1">Ringkasan data harga pangan hari ini di Provinsi Lampung.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard 
          label="Total Komoditas"
          value="24"
          icon={Package}
          description="Beras, Cabai, Bawang, dll."
          trend={{ value: "12%", isUp: true }}
          colorClassName="bg-blue-600"
        />
        <StatsCard 
          label="Wilayah & Pasar"
          value="18"
          icon={Map}
          description="Pasar Gintung, Pasar Kangkung, dll."
          colorClassName="bg-emerald-600"
        />
        <StatsCard 
          label="Status Scraper"
          value="Aktif"
          icon={Search}
          description="Update terakhir: 15 menit lalu"
          trend={{ value: "Sehat", isUp: true }}
          colorClassName="bg-amber-600"
        />
      </div>

      {/* Info tambahan (Placeholder) */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <TrendingUp className="text-indigo-600" />
          Aktivitas Terakhir
        </h3>
        <p className="text-slate-400 text-sm">Data transaksi dan perubahan harga terbaru akan tampil di sini.</p>
      </div>
    </div>
  );
}
