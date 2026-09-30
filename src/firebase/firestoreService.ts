import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  Unsubscribe
} from 'firebase/firestore';
import { db, auth } from './config';
import { signInAnonymously } from 'firebase/auth';
import { api } from '../utils/apiClient';
import { MockTest, Question, TestAttempt, User, PreviousYearPaper, SliderBanner, AppRemoteConfig, DEFAULT_REMOTE_CONFIG } from '../types';
import { TestSeriesBundle, OFFICIAL_BUNDLES_CATALOG } from '../data/bundleCatalog';
import { INITIAL_MOCK_TESTS, INITIAL_QUESTIONS, INITIAL_PYP_PAPERS } from '../mockData';
import { CMSPage, CMSPost, CMSTestSeriesPack, CMSSiteSettings } from '../types/cms';
import { INITIAL_CMS_PAGES, INITIAL_CMS_POSTS, INITIAL_CMS_SERIES_PACKS, INITIAL_CMS_SETTINGS } from '../defaultCmsData';
import { DEFAULT_SLIDER_BANNERS } from '../utils/sliderStore';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Collection Names
export const COLLECTIONS = {
  USERS: 'users',
  TESTS: 'mockTests',
  QUESTIONS: 'questions',
  BUNDLES: 'bundles',
  ATTEMPTS: 'attempts',
  PYP_PAPERS: 'pypPapers',
  PAGES: 'pages',
  POSTS: 'posts',
  SERIES_PACKS: 'seriesPacks',
  CMS_SETTINGS: 'cmsSettings',
  SLIDER_BANNERS: 'slider_banners',
  REMOTE_CONFIG: 'remoteConfig',
  REFERRALS: 'referrals'
} as const;

/**
 * Timeout wrapper to guarantee that network hiccups don't freeze the client
 */
async function withTimeout<T>(promise: Promise<T>, timeoutMs = 4000, fallbackValue: T): Promise<T> {
  let timer: any;
  const timeout = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallbackValue), timeoutMs);
  });
  try {
    const result = await Promise.race([promise, timeout]);
    clearTimeout(timer);
    return result;
  } catch {
    clearTimeout(timer);
    return fallbackValue;
  }
}

// ==========================================
// USER SERVICES
// ==========================================
// Only these fields are client-owned. Entitlements, moderation, roles, credits,
// device binding and admin permissions remain server-authoritative.
const CLIENT_USER_PROFILE_FIELDS = [
  'name', 'email', 'phone', 'avatar', 'lastLoginAt',
  'targetExam', 'targetYear', 'district', 'categoryReservation',
  'gender', 'education', 'medium', 'bio', 'dailyGoalQuestions'
] as const;

