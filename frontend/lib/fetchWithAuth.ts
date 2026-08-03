// lib/fetchWithAuth.ts

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  // 1. ดึง Token จาก LocalStorage (เช็ก typeof window ป้องกัน Error ฝั่ง Server-side)
  let token = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('accessToken');
  }

  // 2. ตั้งค่า Headers พื้นฐานและแนบ Token
  const headers = new Headers(options.headers || {});
  const method = (options.method ?? 'GET').toUpperCase();
  if (method !== 'GET' && method !== 'HEAD') {
    headers.set('Content-Type', 'application/json');
  }
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // 3. ยิง Request ไปยัง Backend
  const response = await fetch(url, {
    ...options,
    headers,
  });

  // 4. ดักจับเคส Token หมดอายุ หรือไม่มีสิทธิ์ (401 Unauthorized)
  if (response.status === 401) {
    console.error('Token expired or unauthorized. Redirecting to login...');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      window.location.href = '/login'; // เด้งกลับไปหน้า Login
    }
  }

  return response;
}