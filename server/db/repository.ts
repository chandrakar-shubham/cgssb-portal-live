import { doc, getDoc, getDocs, collection, setDoc, deleteDoc } from './firestoreAdapter.ts';
import { dbConfig, getFirestoreServer, canServerWriteFirestore } from './connection.ts';
import type {
  Question,
  MockTest,
  PreviousYearPaper,
  TestAttempt,
  AppRemoteConfig,
  User,
  DiscountCoupon
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

// ----------------- ADMIN IDENTITY / CRM REPOSITORIES -----------------

export async function getAllUsersAdmin(): Promise<User[]> {
  const db = getFirestoreServer();
  const snap = await getDocs(collection(db, 'users'));
  const list: User[] = [];
  snap.forEach(d => list.push({ ...(d.data() as User), id: d.id }));
  return list;
}

export async function saveUserAdmin(user: User): Promise<User> {
  const db = getFirestoreServer();
  const { id, ...userData } = user;
  await setDoc(doc(db, 'users', id), userData, { merge: true });
  return user;
}

export async function deleteUserAdmin(id: string): Promise<boolean> {
  const db = getFirestoreServer();
  await deleteDoc(doc(db, 'users', id));
  return true;
}

export async function getAllCouponsAdmin(): Promise<DiscountCoupon[]> {
  const db = getFirestoreServer();
  const snap = await getDocs(collection(db, 'discountCoupons'));
  const list: DiscountCoupon[] = [];
  snap.forEach(d => list.push({ ...(d.data() as DiscountCoupon), id: d.id }));
  return list;
}

export async function saveCouponAdmin(coupon: DiscountCoupon): Promise<DiscountCoupon> {
  const db = getFirestoreServer();
  await setDoc(doc(db, 'discountCoupons', coupon.id), coupon, { merge: true });
  return coupon;
}

export async function deleteCouponAdmin(id: string): Promise<boolean> {
  const db = getFirestoreServer();
  await deleteDoc(doc(db, 'discountCoupons', id));
  return true;
}

// ----------------- QUESTIONS COLLECTION REPOSITORY (/questions) -----------------

export async function getAllQuestions(filters?: { subject?: string; topic?: string; subtopic?: string; difficulty?: string; category?: string; search?: string; }): Promise<Question[]> {
  const db = getFirestoreServer();
  const snap = await getDocs(collection(db, 'questions'));
  let list: Question[] = [];
  snap.forEach(d => list.push(d.data() as Question));
  if (filters?.subject) list = list.filter(q => q.subject === filters.subject);
  if (filters?.topic) list = list.filter(q => q.topic === filters.topic);
  if (filters?.subtopic) list = list.filter(q => q.subtopic === filters.subtopic);
  if (filters?.difficulty) list = list.filter(q => q.difficulty === filters.difficulty);
  if (filters?.category && filters.category !== 'ALL') list = list.filter(q => q.category === filters.category);
  if (filters?.search) {
    const search = filters.search.toLowerCase();
    list = list.filter(q =>
      (q.questionText || q.question || '').toLowerCase().includes(search) ||
      (q.questionHindi && q.questionHindi.toLowerCase().includes(search)) ||
      (q.topic || '').toLowerCase().includes(search)
    );
  }
  return list;
}

export async function getQuestionById(id: string): Promise<Question | null> {
  const db = getFirestoreServer();
  const snap = await getDoc(doc(db, 'questions', id));
  return snap.exists ? (snap.data() as Question) : null;
}

export async function saveQuestion(q: Question): Promise<Question> {
  const db = getFirestoreServer();
  const qRef = doc(db, 'questions', q.id);
  await setDoc(qRef, q, { merge: true });
  return q;
}

export async function deleteQuestion(id: string): Promise<boolean> {
  const db = getFirestoreServer();
  await deleteDoc(doc(db, 'questions', id));
  return true;
}

export async function bulkUpsertQuestions(questionsList: Question[]): Promise<{ inserted: number; updated: number }> {
  let inserted = 0;
  let updated = 0;

  for (const q of questionsList) {
    const db = getFirestoreServer();
    const existing = await getDoc(doc(db, 'questions', q.id));
    const exists = existing.exists;
    if (exists) updated++;
    else inserted++;
    await saveQuestion(q);
  }
  return { inserted, updated };
}

// ----------------- MOCK TESTS COLLECTION REPOSITORY (/mockTests) -----------------

export async function getAllMockTests(filters?: { category?: string; publishedOnly?: boolean }): Promise<MockTest[]> {
  const db = getFirestoreServer();
  const snap = await getDocs(collection(db, 'mockTests'));
  let list: MockTest[] = [];
  snap.forEach(d => list.push(d.data() as MockTest));
  if (filters?.publishedOnly) list = list.filter(t => t.isPublished !== false);
  if (filters?.category && filters.category !== 'ALL') list = list.filter(t => t.category === filters.category);
  return list;
}

export async function getMockTestById(id: string): Promise<MockTest | null> {
  const db = getFirestoreServer();
  const snap = await getDoc(doc(db, 'mockTests', id));
  return snap.exists ? (snap.data() as MockTest) : null;
}

export async function saveMockTest(t: MockTest): Promise<MockTest> {
  const db = getFirestoreServer();
  await setDoc(doc(db, 'mockTests', t.id), t, { merge: true });
  return t;
}

export async function deleteMockTest(id: string): Promise<boolean> {
  const db = getFirestoreServer();
  await deleteDoc(doc(db, 'mockTests', id));
  return true;
}

// ----------------- PREVIOUS YEAR PAPERS COLLECTION REPOSITORY -----------------

export async function getAllPypPapers(category?: string): Promise<PreviousYearPaper[]> {
  const db = getFirestoreServer();
  const snap = await getDocs(collection(db, 'pypPapers'));
  let list: PreviousYearPaper[] = [];
  snap.forEach(d => list.push(d.data() as PreviousYearPaper));
  if (category) list = list.filter(p => p.examCategory === category);
  return list;
}

export async function savePypPaper(p: PreviousYearPaper): Promise<PreviousYearPaper> {
  const db = getFirestoreServer();
  await setDoc(doc(db, 'pypPapers', p.id), p, { merge: true });
  return p;
}

export async function deletePypPaper(id: string): Promise<boolean> {
  const db = getFirestoreServer();
  await deleteDoc(doc(db, 'pypPapers', id));
  return true;
}

// ----------------- ATTEMPTS COLLECTION REPOSITORY (/attempts) -----------------

export async function getAllTestAttempts(userId?: string): Promise<TestAttempt[]> {
  const db = getFirestoreServer();
  const snap = await getDocs(collection(db, 'attempts'));
  let list: TestAttempt[] = [];
  snap.forEach(d => list.push(d.data() as TestAttempt));
  if (userId) list = list.filter(a => a.userId === userId);
  return list;
}

export async function getTestAttemptById(id: string): Promise<TestAttempt | null> {
  const db = getFirestoreServer();
  const snap = await getDoc(doc(db, 'attempts', id));
  return snap.exists ? (snap.data() as TestAttempt) : null;
}

export async function saveTestAttempt(a: TestAttempt): Promise<TestAttempt> {
  const db = getFirestoreServer();
  await setDoc(doc(db, 'attempts', a.id), a, { merge: true });
  return a;
}

// ----------------- DATABASE COUNTS & METRICS -----------------

export async function getDatabaseCounts(): Promise<{ questions: number; mockTests: number; pypPapers: number; attempts: number; bundles: number }> {
  const db = getFirestoreServer();
  const [questions, mockTests, pypPapers, attempts, bundles] = await Promise.all([
    getDocs(collection(db, 'questions')),
    getDocs(collection(db, 'mockTests')),
    getDocs(collection(db, 'pypPapers')),
    getDocs(collection(db, 'attempts')),
    getDocs(collection(db, 'bundles')),
  ]);
  return {
    questions: questions.size,
    mockTests: mockTests.size,
    pypPapers: pypPapers.size,
    attempts: attempts.size,
    bundles: bundles.size,
  };
}


// Compatibility helpers: values are fetched from live Firestore; no stale runtime snapshot is exposed.
export async function getRepositoryStats() {
  const db = getFirestoreServer();
  const [questions, mockTests, pypPapers, attempts] = await Promise.all([
    getDocs(collection(db, 'questions')),
    getDocs(collection(db, 'mockTests')),
    getDocs(collection(db, 'pypPapers')),
    getDocs(collection(db, 'attempts')),
  ]);
  return {
    questions: questions.size,
    mockTests: mockTests.size,
    pypPapers: pypPapers.size,
    attempts: attempts.size,
  };
}

export async function getLocalSnapshot(): Promise<DatabaseShape> {
  const stats = await getRepositoryStats();
  return {
    questions: [],
    mockTests: [],
    pypPapers: [],
    attempts: [],
    demoDataPurged: false,
  };
}

// ----------------- NO-CODE CMS REPOSITORY -----------------

export async function getAllCmsPages(): Promise<CMSPage[]> {
  const db = getFirestoreServer();
  const snap = await getDocs(collection(db, 'pages'));
  const items: CMSPage[] = [];
  snap.forEach(d => items.push(d.data() as CMSPage));
  return items;
}

export async function getCmsPageBySlug(slug: string): Promise<CMSPage | null> {
  const list = await getAllCmsPages();
  return list.find(p => p.slug === slug) || null;
}

export async function saveCmsPage(page: CMSPage): Promise<CMSPage> {
  const db = getFirestoreServer();
  await setDoc(doc(db, 'pages', page.id), page, { merge: true });
  return page;
}

export async function deleteCmsPage(id: string): Promise<boolean> {
  const db = getFirestoreServer();
  await deleteDoc(doc(db, 'pages', id));
  return true;
}

export async function getAllCmsPosts(): Promise<CMSPost[]> {
  const db = getFirestoreServer();
  const snap = await getDocs(collection(db, 'posts'));
  const items: CMSPost[] = [];
  snap.forEach(d => items.push(d.data() as CMSPost));
  return items;
}

export async function getCmsPostBySlug(slug: string): Promise<CMSPost | null> {
  const list = await getAllCmsPosts();
  return list.find(p => p.slug === slug) || null;
}

export async function saveCmsPost(post: CMSPost): Promise<CMSPost> {
  const db = getFirestoreServer();
  await setDoc(doc(db, 'posts', post.id), post, { merge: true });
  return post;
}

export async function deleteCmsPost(id: string): Promise<boolean> {
  const db = getFirestoreServer();
  await deleteDoc(doc(db, 'posts', id));
  return true;
}

export async function getAllCmsSeriesPacks(): Promise<CMSTestSeriesPack[]> {
  const db = getFirestoreServer();
  const snap = await getDocs(collection(db, 'seriesPacks'));
  const items: CMSTestSeriesPack[] = [];
  snap.forEach(d => items.push(d.data() as CMSTestSeriesPack));
  return items;
}

export async function saveCmsSeriesPack(pack: CMSTestSeriesPack): Promise<CMSTestSeriesPack> {
  const db = getFirestoreServer();
  await setDoc(doc(db, 'seriesPacks', pack.id), pack, { merge: true });
  return pack;
}

export async function deleteCmsSeriesPack(id: string): Promise<boolean> {
  const db = getFirestoreServer();
  await deleteDoc(doc(db, 'seriesPacks', id));
  return true;
}

export async function getCmsSettings(): Promise<CMSSiteSettings> {
  const db = getFirestoreServer();
  const snap = await getDoc(doc(db, 'cmsSettings', 'global'));
  return snap.exists ? (snap.data() as CMSSiteSettings) : { ...INITIAL_CMS_SETTINGS };
}

export async function saveCmsSettings(settings: CMSSiteSettings): Promise<CMSSiteSettings> {
  const db = getFirestoreServer();
  await setDoc(doc(db, 'cmsSettings', 'global'), settings, { merge: true });
  return settings;
}

// ==========================================
// TEST SERIES BUNDLES REPOSITORY
// ==========================================

export async function getAllBundles(options?: { publishedOnly?: boolean }): Promise<TestSeriesBundle[]> {
  const db = getFirestoreServer();
  const snap = await getDocs(collection(db, 'bundles'));
  let list: TestSeriesBundle[] = [];
  snap.forEach(d => list.push(d.data() as TestSeriesBundle));
  if (options?.publishedOnly) list = list.filter(b => b.isPublished !== false && !b.isDraft);
  return list;
}

export async function getBundleById(id: string): Promise<TestSeriesBundle | undefined> {
  const list = await getAllBundles();
  const clean = id.trim().toLowerCase();
  return list.find(b => b.id.toLowerCase() === clean || b.slug.toLowerCase() === clean);
}

export async function saveBundle(bundle: TestSeriesBundle): Promise<TestSeriesBundle> {
  const db = getFirestoreServer();
  await setDoc(doc(db, 'bundles', bundle.id), bundle, { merge: true });
  return bundle;
}

export async function deleteBundle(id: string): Promise<boolean> {
  const db = getFirestoreServer();
  await deleteDoc(doc(db, 'bundles', id));
  return true;
}

// ==========================================
// USER PERSONALIZATION & ENTITLEMENTS REPOSITORY
// ==========================================
// ==========================================
// USER PERSONALIZATION & ENTITLEMENTS REPOSITORY
// ==========================================
// Firestore is the sole persistent source of truth for user-specific state.
// In-memory state is intentionally not used for bookmarks, mistakes, or entitlements.

export async function getUserBookmarks(userId: string): Promise<any[]> {
  if (!userId) throw new Error('userId is required');
  const db = getFirestoreServer();
  const snap = await getDoc(doc(db, 'userBookmarks', userId));
  if (!snap.exists) return [];
  const data = snap.data() as { bookmarks?: any[] };
  return Array.isArray(data.bookmarks) ? data.bookmarks : [];
}

export async function saveUserBookmarks(userId: string, bookmarks: any[]): Promise<any[]> {
  if (!userId) throw new Error('userId is required');
  const db = getFirestoreServer();
  const normalized = Array.isArray(bookmarks) ? bookmarks : [];
  await setDoc(doc(db, 'userBookmarks', userId), { userId, bookmarks: normalized, updatedAt: new Date().toISOString() }, { merge: true });
  return normalized;
}

export async function getUserMistakes(userId: string): Promise<any[]> {
  if (!userId) throw new Error('userId is required');
  const db = getFirestoreServer();
  const snap = await getDoc(doc(db, 'userMistakes', userId));
  if (!snap.exists) return [];
  const data = snap.data() as { mistakes?: any[] };
  return Array.isArray(data.mistakes) ? data.mistakes : [];
}

export async function saveUserMistakes(userId: string, mistakes: any[]): Promise<any[]> {
  if (!userId) throw new Error('userId is required');
  const db = getFirestoreServer();
  const normalized = Array.isArray(mistakes) ? mistakes : [];
  await setDoc(doc(db, 'userMistakes', userId), { userId, mistakes: normalized, updatedAt: new Date().toISOString() }, { merge: true });
  return normalized;
}

export async function getUserEntitlements(userId: string) {
  if (!userId) throw new Error('userId is required');
  const db = getFirestoreServer();
  const snap = await getDoc(doc(db, 'userEntitlements', userId));
  if (snap.exists) return snap.data();
  const ent = { userId, hasActivePass: false, credits: 50, unlockedBundleIds: [], redeemedCoupons: [] };
  await setDoc(doc(db, 'userEntitlements', userId), ent, { merge: false });
  return ent;
}

export async function redeemPassForUser(userId: string, couponCode: string, planId?: string) {
  const code = (couponCode || '').trim().toUpperCase();
  const ent = await getUserEntitlements(userId) as any;
  if (ent.redeemedCoupons.includes(code)) throw new Error('This coupon or pass code has already been redeemed by this account.');
  const validPromoCodes: Record<string, { durationDays: number; creditsBonus: number; name: string }> = {
    'CGSSB100': { durationDays: 365, creditsBonus: 500, name: '1-Year State Exam Super Pass' },
    'TOPPER2026': { durationDays: 180, creditsBonus: 250, name: '6-Month Ranker Pass' },
    'FREETRIAL': { durationDays: 30, creditsBonus: 100, name: '30-Day Free Trial Pass' },
    'CGPSCPRO': { durationDays: 365, creditsBonus: 500, name: 'CGPSC + CGSSB Complete Pass' },
  };
  const promo = validPromoCodes[code] || (code.startsWith('PASS-') ? { durationDays: 365, creditsBonus: 300, name: 'Standard Pass Activation' } : null);
  if (!promo && !planId) throw new Error('Invalid coupon or access code. Please verify and retry.');
  const duration = promo ? promo.durationDays : 365;
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + duration);
  const updated = {
    ...ent,
    hasActivePass: true,
    passType: promo ? promo.name : (planId || 'Annual Pass'),
    passExpiry: expiryDate.toISOString(),
    credits: ent.credits + (promo ? promo.creditsBonus : 100),
    redeemedCoupons: [...ent.redeemedCoupons, code || ('PURCHASE-' + Date.now())],
    updatedAt: new Date().toISOString(),
  };
  const db = getFirestoreServer();
  await setDoc(doc(db, 'userEntitlements', userId), updated, { merge: true });
  return updated;
}

