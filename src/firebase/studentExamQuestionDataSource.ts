import type { MockTest } from '../types';
import { fetchStudentQuestionDocumentsByIdsFromFirestore } from './firestoreService';
import { loadPublishedStudentExamQuestions } from '../app/studentExamQuestionAdapter';

/**
 * Production Firestore boundary for the strict published student-exam path.
 *
 * This deliberately exposes only the student-safe projection reader to the
 * adapter. It does not read canonical questions, expand by program, or invoke
 * local/demo fallbacks. The legacy exam loader remains unchanged until the
 * migration gate and end-to-end compatibility checks are approved.
 */
export async function loadPublishedStudentExamQuestionsFromFirestore(
  test: Pick<MockTest, 'id' | 'isPublished' | 'sections' | 'questionCount'>,
) {
  return loadPublishedStudentExamQuestions(
    test,
    fetchStudentQuestionDocumentsByIdsFromFirestore,
  );
}
