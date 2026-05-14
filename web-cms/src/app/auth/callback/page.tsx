'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      // Simpan token yang didapat dari Backend ke localStorage
      localStorage.setItem('access_token', token);
      
      // Redirect ke Dashboard (di sana nanti akan di-cek rolenya)
      router.push('/dashboard');
    } else {
      // Kalau tidak ada token, berarti gagal login
      router.push('/login?error=GoogleLoginFailed');
    }
  }, [router, searchParams]);

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
      <p className="text-slate-600 font-medium">Memproses Autentikasi Google...</p>
    </div>
  );
}
