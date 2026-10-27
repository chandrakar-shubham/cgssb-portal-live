import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  getCountFromServer,
  limit,
  query,
  writeBatch,
} from 'firebase/firestore';
import { db } from './config';
import { toStudentQuestion } from '../utils/studentQuestionProjection';
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
 * Read-only rollout gate: compare canonical and projected counts and sample
 * every projected record for known answer-key aliases. Does not imply that
 * all projection content is semantically correct; full migration still needs
 * representative exam journey tests before rules can be tightened.
 */
export async function verifyStudentQuestionProjections(sampleLimit = 100): Promise<{
  canonicalCount: number;
  projectedCount: number;
  sampled: number;
  leakedDocuments: string[];
  missingProjectionIds: string[];
  mismatchedProjectionIds: string[];
  countParity: boolean;
  passed: boolean;
}> {
  if (!db) throw new Error('Firestore is not initialized.');
  const requestedSampleSize = Number.isFinite(sampleLimit)
    ? Math.max(0, Math.min(500, Math.floor(sampleLimit)))
    : 100;
  const [canonicalCountSnap, projectedCountSnap, canonicalSnap] = await Promise.all([
    getCountFromServer(collection(db, CANONICAL_QUESTIONS)),
    getCountFromServer(collection(db, STUDENT_QUESTIONS)),
    requestedSampleSize > 0
      ? getDocs(query(collection(db, CANONICAL_QUESTIONS), limit(requestedSampleSize)))
      : Promise.resolve(null),
  ]);
  const canonicalCount = canonicalCountSnap.data().count;
  const projectedCount = projectedCountSnap.data().count;
  const sampleSize = canonicalSnap?.docs.length ?? 0;
  const leakedDocuments: string[] = [];
  const missingProjectionIds: string[] = [];
  const mismatchedProjectionIds: string[] = [];
  const stableSerialize = (value: unknown): string => {
    if (Array.isArray(value)) return `[${value.map(stableSerialize).join(',')}]`;
    if (value !== null && typeof value === 'object') {
      const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
      return `{${entries.map(([key, nested]) => `${JSON.stringify(key)}:${stableSerialize(nested)}`).join(',')}}`;
    }
    return JSON.stringify(value);
  };
  // Scan nested objects and arrays as well as top-level fields. A projection
  // can be unsafe even when the answer marker is hidden inside an option or
  // matching-column item.
  const forbiddenFields = new Set([
    'correctoption', 'correctanswer', 'answer', 'answerkey', 'modelkey',
    'finalamendedkey', 'explanation', 'explanationhindi', 'solution',
    'solutionhindi', 'moderationnotes', 'internalnotes', 'iscorrect',
    'correct', 'isanswer', 'answerid', 'isrightanswer',
  ]);
  const containsForbiddenField = (value: unknown): boolean => {
    if (Array.isArray(value)) return value.some(containsForbiddenField);
    if (value === null || typeof value !== 'object') return false;
    return Object.entries(value as Record<string, unknown>).some(([key, nested]) => {
      const normalizedKey = key.toLowerCase().replace(/[_-]/g, '');
      return forbiddenFields.has(normalizedKey) || containsForbiddenField(nested);
    });
  };
  for (const canonicalDoc of (canonicalSnap?.docs ?? [])) {
    const projectedDoc = await getDoc(doc(db, STUDENT_QUESTIONS, canonicalDoc.id));
    if (!projectedDoc.exists()) {
      missingProjectionIds.push(canonicalDoc.id);
      continue;
    }
    const canonicalQuestion = { ...canonicalDoc.data(), id: canonicalDoc.id } as Question;
    const expectedProjection = toStudentQuestion(canonicalQuestion);
    const actualProjection = { ...projectedDoc.data(), id: projectedDoc.id };
    if (containsForbiddenField(actualProjection)) leakedDocuments.push(projectedDoc.id);
    if (stableSerialize(expectedProjection) !== stableSerialize(actualProjection)) {
      mismatchedProjectionIds.push(canonicalDoc.id);
    }
  }
  const countParity = canonicalCount === projectedCount;
  return {
    canonicalCount,
    projectedCount,
    sampled: sampleSize,
    leakedDocuments,
    missingProjectionIds,
    mismatchedProjectionIds,
    countParity,
    passed: countParity && leakedDocuments.length === 0 && missingProjectionIds.length === 0 && mismatchedProjectionIds.length === 0,
  };
}

export async function backfillStudentQuestionProjections(): Promise<{ scanned: number; projected: number }> {
  if (!db) throw new Error('Firestore is not initialized.');
  const snapshot = await getDocs(collection(db, CANONICAL_QUESTIONS));
  let projected = 0;
  for (let offset = 0; offset < snapshot.docs.length; offset += WRITE_BATCH_SIZE) {
    const docs = snapshot.docs.slice(offset, offset + WRITE_BATCH_SIZE);
    const batch = writeBatch(db);
    for (const questionDoc of docs) {
      const question = { ...questionDoc.data(), id: questionDoc.id } as Question;
      batch.set(doc(db, STUDENT_QUESTIONS, questionDoc.id), toStudentQuestion(question));
    }
    await batch.commit();
    projected += docs.length;
  }
  return { scanned: snapshot.docs.length, projected };
}
