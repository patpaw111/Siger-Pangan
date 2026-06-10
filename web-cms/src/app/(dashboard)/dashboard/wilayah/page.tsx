'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2, X, AlertCircle, Search, Database, Globe, ArrowUpDown, ArrowDownAZ, ArrowUpZA } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';

interface Region {
  id: string;
  name: string;
  type: 'PROVINCE' | 'CITY' | 'REGENCY';
  created_at: string;
  updated_at: string;
}

export default function WilayahPage() {
  const [activeTab, setActiveTab] = useState<'bi' | 'sipangan'>('bi');

  // Bank Indonesia (BI) State
  const [regions, setRegions] = useState<Region[]>([]);
  const [isLoadingBI, setIsLoadingBI] = useState(true);
  const [errorBI, setErrorBI] = useState<string | null>(null);
  const [biSearch, setBiSearch] = useState('');
  const [sortOrderBI, setSortOrderBI] = useState<'asc' | 'desc'>('asc');

  // SiPangan State
  const [sipanganRegions, setSipanganRegions] = useState<string[]>([]);
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
    type: 'REGENCY' as Region['type'],
  });

  const fetchBIRegions = async () => {
    setIsLoadingBI(true);
    setErrorBI(null);
    try {
      const res = await api.get('/catalog/regions');
      const data = res.data?.data || res.data;
      if (Array.isArray(data)) {
        setRegions(data);
      } else {
        setRegions([]);
      }
    } catch (err: any) {
      console.error('Error fetching BI regions:', err);
      setErrorBI('Gagal memuat data wilayah internal dari server.');
    } finally {
      setIsLoadingBI(false);
    }
  };

  const fetchSipanganRegions = async () => {
    setIsLoadingSipangan(true);
    setErrorSipangan(null);
    try {
      const res = await api.get('/sipangan-scraper/prices/regions');
      const data = res.data?.data || res.data;
      if (Array.isArray(data)) {
        setSipanganRegions(data);
      } else {
        setSipanganRegions([]);
      }
    } catch (err: any) {
      console.error('Error fetching SiPangan regions:', err);
      setErrorSipangan('Gagal memuat data wilayah dari SiPangan.');
    } finally {
      setIsLoadingSipangan(false);
    }
  };

  useEffect(() => {
    fetchBIRegions();
    fetchSipanganRegions();
  }, []);

  const openModal = (region?: Region) => {
    if (region) {
      setFormData({
        id: region.id,
        name: region.name,
        type: region.type,
      });
    } else {
      setFormData({
        id: '',
        name: '',
        type: 'REGENCY',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ id: '', name: '', type: 'REGENCY' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Nama wilayah wajib diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      if (formData.id) {
        await api.patch(`/catalog/regions/${formData.id}`, {
          name: formData.name,
          type: formData.type,
        });
        toast.success('Data wilayah berhasil diperbarui');
      } else {
        await api.post('/catalog/regions', {
          name: formData.name,
          type: formData.type,
        });
        toast.success('Data wilayah berhasil ditambahkan');
      }
      closeModal();
      fetchBIRegions();
    } catch (err: any) {
      console.error('Submit error:', err);
      toast.error(err.response?.data?.message || 'Gagal menyimpan data wilayah');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus wilayah "${name}"?`)) {
      return;
    }

    try {
      await api.delete(`/catalog/regions/${id}`);
      toast.success('Wilayah berhasil dihapus');
      fetchBIRegions();
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(err.response?.data?.message || 'Gagal menghapus wilayah');
    }
  };

  const translateType = (type: string) => {
    switch (type) {
      case 'PROVINCE': return 'Provinsi';
      case 'CITY': return 'Kota';
      case 'REGENCY': return 'Kabupaten';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'PROVINCE': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';
      case 'CITY': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
      case 'REGENCY': return 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800';
      default: return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  const filteredBIRegions = regions
    .filter(r => r.name.toLowerCase().includes(biSearch.toLowerCase()))
    .sort((a, b) => {
      if (sortOrderBI === 'asc') return a.name.localeCompare(b.name);
      return b.name.localeCompare(a.name);
    });

  const filteredSipanganRegions = sipanganRegions
    .filter(r => r.toLowerCase().includes(sipanganSearch.toLowerCase()))
    .sort((a, b) => {
      if (sortOrderSipangan === 'asc') return a.localeCompare(b);
      return b.localeCompare(a);
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-50">Manajemen Wilayah</h1>
          <p className="text-slate-500 dark:text-zinc-400 mt-1">Kelola data provinsi, kota, dan kabupaten.</p>
        </div>
        
        {/* Only show Add button on BI tab */}
        {activeTab === 'bi' && (
          <button
            onClick={() => openModal()}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm"
          >
            <Plus size={18} />
            Tambah Wilayah
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
            
            {/* Search Bar & Sort */}
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Cari nama wilayah BI..."
                  value={biSearch}
                  onChange={(e) => setBiSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>
          
          {isLoadingBI ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="animate-spin w-8 h-8 mb-2" />
              <p>Memuat data wilayah BI...</p>
            </div>
          ) : errorBI ? (
            <div className="h-64 flex flex-col items-center justify-center text-red-500">
              <AlertCircle className="w-8 h-8 mb-2" />
              <p>{errorBI}</p>
            </div>
          ) : filteredBIRegions.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400">
              {biSearch ? (
                <>
                  <Search className="w-8 h-8 mb-2 opacity-50" />
                  <p>Pencarian "{biSearch}" tidak ditemukan.</p>
                </>
              ) : (
                <p>Belum ada data wilayah internal.</p>
              )}
            </div>
          ) : (
            <DataTable
              columns={[
                {
                  header: 'NAMA WILAYAH',
                  headerClassName: 'cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group select-none',
                  cell: (region) => <span className="font-bold">{region.name}</span>,
                },
                {
                  header: 'TIPE',
                  cell: (region) => (
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getTypeColor(region.type)}`}>
                      {translateType(region.type)}
                    </span>
                  ),
                },
                {
                  header: 'DITAMBAHKAN PADA',
                  cellClassName: 'whitespace-nowrap text-slate-500 dark:text-zinc-400',
                  cell: (region) => (
                    new Date(region.created_at).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })
                  ),
                },
                {
                  header: 'AKSI',
                  cellClassName: 'text-right',
                  headerClassName: 'text-right',
                  cell: (region) => (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openModal(region)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors"
                        title="Edit Wilayah"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(region.id, region.name)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Hapus Wilayah"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ),
                },
              ]}
              data={filteredBIRegions}
              keyExtractor={(r) => r.id}
              isLoading={isLoadingBI}
              emptyState={
                <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                  {biSearch ? (
                    <>
                      <Search className="w-8 h-8 mb-2 opacity-50" />
                      <p>Pencarian "{biSearch}" tidak ditemukan.</p>
                    </>
                  ) : (
                    <p>Belum ada data wilayah internal.</p>
                  )}
                </div>
              }
            />
          )}
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
              <p className="text-xs text-slate-500 mt-1 ml-4">Otomatis diambil dari portal Bapanas. {sipanganRegions.length} wilayah terdeteksi.</p>
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
                  placeholder="Cari nama wilayah..."
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
          ) : filteredSipanganRegions.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400">
              <Search className="w-8 h-8 mb-2 opacity-50" />
              <p>Pencarian "{sipanganSearch}" tidak ditemukan.</p>
            </div>
          ) : (
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredSipanganRegions.map((r, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-zinc-800 hover:border-teal-200 dark:hover:border-teal-500/30 hover:bg-teal-50/50 dark:hover:bg-teal-500/5 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-500 dark:text-zinc-400 text-xs font-bold">
                        {idx + 1}
                      </div>
                      <span className="font-semibold text-slate-700 dark:text-zinc-200 text-sm">{r}</span>
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
                {formData.id ? 'Edit Wilayah BI' : 'Tambah Wilayah BI'}
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
                  Nama Wilayah <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Misal: Kota Bandar Lampung"
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Tipe Wilayah <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as Region['type'] })}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none cursor-pointer"
                    required
                  >
                    <option value="CITY">Kota</option>
                    <option value="REGENCY">Kabupaten</option>
                    <option value="PROVINCE">Provinsi</option>
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
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
