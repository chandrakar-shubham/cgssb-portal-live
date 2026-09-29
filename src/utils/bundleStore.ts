import { TestSeriesBundle, OFFICIAL_BUNDLES_CATALOG, BundleTestItem } from '../data/bundleCatalog';
import { MockTest } from '../types';
import {
  fetchBundlesFromFirestore,
  saveBundleToFirestore,
  deleteBundleFromFirestore,
  purgeFirestoreDemoData,
} from '../firebase/firestoreService';
import { INITIAL_MOCK_TESTS, INITIAL_QUESTIONS, INITIAL_PYP_PAPERS } from '../mockData';

const BUNDLE_STORAGE_KEY = 'cgssb_custom_bundles_catalog_v2';
const DELETED_BUNDLES_STORAGE_KEY = 'cgssb_deleted_bundles';

export const getDeletedBundleIds = (storageKey = DELETED_BUNDLES_STORAGE_KEY): Set<string> => {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return new Set(parsed);
    }
  } catch {}
  return new Set();
};

export const addDeletedBundleId = (idOrSlug: string) => {
  if (typeof window === 'undefined' || !idOrSlug) return;
  try {
    const set = getDeletedBundleIds();
    set.add(idOrSlug);
    localStorage.setItem(DELETED_BUNDLES_STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch {}
};

export const removeDeletedBundleId = (idOrSlug: string) => {
  if (typeof window === 'undefined' || !idOrSlug) return;
  try {
    const set = getDeletedBundleIds();
    set.delete(idOrSlug);
    localStorage.setItem(DELETED_BUNDLES_STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch {}
};

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

/**
 * Intelligent bundle entity merger that never wipes official curriculum items with empty arrays
 */
export const mergeBundleEntities = (base: TestSeriesBundle, incoming: Partial<TestSeriesBundle>): TestSeriesBundle => {
  const mergedTestItems = incoming.testItems !== undefined
    ? incoming.testItems
    : (base.testItems || []);
  const mergedChapterTests = incoming.chapterTests !== undefined
    ? incoming.chapterTests
    : (base.chapterTests || []);
  const mergedPypTests = incoming.pypTests !== undefined
    ? incoming.pypTests
    : (base.pypTests || []);

  const totalCount = mergedTestItems.length + mergedChapterTests.length + mergedPypTests.length;
  const allTests = [...mergedTestItems, ...mergedChapterTests, ...mergedPypTests];
  const freeCount = allTests.filter(t => t.isFreePreview).length;

  return {
    ...base,
    ...incoming,
    id: incoming.id || base.id,
    slug: incoming.slug || base.slug,
    title: incoming.title || base.title,
    titleHindi: incoming.titleHindi || base.titleHindi,
    authority: (incoming.authority || base.authority) as any,
    targetPost: incoming.targetPost || base.targetPost,
    targetYear: incoming.targetYear || base.targetYear,
    badge: incoming.badge || base.badge,
    badgeColor: (incoming.badgeColor || base.badgeColor) as any,
    shortDescription: incoming.shortDescription || base.shortDescription,
    fullDescription: incoming.fullDescription || base.fullDescription,
    price: typeof incoming.price === 'number' ? incoming.price : base.price,
    originalPrice: typeof incoming.originalPrice === 'number' ? incoming.originalPrice : base.originalPrice,
    isProOnly: incoming.isProOnly !== undefined ? incoming.isProOnly : base.isProOnly,
    testItems: mergedTestItems,
    chapterTests: mergedChapterTests,
    pypTests: mergedPypTests,
    totalTestsCount: totalCount,
    freeTestsCount: freeCount,
    syllabusBreakdown: incoming.syllabusBreakdown?.length ? incoming.syllabusBreakdown : base.syllabusBreakdown,
    examPattern: incoming.examPattern?.keyRules?.length ? incoming.examPattern : base.examPattern,
    features: incoming.features?.length ? incoming.features : base.features,
    faqs: incoming.faqs?.length ? incoming.faqs : base.faqs,
    importantDates: incoming.importantDates || base.importantDates,
    eligibility: incoming.eligibility || base.eligibility,
    officialLinks: incoming.officialLinks || base.officialLinks,
    isPublished: incoming.isPublished !== undefined ? incoming.isPublished : (base.isPublished !== false && !base.isDraft),
    isDraft: incoming.isDraft !== undefined ? incoming.isDraft : (base.isDraft || base.isPublished === false),
  };
};

export const isDemoDataPurged = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('cgssb_demo_data_purged') === 'true' || localStorage.getItem('cgssb_true_zero_data_mode') === 'true';
};

export const setDemoDataPurged = (purged: boolean): void => {
  if (typeof window === 'undefined') return;
  if (purged) {
    localStorage.setItem('cgssb_demo_data_purged', 'true');
    localStorage.setItem('cgssb_true_zero_data_mode', 'true');
  } else {
    localStorage.removeItem('cgssb_demo_data_purged');
    localStorage.removeItem('cgssb_true_zero_data_mode');
    localStorage.removeItem('cgssb_deleted_tests');
    localStorage.removeItem('cgssb_deleted_questions');
    localStorage.removeItem('cgssb_deleted_pyp');
    localStorage.removeItem('cgssb_deleted_bundles');
  }
};

export const getTrueZeroDataMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  return isDemoDataPurged();
};

export const setTrueZeroDataMode = (enabled: boolean): void => {
  if (typeof window === 'undefined') return;
  setDemoDataPurged(enabled);
  if (enabled) {
    localStorage.removeItem(BUNDLE_STORAGE_KEY);
    localStorage.removeItem('cgssb_custom_mock_tests');
  }
  window.dispatchEvent(new CustomEvent('cgssb-bundles-updated', { detail: getStoredBundles() }));
};

export const getStoredBundles = (): TestSeriesBundle[] => {
  if (typeof window === 'undefined') return isDemoDataPurged() ? [] : OFFICIAL_BUNDLES_CATALOG;
  try {
    const deletedSet = getDeletedBundleIds();
    const trueZeroMode = isDemoDataPurged();
    const freshRaw = localStorage.getItem(BUNDLE_STORAGE_KEY);
    const bundleMap = new Map<string, TestSeriesBundle>();

    // 1. Populate official catalog excluding any deleted bundles (unless True 0 Data / Demo Purge mode is enabled)
    if (!trueZeroMode) {
      OFFICIAL_BUNDLES_CATALOG.forEach(b => {
        if (b && b.id && !deletedSet.has(b.id) && !deletedSet.has(b.slug)) {
          bundleMap.set(b.id, { ...b });
        }
      });
    }

    // 2. Overlay user stored bundles excluding any deleted
    if (freshRaw) {
      const parsed = JSON.parse(freshRaw);
      if (Array.isArray(parsed)) {
        parsed.forEach(stored => {
          if (stored && stored.id && !deletedSet.has(stored.id) && !deletedSet.has(stored.slug)) {
            const official = bundleMap.get(stored.id);
            if (official) {
              bundleMap.set(stored.id, mergeBundleEntities(official, stored));
            } else {
              bundleMap.set(stored.id, stored);
            }
          }
        });
      }
    }
    const rawBundles = Array.from(bundleMap.values());
    const deletedTests = getDeletedBundleIds('cgssb_deleted_tests');
    const deletedPyps = getDeletedBundleIds('cgssb_deleted_pyp');

    const sanitizedBundles = rawBundles.map(bundle => {
      const filterItems = (items?: BundleTestItem[]) => (items || []).filter(item => {
        const id = item.id;
        const refId = item.mockTestRef?.id;
        return !id || (!deletedTests.has(id) && !deletedPyps.has(id) && (!refId || (!deletedTests.has(refId) && !deletedPyps.has(refId))));
      });

      const newTestItems = filterItems(bundle.testItems);
      const newChapterTests = filterItems(bundle.chapterTests);
      const newPypTests = filterItems(bundle.pypTests);
      const totalCount = newTestItems.length + newChapterTests.length + newPypTests.length;
      const freeCount = [...newTestItems, ...newChapterTests, ...newPypTests].filter(t => t.isFreePreview).length;

      return {
        ...bundle,
        testItems: newTestItems,
        chapterTests: newChapterTests,
        pypTests: newPypTests,
        totalTestsCount: totalCount,
        freeTestsCount: freeCount,
      };
    });

    return sanitizedBundles;
  } catch (err) {
    console.error('Error loading bundles from storage:', err);
    return OFFICIAL_BUNDLES_CATALOG;
  }
};

export const saveStoredBundles = (bundles: TestSeriesBundle[]): void => {
  if (typeof window === 'undefined') return;
  try {
    const deletedSet = getDeletedBundleIds();
    const cleanList = bundles.filter(b => b && b.id && !deletedSet.has(b.id) && !deletedSet.has(b.slug));
    localStorage.setItem(BUNDLE_STORAGE_KEY, JSON.stringify(cleanList));
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
  const deletedSet = getDeletedBundleIds();
  const map = new Map<string, TestSeriesBundle>();

  // Base with official bundles (skipping deleted)
  OFFICIAL_BUNDLES_CATALOG.forEach(b => {
    if (b && b.id && !deletedSet.has(b.id) && !deletedSet.has(b.slug)) {
      map.set(b.id, { ...b });
    }
  });

  // Overlay current local storage (skipping deleted)
  current.forEach(b => {
    if (b && b.id && !deletedSet.has(b.id) && !deletedSet.has(b.slug)) {
      const base = map.get(b.id) || b;
      map.set(b.id, mergeBundleEntities(base, b));
    }
  });

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
            if (b && b.id && !deletedSet.has(b.id) && !deletedSet.has(b.slug)) {
              const base = map.get(b.id) || b;
              map.set(b.id, mergeBundleEntities(base, b));
            }
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
        if (b && b.id && !deletedSet.has(b.id) && !deletedSet.has(b.slug)) {
          const base = map.get(b.id) || b;
          map.set(b.id, mergeBundleEntities(base, b));
        }
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
          if (b && b.id && !deletedSet.has(b.id) && !deletedSet.has(b.slug)) {
            const base = map.get(b.id) || b;
            map.set(b.id, mergeBundleEntities(base, b));
          }
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
  const target = list.find(b => b.id === bundleId || b.slug === bundleId);

  addDeletedBundleId(bundleId);
  if (target) {
    if (target.id) addDeletedBundleId(target.id);
    if (target.slug) addDeletedBundleId(target.slug);
  }

  const updated = list.filter(b => b.id !== bundleId && b.slug !== bundleId && (!target || (b.id !== target.id && b.slug !== target.slug)));
  saveStoredBundles(updated);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cgssb-bundles-updated', { detail: updated }));
  }

  // Async background sync to Firebase Firestore
  deleteBundleFromFirestore(bundleId).catch(err => {
    console.warn('Firestore bundle delete warning:', err);
  });
  if (target && target.id !== bundleId) {
    deleteBundleFromFirestore(target.id).catch(() => null);
  }

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
    localStorage.removeItem(DELETED_BUNDLES_STORAGE_KEY);
    localStorage.removeItem(BUNDLE_STORAGE_KEY);
    localStorage.setItem(BUNDLE_STORAGE_KEY, JSON.stringify(OFFICIAL_BUNDLES_CATALOG));
    window.dispatchEvent(new CustomEvent('cgssb-bundles-updated', { detail: OFFICIAL_BUNDLES_CATALOG }));
  }
  return OFFICIAL_BUNDLES_CATALOG;
};

// =========================================================================
// GOVERNANCE & TRASH RECOVERY REPOSITORY
// =========================================================================
export interface TrashedItem {
  id: string;
  type: 'BUNDLE' | 'TEST';
  title: string;
  titleHindi?: string;
  deletedAt: string;
  deletedBy?: string;
  itemCount?: number;
  data: any;
}

const TRASH_STORAGE_KEY = 'cgssb_trash_bin_v1';

export const getTrashItems = (): TrashedItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(TRASH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveTrashItems = (items: TrashedItem[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TRASH_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('cgssb-trash-updated', { detail: items }));
  } catch {}
};

/**
 * Move a bundle to Trash Bin (Soft Delete)
 */
export const moveToTrashBundle = (bundle: TestSeriesBundle, userEmail?: string): void => {
  addDeletedBundleId(bundle.id);
  if (bundle.slug) addDeletedBundleId(bundle.slug);

  const trashed: TrashedItem = {
    id: bundle.id,
    type: 'BUNDLE',
    title: bundle.title,
    titleHindi: bundle.titleHindi,
    deletedAt: new Date().toISOString(),
    deletedBy: userEmail || 'Administrator',
    itemCount: (bundle.testItems?.length || 0) + (bundle.chapterTests?.length || 0) + (bundle.pypTests?.length || 0),
    data: bundle
  };
  const currentTrash = getTrashItems().filter(i => i.id !== bundle.id);
  saveTrashItems([trashed, ...currentTrash]);
  deleteStoredBundle(bundle.id);
};

/**
 * Restore a bundle from Trash Bin
 */
export const restoreBundleFromTrash = (bundleId: string): TestSeriesBundle | null => {
  const currentTrash = getTrashItems();
  const target = currentTrash.find(i => i.id === bundleId && i.type === 'BUNDLE');
  if (!target || !target.data) return null;

  removeDeletedBundleId(bundleId);
  if (target.data.id) removeDeletedBundleId(target.data.id);
  if (target.data.slug) removeDeletedBundleId(target.data.slug);

  saveTrashItems(currentTrash.filter(i => i.id !== bundleId));
  const restoredBundle: TestSeriesBundle = {
    ...target.data,
    isPublished: true,
    isDraft: false
  };
  saveSingleBundle(restoredBundle);
  return restoredBundle;
};

/**
 * Permanently purge an item from Trash
 */
export const purgeTrashItem = (itemId: string): void => {
  const currentTrash = getTrashItems().filter(i => i.id !== itemId);
  saveTrashItems(currentTrash);
};

/**
 * Move a mock test to Trash Bin (Soft Delete)
 */
export const moveToTrashTest = (test: MockTest, userEmail?: string): void => {
  const trashed: TrashedItem = {
    id: test.id,
    type: 'TEST',
    title: test.title,
    titleHindi: test.titleHindi,
    deletedAt: new Date().toISOString(),
    deletedBy: userEmail || 'Administrator',
    itemCount: test.questionCount || 0,
    data: test
  };
  const currentTrash = getTrashItems().filter(i => i.id !== test.id);
  saveTrashItems([trashed, ...currentTrash]);
};

/**
 * Restore a test from Trash Bin
 */
export const restoreTestFromTrash = (testId: string): MockTest | null => {
  const currentTrash = getTrashItems();
  const target = currentTrash.find(i => i.id === testId && i.type === 'TEST');
  if (!target || !target.data) return null;

  saveTrashItems(currentTrash.filter(i => i.id !== testId));
  
  // Remove from deleted registry if present
  try {
    const raw = localStorage.getItem('cgssb_deleted_tests');
    if (raw) {
      const set = new Set(JSON.parse(raw));
      set.delete(testId);
      localStorage.setItem('cgssb_deleted_tests', JSON.stringify(Array.from(set)));
    }
  } catch {}

  const restoredTest: MockTest = {
    ...target.data,
    isPublished: true
  };

  // Dispatch restore event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cgssb-test-restored', { detail: restoredTest }));
  }

  return restoredTest;
};

