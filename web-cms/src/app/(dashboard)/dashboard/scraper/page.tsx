'use client';

import React, { useState, useEffect } from 'react';
import { Play, Activity, Clock, AlertTriangle, CheckCircle2, RefreshCw, Terminal } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

interface ScraperStatus {
  isScraping: boolean;
  lastRun?: string;
  error?: string | null;
  message?: string;
  activeJobs?: number;
  waitingJobs?: number;
}

export default function ScraperPage() {
  const [status, setStatus] = useState<ScraperStatus>({ isScraping: false });
  const [isLoading, setIsLoading] = useState(true);
  const [isTriggering, setIsTriggering] = useState(false);

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/scraper/status');
      const { queue, lastCompletedJob } = res.data;
      
      const isScraping = queue.active > 0 || queue.waiting > 0;
      const lastRun = lastCompletedJob?.finishedOn 
        ? new Date(lastCompletedJob.finishedOn).toISOString() 
        : undefined;
      
      const error = queue.failed > 0 ? `Terdapat ${queue.failed} job yang gagal.` : null;
      
      setStatus({
        isScraping,
        lastRun,
        error,
        message: isScraping 
          ? `Memproses ${queue.active} job (menunggu: ${queue.waiting})...` 
          : 'Scraper sedang menunggu jadwal berikutnya.',
        activeJobs: queue.active,
        waitingJobs: queue.waiting
      });
    } catch (err: any) {
      console.error('Error fetching scraper status:', err);
      toast.error('Gagal mengambil status scraper');
      setStatus(prev => ({ ...prev, error: 'Koneksi ke service-scraper terputus' }));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Poll status every 10 seconds if it's currently scraping
    const interval = setInterval(() => {
      if (status.isScraping) {
        fetchStatus();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [status.isScraping]);

  const handleTrigger = async () => {
    if (!window.confirm('Anda yakin ingin menjalankan proses scraping secara manual sekarang? Ini mungkin memakan waktu beberapa menit.')) {
      return;
    }

    setIsTriggering(true);
    try {
      // Endpoint to trigger manual scraping, adapt if different
      await api.post('/scraper/trigger');
      toast.success('Proses scraping manual telah dimulai');
      setStatus(prev => ({ ...prev, isScraping: true, message: 'Scraping manual berjalan...' }));
    } catch (err: any) {
      console.error('Trigger error:', err);
      toast.error(err.response?.data?.message || 'Gagal memulai proses scraping');
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Kontrol Scraper</h1>
          <p className="text-slate-500 dark:text-zinc-400 mt-1">Pantau dan kelola proses pengambilan data otomatis.</p>
        </div>
        <button
          onClick={fetchStatus}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-700/50 text-slate-700 dark:text-zinc-300 font-medium rounded-xl shadow-sm transition-all"
        >
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Status Card */}
        <div className="bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm backdrop-blur-xl flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-3 rounded-2xl ${status.isScraping ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' : status.error ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400' : 'bg-teal-100 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400'}`}>
              <Activity size={24} className={status.isScraping ? "animate-pulse" : ""} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">Status Saat Ini</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {status.isScraping ? 'Sedang Berjalan' : status.error ? 'Error / Terhenti' : 'Idle (Siap)'}
              </h3>
            </div>
          </div>
          <p className="text-sm text-slate-600 dark:text-zinc-400 border-t border-slate-100 dark:border-zinc-800/50 pt-4">
            {status.message || 'Scraper sedang menunggu jadwal berikutnya.'}
          </p>
        </div>

        {/* Last Run Card */}
        <div className="bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm backdrop-blur-xl flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">Eksekusi Terakhir</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {status.lastRun ? new Date(status.lastRun).toLocaleString('id-ID') : 'Belum Pernah'}
              </h3>
            </div>
          </div>
          <p className="text-sm text-slate-600 dark:text-zinc-400 border-t border-slate-100 dark:border-zinc-800/50 pt-4 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-500" />
            Terjadwal setiap hari jam 00:00 WIB
          </p>
        </div>

        {/* Action Card */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 shadow-lg shadow-indigo-500/20 flex flex-col justify-between text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Play size={100} />
          </div>
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-2">Picu Manual</h3>
            <p className="text-indigo-100 text-sm mb-6">
              Jalankan proses pengambilan data harga komoditas dari panel harga pangan secara manual sekarang juga.
            </p>
            <button
              onClick={handleTrigger}
              disabled={status.isScraping || isTriggering}
              className="w-full py-3 px-4 bg-white text-indigo-600 hover:bg-indigo-50 disabled:bg-indigo-100 disabled:text-indigo-400 font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
            >
              {isTriggering ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : (
                <Play size={18} className="fill-current" />
              )}
              {isTriggering ? 'Memulai...' : 'Jalankan Scraper'}
            </button>
          </div>
        </div>
      </div>

      {/* Warning/Error Banner */}
      {status.error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="font-semibold text-red-800 dark:text-red-400">Perhatian: Terjadi Kesalahan</h4>
            <p className="text-red-600 dark:text-red-300 text-sm mt-1">{status.error}</p>
          </div>
        </div>
      )}

      {/* Terminal / Logs View (Mockup) */}
      <div className="bg-slate-950 rounded-3xl overflow-hidden shadow-xl border border-slate-800">
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center gap-2">
          <Terminal size={16} className="text-slate-400" />
          <span className="text-xs font-mono font-medium text-slate-400">scraper-output.log</span>
        </div>
        <div className="p-6 font-mono text-sm h-64 overflow-y-auto">
          {status.isScraping ? (
            <div className="space-y-2 text-slate-300">
              <p className="text-indigo-400">[INFO] Memulai proses scraping...</p>
              <p className="text-slate-400">[INFO] Mengambil daftar komoditas dari database...</p>
              <p className="text-amber-400 animate-pulse">[WAIT] Sedang mengakses halaman sumber data...</p>
            </div>
          ) : (
            <div className="space-y-2 text-slate-400">
              <p>[INFO] Scraper service is running and ready.</p>
              <p>[INFO] Waiting for next cron schedule or manual trigger.</p>
              {status.lastRun && (
                <p className="text-emerald-400">[SUCCESS] Eksekusi terakhir selesai pada {new Date(status.lastRun).toLocaleString('id-ID')}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
