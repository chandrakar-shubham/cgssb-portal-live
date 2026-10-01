import { collection, doc, getDocs, getDoc, setDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from './config';
import { TestSeriesBundle } from '../data/bundleCatalog';

export type CatalogStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface ExamAuthority {
  id: string; name: string; shortName: string; slug: string;
  description?: string; logoUrl?: string; status: CatalogStatus;
  sortOrder: number; createdAt: string; updatedAt: string;
}
export interface ExamProgram {
  id: string; authorityId: string; name: string; nameHindi?: string; slug: string;
  year: number; programType: 'recruitment' | 'examination'; description?: string;
  status: CatalogStatus; hasPosts: boolean; sortOrder: number;
  createdAt: string; updatedAt: string;
}
export interface ExamPost {
  id: string; programId: string; name: string; nameHindi?: string; slug: string;
  shortName?: string; description?: string; status: CatalogStatus;
  sortOrder: number; createdAt: string; updatedAt: string;
}
export type TestSeriesType = 'full_mock' | 'chapter_test' | 'subject_test' | 'pyp' | 'live_test' | 'practice' | 'mixed';
export interface ExamTestSeries {
  id: string; authorityId: string; programId: string; postId?: string;
  name: string; nameHindi?: string; slug: string; seriesType: TestSeriesType;
  bundleId?: string; description?: string; status: CatalogStatus;
  sortOrder: number; createdAt: string; updatedAt: string;
}
export const EXAM_CATALOG_COLLECTIONS = {
  AUTHORITIES: 'examAuthorities', PROGRAMS: 'examPrograms',
  POSTS: 'examPosts', SERIES: 'examTestSeries'
} as const;

export function slugifyCatalog(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9\\s-]/g, '')
    .replace(/\\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}
const now = () => new Date().toISOString();

export async function fetchExamAuthorities(): Promise<ExamAuthority[]> {
  if (!db) return [];
  const snap = await getDocs(query(collection(db, EXAM_CATALOG_COLLECTIONS.AUTHORITIES), orderBy('sortOrder', 'asc')));
  return snap.docs.map(d => d.data() as ExamAuthority);
}
export async function fetchExamPrograms(authorityId?: string): Promise<ExamProgram[]> {
  if (!db) return [];
  const ref = collection(db, EXAM_CATALOG_COLLECTIONS.PROGRAMS);
  const snap = authorityId
    ? await getDocs(query(ref, where('authorityId', '==', authorityId), orderBy('sortOrder', 'asc')))
    : await getDocs(query(ref, orderBy('sortOrder', 'asc')));
  return snap.docs.map(d => d.data() as ExamProgram);
}
export async function fetchExamPosts(programId?: string): Promise<ExamPost[]> {
  if (!db) return [];
  const ref = collection(db, EXAM_CATALOG_COLLECTIONS.POSTS);
  const snap = programId
    ? await getDocs(query(ref, where('programId', '==', programId), orderBy('sortOrder', 'asc')))
    : await getDocs(query(ref, orderBy('sortOrder', 'asc')));
  return snap.docs.map(d => d.data() as ExamPost);
}
export async function fetchExamTestSeries(programId?: string, postId?: string): Promise<ExamTestSeries[]> {
  if (!db) return [];
  const ref = collection(db, EXAM_CATALOG_COLLECTIONS.SERIES);
  const filters: any[] = [];
  if (programId) filters.push(where('programId', '==', programId));
  if (postId) filters.push(where('postId', '==', postId));
  const snap = filters.length
    ? await getDocs(query(ref, ...filters, orderBy('sortOrder', 'asc')))
    : await getDocs(query(ref, orderBy('sortOrder', 'asc')));
  return snap.docs.map(d => d.data() as ExamTestSeries);
}
export async function saveExamAuthority(record: ExamAuthority) {
  if (db) await setDoc(doc(db, EXAM_CATALOG_COLLECTIONS.AUTHORITIES, record.id), record, { merge: true });
}
export async function saveExamProgram(record: ExamProgram) {
  if (db) await setDoc(doc(db, EXAM_CATALOG_COLLECTIONS.PROGRAMS, record.id), record, { merge: true });
}
export async function saveExamPost(record: ExamPost) {
  if (db) await setDoc(doc(db, EXAM_CATALOG_COLLECTIONS.POSTS, record.id), record, { merge: true });
}
export async function saveExamTestSeries(record: ExamTestSeries) {
  if (db) await setDoc(doc(db, EXAM_CATALOG_COLLECTIONS.SERIES, record.id), record, { merge: true });
}
export async function getExamProgram(programId: string): Promise<ExamProgram | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, EXAM_CATALOG_COLLECTIONS.PROGRAMS, programId));
  return snap.exists() ? snap.data() as ExamProgram : null;
}

