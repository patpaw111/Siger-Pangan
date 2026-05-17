'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

interface Commodity {
  id: string;
  name: string;
  unit: string;
  image_url: string;
  created_at: string;
  updated_at: string;
}

export default function KomoditasPage() {
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const fetchCommodities = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Endpoint depends on Nginx proxy pointing to service-catalog
      const res = await api.get('/catalog/commodities');
      // Assume success returns standard nested data array or direct array
      const data = res.data?.data || res.data;
      if (Array.isArray(data)) {
        setCommodities(data);
      } else {
        setCommodities([]);
      }
    } catch (err: any) {
      console.error('Error fetching commodities:', err);
      // Attempt fallback to scraper API if catalog is not available
      try {
        const fallbackRes = await api.get('/prices/commodities');
        const fallbackData = fallbackRes.data?.data || fallbackRes.data;
        if (Array.isArray(fallbackData)) {
          setCommodities(fallbackData);
          toast.warning('Menggunakan data komoditas dari service-scraper (Read Only)');
        }
      } catch (fallbackErr) {
        setError('Gagal memuat data komoditas dari server.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCommodities();
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
        // Edit Mode
        await api.patch(`/catalog/commodities/${formData.id}`, payload);
        toast.success('Komoditas berhasil diperbarui');
      } else {
        // Add Mode
        await api.post('/catalog/commodities', payload);
        toast.success('Komoditas berhasil ditambahkan');
      }
      
      closeModal();
      fetchCommodities(); // Refresh table
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-50">Manajemen Komoditas</h1>
          <p className="text-slate-500 dark:text-zinc-400 mt-1">Kelola data pangan seperti Beras, Cabai, Bawang, dsb.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm"
        >
          <Plus size={18} />
          Tambah Komoditas
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="animate-spin w-8 h-8 mb-2" />
            <p>Memuat data komoditas...</p>
          </div>
        ) : error ? (
          <div className="h-64 flex flex-col items-center justify-center text-red-500">
            <AlertCircle className="w-8 h-8 mb-2" />
            <p>{error}</p>
          </div>
        ) : commodities.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400">
            <p>Belum ada data komoditas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-zinc-950 text-slate-500 dark:text-zinc-400 font-medium border-b border-slate-200 dark:border-zinc-800">
                <tr>
                  <th className="px-6 py-4">Nama Komoditas</th>
                  <th className="px-6 py-4">Satuan</th>
                  <th className="px-6 py-4 text-center">Gambar</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-slate-700 dark:text-zinc-300">
                {commodities.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 font-bold">{c.name}</td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 px-2.5 py-1 rounded-full text-xs font-medium">
                        {c.unit || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {c.image_url ? (
                        <div className="flex justify-center">
                          <img src={c.image_url} alt={c.name} className="w-10 h-10 rounded-lg object-cover bg-slate-100 dark:bg-zinc-800" />
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Tidak ada</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl shadow-xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-zinc-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-50">
                {formData.id ? 'Edit Komoditas' : 'Tambah Komoditas Baru'}
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
