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
  | 'PROJECTION_READ_FAILED';

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
  results: PublishedExamAuditResult[];
}

/**
 * Read-only, bounded pre-cutover audit. It validates published definitions
 * against their actual student projection documents using the same strict
 * adapter used by the isolated production data source. Tests are processed
 * sequentially to avoid a burst of Firestore reads.
 */
export async function auditPublishedStudentExamDefinitions(
  tests: readonly Pick<MockTest, 'id' | 'title' | 'isPublished' | 'sections' | 'questionCount'>[],
  readDocuments: StudentQuestionDocumentReader,
): Promise<PublishedExamAuditSummary> {
  if (!Array.isArray(tests) || tests.length > 500) {
    throw new Error('Audit accepts at most 500 test definitions per run.');
  }

  const publishedTests = tests.filter(test => test?.isPublished === true);
  const results: PublishedExamAuditResult[] = [];

  for (const test of publishedTests) {
    try {
      await loadPublishedStudentExamQuestions(test, readDocuments);
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
    results,
  };
}