function inferProgramName(bundle: TestSeriesBundle): string {
  const title = bundle.title.replace(/\\s+test\\s+series\\s*$/i, '').trim();
  const post = bundle.targetPost || '';
  if (bundle.authority === 'CGSSB' && /(assistant teacher|teacher|lecturer|vyakhyata)/i.test(post)) {
    return `CGSSB Teacher Recruitment ${bundle.targetYear}`;
  }
  if (bundle.authority === 'CGPSC' && /(pre|state service|sse)/i.test(title)) {
    return `CGPSC State Service Examination ${bundle.targetYear}`;
  }
  return title || `${bundle.authority} Examination ${bundle.targetYear}`;
}
function inferProgramType(name: string): 'recruitment' | 'examination' {
  return /recruitment|bharti/i.test(name) ? 'recruitment' : 'examination';
}
function inferSeriesType(bundle: TestSeriesBundle): TestSeriesType {
  const text = bundle.title.toLowerCase();
  if (bundle.pypTests?.length && !bundle.testItems?.length && !bundle.chapterTests?.length) return 'pyp';
  if (text.includes('chapter')) return 'chapter_test';
  if (text.includes('subject') || text.includes('sectional')) return 'subject_test';
  if (text.includes('live')) return 'live_test';
  if (text.includes('practice')) return 'practice';
  return 'mixed';
}

/** Idempotently projects a legacy bundle into the canonical hierarchy. */
export async function ensureCanonicalHierarchyForBundle(bundle: TestSeriesBundle) {
  const timestamp = now();
  const authorityName = bundle.authority || 'Other';
  const authorityId = bundle.authorityId || `authority-${slugifyCatalog(authorityName)}`;
  const programName = inferProgramName(bundle);
  const programId = bundle.programId || `program-${slugifyCatalog(programName)}`;
  const postName = (bundle.targetPost || '').trim();
  const status: CatalogStatus = bundle.isPublished === false || bundle.isDraft ? 'DRAFT' : 'PUBLISHED';

  const authority: ExamAuthority = {
    id: authorityId, name: authorityName, shortName: authorityName,
    slug: slugifyCatalog(authorityName), status, sortOrder: 0,
    createdAt: timestamp, updatedAt: timestamp
  };
  const program: ExamProgram = {
    id: programId, authorityId, name: programName,
    slug: slugifyCatalog(programName), year: bundle.targetYear,
    programType: inferProgramType(programName), status,
    hasPosts: Boolean(postName && !/^(exam aspirants|general cadre)$/i.test(postName)),
    sortOrder: 0, createdAt: timestamp, updatedAt: timestamp
  };
  await saveExamAuthority(authority);
  await saveExamProgram(program);

  let post: ExamPost | undefined;
  if (program.hasPosts) {
    const postId = bundle.postId || `post-${programId.replace(/^program-/, '')}-${slugifyCatalog(postName)}`;
    post = {
      id: postId, programId, name: postName, slug: slugifyCatalog(postName),
      status, sortOrder: 0, createdAt: timestamp, updatedAt: timestamp
    };
    await saveExamPost(post);
  }

  const series: ExamTestSeries = {
    id: bundle.id, authorityId, programId, postId: post?.id || bundle.postId,
    name: bundle.title, nameHindi: bundle.titleHindi, slug: bundle.slug,
    seriesType: bundle.seriesType || inferSeriesType(bundle), bundleId: bundle.id,
    description: bundle.shortDescription, status, sortOrder: 0,
    createdAt: timestamp, updatedAt: timestamp
  };
  await saveExamTestSeries(series);
  return { authority, program, post, series };
}

/** One-time migration bridge. It never deletes legacy bundle data. */
export async function migrateBundlesToCanonicalExamCatalog(bundles: TestSeriesBundle[]): Promise<number> {
  let migrated = 0;
  for (const bundle of bundles) {
    await ensureCanonicalHierarchyForBundle(bundle);
    migrated += 1;
  }
  return migrated;
}
