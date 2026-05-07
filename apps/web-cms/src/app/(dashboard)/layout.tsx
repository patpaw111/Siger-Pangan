'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import api from '@/lib/api';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Verifikasi token ke backend sesuai panduan FRONTEND_INTEGRATION_GUIDE.md
        await api.get('/auth/me');
        setIsAuthorized(true);
      } catch (error) {
        // Jika token tidak valid atau tidak ada, lempar ke login
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  if (!isAuthorized) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar - Fix di kiri */}
      <Sidebar />

      {/* Area Konten Utama */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header - Fix di atas */}
        <Header />

        {/* Konten Halaman - Scrollable */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
