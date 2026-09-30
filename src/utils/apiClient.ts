/**
 * Centralized API Client for CGSSB Test Platform
 * - Automatically resolves backend API URL (detects Firebase Hosting vs Local vs Production)
 * - Automatically injects Admin Bearer Token for protected mutations
 * - Safely handles HTML fallbacks and provides actionable error messages
 */

export function getApiBaseUrl(): string {
  // Firebase Hosting rewrites /api/** directly to the Firebase Function.
  // Keeping API calls same-origin avoids a second public backend domain and
  // lets Firebase Hosting enforce the single-domain security boundary.
  if (import.meta.env.VITE_API_URL) {
    return (import.meta.env.VITE_API_URL as string).replace(/\/$/, '');
  }
  return '';
}

export function getAdminToken(): string | null {
  try {
    const saved = sessionStorage.getItem('cgssb_admin_session');
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

export function getAdminHeaders(): Record<string, string> {
  const token = getAdminToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface ApiFetchOptions extends RequestInit {
  requireAuth?: boolean;
  requireAdmin?: boolean;
}

export async function apiFetch<T = any>(endpoint: string, options: ApiFetchOptions = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const fullUrl = `${baseUrl}${cleanEndpoint}`;

  const headers = new Headers(options.headers || {});

  if (options.requireAdmin && !getAdminToken()) {
    throw new Error('Admin authentication is required.');
  }

  if (options.requireAuth && !getAdminToken()) {
    try {
      const { auth } = await import('../firebase/config');
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error('Student authentication is required.');
      const idToken = await firebaseUser.getIdToken();
      headers.set('Authorization', `Bearer ${idToken}`);
    } catch (err: any) {
      if (err?.message === 'Student authentication is required.') throw err;
      throw new Error('Unable to establish student authentication.');
    }
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
