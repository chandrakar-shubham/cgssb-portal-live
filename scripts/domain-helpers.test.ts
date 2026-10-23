import assert from 'node:assert/strict';
import { hasGuestUsedFreeTest, requiresProPass } from '../src/app/studentAccessPolicy';
import { canSubmitExam } from '../src/app/attemptSubmissionGuard';
import { selectPypQuestionIds } from '../src/app/pypSelection';
import { mergeUserAttemptHistory } from '../src/app/attemptHistoryMerge';
import type { MockTest, PreviousYearPaper, Question, TestAttempt, User } from '../src/types';

function question(id: string): Question {
  return { id, category: 'CGSSB', subject: 'General Studies', topic: 'History', difficulty: 'Easy', marks: 1, negativeMarks: 0.25 } as Question;
}

function attempt(id: string, userId: string): TestAttempt {
  return { id, userId } as TestAttempt;
}

const cases: Array<[string, () => void]> = [
  ['guest free-test flag accepts only the literal true value', () => {
    assert.equal(hasGuestUsedFreeTest('true'), true);
    assert.equal(hasGuestUsedFreeTest('false'), false);
    assert.equal(hasGuestUsedFreeTest(null), false);
    assert.equal(hasGuestUsedFreeTest('TRUE'), false);
  }],
  ['Pro pass is required only for Pro tests without an active pass', () => {
    assert.equal(requiresProPass(true, false), true);
    assert.equal(requiresProPass(true, true), false);
    assert.equal(requiresProPass(false, false), false);
    assert.equal(requiresProPass(undefined, false), false);
  }],
  ['exam submission requires a test and at least one question', () => {
    const test = { id: 'test-1' } as MockTest;
    assert.equal(canSubmitExam(test, [question('q1')]), true);
    assert.equal(canSubmitExam(test, []), false);
    assert.equal(canSubmitExam(null, [question('q1')]), false);
    assert.equal(canSubmitExam(undefined, [question('q1')]), false);
  }],
  ['PYP selection prefers relevant questions and preserves their order', () => {
    const paper = { id: 'pyp-1' } as PreviousYearPaper;
    assert.deepEqual(selectPypQuestionIds(paper, [question('r2'), question('r1')], [question('f1')]), ['r2', 'r1']);
  }],
  ['PYP selection falls back only when relevant questions are empty', () => {
    const paper = { id: 'pyp-1' } as PreviousYearPaper;
    assert.deepEqual(selectPypQuestionIds(paper, [], [question('f1'), question('f2')]), ['f1', 'f2']);
    assert.deepEqual(selectPypQuestionIds(paper, [], []), []);
  }],
  ['attempt history includes the persisted attempt first and deduplicates its id', () => {
    const user = { id: 'student-a' } as Pick<User, 'id'>;
    const persisted = attempt('attempt-new', 'student-a');
    const attempts = [
      attempt('attempt-old', 'student-a'),
      attempt('attempt-new', 'student-a'),
      attempt('other-student', 'student-b'),
    ];
    assert.deepEqual(
      mergeUserAttemptHistory(persisted, attempts, user).map(({ id }) => id),
      ['attempt-new', 'attempt-old'],
    );
  }],
];

let failures = 0;
for (const [name, run] of cases) {
  try {
    run();
    process.stdout.write(`PASS ${name}\n`);
  } catch (error) {
    failures += 1;
    process.stderr.write(`FAIL ${name}\n${String(error)}\n`);
  }
}

if (failures > 0) {
  throw new Error(`${failures} domain regression test(s) failed`);
}
process.stdout.write(`Passed ${cases.length} domain regression tests.\n`);
