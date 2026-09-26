import fs from 'fs';
import path from 'path';
import { dbConfig, isFirestoreActive } from './connection.ts';
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
  return q;
}

export async function deleteQuestion(id: string): Promise<boolean> {
  const before = localDb.questions.length;
  localDb.questions = localDb.questions.filter(q => q.id !== id);
  saveLocalJsonDb();
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
  return t;
}

export async function deleteMockTest(id: string): Promise<boolean> {
  const before = localDb.mockTests.length;
  localDb.mockTests = localDb.mockTests.filter(t => t.id !== id);
  saveLocalJsonDb();
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