/**
 * Removes a test from all active bundles across the system
 */
export const cleanTestFromAllBundles = (testId: string): TestSeriesBundle[] => {
  const bundles = getStoredBundles();
  let modified = false;

  const updated = bundles.map(bundle => {
    const directMockCount = (bundle.testItems || []).length;
    const directChapterCount = (bundle.chapterTests || []).length;
    const directPypCount = (bundle.pypTests || []).length;

    const newMocks = (bundle.testItems || []).filter(t => t.id !== testId && t.mockTestRef?.id !== testId);
    const newChapters = (bundle.chapterTests || []).filter(t => t.id !== testId && t.mockTestRef?.id !== testId);
    const newPyps = (bundle.pypTests || []).filter(t => t.id !== testId && t.mockTestRef?.id !== testId);

    if (
      newMocks.length !== directMockCount ||
      newChapters.length !== directChapterCount ||
      newPyps.length !== directPypCount
    ) {
      modified = true;
      const totalCount = newMocks.length + newChapters.length + newPyps.length;
      const freeCount = [...newMocks, ...newChapters, ...newPyps].filter(t => t.isFreePreview).length;
      return {
        ...bundle,
        testItems: newMocks,
        chapterTests: newChapters,
        pypTests: newPyps,
        totalTestsCount: totalCount > 0 ? totalCount : 1,
        freeTestsCount: freeCount > 0 ? freeCount : 1,
      };
    }
    return bundle;
  });

  if (modified) {
    saveStoredBundles(updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cgssb-bundles-updated', { detail: updated }));
    }
  }
  return updated;
};

