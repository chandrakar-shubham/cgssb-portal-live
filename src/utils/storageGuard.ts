/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * FAANG Production Storage Guard Utility
 */

export const StorageGuard = {
  getItem<T>(key: string, fallback: T): T {
    try {
      const item = localStorage.getItem(key);
      if (!item) return fallback;
      return JSON.parse(item) as T;
    } catch (e) {
      console.warn(`StorageGuard: Error reading ${key} from localStorage`, e);
      return fallback;
    }
  },

  setItem(key: string, value: unknown): boolean {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      return true;
    } catch (e: any) {
      console.warn(`StorageGuard: Quota exceeded or error writing ${key}`, e);
      // Attempt LRU / cleanup of non-essential keys
      try {
        localStorage.removeItem('cgssb_attempts'); // Prune non-critical logs
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch {
        return false;
      }
    }
  },

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {}
  }
};
