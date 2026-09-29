import { doc, getDoc, getDocs, collection, setDoc, deleteDoc } from 'firebase/firestore';
import { dbConfig, getFirestoreServer, canServerWriteFirestore } from './connection.ts';
import type {
  Question,
  MockTest,
  PreviousYearPaper,
  TestAttempt,
  AppRemoteConfig
} from '../../src/types.ts';
import { DEFAULT_REMOTE_CONFIG } from '../../src/types.ts';
import type { TestSeriesBundle } from '../../src/data/bundleCatalog.ts';
import type { CMSPage, CMSPost, CMSTestSeriesPack, CMSSiteSettings } from '../../src/types/cms.ts';
import {
  INITIAL_CMS_SETTINGS
} from '../../src/defaultCmsData.ts';

export interface DatabaseShape {
  questions: Question[];
  mockTests: MockTest[];
  pypPapers: PreviousYearPaper[];
  attempts: TestAttempt[];
  demoDataPurged?: boolean;
}

// In-memory runtime cache fed strictly by live Cloud Firestore
let memoryCache: DatabaseShape = {
  questions: [],
  mockTests: [],
  pypPapers: [],
  attempts: [],
  demoDataPurged: false,
};

let memoryBundles: TestSeriesBundle[] = [];
let memoryCmsPages: CMSPage[] = [];
let memoryCmsPosts: CMSPost[] = [];
let memoryCmsSeries: CMSTestSeriesPack[] = [];
let memoryCmsSettings: CMSSiteSettings = { ...INITIAL_CMS_SETTINGS };
let memoryRemoteConfig: AppRemoteConfig = { ...DEFAULT_REMOTE_CONFIG };

/**
 * Sync in-memory catalog with live Cloud Firestore collections
 */
export async function syncWithFirestore(): Promise<{
  syncedQuestions: number;
  syncedTests: number;
  syncedAttempts: number;
}> {
  const db = getFirestoreServer();
  if (!db) {
    throw new Error(`LIVE DATABASE ERROR: Could not get Firestore server instance for database ID ${dbConfig.databaseId}`);
  }

  const timeoutPromise = <T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>(resolve => setTimeout(() => resolve(fallback), ms))
    ]);
  };

  try {
    // 1. Fetch questions from Cloud Firestore
    const qSnap = await timeoutPromise(getDocs(collection(db, 'questions')), 5000, null as any);
    if (qSnap && !qSnap.empty) {
      const list: Question[] = [];
      qSnap.forEach((d: any) => list.push(d.data() as Question));
      memoryCache.questions = list;
    } else {
      memoryCache.questions = [];
    }

    // 2. Fetch mock tests from Cloud Firestore
    const tSnap = await timeoutPromise(getDocs(collection(db, 'mockTests')), 5000, null as any);
    if (tSnap && !tSnap.empty) {
      const list: MockTest[] = [];
      tSnap.forEach((d: any) => list.push(d.data() as MockTest));
      memoryCache.mockTests = list;
    } else {
      memoryCache.mockTests = [];
    }

    // 3. Fetch PYP papers from Cloud Firestore
    const pSnap = await timeoutPromise(getDocs(collection(db, 'pypPapers')), 5000, null as any);
    if (pSnap && !pSnap.empty) {
      const list: PreviousYearPaper[] = [];
      pSnap.forEach((d: any) => list.push(d.data() as PreviousYearPaper));
      memoryCache.pypPapers = list;
    } else {
      memoryCache.pypPapers = [];
    }

    // 4. Fetch attempts from Cloud Firestore
    const aSnap = await timeoutPromise(getDocs(collection(db, 'attempts')), 5000, null as any);
    if (aSnap && !aSnap.empty) {
      const list: TestAttempt[] = [];
      aSnap.forEach((d: any) => list.push(d.data() as TestAttempt));
      memoryCache.attempts = list;
    } else {
      memoryCache.attempts = [];
    }

    // 5. Fetch bundles from Cloud Firestore
    const bSnap = await timeoutPromise(getDocs(collection(db, 'bundles')), 5000, null as any);
    if (bSnap && !bSnap.empty) {
      const list: TestSeriesBundle[] = [];
      bSnap.forEach((d: any) => list.push(d.data() as TestSeriesBundle));
      memoryBundles = list;
    } else {
      memoryBundles = [];
    }

    // 6. Fetch CMS Pages from Cloud Firestore
    const pageSnap = await timeoutPromise(getDocs(collection(db, 'pages')), 5000, null as any);
    if (pageSnap && !pageSnap.empty) {
      const list: CMSPage[] = [];
      pageSnap.forEach((d: any) => list.push(d.data() as CMSPage));
      memoryCmsPages = list;
    } else {
      memoryCmsPages = [];
    }

    // 7. Fetch CMS Posts from Cloud Firestore
    const postSnap = await timeoutPromise(getDocs(collection(db, 'posts')), 5000, null as any);
    if (postSnap && !postSnap.empty) {
      const list: CMSPost[] = [];
      postSnap.forEach((d: any) => list.push(d.data() as CMSPost));
      memoryCmsPosts = list;
    } else {
      memoryCmsPosts = [];
    }
  } catch (err) {
    console.warn('⚠️ Cloud Firestore initial sync note:', err);
  }

  return {
    syncedQuestions: memoryCache.questions.length,
    syncedTests: memoryCache.mockTests.length,
    syncedAttempts: memoryCache.attempts.length,
  };
}

