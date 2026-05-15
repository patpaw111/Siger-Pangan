'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, LogOut, Menu, Sun, Moon, Bell } from 'lucide-react';
import { useTheme } from 'next-themes';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [userData, setUserData] = useState<{ email: string; role: string; name?: string; avatar_url?: string } | null>(null);

  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
    const fetchUser = async () => {
      try {
        const response = await api.get('/auth/me');
        setUserData(response.data);
      } catch (error) {
        console.error('Failed to fetch user data');
      }
    };
    fetchUser();

    // Notifier: Poll scraper status every 30s
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/scraper/status');
        const data = res.data;
        const newNotifs = [];
        
        if (data.queue?.active > 0) {
          newNotifs.push({
            id: 'active',
            title: 'Proses Sinkronisasi',
            message: `${data.queue.active} tugas sedang berjalan untuk memperbarui harga.`,
            time: 'Saat ini',
            type: 'info'
          });
        }
        
        if (data.lastCompletedJob) {
          const finishedDate = new Date(data.lastCompletedJob.finishedOn);
          newNotifs.push({
            id: data.lastCompletedJob.id,
            title: 'Sinkronisasi Selesai',
            message: `Pembaruan data harga berhasil diselesaikan.`,
            time: finishedDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            type: 'success'
          });
        }
        
        setNotifications(newNotifs);
      } catch (e) {
        // Silent fail for notifications
      }
    };
    
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    router.push('/login');
  };

  return (
    <header className="h-20 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 transition-colors duration-300">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-lg transition-colors"
        >
          <Menu size={24} />
        </button>
        <div className="hidden md:block">
          <h2 className="text-sm font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
            Siger Pangan CMS
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Actions */}
        <div className="flex items-center gap-1 border-r border-slate-100 dark:border-zinc-800 pr-2 md:pr-4 mr-2 md:mr-4">
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-xl transition-all"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          )}
          <div className="relative">
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className={cn(
                "p-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-xl transition-all relative",
                isNotificationsOpen && "bg-slate-100 dark:bg-zinc-900"
              )}
            >
              <Bell size={20} />
              {notifications.length > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-zinc-950 animate-pulse"></span>
              )}
            </button>

            {/* Notification Dropdown */}
            {isNotificationsOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)}></div>
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 dark:text-zinc-50">Notifikasi</h4>
                    <span className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full">{notifications.length > 0 ? `${notifications.length} Baru` : 'Kosong'}</span>
                  </div>
                  <div className="max-h-96 overflow-y-auto divide-y divide-slate-50 dark:divide-zinc-800">
                    {notifications.length > 0 ? notifications.map((n) => (
                      <div key={n.id} className="p-4 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer">
                        <p className="text-xs font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                          <span className={cn("w-1.5 h-1.5 rounded-full", n.type === 'success' ? 'bg-emerald-500' : 'bg-amber-500')}></span>
                          {n.title}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">{n.message}</p>
                        <p className="text-[9px] text-slate-400 dark:text-zinc-500 mt-2">{n.time}</p>
                      </div>
                    )) : (
                      <div className="p-8 text-center text-slate-400 dark:text-zinc-500">
                        <p className="text-xs font-medium">Belum ada notifikasi baru.</p>
                      </div>
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <button 
                      onClick={() => { setNotifications([]); setIsNotificationsOpen(false); }}
                      className="w-full py-3 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors border-t border-slate-100 dark:border-zinc-800"
                    >
                      Tandai Semua Sudah Dibaca
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden lg:block">
            <p className="text-sm font-bold text-slate-900 dark:text-zinc-100 leading-none">
              {userData?.name || userData?.email.split('@')[0] || 'Admin'}
            </p>
            <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mt-1 uppercase tracking-wider">
              {userData?.role || 'Guest'}
            </p>
          </div>
          
          <div className="group relative">
            <button className="w-10 h-10 md:w-11 md:h-11 bg-slate-100 dark:bg-zinc-900 rounded-xl flex items-center justify-center border border-slate-200 dark:border-zinc-800 overflow-hidden hover:ring-2 hover:ring-indigo-500/20 transition-all">
              {userData?.avatar_url ? (
                <img src={userData.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={22} className="text-slate-400 dark:text-zinc-500" />
              )}
            </button>
            
            {/* Simple Dropdown placeholder */}
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-2 group-hover:translate-y-0 z-50">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-zinc-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 rounded-xl transition-colors"
              >
                <LogOut size={18} />
                Keluar
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
