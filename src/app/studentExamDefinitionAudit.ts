import type { MockTest } from '../types';
import {
  loadPublishedStudentExamQuestions,
  type StudentQuestionDocumentReader,
} from './studentExamQuestionAdapter';
import { StudentExamResolutionError } from './studentExamQuestionResolver';

export type PublishedExamAuditIssueCode =
  | 'INVALID_TEST_DEFINITION'
  | 'INVALID_QUESTION_ID'
  | 'DUPLICATE_TEST_QUESTION_ID'
  | 'QUESTION_COUNT_MISMATCH'
  | 'MISSING_PROJECTED_QUESTION'
  | 'DUPLICATE_PROJECTED_QUESTION'
  | 'UNEXPECTED_PROJECTED_QUESTION'
  | 'UNSAFE_STUDENT_QUESTION'
  | 'PROJECTION_READ_FAILED'
  | 'AUDIT_READ_BUDGET_EXCEEDED';

export interface PublishedExamAuditResult {
  testId: string;
  title: string;
  status: 'ready' | 'blocked';
  issueCode?: PublishedExamAuditIssueCode;
  message?: string;
}

export interface PublishedExamAuditSummary {
  scanned: number;
  published: number;
  ready: number;
  blocked: number;
  questionIdsAttempted: number;
  questionIdsReserved: number;
  questionIdsDeferred: number;
  results: PublishedExamAuditResult[];
}

export interface PublishedExamAuditOptions {
  /** Maximum number of question documents the audit may request in total. */
  maxQuestionIds?: number;
}

/**
 * Read-only, bounded pre-cutover audit. It validates published definitions
 * against their actual student projection documents using the same strict
 * adapter used by the isolated production data source. Tests are processed
 * sequentially and a total document-read budget prevents unexpectedly large
 * Firestore bills during a pre-cutover audit.
 */
export async function auditPublishedStudentExamDefinitions(
  tests: readonly Pick<MockTest, 'id' | 'title' | 'isPublished' | 'sections' | 'questionCount'>[],
  readDocuments: StudentQuestionDocumentReader,
  options: PublishedExamAuditOptions = {},
): Promise<PublishedExamAuditSummary> {
  if (!Array.isArray(tests) || tests.length > 500) {
    throw new Error('Audit accepts at most 500 test definitions per run.');
  }
  const maxQuestionIds = options.maxQuestionIds ?? 5000;
  if (!Number.isInteger(maxQuestionIds) || maxQuestionIds < 1 || maxQuestionIds > 25000) {
    throw new Error('Audit question-read budget must be an integer between 1 and 25000.');
  }

  const publishedTests = tests.filter(test => test?.isPublished === true);
  const results: PublishedExamAuditResult[] = [];
  let questionIdsAttempted = 0;
  let questionIdsReserved = 0;
  let questionIdsDeferred = 0;

  for (const test of publishedTests) {
    const requestedCount = Array.isArray(test.sections)
      ? test.sections.reduce(
          (total, section) => total + (Array.isArray(section?.questionIds) ? section.questionIds.length : 0),
          0,
        )
      : 0;

    if (requestedCount > maxQuestionIds - questionIdsReserved) {
      questionIdsDeferred += requestedCount;
      results.push({
        testId: String(test.id ?? ''),
        title: String(test.title ?? ''),
        status: 'blocked',
        issueCode: 'AUDIT_READ_BUDGET_EXCEEDED',
        message: 'Skipped to stay within the configured total question-document read budget.',
      });
      continue;
    }

    // Reserve conservatively before validation/read. Invalid definitions may
    // consume reserved budget without reaching Firestore; this prevents a
    // malformed batch from bypassing the configured cap.
    questionIdsReserved += requestedCount;
    const countedReader: StudentQuestionDocumentReader = async ids => {
      questionIdsAttempted += ids.length;
      return readDocuments(ids);
    };
    try {
      await loadPublishedStudentExamQuestions(test, countedReader);
      results.push({
        testId: String(test.id ?? ''),
        title: String(test.title ?? ''),
        status: 'ready',
      });
    } catch (error) {
      const issueCode: PublishedExamAuditIssueCode = error instanceof StudentExamResolutionError
        ? error.code as PublishedExamAuditIssueCode
        : 'PROJECTION_READ_FAILED';
      results.push({
        testId: String(test?.id ?? ''),
        title: String(test?.title ?? ''),
        status: 'blocked',
        issueCode,
        message: error instanceof Error ? error.message : 'Unknown projection audit failure.',
      });
    }
  }

  const ready = results.filter(result => result.status === 'ready').length;
  return {
    scanned: tests.length,
    published: publishedTests.length,
    ready,
    blocked: results.length - ready,
    questionIdsAttempted,
    questionIdsReserved,
    questionIdsDeferred,
    results,
  };
}
