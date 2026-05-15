import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  console.error('[api.ts] NEXT_PUBLIC_API_URL is not set! Please create web-cms/.env.local');
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor untuk menyematkan Token JWT di setiap request
api.interceptors.request.use((config) => {
  // Hanya sematkan token jika request dikirim ke baseURL kita sendiri
  // Ini mencegah kebocoran token (token leakage) ke domain eksternal
  const isInternalRequest = !config.url?.startsWith('http') || 
                           config.url?.startsWith(config.baseURL || '');

  if (typeof window !== 'undefined' && isInternalRequest) {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor untuk menangani error respons secara global
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Jika Unauthorized (401), hapus token dan arahkan ke login jika perlu
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        // window.location.href = '/login'; // Sesuaikan dengan route login Anda
      }
    }
    return Promise.reject(error);
  }
);

export default api;
