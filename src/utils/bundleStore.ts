import { TestSeriesBundle, BundleTestItem } from '../data/bundleCatalog';
import { MockTest } from '../types';
import {
  fetchBundlesFromFirestore,
  saveBundleToFirestore,
  deleteBundleFromFirestore,
  purgeFirestoreDemoData,
  subscribeToBundles
} from '../firebase/firestoreService';
import {
  deleteExamTestSeries,
  fetchExamTestSeriesById,
  saveExamTestSeries,
  ExamTestSeries
} from '../firebase/examCatalogService';

let bundleCache: TestSeriesBundle[] = [];

// Automatic real-time cross-browser Firestore subscription for bundles.
// This is an in-memory UI cache only; Firestore/API remains authoritative.
if (typeof window !== 'undefined') {
  try {
    subscribeToBundles((firestoreBundles) => {
      bundleCache = Array.isArray(firestoreBundles) ? firestoreBundles : [];
      window.dispatchEvent(new CustomEvent('cgssb-bundles-updated', { detail: bundleCache }));
    });
  } catch {}
}

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
  return false;
};

export const setDemoDataPurged = (_purged: boolean): void => {
  // Deprecated: State is now 100% managed in Cloud Firestore
};

export const getTrueZeroDataMode = (): boolean => {
  return false;
};

export const setTrueZeroDataMode = (_enabled: boolean): void => {
  // Deprecated: State is now 100% managed in Cloud Firestore
};

export const getStoredBundles = (): TestSeriesBundle[] => [...bundleCache];

export const saveStoredBundles = (bundles: TestSeriesBundle[]): void => {
  bundleCache = Array.isArray(bundles) ? [...bundles] : [];
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cgssb-bundles-updated', { detail: bundleCache }));
  }
};

/**
 * Fetch the authoritative bundle catalog from the server API.
 * An empty response is a legitimate production state; never fall back to localStorage or the factory catalog.
 */
export const syncBundlesFromFirestore = async (_customUrl?: string): Promise<{ list: TestSeriesBundle[]; count: number; source: string }> => {
  const response = await fetchBundlesFromFirestore();
  bundleCache = Array.isArray(response) ? response : [];
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cgssb-bundles-updated', { detail: bundleCache }));
  }
  return { list: [...bundleCache], count: bundleCache.length, source: 'api' };
};

export const findBundleBySlugOrId = (identifier: string, bundles?: TestSeriesBundle[]): TestSeriesBundle | undefined => {
  const list = bundles || getStoredBundles();
  const cleanId = identifier.trim().toLowerCase();
  return list.find(b => b.slug.toLowerCase() === cleanId || b.id.toLowerCase() === cleanId);
};

export const saveSingleBundle = (bundle: TestSeriesBundle): TestSeriesBundle[] => {
  const list = getStoredBundles();
  const existingIndex = list.findIndex(b => b.id === bundle.id || b.slug === bundle.slug);
  const updated = existingIndex >= 0
    ? list.map((b, i) => i === existingIndex ? bundle : b)
    : [bundle, ...list];
  saveStoredBundles(updated);
  saveBundleToFirestore(bundle).catch(err => {
    console.warn('Bundle API save failed; authoritative state was not changed:', err);
  });
  return updated;
};

export const deleteStoredBundle = (bundleId: string): TestSeriesBundle[] => {
  const updated = getStoredBundles().filter(b => b.id !== bundleId && b.slug !== bundleId);
  saveStoredBundles(updated);
  deleteBundleFromFirestore(bundleId).catch(err => {
    console.warn('Bundle API delete failed; authoritative state was not changed:', err);
  });
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
  }

  return { updatedList: updated, newStatus };
};

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
    for (const bundle of updated) saveBundleToFirestore(bundle).catch(() => {});
  }
  return updated;
};

/**
 * Purges demo and custom data directly from Cloud Firestore globally
 */