// ----------------- QUESTIONS COLLECTION REPOSITORY (/questions) -----------------

export async function getAllQuestions(filters?: {
  subject?: string;
  topic?: string;
  subtopic?: string;
  difficulty?: string;
  category?: string;
  search?: string;
}): Promise<Question[]> {
  const db = getFirestoreServer();
  try {
    const snap = await getDocs(collection(db, 'questions'));
    const items: Question[] = [];
    snap.forEach(d => items.push(d.data() as Question));
    memoryCache.questions = items;
  } catch (err) {
    console.warn('Firestore getAllQuestions note:', err);
  }

  let filtered = [...memoryCache.questions];
  if (filters?.subject) filtered = filtered.filter(q => q.subject === filters.subject);
  if (filters?.topic) filtered = filtered.filter(q => q.topic === filters.topic);
  if (filters?.subtopic) filtered = filtered.filter(q => q.subtopic === filters.subtopic);
  if (filters?.difficulty) filtered = filtered.filter(q => q.difficulty === filters.difficulty);
  if (filters?.category) filtered = filtered.filter(q => q.category === filters.category);
  if (filters?.search) {
    const s = filters.search.toLowerCase();
    filtered = filtered.filter(
      q =>
        (q.questionText || q.question || '').toLowerCase().includes(s) ||
        (q.questionHindi && q.questionHindi.toLowerCase().includes(s)) ||
        (q.topic || '').toLowerCase().includes(s)
    );
  }
  return filtered;
}

export async function getQuestionById(id: string): Promise<Question | null> {
  const db = getFirestoreServer();
  try {
    const snap = await getDoc(doc(db, 'questions', id));
    if (snap.exists()) return snap.data() as Question;
  } catch (err) {
    console.warn('Firestore getQuestionById note:', err);
  }
  return memoryCache.questions.find(q => q.id === id) || null;
}

export async function saveQuestion(q: Question): Promise<Question> {
  const db = getFirestoreServer();
  const qRef = doc(db, 'questions', q.id);
  await setDoc(qRef, q, { merge: true });

  const idx = memoryCache.questions.findIndex(x => x.id === q.id);
  if (idx !== -1) memoryCache.questions[idx] = q;
  else memoryCache.questions.unshift(q);

  return q;
}

export async function deleteQuestion(id: string): Promise<boolean> {
  const db = getFirestoreServer();
  await deleteDoc(doc(db, 'questions', id));
  memoryCache.questions = memoryCache.questions.filter(q => q.id !== id);
  return true;
}

export async function bulkUpsertQuestions(questionsList: Question[]): Promise<{ inserted: number; updated: number }> {
  let inserted = 0;
  let updated = 0;

  for (const q of questionsList) {
    const exists = memoryCache.questions.some(x => x.id === q.id || (q.uniqueQuestionId && x.uniqueQuestionId === q.uniqueQuestionId));
    if (exists) updated++;
    else inserted++;
    await saveQuestion(q);
  }
  return { inserted, updated };
}

