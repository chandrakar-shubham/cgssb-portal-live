import assert from 'node:assert/strict';
import type { MockTest } from '../src/types';
import { submitTrustedExamAttempt } from '../src/app/trustedExamSubmission';

const test = {
  id: 'test-1', title: 'Mock', category: 'CGSSB',
  sections: [{ id: 'section-1', name: 'Section 1', questionIds: ['q1', 'q2'] }],
} as MockTest;

const receipt = {
  id: 'attempt-1', userId: 'student-1', userName: 'Student', testId: 'test-1',
  testTitle: 'Mock', submittedAt: '2026-11-01T10:00:00.000Z',
  timeTakenSeconds: 45, totalDurationSeconds: 600,
  responses: { q1: 'B', q2: null }, questionStatuses: { q1: 'answered', q2: 'unanswered' },
  score: 1, maxScore: 2, percentage: 50, accuracy: 100,
  correctCount: 1, incorrectCount: 0, unattemptedCount: 1, attemptedCount: 1,
  markedForReviewCount: 0, negativeMarksDeducted: 0, sectorAnalysis: [],
  submissionId: 'session-123',
};

let captured: any;
const client = {
  async submitAttempt(value: any) {
    captured = value;
    return { replayed: true, attempt: receipt };
  },
};

const result = await submitTrustedExamAttempt({
  test, userId: 'student-1',
  submission: {
    testId: 'test-1', timeTakenSeconds: 45, submissionId: 'session-123',
    responses: { q1: 'B' },
  },
}, client);

assert.deepEqual(captured, {
  testId: 'test-1', clientAttemptId: 'session-123', timeTakenSeconds: 45,
  responses: { q1: 'B', q2: null },
});
assert.equal(result.attempt.score, 1);
assert.equal(result.replayed, true);

await assert.rejects(() => submitTrustedExamAttempt({
  test, userId: 'student-1',
  submission: { testId: 'other-test', timeTakenSeconds: 45, submissionId: 'session-123', responses: {} },
}, client), /does not match/);

await assert.rejects(() => submitTrustedExamAttempt({
  test, userId: 'student-1',
  submission: { testId: 'test-1', timeTakenSeconds: 45, submissionId: 'session-123', responses: { foreign: 'A' } },
}, client), /outside the active test/);

console.log('PASS trusted exam submission orchestration: exact question scope, unanswered normalization, and server receipt validation');