// ==========================================
// REAL-TIME LEADERBOARD AGGREGATOR
// ==========================================
export async function getTestLeaderboardData(testId: string) {
  // Always build leaderboard from live Firestore data; never from a stale process cache.
  const [attempts, test] = await Promise.all([getAllTestAttempts(), getMockTestById(testId)]);
  const filteredAttempts = attempts.filter(a => a.testId === testId);
  const userBestMap = new Map<string, TestAttempt>();
  filteredAttempts.forEach(att => {
    const existing = userBestMap.get(att.userId);
    if (!existing || att.score > existing.score || (att.score === existing.score && att.timeTakenSeconds < existing.timeTakenSeconds)) userBestMap.set(att.userId, att);
  });
  const rankedCandidates = Array.from(userBestMap.values()).sort((a, b) => b.score !== a.score ? b.score - a.score : a.timeTakenSeconds - b.timeTakenSeconds);
  const totalParticipants = Math.max(rankedCandidates.length, test?.attemptsCount || 1);
  const scores = rankedCandidates.map(c => c.score);
  const avgScore = scores.length > 0 ? parseFloat((scores.reduce((sum, x) => sum + x, 0) / scores.length).toFixed(2)) : 0;
  const highestScore = scores.length > 0 ? Math.max(...scores) : (test ? test.questionCount * (test.marksPerQuestion || 1) : 100);
  const leaderboard = rankedCandidates.slice(0, 100).map((cand, idx) => {
    const rank = idx + 1;
    const percentile = parseFloat((((totalParticipants - rank + 1) / totalParticipants) * 100).toFixed(1));
    return { rank, userId: cand.userId, userName: cand.userName || ('Aspirant #' + rank), score: cand.score, maxScore: cand.maxScore, percentage: cand.percentage, accuracy: cand.accuracy, timeTakenSeconds: cand.timeTakenSeconds, submittedAt: cand.submittedAt, percentile: Math.min(99.9, Math.max(15.0, percentile)) };
  });
  return { testId, testTitle: test?.title || 'Mock Test', totalParticipants, avgScore, highestScore, leaderboard };
}
// ==========================================
// SERVER-DRIVEN REMOTE CONFIG REPOSITORY
// ==========================================