// ----------------- MOCK TESTS COLLECTION REPOSITORY (/mockTests) -----------------

export async function getAllMockTests(filters?: { category?: string; publishedOnly?: boolean }): Promise<MockTest[]> {
  const db = getFirestoreServer();
  try {
    const snap = await getDocs(collection(db, 'mockTests'));
    const items: MockTest[] = [];
    snap.forEach(d => items.push(d.data() as MockTest));
    memoryCache.mockTests = items;
  } catch (err) {
    console.warn('Firestore getAllMockTests note:', err);
  }

  let list = [...memoryCache.mockTests];
  if (filters?.publishedOnly) {
    list = list.filter(t => t.isPublished !== false);
  }
  if (filters?.category && filters.category !== 'ALL') {
    list = list.filter(t => t.category === filters.category);
  }
  return list;
}

export async function getMockTestById(id: string): Promise<MockTest | null> {
  const db = getFirestoreServer();
  try {
    const snap = await getDoc(doc(db, 'mockTests', id));
    if (snap.exists()) return snap.data() as MockTest;
  } catch (err) {
    console.warn('Firestore getMockTestById note:', err);
  }
  return memoryCache.mockTests.find(t => t.id === id) || null;
}

export async function saveMockTest(t: MockTest): Promise<MockTest> {
  const db = getFirestoreServer();
  await setDoc(doc(db, 'mockTests', t.id), t, { merge: true });

  const idx = memoryCache.mockTests.findIndex(x => x.id === t.id);
  if (idx !== -1) memoryCache.mockTests[idx] = t;
  else memoryCache.mockTests.unshift(t);

  return t;
}

export async function deleteMockTest(id: string): Promise<boolean> {
  const db = getFirestoreServer();
  await deleteDoc(doc(db, 'mockTests', id));
  memoryCache.mockTests = memoryCache.mockTests.filter(t => t.id !== id);
  return true;
}

// ----------------- PREVIOUS YEAR PAPERS COLLECTION REPOSITORY -----------------

export async function getAllPypPapers(category?: string): Promise<PreviousYearPaper[]> {
  const db = getFirestoreServer();
  try {
    const snap = await getDocs(collection(db, 'pypPapers'));
    const items: PreviousYearPaper[] = [];
    snap.forEach(d => items.push(d.data() as PreviousYearPaper));
    memoryCache.pypPapers = items;
  } catch (err) {
    console.warn('Firestore getAllPypPapers note:', err);
  }

  let list = [...memoryCache.pypPapers];
  if (category) {
    list = list.filter(p => p.examCategory === category);
  }
  return list;
}

export async function savePypPaper(p: PreviousYearPaper): Promise<PreviousYearPaper> {
  const db = getFirestoreServer();
  await setDoc(doc(db, 'pypPapers', p.id), p, { merge: true });

  const idx = memoryCache.pypPapers.findIndex(x => x.id === p.id);
  if (idx !== -1) memoryCache.pypPapers[idx] = p;
  else memoryCache.pypPapers.unshift(p);

  return p;
}

// ----------------- ATTEMPTS COLLECTION REPOSITORY (/attempts) -----------------

export async function getAllTestAttempts(userId?: string): Promise<TestAttempt[]> {
  const db = getFirestoreServer();
  try {
    const snap = await getDocs(collection(db, 'attempts'));
    const items: TestAttempt[] = [];
    snap.forEach(d => items.push(d.data() as TestAttempt));
    memoryCache.attempts = items;
  } catch (err) {
    console.warn('Firestore getAllTestAttempts note:', err);
  }

  let list = [...memoryCache.attempts];
  if (userId) {
    list = list.filter(a => a.userId === userId);
  }
  return list;
}

export async function getTestAttemptById(id: string): Promise<TestAttempt | null> {
  const db = getFirestoreServer();
  try {
    const snap = await getDoc(doc(db, 'attempts', id));
    if (snap.exists()) return snap.data() as TestAttempt;
  } catch (err) {
    console.warn('Firestore getTestAttemptById note:', err);
  }
  return memoryCache.attempts.find(a => a.id === id) || null;
}

