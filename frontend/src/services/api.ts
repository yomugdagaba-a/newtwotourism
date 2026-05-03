// src/services/api.ts
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://tourismsystem.onrender.com/api';

interface ApiResponse<T> {
  data: T;
}

// Global 401 handler - tries refresh first, then redirects to login
const handle401Error = async () => {
  // Try to refresh the token first
  const { refreshAccessToken, logout, refreshToken } = (await import('@/store/useAuthStore')).useAuthStore.getState();
  
  if (refreshToken) {
    console.log('🔄 401 received, attempting token refresh...');
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      console.log('✅ Token refreshed after 401, retrying...');
      return; // Don't redirect — caller should retry
    }
  }
  
  // Refresh failed or no refresh token — logout and redirect
  await logout();
  if (typeof window !== 'undefined') {
    if (!window.location.pathname.includes('/auth/login')) {
      const currentPath = window.location.pathname;
      const redirectUrl = currentPath !== '/' ? `/auth/login?redirect=${encodeURIComponent(currentPath)}` : '/auth/login';
      window.location.href = redirectUrl;
    }
  }
};

async function handleRegularResponse<T>(res: Response): Promise<ApiResponse<T>> {
  if (!res.ok) {
    const errorText = await res.text();
    
    // Handle 401 - redirect to login
    if (res.status === 401) {
      console.debug('🔒 API Auth Error: 401 - Session expired or invalid token');
      await handle401Error();
      const err: any = new Error('Session expired. Please login again.');
      err.status = res.status;
      err.body = errorText;
      throw err;
    }
    
    // Handle 403 - forbidden
    if (res.status === 403) {
      console.debug('🔒 API Auth Error: 403 - Access forbidden');
      const err: any = new Error('Access denied. You do not have permission.');
      err.status = res.status;
      err.body = errorText;
      throw err;
    }
    
    console.error('❌ API Error:', res.status, errorText);
    const err: any = new Error(errorText || `API failed: ${res.status}`);
    err.status = res.status;
    err.body = errorText;
    throw err;
  }
  return res.json();
}

// ✅ Auth API responses: { token: "..." } DIRECTLY (no data wrapper)
async function handleAuthResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorText = await res.text();
    console.error('❌ Auth Error:', res.status, errorText);
    const err: any = new Error(errorText || `Auth failed: ${res.status}`);
    err.status = res.status;
    err.body = errorText;
    throw err;
  }
  return res.json();
}

export async function get<T>(url: string, token?: string): Promise<ApiResponse<T>> {
  console.log('🔗 GET →', `${API_BASE_URL}${url}`);
  return handleRegularResponse<T>(await fetch(`${API_BASE_URL}${url}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  }));
}

export async function post<T>(url: string, body: unknown, token?: string): Promise<ApiResponse<T>> {
  console.log('🔗 POST →', `${API_BASE_URL}${url}`);
  return handleRegularResponse<T>(await fetch(`${API_BASE_URL}${url}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  }));
}

export async function put<T>(url: string, body: unknown, token?: string): Promise<ApiResponse<T>> {
  console.log('🔗 PUT →', `${API_BASE_URL}${url}`);
  return handleRegularResponse<T>(await fetch(`${API_BASE_URL}${url}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  }));
}

export async function del<T>(url: string, token?: string): Promise<ApiResponse<T>> {
  console.log('🔗 DELETE →', `${API_BASE_URL}${url}`);
  return handleRegularResponse<T>(await fetch(`${API_BASE_URL}${url}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  }));
}

// ✅ SPECIAL: Direct auth endpoints (no data wrapper)
export async function authPost<T>(url: string, body: unknown): Promise<T> {
  console.log('🔐 AUTH POST →', `${API_BASE_URL}${url}`);
  return handleAuthResponse<T>(await fetch(`${API_BASE_URL}${url}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  }));
}

export const api = { 
  get, 
  post, 
  put, 
  del,
  authPost  // ✅ New helper for auth endpoints
};
