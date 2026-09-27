import { TestSeriesBundle, OFFICIAL_BUNDLES_CATALOG } from '../data/bundleCatalog';
import {
  fetchBundlesFromFirestore,
  saveBundleToFirestore,
  deleteBundleFromFirestore
} from '../firebase/firestoreService';

const BUNDLE_STORAGE_KEY = 'cgssb_custom_bundles_catalog_v2';

export const getAdminHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-admin-key': 'cgssb_admin_2026',
  };
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('cgssb_admin_session');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.token) {
          headers['Authorization'] = `Bearer ${parsed.token}`;
        }
      }
    }
  } catch {}
  return headers;
};

export const getStoredBundles = (): TestSeriesBundle[] => {
  if (typeof window === 'undefined') return OFFICIAL_BUNDLES_CATALOG;
  try {
    const raw = localStorage.getItem(BUNDLE_STORAGE_KEY);
    if (!raw) {
      // Initialize with official bundles
      localStorage.setItem(BUNDLE_STORAGE_KEY, JSON.stringify(OFFICIAL_BUNDLES_CATALOG));
      return OFFICIAL_BUNDLES_CATALOG;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Merge official bundles with stored bundles to ensure all test items and new official mocks are retained
      const bundleMap = new Map<string, TestSeriesBundle>();
      OFFICIAL_BUNDLES_CATALOG.forEach(b => {
        if (b && b.id) bundleMap.set(b.id, { ...b });
      });
      parsed.forEach(stored => {
        if (stored && stored.id) {
          const official = bundleMap.get(stored.id);
          if (official) {
            // Combine testItems avoiding duplicates
            const officialTestItems = official.testItems || [];
            const storedTestItems = stored.testItems || [];
            const itemMap = new Map<string, any>();
            officialTestItems.forEach((item: any) => itemMap.set(item.id, item));
            storedTestItems.forEach((item: any) => itemMap.set(item.id, item));

            bundleMap.set(stored.id, {
              ...official,
              ...stored,
              testItems: Array.from(itemMap.values()),
            });
          } else {
            bundleMap.set(stored.id, stored);
          }
        }
      });
      return Array.from(bundleMap.values());
    }
    return OFFICIAL_BUNDLES_CATALOG;
  } catch (err) {
    console.error('Error loading bundles from storage:', err);
    return OFFICIAL_BUNDLES_CATALOG;
  }
};

export const saveStoredBundles = (bundles: TestSeriesBundle[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(BUNDLE_STORAGE_KEY, JSON.stringify(bundles));
  } catch (err) {
    console.error('Error saving bundles to storage:', err);
  }
};

/**
 * Fetch bundles from Cloud Firestore, /api/bundles, or remote Cloud Run instance
 * and merge with local catalog, saving to local storage & notifying active components
 */
export const syncBundlesFromFirestore = async (
  remoteUrl?: string
): Promise<{ list: TestSeriesBundle[]; count: number; source: string }> => {
  const current = getStoredBundles();
  const map = new Map<string, TestSeriesBundle>();

  // Base with official bundles
  OFFICIAL_BUNDLES_CATALOG.forEach(b => { if (b && b.id) map.set(b.id, b); });
  // Overlay current local storage
  current.forEach(b => { if (b && b.id) map.set(b.id, b); });

  let sourceUsed = 'local';

  // 1. If remoteUrl or sync requested, trigger backend remote pull
  if (remoteUrl) {
    try {
      const pullRes = await fetch('/api/remote-sync/pull', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ remoteUrl }),
      }).catch(() => null);
      if (pullRes && pullRes.ok) {
        const pullData = await pullRes.json().catch(() => null);
        if (pullData?.bundles && Array.isArray(pullData.bundles)) {
          pullData.bundles.forEach((b: TestSeriesBundle) => {
            if (b && b.id) map.set(b.id, b);
          });
          sourceUsed = 'remote-url';
        }
      }
    } catch (err) {
      console.warn('Remote sync pull warning:', err);
    }
  }

  // 2. Fetch directly from Cloud Firestore
  try {
    const firestoreBundles = await fetchBundlesFromFirestore();
    if (firestoreBundles && Array.isArray(firestoreBundles) && firestoreBundles.length > 0) {
      firestoreBundles.forEach(b => {
        if (b && b.id) map.set(b.id, b);
      });
      sourceUsed = sourceUsed === 'remote-url' ? 'remote-url+firestore' : 'firestore';
    }
  } catch (err) {
    console.warn('Firestore bundle fetch note:', err);
  }

  // 3. Fallback / supplement with server endpoint /api/bundles
  try {
    const res = await fetch('/api/bundles').catch(() => null);
    if (res && res.ok) {
      const data = await res.json().catch(() => null);
      const list = Array.isArray(data) ? data : (data?.bundles || []);
      if (Array.isArray(list) && list.length > 0) {
        list.forEach(b => {
          if (b && b.id) map.set(b.id, b);
        });
        if (sourceUsed === 'local') sourceUsed = 'server-api';
      }
    }
  } catch (err) {
    console.warn('Sync bundles from /api/bundles warning:', err);
  }

  const merged = Array.from(map.values());
  saveStoredBundles(merged);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cgssb-bundles-updated', { detail: merged }));
  }

  return { list: merged, count: merged.length, source: sourceUsed };
};

