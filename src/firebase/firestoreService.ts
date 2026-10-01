import {
  collection,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  getCountFromServer,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  runTransaction,
  Unsubscribe
} from 'firebase/firestore';
import { db, auth } from './config';
import { signInAnonymously } from 'firebase/auth';
import { api } from '../utils/apiClient';
import { MockTest, Question, TestAttempt, User, PreviousYearPaper, SliderBanner, AppRemoteConfig, DEFAULT_REMOTE_CONFIG, LeaderboardEntryRecord, LeaderboardProfileRecord } from '../types';
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
  REFERRALS: 'referrals',
  USER_ENTITLEMENTS: 'userEntitlements',
  LEADERBOARD_ENTRIES: 'leaderboardEntries',
  LEADERBOARD_PROFILES: 'leaderboardProfiles',
  SERIES_ENROLLMENTS: 'seriesEnrollments'
} as const;

/**
 * Timeout wrapper to guarantee that network hiccups don't freeze the client
 */
async function withTimeout<T>(promise: Promise<T>, timeoutMs = 4000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Firestore operation timed out')), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
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
      4000
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
      4000
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
    await setDoc(doc(db, COLLECTIONS.TESTS, test.id), test, { merge: true });
}

export async function deleteTestFromFirestore(testId: string): Promise<void> {
  if (!db || !testId) return;
    await deleteDoc(doc(db, COLLECTIONS.TESTS, testId));
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
      4000
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
    const validQuestions = questions.filter(q => q && q.id);
    if (validQuestions.length > 0) {
      await Promise.all(validQuestions.map(q => setDoc(doc(db, COLLECTIONS.QUESTIONS, q.id), q, { merge: true })));
    }
}

export async function saveSingleQuestionToFirestore(question: Question): Promise<void> {
  if (!db || !question?.id) return;
    await setDoc(doc(db, COLLECTIONS.QUESTIONS, question.id), question, { merge: true });
}

export async function deleteQuestionFromFirestore(questionId: string): Promise<void> {
  if (!db || !questionId) return;
    await deleteDoc(doc(db, COLLECTIONS.QUESTIONS, questionId));
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
      4000
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
    await setDoc(doc(db, COLLECTIONS.PYP_PAPERS, paper.id), paper, { merge: true });
}

export async function deletePypPaperFromFirestore(paperId: string): Promise<void> {
  if (!db || !paperId) return;
    await deleteDoc(doc(db, COLLECTIONS.PYP_PAPERS, paperId));
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
      4000
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
    await setDoc(doc(db, COLLECTIONS.BUNDLES, bundle.id), bundle, { merge: true });
}

export async function deleteBundleFromFirestore(bundleId: string): Promise<void> {
  if (!db || !bundleId) return;
    await deleteDoc(doc(db, COLLECTIONS.BUNDLES, bundleId));
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
      4000
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
    await setDoc(doc(db, COLLECTIONS.PAGES, page.id), page, { merge: true });
}

export async function deleteCmsPageFromFirestore(pageId: string): Promise<void> {
  if (!db || !pageId) return;
    await deleteDoc(doc(db, COLLECTIONS.PAGES, pageId));
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
      4000
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
    await setDoc(doc(db, COLLECTIONS.POSTS, post.id), post, { merge: true });
}

export async function deleteCmsPostFromFirestore(postId: string): Promise<void> {
  if (!db || !postId) return;
    await deleteDoc(doc(db, COLLECTIONS.POSTS, postId));
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
      4000
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
    await setDoc(doc(db, COLLECTIONS.SERIES_PACKS, pack.id), pack, { merge: true });
}

export async function deleteCmsSeriesPackFromFirestore(packId: string): Promise<void> {
  if (!db || !packId) return;
    await deleteDoc(doc(db, COLLECTIONS.SERIES_PACKS, packId));
}

