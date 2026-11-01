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
  /** Number of independent test definitions audited concurrently (1–10). Defaults to 4. */
  concurrency?: number;
}

/**
 * Read-only, bounded pre-cutover audit. It validates published definitions
 * against their actual student projection documents using the same strict
 * adapter used by the isolated production data source. Tests are processed
 * with a small bounded worker pool and a total document-read budget prevents unexpectedly large
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

  const concurrency = options.concurrency ?? 4;
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 10) {
    throw new Error('Audit concurrency must be an integer between 1 and 10.');
  }

  const publishedTests = tests.filter(test => test?.isPublished === true);
  const results: PublishedExamAuditResult[] = new Array(publishedTests.length);
  let nextIndex = 0;
  let questionIdsAttempted = 0;
  let questionIdsReserved = 0;
  let questionIdsDeferred = 0;

  const auditNext = async (): Promise<void> => {
    const index = nextIndex++;
    if (index >= publishedTests.length) return;
    const test = publishedTests[index];
    const requestedCount = Array.isArray(test.sections)
      ? (test.sections as unknown[]).reduce<number>((total: number, section: unknown) => {
          const questionIds = section && typeof section === 'object'
            ? (section as { questionIds?: unknown }).questionIds
            : undefined;
          return total + (Array.isArray(questionIds) ? questionIds.length : 0);
        }, 0)
      : 0;

    if (requestedCount > maxQuestionIds - questionIdsReserved) {
      questionIdsDeferred += requestedCount;
      results[index] = {
        testId: String(test.id ?? ''),
        title: String(test.title ?? ''),
        status: 'blocked',
        issueCode: 'AUDIT_READ_BUDGET_EXCEEDED',
        message: 'Skipped to stay within the configured total question-document read budget.',
      };
      return;
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
      results[index] = {
        testId: String(test.id ?? ''),
        title: String(test.title ?? ''),
        status: 'ready',
      };
    } catch (error) {
      const issueCode: PublishedExamAuditIssueCode = error instanceof StudentExamResolutionError
        ? error.code as PublishedExamAuditIssueCode
        : 'PROJECTION_READ_FAILED';
      results[index] = {
        testId: String(test?.id ?? ''),
        title: String(test?.title ?? ''),
        status: 'blocked',
        issueCode,
        message: error instanceof Error ? error.message : 'Unknown projection audit failure.',
      };
    }
  };

  // A small bounded worker pool reduces audit latency without creating an
  // unbounded Firestore burst. Budget reservation happens synchronously before
  // each worker awaits Firestore, and result order remains deterministic.
  await Promise.all(Array.from({ length: Math.min(concurrency, publishedTests.length) }, async () => {
    while (nextIndex < publishedTests.length) await auditNext();
  }));

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