export async function syncUserProfileToFirestore(user: User): Promise<void> {
  if (!db || !user?.id) return;
  try {
    const profile = CLIENT_USER_PROFILE_FIELDS.reduce<Record<string, unknown>>((out, field) => {
      const value = user[field];
      if (value !== undefined) out[field] = value;
      return out;
    }, {});
    if (!auth.currentUser) {
      try { await signInAnonymously(auth); } catch { return; }
    }
    const authUserId = auth.currentUser?.uid;
    if (!authUserId) return;
    const userDocRef = doc(db, COLLECTIONS.USERS, authUserId);
    await setDoc(userDocRef, {
      ...profile,
      lastSyncedAt: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.warn('Could not sync user profile to Firestore:', err);
  }
}

export async function fetchUserProfileFromFirestore(_userId?: string): Promise<User | null> {
  const authUserId = auth.currentUser?.uid;
  if (!db || !authUserId) return null;
  try {
    const userDocRef = doc(db, COLLECTIONS.USERS, authUserId);
    return await withTimeout(
      getDoc(userDocRef).then(snap => snap.exists() ? (snap.data() as User) : null),
      4000,
      null
    );
  } catch (err) {
    console.warn('Error fetching user profile from Firestore:', err);
    return null;
  }
}


// ==========================================
// MOCK TESTS SERVICES & REALTIME SYNC
// ==========================================
export async function fetchTestsFromFirestore(): Promise<MockTest[]> {
  if (!db) return [];
  try {
    return await withTimeout(
      getDocs(collection(db, COLLECTIONS.TESTS)).then(snap => {
        const items: MockTest[] = [];
        snap.forEach(d => {
          items.push(d.data() as MockTest);
        });
        return items;
      }),
      4000,
      []
    );
  } catch (err) {
    console.warn('Error fetching tests from Firestore:', err);
    return [];
  }
}

export function subscribeToTests(callback: (tests: MockTest[]) => void): Unsubscribe {
  if (!db) return () => {};
  try {
    return onSnapshot(
      collection(db, COLLECTIONS.TESTS),
      (snap) => {
        const items: MockTest[] = [];
        snap.forEach(d => items.push(d.data() as MockTest));
        callback(items);
      },
      (err) => {
        console.warn('Tests snapshot listener note:', err);
      }
    );
  } catch {
    return () => {};
  }
}

export async function saveTestToFirestore(test: MockTest): Promise<void> {
  if (!db || !test?.id) return;
  try {
    await api.post('/api/tests', test, { requireAuth: true });
  } catch (err) {
    console.warn('Error saving test to Firestore:', err);
  }
}

export async function deleteTestFromFirestore(testId: string): Promise<void> {
  if (!db || !testId) return;
  try {
    await api.delete('/api/tests/' + encodeURIComponent(testId), { requireAuth: true });
  } catch (err) {
    console.warn('Error deleting test from Firestore:', err);
  }
}

// ==========================================
// QUESTIONS SERVICES & REALTIME SYNC
// ==========================================
export async function fetchQuestionsFromFirestore(): Promise<Question[]> {
  if (!db) return [];
  try {
    return await withTimeout(
      getDocs(collection(db, COLLECTIONS.QUESTIONS)).then(snap => {
        const items: Question[] = [];
        snap.forEach(d => {
          items.push(d.data() as Question);
        });
        return items;
      }),
      4000,
      []
    );
  } catch (err) {
    console.warn('Error fetching questions from Firestore:', err);
    return [];
  }
}

export function subscribeToQuestions(callback: (questions: Question[]) => void): Unsubscribe {
  if (!db) return () => {};
  try {
    return onSnapshot(
      collection(db, COLLECTIONS.QUESTIONS),
      (snap) => {
        const items: Question[] = [];
        snap.forEach(d => items.push(d.data() as Question));
        callback(items);
      },
      (err) => {
        console.warn('Questions snapshot listener note:', err);
      }
    );
  } catch {
    return () => {};
  }
}

export async function saveQuestionsToFirestore(questions: Question[]): Promise<void> {
  if (!db) return;
  try {
    const validQuestions = questions.filter(q => q && q.id);
    if (validQuestions.length > 0) {
      await api.post('/api/questions/bulk', { questions: validQuestions }, { requireAuth: true });
    }
  } catch (err) {
    console.warn('Error saving questions to Firestore:', err);
  }
}

export async function saveSingleQuestionToFirestore(question: Question): Promise<void> {
  if (!db || !question?.id) return;
  try {
    await api.post('/api/questions', question, { requireAuth: true });
  } catch (err) {
    console.warn('Error saving question to Firestore:', err);
  }
}

export async function deleteQuestionFromFirestore(questionId: string): Promise<void> {
  if (!db || !questionId) return;
  try {
    await api.delete('/api/questions/' + encodeURIComponent(questionId), { requireAuth: true });
  } catch (err) {
    console.warn('Error deleting question from Firestore:', err);
  }
}

// ==========================================
// PREVIOUS YEAR PAPERS (PYP) SERVICES
// ==========================================
export async function fetchPypPapersFromFirestore(): Promise<PreviousYearPaper[]> {
  if (!db) return [];
  try {
    return await withTimeout(
      getDocs(collection(db, COLLECTIONS.PYP_PAPERS)).then(snap => {
        const items: PreviousYearPaper[] = [];
        snap.forEach(d => {
          items.push(d.data() as PreviousYearPaper);
        });
        return items;
      }),
      4000,
      []
    );
  } catch (err) {
    console.warn('Error fetching PYP papers from Firestore:', err);
    return [];
  }
}

export function subscribeToPypPapers(callback: (papers: PreviousYearPaper[]) => void): Unsubscribe {
  if (!db) return () => {};
  try {
    return onSnapshot(
      collection(db, COLLECTIONS.PYP_PAPERS),
      (snap) => {
        const items: PreviousYearPaper[] = [];
        snap.forEach(d => items.push(d.data() as PreviousYearPaper));
        callback(items);
      },
      (err) => {
        console.warn('PYP snapshot listener note:', err);
      }
    );
  } catch {
    return () => {};
  }
}

export async function savePypPaperToFirestore(paper: PreviousYearPaper): Promise<void> {
  if (!db || !paper?.id) return;
  try {
    await api.post('/api/pyp', paper, { requireAuth: true });
  } catch (err) {
    console.warn('Error saving PYP paper to Firestore:', err);
  }
}

export async function deletePypPaperFromFirestore(paperId: string): Promise<void> {
  if (!db || !paperId) return;
  try {
    await api.delete('/api/pyp/' + encodeURIComponent(paperId), { requireAuth: true });
  } catch (err) {
    console.warn('Error deleting PYP paper from Firestore:', err);
  }
}

// ==========================================
// BUNDLES SERVICES & REALTIME SYNC
// ==========================================
export async function fetchBundlesFromFirestore(): Promise<TestSeriesBundle[]> {
  if (!db) return [];
  try {
    return await withTimeout(
      getDocs(collection(db, COLLECTIONS.BUNDLES)).then(snap => {
        const items: TestSeriesBundle[] = [];
        snap.forEach(d => {
          items.push(d.data() as TestSeriesBundle);
        });
        return items;
      }),
      4000,
      []
    );
  } catch (err) {
    console.warn('Error fetching bundles from Firestore:', err);
    return [];
  }
}

export function subscribeToBundles(callback: (bundles: TestSeriesBundle[]) => void): Unsubscribe {
  if (!db) return () => {};
  try {
    return onSnapshot(
      collection(db, COLLECTIONS.BUNDLES),
      (snap) => {
        const items: TestSeriesBundle[] = [];
        snap.forEach(d => items.push(d.data() as TestSeriesBundle));
        callback(items);
      },
      (err) => {
        console.warn('Bundles snapshot listener note:', err);
      }
    );
  } catch {
    return () => {};
  }
}

export async function saveBundleToFirestore(bundle: TestSeriesBundle): Promise<void> {
  if (!db || !bundle?.id) return;
  try {
    await api.post('/api/bundles', bundle, { requireAuth: true });
  } catch (err) {
    console.warn('Error saving bundle to Firestore:', err);
  }
}

export async function deleteBundleFromFirestore(bundleId: string): Promise<void> {
  if (!db || !bundleId) return;
  try {
    await api.delete('/api/bundles/' + encodeURIComponent(bundleId), { requireAuth: true });
  } catch (err) {
    console.warn('Error deleting bundle from Firestore:', err);
  }
}

// ==========================================
// CMS PAGES, POSTS, SERIES & SETTINGS SERVICES
// ==========================================
export async function fetchCmsPagesFromFirestore(): Promise<CMSPage[]> {
  if (!db) return [];
  try {
    return await withTimeout(
      getDocs(collection(db, COLLECTIONS.PAGES)).then(snap => {
        const items: CMSPage[] = [];
        snap.forEach(d => items.push(d.data() as CMSPage));
        return items;
      }),
      4000,
      []
    );
  } catch (err) {
    console.warn('Error fetching CMS pages from Firestore:', err);
    return [];
  }
}

export function subscribeToCmsPages(callback: (pages: CMSPage[]) => void): Unsubscribe {
  if (!db) return () => {};
  try {
    return onSnapshot(
      collection(db, COLLECTIONS.PAGES),
      (snap) => {
        const items: CMSPage[] = [];
        snap.forEach(d => items.push(d.data() as CMSPage));
        callback(items);
      },
      (err) => console.warn('CMS pages listener note:', err)
    );
  } catch {
    return () => {};
  }
}

export async function saveCmsPageToFirestore(page: CMSPage): Promise<void> {
  if (!db || !page?.id) return;
  try {
    await api.post('/api/cms/pages', page, { requireAuth: true });
  } catch (err) {
    console.warn('Error saving CMS page to Firestore:', err);
  }
}

export async function deleteCmsPageFromFirestore(pageId: string): Promise<void> {
  if (!db || !pageId) return;
  try {
    await api.delete('/api/cms/pages/' + encodeURIComponent(pageId), { requireAuth: true });
  } catch (err) {
    console.warn('Error deleting CMS page from Firestore:', err);
  }
}

export async function fetchCmsPostsFromFirestore(): Promise<CMSPost[]> {
  if (!db) return [];
  try {
    return await withTimeout(
      getDocs(collection(db, COLLECTIONS.POSTS)).then(snap => {
        const items: CMSPost[] = [];
        snap.forEach(d => items.push(d.data() as CMSPost));
        return items;
      }),
      4000,
      []
    );
  } catch (err) {
    console.warn('Error fetching CMS posts from Firestore:', err);
    return [];
  }
}

export function subscribeToCmsPosts(callback: (posts: CMSPost[]) => void): Unsubscribe {
  if (!db) return () => {};
  try {
    return onSnapshot(
      collection(db, COLLECTIONS.POSTS),
      (snap) => {
        const items: CMSPost[] = [];
        snap.forEach(d => items.push(d.data() as CMSPost));
        callback(items);
      },
      (err) => console.warn('CMS posts listener note:', err)
    );
  } catch {
    return () => {};
  }
}

export async function saveCmsPostToFirestore(post: CMSPost): Promise<void> {
  if (!db || !post?.id) return;
  try {
    await api.post('/api/cms/posts', post, { requireAuth: true });
  } catch (err) {
    console.warn('Error saving CMS post to Firestore:', err);
  }
}

export async function deleteCmsPostFromFirestore(postId: string): Promise<void> {
  if (!db || !postId) return;
  try {
    await api.delete('/api/cms/posts/' + encodeURIComponent(postId), { requireAuth: true });
  } catch (err) {
    console.warn('Error deleting CMS post from Firestore:', err);
  }
}

export async function fetchCmsSeriesPacksFromFirestore(): Promise<CMSTestSeriesPack[]> {
  if (!db) return [];
  try {
    return await withTimeout(
      getDocs(collection(db, COLLECTIONS.SERIES_PACKS)).then(snap => {
        const items: CMSTestSeriesPack[] = [];
        snap.forEach(d => items.push(d.data() as CMSTestSeriesPack));
        return items;
      }),
      4000,
      []
    );
  } catch (err) {
    console.warn('Error fetching CMS series packs from Firestore:', err);
    return [];
  }
}

export function subscribeToCmsSeriesPacks(callback: (packs: CMSTestSeriesPack[]) => void): Unsubscribe {
  if (!db) return () => {};
  try {
    return onSnapshot(
      collection(db, COLLECTIONS.SERIES_PACKS),
      (snap) => {
        const items: CMSTestSeriesPack[] = [];
        snap.forEach(d => items.push(d.data() as CMSTestSeriesPack));
        callback(items);
      },
      (err) => console.warn('CMS series packs listener note:', err)
    );
  } catch {
    return () => {};
  }
}

export async function saveCmsSeriesPackToFirestore(pack: CMSTestSeriesPack): Promise<void> {
  if (!db || !pack?.id) return;
  try {
    await api.post('/api/cms/series', pack, { requireAuth: true });
  } catch (err) {
    console.warn('Error saving CMS series pack to Firestore:', err);
  }
}

export async function deleteCmsSeriesPackFromFirestore(packId: string): Promise<void> {
  if (!db || !packId) return;
  try {
    await api.delete('/api/cms/series/' + encodeURIComponent(packId), { requireAuth: true });
  } catch (err) {
    console.warn('Error deleting CMS series pack from Firestore:', err);
  }
}

export async function fetchCmsSettingsFromFirestore(): Promise<CMSSiteSettings | null> {
  if (!db) return null;
  try {
    const ref = doc(db, COLLECTIONS.CMS_SETTINGS, 'global');
    return await withTimeout(
      getDoc(ref).then(snap => snap.exists() ? (snap.data() as CMSSiteSettings) : null),
      4000,
      null
    );
  } catch (err) {
    console.warn('Error fetching CMS settings from Firestore:', err);
    return null;
  }
}

export function subscribeToCmsSettings(callback: (settings: CMSSiteSettings) => void): Unsubscribe {
  if (!db) return () => {};
  try {
    return onSnapshot(
      doc(db, COLLECTIONS.CMS_SETTINGS, 'global'),
      (snap) => {
        if (snap.exists()) {
          callback(snap.data() as CMSSiteSettings);
        }
      },
      (err) => console.warn('CMS settings listener note:', err)
    );
  } catch {
    return () => {};
  }
}

export async function saveCmsSettingsToFirestore(settings: CMSSiteSettings): Promise<void> {
  if (!db) return;
  try {
    await api.post('/api/cms/settings', settings, { requireAuth: true });
  } catch (err) {
    console.warn('Error saving CMS settings to Firestore:', err);
  }
}

// ==========================================
// HERO SLIDER BANNERS & REALTIME SYNC
// ==========================================
export async function fetchSliderBannersFromFirestore(): Promise<SliderBanner[]> {
  if (!db) return [];
  try {
    return await withTimeout(
      getDocs(collection(db, COLLECTIONS.SLIDER_BANNERS)).then(snap => {
        const items: SliderBanner[] = [];
        snap.forEach(d => items.push(d.data() as SliderBanner));
        return items.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      }),
      4000,
      []
    );
  } catch (err) {
    console.warn('Error fetching slider banners from Firestore:', err);
    return [];
  }
}

export function subscribeToSliderBanners(callback: (banners: SliderBanner[]) => void): Unsubscribe {
  if (!db) return () => {};
  try {
    return onSnapshot(
      collection(db, COLLECTIONS.SLIDER_BANNERS),
      (snap) => {
        const items: SliderBanner[] = [];
        snap.forEach(d => items.push(d.data() as SliderBanner));
        callback(items.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)));
      },
      (err) => console.warn('Slider banners listener note:', err)
    );
  } catch {
    return () => {};
  }
}

