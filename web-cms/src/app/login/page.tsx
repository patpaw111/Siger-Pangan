'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/lib/api';
import { Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';

const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [error, setError] = useState<string | null>(() => {
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-zinc-950 p-4 transition-colors duration-300 relative">
      
      {/* Theme Toggle Button */}
      {mounted && (
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="absolute top-6 right-6 p-2.5 rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Toggle Dark Mode"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      )}

      <div className="w-full max-w-md bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800 transition-colors duration-300">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-50 text-center">Login Siger Pangan</h1>
        <p className="text-slate-500 dark:text-zinc-400 mt-2 text-center mb-8">Silakan masuk ke akun Anda</p>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {error && <div className="p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-500/20 leading-relaxed">{error}</div>}
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">Email</label>
            <input 
              {...register('email')}
              type="email" 
              placeholder="nama@email.com"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg outline-none focus:border-indigo-500 dark:focus:border-indigo-500 text-slate-900 dark:text-zinc-50 transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-600"
            />
            {errors.email && <p className="text-xs text-red-500 dark:text-red-400">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">Password</label>
            <div className="relative">
              <input 
                {...register('password')}
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••"
                className="w-full px-4 py-2.5 pr-12 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg outline-none focus:border-indigo-500 dark:focus:border-indigo-500 text-slate-900 dark:text-zinc-50 transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-600 tracking-wide"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors focus:outline-none"
                title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500 dark:text-red-400">{errors.password.message}</p>}
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold rounded-lg shadow-md shadow-indigo-100 dark:shadow-none transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          >
            {isLoading ? 'Sedang Masuk...' : 'Masuk ke Dashboard'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-zinc-800">
          <button 
            type="button"
            onClick={() => {
              const baseURL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8081';
              window.location.href = `${baseURL}/api/v1/auth/google`;
            }}
            className="w-full py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-medium rounded-lg transition-all flex items-center justify-center gap-3 shadow-sm dark:shadow-none"
          >
            <img src="https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png" alt="Google" className="w-5 h-5" />
            Masuk dengan Google
          </button>
        </div>
      </div>
    </div>
  );
}
