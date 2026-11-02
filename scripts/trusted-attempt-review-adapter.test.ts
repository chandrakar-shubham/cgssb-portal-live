import assert from 'node:assert/strict';
import type { StudentQuestion } from '../src/utils/studentQuestionProjection';
import { buildTrustedReviewQuestions } from '../src/app/trustedAttemptReviewAdapter';

const questions = [
  { id: 'q1', category: 'CGSSB', subject: 'GS', topic: 'History', difficulty: 'Easy', marks: 1, negativeMarks: 0.25, questionText: 'Q1', options: [{ label: 'A', text: 'One' }, { label: 'B', text: 'Two' }] },
  { id: 'q2', category: 'CGSSB', subject: 'GS', topic: 'Geography', difficulty: 'Easy', marks: 1, negativeMarks: 0.25, questionText: 'Q2', options: [{ label: 'A', text: 'One' }, { label: 'B', text: 'Two' }] },
] as StudentQuestion[];
const base = { id: 'attempt-1', responses: { q1: 'B' as const, q2: null } };

const hidden = buildTrustedReviewQuestions(questions, { canViewSolutions: false, attempt: base }, 'attempt-1');
assert.equal(hidden.length, 2);
assert.equal('correctOption' in hidden[0], false);
assert.throws(() => buildTrustedReviewQuestions(questions, {
  canViewSolutions: false,
  attempt: { ...base, scoreBreakdown: { questionResults: [] } },
}, 'attempt-1'), /must not contain solution data/);

const released = buildTrustedReviewQuestions(questions, {
  canViewSolutions: true,
  attempt: {
    ...base,
    scoreBreakdown: { questionResults: [
      { questionId: 'q2', correctOption: 'A', explanation: 'Second explanation' },
      { questionId: 'q1', correctOption: 'B', explanationHindi: 'पहला स्पष्टीकरण' },
    ] },
  },
}, 'attempt-1');
assert.deepEqual(released.map(question => question.id), ['q1', 'q2']);
assert.equal(released[0].correctOption, 'B');
assert.equal(released[0].explanationHindi, 'पहला स्पष्टीकरण');
assert.equal(released[1].explanation, 'Second explanation');

assert.throws(() => buildTrustedReviewQuestions(questions, {
  canViewSolutions: true,
  attempt: { ...base, scoreBreakdown: { questionResults: [{ questionId: 'q1', correctOption: 'B' }] } },
}, 'attempt-1'), /incomplete question breakdown/);
assert.throws(() => buildTrustedReviewQuestions(questions, {
  canViewSolutions: true,
  attempt: { ...base, scoreBreakdown: { questionResults: [
    { questionId: 'q1', correctOption: 'B' }, { questionId: 'q1', correctOption: 'A' },
  ] } },
}, 'attempt-1'), /invalid question result/);
assert.throws(() => buildTrustedReviewQuestions(questions, {
  canViewSolutions: false,
  attempt: { id: 'attempt-1', responses: { q1: 'B' } },
}, 'attempt-1'), /do not match/);
assert.throws(() => buildTrustedReviewQuestions(questions, {
  canViewSolutions: false,
  attempt: base,
}, 'other-attempt'), /incomplete/);

console.log('PASS trusted review adapter: release gating, exact question scope, order, identity, and result validation');