// ==========================================
// REMOTE CONFIG (GLOBAL SERVER DRIVEN)
// ==========================================
export async function fetchRemoteConfigFromFirestore(): Promise<AppRemoteConfig | null> {
  if (!db) return null;
  try {
    const ref = doc(db, COLLECTIONS.REMOTE_CONFIG, 'global');
    return await withTimeout(
      getDoc(ref).then(snap => snap.exists() ? (snap.data() as AppRemoteConfig) : null),
      4000,
      null
    );
  } catch (err) {
    console.warn('Error fetching remote config from Firestore:', err);
    return null;
  }
}

export function subscribeToRemoteConfig(callback: (config: AppRemoteConfig) => void): Unsubscribe {
  if (!db) return () => {};
  try {
    return onSnapshot(
      doc(db, COLLECTIONS.REMOTE_CONFIG, 'global'),
      (snap) => {
        if (snap.exists()) {
          callback(snap.data() as AppRemoteConfig);
        }
      },
      (err) => console.warn('Remote config listener note:', err)
    );
  } catch {
    return () => {};
  }
}

export async function saveRemoteConfigToFirestore(config: Partial<AppRemoteConfig>): Promise<void> {
  if (!db) return;
  try {
    await api.post('/api/admin/config/remote', { ...config, updatedAt: new Date().toISOString() }, { requireAuth: true });
  } catch (err) {
    console.warn('Error saving remote config to Firestore:', err);
  }
}

