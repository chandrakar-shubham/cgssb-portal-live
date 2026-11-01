import assert from 'node:assert/strict';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { deleteDoc, doc, setDoc, writeBatch } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { readFile } from 'node:fs/promises';
import { fetchStudentQuestionDocumentsByIds } from '../src/firebase/studentQuestionFirestoreReader';
import { auditPublishedStudentExamDefinitionsFromFirestore } from '../src/firebase/studentExamDefinitionAuditFirestore';

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

  // rules-unit-testing exposes the compat Firestore facade; the reader uses the
  // modular SDK, which unwraps this facade at runtime via getModularInstance.
  const studentDb = env.authenticatedContext('synthetic-student').firestore() as unknown as Firestore;
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

  await env.withSecurityRulesDisabled(async context => {
    const firestore = context.firestore();
    await setDoc(doc(firestore, 'studentQuestions', 'audit-q1'), {
      questionText: 'Audit question 1',
      options: [{ label: 'A', text: 'Option A' }],
    });
    await setDoc(doc(firestore, 'studentQuestions', 'audit-q2'), {
      questionText: 'Audit question 2',
      options: [{ label: 'A', text: 'Option A' }],
    });
    await setDoc(doc(firestore, 'mockTests', 'published-audit-test'), {
      id: 'published-audit-test',
      title: 'Synthetic published audit test',
      isPublished: true,
      questionCount: 2,
      sections: [{ id: 'section-1', name: 'Section 1', questionIds: ['audit-q1', 'audit-q2'] }],
    });
    await setDoc(doc(firestore, 'mockTests', 'unpublished-audit-test'), {
      id: 'unpublished-audit-test',
      title: 'Synthetic unpublished audit test',
      isPublished: false,
      questionCount: 1,
      sections: [{ id: 'section-1', name: 'Section 1', questionIds: ['audit-q1'] }],
    });
  });

  const audit = await auditPublishedStudentExamDefinitionsFromFirestore(studentDb);
  assert.equal(audit.scanned, 1, 'Firestore entry point must query published definitions only');
  assert.equal(audit.published, 1);
  assert.equal(audit.ready, 1);
  assert.equal(audit.questionIdsAttempted, 2);
  assert.equal(audit.results[0].testId, 'published-audit-test');

  await env.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), 'mockTests', 'identity-mismatch'), {
      id: 'different-embedded-id',
      title: 'Synthetic mismatched identity',
      isPublished: true,
      questionCount: 1,
      sections: [{ id: 'section-1', name: 'Section 1', questionIds: ['audit-q1'] }],
    });
  });
  await assert.rejects(
    () => auditPublishedStudentExamDefinitionsFromFirestore(studentDb),
    /identity mismatch/,
  );
  await env.withSecurityRulesDisabled(async context => {
    await deleteDoc(doc(context.firestore(), 'mockTests', 'identity-mismatch'));
  });

  const budgetAudit = await auditPublishedStudentExamDefinitionsFromFirestore(studentDb, { maxQuestionIds: 1 });
  assert.equal(budgetAudit.ready, 0);
  assert.equal(budgetAudit.blocked, 1);
  assert.equal(budgetAudit.questionIdsAttempted, 0, 'budget-deferred test must not read student projections');
  assert.equal(budgetAudit.questionIdsDeferred, 2);

  await env.withSecurityRulesDisabled(async context => {
    const firestore = context.firestore();
    let batch = writeBatch(firestore);
    let pending = 0;
    for (let index = 0; index < 501; index += 1) {
      batch.set(doc(firestore, 'mockTests', `published-overflow-${String(index).padStart(3, '0')}`), {
        id: `published-overflow-${String(index).padStart(3, '0')}`,
        title: 'Synthetic overflow definition',
        isPublished: true,
        questionCount: 0,
        sections: [],
      });
      pending += 1;
      if (pending === 500) {
        await batch.commit();
        batch = writeBatch(firestore);
        pending = 0;
      }
    }
    if (pending > 0) await batch.commit();
  });
  await assert.rejects(
    () => auditPublishedStudentExamDefinitionsFromFirestore(studentDb),
    /More than 500 published tests/,
  );

  console.log('PASS student question Firestore reader: emulator read, 30-ID chunking, and fail-closed input validation');
} finally {
  await env.cleanup();
}
