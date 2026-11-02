import assert from 'node:assert/strict';
import type { TestAttempt } from '../src/types';
import {
  loadMergedStudentAttemptHistory,
  parseTrustedAttemptHistoryRecord,
} from '../src/app/trustedAttemptHistoryAdapter';

const trusted = {
  id: 'trusted-1', userId: 'student-1', userName: 'Student', testId: 'test-1',
  testTitle: 'Test 1', category: 'CGSSB', submittedAt: '2026-11-02T10:00:00.000Z',
  timeTakenSeconds: 30, totalDurationSeconds: 600,
  responses: { q1: 'B', q2: null },
  questionStatuses: { q1: 'answered', q2: 'not_visited' },
  score: 1, maxScore: 2, percentage: 50, accuracy: 100,
  correctCount: 1, incorrectCount: 0, unattemptedCount: 1, attemptedCount: 1,
  markedForReviewCount: 0, negativeMarksDeducted: 0, sectorAnalysis: [],
  submissionId: 'submission-1', targetKey: 'cgssb', targetExam: 'CGSSB',
};
const legacy = {
  ...trusted,
  id: 'legacy-1',
  submittedAt: '2026-11-01T10:00:00.000Z',
} as TestAttempt;
const duplicateLegacy = { ...legacy, id: 'trusted-1', score: 0 } as TestAttempt;

const parsed = parseTrustedAttemptHistoryRecord(trusted, 'student-1');
assert.equal(parsed.id, 'trusted-1');
assert.equal(parsed.attemptedCount, 1);
assert.equal(parsed.responses.q1, 'B');

const merged = await loadMergedStudentAttemptHistory({
  legacyAttempts: [legacy, duplicateLegacy, { ...legacy, userId: 'other-student' }],
  authenticatedUid: 'student-1',
  client: { async listAllMyAttempts() { return [trusted]; } },
});
assert.deepEqual(merged.map(attempt => attempt.id), ['trusted-1', 'legacy-1']);
assert.equal(merged[0].score, 1, 'trusted receipt must override a legacy duplicate');
assert.equal(merged.every(attempt => attempt.userId === 'student-1'), true);

assert.throws(() => parseTrustedAttemptHistoryRecord({ ...trusted, userId: 'other-student' }, 'student-1'), /identity or timestamp/);
assert.throws(() => parseTrustedAttemptHistoryRecord({
  ...trusted, questionStatuses: { q1: 'unanswered', q2: 'not_visited' },
}, 'student-1'), /response and palette status disagree/);
assert.throws(() => parseTrustedAttemptHistoryRecord({
  ...trusted, markedForReviewCount: 1,
}, 'student-1'), /question-count invariants/);
assert.throws(() => parseTrustedAttemptHistoryRecord({
  ...trusted, scoreBreakdown: {},
}, 'student-1'), /outside the approved DTO/);
assert.throws(() => parseTrustedAttemptHistoryRecord({
  ...trusted, sectorAnalysis: [{ subject: 'GS', total: 2, correct: 1, incorrect: 0, unattempted: 1, accuracy: 100, score: 1, maxScore: 2, answerKey: 'B' }],
}, 'student-1'), /sector analysis is invalid/);

await assert.rejects(() => loadMergedStudentAttemptHistory({
  legacyAttempts: [legacy],
  authenticatedUid: 'student-1',
  client: { async listAllMyAttempts() { throw new Error('trusted history unavailable'); } },
}), /trusted history unavailable/);

console.log('PASS trusted history adapter: strict DTO validation, full-history merge, owner scope, trusted duplicate precedence, and outage propagation');
