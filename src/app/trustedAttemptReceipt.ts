import type { MockTest, TestAttempt } from '../types';

const ID = /^[A-Za-z0-9_-]{1,128}$/;
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

const ALLOWED_ANSWERS = new Set(['A', 'B', 'C', 'D', null]);
const ALLOWED_STATUSES = new Set(['unanswered', 'answered', 'marked_for_review', 'answered_and_marked']);

function ownDataRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Trusted attempt receipt has invalid ' + label + '.');
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new Error('Trusted attempt receipt has invalid ' + label + '.');
  }
  if (Object.getOwnPropertySymbols(value).length) {
    throw new Error('Trusted attempt receipt has invalid symbol properties.');
  }
  const copy: Record<string, unknown> = {};
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (typeof key !== 'string' || !descriptor || !descriptor.enumerable || !('value' in descriptor)) {
      throw new Error('Trusted attempt receipt has invalid property descriptors.');
    }
    copy[key] = descriptor.value;
  }
  return copy;
}

function validateQuestionMap(
  value: unknown,
  questionIds: readonly string[],
  field: 'responses' | 'questionStatuses',
): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Trusted attempt receipt has invalid ' + field + '.');
  }
  const map = ownDataRecord(value, field);
  const expectedIds = new Set(questionIds);
  if (Object.keys(map).length !== expectedIds.size || Object.keys(map).some(id => !expectedIds.has(id))) {
    throw new Error('Trusted attempt receipt ' + field + ' do not match the test question set.');
  }
  for (const [id, entry] of Object.entries(map)) {
    if (!ID.test(id) || (field === 'responses' ? !ALLOWED_ANSWERS.has(entry as string | null) : !ALLOWED_STATUSES.has(entry as string))) {
      throw new Error('Trusted attempt receipt contains invalid ' + field + ' entries.');
    }
  }
  return map;
}

/** Accept only a server-authored receipt matching the authenticated submission context. */
export function parseTrustedAttemptReceipt(
  value: unknown,
  expected: { userId: string; test: MockTest; clientAttemptId: string },
): TestAttempt {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Trusted attempt receipt is missing.');
  const raw = ownDataRecord(value, 'receipt');
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
  const questionIds = expected.test.sections.flatMap(section => section.questionIds);
  const responses = validateQuestionMap(raw.responses, questionIds, 'responses') as TestAttempt['responses'];
  const questionStatuses = validateQuestionMap(raw.questionStatuses, questionIds, 'questionStatuses') as TestAttempt['questionStatuses'];
  if (!Array.isArray(raw.sectorAnalysis)) {
    throw new Error('Trusted attempt receipt has invalid sector analysis.');
  }
  const sectorAnalysis = raw.sectorAnalysis.map((item: unknown) => {
    const sector = ownDataRecord(item, 'sector analysis');
    if (typeof sector.subject !== 'string' ||
        !['total', 'correct', 'incorrect', 'unattempted', 'accuracy', 'score', 'maxScore'].every(field => finite(sector[field]))) {
      throw new Error('Trusted attempt receipt has invalid sector analysis.');
    }
    return sector;
  });
  const totalQuestions = questionIds.length;
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
    responses,
    questionStatuses,
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
    sectorAnalysis: sectorAnalysis as unknown as TestAttempt['sectorAnalysis'],
    submissionId: expected.clientAttemptId,
    seriesId: expected.test.seriesId,
    targetKey: expected.test.targetKey,
    targetExam: expected.test.examName || expected.test.authority || expected.test.category,
  };
}
