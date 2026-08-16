// lib/fetchWithAuth.ts

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  // 1. Get Token from LocalStorage (check typeof window to prevent Server-side errors)
  let token = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('accessToken');
  }

  // 2. Set basic Headers and attach Token
  const headers = new Headers(options.headers || {});
  const method = (options.method ?? 'GET').toUpperCase();
  if (method !== 'GET' && method !== 'HEAD') {
    headers.set('Content-Type', 'application/json');
  }
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // 3. Send request to backend
  const response = await fetch(url, {
    ...options,
    headers,
  });

  // 4. Handle token expiration or unauthorized access (401 Unauthorized)
  if (response.status === 401) {
    console.error('Token expired or unauthorized. Redirecting to login...');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      window.location.href = '/login'; // Redirect to login page
    }
  }

  return response;
}