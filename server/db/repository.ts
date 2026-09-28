import fs from 'fs';
import path from 'path';
import { doc, getDocs, collection, setDoc, deleteDoc } from 'firebase/firestore';
import { dbConfig, isFirestoreActive, getFirestoreServer, canServerWriteFirestore } from './connection.ts';
import type {
  Question,
  MockTest,
  PreviousYearPaper,
  TestAttempt,
  ExamCategory,
  SectorAnalysis
} from '../../src/types.ts';
import {
  INITIAL_QUESTIONS,
  INITIAL_MOCK_TESTS,
  INITIAL_PYP_PAPERS,
  SAMPLE_USER_ATTEMPTS
} from '../../src/mockData.ts';
import {
  TestSeriesBundle,
  OFFICIAL_BUNDLES_CATALOG
} from '../../src/data/bundleCatalog.ts';

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'cgssb-db.json');

export interface DatabaseShape {
  questions: Question[];
  mockTests: MockTest[];
  pypPapers: PreviousYearPaper[];
  attempts: TestAttempt[];
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadLocalJsonDb(): DatabaseShape {
  ensureDataDir();
  const mergeById = <T extends { id: string }>(initial: T[], saved?: T[]): T[] => {
    const map = new Map<string, T>();
    initial.forEach(item => { if (item && item.id) map.set(item.id, item); });
    if (Array.isArray(saved)) {
      saved.forEach(item => { if (item && item.id) map.set(item.id, item); });
    }
    return Array.from(map.values());
  };

  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        questions: mergeById(INITIAL_QUESTIONS, parsed.questions),
        mockTests: mergeById(INITIAL_MOCK_TESTS, parsed.mockTests),
        pypPapers: mergeById(INITIAL_PYP_PAPERS, parsed.pypPapers),
        attempts: Array.isArray(parsed.attempts) ? parsed.attempts : [...SAMPLE_USER_ATTEMPTS],
      };
    }
  } catch (err) {
    console.warn('⚠️ Failed to load local JSON DB, using initial seeds:', err);
  }
  return {
    questions: [...INITIAL_QUESTIONS],
    mockTests: [...INITIAL_MOCK_TESTS],
    pypPapers: [...INITIAL_PYP_PAPERS],
    attempts: [...SAMPLE_USER_ATTEMPTS],
  };
}

let localDb: DatabaseShape = loadLocalJsonDb();

export function saveLocalJsonDb(immediate = false) {
  try {
    ensureDataDir();
    fs.writeFileSync(DB_FILE, JSON.stringify(localDb, null, 2), 'utf-8');
  } catch (err) {
    console.error('❌ Failed to save persistent database snapshot:', err);
  }
}

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
    return {
      syncedQuestions: localDb.questions.length,
      syncedTests: localDb.mockTests.length,
      syncedAttempts: localDb.attempts.length,
    };
  }

  try {
    // 1. Fetch live questions from Cloud Firestore
    const qSnap = await getDocs(collection(db, 'questions'));
    if (!qSnap.empty) {
      const firestoreQuestions: Question[] = [];
      qSnap.forEach(d => {
        firestoreQuestions.push(d.data() as Question);
      });
      const qMap = new Map<string, Question>();
      localDb.questions.forEach(q => qMap.set(q.id, q));
      firestoreQuestions.forEach(q => qMap.set(q.id, q));
      localDb.questions = Array.from(qMap.values());
    } else if (canServerWriteFirestore()) {
      // Auto-seed initial questions to Firestore only if server has authenticated write credentials
      for (const q of localDb.questions.slice(0, 50)) {
        await setDoc(doc(db, 'questions', q.id), q, { merge: true }).catch(() => null);
      }
    }

    // 2. Fetch live mock tests from Cloud Firestore
    const tSnap = await getDocs(collection(db, 'mockTests'));
    if (!tSnap.empty) {
      const firestoreTests: MockTest[] = [];
      tSnap.forEach(d => {
        firestoreTests.push(d.data() as MockTest);
      });
      const tMap = new Map<string, MockTest>();
      localDb.mockTests.forEach(t => tMap.set(t.id, t));
      firestoreTests.forEach(t => tMap.set(t.id, t));
      localDb.mockTests = Array.from(tMap.values());
    } else if (canServerWriteFirestore()) {
      for (const t of localDb.mockTests) {
        await setDoc(doc(db, 'mockTests', t.id), t, { merge: true }).catch(() => null);
      }
    }

    // 3. Fetch live attempts
    const aSnap = await getDocs(collection(db, 'attempts'));
    if (!aSnap.empty) {
      const firestoreAttempts: TestAttempt[] = [];
      aSnap.forEach(d => {
        firestoreAttempts.push(d.data() as TestAttempt);
      });
      const aMap = new Map<string, TestAttempt>();
      localDb.attempts.forEach(a => aMap.set(a.id, a));
      firestoreAttempts.forEach(a => aMap.set(a.id, a));
      localDb.attempts = Array.from(aMap.values());
    }

    saveLocalJsonDb();
  } catch (err) {
    console.warn('⚠️ Cloud Firestore sync warning on startup:', err);
  }

  return {
    syncedQuestions: localDb.questions.length,
    syncedTests: localDb.mockTests.length,
    syncedAttempts: localDb.attempts.length,
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
  let filtered = [...localDb.questions];
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
  return localDb.questions.find(q => q.id === id) || null;
}

