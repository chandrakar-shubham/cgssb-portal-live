import assert from 'node:assert/strict';
import type { MockTest } from '../src/types';
import type { StudentQuestion } from '../src/utils/studentQuestionProjection';
import {
  resolvePublishedStudentExamQuestions,
  StudentExamResolutionError,
} from '../src/app/studentExamQuestionResolver';

const testDefinition = {
  id: 'test-2026',
  isPublished: true,
  questionCount: 3,
  sections: [
    { id: 's1', name: 'Section 1', questionIds: ['q-3', 'q-1'] },
    { id: 's2', name: 'Section 2', questionIds: ['q-2'] },
  ],
} as Pick<MockTest, 'id' | 'isPublished' | 'sections' | 'questionCount'>;

const question = (id: string): StudentQuestion => ({
  id,
  category: 'CGPSC',
  subject: 'Polity',
  topic: 'Constitution',
  difficulty: 'Medium',
  marks: 1,
  negativeMarks: 0.33,
  questionText: `Question ${id}`,
  options: [
    { label: 'A', text: 'Option A' },
    { label: 'B', text: 'Option B' },
  ],
} as StudentQuestion);

const resolved = resolvePublishedStudentExamQuestions(
  testDefinition,
  [question('q-1'), question('q-2'), question('q-3')],
);
assert.deepEqual(resolved.map(item => item.id), ['q-3', 'q-1', 'q-2']);
assert.equal('correctOption' in resolved[0], false);
assert.equal('explanation' in resolved[0], false);

function expectCode(
  code: StudentExamResolutionError['code'],
  operation: () => unknown,
): void {
  assert.throws(operation, error =>
    error instanceof StudentExamResolutionError && error.code === code,
  );
}

expectCode('TEST_NOT_PUBLISHED', () =>
  resolvePublishedStudentExamQuestions({ ...testDefinition, isPublished: false }, []),
);
expectCode('INVALID_TEST_DEFINITION', () =>
  resolvePublishedStudentExamQuestions({ ...testDefinition, sections: [] }, []),
);
expectCode('DUPLICATE_TEST_QUESTION_ID', () =>
  resolvePublishedStudentExamQuestions({
    ...testDefinition,
    sections: [{ id: 's1', name: 'One', questionIds: ['q-1', 'q-1'] }],
    questionCount: 2,
  }, [question('q-1')]),
);
expectCode('QUESTION_COUNT_MISMATCH', () =>
  resolvePublishedStudentExamQuestions({ ...testDefinition, questionCount: 2 }, [
    question('q-1'), question('q-2'), question('q-3'),
  ]),
);
expectCode('MISSING_PROJECTED_QUESTION', () =>
  resolvePublishedStudentExamQuestions(testDefinition, [question('q-1'), question('q-2')]),
);
expectCode('UNEXPECTED_PROJECTED_QUESTION', () =>
  resolvePublishedStudentExamQuestions(testDefinition, [
    question('q-1'), question('q-2'), question('q-3'), question('q-extra'),
  ]),
);
expectCode('DUPLICATE_PROJECTED_QUESTION', () =>
  resolvePublishedStudentExamQuestions(testDefinition, [
    question('q-1'), question('q-1'), question('q-2'), question('q-3'),
  ]),
);
expectCode('UNSAFE_STUDENT_QUESTION', () =>
  resolvePublishedStudentExamQuestions(testDefinition, [
    question('q-1'),
    { ...question('q-2'), correctOption: 'A' } as StudentQuestion,
    question('q-3'),
  ]),
);
expectCode('UNSAFE_STUDENT_QUESTION', () =>
  resolvePublishedStudentExamQuestions(testDefinition, [
    question('q-1'),
    { ...question('q-2'), options: [{ label: 'A', text: 'A', isCorrect: true } as any] },
    question('q-3'),
  ]),
);

console.log('PASS strict published student exam resolver: exact IDs, order, count, and answer-key rejection');
