import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './config';
import { MockTest, Question, TestAttempt, User } from '../types';
import { TestSeriesBundle } from '../data/bundleCatalog';

// Collection References
const USERS_COLLECTION = 'users';
const TESTS_COLLECTION = 'mockTests';
const QUESTIONS_COLLECTION = 'questions';
const BUNDLES_COLLECTION = 'bundles';
const ATTEMPTS_COLLECTION = 'attempts';

// ==========================================
// USER SERVICES
// ==========================================
export async function syncUserProfileToFirestore(user: User): Promise<void> {
  try {
    const userDocRef = doc(db, USERS_COLLECTION, user.id);
    await setDoc(userDocRef, {
      ...user,
      lastSyncedAt: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.warn('Could not sync user profile to Firestore:', err);
  }
}

export async function fetchUserProfileFromFirestore(userId: string): Promise<User | null> {
  try {
    const userDocRef = doc(db, USERS_COLLECTION, userId);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data() as User;
    }
    return null;
  } catch (err) {
    console.warn('Error fetching user profile from Firestore:', err);
    return null;
  }
}

// ==========================================
// MOCK TESTS SERVICES
// ==========================================
export async function fetchTestsFromFirestore(): Promise<MockTest[]> {
  try {
    const snap = await getDocs(collection(db, TESTS_COLLECTION));
    const items: MockTest[] = [];
    snap.forEach(d => {
      items.push(d.data() as MockTest);
    });
    return items;
  } catch (err) {
    console.warn('Error fetching tests from Firestore:', err);
    return [];
  }
}

export async function saveTestToFirestore(test: MockTest): Promise<void> {
  try {
    const testDocRef = doc(db, TESTS_COLLECTION, test.id);
    await setDoc(testDocRef, test, { merge: true });
  } catch (err) {
    console.warn('Error saving test to Firestore:', err);
  }
}

// ==========================================
// QUESTIONS SERVICES
// ==========================================
export async function fetchQuestionsFromFirestore(): Promise<Question[]> {
  try {
    const snap = await getDocs(collection(db, QUESTIONS_COLLECTION));
    const items: Question[] = [];
    snap.forEach(d => {
      items.push(d.data() as Question);
    });
    return items;
  } catch (err) {
    console.warn('Error fetching questions from Firestore:', err);
    return [];
  }
}

export async function saveQuestionsToFirestore(questions: Question[]): Promise<void> {
  try {
    for (const q of questions) {
      const qDocRef = doc(db, QUESTIONS_COLLECTION, q.id);
      await setDoc(qDocRef, q, { merge: true });
    }
  } catch (err) {
    console.warn('Error saving questions to Firestore:', err);
  }
}

// ==========================================
// BUNDLES SERVICES
// ==========================================
export async function fetchBundlesFromFirestore(): Promise<TestSeriesBundle[]> {
  try {
    const snap = await getDocs(collection(db, BUNDLES_COLLECTION));
    const items: TestSeriesBundle[] = [];
    snap.forEach(d => {
      items.push(d.data() as TestSeriesBundle);
    });
    return items;
  } catch (err) {
    console.warn('Error fetching bundles from Firestore:', err);
    return [];
  }
}

export async function saveBundleToFirestore(bundle: TestSeriesBundle): Promise<void> {
  try {
    const bundleDocRef = doc(db, BUNDLES_COLLECTION, bundle.id);
    await setDoc(bundleDocRef, bundle, { merge: true });
  } catch (err) {
    console.warn('Error saving bundle to Firestore:', err);
  }
}

export async function deleteBundleFromFirestore(bundleId: string): Promise<void> {
  try {
    const bundleDocRef = doc(db, BUNDLES_COLLECTION, bundleId);
    await deleteDoc(bundleDocRef);
  } catch (err) {
    console.warn('Error deleting bundle from Firestore:', err);
  }
}

export async function deleteTestFromFirestore(testId: string): Promise<void> {
  try {
    const testDocRef = doc(db, TESTS_COLLECTION, testId);
    await deleteDoc(testDocRef);
  } catch (err) {
    console.warn('Error deleting test from Firestore:', err);
  }
}

export async function deleteQuestionFromFirestore(questionId: string): Promise<void> {
  try {
    const qDocRef = doc(db, QUESTIONS_COLLECTION, questionId);
    await deleteDoc(qDocRef);
  } catch (err) {
    console.warn('Error deleting question from Firestore:', err);
  }
}

// ==========================================
// BULK DATA MIGRATION & FULL SYNC
// ==========================================
export interface MigrationSummary {
  questionsCount: number;
  testsCount: number;
  bundlesCount: number;
  attemptsCount: number;
  success: boolean;
  error?: string;
}

export async function migrateAllLocalDataToFirestore(params: {
  questions: Question[];
  tests: MockTest[];
  bundles: TestSeriesBundle[];
  attempts?: TestAttempt[];
  onProgress?: (msg: string, current: number, total: number) => void;
}): Promise<MigrationSummary> {
  const { questions, tests, bundles, attempts = [], onProgress } = params;
  let qCount = 0;
  let tCount = 0;
  let bCount = 0;
  let aCount = 0;

  try {
    const totalItems = questions.length + tests.length + bundles.length + attempts.length;
    let processed = 0;

    // 1. Sync Questions in small chunks
    for (const q of questions) {
      if (q && q.id) {
        const qRef = doc(db, QUESTIONS_COLLECTION, q.id);
        await setDoc(qRef, q, { merge: true });
        qCount++;
      }
      processed++;
      if (onProgress && processed % 10 === 0) {
        onProgress(`Migrating Questions (${processed}/${totalItems})...`, processed, totalItems);
      }
    }

    // 2. Sync Tests
    for (const t of tests) {
      if (t && t.id) {
        const tRef = doc(db, TESTS_COLLECTION, t.id);
        await setDoc(tRef, t, { merge: true });
        tCount++;
      }
      processed++;
      if (onProgress) {
        onProgress(`Migrating Mock Tests (${processed}/${totalItems})...`, processed, totalItems);
      }
    }

    // 3. Sync Bundles
    for (const b of bundles) {
      if (b && b.id) {
        const bRef = doc(db, BUNDLES_COLLECTION, b.id);
        await setDoc(bRef, b, { merge: true });
        bCount++;
      }
      processed++;
      if (onProgress) {
        onProgress(`Migrating Test Series Bundles (${processed}/${totalItems})...`, processed, totalItems);
      }
    }

    // 4. Sync Attempts
    for (const a of attempts) {
      if (a && a.id) {
        const aRef = doc(db, ATTEMPTS_COLLECTION, a.id);
        await setDoc(aRef, a, { merge: true });
        aCount++;
      }
      processed++;
    }

    if (onProgress) {
      onProgress('All collections successfully migrated to Firestore!', totalItems, totalItems);
    }

    return {
      questionsCount: qCount,
      testsCount: tCount,
      bundlesCount: bCount,
      attemptsCount: aCount,
      success: true,
    };
  } catch (err: any) {
    console.error('Migration failed:', err);
    return {
      questionsCount: qCount,
      testsCount: tCount,
      bundlesCount: bCount,
      attemptsCount: aCount,
      success: false,
      error: err?.message || 'Unknown migration error',
    };
  }
}

// ==========================================
// TEST ATTEMPTS & LEADERBOARD
// ==========================================
export async function saveAttemptToFirestore(attempt: TestAttempt): Promise<void> {
  try {
    const attemptDocRef = doc(db, ATTEMPTS_COLLECTION, attempt.id);
    await setDoc(attemptDocRef, {
      ...attempt,
      submittedAtServer: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.warn('Error saving test attempt to Firestore:', err);
  }
}

export async function fetchLeaderboardFromFirestore(testId?: string): Promise<TestAttempt[]> {
  try {
    let q = collection(db, ATTEMPTS_COLLECTION);
    const snap = await getDocs(q);
    const items: TestAttempt[] = [];
    snap.forEach(d => {
      const data = d.data() as TestAttempt;
      if (!testId || data.testId === testId) {
        items.push(data);
      }
    });
    return items.sort((a, b) => b.score - a.score);
  } catch (err) {
    console.warn('Error fetching leaderboard from Firestore:', err);
    return [];
  }
}