export async function saveQuestion(q: Question): Promise<Question> {
  const idx = localDb.questions.findIndex(x => x.id === q.id);
  if (idx !== -1) {
    localDb.questions[idx] = q;
  } else {
    localDb.questions.unshift(q);
  }
  saveLocalJsonDb();

  // Dual-write to Cloud Firestore only if server possesses authenticated write credentials
  if (canServerWriteFirestore()) {
    const db = getFirestoreServer();
    if (db && q.id) {
      try {
        await setDoc(doc(db, 'questions', q.id), q, { merge: true });
      } catch (err) {
        console.warn(`Firestore sync note for question [${q.id}]:`, err);
      }
    }
  }
  return q;
}

export async function deleteQuestion(id: string): Promise<boolean> {
  const before = localDb.questions.length;
  localDb.questions = localDb.questions.filter(q => q.id !== id);
  saveLocalJsonDb();

  if (canServerWriteFirestore()) {
    const db = getFirestoreServer();
    if (db) {
      try {
        await deleteDoc(doc(db, 'questions', id));
      } catch (err) {
        console.warn(`Firestore delete note for question [${id}]:`, err);
      }
    }
  }
  return before !== localDb.questions.length;
}

export async function bulkUpsertQuestions(questionsList: Question[]): Promise<{ inserted: number; updated: number }> {
  let inserted = 0;
  let updated = 0;

  for (const q of questionsList) {
    const exists = localDb.questions.some(x => x.id === q.id || (q.uniqueQuestionId && x.uniqueQuestionId === q.uniqueQuestionId));
    if (exists) updated++;
    else inserted++;
    await saveQuestion(q);
  }
  return { inserted, updated };
}

// ----------------- MOCK TESTS COLLECTION REPOSITORY (/mockTests) -----------------

export async function getAllMockTests(filters?: { category?: string; publishedOnly?: boolean }): Promise<MockTest[]> {
  let list = [...localDb.mockTests];
  if (filters?.publishedOnly) {
    list = list.filter(t => t.isPublished !== false);
  }
  if (filters?.category && filters.category !== 'ALL') {
    list = list.filter(t => t.category === filters.category);
  }
  return list;
}

export async function getMockTestById(id: string): Promise<MockTest | null> {
  return localDb.mockTests.find(t => t.id === id) || null;
}

export async function saveMockTest(t: MockTest): Promise<MockTest> {
  const idx = localDb.mockTests.findIndex(x => x.id === t.id);
  if (idx !== -1) {
    localDb.mockTests[idx] = t;
  } else {
    localDb.mockTests.unshift(t);
  }
  saveLocalJsonDb();

  if (canServerWriteFirestore()) {
    const db = getFirestoreServer();
    if (db && t.id) {
      try {
        await setDoc(doc(db, 'mockTests', t.id), t, { merge: true });
      } catch (err) {
        console.warn(`Firestore sync note for mock test [${t.id}]:`, err);
      }
    }
  }
  return t;
}

export async function deleteMockTest(id: string): Promise<boolean> {
  const before = localDb.mockTests.length;
  localDb.mockTests = localDb.mockTests.filter(t => t.id !== id);
  saveLocalJsonDb();

  if (canServerWriteFirestore()) {
    const db = getFirestoreServer();
    if (db) {
      try {
        await deleteDoc(doc(db, 'mockTests', id));
      } catch (err) {
        console.warn(`Firestore delete note for test [${id}]:`, err);
      }
    }
  }
  return before !== localDb.mockTests.length;
}

