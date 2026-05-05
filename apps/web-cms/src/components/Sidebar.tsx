'use client';

import React from 'react';
import Link from 'next/link';
import { LayoutDashboard, Package, Map, Settings } from 'lucide-react';

export default function Sidebar() {

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen transition-all">
      {/* Brand Logo */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold">
            SP
          </div>
          <span className="text-xl font-bold text-white tracking-tight">Siger Pangan</span>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-3 py-2 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-900/50 transition-all"
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="font-medium">Dashboard</span>
        </Link>
        
        <Link
          href="/dashboard/komoditas"
          className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-800 hover:text-white transition-all group"
        >
          <Package className="w-5 h-5 text-slate-400 group-hover:text-white" />
          <span className="font-medium">Komoditas</span>
        </Link>

        <Link
          href="/dashboard/wilayah"
          className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-800 hover:text-white transition-all group"
        >
          <Map className="w-5 h-5 text-slate-400 group-hover:text-white" />
          <span className="font-medium">Wilayah/Pasar</span>
        </Link>
      </nav>

      {/* Footer / Settings */}
      <div className="p-4 border-t border-slate-800">
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-800 hover:text-white transition-all text-slate-400"
        >
          <Settings className="w-5 h-5" />
          <span className="font-medium">Pengaturan</span>
        </Link>
      </div>
    </aside>
  );
}