export async function saveTestAttempt(a: TestAttempt): Promise<TestAttempt> {
  const db = getFirestoreServer();
  await setDoc(doc(db, 'attempts', a.id), a, { merge: true });
  memoryCache.attempts.unshift(a);
  return a;
}

// ----------------- DATABASE COUNTS & METRICS -----------------

export async function getDatabaseCounts(): Promise<{ questions: number; mockTests: number; pypPapers: number; attempts: number }> {
  return {
    questions: memoryCache.questions.length,
    mockTests: memoryCache.mockTests.length,
    pypPapers: memoryCache.pypPapers.length,
    attempts: memoryCache.attempts.length,
  };
}

export function getLocalSnapshot(): DatabaseShape {
  return memoryCache;
}

// ----------------- NO-CODE CMS REPOSITORY -----------------

export async function getAllCmsPages(): Promise<CMSPage[]> {
  const db = getFirestoreServer();
  try {
    const snap = await getDocs(collection(db, 'pages'));
    const items: CMSPage[] = [];
    snap.forEach(d => items.push(d.data() as CMSPage));
    memoryCmsPages = items;
  } catch (err) {
    console.warn('Firestore getAllCmsPages note:', err);
  }
  return memoryCmsPages;
}

export async function getCmsPageBySlug(slug: string): Promise<CMSPage | null> {
  const list = await getAllCmsPages();
  return list.find(p => p.slug === slug) || null;
}

export async function saveCmsPage(page: CMSPage): Promise<CMSPage> {
  const db = getFirestoreServer();
  await setDoc(doc(db, 'pages', page.id), page, { merge: true });

  const idx = memoryCmsPages.findIndex(p => p.id === page.id);
  if (idx !== -1) memoryCmsPages[idx] = page;
  else memoryCmsPages.unshift(page);

  return page;
}

export async function deleteCmsPage(id: string): Promise<boolean> {
  const db = getFirestoreServer();
  await deleteDoc(doc(db, 'pages', id));
  memoryCmsPages = memoryCmsPages.filter(p => p.id !== id);
  return true;
}

export async function getAllCmsPosts(): Promise<CMSPost[]> {
  const db = getFirestoreServer();
  try {
    const snap = await getDocs(collection(db, 'posts'));
    const items: CMSPost[] = [];
    snap.forEach(d => items.push(d.data() as CMSPost));
    memoryCmsPosts = items;
  } catch (err) {
    console.warn('Firestore getAllCmsPosts note:', err);
  }
  return memoryCmsPosts;
}

export async function getCmsPostBySlug(slug: string): Promise<CMSPost | null> {
  const list = await getAllCmsPosts();
  return list.find(p => p.slug === slug) || null;
}

export async function saveCmsPost(post: CMSPost): Promise<CMSPost> {
  const db = getFirestoreServer();
  await setDoc(doc(db, 'posts', post.id), post, { merge: true });

  const idx = memoryCmsPosts.findIndex(p => p.id === post.id);
  if (idx !== -1) memoryCmsPosts[idx] = post;
  else memoryCmsPosts.unshift(post);

  return post;
}

export async function deleteCmsPost(id: string): Promise<boolean> {
  const db = getFirestoreServer();
  await deleteDoc(doc(db, 'posts', id));
  memoryCmsPosts = memoryCmsPosts.filter(p => p.id !== id);
  return true;
}

export async function getAllCmsSeriesPacks(): Promise<CMSTestSeriesPack[]> {
  const db = getFirestoreServer();
  try {
    const snap = await getDocs(collection(db, 'seriesPacks'));
    const items: CMSTestSeriesPack[] = [];
    snap.forEach(d => items.push(d.data() as CMSTestSeriesPack));
    memoryCmsSeries = items;
  } catch (err) {
    console.warn('Firestore getAllCmsSeriesPacks note:', err);
  }
  return memoryCmsSeries;
}

export async function saveCmsSeriesPack(pack: CMSTestSeriesPack): Promise<CMSTestSeriesPack> {
  const db = getFirestoreServer();
  await setDoc(doc(db, 'seriesPacks', pack.id), pack, { merge: true });

  const idx = memoryCmsSeries.findIndex(p => p.id === pack.id);
  if (idx !== -1) memoryCmsSeries[idx] = pack;
  else memoryCmsSeries.unshift(pack);

  return pack;
}

