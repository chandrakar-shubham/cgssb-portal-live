import {
  collection,
  deleteDoc,
  doc,
  getDocs,
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
