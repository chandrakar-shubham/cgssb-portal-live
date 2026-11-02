import {
  collection,
  documentId,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';

export interface StudentQuestionDocument {
  id: string;
  data: Record<string, unknown>;
}

/**
 * Read only explicit document IDs from the public, student-safe projection.
 * The Firestore instance is injected so this exact query boundary can be
 * exercised against the Firestore Emulator without production credentials.
 */
export async function fetchStudentQuestionDocumentsByIds(
  firestore: Firestore | null,
  questionIds: readonly string[],
): Promise<StudentQuestionDocument[]> {
  if (!firestore) throw new Error('Firestore is not configured');
  if (!Array.isArray(questionIds) || questionIds.length === 0 || questionIds.length > 500) {
    throw new Error('A non-empty list of at most 500 explicit question IDs is required');
  }

  const seen = new Set<string>();
  for (const id of questionIds) {
    if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(id)) {
      throw new Error('Invalid student question document ID');
    }
    if (seen.has(id)) throw new Error('Duplicate student question document ID');
    seen.add(id);
  }

  const ids = [...questionIds];
  const chunks: string[][] = [];
  for (let index = 0; index < ids.length; index += 30) {
    chunks.push(ids.slice(index, index + 30));
  }

  const snapshots = await Promise.all(chunks.map(async chunk => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        getDocs(query(
          collection(firestore, 'studentQuestions'),
          where(documentId(), 'in', chunk),
        )),
        new Promise<never>((_, reject) => {
          timeout = setTimeout(() => reject(new Error('Student question read timed out')), 5000);
        }),
      ]);
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  }));

  return snapshots.flatMap(snapshot => snapshot.docs.map(document => ({
    id: document.id,
    data: document.data() as Record<string, unknown>,
  })));
}
