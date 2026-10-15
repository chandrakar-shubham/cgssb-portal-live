import type { MockTest, QuestionPaletteStatus, TestAttempt } from '../types';
import type { User } from '../types';
import type { ExamScore } from './examScoring';
import { buildAttemptIdentity } from './attemptIdentity';
import { countMarkedForReview } from './attemptReviewStats';

type AttemptSubmission = {
  timeTakenSeconds: number;
  responses: Record<string, 'A' | 'B' | 'C' | 'D' | null>;
  questionStatuses: Record<string, QuestionPaletteStatus>;
  submissionId: string;
};

export function createTestAttempt(test: MockTest, user: Pick<User, 'id' | 'name' | 'targetExam' | 'targetYear'> | null | undefined, submission: AttemptSubmission, score: ExamScore): TestAttempt {
  const { targetExam, targetKey, seriesId, stableSubmissionId, attemptId } = buildAttemptIdentity({
    userId: user?.id,
    targetExam: user?.targetExam,
    targetYear: user?.targetYear,
    test,
    submissionId: submission.submissionId,
  });
  return {
    id: attemptId,
    testId: test.id,
    testTitle: test.title,
    category: test.category,
    userId: user?.id || 'guest',
    userName: user?.name || 'Aspirant Student',
    submittedAt: new Date().toISOString(),
    timeTakenSeconds: submission.timeTakenSeconds,
    totalDurationSeconds: (test.durationMinutes || 90) * 60,
    score: score.netScore,
    maxScore: score.maxScore,
    percentage: score.percentage,
    accuracy: score.accuracy,
    correctCount: score.correctCount,
    incorrectCount: score.incorrectCount,
    unattemptedCount: score.unattemptedCount,
    attemptedCount: score.attemptedCount,
    negativeMarksDeducted: score.negDeduction,
    responses: submission.responses,
    questionStatuses: submission.questionStatuses,
    markedForReviewCount: countMarkedForReview(submission.questionStatuses),
    sectorAnalysis: score.sectorAnalysis,
    seriesId,
    targetKey,
    targetExam,
    submissionId: stableSubmissionId,
  };
}
