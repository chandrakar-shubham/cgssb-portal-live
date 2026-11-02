import type { MockTest, TestAttempt, QuestionPaletteStatus } from '../types';
import type { TrustedAttemptSubmission, TrustedAttemptReview } from '../services/trustedScoringClient';
import type { StudentExamQuestionReader } from './studentExamSessionQuestions';
import type { TrustedScoringIdentity, TrustedScoringRuntimeConfig } from './trustedScoringFeatureGate';
import { isTrustedScoringFeatureEnabled } from './trustedScoringFeatureGate';
import { submitTrustedExamAttempt } from './trustedExamSubmission';
import { loadTrustedAttemptReview } from './trustedAttemptReviewOrchestrator';
import type { TrustedReviewQuestion } from './trustedAttemptReviewAdapter';

export interface TrustedStudentAttemptClient {
  submitAttempt(submission: TrustedAttemptSubmission): Promise<{
    replayed: boolean;
    attempt: Record<string, unknown>;
  }>;
  getAttemptReview(attemptId: string): Promise<TrustedAttemptReview>;
}

export interface TrustedStudentAttemptJourneyInput {
  test: MockTest;
  identity: TrustedScoringIdentity | null | undefined;
  config: TrustedScoringRuntimeConfig;
  submission: {
    testId: string;
    timeTakenSeconds: number;
    responses: Record<string, 'A' | 'B' | 'C' | 'D' | null>;
    questionStatuses?: Record<string, QuestionPaletteStatus>;
    submissionId: string;
  };
  client: TrustedStudentAttemptClient;
  readQuestions?: StudentExamQuestionReader;
}

export interface TrustedStudentAttemptJourneyResult {
  attempt: TestAttempt;
  canViewSolutions: boolean;
  questions: TrustedReviewQuestion[];
  replayed: boolean;
}

/**
 * Coordinates the complete server-scored submit -> owner-scoped review journey.
 *
 * This is an isolated integration boundary; callers must not activate it in
 * production until Worker deployment, projection authorization, downstream
 * side effects, and the release gate have been independently approved.
 */
export async function submitAndLoadTrustedAttemptReview(
  input: TrustedStudentAttemptJourneyInput,
): Promise<TrustedStudentAttemptJourneyResult> {
  if (!isTrustedScoringFeatureEnabled(input.config, input.identity)) {
    throw new Error('Trusted student attempt journey is disabled for this session.');
  }
  const uid = input.identity?.uid;
  if (!uid || input.submission.testId !== input.test.id) {
    throw new Error('Trusted student attempt journey identity does not match the active test.');
  }

  const submitted = await submitTrustedExamAttempt({
    test: input.test,
    userId: uid,
    submission: input.submission,
  }, input.client);

  const reviewed = await loadTrustedAttemptReview({
    test: input.test,
    attemptId: submitted.attempt.id,
    identity: input.identity,
    config: input.config,
    client: input.client,
    readQuestions: input.readQuestions,
  });

  const receipt = reviewed.attempt;
  const submittedReceipt = submitted.attempt;
  const aggregateFields: Array<keyof TestAttempt> = [
    'id', 'userId', 'testId', 'submissionId', 'score', 'maxScore', 'percentage',
    'accuracy', 'correctCount', 'incorrectCount', 'unattemptedCount',
    'attemptedCount', 'markedForReviewCount', 'negativeMarksDeducted',
  ];
  if (aggregateFields.some(field => receipt[field] !== submittedReceipt[field])) {
    throw new Error('Trusted submit and review receipts disagree on attempt identity or score.');
  }

  const questionIds = input.test.sections.flatMap(section => section.questionIds);
  if (questionIds.some(id => receipt.responses[id] !== submittedReceipt.responses[id])) {
    throw new Error('Trusted submit and review receipts disagree on submitted answers.');
  }

  return {
    attempt: receipt,
    canViewSolutions: reviewed.canViewSolutions,
    questions: reviewed.questions,
    replayed: submitted.replayed,
  };
}
