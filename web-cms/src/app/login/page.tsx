'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/lib/api';

const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(() => {
    // Tangkap error dari callback Google (misal: akun tidak ditemukan)
    const errQuery = searchParams.get('error');
    if (errQuery === 'GoogleAccountNotFound') {
      return 'Gagal Masuk: Akun Google ini belum terdaftar. Hubungi Super Admin.';
    }
    if (errQuery === 'RoleNotAllowed') {
      return 'Akses Ditolak: Web CMS hanya untuk Super Admin dan Surveyor.';
    }
    return null;
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login', data);
      
      // Cegat jika role adalah USER biasa
      if (response.data.user?.role === 'USER') {
        setError('Akses Ditolak: Web CMS hanya untuk Super Admin dan Surveyor.');
        return;
      }

      localStorage.setItem('access_token', response.data.access_token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Email atau password salah');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 text-center">Login Siger Pangan</h1>
        <p className="text-slate-500 mt-2 text-center mb-8">Silakan masuk ke akun Anda</p>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input 
              {...register('email')}
              type="email" 
              placeholder="admin@sigerpangan.my.id"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 transition-all"
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Password</label>
            <input 
              {...register('password')}
              type="password" 
              placeholder="••••••••"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 transition-all"
            />
            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md shadow-indigo-100 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Sedang Masuk...' : 'Masuk ke Dashboard'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-100">
          <button 
            type="button"
            onClick={() => {
              // Redirect ke backend sesuai panduan WEB_CMS_DEV_GUIDE.md
              const baseURL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8081';
              window.location.href = `${baseURL}/api/v1/auth/google`;
            }}
            className="w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <img src="https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png" alt="Google" className="w-5 h-5" />
            Masuk dengan Google
          </button>
        </div>
      </div>
    </div>
  );
}