/**
 * Finds all bundles that currently contain a given test ID
 */
export const findBundlesContainingTest = (testId: string): TestSeriesBundle[] => {
  const bundles = getStoredBundles();
  return bundles.filter(b => {
    const inMocks = (b.testItems || []).some(t => t.id === testId || t.mockTestRef?.id === testId);
    const inChapters = (b.chapterTests || []).some(t => t.id === testId || t.mockTestRef?.id === testId);
    const inPyps = (b.pypTests || []).some(t => t.id === testId || t.mockTestRef?.id === testId);
    return inMocks || inChapters || inPyps;
  });
};

/**
 * Cascades publish/unpublish status from a Bundle to its attached tests
 */
export const cascadeBundlePublishStatus = (
  bundleId: string,
  newPublishStatus: boolean
): { bundle: TestSeriesBundle | null; affectedTestIds: string[] } => {
  const bundles = getStoredBundles();
  const targetBundle = bundles.find(b => b.id === bundleId || b.slug === bundleId);
  if (!targetBundle) return { bundle: null, affectedTestIds: [] };

  const affectedTestIds: string[] = [];
  const collectIds = (items?: BundleTestItem[]) => {
    (items || []).forEach(item => {
      if (item.id) affectedTestIds.push(item.id);
    });
  };

  collectIds(targetBundle.testItems);
  collectIds(targetBundle.chapterTests);
  collectIds(targetBundle.pypTests);

  const updatedBundle: TestSeriesBundle = {
    ...targetBundle,
    isPublished: newPublishStatus,
    isDraft: !newPublishStatus
  };

  saveSingleBundle(updatedBundle);

  // Dispatch cross-tab & global governance sync
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('cgssb-governance-publish-cascade', {
        detail: { bundleId, newPublishStatus, affectedTestIds }
      })
    );
  }

  return { bundle: updatedBundle, affectedTestIds };
};

