import test from 'node:test';
import assert from 'node:assert/strict';
import type { TestAttempt } from '../src/types';
import { mergeStudentAttemptHistory } from '../src/app/trustedAttemptHistory';

function attempt(id: string, userId = 'student-1', submittedAt = '2026-11-01T10:00:00.000Z'): TestAttempt {
  return { id, userId, userName: 'Student', testId: 'test-1', testTitle: 'Test', category: 'CGSSB',
    submittedAt, timeTakenSeconds: 10, totalDurationSeconds: 60, responses: {}, questionStatuses: {},
    score: 1, maxScore: 2, percentage: 50, accuracy: 100, correctCount: 1, incorrectCount: 0,
    unattemptedCount: 0, markedForReviewCount: 0, negativeMarksDeducted: 0, sectorAnalysis: [] };
}

test('merges complete legacy and trusted histories, preferring trusted duplicates', () => {
  const legacy = [attempt('same', 'student-1', '2026-10-30T10:00:00.000Z'), attempt('legacy')];
  const trusted = [attempt('same', 'student-1', '2026-11-01T10:00:00.000Z'), attempt('trusted', 'student-1', '2026-10-31T10:00:00.000Z')];
  const result = mergeStudentAttemptHistory(legacy, trusted, 'student-1');
  // The duplicate takes the trusted timestamp (Nov 1); legacy is Nov 1 too,
  // and the ID tie-break is descending, so "same" precedes "legacy".
  assert.deepEqual(result.map(item => item.id), ['same', 'legacy', 'trusted']);
  assert.equal(result[0].submittedAt, '2026-11-01T10:00:00.000Z');
});

test('filters foreign-owner records and rejects missing authenticated identity', () => {
  const result = mergeStudentAttemptHistory([attempt('mine'), attempt('foreign', 'victim')], [], 'student-1');
  assert.deepEqual(result.map(item => item.id), ['mine']);
  assert.throws(() => mergeStudentAttemptHistory([], [], ''), /Authenticated student identity/);
});
