import assert from 'node:assert/strict';
import type { MockTest } from '../src/types';
import type { StudentQuestion } from '../src/utils/studentQuestionProjection';
import { loadTrustedAttemptReview } from '../src/app/trustedAttemptReviewOrchestrator';

const test = { id: 'test-1', sections: [{ questionIds: ['q1', 'q2'] }] } as unknown as MockTest;
const docs = [
  { id: 'q2', data: { id: 'q2', category: 'CGSSB', subject: 'GS', topic: 'Geo', difficulty: 'Easy', marks: 1, negativeMarks: 0.25, questionText: 'Q2', options: [] } },
  { id: 'q1', data: { id: 'q1', category: 'CGSSB', subject: 'GS', topic: 'History', difficulty: 'Easy', marks: 1, negativeMarks: 0.25, questionText: 'Q1', options: [] } },
];
const identity = { uid: 'student-1', isAnonymous: false };
const config = { enabled: 'true', workerUrl: 'https://trusted.example.workers.dev/' };
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
    return { canViewSolutions: false, attempt: {
      id: 'attempt-1', userId: 'student-1', testId: 'test-1',
      responses: { q1: 'B', q2: null },
    } };
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

await assert.rejects(loadTrustedAttemptReview({
  test, attemptId: 'attempt-1', identity, config, readQuestions,
  client: { async getAttemptReview() {
    return { canViewSolutions: false, attempt: {
      id: 'attempt-1', userId: 'someone-else', testId: 'test-1',
      responses: { q1: 'B', q2: null },
    } };
  } },
}), /identity does not match/);

await assert.rejects(loadTrustedAttemptReview({
  test, attemptId: 'attempt-1', identity, config, readQuestions,
  client: { async getAttemptReview() {
    return { canViewSolutions: false, attempt: {
      id: 'attempt-1', userId: 'student-1', testId: 'other-test',
      responses: { q1: 'B', q2: null },
    } };
  } },
}), /identity does not match/);

console.log('PASS trusted review orchestration: fail-closed gate, projection-only reads, exact attempt/student/test scope, no legacy fallback');
