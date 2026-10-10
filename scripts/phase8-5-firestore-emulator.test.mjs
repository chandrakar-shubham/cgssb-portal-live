import { readFile } from 'node:fs/promises';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import {
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  runTransaction,
  setDoc,
  where,
} from 'firebase/firestore';

const projectId = process.env.GCLOUD_PROJECT || 'demo-cgssb-phase85';
const rules = await readFile('firestore.rules', 'utf8');
const testEnv = await initializeTestEnvironment({
  projectId,
  firestore: {
    host: '127.0.0.1',
    port: 8080,
    rules,
  },
});

const attempt = (userId, id = 'attempt-a-1') => ({
  id,
  userId,
  testId: 'phase85-test-only',
  submissionId: 'phase85-session-a',
  responses: { q1: 'A' },
  questionStatuses: { q1: 'answered' },
  correctCount: 1,
  incorrectCount: 0,
  unattemptedCount: 0,
  attemptedCount: 1,
  maxScore: 1,
  score: 1,
});

async function idempotentAttemptWrite(db, value) {
  const ref = doc(db, 'attempts', value.id);
  return runTransaction(db, async (transaction) => {
    const existing = await transaction.get(ref);
    if (existing.exists()) return existing.data();
    transaction.set(ref, value);
    return value;
  });
}

const checks = [];
async function check(name, work) {
  await work();
  checks.push(name);
  console.log('PASS ' + name);
}

try {
  await testEnv.clearFirestore();
  const studentA = testEnv.authenticatedContext('student-a', {
    firebase: { sign_in_provider: 'password' },
    email_verified: true,
  }).firestore();
  const studentB = testEnv.authenticatedContext('student-b', {
    firebase: { sign_in_provider: 'password' },
    email_verified: true,
  }).firestore();
  const anonymous = testEnv.unauthenticatedContext().firestore();

  await check('student can create their own valid attempt', () =>
    assertSucceeds(setDoc(doc(studentA, 'attempts', 'attempt-a-1'), attempt('student-a'))));

  await check('student cannot create an attempt for another user', () =>
    assertFails(setDoc(doc(studentA, 'attempts', 'attempt-cross-user'), attempt('student-b', 'attempt-cross-user'))));

  await check('student cannot mutate a committed attempt', () =>
    assertFails(setDoc(doc(studentA, 'attempts', 'attempt-a-1'), { ...attempt('student-a'), score: 0 }, { merge: true })));

  await check('another student cannot read someone else\'s attempt', () =>
    assertFails(getDoc(doc(studentB, 'attempts', 'attempt-a-1'))));

  await check('student attempt history must be owner-constrained', () =>
    assertSucceeds(getDocs(query(collection(studentA, 'attempts'), where('userId', '==', 'student-a')))));

  await check('student cannot list every user\'s attempts', () =>
    assertFails(getDocs(collection(studentA, 'attempts'))));

  await check('public catalog can be read without authentication', () =>
    assertSucceeds(getDoc(doc(anonymous, 'mockTests', 'phase85-public-read-check'))));

  await check('public catalog cannot be written by an unauthenticated visitor', () =>
    assertFails(setDoc(doc(anonymous, 'mockTests', 'phase85-forbidden-write'), { id: 'phase85-forbidden-write' })));

  await check('student can create a profile owned by them', () =>
    assertSucceeds(setDoc(doc(studentA, 'leaderboardProfiles', 'profile-a'), {
      id: 'profile-a',
      userId: 'student-a',
      source: 'practice_summary',
      scopeType: 'target',
      scopeKey: 'CGPSC',
    })));

  await check('public leaderboard query with limit 100 is allowed', () =>
    assertSucceeds(getDocs(query(collection(anonymous, 'leaderboardProfiles'), limit(100)))));

  await check('public leaderboard query above limit 100 is denied', () =>
    assertFails(getDocs(query(collection(anonymous, 'leaderboardProfiles'), limit(101)))));

  await check('repeated transaction submit returns the existing attempt without duplication', async () => {
    const first = await idempotentAttemptWrite(studentA, attempt('student-a', 'attempt-idempotent'));
    const retry = await idempotentAttemptWrite(studentA, { ...attempt('student-a', 'attempt-idempotent'), score: 0 });
    if (first.score !== 1 || retry.score !== 1) throw new Error('Retry changed the original committed attempt');
    const snap = await getDocs(query(collection(studentA, 'attempts'), where('userId', '==', 'student-a')));
    const matches = snap.docs.filter(d => d.id === 'attempt-idempotent');
    if (matches.length !== 1) throw new Error('Expected exactly one attempt document after retry');
  });

  await check('attempt history cursor pages return all records without overlap', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      const writes = [];
      for (let i = 0; i < 205; i++) {
        const id = 'attempt-page-' + String(i).padStart(3, '0');
        writes.push(setDoc(doc(adminDb, 'attempts', id), {
          ...attempt('student-a', id),
          ...(i === 0 ? {} : { submittedAt: new Date(Date.UTC(2026, 0, 1, 0, i)).toISOString() }),
        }));
      }
      await Promise.all(writes);
    });

    const allIds = [];
    let cursor;
    while (true) {
      const constraints = [
        where('userId', '==', 'student-a'),
        orderBy(documentId(), 'asc'),
        ...(cursor ? [startAfter(cursor)] : []),
        limit(100),
      ];
      const page = await getDocs(query(collection(studentA, 'attempts'), ...constraints));
      allIds.push(...page.docs.map(d => d.id));
      if (page.size < 100) break;
      cursor = page.docs[page.docs.length - 1];
    }

    const seededIds = allIds.filter(id => id.startsWith('attempt-page-'));
    if (seededIds.length !== 205) throw new Error('Expected 205 paginated attempts, got ' + seededIds.length);
    if (new Set(seededIds).size !== 205) throw new Error('Attempt cursor pages contained duplicate documents');
    if (!seededIds.includes('attempt-page-000')) throw new Error('Legacy attempt without submittedAt was omitted');
  });

  console.log(JSON.stringify({
    phase: '8.5-firestore-emulator-student-journey',
    passed: true,
    projectId,
    checksPassed: checks.length,
    checks,
    boundary: 'Firestore Emulator only. No production project, Auth users, or real student records are accessed.',
  }, null, 2));
} finally {
  await testEnv.cleanup();
}
