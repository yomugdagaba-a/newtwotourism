// src/services/api.ts
// Using Next.js proxy to backend HTTPS
export const API_BASE_URL = "/api";

interface ApiResponse<T> {
  data: T;
}

// Global 401 handler - will redirect to login
const handle401Error = () => {
  // Clear stored tokens
  if (typeof window !== 'undefined') {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    
    // Only redirect if not already on login page
    if (!window.location.pathname.includes('/auth/login')) {
      console.log('🔒 Session expired, redirecting to login...');
      // Include current path as redirect parameter
      const currentPath = window.location.pathname;
      const redirectUrl = currentPath !== '/' ? `/auth/login?redirect=${encodeURIComponent(currentPath)}` : '/auth/login';
      window.location.href = redirectUrl;
    }
  }
};

// ✅ Regular API responses: { data: { ... } }
async function handleRegularResponse<T>(res: Response): Promise<ApiResponse<T>> {
  if (!res.ok) {
    const errorText = await res.text();
    
    // Handle 401 - redirect to login
    if (res.status === 401) {
      console.debug('🔒 API Auth Error: 401 - Session expired or invalid token');
      handle401Error();
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
