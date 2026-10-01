/**
 * Offline Exam Manager & Batch Transaction Engine
 * 
 * 1. Pre-loads test questions into student's device storage before exam starts
 * 2. 100% zero-network exam execution (saves every click locally, zero HTTP requests)
 * 3. Single-batch atomic submission to server
 * 4. Resilient Offline Submission Queue (syncs automatically when network reconnects)
 */

import { MockTest, Question } from '../types';

export interface PendingSubmission {
  id: string;
  testId: string;
  testTitle: string;
  userId: string;
  userName: string;
  timeTakenSeconds: number;
  responses: Record<string, 'A' | 'B' | 'C' | 'D' | null>;
  questionStatuses: Record<string, QuestionPaletteStatus>;
  timestamp: number;
  synced: boolean;
}

const PENDING_QUEUE_KEY = 'cgssb_pending_exam_submissions';
const CACHE_PREFIX = 'cgssb_offline_test_bundle_';

/**
 * 1. Cache complete test structure and questions onto student device
 */
export function cacheTestBundleForDevice(test: MockTest, questions: Question[]): void {
  try {
    const key = `${CACHE_PREFIX}${test.id}`;
    // Store only questions related to this test
    const relevantIds = new Set<string>();
    test.sections.forEach(s => s.questionIds.forEach(id => relevantIds.add(id)));

    const testQuestions = questions
      .filter(q => relevantIds.size === 0 || relevantIds.has(q.id))
      .map(q => {
        // Strip answer key from client-cached questions for exam integrity
        const { correctOption, explanation, explanationHindi, ...sanitized } = q;
        return sanitized as Question;
      });

    const bundle = {
      test,
      questions: testQuestions,
      cachedAt: Date.now(),
    };

    localStorage.setItem(key, JSON.stringify(bundle));
  } catch (err) {
    console.warn('[OfflineExamManager] LocalStorage caching warning:', err);
  }
}

/**
 * Retrieve cached test bundle from student device
 */
export function getCachedTestBundle(testId: string): { test: MockTest; questions: Question[] } | null {
  try {
    const key = `${CACHE_PREFIX}${testId}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('[OfflineExamManager] Could not read cached test:', err);
  }
  return null;
}

/**
 * Clean up test bundle after completed submission
 */
export function clearCachedTestBundle(testId: string): void {
  try {
    localStorage.removeItem(`${CACHE_PREFIX}${testId}`);
    localStorage.removeItem(`cgssb_active_exam_${testId}`);
  } catch (_) {}
}

/**
 * Legacy submission queue removed.
 * Submission is now committed directly to Firestore by App.tsx using a
 * stable submissionId and a Firestore transaction. Keeping a second HTTP
 * submission path here could create duplicate or conflicting attempts.
 */
