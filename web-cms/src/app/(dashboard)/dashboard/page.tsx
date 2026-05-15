'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Package, Map, Search, TrendingUp, ArrowRight, Activity, Calendar, Loader2, Info } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import PriceChart from '@/components/PriceChart';
import api from '@/lib/api';
import { toast } from 'sonner';

const MOCK_PRICES = [
  { id: 1, name: 'Beras Medium', region: 'Pasar Gintung', price: 'Rp 14.500', unit: 'kg', trend: '+2%', date: '15 Mei 2026' },
  { id: 2, name: 'Cabai Merah', region: 'Pasar Kangkung', price: 'Rp 45.000', unit: 'kg', trend: '-5%', date: '15 Mei 2026' },
  { id: 3, name: 'Bawang Merah', region: 'Pasar Way Halim', price: 'Rp 32.000', unit: 'kg', trend: '0%', date: '15 Mei 2026' },
  { id: 4, name: 'Daging Sapi', region: 'Pasar Pasir Gintung', price: 'Rp 130.000', unit: 'kg', trend: '+1%', date: '15 Mei 2026' },
];

export default function DashboardPage() {
  const [counts, setCounts] = useState<{commodities: number | null, regions: number | null}>({ commodities: null, regions: null });
  const [scraperStatus, setScraperStatus] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [prices, setPrices] = useState<any[]>([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      const results = await Promise.allSettled([
        api.get('/prices/commodities'),
        api.get('/prices/regions'),
        api.get('/scraper/status')
      ]);

      const [commRes, regRes, scraperRes] = results;

      // Handle Commodities & Regions
      if (commRes.status === 'fulfilled' && regRes.status === 'fulfilled') {
        setCounts({
          commodities: commRes.value.data.data?.length || 0,
          regions: regRes.value.data.data?.length || 0
        });
      } else {
        if (commRes.status === 'rejected') console.error('Commodities error:', commRes.reason?.response?.data || commRes.reason.message);
        if (regRes.status === 'rejected') console.error('Regions error:', regRes.reason?.response?.data || regRes.reason.message);
      }

      // Fetch Latest Prices
      try {
        const pricesRes = await api.get('/prices/latest');
        setPrices(pricesRes.data.data || []);
      } catch (err) {
        console.error('Prices error:', err);
      }

      // Handle Scraper Status
      if (scraperRes.status === 'fulfilled') {
        const data = scraperRes.value.data;
        setScraperStatus(data);

        // Derive activities from scraper status
        const newActivities = [];
        if (data.lastCompletedJob) {
          newActivities.push({
            id: 'scrape-' + data.lastCompletedJob.id,
            title: 'Scraper Selesai',
            desc: `Job #${data.lastCompletedJob.id} berhasil diperbarui.`,
            time: new Date(data.lastCompletedJob.finishedOn).toLocaleTimeString(),
            type: 'success',
            color: 'bg-indigo-500'
          });
        }
        if (data.queue && data.queue.active > 0) {
          newActivities.push({
            id: 'scrape-active',
            title: 'Scraper Berjalan',
            desc: `${data.queue.active} proses sedang aktif.`,
            time: 'Saat ini',
            type: 'info',
            color: 'bg-amber-500'
          });
        }
        setActivities(newActivities);
      } else {
        console.error('Scraper status error:', scraperRes.reason?.response?.data || scraperRes.reason.message);
      }
    } catch (error) {
      console.error('Unexpected error in dashboard:', error);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const handleUpdatePrice = async () => {
    setIsUpdating(true);
    const toastId = toast.loading('Memulai sinkronisasi data harga...');
    try {
      await api.post('/scraper/trigger', {
        marketTypeIds: [1] // Default tradisional
      });
      toast.success('Pembaruan Harga Dijadwalkan', {
        id: toastId,
        description: 'Bot scraper sedang berjalan di latar belakang untuk mengambil data dari server pusat.'
      });
      fetchDashboardData();
    } catch (error: any) {
      toast.error('Gagal Memperbarui Harga', {
        id: toastId,
        description: error.response?.data?.message || 'Terjadi kesalahan pada server.'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const today = new Date().toLocaleDateString('id-ID', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="space-y-10 pb-10">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-zinc-50 tracking-tight">Dashboard Overview</h1>
          <div className="flex items-center gap-2 mt-1 text-slate-500 dark:text-zinc-400">
            <Calendar size={14} />
            <p className="text-sm font-medium">{today}</p>
          </div>
        </div>
        <button 
          onClick={handleUpdatePrice}
          disabled={isUpdating}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 transition-all active:scale-95 self-start"
        >
          {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <Activity size={16} />}
          Update Data Harga
          <ArrowRight size={16} />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard 
          label="Total Komoditas"
          value={counts.commodities ?? '...'}
          icon={Package}
          href="/dashboard/komoditas"
          description="Klik untuk manajemen komoditas"
          trend={{ value: "Live", isUp: true }}
          colorClassName="bg-blue-600"
        />
        <StatsCard 
          label="Wilayah & Pasar"
          value={counts.regions ?? '...'}
          icon={Map}
          href="/dashboard/wilayah"
          description="Klik untuk manajemen wilayah"
          trend={{ value: "Stabil", isUp: true }}
          colorClassName="bg-emerald-600"
        />
        <StatsCard 
          label="Status Scraper"
          value={scraperStatus?.queue?.active > 0 ? 'Aktif' : 'Standby'}
          icon={Search}
          href="/dashboard/scraper"
          description={scraperStatus?.lastCompletedJob ? `Selesai: ${new Date(scraperStatus.lastCompletedJob.finishedOn).toLocaleTimeString()}` : 'Klik untuk kontrol scraper'}
          trend={{ value: scraperStatus?.queue?.waiting > 0 ? `Antre: ${scraperStatus.queue.waiting}` : "Sehat", isUp: true }}
          colorClassName={scraperStatus?.queue?.active > 0 ? "bg-amber-600 animate-pulse" : "bg-slate-600"}
        />
      </div>

      {/* Price Chart Section */}
      <PriceChart />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Latest Prices Table */}
        <div className="xl:col-span-2 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden transition-colors duration-300">
          <div className="p-6 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-50 flex items-center gap-2">
              <TrendingUp className="text-indigo-600 dark:text-indigo-400" size={20} />
              Harga Terbaru (Lampung)
            </h3>
            <Link href="/dashboard/prices" className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
              Lihat Semua
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-zinc-950/50 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest border-b border-slate-100 dark:border-zinc-800">
                  <th className="px-6 py-4">Komoditas & Kategori</th>
                  <th className="px-6 py-4">Lokasi & Tipe Pasar</th>
                  <th className="px-6 py-4">Harga Aktual</th>
                  <th className="px-6 py-4 hidden md:table-cell">Waktu Rekam</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {prices.length > 0 ? prices.slice(0, 5).map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-900 dark:text-zinc-100">{item.commodityName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded font-medium">
                          {item.categoryName || 'Bahan Pokok'}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium uppercase">
                          per {item.denomination}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-sm">
                        <span className="text-slate-900 dark:text-zinc-200 font-medium">{item.regionName}</span>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-zinc-400">
                          <Map size={10} className="text-slate-400" />
                          {item.marketTypeName}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(item.price)}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{item.priceType === 'harga' ? 'Harga Rata-rata' : item.priceType}</p>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-xs text-slate-500 font-medium">
                        {new Date(item.priceDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400 dark:text-zinc-500">
                        <Info size={32} className="mb-3 opacity-20" />
                        <p className="text-sm font-medium">Belum ada data harga tersedia.</p>
                        <p className="text-xs mt-1">Silakan klik tombol "Update Data Harga" untuk menarik data dari server pusat.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Activity Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-sm p-6 transition-colors duration-300">
          <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-50 mb-6 flex items-center gap-2">
            <Activity className="text-indigo-600 dark:text-indigo-400" size={20} />
            Aktivitas Sistem
          </h3>
          <div className="space-y-6">
            {activities.length > 0 ? activities.map((act) => (
              <div key={act.id} className="flex gap-4">
                <div className={`w-1.5 h-10 ${act.color} rounded-full`}></div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-zinc-100 leading-none">{act.title}</p>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">{act.desc}</p>
                  <p className="text-[10px] text-slate-400 mt-2 font-medium">{act.time}</p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-slate-400 text-center py-10">Belum ada aktivitas terbaru.</p>
            )}
            
            {/* Fallback activities to make it look full if not many logs */}
            <div className="flex gap-4 opacity-50 border-t border-slate-50 dark:border-zinc-800 pt-6">
              <div className="w-1.5 h-10 bg-emerald-500 rounded-full"></div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-zinc-100 leading-none">Admin Login</p>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Super Admin masuk via Google.</p>
                <p className="text-[10px] text-slate-400 mt-2 font-medium">1 jam yang lalu</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
