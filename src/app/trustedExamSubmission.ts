import type { MockTest, TestAttempt } from '../types';
import type { TrustedAttemptSubmission } from '../services/trustedScoringClient';
import { parseTrustedAttemptReceipt } from './trustedAttemptReceipt';

export interface TrustedAttemptSubmitter {
  submitAttempt(submission: TrustedAttemptSubmission): Promise<{
    replayed: boolean;
    attempt: Record<string, unknown>;
  }>;
}

export interface TrustedExamSubmissionInput {
  test: MockTest;
  userId: string;
  submission: {
    testId: string;
    timeTakenSeconds: number;
    responses: Record<string, 'A' | 'B' | 'C' | 'D' | null>;
    submissionId: string;
  };
}

/**
 * The single student-side boundary for trusted scoring.
 * It sends only answers and elapsed time; scoring and identity remain server-owned.
 */
export async function submitTrustedExamAttempt(
  input: TrustedExamSubmissionInput,
  client: TrustedAttemptSubmitter,
): Promise<{ attempt: TestAttempt; replayed: boolean }> {
  const { test, userId, submission } = input;
  if (!userId || submission.testId !== test.id) {
    throw new Error('Trusted submission does not match the authenticated student and active test.');
  }
  const questionIds = test.sections.flatMap(section => section.questionIds);
  if (!questionIds.length || new Set(questionIds).size !== questionIds.length) {
    throw new Error('Trusted submission requires a valid, unique published question set.');
  }
  const expectedIds = new Set(questionIds);
  if (Object.keys(submission.responses).some(id => !expectedIds.has(id))) {
    throw new Error('Trusted submission contains answers outside the active test.');
  }
  const responses: TrustedAttemptSubmission['responses'] = {};
  for (const id of questionIds) responses[id] = submission.responses[id] ?? null;

  const result = await client.submitAttempt({
    testId: test.id,
    clientAttemptId: submission.submissionId,
    timeTakenSeconds: submission.timeTakenSeconds,
    responses,
  });
  const attempt = parseTrustedAttemptReceipt(result.attempt, {
    userId,
    test,
    clientAttemptId: submission.submissionId,
  });
  return { attempt, replayed: result.replayed };
}