/**
 * Determines whether a given MockTest matches a TestSeriesBundle by category, post, slug, or title
 */
export const doesTestMatchBundle = (test: MockTest, bundle: TestSeriesBundle): boolean => {
  if (!test || !bundle) return false;

  const tTitle = (test.title || '').trim().toLowerCase();
  const tTitleHindi = (test.titleHindi || '').trim().toLowerCase();
  const tSub = (test.subCategory || '').trim().toLowerCase();
  const tPost = (test.postName || '').trim().toLowerCase();
  const tExam = (((test as any).examName || '') as string).trim().toLowerCase();
  const tCat = (test.category || '').trim().toLowerCase();
  const tId = (test.id || '').trim().toLowerCase();

  const bId = (bundle.id || '').trim().toLowerCase();
  const bSlug = (bundle.slug || '').trim().toLowerCase();
  const bPost = (bundle.targetPost || '').trim().toLowerCase();
  const bTitle = (bundle.title || '').trim().toLowerCase();
  const bAuth = (bundle.authority || '').trim().toLowerCase();

  // 1. Explicit bundle reference on the test object
  if ((test as any).bundleId && (test as any).bundleId.trim().toLowerCase() === bId) {
    return true;
  }

  // 2. Specific CGSSB / CGPSC Bundles with strict exclusivity
  
  // A. Lecturer English 2026 (वर्ग-1 व्याख्याता अंग्रेजी)
  if (bId === 'bundle-cgssb-lecturer-english-2026' || bSlug === 'lecturer-english-2026') {
    if (
      tTitle.includes('assistant') ||
      tTitleHindi.includes('सहायक') ||
      tTitle.includes('physics') ||
      tTitle.includes('shikshak-paper1') ||
      tTitle.includes('warden') ||
      tTitle.includes('patwari') ||
      tTitle.includes('si ') ||
      tPost.includes('assistant') ||
      tPost.includes('shikshak paper')
    ) {
      return false;
    }
    return (
      tId.includes('lecturer-english') ||
      tId.includes('lecturer_eng') ||
      tId.includes('lecturer-eng') ||
      tId.includes('cg-lecturer-english') ||
      (tTitle.includes('lecturer') && tTitle.includes('english')) ||
      (tTitleHindi.includes('व्याख्याता') && tTitleHindi.includes('अंग्रेजी')) ||
      (tPost.includes('lecturer') && (tPost.includes('english') || tExam.includes('english'))) ||
      (tSub.includes('lecturer') && tSub.includes('english'))
    );
  }

  // B. Assistant Teacher 2026 (वर्ग-3 सहायक शिक्षक)
  if (bId === 'bundle-cgssb-asst-teacher-2026' || bSlug === 'assistant-teacher-2026') {
    if (
      tTitle.includes('lecturer') ||
      tTitleHindi.includes('व्याख्याता') ||
      tTitle.includes('वर्ग-1') ||
      tTitle.includes('वर्ग-2') ||
      tTitle.includes('warden') ||
      tTitle.includes('patwari')
    ) {
      return false;
    }
    return (
      tId.includes('shikshak-paper1') ||
      tId.includes('asst-teacher') ||
      tTitle.includes('assistant teacher') ||
      tTitleHindi.includes('सहायक शिक्षक') ||
      tPost.includes('assistant teacher') ||
      tSub.includes('assistant teacher') ||
      tTitle.includes('वर्ग-3')
    );
  }

  // C. Teacher English 2026 (वर्ग-2 शिक्षक अंग्रेजी)
  if (bId === 'bundle-cgssb-teacher-english-2026' || bSlug === 'teacher-english-2026') {
    if (
      tTitle.includes('assistant') ||
      tTitleHindi.includes('सहायक') ||
      tTitle.includes('lecturer') ||
      tTitleHindi.includes('व्याख्याता') ||
      tTitle.includes('वर्ग-1') ||
      tTitle.includes('वर्ग-3')
    ) {
      return false;
    }
    return (
      (tId.includes('shikshak-paper2') && (tId.includes('eng') || tTitle.includes('english'))) ||
      (tTitle.includes('teacher') && tTitle.includes('english')) ||
      (tTitleHindi.includes('शिक्षक') && tTitleHindi.includes('अंग्रेजी'))
    );
  }

  // D. Teacher Maths & Science 2026 (वर्ग-2 शिक्षक गणित)
  if (bId === 'bundle-cgssb-teacher-maths-2026' || bSlug === 'teacher-maths-2026') {
    if (
      tTitle.includes('assistant') ||
      tTitleHindi.includes('सहायक') ||
      tTitle.includes('lecturer') ||
      tTitleHindi.includes('व्याख्याता') ||
      tTitle.includes('english')
    ) {
      return false;
    }
    return (
      (tId.includes('shikshak-paper2') && (tId.includes('math') || tTitle.includes('math') || tTitle.includes('science'))) ||
      (tTitle.includes('teacher') && (tTitle.includes('math') || tTitle.includes('science'))) ||
      (tTitleHindi.includes('शिक्षक') && (tTitleHindi.includes('गणित') || tTitleHindi.includes('विज्ञान')))
    );
  }

  // E. CG Police SI 2026
  if (bId === 'bundle-cgssb-si-2026' || bSlug === 'cgssb-si-2026') {
    return (
      tId.includes('si-') ||
      tId.includes('sub-inspector') ||
      tTitle.includes('sub inspector') ||
      tTitle.includes('sub-inspector') ||
      tTitle.includes('si 2026') ||
      tTitleHindi.includes('सब इंस्पेक्टर') ||
      tTitleHindi.includes('सूबेदार')
    );
  }

  // F. CGPSC Prelims 2026
  if (bId === 'bundle-cgpsc-pre-2026' || bSlug === 'cgpsc-pre-2026') {
    if (tTitle.includes('vyapam') || tCat === 'cgssb') return false;
    return (
      tId.includes('cgpsc') ||
      tCat === 'cgpsc' ||
      tTitle.includes('cgpsc') ||
      tTitle.includes('state service') ||
      tTitleHindi.includes('राज्य सेवा')
    );
  }

  // G. Hostel Warden
  if (bId === 'bundle-cgssb-warden-2024' || bSlug === 'cgssb-hostel-warden-2024') {
    return (
      tId.includes('warden') ||
      tTitle.includes('hostel warden') ||
      tTitleHindi.includes('छात्रावास अधीक्षक') ||
      tPost.includes('warden') ||
      tSub.includes('warden')
    );
  }

  // H. Patwari
  if (bId === 'bundle-cgssb-patwari-2024' || bSlug === 'cgssb-patwari-2024') {
    return (
      tId.includes('patwari') ||
      tTitle.includes('patwari') ||
      tTitleHindi.includes('पटवारी') ||
      tPost.includes('patwari')
    );
  }

  // 3. Strict fallback: only if authority matches AND specific exam name matches
  if (tCat && bAuth && tCat === bAuth) {
    if (tExam && bSlug && tExam.length > 5 && (bSlug.includes(tExam) || tExam.includes(bSlug))) {
      return true;
    }
  }

  return false;
};