export async function getAppRemoteConfig(): Promise<AppRemoteConfig> {
  const db = getFirestoreServer();
  const snap = await getDoc(doc(db, 'remoteConfig', 'global'));
  if (!snap.exists) return { ...DEFAULT_REMOTE_CONFIG };
  return {
    ...DEFAULT_REMOTE_CONFIG,
    ...(snap.data() as AppRemoteConfig),
  };
}

export async function saveAppRemoteConfig(config: Partial<AppRemoteConfig>, updatedBy = 'Admin'): Promise<AppRemoteConfig> {
  const db = getFirestoreServer();
  const current = await getAppRemoteConfig();
  const updated: AppRemoteConfig = {
    ...current,
    ...config,
    updatedAt: new Date().toISOString(),
    updatedBy,
  };
  await setDoc(doc(db, 'remoteConfig', 'global'), updated, { merge: true });
  return updated;
}

export async function resetAppRemoteConfig(): Promise<AppRemoteConfig> {
  return saveAppRemoteConfig({
    ...DEFAULT_REMOTE_CONFIG,
    updatedAt: new Date().toISOString(),
    updatedBy: 'Admin Reset to Defaults',
  });
}

// ==========================================
// COMPLETE BACKUP EXPORTER
// ==========================================
export async function exportCompleteDatabaseSnapshot() {
  const db = getFirestoreServer();
  const [questionsSnap, testsSnap, pypSnap, attemptsSnap, bundlesSnap] = await Promise.all([
    getDocs(collection(db, 'questions')),
    getDocs(collection(db, 'mockTests')),
    getDocs(collection(db, 'pypPapers')),
    getDocs(collection(db, 'attempts')),
    getDocs(collection(db, 'bundles')),
  ]);
  const catalog = {
    questions: questionsSnap.docs.map(d => d.data() as Question),
    mockTests: testsSnap.docs.map(d => d.data() as MockTest),
    pypPapers: pypSnap.docs.map(d => d.data() as PreviousYearPaper),
    attempts: attemptsSnap.docs.map(d => d.data() as TestAttempt),
    bundles: bundlesSnap.docs.map(d => d.data() as TestSeriesBundle),
  };
  return {
    version: '2.0.0',
    exportTimestamp: new Date().toISOString(),
    databaseId: dbConfig.databaseId,
    counts: {
      questions: catalog.questions.length,
      mockTests: catalog.mockTests.length,
      pypPapers: catalog.pypPapers.length,
      attempts: catalog.attempts.length,
      bundles: catalog.bundles.length,
    },
    catalog,
  };
}

