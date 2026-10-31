import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  getCountFromServer,
  limit,
  query,
  orderBy,
  startAfter,
  documentId,
  writeBatch,
  type DocumentData,
  type Query,
  type QueryDocumentSnapshot,
  type QuerySnapshot,
} from 'firebase/firestore';
import { db } from './config';
import { containsForbiddenStudentField, stableSerializeProjection, toStudentQuestion } from '../utils/studentQuestionProjection';
import type { Question } from '../types';

const CANONICAL_QUESTIONS = 'questions';
const STUDENT_QUESTIONS = 'studentQuestions';
const WRITE_BATCH_SIZE = 400;

/**
 * Mirrors one canonical question into its student-safe allowlisted projection.
 * This is a rollout aid; student readers must not switch until backfill is verified.
 */
export async function syncStudentQuestionProjection(question: Question): Promise<void> {
  if (!db || !question?.id) throw new Error('Cannot project a question without an initialized database and ID.');
  const batch = writeBatch(db);
  batch.set(doc(db, STUDENT_QUESTIONS, question.id), toStudentQuestion(question));
  await batch.commit();
}

export async function deleteStudentQuestionProjection(questionId: string): Promise<void> {
  if (!db || !questionId) return;
  await deleteDoc(doc(db, STUDENT_QUESTIONS, questionId));
}

/**
 * Idempotent admin-invoked backfill. Caller must enforce admin authorization.
 * Writes in bounded batches and never modifies canonical question records.
 */
/**
 * Read-only rollout gate: compare counts and verify every canonical record
 * against its student-safe projection using bounded pagination. It checks
 * known answer-key aliases and exact allowlist parity; representative exam
 * journey tests are still required before rules can be tightened.
 */
export async function verifyStudentQuestionProjections(pageSize = 200): Promise<{
  canonicalCount: number;
  projectedCount: number;
  sampled: number;
  leakedDocuments: string[];
  missingProjectionIds: string[];
  mismatchedProjectionIds: string[];
  countParity: boolean;
  completeCoverage: boolean;
  passed: boolean;
}> {
  if (!db) throw new Error('Firestore is not initialized.');
  // `pageSize` controls the bounded Firestore page size, not total coverage.
  // Always traverse the full canonical collection; a partial scan can never pass.
  const boundedPageSize = Number.isFinite(pageSize)
    ? Math.max(1, Math.min(400, Math.floor(pageSize)))
    : 200;
  const [canonicalCountSnap, projectedCountSnap] = await Promise.all([
    getCountFromServer(collection(db, CANONICAL_QUESTIONS)),
    getCountFromServer(collection(db, STUDENT_QUESTIONS)),
  ]);
  const canonicalCount = canonicalCountSnap.data().count;
  const projectedCount = projectedCountSnap.data().count;
  let sampled = 0;
  let cursor: QueryDocumentSnapshot<DocumentData> | null = null;
  const leakedDocuments: string[] = [];
  const missingProjectionIds: string[] = [];
  const mismatchedProjectionIds: string[] = [];

  while (true) {
    const pageQuery: Query<DocumentData> = cursor
      ? query(collection(db, CANONICAL_QUESTIONS), orderBy(documentId()), startAfter(cursor), limit(boundedPageSize))
      : query(collection(db, CANONICAL_QUESTIONS), orderBy(documentId()), limit(boundedPageSize));
    const canonicalPage: QuerySnapshot<DocumentData> = await getDocs(pageQuery);
    if (canonicalPage.empty) break;
    sampled += canonicalPage.docs.length;

    // Bound concurrent point reads to avoid unbounded client-side fan-out.
    for (let offset = 0; offset < canonicalPage.docs.length; offset += 20) {
      const chunk = canonicalPage.docs.slice(offset, offset + 20);
      const projectedSnapshots = await Promise.all(chunk.map(canonicalDoc =>
        getDoc(doc(db, STUDENT_QUESTIONS, canonicalDoc.id))
      ));
      chunk.forEach((canonicalDoc, index) => {
        const projectedDoc = projectedSnapshots[index];
        if (!projectedDoc.exists()) {
          missingProjectionIds.push(canonicalDoc.id);
          return;
        }
        const canonicalQuestion = { ...canonicalDoc.data(), id: canonicalDoc.id } as Question;
        const expectedProjection = toStudentQuestion(canonicalQuestion);
        const actualProjection = { ...projectedDoc.data(), id: projectedDoc.id };
        if (containsForbiddenStudentField(actualProjection)) leakedDocuments.push(projectedDoc.id);
        if (stableSerializeProjection(expectedProjection) !== stableSerializeProjection(actualProjection)) {
          mismatchedProjectionIds.push(canonicalDoc.id);
        }
      });
    }
    cursor = canonicalPage.docs[canonicalPage.docs.length - 1];
    if (canonicalPage.docs.length < boundedPageSize) break;
  }
  const countParity = canonicalCount === projectedCount;
  const completeCoverage = sampled === canonicalCount;
  return {
    canonicalCount,
    projectedCount,
    sampled,
    leakedDocuments,
    missingProjectionIds,
    mismatchedProjectionIds,
    countParity,
    completeCoverage,
    // Fail closed: every canonical document must be covered before approval.
    passed: completeCoverage && countParity && leakedDocuments.length === 0 && missingProjectionIds.length === 0 && mismatchedProjectionIds.length === 0,
  };
}

export async function backfillStudentQuestionProjections(): Promise<{ scanned: number; projected: number }> {
  if (!db) throw new Error('Firestore is not initialized.');

  // Bound both read memory and write batches. The cursor is always advanced
  // from the canonical query snapshot, never from the projection writes.
  let cursor: QueryDocumentSnapshot<DocumentData> | null = null;
  let scanned = 0;
  let projected = 0;

  while (true) {
    const pageQuery: Query<DocumentData> = cursor
      ? query(collection(db, CANONICAL_QUESTIONS), orderBy(documentId()), startAfter(cursor), limit(WRITE_BATCH_SIZE))
      : query(collection(db, CANONICAL_QUESTIONS), orderBy(documentId()), limit(WRITE_BATCH_SIZE));
    const canonicalPage: QuerySnapshot<DocumentData> = await getDocs(pageQuery);
    if (canonicalPage.empty) break;

    const batch = writeBatch(db);
    for (const questionDoc of canonicalPage.docs) {
      const question = { ...questionDoc.data(), id: questionDoc.id } as Question;
      batch.set(doc(db, STUDENT_QUESTIONS, questionDoc.id), toStudentQuestion(question));
    }
    await batch.commit();

    scanned += canonicalPage.docs.length;
    projected += canonicalPage.docs.length;
    cursor = canonicalPage.docs[canonicalPage.docs.length - 1];
    if (canonicalPage.docs.length < WRITE_BATCH_SIZE) break;
  }

  return { scanned, projected };
}
