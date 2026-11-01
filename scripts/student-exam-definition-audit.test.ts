import assert from 'node:assert/strict';
import type { MockTest } from '../src/types';
import { auditPublishedStudentExamDefinitions } from '../src/app/studentExamDefinitionAudit';
import type { StudentQuestionDocument } from '../src/app/studentExamQuestionAdapter';

const testDefinition = (id: string, questionIds: string[], questionCount = questionIds.length) => ({
  id,
  title: `Synthetic ${id}`,
  isPublished: true,
  questionCount,
  sections: [{ id: 'section-1', name: 'Section 1', questionIds }],
}) as Pick<MockTest, 'id' | 'title' | 'isPublished' | 'sections' | 'questionCount'>;

const docs = (ids: readonly string[]): StudentQuestionDocument[] => ids.map(id => ({
  id,
  data: {
    questionText: `Synthetic question ${id}`,
    options: [{ label: 'A', text: 'Option A' }],
  },
}));

const definitions = [
  testDefinition('ready-test', ['q1', 'q2']),
  testDefinition('count-mismatch', ['q3', 'q4'], 3),
  { ...testDefinition('duplicate-id', ['q5', 'q5']) },
  { ...testDefinition('unpublished-test', ['q6']), isPublished: false },
] as Pick<MockTest, 'id' | 'title' | 'isPublished' | 'sections' | 'questionCount'>[];

let readCalls = 0;
const summary = await auditPublishedStudentExamDefinitions(definitions, async ids => {
  readCalls += 1;
  return docs(ids);
});

assert.equal(summary.scanned, 4);
assert.equal(summary.published, 3);
assert.equal(summary.ready, 1);
assert.equal(summary.blocked, 2);
assert.equal(summary.questionIdsAttempted, 2, 'only IDs passed to the document reader count as attempted');
assert.equal(summary.questionIdsReserved, 6, 'invalid definitions conservatively consume reserved budget');
assert.equal(summary.questionIdsDeferred, 0);
assert.equal(readCalls, 1, 'invalid definitions must be rejected before reading projections');
assert.deepEqual(summary.results.map(result => result.status), ['ready', 'blocked', 'blocked']);
assert.equal(summary.results[1].issueCode, 'QUESTION_COUNT_MISMATCH');
assert.equal(summary.results[2].issueCode, 'DUPLICATE_TEST_QUESTION_ID');

const readFailure = await auditPublishedStudentExamDefinitions(
  [testDefinition('read-failure', ['q7'])],
  async () => { throw new Error('synthetic read failure'); },
);
assert.equal(readFailure.blocked, 1);
assert.equal(readFailure.results[0].issueCode, 'PROJECTION_READ_FAILED');
assert.equal(readFailure.questionIdsAttempted, 1);
assert.equal(readFailure.questionIdsReserved, 1);

let budgetReadCalls = 0;
const budgetSummary = await auditPublishedStudentExamDefinitions(
  [testDefinition('within-budget', ['q8', 'q9']), testDefinition('deferred', ['q10', 'q11'])],
  async ids => { budgetReadCalls += 1; return docs(ids); },
  { maxQuestionIds: 2 },
);
assert.equal(budgetSummary.ready, 1);
assert.equal(budgetSummary.blocked, 1);
assert.equal(budgetSummary.questionIdsAttempted, 2);
assert.equal(budgetSummary.questionIdsReserved, 2);
assert.equal(budgetSummary.questionIdsDeferred, 2);
assert.equal(budgetSummary.results[1].issueCode, 'AUDIT_READ_BUDGET_EXCEEDED');
assert.equal(budgetReadCalls, 1, 'deferred tests must not trigger Firestore reads');

await assert.rejects(
  () => auditPublishedStudentExamDefinitions([], async () => [], { maxQuestionIds: 25001 }),
  /between 1 and 25000/,
);

await assert.rejects(
  () => auditPublishedStudentExamDefinitions(
    Array.from({ length: 501 }, (_, index) => testDefinition(`test-${index}`, ['q'])),
    async () => [],
  ),
  /at most 500/,
);

console.log('PASS published exam audit: bounded scan, unpublished exclusion, definition validation, and projection read failure handling');
