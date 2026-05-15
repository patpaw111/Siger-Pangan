'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, Map, Search, Users, X, ChevronRight } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils'; // Assuming this exists or using simple logic

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get('/auth/me');
        setUserRole(response.data.role);
      } catch (error) {
        console.error('Failed to fetch role for sidebar');
      }
    };
    fetchUser();
  }, []);

  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Master Komoditas', href: '/dashboard/komoditas', icon: Package },
    { name: 'Master Wilayah', href: '/dashboard/wilayah', icon: Map },
    { name: 'Kontrol Scraper', href: '/dashboard/scraper', icon: Search },
  ];

  // Tambahkan Manajemen User hanya jika SUPER_ADMIN
  if (userRole === 'SUPER_ADMIN') {
    menuItems.push({ name: 'Manajemen User', href: '/dashboard/users', icon: Users });
  }

  return (
    <aside className={cn(
      "fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 dark:bg-zinc-950 text-slate-300 flex flex-col h-screen transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 border-r border-slate-800 dark:border-zinc-800",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      {/* Brand Logo */}
      <div className="p-6 border-b border-slate-800 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-600/20">
            SP
          </div>
          <span className="text-xl font-bold text-white tracking-tight">Siger Pangan</span>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto mt-4 custom-scrollbar">
        <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Main Menu</p>
        
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group",
                isActive 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" 
                  : "hover:bg-slate-800 dark:hover:bg-zinc-900 hover:text-white text-slate-400"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon size={20} className={cn(
                  "transition-colors",
                  isActive ? "text-white" : "text-slate-500 group-hover:text-indigo-400"
                )} />
                <span className="font-medium text-sm">{item.name}</span>
              </div>
              {isActive && <ChevronRight size={14} className="text-indigo-200" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-6 border-t border-slate-800 dark:border-zinc-800">
        <div className="bg-slate-800/50 dark:bg-zinc-900/50 rounded-2xl p-4 border border-slate-700/50 dark:border-zinc-800">
          <p className="text-[10px] text-slate-500 font-medium">Siger Pangan CMS</p>
          <p className="text-xs text-slate-300 mt-0.5 font-semibold">v1.2.0 - Stable</p>
        </div>
      </div>
    </aside>
  );
}
