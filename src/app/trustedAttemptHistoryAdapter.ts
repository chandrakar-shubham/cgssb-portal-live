import type { ExamCategory, QuestionPaletteStatus, SectorAnalysis, TestAttempt } from '../types';
import { mergeStudentAttemptHistory } from './trustedAttemptHistory';

const ID = /^[A-Za-z0-9_-]{1,128}$/;
const CATEGORIES = new Set<ExamCategory>(['CGSSB', 'CGPSC', 'SWAMI_ATMANAND', 'CENTRAL_EXAMS', 'TEACHER_RECRUITMENT']);
const ANSWERS = new Set(['A', 'B', 'C', 'D', null]);
const STATUSES = new Set<QuestionPaletteStatus>([
  'not_visited', 'unanswered', 'answered', 'marked_for_review', 'answered_and_marked',
]);
const NUMERIC_FIELDS = [
  'timeTakenSeconds', 'totalDurationSeconds', 'score', 'maxScore', 'percentage',
  'accuracy', 'correctCount', 'incorrectCount', 'unattemptedCount',
  'markedForReviewCount', 'negativeMarksDeducted',
] as const;

function plainRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Trusted history has invalid ' + label + '.');
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new Error('Trusted history has invalid ' + label + '.');
  }
  if (Object.getOwnPropertySymbols(value).length) {
    throw new Error('Trusted history has symbol properties.');
  }
  const result: Record<string, unknown> = Object.create(null);
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (typeof key !== 'string' || !descriptor || !descriptor.enumerable || !('value' in descriptor)) {
      throw new Error('Trusted history has unsafe property descriptors.');
    }
    result[key] = descriptor.value;
  }
  return result;
}