// ----------------- PREVIOUS YEAR PAPERS COLLECTION REPOSITORY -----------------

export async function getAllPypPapers(category?: string): Promise<PreviousYearPaper[]> {
  let list = [...localDb.pypPapers];
  if (category) {
    list = list.filter(p => p.examCategory === category);
  }
  return list;
}

export async function savePypPaper(p: PreviousYearPaper): Promise<PreviousYearPaper> {
  const idx = localDb.pypPapers.findIndex(x => x.id === p.id);
  if (idx !== -1) {
    localDb.pypPapers[idx] = p;
  } else {
    localDb.pypPapers.unshift(p);
  }
  saveLocalJsonDb();

  if (canServerWriteFirestore()) {
    const db = getFirestoreServer();
    if (db && p.id) {
      try {
        await setDoc(doc(db, 'pypPapers', p.id), p, { merge: true });
      } catch (err) {
        console.warn(`Firestore sync note for PYP [${p.id}]:`, err);
      }
    }
  }
  return p;
}

// ----------------- ATTEMPTS COLLECTION REPOSITORY (/attempts) -----------------

export async function getAllTestAttempts(userId?: string): Promise<TestAttempt[]> {
  let list = [...localDb.attempts];
  if (userId) {
    list = list.filter(a => a.userId === userId);
  }
  return list;
}

export async function getTestAttemptById(id: string): Promise<TestAttempt | null> {
  return localDb.attempts.find(a => a.id === id) || null;
}

export async function saveTestAttempt(a: TestAttempt): Promise<TestAttempt> {
  localDb.attempts.unshift(a);
  saveLocalJsonDb();

  if (canServerWriteFirestore()) {
    const db = getFirestoreServer();
    if (db && a.id) {
      try {
        await setDoc(doc(db, 'attempts', a.id), a, { merge: true });
      } catch (err) {
        console.warn(`Firestore sync note for attempt [${a.id}]:`, err);
      }
    }
  }
  return a;
}

// ----------------- DATABASE COUNTS & METRICS -----------------

export async function getDatabaseCounts(): Promise<{ questions: number; mockTests: number; pypPapers: number; attempts: number }> {
  return {
    questions: localDb.questions.length,
    mockTests: localDb.mockTests.length,
    pypPapers: localDb.pypPapers.length,
    attempts: localDb.attempts.length,
  };
}

export function getLocalSnapshot(): DatabaseShape {
  return localDb;
}

// ----------------- NO-CODE CMS REPOSITORY -----------------

import type { CMSPage, CMSPost, CMSTestSeriesPack, CMSSiteSettings } from '../../src/types/cms.ts';
import {
  INITIAL_CMS_SETTINGS,
  INITIAL_CMS_PAGES,
  INITIAL_CMS_POSTS,
  INITIAL_CMS_SERIES_PACKS
} from '../../src/defaultCmsData.ts';

let cmsPagesDb: CMSPage[] = [...INITIAL_CMS_PAGES];
let cmsPostsDb: CMSPost[] = [...INITIAL_CMS_POSTS];
let cmsSeriesDb: CMSTestSeriesPack[] = [...INITIAL_CMS_SERIES_PACKS];
let cmsSettingsDb: CMSSiteSettings = { ...INITIAL_CMS_SETTINGS };

export async function getAllCmsPages(): Promise<CMSPage[]> {
  return cmsPagesDb;
}

export async function getCmsPageBySlug(slug: string): Promise<CMSPage | null> {
  return cmsPagesDb.find(p => p.slug === slug) || null;
}

export async function saveCmsPage(page: CMSPage): Promise<CMSPage> {
  const idx = cmsPagesDb.findIndex(p => p.id === page.id);
  if (idx !== -1) cmsPagesDb[idx] = page;
  else cmsPagesDb.unshift(page);
  return page;
}

export async function deleteCmsPage(id: string): Promise<boolean> {
  const before = cmsPagesDb.length;
  cmsPagesDb = cmsPagesDb.filter(p => p.id !== id);
  return before !== cmsPagesDb.length;
}

export async function getAllCmsPosts(): Promise<CMSPost[]> {
  return cmsPostsDb;
}

export async function getCmsPostBySlug(slug: string): Promise<CMSPost | null> {
  return cmsPostsDb.find(p => p.slug === slug) || null;
}

export async function saveCmsPost(post: CMSPost): Promise<CMSPost> {
  const idx = cmsPostsDb.findIndex(p => p.id === post.id);
  if (idx !== -1) cmsPostsDb[idx] = post;
  else cmsPostsDb.unshift(post);
  return post;
}

