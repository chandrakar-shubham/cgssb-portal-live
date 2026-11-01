import assert from 'node:assert/strict';
import type { MockTest } from '../src/types';
import type { StudentQuestion } from '../src/utils/studentQuestionProjection';
import {
  loadPublishedStudentExamQuestions,
  type StudentExamQuestionReader,
} from '../src/app/studentExamSessionQuestions';
import { StudentExamResolutionError } from '../src/app/studentExamQuestionResolver';

const testDefinition = {
  id: 'test-2026',
  isPublished: true,
  questionCount: 2,
  sections: [{ id: 's1', name: 'Section 1', questionIds: ['q-2', 'q-1'] }],
} as MockTest;

const question = (id: string): StudentQuestion => ({
  id,
  subject: 'Polity',
  questionText: `Question ${id}`,
  marks: 1,
  negativeMarks: 0.33,
  options: [
    { label: 'A', text: 'Option A' },
    { label: 'B', text: 'Option B' },
  ],
} as StudentQuestion);

const docs = [question('q-1'), question('q-2')].map(item => ({
  id: item.id,
  data: item as unknown as Record<string, unknown>,
}));

let requestedIds: readonly string[] = [];
const reader: StudentExamQuestionReader = async (_firestore, ids) => {
  requestedIds = ids;
  return docs;
};

const resolved = await loadPublishedStudentExamQuestions(testDefinition, {
  firestore: null,
  readDocuments: reader,
});
assert.deepEqual(requestedIds, ['q-2', 'q-1']);
assert.deepEqual(resolved.map(item => item.id), ['q-2', 'q-1']);
assert.equal('correctOption' in resolved[0], false);
assert.equal('explanation' in resolved[0], false);

async function expectCode(
  code: StudentExamResolutionError['code'],
  operation: () => Promise<unknown>,
): Promise<void> {
  await assert.rejects(operation, error =>
    error instanceof StudentExamResolutionError && error.code === code,
  );
}

await expectCode('UNSAFE_STUDENT_QUESTION', () =>
  loadPublishedStudentExamQuestions(testDefinition, {
    firestore: null,
    readDocuments: async () => [{
      id: 'q-1',
      data: { ...question('q-1'), correctOption: 'A' } as unknown as Record<string, unknown>,
    }, docs[1]],
  }),
);

await expectCode('UNSAFE_STUDENT_QUESTION', () =>
  loadPublishedStudentExamQuestions(testDefinition, {
    firestore: null,
    readDocuments: async () => [{
      id: 'q-1',
      data: { ...question('q-1'), unexpectedAdminFlag: true } as unknown as Record<string, unknown>,
    }, docs[1]],
  }),
);

await expectCode('UNSAFE_STUDENT_QUESTION', () =>
  loadPublishedStudentExamQuestions(testDefinition, {
    firestore: null,
    readDocuments: async () => [{
      id: 'q-wrong',
      data: question('q-1') as unknown as Record<string, unknown>,
    }, docs[1]],
  }),
);

await expectCode('MISSING_PROJECTED_QUESTION', () =>
  loadPublishedStudentExamQuestions(testDefinition, {
    firestore: null,
    readDocuments: async () => [docs[0]],
  }),
);

console.log('PASS published student exam loader: projection-only reads, exact order, identity, schema, and answer-key rejection');
