import { TestSeriesBundle, OFFICIAL_BUNDLES_CATALOG } from '../data/bundleCatalog';

const BUNDLE_STORAGE_KEY = 'cgssb_custom_bundles_catalog_v2';

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
      return parsed;
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
  return updated;
};

export const deleteStoredBundle = (bundleId: string): TestSeriesBundle[] => {
  const list = getStoredBundles();
  const updated = list.filter(b => b.id !== bundleId && b.slug !== bundleId);
  saveStoredBundles(updated);
  return updated;
};

export const resetBundlesToDefault = (): TestSeriesBundle[] => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(BUNDLE_STORAGE_KEY);
    localStorage.setItem(BUNDLE_STORAGE_KEY, JSON.stringify(OFFICIAL_BUNDLES_CATALOG));
  }
  return OFFICIAL_BUNDLES_CATALOG;
};
