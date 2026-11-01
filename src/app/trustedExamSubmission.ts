import type { MockTest, TestAttempt, QuestionPaletteStatus } from '../types';
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
    questionStatuses?: Record<string, QuestionPaletteStatus>;
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
  const sourceResponses: unknown = submission.responses;
  if (!sourceResponses || typeof sourceResponses !== 'object' || Array.isArray(sourceResponses)) {
    throw new Error('Trusted submission responses must be a plain object.');
  }
  const prototype = Object.getPrototypeOf(sourceResponses);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new Error('Trusted submission responses must be a plain object.');
  }
  if (Object.getOwnPropertySymbols(sourceResponses).length > 0) {
    throw new Error('Trusted submission responses must not contain symbol properties.');
  }
  const responseIds = Object.keys(sourceResponses);
  if (responseIds.some(id => !expectedIds.has(id))) {
    throw new Error('Trusted submission contains answers outside the active test.');
  }
  for (const id of responseIds) {
    const descriptor = Object.getOwnPropertyDescriptor(sourceResponses, id);
    if (!descriptor || !descriptor.enumerable || !('value' in descriptor)) {
      throw new Error('Trusted submission responses must contain only enumerable data properties.');
    }
    if (descriptor.value !== null && !['A', 'B', 'C', 'D'].includes(descriptor.value)) {
      throw new Error('Trusted submission contains an invalid answer value.');
    }
  }
  const responses: TrustedAttemptSubmission['responses'] = Object.create(null);
  for (const id of questionIds) {
    const descriptor = Object.getOwnPropertyDescriptor(sourceResponses, id);
    responses[id] = descriptor ? descriptor.value as 'A' | 'B' | 'C' | 'D' | null : null;
  }

  const allowedStatuses = new Set<QuestionPaletteStatus>([
    'not_visited', 'unanswered', 'answered', 'marked_for_review', 'answered_and_marked',
  ]);
  const sourceStatuses: unknown = submission.questionStatuses;
  if (sourceStatuses !== undefined && (
    !sourceStatuses || typeof sourceStatuses !== 'object' || Array.isArray(sourceStatuses) ||
    (Object.getPrototypeOf(sourceStatuses) !== Object.prototype && Object.getPrototypeOf(sourceStatuses) !== null) ||
    Object.getOwnPropertySymbols(sourceStatuses).length > 0
  )) {
    throw new Error('Trusted submission question statuses must be a plain object.');
  }
  const suppliedStatusIds = sourceStatuses ? Object.keys(sourceStatuses) : [];
  if (suppliedStatusIds.some(id => !expectedIds.has(id))) {
    throw new Error('Trusted submission contains statuses outside the active test.');
  }
  const questionStatuses: NonNullable<TrustedAttemptSubmission['questionStatuses']> = Object.create(null);
  for (const id of questionIds) {
    const descriptor = sourceStatuses ? Object.getOwnPropertyDescriptor(sourceStatuses, id) : undefined;
    if (descriptor && (!descriptor.enumerable || !('value' in descriptor))) {
      throw new Error('Trusted submission statuses must contain only enumerable data properties.');
    }
    const answer = responses[id];
    const status = descriptor
      ? descriptor.value as QuestionPaletteStatus
      : (answer == null ? 'not_visited' : 'answered');
    if (!allowedStatuses.has(status) ||
        (answer != null && status !== 'answered' && status !== 'answered_and_marked') ||
        (answer == null && (status === 'answered' || status === 'answered_and_marked'))) {
      throw new Error('Trusted submission contains an invalid question status or answer mismatch.');
    }
    questionStatuses[id] = status;
  }

  const result = await client.submitAttempt({
    testId: test.id,
    clientAttemptId: submission.submissionId,
    timeTakenSeconds: submission.timeTakenSeconds,
    responses,
    questionStatuses,
  });
  const attempt = parseTrustedAttemptReceipt(result.attempt, {
    userId,
    test,
    clientAttemptId: submission.submissionId,
  });
  return { attempt, replayed: result.replayed };
}
