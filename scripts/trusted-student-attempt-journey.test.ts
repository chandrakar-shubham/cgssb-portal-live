import assert from 'node:assert/strict';
import type { MockTest } from '../src/types';
import type { StudentQuestion } from '../src/utils/studentQuestionProjection';
import { submitAndLoadTrustedAttemptReview } from '../src/app/trustedStudentAttemptJourney';

const test = {
  id: 'test-1', title: 'Trusted journey', category: 'CGSSB',
  isPublished: true, questionCount: 2,
  sections: [{ id: 'section-1', name: 'Section 1', questionIds: ['q1', 'q2'] }],
} as unknown as MockTest;
const identity = { uid: 'student-1', isAnonymous: false };
const config = { enabled: 'true', workerUrl: 'https://trusted.example.workers.dev/' };
const questions = [
  { id: 'q1', category: 'CGSSB', subject: 'GS', topic: 'History', difficulty: 'Easy', marks: 1, negativeMarks: 0.25, questionText: 'Q1', options: [{ label: 'A', text: 'One' }, { label: 'B', text: 'Two' }] },
  { id: 'q2', category: 'CGSSB', subject: 'GS', topic: 'Geography', difficulty: 'Easy', marks: 1, negativeMarks: 0.25, questionText: 'Q2', options: [{ label: 'A', text: 'One' }, { label: 'B', text: 'Two' }] },
] as StudentQuestion[];
const receipt = {
  id: 'trusted-attempt-1', userId: 'student-1', userName: 'Student', testId: 'test-1',
  testTitle: 'Trusted journey', category: 'CGSSB', submittedAt: '2026-11-02T10:00:00.000Z',
  timeTakenSeconds: 45, totalDurationSeconds: 600,
  responses: { q1: 'B', q2: null }, questionStatuses: { q1: 'answered', q2: 'not_visited' },
  score: 1, maxScore: 2, percentage: 50, accuracy: 100,
  correctCount: 1, incorrectCount: 0, unattemptedCount: 1, attemptedCount: 1,
  markedForReviewCount: 0, negativeMarksDeducted: 0, sectorAnalysis: [],
  submissionId: 'client-session-1',
};
let submitCalls = 0;
let reviewCalls = 0;
let projectionReads = 0;
const client = {
  async submitAttempt(value: any) {
    submitCalls += 1;
    assert.equal(value.testId, 'test-1');
    assert.equal(value.clientAttemptId, 'client-session-1');
    assert.deepEqual(value.responses, Object.assign(Object.create(null), { q1: 'B', q2: null }));
    return { replayed: false, attempt: receipt };
  },
  async getAttemptReview(attemptId: string) {
    reviewCalls += 1;
    assert.equal(attemptId, 'trusted-attempt-1');
    return { canViewSolutions: false, attempt: receipt };
  },
};
const readQuestions = async (_db: unknown, ids: readonly string[]) => {
  projectionReads += 1;
  assert.deepEqual(ids, ['q1', 'q2']);
  return questions.map(question => ({ id: question.id, data: question as unknown as Record<string, unknown> }));
};

const disabled = await assert.rejects(() => submitAndLoadTrustedAttemptReview({
  test, identity, config: { ...config, enabled: 'false' },
  submission: { testId: 'test-1', timeTakenSeconds: 45, submissionId: 'client-session-1', responses: { q1: 'B' } },
  client, readQuestions,
}), /disabled/);
assert.equal(submitCalls, 0, 'disabled gate must not submit');
assert.equal(reviewCalls, 0, 'disabled gate must not load review');
assert.equal(projectionReads, 0, 'disabled gate must not read projections');

const result = await submitAndLoadTrustedAttemptReview({
  test, identity, config,
  submission: {
    testId: 'test-1', timeTakenSeconds: 45, submissionId: 'client-session-1',
    responses: { q1: 'B' },
    questionStatuses: { q1: 'answered', q2: 'not_visited' },
  },
  client, readQuestions,
});
assert.equal(submitCalls, 1);
assert.equal(reviewCalls, 1);
assert.equal(projectionReads, 1);
assert.equal(result.attempt.id, 'trusted-attempt-1');
assert.equal(result.attempt.submissionId, 'client-session-1');
assert.equal(result.attempt.score, 1, 'score must be the trusted server receipt');
assert.equal(result.canViewSolutions, false);
assert.equal(result.questions.length, 2);
assert.equal('correctOption' in result.questions[0], false);
assert.equal(result.replayed, false);

await assert.rejects(() => submitAndLoadTrustedAttemptReview({
  test, identity: { ...identity, uid: 'other-student' }, config,
  submission: { testId: 'test-1', timeTakenSeconds: 45, submissionId: 'client-session-1', responses: { q1: 'B' } },
  client, readQuestions,
}), /identity does not match/);

const inconsistentClient = {
  async submitAttempt() { return { replayed: false, attempt: receipt }; },
  async getAttemptReview() {
    return { canViewSolutions: false, attempt: { ...receipt, score: 2 } };
  },
};
await assert.rejects(() => submitAndLoadTrustedAttemptReview({
  test, identity, config,
  submission: { testId: 'test-1', timeTakenSeconds: 45, submissionId: 'client-session-1', responses: { q1: 'B' } },
  client: inconsistentClient, readQuestions,
}), /receipts disagree/);

console.log('PASS trusted student attempt journey: fail-closed gate, trusted submit, owner-bound review, projection-only questions, receipt consistency');
