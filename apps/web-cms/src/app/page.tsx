'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, LogIn, ShieldCheck } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      router.push('/dashboard');
    } else {
      setIsChecking(false);
    }
  }, [router]);

  if (isChecking) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-indigo-200 mb-8 animate-bounce-slow">
          <ShieldCheck size={40} />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
          Siger Pangan <span className="text-indigo-600">CMS</span>
        </h1>
        
        <p className="max-w-lg text-lg text-slate-500 mb-10 leading-relaxed">
          Panel manajemen pusat untuk memantau harga komoditas, mengelola wilayah, dan mengontrol mesin scraper data pangan di Provinsi Lampung.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          <Link
            href="/login"
            className="flex-1 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-100 active:scale-95"
          >
            <LogIn size={20} />
            Masuk ke Panel
          </Link>
          
          <Link
            href="/dashboard"
            className="flex-1 h-14 bg-white border-2 border-slate-200 hover:border-indigo-600 hover:text-indigo-600 text-slate-600 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <LayoutDashboard size={20} />
            Dashboard
          </Link>
        </div>
      </main>

      <footer className="p-8 text-center text-slate-400 text-sm border-t border-slate-50">
        &copy; 2026 Siger Pangan. Semua hak dilindungi.
      </footer>
    </div>
  );
}
