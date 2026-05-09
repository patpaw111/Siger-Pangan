'use client';

import React from 'react';
import { User } from 'lucide-react';

export default function Header() {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shadow-sm">
      <div className="text-slate-400 text-sm font-medium uppercase tracking-wider">
        Panel Administrasi
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold text-slate-900">Admin Siger</p>
          <p className="text-xs text-slate-500">admin@sigerpangan.my.id</p>
        </div>
        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center border border-indigo-100">
          <User size={20} />
        </div>
      </div>
    </header>
  );
}