export async function deleteCmsPost(id: string): Promise<boolean> {
  const before = cmsPostsDb.length;
  cmsPostsDb = cmsPostsDb.filter(p => p.id !== id);
  return before !== cmsPostsDb.length;
}

export async function getAllCmsSeriesPacks(): Promise<CMSTestSeriesPack[]> {
  return cmsSeriesDb;
}

export async function saveCmsSeriesPack(pack: CMSTestSeriesPack): Promise<CMSTestSeriesPack> {
  const idx = cmsSeriesDb.findIndex(p => p.id === pack.id);
  if (idx !== -1) cmsSeriesDb[idx] = pack;
  else cmsSeriesDb.unshift(pack);
  return pack;
}

export async function deleteCmsSeriesPack(id: string): Promise<boolean> {
  const before = cmsSeriesDb.length;
  cmsSeriesDb = cmsSeriesDb.filter(p => p.id !== id);
  return before !== cmsSeriesDb.length;
}

export async function getCmsSettings(): Promise<CMSSiteSettings> {
  return cmsSettingsDb;
}

export async function saveCmsSettings(settings: CMSSiteSettings): Promise<CMSSiteSettings> {
  cmsSettingsDb = settings;
  return cmsSettingsDb;
}

// ==========================================
// TEST SERIES BUNDLES REPOSITORY
// ==========================================
let localBundles: TestSeriesBundle[] = [...OFFICIAL_BUNDLES_CATALOG];

export async function getAllBundles(options?: { publishedOnly?: boolean }): Promise<TestSeriesBundle[]> {
  const db = getFirestoreServer();
  if (db) {
    try {
      const snap = await getDocs(collection(db, 'bundles'));
      if (!snap.empty) {
        const firestoreMap = new Map<string, TestSeriesBundle>();
        OFFICIAL_BUNDLES_CATALOG.forEach(b => { if (b && b.id) firestoreMap.set(b.id, { ...b }); });
        
        snap.forEach(d => {
          const incoming = d.data() as TestSeriesBundle;
          if (incoming && incoming.id) {
            const base = firestoreMap.get(incoming.id) || incoming;
            const testItemMap = new Map<string, any>();
            (base.testItems || []).forEach(t => testItemMap.set(t.id, t));
            (incoming.testItems || []).forEach(t => testItemMap.set(t.id, t));

            firestoreMap.set(incoming.id, {
              ...base,
              ...incoming,
              testItems: Array.from(testItemMap.values()),
              chapterTests: incoming.chapterTests?.length ? incoming.chapterTests : base.chapterTests,
              pypTests: incoming.pypTests?.length ? incoming.pypTests : base.pypTests,
            });
          }
        });
        localBundles = Array.from(firestoreMap.values());
      }
    } catch (err) {
      console.warn('⚠️ Server failed to fetch bundles from Firestore:', err);
    }
  }

  if (options?.publishedOnly) {
    return localBundles.filter(b => b.isPublished !== false && !b.isDraft);
  }
  return localBundles;
}

export async function getBundleById(id: string): Promise<TestSeriesBundle | undefined> {
  const list = await getAllBundles();
  const clean = id.trim().toLowerCase();
  return list.find(b => b.id.toLowerCase() === clean || b.slug.toLowerCase() === clean);
}

export async function saveBundle(bundle: TestSeriesBundle): Promise<TestSeriesBundle> {
  const idx = localBundles.findIndex(b => b.id === bundle.id || b.slug === bundle.slug);
  if (idx !== -1) {
    localBundles[idx] = bundle;
  } else {
    localBundles.unshift(bundle);
  }

  if (canServerWriteFirestore()) {
    const db = getFirestoreServer();
    if (db) {
      try {
        await setDoc(doc(db, 'bundles', bundle.id), bundle, { merge: true });
      } catch (err) {
        console.warn('⚠️ Server failed to save bundle to Firestore:', err);
      }
    }
  }
  return bundle;
}