export async function fetchCmsSettingsFromFirestore(): Promise<CMSSiteSettings | null> {
  if (!db) return null;
  try {
    const ref = doc(db, COLLECTIONS.CMS_SETTINGS, 'global');
    return await withTimeout(
      getDoc(ref).then(snap => snap.exists() ? (snap.data() as CMSSiteSettings) : null),
      4000
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
    await setDoc(doc(db, COLLECTIONS.CMS_SETTINGS, 'global'), settings, { merge: true });
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
      4000
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
      4000
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
    await setDoc(doc(db, COLLECTIONS.REMOTE_CONFIG, 'global'), { ...config, updatedAt: new Date().toISOString() }, { merge: true });
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

export interface UserEntitlement {
  userId: string;
  planType: string;
  status: 'ACTIVE' | 'EXPIRED' | 'PENDING' | 'CANCELLED';
  issuedAt?: string;
  expiresAt?: string;
  durationDays: number;
  source?: 'WELCOME_FREE' | 'CLIENT_CHECKOUT' | 'ADMIN' | 'PAYMENT' | 'FREE_CAMPAIGN';
  planName?: string;
  boundDeviceId?: string;
  boundDeviceName?: string;
  updatedAt?: string;
  completedTestsCount?: number;
  freePassStage?: 'not_started' | '1_month_active' | '3_months_unlocked';
  unlockedMilestoneBonus?: boolean;
  campaignId?: string;
}

export async function fetchUserEntitlementFromFirestore(userId?: string): Promise<UserEntitlement | null> {
  const uid = userId || auth.currentUser?.uid;
  if (!db || !uid) return null;
  try {
    const snap = await withTimeout(getDoc(doc(db, COLLECTIONS.USER_ENTITLEMENTS, uid)), 4000);
    return snap.exists() ? (snap.data() as UserEntitlement) : null;
  } catch (err) {
    console.warn('Error fetching user entitlement from Firestore:', err);
    return null;
  }
}

export async function saveUserEntitlementToFirestore(entitlement: UserEntitlement): Promise<void> {
  if (!db || !entitlement?.userId) return;
  await setDoc(doc(db, COLLECTIONS.USER_ENTITLEMENTS, entitlement.userId), entitlement, { merge: true });
}

export function seriesEnrollmentId(userId: string, seriesId: string): string {
  return encodeURIComponent(userId + '__series__' + seriesId);
}

export async function fetchMySeriesEnrollmentsFromFirestore(userId?: string): Promise<import('../types').SeriesEnrollment[]> {
  const uid = userId || auth.currentUser?.uid;
  if (!db || !uid) return [];
  try {
    const snap = await withTimeout(
      getDocs(query(collection(db, COLLECTIONS.SERIES_ENROLLMENTS), where('userId', '==', uid))),
      5000
    );
    return snap.docs.map(d => d.data() as import('../types').SeriesEnrollment)
      .sort((a, b) => String(b.enrolledAt || '').localeCompare(String(a.enrolledAt || '')));
  } catch (err) {
    console.warn('Error fetching student series enrollments:', err);
    return [];
  }
}

export async function saveSeriesEnrollmentToFirestore(enrollment: import('../types').SeriesEnrollment): Promise<import('../types').SeriesEnrollment> {
  if (!db || !auth.currentUser || auth.currentUser.uid !== enrollment.userId) {
    throw new Error('Cannot persist series enrollment: authenticated owner mismatch.');
  }
  const ref = doc(db, COLLECTIONS.SERIES_ENROLLMENTS, seriesEnrollmentId(enrollment.userId, enrollment.seriesId));
  await setDoc(ref, enrollment, { merge: false });
  return enrollment;
}

export async function saveAttemptToFirestore(attempt: TestAttempt): Promise<TestAttempt> {
  if (!db || !attempt?.id || !auth.currentUser || auth.currentUser.uid !== attempt.userId) {
    throw new Error('Cannot persist attempt: authenticated owner mismatch.');
  }
  try {
    const attemptRef = doc(db, COLLECTIONS.ATTEMPTS, attempt.id);
    return await runTransaction(db, async (transaction) => {
      const existing = await transaction.get(attemptRef);
      if (existing.exists()) {
        return existing.data() as TestAttempt;
      }
      transaction.set(attemptRef, attempt, { merge: false });
      return attempt;
    });
  } catch (err) {
    console.warn('Error saving test attempt to Firestore:', err);
    throw err;
  }
}

export async function fetchMyAttemptsFromFirestore(userId?: string): Promise<TestAttempt[]> {
  const uid = userId || auth.currentUser?.uid;
  if (!db || !uid) return [];
  try {
    const snap = await withTimeout(
      getDocs(query(collection(db, COLLECTIONS.ATTEMPTS), where('userId', '==', uid))),
      5000
    );
    return snap.docs.map(d => d.data() as TestAttempt).sort((a, b) => String(b.submittedAt || '').localeCompare(String(a.submittedAt || '')));
  } catch (err) {
    console.warn('Error fetching student attempts from Firestore:', err);
    return [];
  }
}

export async function saveLeaderboardEntryToFirestore(entry: LeaderboardEntryRecord): Promise<void> {
  if (!db || !entry?.id || !auth.currentUser || auth.currentUser.uid !== entry.userId) return;
  await setDoc(doc(db, COLLECTIONS.LEADERBOARD_ENTRIES, entry.id), entry, { merge: true });
}

export async function fetchLeaderboardEntriesFromFirestore(): Promise<LeaderboardEntryRecord[]> {
  if (!db) return [];
  try {
    const snap = await withTimeout(getDocs(collection(db, COLLECTIONS.LEADERBOARD_ENTRIES)), 5000);
    return snap.docs.map(d => d.data() as LeaderboardEntryRecord);
  } catch (err) {
    console.warn('Error fetching practice leaderboard entries from Firestore:', err);
    return [];
  }
}

export async function saveLeaderboardProfilesToFirestore(profiles: LeaderboardProfileRecord[]): Promise<void> {
  if (!db || !auth.currentUser) return;
  const owned = profiles.filter(p => p?.id && p.userId === auth.currentUser?.uid);
  await Promise.all(owned.map(p => setDoc(doc(db, COLLECTIONS.LEADERBOARD_PROFILES, p.id), p, { merge: true })));
}

export interface LeaderboardProfileQuery {
  scopeType: 'target' | 'series' | 'test';
  scopeKey: string;
  district?: string;
  limitCount?: number;
}

export async function fetchLeaderboardProfilesFromFirestore(
  options: LeaderboardProfileQuery
): Promise<LeaderboardProfileRecord[]> {
  if (!db || !options.scopeKey) return [];
  try {
    const constraints = [
      where('scopeType', '==', options.scopeType),
      where('scopeKey', '==', options.scopeKey),
      orderBy('averagePercentage', 'desc'),
      limit(Math.min(Math.max(options.limitCount || 100, 1), 100))
    ];
    const baseQuery = options.district && options.district !== 'All Districts'
      ? query(
          collection(db, COLLECTIONS.LEADERBOARD_PROFILES),
          where('scopeType', '==', options.scopeType),
          where('scopeKey', '==', options.scopeKey),
          where('district', '==', options.district),
          orderBy('averagePercentage', 'desc'),
          limit(Math.min(Math.max(options.limitCount || 100, 1), 100))
        )
      : query(collection(db, COLLECTIONS.LEADERBOARD_PROFILES), ...constraints);
    const snap = await withTimeout(getDocs(baseQuery), 5000);
    return snap.docs.map(d => d.data() as LeaderboardProfileRecord);
  } catch (err) {
    console.warn('Error fetching bounded leaderboard profiles from Firestore:', err);
    return [];
  }
}

export async function fetchMyLeaderboardProfileFromFirestore(
  userId: string,
  options: LeaderboardProfileQuery
): Promise<LeaderboardProfileRecord | null> {
  if (!db || !userId || !options.scopeKey) return null;
  try {
    const ref = doc(db, COLLECTIONS.LEADERBOARD_PROFILES, leaderboardProfileId(userId, options.scopeType, options.scopeKey));
    const snap = await withTimeout(getDoc(ref), 4000);
    return snap.exists() ? (snap.data() as LeaderboardProfileRecord) : null;
  } catch (err) {
    console.warn('Error fetching own leaderboard profile:', err);
    return null;
  }
}

export async function countLeaderboardProfilesAboveScoreFromFirestore(
  options: LeaderboardProfileQuery,
  averagePercentage: number
): Promise<number> {
  if (!db || !options.scopeKey) return 0;
  try {
    const constraints = [
      where('scopeType', '==', options.scopeType),
      where('scopeKey', '==', options.scopeKey),
      where('averagePercentage', '>', averagePercentage)
    ];
    if (options.district && options.district !== 'All Districts') {
      constraints.push(where('district', '==', options.district));
    }
    const q = query(collection(db, COLLECTIONS.LEADERBOARD_PROFILES), ...constraints);
    const snap = await withTimeout(getCountFromServer(q), 5000);
    return snap.data().count;
  } catch (err) {
    console.warn('Error counting leaderboard profiles above score:', err);
    return 0;
  }
}

export async function countLeaderboardProfilesFromFirestore(options: LeaderboardProfileQuery): Promise<number> {
  if (!db || !options.scopeKey) return 0;
  try {
    const constraints = [
      where('scopeType', '==', options.scopeType),
      where('scopeKey', '==', options.scopeKey)
    ];
    if (options.district && options.district !== 'All Districts') {
      constraints.push(where('district', '==', options.district));
    }
    const q = query(collection(db, COLLECTIONS.LEADERBOARD_PROFILES), ...constraints);
    const snap = await withTimeout(getCountFromServer(q), 5000);
    return snap.data().count;
  } catch (err) {
    console.warn('Error counting leaderboard profiles:', err);
    return 0;
  }
}

export const leaderboardProfileId = (
  userId: string,
  scopeType: 'target' | 'series' | 'test',
  scopeKey: string
) => encodeURIComponent(userId + '__' + scopeType + '__' + scopeKey);

export async function fetchLeaderboardFromFirestore(testId?: string): Promise<TestAttempt[]> {
  const entries = await fetchLeaderboardEntriesFromFirestore();
  return entries.filter(e => !testId || e.testId === testId).map(e => ({
    id: e.id, userId: e.userId, userName: e.candidateName, testId: e.testId,
    testTitle: '', category: e.targetKey.startsWith('CGPSC') ? 'CGPSC' : 'CGSSB',
    submittedAt: e.submittedAt, timeTakenSeconds: e.timeTakenSeconds,
    totalDurationSeconds: 0, responses: {}, questionStatuses: {}, score: e.score,
    maxScore: e.maxScore, percentage: e.percentage, accuracy: e.accuracy,
    correctCount: e.correctCount, incorrectCount: e.incorrectCount,
    unattemptedCount: e.unattemptedCount, markedForReviewCount: 0,
    negativeMarksDeducted: 0, sectorAnalysis: [], attemptedCount: e.correctCount + e.incorrectCount,
    seriesId: e.seriesId, targetKey: e.targetKey, targetExam: e.targetExam
  } as TestAttempt));
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

    // Phase 7 reset: the previous demo taxonomy is disposable too.
    // Clear canonical catalog records so the production catalog starts clean.
    for (const collectionName of ['examTestSeries', 'examPosts', 'examPrograms', 'examAuthorities']) {
      const snap = await getDocs(collection(db, collectionName)).catch(() => null);
      if (snap && !snap.empty) {
        await Promise.allSettled(snap.docs.map(d => deleteDoc(d.ref)));
      }
    }
  } catch (err) {
    console.warn('Error purging Firestore demo data:', err);
  }
}