export async function deleteCmsSeriesPack(id: string): Promise<boolean> {
  const db = getFirestoreServer();
  await deleteDoc(doc(db, 'seriesPacks', id));
  memoryCmsSeries = memoryCmsSeries.filter(p => p.id !== id);
  return true;
}

export async function getCmsSettings(): Promise<CMSSiteSettings> {
  const db = getFirestoreServer();
  try {
    const snap = await getDoc(doc(db, 'cmsSettings', 'global'));
    if (snap.exists()) memoryCmsSettings = snap.data() as CMSSiteSettings;
  } catch (err) {
    console.warn('Firestore getCmsSettings note:', err);
  }
  return memoryCmsSettings;
}

export async function saveCmsSettings(settings: CMSSiteSettings): Promise<CMSSiteSettings> {
  const db = getFirestoreServer();
  await setDoc(doc(db, 'cmsSettings', 'global'), settings, { merge: true });
  memoryCmsSettings = settings;
  return memoryCmsSettings;
}

// ==========================================
// TEST SERIES BUNDLES REPOSITORY
// ==========================================

export async function getAllBundles(options?: { publishedOnly?: boolean }): Promise<TestSeriesBundle[]> {
  const db = getFirestoreServer();
  try {
    const snap = await getDocs(collection(db, 'bundles'));
    const items: TestSeriesBundle[] = [];
    snap.forEach(d => items.push(d.data() as TestSeriesBundle));
    memoryBundles = items;
  } catch (err) {
    console.warn('Firestore getAllBundles note:', err);
  }

  if (options?.publishedOnly) {
    return memoryBundles.filter(b => b.isPublished !== false && !b.isDraft);
  }
  return memoryBundles;
}

export async function getBundleById(id: string): Promise<TestSeriesBundle | undefined> {
  const list = await getAllBundles();
  const clean = id.trim().toLowerCase();
  return list.find(b => b.id.toLowerCase() === clean || b.slug.toLowerCase() === clean);
}

export async function saveBundle(bundle: TestSeriesBundle): Promise<TestSeriesBundle> {
  const db = getFirestoreServer();
  await setDoc(doc(db, 'bundles', bundle.id), bundle, { merge: true });

  const idx = memoryBundles.findIndex(b => b.id === bundle.id || b.slug === bundle.slug);
  if (idx !== -1) memoryBundles[idx] = bundle;
  else memoryBundles.unshift(bundle);

  return bundle;
}

export async function deleteBundle(id: string): Promise<boolean> {
  const db = getFirestoreServer();
  await deleteDoc(doc(db, 'bundles', id));
  memoryBundles = memoryBundles.filter(b => b.id !== id && b.slug !== id);
  return true;
}

// ==========================================
// USER PERSONALIZATION & ENTITLEMENTS REPOSITORY
// ==========================================
const userBookmarksDb = new Map<string, any[]>();
const userMistakesDb = new Map<string, any[]>();
const userEntitlementsDb = new Map<string, {
  userId: string;
  hasActivePass: boolean;
  passType?: string;
  passExpiry?: string;
  credits: number;
  unlockedBundleIds: string[];
  redeemedCoupons: string[];
}>();

export async function getUserBookmarks(userId: string): Promise<any[]> {
  return userBookmarksDb.get(userId) || [];
}

export async function saveUserBookmarks(userId: string, bookmarks: any[]): Promise<any[]> {
  userBookmarksDb.set(userId, bookmarks);
  return bookmarks;
}

export async function getUserMistakes(userId: string): Promise<any[]> {
  return userMistakesDb.get(userId) || [];
}

export async function saveUserMistakes(userId: string, mistakes: any[]): Promise<any[]> {
  userMistakesDb.set(userId, mistakes);
  return mistakes;
}

export async function getUserEntitlements(userId: string) {
  let ent = userEntitlementsDb.get(userId);
  if (!ent) {
    ent = {
      userId,
      hasActivePass: false,
      credits: 50,
      unlockedBundleIds: [],
      redeemedCoupons: []
    };
    userEntitlementsDb.set(userId, ent);
  }
  return ent;
}

