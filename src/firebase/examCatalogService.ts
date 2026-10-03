import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, query, where, orderBy, documentId } from 'firebase/firestore';
import { db } from './config';

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
  totalVacancies?: number; recruitmentLabel?: string;
  createdAt: string; updatedAt: string;
}
export interface ExamPost {
  id: string; programId: string; name: string; nameHindi?: string; slug: string;
  shortName?: string; description?: string; status: CatalogStatus;
  sortOrder: number; createdAt: string; updatedAt: string;
  vacancies?: number; cadreBreakup?: string; payLevel?: string; salaryRange?: string; subjects?: string[];
}
export type TestSeriesType = 'full_mock' | 'chapter_test' | 'subject_test' | 'pyp' | 'live_test' | 'practice' | 'mixed';
export interface ExamSubject {
  id: string; authorityId: string; programId: string; name: string; nameHindi?: string;
  slug: string; topics: string[]; status: CatalogStatus; sortOrder: number;
  createdAt: string; updatedAt: string;
}
export interface ExamTestSeries {
  id: string; authorityId: string; programId: string; postId?: string;
  name: string; nameHindi?: string; slug: string; seriesType: TestSeriesType;
  bundleId?: string; description?: string; status: CatalogStatus;
  sortOrder: number; createdAt: string; updatedAt: string;
}
export const EXAM_CATALOG_COLLECTIONS = {
  AUTHORITIES: 'examAuthorities', PROGRAMS: 'examPrograms',
  POSTS: 'examPosts', SERIES: 'examTestSeries', SUBJECTS: 'examSubjects'
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
    ? await getDocs(query(ref, where('authorityId', '==', authorityId)))
    : await getDocs(ref);
  return snap.docs.map(d => d.data() as ExamProgram).sort((a, b) => a.sortOrder - b.sortOrder);
}
export async function fetchExamPosts(programId?: string): Promise<ExamPost[]> {
  if (!db) return [];
  const ref = collection(db, EXAM_CATALOG_COLLECTIONS.POSTS);
  const snap = programId
    ? await getDocs(query(ref, where('programId', '==', programId)))
    : await getDocs(ref);
  return snap.docs.map(d => d.data() as ExamPost).sort((a, b) => a.sortOrder - b.sortOrder);
}
export async function fetchExamTestSeries(programId?: string, postId?: string): Promise<ExamTestSeries[]> {
  if (!db) return [];
  const ref = collection(db, EXAM_CATALOG_COLLECTIONS.SERIES);
  const filters: any[] = [];
  if (programId) filters.push(where('programId', '==', programId));
  if (postId) filters.push(where('postId', '==', postId));
  const snap = filters.length
    ? await getDocs(query(ref, ...filters))
    : await getDocs(ref);
  return snap.docs.map(d => d.data() as ExamTestSeries).sort((a, b) => a.sortOrder - b.sortOrder);
}
export async function fetchExamTestSeriesByIds(seriesIds: string[]): Promise<ExamTestSeries[]> {
  if (!db || !Array.isArray(seriesIds) || seriesIds.length === 0) return [];

  const uniqueIds = [...new Set(seriesIds.filter(Boolean))];
  const chunks: string[][] = [];
  for (let i = 0; i < uniqueIds.length; i += 30) {
    chunks.push(uniqueIds.slice(i, i + 30));
  }

  const results: ExamTestSeries[] = [];
  for (const chunk of chunks) {
    const snap = await getDocs(
      query(
        collection(db, EXAM_CATALOG_COLLECTIONS.SERIES),
        where(documentId(), 'in', chunk)
      )
    );
    results.push(...snap.docs.map(d => d.data() as ExamTestSeries));
  }

  return results;
}

export async function fetchExamSubjects(programId?: string): Promise<ExamSubject[]> {
  if (!db) return [];
  const ref = collection(db, EXAM_CATALOG_COLLECTIONS.SUBJECTS);
  const snap = programId ? await getDocs(query(ref, where('programId', '==', programId))) : await getDocs(ref);
  return snap.docs.map(d => d.data() as ExamSubject).sort((a, b) => a.sortOrder - b.sortOrder);
}
export async function saveExamSubject(record: ExamSubject) {
  if (db) await setDoc(doc(db, EXAM_CATALOG_COLLECTIONS.SUBJECTS, record.id), record, { merge: true });
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

export async function fetchExamTestSeriesById(seriesId: string): Promise<ExamTestSeries | null> {
  if (!db || !seriesId) return null;
  const snap = await getDoc(doc(db, EXAM_CATALOG_COLLECTIONS.SERIES, seriesId));
  return snap.exists() ? snap.data() as ExamTestSeries : null;
}

export async function deleteExamTestSeries(seriesId: string): Promise<void> {
  if (!db || !seriesId) return;
  await deleteDoc(doc(db, EXAM_CATALOG_COLLECTIONS.SERIES, seriesId));
}
export async function getExamProgram(programId: string): Promise<ExamProgram | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, EXAM_CATALOG_COLLECTIONS.PROGRAMS, programId));
  return snap.exists() ? snap.data() as ExamProgram : null;
}
