import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';

const env = await initializeTestEnvironment({
  projectId: 'cgssb-rules-test',
  firestore: { rules: readFileSync('firestore.rules', 'utf8') },
});

try {
  const anonymous = env.unauthenticatedContext().firestore();
  const user = env.authenticatedContext('student-123').firestore();

  await assertSucceeds(getDocs(collection(anonymous, 'mockTests')));
  await assertSucceeds(getDoc(doc(anonymous, 'questions', 'q1')));

  await assertFails(setDoc(doc(anonymous, 'questions', 'q1'), { id: 'q1' }));
  await assertFails(setDoc(doc(user, 'questions', 'q1'), { id: 'q1' }));
  await assertFails(setDoc(doc(user, 'mockTests', 't1'), { id: 't1' }));

  await assertFails(getDoc(doc(user, 'users', 'different-user')));
  await assertSucceeds(getDoc(doc(user, 'users', 'student-123')));

  await assertFails(setDoc(doc(user, 'attempts', 'attempt-1'), {
    id: 'attempt-1',
    userId: 'student-123',
  }));
  await assertFails(getDoc(doc(user, 'attempts', 'attempt-1')));

  await assertFails(getDoc(doc(user, 'unexpectedCollection', 'x')));
} finally {
  await env.cleanup();
}
