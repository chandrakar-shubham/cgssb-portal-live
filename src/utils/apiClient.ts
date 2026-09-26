/**
 * Centralized API Client for CGSSB Test Platform
 * - Automatically resolves backend API URL (detects Firebase Hosting vs Local vs Production)
 * - Automatically injects Admin Bearer Token for protected mutations
 * - Safely handles HTML fallbacks and provides actionable error messages
 */

export function getApiBaseUrl(): string {
  // If explicitly configured in Vite env
  if (import.meta.env.VITE_API_URL) {
    return (import.meta.env.VITE_API_URL as string).replace(/\/$/, '');
  }

  // If running inside browser
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    // If hosted on Firebase Hosting static CDN, point to production backend or custom origin
    if (host.endsWith('.web.app') || host.endsWith('.firebaseapp.com')) {
      // Return primary production API origin
      return 'https://cgssbtest.com';
    }
  }

  // Otherwise, use relative path (same origin: localhost, Cloud Run, or Hostinger fullstack)
  return '';
}

export function getAdminToken(): string | null {
  try {
    const saved = localStorage.getItem('cgssb_admin_session');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.token) {
        return parsed.token;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export interface ApiFetchOptions extends RequestInit {
  requireAuth?: boolean;
}

export async function apiFetch<T = any>(endpoint: string, options: ApiFetchOptions = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const fullUrl = `${baseUrl}${cleanEndpoint}`;

  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Auto-inject admin token if available
  const adminToken = getAdminToken();
  if (adminToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${adminToken}`);
  }

  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type') || '';
    
    // Check if server returned HTML instead of JSON (common Firebase Hosting static fallback issue)
    if (contentType.includes('text/html')) {
      const text = await response.text();
      if (text.includes('<!doctype html>') || text.includes('<html')) {
        throw new Error(
          `API endpoint '${cleanEndpoint}' returned an HTML page instead of JSON. ` +
          `If running on Firebase Hosting, ensure backend API is configured via VITE_API_URL.`
        );
      }
    }

    let data: any;
    try {
      data = await response.json();
    } catch {
      data = { success: response.ok };
    }

    if (!response.ok) {
      const errorMsg = data?.error || data?.message || `Request failed with status ${response.status}`;
      throw new Error(errorMsg);
    }

    return data as T;
  } catch (err: any) {
    console.error(`[API Client Error] ${options.method || 'GET'} ${cleanEndpoint}:`, err.message);
    throw err;
  }
}

export const api = {
  get: <T = any>(endpoint: string, options?: ApiFetchOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = any>(endpoint: string, body?: any, options?: ApiFetchOptions) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T = any>(endpoint: string, body?: any, options?: ApiFetchOptions) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T = any>(endpoint: string, options?: ApiFetchOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'DELETE' }),
};