// ==========================================
// SEEDING INITIAL DATA TO FIRESTORE
// ==========================================
export async function seedInitialDataIfEmpty(): Promise<void> {
  // Demo/factory seeding is development-only. Production must never mutate an empty database by itself.
  if (!db || !import.meta.env.DEV) return;
  try {
    // Check if tests exist
    const testSnap = await getDocs(collection(db, COLLECTIONS.TESTS)).catch(() => null);
    if (!testSnap || testSnap.empty) {
      console.log('🌱 Seeding initial verified Mock Tests into Firestore...');
      for (const t of INITIAL_MOCK_TESTS) {
        await setDoc(doc(db, COLLECTIONS.TESTS, t.id), t, { merge: true });
      }
    }

    // Check if questions exist
    const qSnap = await getDocs(collection(db, COLLECTIONS.QUESTIONS)).catch(() => null);
    if (!qSnap || qSnap.empty) {
      console.log('🌱 Seeding initial verified Question Bank into Firestore...');
      for (const q of INITIAL_QUESTIONS) {
        await setDoc(doc(db, COLLECTIONS.QUESTIONS, q.id), q, { merge: true });
      }
    }

    // Check if PYP papers exist
    const pypSnap = await getDocs(collection(db, COLLECTIONS.PYP_PAPERS)).catch(() => null);
    if (!pypSnap || pypSnap.empty) {
      console.log('🌱 Seeding initial verified PYP Papers into Firestore...');
      for (const p of INITIAL_PYP_PAPERS) {
        await setDoc(doc(db, COLLECTIONS.PYP_PAPERS, p.id), p, { merge: true });
      }
    }

    // Check if bundles exist
    const bundleSnap = await getDocs(collection(db, COLLECTIONS.BUNDLES)).catch(() => null);
    if (!bundleSnap || bundleSnap.empty) {
      console.log('🌱 Seeding initial verified Test Series Bundles into Firestore...');
      for (const b of OFFICIAL_BUNDLES_CATALOG) {
        await setDoc(doc(db, COLLECTIONS.BUNDLES, b.id), b, { merge: true });
      }
    }

    // Check if CMS pages exist
    const pageSnap = await getDocs(collection(db, COLLECTIONS.PAGES)).catch(() => null);
    if (!pageSnap || pageSnap.empty) {
      for (const page of INITIAL_CMS_PAGES) {
        await setDoc(doc(db, COLLECTIONS.PAGES, page.id), page, { merge: true });
      }
    }

    // Check if CMS posts exist
    const postSnap = await getDocs(collection(db, COLLECTIONS.POSTS)).catch(() => null);
    if (!postSnap || postSnap.empty) {
      for (const post of INITIAL_CMS_POSTS) {
        await setDoc(doc(db, COLLECTIONS.POSTS, post.id), post, { merge: true });
      }
    }

    // Check if CMS series packs exist
    const seriesSnap = await getDocs(collection(db, COLLECTIONS.SERIES_PACKS)).catch(() => null);
    if (!seriesSnap || seriesSnap.empty) {
      for (const pack of INITIAL_CMS_SERIES_PACKS) {
        await setDoc(doc(db, COLLECTIONS.SERIES_PACKS, pack.id), pack, { merge: true });
      }
    }

    // Check if CMS settings exist
    const settingsSnap = await getDoc(doc(db, COLLECTIONS.CMS_SETTINGS, 'global')).catch(() => null);
    if (!settingsSnap || !settingsSnap.exists()) {
      await setDoc(doc(db, COLLECTIONS.CMS_SETTINGS, 'global'), INITIAL_CMS_SETTINGS, { merge: true });
    }

    // Check if slider banners exist
    const bannerSnap = await getDocs(collection(db, COLLECTIONS.SLIDER_BANNERS)).catch(() => null);
    if (!bannerSnap || bannerSnap.empty) {
      for (const banner of DEFAULT_SLIDER_BANNERS) {
        await setDoc(doc(db, COLLECTIONS.SLIDER_BANNERS, banner.id), banner, { merge: true });
      }
    }

    // Check if remote config exists
    const configSnap = await getDoc(doc(db, COLLECTIONS.REMOTE_CONFIG, 'global')).catch(() => null);
    if (!configSnap || !configSnap.exists()) {
      await setDoc(doc(db, COLLECTIONS.REMOTE_CONFIG, 'global'), DEFAULT_REMOTE_CONFIG, { merge: true });
    }
  } catch (err) {
    console.warn('Initial seeding note:', err);
  }
}

