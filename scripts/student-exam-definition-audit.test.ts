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

await assert.rejects(
  () => auditPublishedStudentExamDefinitions(
    Array.from({ length: 501 }, (_, index) => testDefinition(`test-${index}`, ['q'])),
    async () => [],
  ),
  /at most 500/,
);

console.log('PASS published exam audit: bounded scan, unpublished exclusion, definition validation, and projection read failure handling');
