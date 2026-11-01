import assert from 'node:assert/strict';
import type { MockTest } from '../src/types';
import { parseTrustedAttemptReceipt } from '../src/app/trustedAttemptReceipt';

const test = {
  id: 'test-1', title: 'Demo', category: 'CGSSB', sections: [{ id: 's1', name: 'Section 1', questionIds: ['q1', 'q2'] }],
  seriesId: 'series-1', targetKey: 'cgssb',
} as MockTest;

const receipt = {
  id: 'attempt-1', userId: 'student-1', userName: 'Student', testId: 'test-1',
  testTitle: 'Demo', submittedAt: '2026-11-01T10:00:00.000Z',
  timeTakenSeconds: 90, totalDurationSeconds: 600, responses: { q1: 'A', q2: null },
  questionStatuses: { q1: 'answered', q2: 'unanswered' },
  score: 1, maxScore: 2, percentage: 50, accuracy: 100,
  correctCount: 1, incorrectCount: 0, unattemptedCount: 1, attemptedCount: 1,
  markedForReviewCount: 0, negativeMarksDeducted: 0, sectorAnalysis: [],
  submissionId: 'client-attempt-1',
};

const parsed = parseTrustedAttemptReceipt(receipt, {
  userId: 'student-1', test, clientAttemptId: 'client-attempt-1',
});
assert.equal(parsed.score, 1);
assert.equal(parsed.id, 'attempt-1');
assert.equal(parsed.category, 'CGSSB');

assert.throws(() => parseTrustedAttemptReceipt(
  { ...receipt, userId: 'another-student' },
  { userId: 'student-1', test, clientAttemptId: 'client-attempt-1' },
), /does not match/);

assert.throws(() => parseTrustedAttemptReceipt(
  { ...receipt, testId: 'another-test' },
  { userId: 'student-1', test, clientAttemptId: 'client-attempt-1' },
), /does not match/);

assert.throws(() => parseTrustedAttemptReceipt(
  { ...receipt, submissionId: 'another-attempt' },
  { userId: 'student-1', test, clientAttemptId: 'client-attempt-1' },
), /does not match/);

assert.throws(() => parseTrustedAttemptReceipt(
  { ...receipt, attemptedCount: 2 },
  { userId: 'student-1', test, clientAttemptId: 'client-attempt-1' },
), /count invariants/);

assert.throws(() => parseTrustedAttemptReceipt(
  { ...receipt, responses: { q1: 'Z', q2: null } },
  { userId: 'student-1', test, clientAttemptId: 'client-attempt-1' },
), /invalid responses/);

assert.throws(() => parseTrustedAttemptReceipt(
  { ...receipt, responses: { q1: 'A' } },
  { userId: 'student-1', test, clientAttemptId: 'client-attempt-1' },
), /do not match the test question set/);

assert.throws(() => parseTrustedAttemptReceipt(
  { ...receipt, score: '1' },
  { userId: 'student-1', test, clientAttemptId: 'client-attempt-1' },
), /invalid score/);

console.log('PASS trusted attempt receipt: validates server identity, submission scope, numeric fields, and exam count invariants');