export const purgeAllDemoDatabaseData = async (): Promise<{ purgedKeys: string[]; timestamp: string }> => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('cgssb_tests');
    localStorage.removeItem('cgssb_questions');
    localStorage.removeItem('cgssb_pyp');
  }

  await purgeFirestoreDemoData();

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cgssb-bundles-updated', { detail: [] }));
    window.dispatchEvent(new CustomEvent('cgssb-tests-updated', { detail: [] }));
    window.dispatchEvent(new CustomEvent('cgssb-questions-updated', { detail: [] }));
    window.dispatchEvent(new CustomEvent('cgssb-pyp-updated', { detail: [] }));
  }

  return {
    purgedKeys: ['mockTests', 'questions', 'pypPapers', 'bundles'],
    timestamp: new Date().toISOString()
  };
};

export interface TrashedItem {
  id: string;
  originalId: string;
  type: 'bundle' | 'test' | 'BUNDLE' | 'TEST';
  title: string;
  deletedAt: string;
  deletedBy?: string;
  data: any;
  /** Canonical examTestSeries record removed together with a bundle. */
  seriesData?: ExamTestSeries;
  seriesId?: string;
}

const TRASH_STORAGE_KEY = 'cgssb_trash_items_v1';

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

export const moveToTrashBundle = async (bundle: TestSeriesBundle): Promise<void> => {
  const current = getTrashItems();
  const seriesId = bundle.seriesId;
  let seriesData: ExamTestSeries | undefined;

  // A TestSeriesBundle and examTestSeries are one canonical aggregate.
  // Capture the canonical series before removing it so Restore can put both records back.
  if (seriesId) {
    try {
      seriesData = (await fetchExamTestSeriesById(seriesId)) || undefined;
    } catch (error) {
      console.warn('Unable to read canonical test series before trashing bundle:', error);
    }
  }

  const newItem: TrashedItem = {
    id: `trash-bundle-${bundle.id}-${Date.now()}`,
    originalId: bundle.id,
    type: 'bundle',
    title: bundle.title,
    deletedAt: new Date().toISOString(),
    deletedBy: 'Admin',
    data: bundle,
    seriesId,
    seriesData,
  };
  saveTrashItems([newItem, ...current]);

  // Remove both sides of the 1:1 relationship from active catalogs.
  await deleteStoredBundle(bundle.id);
  if (seriesId) {
    await deleteExamTestSeries(seriesId);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cgssb-exam-catalog-updated'));
  }
};

export const restoreBundleFromTrash = async (trashId: string): Promise<TestSeriesBundle | null> => {
  const current = getTrashItems();
  const item = current.find(i => i.id === trashId);
  if (!item || (item.type !== 'bundle' && item.type !== 'BUNDLE')) return null;

  saveSingleBundle(item.data);
  if (item.seriesData) {
    await saveExamTestSeries(item.seriesData);
  }
  saveTrashItems(current.filter(i => i.id !== trashId));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cgssb-exam-catalog-updated'));
  }
  return item.data;
};

export const moveToTrashTest = (test: MockTest): void => {
  const current = getTrashItems();
  const newItem: TrashedItem = {
    id: `trash-test-${test.id}-${Date.now()}`,
    originalId: test.id,
    type: 'test',
    title: test.title,
    deletedAt: new Date().toISOString(),
    deletedBy: 'Admin',
    data: test,
  };
  saveTrashItems([newItem, ...current]);
  cleanTestFromAllBundles(test.id);
};

export const restoreTestFromTrash = (trashId: string): MockTest | null => {
  const current = getTrashItems();
  const item = current.find(i => i.id === trashId);
  if (!item || (item.type !== 'test' && item.type !== 'TEST')) return null;
  saveTrashItems(current.filter(i => i.id !== trashId));
  return item.data;
};

export const purgeTrashItem = (trashId: string): void => {
  const current = getTrashItems();
  saveTrashItems(current.filter(i => i.id !== trashId));
};

