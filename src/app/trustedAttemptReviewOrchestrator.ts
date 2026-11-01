import type { MockTest } from '../types';
import { loadPublishedStudentExamQuestions, type StudentExamQuestionReader } from './studentExamSessionQuestions';
import { buildTrustedReviewQuestions, type TrustedReviewQuestion, type TrustedReviewPayload } from './trustedAttemptReviewAdapter';
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

/** Isolated trusted review path. It has no legacy answer-key fallback. */
export async function loadTrustedAttemptReview(input: TrustedAttemptReviewInput): Promise<{
  canViewSolutions: boolean;
  questions: TrustedReviewQuestion[];
}> {
  if (!isTrustedScoringFeatureEnabled(input.config, input.identity)) {
    throw new Error('Trusted attempt review is disabled for this session.');
  }
  if (!input.test?.id || !/^[A-Za-z0-9_-]{1,128}$/.test(input.attemptId)) {
    throw new Error('Trusted attempt review requires a valid test and attempt ID.');
  }

  const questions = await loadPublishedStudentExamQuestions(input.test, {
    readDocuments: input.readQuestions,
  });
  const review = await input.client.getAttemptReview(input.attemptId);
  const attempt = review?.attempt;
  if (!attempt || attempt.id !== input.attemptId ||
      attempt.testId !== input.test.id ||
      attempt.userId !== input.identity?.uid) {
    throw new Error('Trusted attempt review identity does not match the active student and test.');
  }

  const payload = {
    canViewSolutions: review.canViewSolutions,
    attempt: {
      id: attempt.id,
      responses: attempt.responses,
      ...(Object.prototype.hasOwnProperty.call(attempt, 'scoreBreakdown')
        ? { scoreBreakdown: attempt.scoreBreakdown }
        : {}),
    },
  } as TrustedReviewPayload;

  return {
    canViewSolutions: review.canViewSolutions,
    questions: buildTrustedReviewQuestions(questions, payload, input.attemptId),
  };
}