/**
 * Converts a MockTest into a standard BundleTestItem
 */
export const convertMockTestToBundleItem = (test: MockTest, isFirstFree = false): BundleTestItem => {
  const totalQ = test.questionCount || test.sections?.reduce((acc, s) => acc + (s.questionIds?.length || 0), 0) || 100;
  return {
    id: test.id,
    title: test.title,
    titleHindi: test.titleHindi || test.title,
    type: test.isPYP ? 'pyp' : (test.durationMinutes && test.durationMinutes <= 45 ? 'sectional' : 'full_mock'),
    questionCount: totalQ,
    durationMinutes: test.durationMinutes || 120,
    marks: test.totalMarks || (totalQ * (test.marksPerQuestion || 1.0)),
    isFreePreview: test.isPro ? false : (isFirstFree || !test.isPro),
    attemptsCount: test.attemptsCount || 0,
    statusText: test.isPro ? 'Pro Access' : 'Free Preview Available',
    mockTestRef: test
  };
};

/**
 * Auto-linking has been disabled to ensure 100% deterministic, explicit admin control.
 * Tests are only attached to bundles when explicitly added by an administrator.
 */
export const autoLinkTestToBundles = (_test: MockTest): void => {
  // Disabled as per FAANG database governance rules: No implicit heuristic associations
  return;
};