export const doesTestMatchBundle = (test: MockTest, bundle?: TestSeriesBundle): boolean => {
  if (!test || !bundle) return false;
  // Direct inclusion match
  const allBundleTestIds = [
    ...(bundle.testItems || []).map(t => t.id),
    ...(bundle.chapterTests || []).map(t => t.id),
    ...(bundle.pypTests || []).map(t => t.id),
  ];
  if (allBundleTestIds.includes(test.id)) return true;

  // Authority and Category matching
  const testAuth = (test.authority || '').toUpperCase();
  const bundleAuth = (bundle.authority || '').toUpperCase();
  if (bundleAuth.includes('CGPSC') && testAuth.includes('CGPSC')) return true;
  if (bundleAuth.includes('CGSSB') && testAuth.includes('CGSSB')) return true;
  if (bundleAuth.includes('CGVYAPAM') && testAuth.includes('CGVYAPAM')) return true;

  // Target post or slug matching
  if (bundle.targetPost && test.postName && test.postName.toLowerCase().includes(bundle.targetPost.toLowerCase())) {
    return true;
  }
  return false;
};

export const convertMockTestToBundleItem = (test: MockTest, isFree?: boolean): BundleTestItem => {
  return {
    id: test.id,
    title: test.title,
    titleHindi: test.title,
    durationMinutes: test.durationMinutes || 120,
    questionCount: test.questionCount || test.sections?.reduce((sum, s) => sum + (s.questionIds?.length || 0), 0) || 100,
    marks: test.totalMarks || 100,
    type: test.isPYP ? 'pyp' : 'full_mock',
    isFreePreview: isFree !== undefined ? isFree : !test.isPro,
    attemptsCount: test.attemptsCount || 0,
    mockTestRef: test,
  };
};

export const reconcileAllTestsWithBundles = (tests: MockTest[], bundles?: TestSeriesBundle[]): TestSeriesBundle[] => {
  const targetBundles = bundles || getStoredBundles();
  if (!Array.isArray(targetBundles) || targetBundles.length === 0) return [];
  if (!Array.isArray(tests) || tests.length === 0) return targetBundles;

  return targetBundles.map(bundle => {
    const existingTestIds = new Set([
      ...(bundle.testItems || []).map(t => t.id),
      ...(bundle.chapterTests || []).map(t => t.id),
      ...(bundle.pypTests || []).map(t => t.id),
    ]);

    const matchingTests = tests.filter(t => doesTestMatchBundle(t, bundle));
    const newItems: BundleTestItem[] = [];

    matchingTests.forEach(test => {
      if (!existingTestIds.has(test.id)) {
        newItems.push(convertMockTestToBundleItem(test));
      }
    });

    if (newItems.length === 0) return bundle;

    const updatedTestItems = [...(bundle.testItems || []), ...newItems];
    const totalCount = updatedTestItems.length + (bundle.chapterTests || []).length + (bundle.pypTests || []).length;
    const freeCount = [...updatedTestItems, ...(bundle.chapterTests || []), ...(bundle.pypTests || [])].filter(t => t.isFreePreview).length;

    return {
      ...bundle,
      testItems: updatedTestItems,
      totalTestsCount: totalCount,
      freeTestsCount: freeCount,
    };
  });
};

export const findBundlesContainingTest = (testId: string, bundles?: TestSeriesBundle[]): TestSeriesBundle[] => {
  const list = bundles || getStoredBundles();
  return list.filter(bundle => {
    const ids = [
      ...(bundle.testItems || []).map(t => t.id),
      ...(bundle.chapterTests || []).map(t => t.id),
      ...(bundle.pypTests || []).map(t => t.id),
    ];
    return ids.includes(testId);
  });
};

export const cascadeBundlePublishStatus = (bundleId: string, isPublished: boolean): { affectedTestIds: string[] } => {
  const bundles = getStoredBundles();
  const targetBundle = bundles.find(b => b.id === bundleId);
  const affectedTestIds = targetBundle
    ? [
        ...(targetBundle.testItems || []).map(t => t.id),
        ...(targetBundle.chapterTests || []).map(t => t.id),
        ...(targetBundle.pypTests || []).map(t => t.id),
      ]
    : [];

  const updated = bundles.map(b => (b.id === bundleId ? { ...b, isPublished, isDraft: !isPublished } : b));
  saveStoredBundles(updated);
  const updatedBundle = updated.find(b => b.id === bundleId);
  if (updatedBundle) saveBundleToFirestore(updatedBundle).catch(() => {});
  return { affectedTestIds };
};