// ==========================================
// BULK DATA MIGRATION & FULL SYNC
// ==========================================
export interface MigrationSummary {
  questionsCount: number;
  testsCount: number;
  bundlesCount: number;
  pypCount: number;
  attemptsCount: number;
  success: boolean;
  error?: string;
}

export async function migrateAllLocalDataToFirestore(params: {
  questions: Question[];
  tests: MockTest[];
  bundles: TestSeriesBundle[];
  pypPapers?: PreviousYearPaper[];
  attempts?: TestAttempt[];
  onProgress?: (msg: string, current: number, total: number) => void;
}): Promise<MigrationSummary> {
  const { questions, tests, bundles, pypPapers = [], attempts = [], onProgress } = params;
  let qCount = 0;
  let tCount = 0;
  let bCount = 0;
  let pCount = 0;
  let aCount = 0;

  try {
    const totalItems = questions.length + tests.length + bundles.length + pypPapers.length + attempts.length;
    let processed = 0;

    // 1. Sync Questions in small chunks
    for (const q of questions) {
      if (q && q.id) {
        const qRef = doc(db, COLLECTIONS.QUESTIONS, q.id);
        await setDoc(qRef, q, { merge: true });
        qCount++;
      }
      processed++;
      if (onProgress && processed % 10 === 0) {
        onProgress(`Migrating Questions (${processed}/${totalItems})...`, processed, totalItems);
      }
    }

    // 2. Sync Tests
    for (const t of tests) {
      if (t && t.id) {
        const tRef = doc(db, COLLECTIONS.TESTS, t.id);
        await setDoc(tRef, t, { merge: true });
        tCount++;
      }
      processed++;
      if (onProgress) {
        onProgress(`Migrating Mock Tests (${processed}/${totalItems})...`, processed, totalItems);
      }
    }

    // 3. Sync Bundles
    for (const b of bundles) {
      if (b && b.id) {
        const bRef = doc(db, COLLECTIONS.BUNDLES, b.id);
        await setDoc(bRef, b, { merge: true });
        bCount++;
      }
      processed++;
      if (onProgress) {
        onProgress(`Migrating Test Series Bundles (${processed}/${totalItems})...`, processed, totalItems);
      }
    }

    // 4. Sync PYP Papers
    for (const p of pypPapers) {
      if (p && p.id) {
        const pRef = doc(db, COLLECTIONS.PYP_PAPERS, p.id);
        await setDoc(pRef, p, { merge: true });
        pCount++;
      }
      processed++;
      if (onProgress) {
        onProgress(`Migrating PYP Papers (${processed}/${totalItems})...`, processed, totalItems);
      }
    }

    // 5. Sync Attempts
    for (const a of attempts) {
      if (a && a.id) {
        const aRef = doc(db, COLLECTIONS.ATTEMPTS, a.id);
        await setDoc(aRef, a, { merge: true });
        aCount++;
      }
      processed++;
    }

    if (onProgress) {
      onProgress('All collections successfully migrated to Firestore!', totalItems, totalItems);
    }

    return {
      questionsCount: qCount,
      testsCount: tCount,
      bundlesCount: bCount,
      pypCount: pCount,
      attemptsCount: aCount,
      success: true,
    };
  } catch (err: any) {
    console.error('Migration failed:', err);
    return {
      questionsCount: qCount,
      testsCount: tCount,
      bundlesCount: bCount,
      pypCount: pCount,
      attemptsCount: aCount,
      success: false,
      error: err?.message || 'Unknown migration error',
    };
  }
}

