import type { MockTest, TestAttempt } from '../types';
import { loadPublishedStudentExamQuestions, type StudentExamQuestionReader } from './studentExamSessionQuestions';
import { buildTrustedReviewQuestions, type TrustedReviewQuestion, type TrustedReviewPayload } from './trustedAttemptReviewAdapter';
import { parseTrustedAttemptReceipt } from './trustedAttemptReceipt';
import { isTrustedScoringFeatureEnabled, type TrustedScoringIdentity, type TrustedScoringRuntimeConfig } from './trustedScoringFeatureGate';
import type { TrustedAttemptReview } from '../services/trustedScoringClient';

export interface TrustedAttemptReviewInput {
  test: MockTest;
  attemptId: string;
  identity: TrustedScoringIdentity | null | undefined;
  config: TrustedScoringRuntimeConfig;
  client: { getAttemptReview(attemptId: string): Promise<TrustedAttemptReview> };
  readQuestions?: StudentExamQuestionReader;
}

/**
 * Isolated trusted review path. It has no legacy answer-key fallback.
 * The Worker attempt document ID and client idempotency ID remain distinct.
 */
export async function loadTrustedAttemptReview(input: TrustedAttemptReviewInput): Promise<{
  canViewSolutions: boolean;
  attempt: TestAttempt;
  questions: TrustedReviewQuestion[];
}> {
  if (!isTrustedScoringFeatureEnabled(input.config, input.identity)) {
    throw new Error('Trusted attempt review is disabled for this session.');
  }
  if (!input.test?.id || !/^[A-Za-z0-9_-]{1,128}$/.test(input.attemptId)) {
    throw new Error('Trusted attempt review requires a valid test and attempt ID.');
  }

  // Authorize and bind the attempt before reading even the student projection.
  const review = await input.client.getAttemptReview(input.attemptId);
  const receipt = review?.attempt;
  if (!receipt || receipt.id !== input.attemptId ||
      receipt.testId !== input.test.id ||
      receipt.userId !== input.identity?.uid) {
    throw new Error('Trusted attempt review identity does not match the active student and test.');
  }
  if (typeof receipt.submissionId !== 'string' ||
      !/^[A-Za-z0-9_-]{1,128}$/.test(receipt.submissionId)) {
    throw new Error('Trusted attempt review receipt has an invalid client submission ID.');
  }

  // Reuse the strict submission receipt parser for the review's aggregate
  // attempt data. This validates the complete server-authored receipt without
  // trusting browser-computed scores or conflating the two attempt IDs.
  const trustedAttempt = parseTrustedAttemptReceipt(receipt, {
    userId: input.identity!.uid!,
    test: input.test,
    clientAttemptId: receipt.submissionId,
  });

  const questions = await loadPublishedStudentExamQuestions(input.test, {
    readDocuments: input.readQuestions,
  });
  const payload = {
    canViewSolutions: review.canViewSolutions,
    attempt: {
      id: receipt.id,
      responses: receipt.responses,
      ...(Object.prototype.hasOwnProperty.call(receipt, 'scoreBreakdown')
        ? { scoreBreakdown: receipt.scoreBreakdown }
        : {}),
    },
  } as TrustedReviewPayload;

  return {
    canViewSolutions: review.canViewSolutions,
    attempt: trustedAttempt,
    questions: buildTrustedReviewQuestions(questions, payload, input.attemptId),
  };
}
