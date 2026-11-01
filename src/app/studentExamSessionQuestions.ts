import type { Firestore } from 'firebase/firestore';
import type { MockTest } from '../types';
import { db } from '../firebase/config';
import { fetchStudentQuestionDocumentsByIds } from '../firebase/studentQuestionFirestoreReader';
import {
  containsForbiddenStudentField,
  stableSerializeProjection,
  toStudentQuestion,
  type StudentQuestion,
} from '../utils/studentQuestionProjection';
import {
  resolvePublishedStudentExamQuestions,
  StudentExamResolutionError,
} from './studentExamQuestionResolver';

export type StudentExamQuestionReader = (
  firestore: Firestore | null,
  ids: readonly string[],
) => Promise<Array<{ id: string; data: Record<string, unknown> }>>;

/**
 * Resolve a published exam exclusively from student-safe projection documents.
 *
 * This function deliberately has no canonical-question fallback, program-wide
 * expansion, or local demo-data fallback. Callers must explicitly opt into
 * this path after the projection rollout gate has passed for the target
 * environment. It is separate from the legacy loader until renderer and
 * submission consumers have been migrated to StudentQuestion.
 */
export async function loadPublishedStudentExamQuestions(
  test: MockTest,
  options: {
    firestore?: Firestore | null;
    readDocuments?: StudentExamQuestionReader;
  } = {},
): Promise<StudentQuestion[]> {
  const firestore = options.firestore === undefined ? db : options.firestore;
  const readDocuments = options.readDocuments || fetchStudentQuestionDocumentsByIds;
  const ids = (test?.sections || []).flatMap(section =>
    Array.isArray(section.questionIds) ? section.questionIds : [],
  );

  if (ids.length === 0) {
    throw new StudentExamResolutionError(
      'INVALID_TEST_DEFINITION',
      'Published student exams must declare explicit question IDs.',
    );
  }

  const documents = await readDocuments(firestore, ids);
  const projectedQuestions = documents.map(({ id, data }) => {
    if (!data || typeof data !== 'object' || data.id !== id) {
      throw new StudentExamResolutionError(
        'UNSAFE_STUDENT_QUESTION',
        'A student question projection has a missing or mismatched document identity.',
      );
    }
    if (containsForbiddenStudentField(data)) {
      throw new StudentExamResolutionError(
        'UNSAFE_STUDENT_QUESTION',
        'A student question projection contains an answer key or internal field.',
      );
    }

    const sanitized = toStudentQuestion(data);
    // Do not silently sanitize unexpected fields at read time: a projection
    // containing unknown fields is a rollout/security defect and must fail.
    if (stableSerializeProjection(sanitized) !== stableSerializeProjection(data)) {
      throw new StudentExamResolutionError(
        'UNSAFE_STUDENT_QUESTION',
        'A student question projection contains fields outside the approved schema.',
      );
    }
    return sanitized;
  });

  return resolvePublishedStudentExamQuestions(test, projectedQuestions);
}
