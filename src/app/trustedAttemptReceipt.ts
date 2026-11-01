import type { MockTest, TestAttempt } from '../types';

const ID = /^[A-Za-z0-9_-]{1,128}$/;
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

/** Accept only a server-authored receipt matching the authenticated submission context. */
export function parseTrustedAttemptReceipt(
  value: unknown,
  expected: { userId: string; test: MockTest; clientAttemptId: string },
): TestAttempt {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Trusted attempt receipt is missing.');
  const raw = value as Record<string, unknown>;
  if (raw.userId !== expected.userId || raw.testId !== expected.test.id ||
      raw.submissionId !== expected.clientAttemptId) {
    throw new Error('Trusted attempt receipt does not match the current student, test, or submission.');
  }
  const stringFields = ['id', 'userName', 'testTitle', 'submittedAt'];
  for (const field of stringFields) {
    if (typeof raw[field] !== 'string' || !(raw[field] as string).trim()) {
      throw new Error('Trusted attempt receipt has invalid ' + field + '.');
    }
  }
  if (!ID.test(raw.id as string) || !Number.isFinite(Date.parse(raw.submittedAt as string))) {
    throw new Error('Trusted attempt receipt has invalid identity or timestamp.');
  }
  const numericFields = [
    'timeTakenSeconds', 'totalDurationSeconds', 'score', 'maxScore', 'percentage',
    'accuracy', 'correctCount', 'incorrectCount', 'unattemptedCount', 'attemptedCount',
    'markedForReviewCount', 'negativeMarksDeducted',
  ];
  for (const field of numericFields) {
    if (!finite(raw[field])) throw new Error('Trusted attempt receipt has invalid ' + field + '.');
  }
  if (!raw.responses || typeof raw.responses !== 'object' || Array.isArray(raw.responses) ||
      !raw.questionStatuses || typeof raw.questionStatuses !== 'object' || Array.isArray(raw.questionStatuses) ||
      !Array.isArray(raw.sectorAnalysis)) {
    throw new Error('Trusted attempt receipt has invalid response or analysis data.');
  }
  const totalQuestions = expected.test.sections.reduce((count, section) => count + section.questionIds.length, 0);
  if ((raw.attemptedCount as number) !== (raw.correctCount as number) + (raw.incorrectCount as number) ||
      (raw.attemptedCount as number) + (raw.unattemptedCount as number) !== totalQuestions) {
    throw new Error('Trusted attempt receipt violates exam count invariants.');
  }
  return {
    id: raw.id as string,
    userId: expected.userId,
    userName: raw.userName as string,
    testId: expected.test.id,
    testTitle: raw.testTitle as string,
    category: expected.test.category,
    submittedAt: raw.submittedAt as string,
    timeTakenSeconds: raw.timeTakenSeconds as number,
    totalDurationSeconds: raw.totalDurationSeconds as number,
    responses: raw.responses as TestAttempt['responses'],
    questionStatuses: raw.questionStatuses as TestAttempt['questionStatuses'],
    score: raw.score as number,
    maxScore: raw.maxScore as number,
    percentage: raw.percentage as number,
    accuracy: raw.accuracy as number,
    correctCount: raw.correctCount as number,
    incorrectCount: raw.incorrectCount as number,
    unattemptedCount: raw.unattemptedCount as number,
    attemptedCount: raw.attemptedCount as number,
    markedForReviewCount: raw.markedForReviewCount as number,
    negativeMarksDeducted: raw.negativeMarksDeducted as number,
    sectorAnalysis: raw.sectorAnalysis as TestAttempt['sectorAnalysis'],
    submissionId: expected.clientAttemptId,
    seriesId: expected.test.seriesId,
    targetKey: expected.test.targetKey,
    targetExam: expected.test.examName || expected.test.authority || expected.test.category,
  };
}
