import React from 'react';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 text-center">Login Siger Pangan</h1>
        <p className="text-slate-500 mt-2 text-center mb-8">Silakan masuk ke akun Anda</p>
        
        <form className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input 
              type="email" 
              placeholder="admin@sigerpangan.my.id"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Password</label>
            <input 
              type="password" 
              placeholder="••••••••"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          <button 
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md shadow-indigo-100 transition-all active:scale-95"
          >
            Masuk ke Dashboard
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-100">
          <button 
            type="button"
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