export async function redeemPassForUser(userId: string, couponCode: string, planId?: string) {
  const code = (couponCode || '').trim().toUpperCase();
  const ent = await getUserEntitlements(userId);

  if (ent.redeemedCoupons.includes(code)) {
    throw new Error('This coupon or pass code has already been redeemed by this account.');
  }

  const validPromoCodes: Record<string, { durationDays: number; creditsBonus: number; name: string }> = {
    'CGSSB100': { durationDays: 365, creditsBonus: 500, name: '1-Year State Exam Super Pass' },
    'TOPPER2026': { durationDays: 180, creditsBonus: 250, name: '6-Month Ranker Pass' },
    'FREETRIAL': { durationDays: 30, creditsBonus: 100, name: '30-Day Free Trial Pass' },
    'CGPSCPRO': { durationDays: 365, creditsBonus: 500, name: 'CGPSC + CGSSB Complete Pass' },
  };

  const promo = validPromoCodes[code] || (code.startsWith('PASS-') ? { durationDays: 365, creditsBonus: 300, name: 'Standard Pass Activation' } : null);

  if (!promo && !planId) {
    throw new Error('Invalid coupon or access code. Please verify and retry.');
  }

  const duration = promo ? promo.durationDays : 365;
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + duration);

  ent.hasActivePass = true;
  ent.passType = promo ? promo.name : (planId || 'Annual Pass');
  ent.passExpiry = expiryDate.toISOString();
  ent.credits += (promo ? promo.creditsBonus : 100);
  ent.redeemedCoupons.push(code || `PURCHASE-${Date.now()}`);

  userEntitlementsDb.set(userId, ent);
  return ent;
}

// ==========================================
// REAL-TIME LEADERBOARD AGGREGATOR
// ==========================================
export async function getTestLeaderboardData(testId: string) {
  const attempts = memoryCache.attempts.filter(a => a.testId === testId);
  const test = memoryCache.mockTests.find(t => t.id === testId);

  const userBestMap = new Map<string, TestAttempt>();
  attempts.forEach(att => {
    const existing = userBestMap.get(att.userId);
    if (!existing || att.score > existing.score || (att.score === existing.score && att.timeTakenSeconds < existing.timeTakenSeconds)) {
      userBestMap.set(att.userId, att);
    }
  });

  const rankedCandidates = Array.from(userBestMap.values()).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.timeTakenSeconds - b.timeTakenSeconds;
  });

  const totalParticipants = Math.max(rankedCandidates.length, test?.attemptsCount || 1);
  const scores = rankedCandidates.map(c => c.score);
  const avgScore = scores.length > 0 ? parseFloat((scores.reduce((s, x) => s + x, 0) / scores.length).toFixed(2)) : 0;
  const highestScore = scores.length > 0 ? Math.max(...scores) : (test ? test.questionCount * (test.marksPerQuestion || 1) : 100);

  const leaderboard = rankedCandidates.slice(0, 100).map((cand, idx) => {
    const rank = idx + 1;
    const percentile = parseFloat((((totalParticipants - rank + 1) / totalParticipants) * 100).toFixed(1));
    return {
      rank,
      userId: cand.userId,
      userName: cand.userName || `Aspirant #${rank}`,
      score: cand.score,
      maxScore: cand.maxScore,
      percentage: cand.percentage,
      accuracy: cand.accuracy,
      timeTakenSeconds: cand.timeTakenSeconds,
      submittedAt: cand.submittedAt,
      percentile: Math.min(99.9, Math.max(15.0, percentile)),
    };
  });

  return {
    testId,
    testTitle: test?.title || 'Mock Test',
    totalParticipants,
    avgScore,
    highestScore,
    leaderboard
  };
}

// ==========================================
// SERVER-DRIVEN REMOTE CONFIG REPOSITORY
// ==========================================

export async function getAppRemoteConfig(): Promise<AppRemoteConfig> {
  const db = getFirestoreServer();
  try {
    const snap = await getDoc(doc(db, 'remoteConfig', 'global'));
    if (snap.exists()) {
      const data = snap.data() as AppRemoteConfig;
      memoryRemoteConfig = {
        ...DEFAULT_REMOTE_CONFIG,
        ...data,
      };
    }
  } catch (err: any) {
    console.warn('RemoteConfig Firestore fetch note:', err?.message || err);
  }
  return memoryRemoteConfig;
}

