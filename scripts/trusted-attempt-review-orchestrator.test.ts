import assert from 'node:assert/strict';
import type { MockTest } from '../src/types';
import type { StudentQuestion } from '../src/utils/studentQuestionProjection';
import { loadTrustedAttemptReview } from '../src/app/trustedAttemptReviewOrchestrator';

const test = { id: 'test-1', title: 'Test 1', category: 'CGSSB', isPublished: true, questionCount: 2, sections: [{ questionIds: ['q1', 'q2'] }] } as unknown as MockTest;
const docs = [
  { id: 'q2', data: { id: 'q2', category: 'CGSSB', subject: 'GS', topic: 'Geo', difficulty: 'Easy', marks: 1, negativeMarks: 0.25, questionText: 'Q2', options: [] } },
  { id: 'q1', data: { id: 'q1', category: 'CGSSB', subject: 'GS', topic: 'History', difficulty: 'Easy', marks: 1, negativeMarks: 0.25, questionText: 'Q1', options: [] } },
];
const identity = { uid: 'student-1', isAnonymous: false };
const config = { enabled: 'true', workerUrl: 'https://trusted.example.workers.dev/' };
const trustedReceipt = {
  id: 'attempt-1', userId: 'student-1', userName: 'Student', testId: 'test-1',
  testTitle: 'Test 1', category: 'CGSSB', submittedAt: '2026-11-01T10:00:00.000Z',
  timeTakenSeconds: 90, totalDurationSeconds: 600, responses: { q1: 'B', q2: null },
  questionStatuses: { q1: 'answered', q2: 'unanswered' },
  score: 1, maxScore: 2, percentage: 50, accuracy: 100,
  correctCount: 1, incorrectCount: 0, unattemptedCount: 1, attemptedCount: 1,
  markedForReviewCount: 0, negativeMarksDeducted: 0, sectorAnalysis: [],
  submissionId: 'client-submission-1',
};
let reads = 0;
let apiCalls = 0;
const readQuestions = async (_db: unknown, ids: readonly string[]) => {
  reads += 1;
  assert.deepEqual(ids, ['q1', 'q2']);
  return docs;
};
const client = {
  async getAttemptReview(attemptId: string) {
    apiCalls += 1;
    assert.equal(attemptId, 'attempt-1');
    return { canViewSolutions: false, attempt: trustedReceipt };
  },
};

await assert.rejects(loadTrustedAttemptReview({
  test, attemptId: 'attempt-1', identity, config: { ...config, enabled: 'false' },
  client, readQuestions,
}), /disabled/);
assert.equal(reads, 0, 'disabled gate must not read question projections');
assert.equal(apiCalls, 0, 'disabled gate must not call the Worker');

const hidden = await loadTrustedAttemptReview({ test, attemptId: 'attempt-1', identity, config, client, readQuestions });
assert.equal(reads, 1);
assert.equal(apiCalls, 1);
assert.deepEqual(hidden.questions.map((question: StudentQuestion) => question.id), ['q1', 'q2']);
assert.equal('correctOption' in hidden.questions[0], false);
assert.equal(hidden.attempt.id, 'attempt-1', 'trusted document ID is preserved');
assert.equal(hidden.attempt.submissionId, 'client-submission-1', 'idempotency ID is preserved separately');
assert.equal(hidden.attempt.score, 1, 'aggregate score comes from the trusted receipt');

const readsBeforeUnauthorizedReview = reads;
await assert.rejects(loadTrustedAttemptReview({
  test, attemptId: 'attempt-1', identity, config, readQuestions,
  client: { async getAttemptReview() {
    return { canViewSolutions: false, attempt: { ...trustedReceipt, userId: 'someone-else' } };
  } },
}), /identity does not match/);
assert.equal(reads, readsBeforeUnauthorizedReview, 'unauthorized attempt must be rejected before projection reads');

await assert.rejects(loadTrustedAttemptReview({
  test, attemptId: 'attempt-1', identity, config, readQuestions,
  client: { async getAttemptReview() {
    return { canViewSolutions: false, attempt: { ...trustedReceipt, testId: 'other-test' } };
  } },
}), /identity does not match/);

await assert.rejects(loadTrustedAttemptReview({
  test, attemptId: 'attempt-1', identity, config, readQuestions,
  client: { async getAttemptReview() {
    return { canViewSolutions: false, attempt: { ...trustedReceipt, submissionId: '' } };
  } },
}), /invalid client submission ID/);

console.log('PASS trusted review orchestration: fail-closed gate, full trusted receipt parsing, distinct attempt IDs, projection-only reads, exact student/test scope');
