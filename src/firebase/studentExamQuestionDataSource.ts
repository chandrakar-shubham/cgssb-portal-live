import type { MockTest } from '../types';
import { db } from './config';
import { fetchStudentQuestionDocumentsByIds } from './studentQuestionFirestoreReader';
import { loadPublishedStudentExamQuestions } from '../app/studentExamQuestionAdapter';

/**
 * Production Firestore boundary for the strict published student-exam path.
 *
 * This exposes only the student-safe projection reader to the adapter. It
 * cannot read canonical questions, expand by program, or invoke local/demo
 * fallbacks. The legacy exam loader remains unchanged pending migration gates.
 */
export async function loadPublishedStudentExamQuestionsFromFirestore(
  test: Pick<MockTest, 'id' | 'isPublished' | 'sections' | 'questionCount'>,
) {
  return loadPublishedStudentExamQuestions(
    test,
    questionIds => fetchStudentQuestionDocumentsByIds(db, questionIds),
  );
}
