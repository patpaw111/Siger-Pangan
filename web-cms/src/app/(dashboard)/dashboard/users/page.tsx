'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2, X, AlertCircle, Shield, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'SURVEYOR' | 'USER';
  created_at: string;
  updated_at: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    email: '',
    password: '',
    role: 'SURVEYOR' as User['role'],
  });

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Get current logged in user to prevent self-deletion
      const meRes = await api.get('/auth/me');
      setCurrentUser(meRes.data);

      const res = await api.get('/auth/users');
      const data = res.data?.data || res.data;
      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        setUsers([]);
      }
    } catch (err: any) {
      console.error('Error fetching users:', err);
      // Ensure we don't crash if endpoint doesn't exist yet
      if (err.response?.status === 404) {
         setError('API Manajemen User belum tersedia di backend.');
      } else if (err.response?.status === 403) {
         setError('Anda tidak memiliki akses Super Admin untuk melihat halaman ini.');
      } else {
         setError('Gagal memuat data pengguna dari server.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openModal = (user?: User) => {
    if (user) {
      setFormData({
        id: user.id,
        name: user.name || '',
        email: user.email,
        password: '', // Leave empty for edit
        role: user.role,
      });
    } else {
      setFormData({
        id: '',
        name: '',
        email: '',
        password: '',
        role: 'SURVEYOR',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ id: '', name: '', email: '', password: '', role: 'SURVEYOR' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      toast.error('Email wajib diisi');
      return;
    }
    if (!formData.id && !formData.password) {
      toast.error('Password wajib diisi untuk pengguna baru');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
      };
      if (formData.password) {
        payload.password = formData.password;
      }

      if (formData.id) {
        // Update
        await api.put(`/auth/users/${formData.id}`, payload);
        toast.success('Data pengguna berhasil diperbarui');
      } else {
        // Create
        await api.post('/auth/users', payload);
        toast.success('Pengguna baru berhasil ditambahkan');
      }
      closeModal();
      fetchUsers();
    } catch (err: any) {
      console.error('Submit error:', err);
      toast.error(err.response?.data?.message || 'Gagal menyimpan data pengguna');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (id === currentUser?.id) {
      toast.error('Anda tidak dapat menghapus akun Anda sendiri');
      return;
    }

    if (!window.confirm(`Apakah Anda yakin ingin menghapus pengguna "${name || id}"? Aksi ini tidak dapat dibatalkan.`)) {
      return;
    }

    try {
      await api.delete(`/auth/users/${id}`);
      toast.success('Pengguna berhasil dihapus');
      fetchUsers();
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(err.response?.data?.message || 'Gagal menghapus pengguna');
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800">
            <Shield size={12} /> Super Admin
          </span>
        );
      case 'SURVEYOR':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800">
            <UserIcon size={12} /> Surveyor
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
            <UserIcon size={12} /> Publik
          </span>
        );
    }
  };

  if (error && error.includes('akses')) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center space-y-4">
          <Shield className="w-16 h-16 text-red-500 mx-auto" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Akses Ditolak</h1>
          <p className="text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">{error}</p>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      (user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase())) || 
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Manajemen User</h1>
          <p className="text-slate-500 dark:text-zinc-400 mt-1">Kelola akses akun admin dan surveyor.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus size={18} />
          Tambah User
        </button>
      </div>

      {error && !error.includes('akses') && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-start gap-3 text-red-600 dark:text-red-400">
          <AlertCircle className="shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-semibold">Terjadi Kesalahan</h3>
            <p className="text-sm mt-1 opacity-90">{error}</p>
            <button 
              onClick={fetchUsers}
              className="mt-2 text-sm font-medium underline underline-offset-2 hover:opacity-80"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-3xl p-4 shadow-sm backdrop-blur-xl">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <input
            type="text"
            placeholder="Cari nama atau email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-950/50 border border-slate-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 transition-all outline-none"
          />
        </div>
        <div className="sm:w-64 relative">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-zinc-950/50 border border-slate-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 dark:text-white transition-all outline-none appearance-none cursor-pointer"
          >
            <option value="ALL">Semua Role</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="SURVEYOR">Surveyor</option>
            <option value="USER">User Reguler</option>
          </select>
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-zinc-400">
            <thead className="text-xs uppercase bg-slate-50/50 dark:bg-zinc-800/50 text-slate-500 dark:text-zinc-300 font-semibold border-b border-slate-200 dark:border-zinc-800">
              <tr>
                <th scope="col" className="px-6 py-4">Nama</th>
                <th scope="col" className="px-6 py-4">Email</th>
                <th scope="col" className="px-6 py-4">Role</th>
                <th scope="col" className="px-6 py-4">Terdaftar</th>
                <th scope="col" className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-3" />
                    <p className="text-slate-500 dark:text-zinc-400 font-medium">Memuat data pengguna...</p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 && !error ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Shield className="w-8 h-8 text-slate-400 dark:text-zinc-500" />
                    </div>
                    <p className="text-slate-500 dark:text-zinc-400 font-medium">
                      {users.length === 0 ? 'Belum ada pengguna terdaftar' : 'Pencarian tidak menemukan hasil'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-slate-100 dark:border-zinc-800/50 hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                          {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {user.name || '-'}
                          {user.id === currentUser?.id && <span className="ml-2 text-xs text-indigo-500 font-normal">(Anda)</span>}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.email}
                    </td>
                    <td className="px-6 py-4">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(user.created_at).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openModal(user)}
                          className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-zinc-800 shadow-sm border border-slate-200 dark:border-zinc-700 rounded-lg hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id, user.name || user.email)}
                          disabled={user.id === currentUser?.id}
                          className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 bg-white dark:bg-zinc-800 shadow-sm border border-slate-200 dark:border-zinc-700 rounded-lg hover:border-red-300 dark:hover:border-red-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          title={user.id === currentUser?.id ? "Tidak dapat menghapus diri sendiri" : "Hapus"}
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
                {formData.id ? 'Edit User' : 'Tambah User Baru'}
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
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Misal: Budi Santoso"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-950/50 border border-slate-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 transition-all outline-none"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@contoh.com"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-950/50 border border-slate-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 transition-all outline-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-zinc-300 flex justify-between">
                  <span>Password {formData.id ? '(Opsional)' : <span className="text-red-500">*</span>}</span>
                  {formData.id && <span className="text-xs text-slate-400 font-normal">Kosongkan jika tidak diubah</span>}
                </label>
                <input
                  type="password"
                  id="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-950/50 border border-slate-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 transition-all outline-none"
                  required={!formData.id}
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="role" className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
                  Role Akses <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as User['role'] })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-950/50 border border-slate-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 dark:text-white transition-all outline-none appearance-none cursor-pointer"
                    required
                  >
                    <option value="SURVEYOR">Surveyor (Input Harga)</option>
                    <option value="SUPER_ADMIN">Super Admin (Akses Penuh)</option>
                    <option value="USER">User Reguler (Tanpa Akses CMS)</option>
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