export async function saveAttemptToFirestore(attempt: TestAttempt): Promise<void> {
  if (!attempt?.id) return;
  try {
    await api.post('/api/tests/' + encodeURIComponent(attempt.testId) + '/submit', {
      userName: attempt.userName,
      timeTakenSeconds: attempt.timeTakenSeconds,
      responses: attempt.responses,
      questionStatuses: attempt.questionStatuses,
      idempotencyKey: attempt.id,
    }, { requireAuth: true });
  } catch (err) {
    console.warn('Error submitting test attempt through API:', err);
  }
}

export async function fetchLeaderboardFromFirestore(testId?: string): Promise<TestAttempt[]> {
  if (!testId) return [];
  try {
    const data = await api.get<{ success: boolean; leaderboard: TestAttempt[] }>('/api/tests/' + encodeURIComponent(testId) + '/leaderboard');
    return Array.isArray(data.leaderboard) ? data.leaderboard : [];
  } catch (err) {
    console.warn('Error fetching leaderboard through API:', err);
    return [];
  }
}

export async function purgeFirestoreDemoData(): Promise<void> {
  if (!db) return;
  try {
    const testSnap = await getDocs(collection(db, COLLECTIONS.TESTS)).catch(() => null);
    if (testSnap && !testSnap.empty) {
      await Promise.allSettled(testSnap.docs.map(d => deleteDoc(d.ref)));
    }

    const qSnap = await getDocs(collection(db, COLLECTIONS.QUESTIONS)).catch(() => null);
    if (qSnap && !qSnap.empty) {
      await Promise.allSettled(qSnap.docs.map(d => deleteDoc(d.ref)));
    }

    const pypSnap = await getDocs(collection(db, COLLECTIONS.PYP_PAPERS)).catch(() => null);
    if (pypSnap && !pypSnap.empty) {
      await Promise.allSettled(pypSnap.docs.map(d => deleteDoc(d.ref)));
    }

    const bundleSnap = await getDocs(collection(db, COLLECTIONS.BUNDLES)).catch(() => null);
    if (bundleSnap && !bundleSnap.empty) {
      await Promise.allSettled(bundleSnap.docs.map(d => deleteDoc(d.ref)));
    }
  } catch (err) {
    console.warn('Error purging Firestore demo data:', err);
  }
}
