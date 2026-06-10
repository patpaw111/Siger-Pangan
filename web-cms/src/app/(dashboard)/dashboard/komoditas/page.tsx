'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2, X, AlertCircle, Search, Database, Globe, ArrowUpDown, ArrowDownAZ, ArrowUpZA } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';

interface Commodity {
  id: string;
  name: string;
  unit: string;
  image_url: string;
  created_at: string;
  updated_at: string;
}

interface SipanganCommodity {
  id: number;
  name: string;
}

export default function KomoditasPage() {
  const [activeTab, setActiveTab] = useState<'bi' | 'sipangan'>('bi');

  // Bank Indonesia (BI) State
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [isLoadingBI, setIsLoadingBI] = useState(true);
  const [errorBI, setErrorBI] = useState<string | null>(null);
  const [biSearch, setBiSearch] = useState('');
  const [sortOrderBI, setSortOrderBI] = useState<'asc' | 'desc'>('asc');

  // SiPangan State
  const [sipanganData, setSipanganData] = useState<SipanganCommodity[]>([]);
  const [isLoadingSipangan, setIsLoadingSipangan] = useState(true);
  const [errorSipangan, setErrorSipangan] = useState<string | null>(null);
  const [sipanganSearch, setSipanganSearch] = useState('');
  const [sortOrderSipangan, setSortOrderSipangan] = useState<'asc' | 'desc'>('asc');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    unit: '',
    image_url: ''
  });

  const fetchBICommodities = async () => {
    setIsLoadingBI(true);
    setErrorBI(null);
    try {
      const res = await api.get('/catalog/commodities');
      const data = res.data?.data || res.data;
      if (Array.isArray(data)) {
        setCommodities(data);
      } else {
        setCommodities([]);
      }
    } catch (err: any) {
      console.error('Error fetching BI commodities:', err);
      setErrorBI('Gagal memuat data master Bank Indonesia.');
    } finally {
      setIsLoadingBI(false);
    }
  };

  const fetchSipanganCommodities = async () => {
    setIsLoadingSipangan(true);
    setErrorSipangan(null);
    try {
      const res = await api.get('/sipangan-scraper/prices/commodities');
      const data = res.data?.data || res.data;
      if (Array.isArray(data)) {
        setSipanganData(data);
      } else {
        setSipanganData([]);
      }
    } catch (err: any) {
      console.error('Error fetching SiPangan commodities:', err);
      setErrorSipangan('Gagal memuat data dari SiPangan Bapanas.');
    } finally {
      setIsLoadingSipangan(false);
    }
  };

  useEffect(() => {
    fetchBICommodities();
    fetchSipanganCommodities();
  }, []);

  const openModal = (commodity?: Commodity) => {
    if (commodity) {
      setFormData({
        id: commodity.id,
        name: commodity.name,
        unit: commodity.unit || '',
        image_url: commodity.image_url || ''
      });
    } else {
      setFormData({
        id: '',
        name: '',
        unit: '',
        image_url: ''
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ id: '', name: '', unit: '', image_url: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.unit) {
      toast.error('Nama dan Satuan komoditas wajib diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        unit: formData.unit,
        image_url: formData.image_url || null
      };

      if (formData.id) {
        await api.patch(`/catalog/commodities/${formData.id}`, payload);
        toast.success('Komoditas berhasil diperbarui');
      } else {
        await api.post('/catalog/commodities', payload);
        toast.success('Komoditas berhasil ditambahkan');
      }
      
      closeModal();
      fetchBICommodities();
    } catch (err: any) {
      console.error('Error saving commodity:', err);
      const errMsg = err.response?.data?.message || err.message || 'Gagal menyimpan komoditas';
      toast.error(typeof errMsg === 'string' ? errMsg : 'Gagal menyimpan komoditas');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus komoditas "${name}"?`)) {
      return;
    }

    try {
      await api.delete(`/catalog/commodities/${id}`);
      toast.success('Komoditas berhasil dihapus');
      setCommodities(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      console.error('Error deleting commodity:', err);
      const errMsg = err.response?.data?.message || err.message || 'Gagal menghapus komoditas';
      toast.error(typeof errMsg === 'string' ? errMsg : 'Gagal menghapus komoditas');
    }
  };

  const filteredSipanganData = sipanganData
    .filter(c => c.name.toLowerCase().includes(sipanganSearch.toLowerCase()))
    .sort((a, b) => {
      if (sortOrderSipangan === 'asc') return a.name.localeCompare(b.name);
      return b.name.localeCompare(a.name);
    });

  const filteredBICommodities = commodities
    .filter(c => c.name.toLowerCase().includes(biSearch.toLowerCase()))
    .sort((a, b) => {
      if (sortOrderBI === 'asc') return a.name.localeCompare(b.name);
      return b.name.localeCompare(a.name);
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-50">Manajemen Komoditas</h1>
          <p className="text-slate-500 dark:text-zinc-400 mt-1">Kelola data pangan utama dan pantau data referensi dari eksternal.</p>
        </div>
        
        {/* Only show Add button on BI tab */}
        {activeTab === 'bi' && (
          <button
            onClick={() => openModal()}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm"
          >
            <Plus size={18} />
            Tambah Komoditas
          </button>
        )}
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
          Master Data (BI)
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
          SiPangan (Bapanas)
        </button>
      </div>

      {/* --- TAB CONTENT: BANK INDONESIA --- */}
      {activeTab === 'bi' && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-sm overflow-hidden animate-in fade-in duration-300 slide-in-from-bottom-4">
          <div className="p-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-zinc-200 text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                Data Internal Bank Indonesia
              </h3>
              <p className="text-xs text-slate-500 mt-1 ml-4">Mendukung Operasi Penuh (Tambah, Edit, Hapus).</p>
            </div>
            
            {/* Search Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Cari nama komoditas BI..."
                value={biSearch}
                onChange={(e) => setBiSearch(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-slate-400"
              />
            </div>
          </div>
          
          <DataTable 
              columns={[
                {
                  header: 'NAMA KOMODITAS',
                  headerClassName: 'cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group select-none',
                  cell: (c) => <span className="font-bold">{c.name}</span>,
                },
                {
                  header: 'SATUAN',
                  cell: (c) => (
                    <span className="bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 px-2.5 py-1 rounded-full text-xs font-medium">
                      {c.unit || '-'}
                    </span>
                  ),
                },
                {
                  header: 'GAMBAR',
                  cellClassName: 'text-center',
                  headerClassName: 'text-center',
                  cell: (c) => (
                    c.image_url ? (
                      <div className="flex justify-center">
                        <img src={c.image_url} alt={c.name} className="w-10 h-10 rounded-lg object-cover bg-slate-100 dark:bg-zinc-800" />
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs italic">Tidak ada</span>
                    )
                  ),
                },
                {
                  header: 'AKSI',
                  cellClassName: 'text-right',
                  headerClassName: 'text-right',
                  cell: (c) => (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openModal(c)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors"
                        title="Edit Komoditas"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id, c.name)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Hapus Komoditas"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ),
                },
              ]} 
              data={filteredBICommodities} 
              keyExtractor={(c) => c.id} 
              isLoading={isLoadingBI}
              emptyState={
                <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                  {biSearch ? (
                    <>
                      <Search className="w-8 h-8 mb-2 opacity-50" />
                      <p>Pencarian "{biSearch}" tidak ditemukan.</p>
                    </>
                  ) : (
                    <p>Belum ada data komoditas internal.</p>
                  )}
                </div>
              }
            />
        </div>
      )}

      {/* --- TAB CONTENT: SIPANGAN --- */}
      {activeTab === 'sipangan' && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-sm overflow-hidden animate-in fade-in duration-300 slide-in-from-bottom-4">
          <div className="p-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-zinc-200 text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                Data Referensi SiPangan (Read-Only)
              </h3>
              <p className="text-xs text-slate-500 mt-1 ml-4">Otomatis diambil dari portal Bapanas. {sipanganData.length} komoditas terdeteksi.</p>
            </div>
            
            {/* Search Bar & Sort */}
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setSortOrderSipangan(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm font-medium text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors shrink-0"
                title="Urutkan A-Z / Z-A"
              >
                {sortOrderSipangan === 'asc' ? <ArrowDownAZ size={16} /> : <ArrowUpZA size={16} />}
              </button>
              <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Cari nama komoditas..."
                  value={sipanganSearch}
                  onChange={(e) => setSipanganSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/50 outline-none transition-all placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>
          
          {isLoadingSipangan ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="animate-spin w-8 h-8 mb-2" />
              <p>Memuat data SiPangan...</p>
            </div>
          ) : errorSipangan ? (
            <div className="h-64 flex flex-col items-center justify-center text-red-500">
              <AlertCircle className="w-8 h-8 mb-2" />
              <p>{errorSipangan}</p>
            </div>
          ) : filteredSipanganData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400">
              <Search className="w-8 h-8 mb-2 opacity-50" />
              <p>Pencarian "{sipanganSearch}" tidak ditemukan.</p>
            </div>
          ) : (
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredSipanganData.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-zinc-800 hover:border-teal-200 dark:hover:border-teal-500/30 hover:bg-teal-50/50 dark:hover:bg-teal-500/5 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-500 dark:text-zinc-400 text-xs font-bold">
                        #{c.id}
                      </div>
                      <span className="font-semibold text-slate-700 dark:text-zinc-200 text-sm">{c.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form Modal (Hanya untuk BI) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl shadow-xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-zinc-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-50">
                {formData.id ? 'Edit Komoditas BI' : 'Tambah Komoditas BI'}
              </h3>
              <button 
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Nama Komoditas <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Beras Premium"
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Satuan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="Contoh: kg, liter, ikat"
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  URL Gambar (Opsional)
                </label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://example.com/image.png"
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
                {formData.image_url && (
                  <div className="mt-3 flex justify-center">
                    <img 
                      src={formData.image_url} 
                      alt="Preview" 
                      className="w-24 h-24 object-cover rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100?text=Error';
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 text-sm font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                  {formData.id ? 'Simpan Perubahan' : 'Tambahkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