export const findBundleBySlugOrId = (identifier: string, bundles?: TestSeriesBundle[]): TestSeriesBundle | undefined => {
  const list = bundles || getStoredBundles();
  const cleanId = identifier.trim().toLowerCase();
  return list.find(b => b.slug.toLowerCase() === cleanId || b.id.toLowerCase() === cleanId);
};

export const saveSingleBundle = (bundle: TestSeriesBundle): TestSeriesBundle[] => {
  const list = getStoredBundles();
  const existingIndex = list.findIndex(b => b.id === bundle.id || b.slug === bundle.slug);
  let updated: TestSeriesBundle[];
  if (existingIndex >= 0) {
    updated = [...list];
    updated[existingIndex] = bundle;
  } else {
    updated = [bundle, ...list];
  }
  saveStoredBundles(updated);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cgssb-bundles-updated', { detail: updated }));
  }

  // Async background sync to Firebase Firestore
  saveBundleToFirestore(bundle).catch(err => {
    console.warn('Firestore bundle save warning:', err);
  });

  // Also sync to backend API if available
  fetch('/api/bundles', {
    method: 'POST',
    headers: getAdminHeaders(),
    body: JSON.stringify(bundle)
  }).catch(() => null);

  return updated;
};

export const deleteStoredBundle = (bundleId: string): TestSeriesBundle[] => {
  const list = getStoredBundles();
  const updated = list.filter(b => b.id !== bundleId && b.slug !== bundleId);
  saveStoredBundles(updated);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cgssb-bundles-updated', { detail: updated }));
  }

  // Async background sync to Firebase Firestore
  deleteBundleFromFirestore(bundleId).catch(err => {
    console.warn('Firestore bundle delete warning:', err);
  });

  fetch(`/api/bundles/${bundleId}`, {
    method: 'DELETE',
    headers: getAdminHeaders(),
  }).catch(() => null);

  return updated;
};

export const toggleBundlePublish = (bundleId: string): { updatedList: TestSeriesBundle[]; newStatus: boolean } => {
  const list = getStoredBundles();
  const existing = list.find(b => b.id === bundleId || b.slug === bundleId);
  const currentlyPublished = existing ? (existing.isPublished !== false && !existing.isDraft) : true;
  const newStatus = !currentlyPublished;

  const updated = list.map(b => {
    if (b.id === bundleId || b.slug === bundleId) {
      return {
        ...b,
        isPublished: newStatus,
        isDraft: !newStatus
      };
    }
    return b;
  });

  saveStoredBundles(updated);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cgssb-bundles-updated', { detail: updated }));
  }

  const updatedBundle = updated.find(b => b.id === bundleId || b.slug === bundleId);
  if (updatedBundle) {
    saveBundleToFirestore(updatedBundle).catch(err => {
      console.warn('Firestore bundle toggle warning:', err);
    });

    fetch('/api/bundles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedBundle)
    }).catch(() => null);
  }

  return { updatedList: updated, newStatus };
};

export const resetBundlesToDefault = (): TestSeriesBundle[] => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(BUNDLE_STORAGE_KEY);
    localStorage.setItem(BUNDLE_STORAGE_KEY, JSON.stringify(OFFICIAL_BUNDLES_CATALOG));
  }
  return OFFICIAL_BUNDLES_CATALOG;
};