export function isServerDemoDataPurged(): boolean {
  return false;
}

// ==========================================
// DEMO DATA PURGE & RESTORE ENGINES
// ==========================================
export async function purgeServerDemoData(purgeAll = true): Promise<{
  purgedQuestions: number;
  purgedTests: number;
  purgedPyp: number;
  purgedBundles: number;
  timestamp: string;
}> {
  const db = getFirestoreServer();
  const collections = ['mockTests', 'questions', 'pypPapers', 'bundles'];
  const before = await Promise.all(collections.map(async name => (await getDocs(collection(db, name))).size));
  for (const name of collections) {
    const snap = await getDocs(collection(db, name));
    for (const d of snap.docs) await deleteDoc(d.ref);
  }
  return {
    purgedQuestions: before[1],
    purgedTests: before[0],
    purgedPyp: before[2],
    purgedBundles: before[3],
    timestamp: new Date().toISOString(),
  };
}

export async function restoreServerDemoData(): Promise<{
  questions: number;
  mockTests: number;
  pypPapers: number;
  bundles: number;
}> {
  const [questions, mockTests, pypPapers, bundles] = await Promise.all([
    getDocs(collection(getFirestoreServer(), 'questions')),
    getDocs(collection(getFirestoreServer(), 'mockTests')),
    getDocs(collection(getFirestoreServer(), 'pypPapers')),
    getDocs(collection(getFirestoreServer(), 'bundles')),
  ]);
  return {
    questions: questions.size,
    mockTests: mockTests.size,
    pypPapers: pypPapers.size,
    bundles: bundles.size,
  };
}