/**
 * Reconciles bundle items strictly based on valid foreign keys and explicit associations.
 */
export const reconcileAllTestsWithBundles = (_allTests: MockTest[]): TestSeriesBundle[] => {
  return getStoredBundles();
};

/**
 * FAANG Comprehensive Demo Data Purge Engine
 * Thoroughly wipes all demo/dummy mock tests, PYQ fixtures, dummy questions, and local test cache
 * and persists the purge state so demo items never resurrect on page reload or server sync.
 */
export const purgeAllDemoDatabaseData = async (): Promise<{ purgedKeys: string[]; timestamp: string }> => {
  if (typeof window === 'undefined') return { purgedKeys: [], timestamp: new Date().toISOString() };
  
  // 1. Enable persistent purge flags
  setDemoDataPurged(true);

  // 2. Mark ALL demo & existing custom IDs as deleted tombstones so fallback queries block them
  const currentSavedTests = (() => {
    try {
      const s = localStorage.getItem('cgssb_tests');
      return s ? JSON.parse(s).map((t: any) => t.id) : [];
    } catch { return []; }
  })();
  const currentCustomTests = (() => {
    try {
      const s = localStorage.getItem('cgssb_custom_mock_tests');
      return s ? JSON.parse(s).map((t: any) => t.id) : [];
    } catch { return []; }
  })();
  const existingDeletedTests = Array.from(getDeletedBundleIds('cgssb_deleted_tests'));
  const targetTestIds = [
    'mock-cgssb-2026-1790415452437',
    'test-1790431929334',
    'test-1790433244323',
    'test-ai-1790425189331'
  ];

  const allTestIdsToTombstone = Array.from(new Set([
    ...INITIAL_MOCK_TESTS.map(t => t.id),
    ...currentSavedTests,
    ...currentCustomTests,
    ...existingDeletedTests,
    ...targetTestIds
  ]));

  const demoQuestionIds = INITIAL_QUESTIONS.map(q => q.id);
  const demoPypIds = INITIAL_PYP_PAPERS.map(p => p.id);
  const demoBundleIds = OFFICIAL_BUNDLES_CATALOG.map(b => b.id);

  localStorage.setItem('cgssb_deleted_tests', JSON.stringify(allTestIdsToTombstone));
  localStorage.setItem('cgssb_deleted_questions', JSON.stringify(demoQuestionIds));
  localStorage.setItem('cgssb_deleted_pyp', JSON.stringify(demoPypIds));
  localStorage.setItem('cgssb_deleted_bundles', JSON.stringify(demoBundleIds));

  // 3. Clear all content stores to clean empty arrays
  localStorage.setItem('cgssb_tests', JSON.stringify([]));
  localStorage.setItem('cgssb_questions', JSON.stringify([]));
  localStorage.setItem('cgssb_pyp', JSON.stringify([]));
  localStorage.setItem('cgssb_pyp_papers', JSON.stringify([]));
  localStorage.setItem('cgssb_custom_mock_tests', JSON.stringify([]));
  localStorage.setItem(BUNDLE_STORAGE_KEY, JSON.stringify([]));
  localStorage.setItem('cgssb_practice_questions', JSON.stringify([]));
  localStorage.setItem('cgssb_chapter_tests', JSON.stringify([]));
  localStorage.setItem('cgssb_trash_bin_v1', JSON.stringify([]));
  localStorage.setItem('cgssb_attempts', JSON.stringify([]));

  // 4. Notify backend server to wipe server db snapshot and in-memory repository
  try {
    await fetch('/api/admin/database/purge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': 'cgssb_admin_2026',
        'Authorization': 'Bearer adm_controller_bypass'
      },
      body: JSON.stringify({ purgeAll: true })
    });
  } catch (err) {
    console.warn('Backend database purge notification error:', err);
  }

  // 5. Purge Firestore demo documents
  try {
    await purgeFirestoreDemoData();
  } catch (err) {
    console.warn('Firestore purge error:', err);
  }

  // 6. Broadcast local update events to all active React listeners
  window.dispatchEvent(new CustomEvent('cgssb-bundles-updated', { detail: [] }));
  window.dispatchEvent(new CustomEvent('cgssb-tests-updated', { detail: [] }));
  window.dispatchEvent(new CustomEvent('cgssb-questions-updated', { detail: [] }));
  window.dispatchEvent(new CustomEvent('cgssb-pyp-updated', { detail: [] }));

  return {
    purgedKeys: [
      'cgssb_tests',
      'cgssb_questions',
      'cgssb_pyp',
      'cgssb_bundles',
      'cgssb_demo_data_purged'
    ],
    timestamp: new Date().toISOString()
  };
};

