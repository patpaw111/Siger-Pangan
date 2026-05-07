'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, LogOut } from 'lucide-react';
import api from '@/lib/api';

export default function Header() {
  const router = useRouter();
  const [userData, setUserData] = useState<{ email: string; role: string } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get('/auth/me');
        setUserData(response.data);
      } catch (error) {
        console.error('Failed to fetch user data');
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    router.push('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shadow-sm">
      <div className="text-slate-400 text-sm font-medium uppercase tracking-wider">
        Panel Administrasi
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4 border-r border-slate-100 pr-6">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-900">
              {userData?.email.split('@')[0] || 'Admin Siger'}
            </p>
            <p className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase">
              {userData?.role || 'Loading...'}
            </p>
          </div>
          <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center border border-slate-100">
            <User size={20} />
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 text-slate-400 hover:text-red-600 transition-colors group"
          title="Logout"
        >
          <LogOut size={20} className="group-hover:translate-x-0.5 transition-transform" />
          <span className="text-sm font-medium">Keluar</span>
        </button>
      </div>
    </header>
  );
}
