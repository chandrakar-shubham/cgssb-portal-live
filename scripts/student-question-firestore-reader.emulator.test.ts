import assert from 'node:assert/strict';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc } from 'firebase/firestore';
import { readFile } from 'node:fs/promises';
import { fetchStudentQuestionDocumentsByIds } from '../src/firebase/studentQuestionFirestoreReader';

const projectId = 'cgssb-student-question-reader-test';
const rules = await readFile('firestore.rules', 'utf8');
const env = await initializeTestEnvironment({
  projectId,
  firestore: { rules },
});

try {
  const ids = Array.from({ length: 31 }, (_, index) => `synthetic-question-${String(index + 1).padStart(2, '0')}`);
  await env.withSecurityRulesDisabled(async context => {
    const firestore = context.firestore();
    await Promise.all(ids.map(id => setDoc(doc(firestore, 'studentQuestions', id), {
      questionText: `Synthetic question ${id}`,
      options: [{ label: 'A', text: 'Option A' }],
    })));
  });

  const studentDb = env.authenticatedContext('synthetic-student').firestore();
  const requested = [...ids].reverse();
  const documents = await fetchStudentQuestionDocumentsByIds(studentDb, requested);
  assert.equal(documents.length, 31, 'reader must span the 30-ID Firestore query boundary');
  assert.deepEqual(new Set(documents.map(document => document.id)), new Set(ids));
  assert.ok(documents.every(document => typeof document.data.questionText === 'string'));
  assert.ok(documents.every(document => !('correctOption' in document.data)));

  await assert.rejects(
    () => fetchStudentQuestionDocumentsByIds(studentDb, ['valid-id', 'valid-id']),
    /Duplicate student question document ID/,
  );
  await assert.rejects(
    () => fetchStudentQuestionDocumentsByIds(studentDb, ['invalid/id']),
    /Invalid student question document ID/,
  );
  await assert.rejects(
    () => fetchStudentQuestionDocumentsByIds(studentDb, []),
    /non-empty list/,
  );
  await assert.rejects(
    () => fetchStudentQuestionDocumentsByIds(null, ['valid-id']),
    /Firestore is not configured/,
  );

  console.log('PASS student question Firestore reader: emulator read, 30-ID chunking, and fail-closed input validation');
} finally {
  await env.cleanup();
}