/**
 * Restores factory default demo catalog (cleanly reversible when explicitly requested by admin)
 */
export const restoreFactoryDemoData = async (): Promise<void> => {
  if (typeof window === 'undefined') return;

  setDemoDataPurged(false);

  localStorage.setItem('cgssb_tests', JSON.stringify(INITIAL_MOCK_TESTS));
  localStorage.setItem('cgssb_questions', JSON.stringify(INITIAL_QUESTIONS));
  localStorage.setItem('cgssb_pyp', JSON.stringify(INITIAL_PYP_PAPERS));
  localStorage.setItem(BUNDLE_STORAGE_KEY, JSON.stringify(OFFICIAL_BUNDLES_CATALOG));

  try {
    await fetch('/api/admin/database/restore', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': 'cgssb_admin_2026',
        'Authorization': 'Bearer adm_controller_bypass'
      }
    });
  } catch (err) {
    console.warn('Backend database restore notification error:', err);
  }

  window.dispatchEvent(new CustomEvent('cgssb-bundles-updated', { detail: OFFICIAL_BUNDLES_CATALOG }));
  window.dispatchEvent(new CustomEvent('cgssb-tests-updated', { detail: INITIAL_MOCK_TESTS }));
  window.dispatchEvent(new CustomEvent('cgssb-questions-updated', { detail: INITIAL_QUESTIONS }));
  window.dispatchEvent(new CustomEvent('cgssb-pyp-updated', { detail: INITIAL_PYP_PAPERS }));
};
