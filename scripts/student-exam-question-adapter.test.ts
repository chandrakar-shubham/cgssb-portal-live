import assert from 'node:assert/strict';
import type { MockTest } from '../src/types';
import {
  loadPublishedStudentExamQuestions,
  type StudentQuestionDocument,
} from '../src/app/studentExamQuestionAdapter';
import { StudentExamResolutionError } from '../src/app/studentExamQuestionResolver';

const definition = {
  id: 'published-test',
  isPublished: true,
  questionCount: 3,
  sections: [
    { id: 'a', name: 'A', questionIds: ['q3', 'q1'] },
    { id: 'b', name: 'B', questionIds: ['q2'] },
  ],
} as Pick<MockTest, 'id' | 'isPublished' | 'sections' | 'questionCount'>;

const document = (id: string, extra: Record<string, unknown> = {}): StudentQuestionDocument => ({
  id,
  data: {
    category: 'CGPSC',
    subject: 'Polity',
    topic: 'Constitution',
    difficulty: 'Medium',
    marks: 1,
    negativeMarks: 0.25,
    questionText: `Question ${id}`,
    options: [{ label: 'A', text: 'One' }, { label: 'B', text: 'Two' }],
    ...extra,
  },
});

const source = [document('q1'), document('q2'), document('q3')];
let requested: readonly string[] = [];
const reader = async (ids: readonly string[]) => {
  requested = ids;
  return source;
};

const loaded = await loadPublishedStudentExamQuestions(definition, reader);
assert.deepEqual(requested, ['q3', 'q1', 'q2']);
assert.deepEqual(loaded.map(q => q.id), ['q3', 'q1', 'q2']);
assert.equal('correctOption' in loaded[0], false);
assert.equal('explanation' in loaded[0], false);
assert.equal('unapprovedInternalField' in loaded[0], false);

function expectCode(code: StudentExamResolutionError['code'], operation: () => Promise<unknown>) {
  return assert.rejects(operation(), error =>
    error instanceof StudentExamResolutionError && error.code === code,
  );
}

await expectCode('TEST_NOT_PUBLISHED', () =>
  loadPublishedStudentExamQuestions({ ...definition, isPublished: false }, reader),
);
await expectCode('DUPLICATE_TEST_QUESTION_ID', () =>
  loadPublishedStudentExamQuestions({
    ...definition,
    sections: [{ id: 'a', name: 'A', questionIds: ['q1', 'q1'] }],
    questionCount: 2,
  }, reader),
);
await expectCode('MISSING_PROJECTED_QUESTION', () =>
  loadPublishedStudentExamQuestions(definition, async () => [document('q1'), document('q2')]),
);
await expectCode('UNEXPECTED_PROJECTED_QUESTION', () =>
  loadPublishedStudentExamQuestions(definition, async () => [
    ...source, document('not-assigned'),
  ]),
);
await expectCode('DUPLICATE_PROJECTED_QUESTION', () =>
  loadPublishedStudentExamQuestions(definition, async () => [
    document('q1'), document('q1'), document('q2'), document('q3'),
  ]),
);
await expectCode('UNSAFE_STUDENT_QUESTION', () =>
  loadPublishedStudentExamQuestions(definition, async () => [
    document('q1'), document('q2', { correctOption: 'A' }), document('q3'),
  ]),
);
await expectCode('UNSAFE_STUDENT_QUESTION', () =>
  loadPublishedStudentExamQuestions(definition, async () => [
    document('q1'), document('q2', { options: [{ text: 'x', isCorrect: true }] }), document('q3'),
  ]),
);
await expectCode('UNSAFE_STUDENT_QUESTION', () =>
  loadPublishedStudentExamQuestions(definition, async () => [
    { ...document('q1'), data: { ...document('q1').data, id: 'different-id' } },
    document('q2'), document('q3'),
  ]),
);
await assert.rejects(
  () => loadPublishedStudentExamQuestions(definition, async () => { throw new Error('Firestore unavailable'); }),
  /Firestore unavailable/,
);

console.log('PASS student exam adapter: exact published IDs, fail-closed reads, identity validation, sanitization');
