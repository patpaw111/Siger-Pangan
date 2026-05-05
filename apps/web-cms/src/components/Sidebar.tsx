'use client';

import React from 'react';

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
      
      <div className="flex-1 p-4">
        {/* Navigasi akan ditambah di langkah berikutnya */}
      </div>
    </aside>
  );
}
