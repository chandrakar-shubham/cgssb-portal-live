import React, { ComponentType, LazyExoticComponent } from 'react';

/**
 * Enhanced React.lazy wrapper that automatically handles Vite chunk load failures
 * (which occur when new builds deploy and previous chunk hashes are invalidated).
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  retries = 2,
  interval = 1000
): LazyExoticComponent<T> {
  return React.lazy(async () => {
    try {
      return await factory();
    } catch (error: any) {
      const isChunkError =
        error?.message?.includes('Failed to fetch dynamically imported module') ||
        error?.message?.includes('Importing a module script failed') ||
        error?.name === 'ChunkLoadError';

      if (isChunkError && typeof window !== 'undefined') {
        // Prevent infinite reload loop using session storage key
        const key = `chunk_reload_${window.location.pathname}`;
        const hasReloaded = sessionStorage.getItem(key);
        if (!hasReloaded) {
          sessionStorage.setItem(key, 'true');
          window.location.reload();
          // Return a hanging promise while the page reloads
          return new Promise<{ default: T }>(() => {});
        }
      }

      // Retry logic for transient network blips
      for (let i = 0; i < retries; i++) {
        try {
          await new Promise((resolve) => setTimeout(resolve, interval));
          return await factory();
        } catch {
          // continue loop
        }
      }

      throw error;
    }
  });
}
