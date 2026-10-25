import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getCountFromServer,
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
  countParity: boolean;
}> {
  if (!db) throw new Error('Firestore is not initialized.');
  const [canonicalCountSnap, projectedCountSnap, projectedSnap] = await Promise.all([
    getCountFromServer(collection(db, CANONICAL_QUESTIONS)),
    getCountFromServer(collection(db, STUDENT_QUESTIONS)),
    getDocs(collection(db, STUDENT_QUESTIONS)),
  ]);
  const canonicalCount = canonicalCountSnap.data().count;
  const projectedCount = projectedCountSnap.data().count;
  const sampleSize = Math.max(0, Math.min(Math.floor(sampleLimit), projectedSnap.docs.length));
  const leakedDocuments: string[] = [];
  const forbiddenFields = [
    'correctOption', 'correctAnswer', 'answer', 'answerKey', 'modelKey',
    'finalAmendedKey', 'explanation', 'explanationHindi', 'solution',
    'solutionHindi', 'moderationNotes', 'internalNotes',
  ];
  for (const questionDoc of projectedSnap.docs.slice(0, sampleSize)) {
    const data = questionDoc.data();
    if (forbiddenFields.some(field => Object.prototype.hasOwnProperty.call(data, field))) {
      leakedDocuments.push(questionDoc.id);
    }
  }
  return {
    canonicalCount,
    projectedCount,
    sampled: sampleSize,
    leakedDocuments,
    countParity: canonicalCount === projectedCount,
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