export async function deleteBundle(id: string): Promise<boolean> {
  const before = localBundles.length;
  localBundles = localBundles.filter(b => b.id !== id && b.slug !== id);

  if (canServerWriteFirestore()) {
    const db = getFirestoreServer();
    if (db) {
      try {
        await deleteDoc(doc(db, 'bundles', id));
      } catch (err) {
        console.warn('⚠️ Server failed to delete bundle from Firestore:', err);
      }
    }
  }
  return before !== localBundles.length;
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
  const attempts = localDb.attempts.filter(a => a.testId === testId);
  const test = localDb.mockTests.find(t => t.id === testId);

  // Group by user and take highest score per candidate
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
import { DEFAULT_REMOTE_CONFIG, AppRemoteConfig } from '../../src/types.ts';

let appRemoteConfigDb: AppRemoteConfig = { ...DEFAULT_REMOTE_CONFIG };

export async function getAppRemoteConfig(): Promise<AppRemoteConfig> {
  const db = getFirestoreServer();
  if (db) {
    try {
      const snap = await getDocs(collection(db, 'remoteConfig'));
      if (!snap.empty) {
        const first = snap.docs[0].data() as AppRemoteConfig;
        if (first && first.featureFlags) {
          appRemoteConfigDb = {
            ...DEFAULT_REMOTE_CONFIG,
            ...first,
            featureFlags: { ...DEFAULT_REMOTE_CONFIG.featureFlags, ...(first.featureFlags || {}) },
            maintenanceMode: { ...DEFAULT_REMOTE_CONFIG.maintenanceMode, ...(first.maintenanceMode || {}) },
            globalAlertBanner: { ...DEFAULT_REMOTE_CONFIG.globalAlertBanner, ...(first.globalAlertBanner || {}) },
            examEngineRules: { ...DEFAULT_REMOTE_CONFIG.examEngineRules, ...(first.examEngineRules || {}) },
            pricingConfig: { ...DEFAULT_REMOTE_CONFIG.pricingConfig, ...(first.pricingConfig || {}) },
            brandingConfig: { ...DEFAULT_REMOTE_CONFIG.brandingConfig, ...(first.brandingConfig || {}) },
          };
        }
      }
    } catch (err: any) {
      // Graceful fallback to cached/default configuration
      if (!err.message?.includes('Missing or insufficient permissions')) {
        console.warn('RemoteConfig Firestore fetch note:', err.message);
      }
    }
  }
  return appRemoteConfigDb;
}

export async function saveAppRemoteConfig(config: Partial<AppRemoteConfig>, updatedBy = 'Admin'): Promise<AppRemoteConfig> {
  appRemoteConfigDb = {
    ...appRemoteConfigDb,
    ...config,
    featureFlags: { ...appRemoteConfigDb.featureFlags, ...(config.featureFlags || {}) },
    maintenanceMode: { ...appRemoteConfigDb.maintenanceMode, ...(config.maintenanceMode || {}) },
    globalAlertBanner: { ...appRemoteConfigDb.globalAlertBanner, ...(config.globalAlertBanner || {}) },
    examEngineRules: { ...appRemoteConfigDb.examEngineRules, ...(config.examEngineRules || {}) },
    pricingConfig: { ...appRemoteConfigDb.pricingConfig, ...(config.pricingConfig || {}) },
    brandingConfig: { ...appRemoteConfigDb.brandingConfig, ...(config.brandingConfig || {}) },
    updatedAt: new Date().toISOString(),
    updatedBy,
  };

  if (canServerWriteFirestore()) {
    const db = getFirestoreServer();
    if (db) {
      try {
        await setDoc(doc(db, 'remoteConfig', 'global_app_config'), appRemoteConfigDb, { merge: true });
      } catch (err: any) {
        console.warn('RemoteConfig Firestore save note:', err.message);
      }
    }
  }

  return appRemoteConfigDb;
}

export async function resetAppRemoteConfig(): Promise<AppRemoteConfig> {
  appRemoteConfigDb = {
    ...DEFAULT_REMOTE_CONFIG,
    updatedAt: new Date().toISOString(),
    updatedBy: 'Admin Reset to Defaults',
  };
  return saveAppRemoteConfig(appRemoteConfigDb);
}

// ==========================================
// COMPLETE BACKUP EXPORTER
// ==========================================
export function exportCompleteDatabaseSnapshot() {
  return {
    version: '1.4.0',
    exportTimestamp: new Date().toISOString(),
    databaseId: dbConfig.databaseId,
    counts: {
      questions: localDb.questions.length,
      mockTests: localDb.mockTests.length,
      pypPapers: localDb.pypPapers.length,
      attempts: localDb.attempts.length,
      bundles: localBundles.length,
    },
    catalog: {
      questions: localDb.questions,
      mockTests: localDb.mockTests,
      pypPapers: localDb.pypPapers,
      attempts: localDb.attempts,
      bundles: localBundles,
    }
  };
}


