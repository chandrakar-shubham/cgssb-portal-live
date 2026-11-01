import type { MockTest } from '../types';
import type { StudentQuestion } from '../utils/studentQuestionProjection';
import { containsForbiddenStudentField } from '../utils/studentQuestionProjection';

/** The student exam renderer receives only this already-sanitized question shape. */
export type StudentExamQuestion = StudentQuestion;

export type StudentExamResolutionErrorCode =
  | 'TEST_NOT_PUBLISHED'
  | 'INVALID_TEST_DEFINITION'
  | 'INVALID_QUESTION_ID'
  | 'DUPLICATE_TEST_QUESTION_ID'
  | 'QUESTION_COUNT_MISMATCH'
  | 'DUPLICATE_PROJECTED_QUESTION'
  | 'UNEXPECTED_PROJECTED_QUESTION'
  | 'MISSING_PROJECTED_QUESTION'
  | 'UNSAFE_STUDENT_QUESTION';

export class StudentExamResolutionError extends Error {
  readonly code: StudentExamResolutionErrorCode;

  constructor(code: StudentExamResolutionErrorCode, message: string) {
    super(message);
    this.name = 'StudentExamResolutionError';
    this.code = code;
  }
}

const ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

/**
 * Resolve only the exact ordered question set declared by a published test.
 *
 * This function is deliberately pure and does not fetch data, perform fallback
 * expansion, or mutate the supplied records. Callers must obtain question
 * records from the student-safe projection source, never the canonical
 * `questions` collection. It is not wired into the live exam loader yet.
 */
export function resolvePublishedStudentExamQuestions(
  test: Pick<MockTest, 'id' | 'isPublished' | 'sections' | 'questionCount'>,
  projectedQuestions: readonly StudentQuestion[],
): StudentExamQuestion[] {
  if (!test || typeof test !== 'object' || test.isPublished !== true) {
    throw new StudentExamResolutionError(
      'TEST_NOT_PUBLISHED',
      'Only a published test can be resolved for a student exam.',
    );
  }

  if (
    typeof test.id !== 'string' ||
    !ID_PATTERN.test(test.id) ||
    !Array.isArray(test.sections) ||
    test.sections.length === 0 ||
    !Number.isInteger(test.questionCount)
  ) {
    throw new StudentExamResolutionError(
      'INVALID_TEST_DEFINITION',
      'The published test definition is incomplete or invalid.',
    );
  }

  const orderedIds: string[] = [];
  for (const section of test.sections) {
    if (!section || !Array.isArray(section.questionIds)) {
      throw new StudentExamResolutionError(
        'INVALID_TEST_DEFINITION',
        'Every published test section must declare question IDs.',
      );
    }

    for (const id of section.questionIds) {
      if (typeof id !== 'string' || !ID_PATTERN.test(id)) {
        throw new StudentExamResolutionError(
          'INVALID_QUESTION_ID',
          'The published test contains an invalid question ID.',
        );
      }
      if (orderedIds.includes(id)) {
        throw new StudentExamResolutionError(
          'DUPLICATE_TEST_QUESTION_ID',
          'The published test assigns the same question more than once.',
        );
      }
      orderedIds.push(id);
    }
  }

  if (
    orderedIds.length === 0 ||
    orderedIds.length > 500 ||
    test.questionCount !== orderedIds.length
  ) {
    throw new StudentExamResolutionError(
      'QUESTION_COUNT_MISMATCH',
      'The published test question count does not match its explicit question IDs.',
    );
  }

  if (!Array.isArray(projectedQuestions)) {
    throw new StudentExamResolutionError(
      'INVALID_TEST_DEFINITION',
      'Student question projections must be supplied as an array.',
    );
  }

  const byId = new Map<string, StudentQuestion>();
  for (const question of projectedQuestions) {
    if (!question || typeof question.id !== 'string' || !ID_PATTERN.test(question.id)) {
      throw new StudentExamResolutionError(
        'UNSAFE_STUDENT_QUESTION',
        'A projected student question has an invalid identity.',
      );
    }
    if (byId.has(question.id)) {
      throw new StudentExamResolutionError(
        'DUPLICATE_PROJECTED_QUESTION',
        'The projection source returned a duplicate question.',
      );
    }
    if (containsForbiddenStudentField(question)) {
      throw new StudentExamResolutionError(
        'UNSAFE_STUDENT_QUESTION',
        'A projected student question contains a forbidden answer or internal field.',
      );
    }
    byId.set(question.id, question);
  }

  const expectedIds = new Set(orderedIds);
  for (const id of byId.keys()) {
    if (!expectedIds.has(id)) {
      throw new StudentExamResolutionError(
        'UNEXPECTED_PROJECTED_QUESTION',
        'The projection source returned a question not assigned to this test.',
      );
    }
  }

  return orderedIds.map(id => {
    const question = byId.get(id);
    if (!question) {
      throw new StudentExamResolutionError(
        'MISSING_PROJECTED_QUESTION',
        'A question assigned to this published test is missing from the student projection.',
      );
    }
    return question;
  });
}