/** Convert the allowlisted network DTO into the strict app-level attempt shape. */
export function parseTrustedAttemptHistoryRecord(value: unknown, authenticatedUid: string): TestAttempt {
  if (!authenticatedUid) throw new Error('Authenticated student identity is required for trusted history.');
  const raw = plainRecord(value, 'attempt');
  const allowed = new Set([
    'id', 'userId', 'userName', 'testId', 'testTitle', 'category', 'submittedAt',
    ...NUMERIC_FIELDS, 'attemptedCount', 'responses', 'questionStatuses', 'sectorAnalysis',
    'submissionId', 'seriesId', 'targetKey', 'targetExam',
  ]);
  if (Object.keys(raw).some(key => !allowed.has(key))) {
    throw new Error('Trusted history attempt contains fields outside the approved DTO.');
  }
  for (const field of ['id', 'userId', 'userName', 'testId', 'testTitle', 'submittedAt'] as const) {
    if (typeof raw[field] !== 'string' || !(raw[field] as string).trim()) {
      throw new Error('Trusted history attempt has invalid ' + field + '.');
    }
  }
  if (!ID.test(raw.id as string) || !ID.test(raw.testId as string) ||
      raw.userId !== authenticatedUid || !Number.isFinite(Date.parse(raw.submittedAt as string)) ||
      !CATEGORIES.has(raw.category as ExamCategory)) {
    throw new Error('Trusted history attempt identity or timestamp is invalid.');
  }
  for (const field of NUMERIC_FIELDS) {
    if (typeof raw[field] !== 'number' || !Number.isFinite(raw[field])) {
      throw new Error('Trusted history attempt has invalid ' + field + '.');
    }
  }
  if (raw.attemptedCount !== undefined &&
      (typeof raw.attemptedCount !== 'number' || !Number.isFinite(raw.attemptedCount))) {
    throw new Error('Trusted history attempt has invalid attemptedCount.');
  }

  const responses = plainRecord(raw.responses, 'responses');
  const statuses = plainRecord(raw.questionStatuses, 'question statuses');
  const questionIds = Object.keys(responses);
  if (questionIds.length < 1 || questionIds.length > 500 ||
      questionIds.some(id => !ID.test(id)) ||
      Object.keys(statuses).length !== questionIds.length ||
      questionIds.some(id => !Object.prototype.hasOwnProperty.call(statuses, id)) ||
      Object.values(responses).some(answer => !ANSWERS.has(answer as string | null)) ||
      Object.values(statuses).some(status => !STATUSES.has(status as QuestionPaletteStatus))) {
    throw new Error('Trusted history response and palette maps are invalid or inconsistent.');
  }
  for (const id of questionIds) {
    const answer = responses[id];
    const status = statuses[id] as QuestionPaletteStatus;
    if ((answer !== null && status !== 'answered' && status !== 'answered_and_marked') ||
        (answer === null && (status === 'answered' || status === 'answered_and_marked'))) {
      throw new Error('Trusted history response and palette status disagree.');
    }
  }
  const attemptedCount = (raw.attemptedCount as number | undefined) ??
    (raw.correctCount as number) + (raw.incorrectCount as number);
  const markedCount = Object.values(statuses).filter(status =>
    status === 'marked_for_review' || status === 'answered_and_marked',
  ).length;
  if (attemptedCount !== (raw.correctCount as number) + (raw.incorrectCount as number) ||
      attemptedCount + (raw.unattemptedCount as number) !== questionIds.length ||
      markedCount !== (raw.markedForReviewCount as number)) {
    throw new Error('Trusted history attempt violates question-count invariants.');
  }

  if (!Array.isArray(raw.sectorAnalysis) || raw.sectorAnalysis.length > 500) {
    throw new Error('Trusted history attempt has invalid sector analysis.');
  }
  const sectorAnalysis = raw.sectorAnalysis.map(item => {
    const sector = plainRecord(item, 'sector analysis');
    for (const field of ['subject']) {
      if (typeof sector[field] !== 'string') throw new Error('Trusted history sector analysis is invalid.');
    }
    for (const field of ['total', 'correct', 'incorrect', 'unattempted', 'accuracy', 'score', 'maxScore']) {
      if (typeof sector[field] !== 'number' || !Number.isFinite(sector[field])) {
        throw new Error('Trusted history sector analysis is invalid.');
      }
    }
    if (sector.timeSpentSeconds !== undefined &&
        (typeof sector.timeSpentSeconds !== 'number' || !Number.isFinite(sector.timeSpentSeconds))) {
      throw new Error('Trusted history sector analysis is invalid.');
    }
    return sector as unknown as SectorAnalysis;
  });

  for (const field of ['submissionId', 'seriesId', 'targetKey', 'targetExam'] as const) {
    if (raw[field] !== undefined && typeof raw[field] !== 'string') {
      throw new Error('Trusted history attempt has invalid ' + field + '.');
    }
  }
  if (raw.submissionId !== undefined && !ID.test(raw.submissionId as string)) {
    throw new Error('Trusted history attempt has invalid submissionId.');
  }

  return {
    id: raw.id as string,
    userId: authenticatedUid,
    userName: raw.userName as string,
    testId: raw.testId as string,
    testTitle: raw.testTitle as string,
    category: raw.category as ExamCategory,
    submittedAt: raw.submittedAt as string,
    timeTakenSeconds: raw.timeTakenSeconds as number,
    totalDurationSeconds: raw.totalDurationSeconds as number,
    responses: responses as TestAttempt['responses'],
    questionStatuses: statuses as TestAttempt['questionStatuses'],
    score: raw.score as number,
    maxScore: raw.maxScore as number,
    percentage: raw.percentage as number,
    accuracy: raw.accuracy as number,
    correctCount: raw.correctCount as number,
    incorrectCount: raw.incorrectCount as number,
    unattemptedCount: raw.unattemptedCount as number,
    attemptedCount,
    markedForReviewCount: raw.markedForReviewCount as number,
    negativeMarksDeducted: raw.negativeMarksDeducted as number,
    sectorAnalysis,
    ...(typeof raw.submissionId === 'string' ? { submissionId: raw.submissionId } : {}),
    ...(typeof raw.seriesId === 'string' ? { seriesId: raw.seriesId } : {}),
    ...(typeof raw.targetKey === 'string' ? { targetKey: raw.targetKey } : {}),
    ...(typeof raw.targetExam === 'string' ? { targetExam: raw.targetExam } : {}),
  };
}

export interface TrustedHistoryLister {
  listAllMyAttempts(): Promise<Record<string, unknown>[]>;
}

/**
 * Load and merge the entire trusted history with legacy history.
 * A trusted API or DTO failure is surfaced; callers must not silently render
 * a legacy-only partial list as if it were complete.
 */
export async function loadMergedStudentAttemptHistory(input: {
  legacyAttempts: readonly TestAttempt[];
  authenticatedUid: string;
  client: TrustedHistoryLister;
}): Promise<TestAttempt[]> {
  if (!input.authenticatedUid) throw new Error('Authenticated student identity is required for attempt history.');
  const rawTrusted = await input.client.listAllMyAttempts();
  if (!Array.isArray(rawTrusted)) throw new Error('Trusted attempt history response is invalid.');
  const trusted = rawTrusted.map(record => parseTrustedAttemptHistoryRecord(record, input.authenticatedUid));
  return mergeStudentAttemptHistory(input.legacyAttempts, trusted, input.authenticatedUid);
}
