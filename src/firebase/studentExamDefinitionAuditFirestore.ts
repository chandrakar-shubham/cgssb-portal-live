import {
  collection,
  getDocs,
  limit,
  query,
  where,
} from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import type { MockTest } from '../types';
import { auditPublishedStudentExamDefinitions, type PublishedExamAuditOptions } from '../app/studentExamDefinitionAudit';
import { fetchStudentQuestionDocumentsByIds } from './studentQuestionFirestoreReader';

const MAX_PUBLISHED_TESTS_PER_AUDIT = 500;

/**
 * Read-only production-data audit entry point.
 * Reads at most 501 published test definitions to detect overflow, then
 * validates projections using explicit question IDs only. It never reads
 * canonical /questions and never writes Firestore.
 */
export async function auditPublishedStudentExamDefinitionsFromFirestore(
  firestore: Firestore | null,
  options: PublishedExamAuditOptions = {},
) {
  if (!firestore) throw new Error('Firestore is not configured');

  const snapshot = await getDocs(query(
    collection(firestore, 'mockTests'),
    where('isPublished', '==', true),
    limit(MAX_PUBLISHED_TESTS_PER_AUDIT + 1),
  ));

  if (snapshot.size > MAX_PUBLISHED_TESTS_PER_AUDIT) {
    throw new Error('More than 500 published tests exist; split the audit into an explicitly scoped batch.');
  }

  const tests = snapshot.docs.map(document => {
    const data = document.data();
    if (data.id !== document.id) {
      throw new Error(`Published test identity mismatch for document ${document.id}.`);
    }
    return data as Pick<MockTest, 'id' | 'title' | 'isPublished' | 'sections' | 'questionCount'>;
  });

  return auditPublishedStudentExamDefinitions(
    tests,
    questionIds => fetchStudentQuestionDocumentsByIds(firestore, questionIds),
    options,
  );
}
