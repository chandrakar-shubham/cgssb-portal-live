import type { MockTest } from '../types';
import {
  containsForbiddenStudentField,
  toStudentQuestion,
  type StudentQuestion,
} from '../utils/studentQuestionProjection';
import {
  resolvePublishedStudentExamQuestions,
  StudentExamResolutionError,
} from './studentExamQuestionResolver';

export interface StudentQuestionDocument {
  /** Firestore document ID, not an ID copied from its payload. */
  id: string;
  data: Record<string, unknown>;
}

export type StudentQuestionDocumentReader = (
  questionIds: readonly string[],
) => Promise<readonly StudentQuestionDocument[]>;

const ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

/**
 * Fail-closed data path for the published student exam journey.
 * Reads only the explicit IDs assigned to the published test; it never
 * expands the set or falls back to canonical questions/local catalogues.
 */
export async function loadPublishedStudentExamQuestions(
  test: Pick<MockTest, 'id' | 'isPublished' | 'sections' | 'questionCount'>,
  readDocuments: StudentQuestionDocumentReader,
): Promise<StudentQuestion[]> {
  if (!test || typeof test !== 'object' || test.isPublished !== true) {
    throw new StudentExamResolutionError('TEST_NOT_PUBLISHED', 'Only a published test can be loaded.');
  }
  if (
    typeof test.id !== 'string' ||
    !ID_PATTERN.test(test.id) ||
    !Array.isArray(test.sections) ||
    test.sections.length === 0 ||
    !Number.isInteger(test.questionCount)
  ) {
    throw new StudentExamResolutionError('INVALID_TEST_DEFINITION', 'The published test definition is invalid.');
  }

  const orderedIds: string[] = [];
  const assignedIds = new Set<string>();
  for (const section of test.sections) {
    if (!section || !Array.isArray(section.questionIds)) {
      throw new StudentExamResolutionError('INVALID_TEST_DEFINITION', 'Every section must declare question IDs.');
    }
    for (const id of section.questionIds) {
      if (typeof id !== 'string' || !ID_PATTERN.test(id)) {
        throw new StudentExamResolutionError('INVALID_QUESTION_ID', 'The test contains an invalid question ID.');
      }
      if (assignedIds.has(id)) {
        throw new StudentExamResolutionError('DUPLICATE_TEST_QUESTION_ID', 'The test assigns a question more than once.');
      }
      assignedIds.add(id);
      orderedIds.push(id);
    }
  }
  if (orderedIds.length === 0 || orderedIds.length > 500 || test.questionCount !== orderedIds.length) {
    throw new StudentExamResolutionError('QUESTION_COUNT_MISMATCH', 'The test count must match its explicit question IDs.');
  }

  // A reader failure propagates. Empty/missing data is never converted to a fallback.
  const documents = await readDocuments(orderedIds);
  if (!Array.isArray(documents)) {
    throw new StudentExamResolutionError('UNSAFE_STUDENT_QUESTION', 'Projection reader returned an invalid result.');
  }

  const seen = new Set<string>();
  const projected: StudentQuestion[] = [];
  for (const document of documents) {
    if (
      !document ||
      typeof document.id !== 'string' ||
      !ID_PATTERN.test(document.id) ||
      !document.data ||
      typeof document.data !== 'object' ||
      Array.isArray(document.data)
    ) {
      throw new StudentExamResolutionError('UNSAFE_STUDENT_QUESTION', 'Projection document identity or payload is invalid.');
    }
    if (seen.has(document.id)) {
      throw new StudentExamResolutionError('DUPLICATE_PROJECTED_QUESTION', 'Projection reader returned a duplicate document.');
    }
    seen.add(document.id);
    if (!assignedIds.has(document.id)) {
      throw new StudentExamResolutionError('UNEXPECTED_PROJECTED_QUESTION', 'Projection reader returned an unassigned document.');
    }
    if (
      Object.prototype.hasOwnProperty.call(document.data, 'id') &&
      document.data.id !== document.id
    ) {
      throw new StudentExamResolutionError('UNSAFE_STUDENT_QUESTION', 'Payload identity does not match its Firestore document ID.');
    }
    if (containsForbiddenStudentField(document.data)) {
      throw new StudentExamResolutionError('UNSAFE_STUDENT_QUESTION', 'Projection contains answer-key or internal fields.');
    }
    projected.push(toStudentQuestion({ ...document.data, id: document.id }));
  }

  // Resolver enforces complete coverage and restores the exact published order.
  return resolvePublishedStudentExamQuestions(test, projected);
}
