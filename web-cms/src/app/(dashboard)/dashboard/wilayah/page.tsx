'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

interface Region {
  id: string;
  name: string;
  type: 'PROVINCE' | 'CITY' | 'REGENCY';
  created_at: string;
  updated_at: string;
}

export default function WilayahPage() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    type: 'REGENCY' as Region['type'],
  });

  const fetchRegions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get('/catalog/regions');
      const data = res.data?.data || res.data;
      if (Array.isArray(data)) {
        setRegions(data);
      } else {
        setRegions([]);
      }
    } catch (err: any) {
      console.error('Error fetching regions:', err);
      // Attempt fallback to scraper API if catalog is not available
      try {
        const fallbackRes = await api.get('/prices/regions');
        const fallbackData = fallbackRes.data?.data || fallbackRes.data;
        if (Array.isArray(fallbackData)) {
          setRegions(fallbackData);
          toast.warning('Menggunakan data wilayah dari service-scraper (Read Only)');
        }
      } catch (fallbackErr) {
        setError('Gagal memuat data wilayah dari server.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRegions();
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
        // Update
        await api.patch(`/catalog/regions/${formData.id}`, {
          name: formData.name,
          type: formData.type,
        });
        toast.success('Data wilayah berhasil diperbarui');
      } else {
        // Create
        await api.post('/catalog/regions', {
          name: formData.name,
          type: formData.type,
        });
        toast.success('Data wilayah berhasil ditambahkan');
      }
      closeModal();
      fetchRegions();
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
      fetchRegions();
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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Master Wilayah</h1>
          <p className="text-slate-500 dark:text-zinc-400 mt-1">Kelola data provinsi, kota, dan kabupaten.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus size={18} />
          Tambah Wilayah
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-start gap-3 text-red-600 dark:text-red-400">
          <AlertCircle className="shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-semibold">Terjadi Kesalahan</h3>
            <p className="text-sm mt-1 opacity-90">{error}</p>
            <button 
              onClick={fetchRegions}
              className="mt-2 text-sm font-medium underline underline-offset-2 hover:opacity-80"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-zinc-400">
            <thead className="text-xs uppercase bg-slate-50/50 dark:bg-zinc-800/50 text-slate-500 dark:text-zinc-300 font-semibold border-b border-slate-200 dark:border-zinc-800">
              <tr>
                <th scope="col" className="px-6 py-4">Nama Wilayah</th>
                <th scope="col" className="px-6 py-4">Tipe</th>
                <th scope="col" className="px-6 py-4">Ditambahkan Pada</th>
                <th scope="col" className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-3" />
                    <p className="text-slate-500 dark:text-zinc-400 font-medium">Memuat data wilayah...</p>
                  </td>
                </tr>
              ) : regions.length === 0 && !error ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                      <AlertCircle className="w-8 h-8 text-slate-400 dark:text-zinc-500" />
                    </div>
                    <p className="text-slate-500 dark:text-zinc-400 font-medium">Belum ada data wilayah</p>
                    <button onClick={() => openModal()} className="text-indigo-600 dark:text-indigo-400 hover:underline mt-2">
                      Tambah wilayah pertama Anda
                    </button>
                  </td>
                </tr>
              ) : (
                regions.map((region) => (
                  <tr key={region.id} className="border-b border-slate-100 dark:border-zinc-800/50 hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-900 dark:text-white">{region.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getTypeColor(region.type)}`}>
                        {translateType(region.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(region.created_at).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openModal(region)}
                          className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-zinc-800 shadow-sm border border-slate-200 dark:border-zinc-700 rounded-lg hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(region.id, region.name)}
                          className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 bg-white dark:bg-zinc-800 shadow-sm border border-slate-200 dark:border-zinc-700 rounded-lg hover:border-red-300 dark:hover:border-red-500/50 transition-all"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
          <div 
            className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={closeModal}
          ></div>
          <div className="relative bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-zinc-800/50">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {formData.id ? 'Edit Wilayah' : 'Tambah Wilayah Baru'}
              </h3>
              <button 
                onClick={closeModal}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
                  Nama Wilayah <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Misal: Kota Bandar Lampung"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-950/50 border border-slate-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 transition-all outline-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="type" className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
                  Tipe Wilayah <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as Region['type'] })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-950/50 border border-slate-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 dark:text-white transition-all outline-none appearance-none cursor-pointer"
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

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-3 text-slate-600 dark:text-zinc-300 font-medium border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700/50 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white font-medium rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