export async function saveAppRemoteConfig(config: Partial<AppRemoteConfig>, updatedBy = 'Admin'): Promise<AppRemoteConfig> {
  const db = getFirestoreServer();
  memoryRemoteConfig = {
    ...memoryRemoteConfig,
    ...config,
    updatedAt: new Date().toISOString(),
    updatedBy,
  };

  await setDoc(doc(db, 'remoteConfig', 'global'), memoryRemoteConfig, { merge: true });
  return memoryRemoteConfig;
}

export async function resetAppRemoteConfig(): Promise<AppRemoteConfig> {
  memoryRemoteConfig = {
    ...DEFAULT_REMOTE_CONFIG,
    updatedAt: new Date().toISOString(),
    updatedBy: 'Admin Reset to Defaults',
  };
  return saveAppRemoteConfig(memoryRemoteConfig);
}

// ==========================================
// COMPLETE BACKUP EXPORTER
// ==========================================
export function exportCompleteDatabaseSnapshot() {
  return {
    version: '2.0.0',
    exportTimestamp: new Date().toISOString(),
    databaseId: dbConfig.databaseId,
    counts: {
      questions: memoryCache.questions.length,
      mockTests: memoryCache.mockTests.length,
      pypPapers: memoryCache.pypPapers.length,
      attempts: memoryCache.attempts.length,
      bundles: memoryBundles.length,
    },
    catalog: {
      questions: memoryCache.questions,
      mockTests: memoryCache.mockTests,
      pypPapers: memoryCache.pypPapers,
      attempts: memoryCache.attempts,
      bundles: memoryBundles,
    }
  };
}

// ==========================================
// DEMO DATA PURGE & RESTORE ENGINES
// ==========================================
export function isServerDemoDataPurged(): boolean {
  return memoryCache.demoDataPurged === true;
}

export async function purgeServerDemoData(purgeAll = true): Promise<{
  purgedQuestions: number;
  purgedTests: number;
  purgedPyp: number;
  purgedBundles: number;
  timestamp: string;
}> {
  const questionsCountBefore = memoryCache.questions.length;
  const testsCountBefore = memoryCache.mockTests.length;
  const pypCountBefore = memoryCache.pypPapers.length;
  const bundlesCountBefore = memoryBundles.length;

  memoryCache.questions = [];
  memoryCache.mockTests = [];
  memoryCache.pypPapers = [];
  memoryCache.attempts = [];
  memoryBundles = [];
  memoryCache.demoDataPurged = true;

  const db = getFirestoreServer();
  if (db) {
    try {
      const testSnap = await getDocs(collection(db, 'mockTests')).catch(() => null);
      if (testSnap) for (const d of testSnap.docs) await deleteDoc(d.ref).catch(() => null);

      const qSnap = await getDocs(collection(db, 'questions')).catch(() => null);
      if (qSnap) for (const d of qSnap.docs) await deleteDoc(d.ref).catch(() => null);

      const pSnap = await getDocs(collection(db, 'pypPapers')).catch(() => null);
      if (pSnap) for (const d of pSnap.docs) await deleteDoc(d.ref).catch(() => null);

      const bSnap = await getDocs(collection(db, 'bundles')).catch(() => null);
      if (bSnap) for (const d of bSnap.docs) await deleteDoc(d.ref).catch(() => null);
    } catch (err) {
      console.warn('Firestore purge warning in server:', err);
    }
  }

  return {
    purgedQuestions: questionsCountBefore,
    purgedTests: testsCountBefore,
    purgedPyp: pypCountBefore,
    purgedBundles: bundlesCountBefore,
    timestamp: new Date().toISOString(),
  };
}

export async function restoreServerDemoData(): Promise<{
  questions: number;
  mockTests: number;
  pypPapers: number;
  bundles: number;
}> {
  await syncWithFirestore();
  return {
    questions: memoryCache.questions.length,
    mockTests: memoryCache.mockTests.length,
    pypPapers: memoryCache.pypPapers.length,
    bundles: memoryBundles.length,
  };
}
