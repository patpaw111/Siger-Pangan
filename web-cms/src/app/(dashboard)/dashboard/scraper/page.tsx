'use client';

import React, { useState, useEffect } from 'react';
import { Play, Activity, Clock, AlertTriangle, CheckCircle2, RefreshCw, Terminal, Database, Globe } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

interface ScraperStatusBI {
  isScraping: boolean;
  lastRun?: string;
  error?: string | null;
  message?: string;
  activeJobs?: number;
  waitingJobs?: number;
}

interface SipanganRun {
  id: string;
  jobId: string;
  status: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  recordsInserted: number;
  recordsUpdated: number;
  recordsSkipped: number;
  durationMs: number;
  errorMessage: string | null;
  completedAt: string;
  startedAt: string;
}

interface ScraperStatusSipangan {
  isScraping: boolean;
  lastRun: SipanganRun | null;
  totalRecords: number;
  error?: string | null;
}

export default function ScraperPage() {
  const [activeTab, setActiveTab] = useState<'bi' | 'sipangan'>('bi');

  // BI State
  const [statusBI, setStatusBI] = useState<ScraperStatusBI>({ isScraping: false });
  const [isLoadingBI, setIsLoadingBI] = useState(true);
  const [isTriggeringBI, setIsTriggeringBI] = useState(false);

  // SiPangan State
  const [statusSipangan, setStatusSipangan] = useState<ScraperStatusSipangan>({ isScraping: false, lastRun: null, totalRecords: 0 });
  const [isLoadingSipangan, setIsLoadingSipangan] = useState(true);
  const [isTriggeringSipangan, setIsTriggeringSipangan] = useState(false);

  const fetchStatusBI = async () => {
    setIsLoadingBI(true);
    try {
      const res = await api.get('/scraper/status');
      const { queue, lastCompletedJob } = res.data;
      
      const isScraping = queue.active > 0 || queue.waiting > 0;
      const lastRun = lastCompletedJob?.finishedOn 
        ? new Date(lastCompletedJob.finishedOn).toISOString() 
        : undefined;
      
      const error = queue.failed > 0 ? `Terdapat ${queue.failed} job yang gagal.` : null;
      
      setStatusBI({
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
      console.error('Error fetching BI scraper status:', err);
      setStatusBI(prev => ({ ...prev, error: 'Koneksi ke service-scraper (BI) terputus' }));
    } finally {
      setIsLoadingBI(false);
    }
  };

  const fetchStatusSipangan = async () => {
    setIsLoadingSipangan(true);
    try {
      const res = await api.get('/sipangan-scraper/status');
      const { lastRun, totalRecords } = res.data;
      
      const isScraping = lastRun?.status === 'running';
      const error = lastRun?.status === 'failed' ? `Gagal: ${lastRun.errorMessage || 'Terjadi kesalahan internal'}` : null;
      
      setStatusSipangan({
        isScraping,
        lastRun,
        totalRecords: totalRecords || 0,
        error
      });
    } catch (err: any) {
      console.error('Error fetching SiPangan scraper status:', err);
      setStatusSipangan(prev => ({ ...prev, error: 'Koneksi ke service-scraper-sipangan terputus' }));
    } finally {
      setIsLoadingSipangan(false);
    }
  };

  useEffect(() => {
    fetchStatusBI();
    fetchStatusSipangan();

    // Poll status every 10 seconds for BI
    const intervalBI = setInterval(() => {
      setStatusBI(prev => {
        if (prev.isScraping) fetchStatusBI();
        return prev;
      });
    }, 10000);

    // Poll status every 10 seconds for SiPangan
    const intervalSipangan = setInterval(() => {
      setStatusSipangan(prev => {
        if (prev.isScraping) fetchStatusSipangan();
        return prev;
      });
    }, 10000);

    return () => {
      clearInterval(intervalBI);
      clearInterval(intervalSipangan);
    };
  }, []);

  const handleTriggerBI = async () => {
    if (!window.confirm('Anda yakin ingin menjalankan scraper Bank Indonesia secara manual sekarang?')) {
      return;
    }

    setIsTriggeringBI(true);
    try {
      await api.post('/scraper/trigger');
      toast.success('Proses scraping BI manual telah dimulai');
      setStatusBI(prev => ({ ...prev, isScraping: true, message: 'Scraping manual berjalan...' }));
      fetchStatusBI();
    } catch (err: any) {
      console.error('Trigger BI error:', err);
      toast.error(err.response?.data?.message || 'Gagal memulai proses scraping BI');
    } finally {
      setIsTriggeringBI(false);
    }
  };

  const handleTriggerSipangan = async () => {
    if (!window.confirm('Anda yakin ingin menjalankan scraper SiPangan secara manual? Proses ini akan menarik data dari H-7.')) {
      return;
    }

    setIsTriggeringSipangan(true);
    try {
      await api.post('/sipangan-scraper/trigger');
      toast.success('Proses scraping SiPangan manual telah dimulai');
      setStatusSipangan(prev => ({ ...prev, isScraping: true }));
      // Give it a second before fetching status so the DB record has time to be created
      setTimeout(fetchStatusSipangan, 2000);
    } catch (err: any) {
      console.error('Trigger SiPangan error:', err);
      toast.error(err.response?.data?.message || 'Gagal memulai proses scraping SiPangan');
    } finally {
      setIsTriggeringSipangan(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Kontrol Scraper</h1>
          <p className="text-slate-500 dark:text-zinc-400 mt-1">Pantau dan kelola *bot* pengambilan data otomatis.</p>
        </div>
        <button
          onClick={() => {
            if (activeTab === 'bi') fetchStatusBI();
            else fetchStatusSipangan();
          }}
          disabled={activeTab === 'bi' ? isLoadingBI : isLoadingSipangan}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-700/50 text-slate-700 dark:text-zinc-300 font-medium rounded-xl shadow-sm transition-all"
        >
          <RefreshCw size={16} className={(activeTab === 'bi' ? isLoadingBI : isLoadingSipangan) ? "animate-spin" : ""} />
          Refresh Status
        </button>
      </div>

      {/* Modern Tabs */}
      <div className="flex p-1 space-x-1 bg-slate-100 dark:bg-zinc-800/50 rounded-2xl w-full max-w-md">
        <button
          onClick={() => setActiveTab('bi')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'bi' 
              ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
        >
          <Database size={16} />
          Scraper PIHPS (BI)
        </button>
        <button
          onClick={() => setActiveTab('sipangan')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'sipangan' 
              ? 'bg-white dark:bg-zinc-900 text-teal-600 dark:text-teal-400 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
        >
          <Globe size={16} />
          Scraper SiPangan
        </button>
      </div>

      {/* --- TAB CONTENT: BANK INDONESIA (PIHPS) --- */}
      {activeTab === 'bi' && (
        <div className="space-y-6 animate-in fade-in duration-300 slide-in-from-bottom-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Status Card */}
            <div className="bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm backdrop-blur-xl flex flex-col justify-between">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 rounded-2xl ${statusBI.isScraping ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' : statusBI.error ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400' : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400'}`}>
                  <Activity size={24} className={statusBI.isScraping ? "animate-pulse" : ""} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">Status Saat Ini</p>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {statusBI.isScraping ? 'Sedang Berjalan' : statusBI.error ? 'Error / Terhenti' : 'Idle (Siap)'}
                  </h3>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-zinc-400 border-t border-slate-100 dark:border-zinc-800/50 pt-4">
                {statusBI.message || 'Scraper sedang menunggu jadwal berikutnya.'}
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
                    {statusBI.lastRun ? new Date(statusBI.lastRun).toLocaleString('id-ID') : 'Belum Pernah'}
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
                  Jalankan proses pengambilan data harga dari portal BI secara manual sekarang juga.
                </p>
                <button
                  onClick={handleTriggerBI}
                  disabled={statusBI.isScraping || isTriggeringBI}
                  className="w-full py-3 px-4 bg-white text-indigo-600 hover:bg-indigo-50 disabled:bg-indigo-100 disabled:text-indigo-400 font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  {isTriggeringBI ? (
                    <RefreshCw size={18} className="animate-spin" />
                  ) : (
                    <Play size={18} className="fill-current" />
                  )}
                  {isTriggeringBI ? 'Memulai...' : 'Jalankan Scraper BI'}
                </button>
              </div>
            </div>
          </div>

          {/* Warning/Error Banner */}
          {statusBI.error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-2xl p-4 flex items-start gap-3">
              <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="font-semibold text-red-800 dark:text-red-400">Perhatian: Terjadi Kesalahan</h4>
                <p className="text-red-600 dark:text-red-300 text-sm mt-1">{statusBI.error}</p>
              </div>
            </div>
          )}

          {/* Terminal / Logs View (Mockup) */}
          <div className="bg-slate-950 rounded-3xl overflow-hidden shadow-xl border border-slate-800">
            <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center gap-2">
              <Terminal size={16} className="text-slate-400" />
              <span className="text-xs font-mono font-medium text-slate-400">pihps-scraper-output.log</span>
            </div>
            <div className="p-6 font-mono text-sm h-48 overflow-y-auto">
              {statusBI.isScraping ? (
                <div className="space-y-2 text-slate-300">
                  <p className="text-indigo-400">[INFO] Memulai proses scraping PIHPS BI...</p>
                  <p className="text-slate-400">[INFO] Mengambil daftar wilayah dan komoditas...</p>
                  <p className="text-amber-400 animate-pulse">[WAIT] Menunggu antrean worker berjalan...</p>
                </div>
              ) : (
                <div className="space-y-2 text-slate-400">
                  <p>[INFO] PIHPS Scraper service is running and ready.</p>
                  <p>[INFO] Waiting for next cron schedule or manual trigger.</p>
                  {statusBI.lastRun && (
                    <p className="text-emerald-400">[SUCCESS] Eksekusi terakhir selesai pada {new Date(statusBI.lastRun).toLocaleString('id-ID')}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB CONTENT: SIPANGAN (BAPANAS) --- */}
      {activeTab === 'sipangan' && (
        <div className="space-y-6 animate-in fade-in duration-300 slide-in-from-bottom-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Status Card */}
            <div className="bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm backdrop-blur-xl flex flex-col justify-between">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 rounded-2xl ${statusSipangan.isScraping ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' : statusSipangan.error ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400' : 'bg-teal-100 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400'}`}>
                  <Activity size={24} className={statusSipangan.isScraping ? "animate-pulse" : ""} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">Status SiPangan</p>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {statusSipangan.isScraping ? 'Sedang Scraping...' : statusSipangan.error ? 'Error / Terhenti' : 'Idle (Siap)'}
                  </h3>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-zinc-400 border-t border-slate-100 dark:border-zinc-800/50 pt-4">
                Total di Database: <strong className="text-slate-900 dark:text-white">{statusSipangan.totalRecords.toLocaleString('id-ID')}</strong> harga harian.
              </p>
            </div>

            {/* Last Run Card */}
            <div className="bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm backdrop-blur-xl flex flex-col justify-between">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-2xl bg-teal-100 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400">
                  <Clock size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">Eksekusi Terakhir</p>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {statusSipangan.lastRun?.completedAt ? new Date(statusSipangan.lastRun.completedAt).toLocaleString('id-ID') : 'Belum Pernah'}
                  </h3>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-zinc-400 border-t border-slate-100 dark:border-zinc-800/50 pt-4 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                {statusSipangan.lastRun?.recordsInserted 
                  ? `Berhasil mengambil ${statusSipangan.lastRun.recordsInserted.toLocaleString('id-ID')} data baru.` 
                  : 'Siap untuk dijalankan.'}
              </p>
            </div>

            {/* Action Card */}
            <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-3xl p-6 shadow-lg shadow-teal-500/20 flex flex-col justify-between text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Globe size={100} />
              </div>
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-2">Picu Manual</h3>
                <p className="text-teal-50 text-sm mb-6">
                  Jalankan proses sinkronisasi SiPangan. Akan memakan waktu 5-10 menit.
                </p>
                <button
                  onClick={handleTriggerSipangan}
                  disabled={statusSipangan.isScraping || isTriggeringSipangan}
                  className="w-full py-3 px-4 bg-white text-teal-700 hover:bg-teal-50 disabled:bg-teal-100 disabled:text-teal-400 font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  {isTriggeringSipangan ? (
                    <RefreshCw size={18} className="animate-spin" />
                  ) : (
                    <Play size={18} className="fill-current" />
                  )}
                  {isTriggeringSipangan ? 'Memulai...' : 'Jalankan Scraper SiPangan'}
                </button>
              </div>
            </div>
          </div>

          {/* Warning/Error Banner */}
          {statusSipangan.error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-2xl p-4 flex items-start gap-3">
              <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="font-semibold text-red-800 dark:text-red-400">Perhatian: Terjadi Kesalahan</h4>
                <p className="text-red-600 dark:text-red-300 text-sm mt-1">{statusSipangan.error}</p>
              </div>
            </div>
          )}

          {/* Terminal / Logs View (Mockup) */}
          <div className="bg-slate-950 rounded-3xl overflow-hidden shadow-xl border border-slate-800">
            <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center gap-2">
              <Terminal size={16} className="text-slate-400" />
              <span className="text-xs font-mono font-medium text-slate-400">sipangan-scraper-output.log</span>
            </div>
            <div className="p-6 font-mono text-sm h-48 overflow-y-auto">
              {statusSipangan.isScraping ? (
                <div className="space-y-2 text-slate-300">
                  <p className="text-teal-400">[INFO] Memulai proses scraping SiPangan Bapanas...</p>
                  <p className="text-slate-400">[INFO] Mendapatkan token akses dari server Bapanas...</p>
                  <p className="text-amber-400 animate-pulse">[WAIT] Sedang menarik data harga Produsen & Eceran (H-7)...</p>
                </div>
              ) : (
                <div className="space-y-2 text-slate-400">
                  <p>[INFO] SiPangan Scraper service is running and ready.</p>
                  <p>[INFO] Waiting for next cron schedule or manual trigger.</p>
                  {statusSipangan.lastRun?.completedAt && (
                    <p className="text-emerald-400">[SUCCESS] Eksekusi terakhir selesai pada {new Date(statusSipangan.lastRun.completedAt).toLocaleString('id-ID')}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
