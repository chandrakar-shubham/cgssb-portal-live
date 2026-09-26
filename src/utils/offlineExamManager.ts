/**
 * Offline Exam Manager & Batch Transaction Engine
 * 
 * 1. Pre-loads test questions into student's device storage before exam starts
 * 2. 100% zero-network exam execution (saves every click locally, zero HTTP requests)
 * 3. Single-batch atomic submission to server
 * 4. Resilient Offline Submission Queue (syncs automatically when network reconnects)
 */

import { MockTest, Question, QuestionPaletteStatus, TestAttempt } from '../types';

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
 * 2. Queue offline submission when network is unreachable at submit time
 */
export function queueOfflineSubmission(submission: Omit<PendingSubmission, 'id' | 'timestamp' | 'synced'>): PendingSubmission {
  const pendingItem: PendingSubmission = {
    ...submission,
    id: `pending-att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
    synced: false,
  };

  try {
    const queue = getPendingSubmissions();
    // Avoid duplicates for same test
    const updated = queue.filter(q => q.testId !== submission.testId);
    updated.unshift(pendingItem);
    localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('[OfflineExamManager] Failed to queue offline submission:', err);
  }

  return pendingItem;
}

export function getPendingSubmissions(): PendingSubmission[] {
  try {
    const raw = localStorage.getItem(PENDING_QUEUE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (_) {}
  return [];
}

export function removePendingSubmission(id: string): void {
  try {
    const queue = getPendingSubmissions();
    const updated = queue.filter(q => q.id !== id);
    localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(updated));
  } catch (_) {}
}

/**
 * 3. Atomic Transaction Sync: Sync all queued offline attempts with server
 */
export async function syncPendingSubmissions(
  onAttemptSynced?: (attempt: TestAttempt, solutions?: Question[]) => void
): Promise<{ syncedCount: number; errors: number }> {
  const queue = getPendingSubmissions();
  if (queue.length === 0) return { syncedCount: 0, errors: 0 };

  let syncedCount = 0;
  let errors = 0;

  for (const item of queue) {
    try {
      const response = await fetch(`/api/tests/${item.testId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: item.userId,
          userName: item.userName,
          timeTakenSeconds: item.timeTakenSeconds,
          responses: item.responses,
          questionStatuses: item.questionStatuses,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.attempt) {
          removePendingSubmission(item.id);
          clearCachedTestBundle(item.testId);
          syncedCount++;
          if (onAttemptSynced) {
            onAttemptSynced(data.attempt, data.solutions);
          }
        } else {
          errors++;
        }
      } else {
        errors++;
      }
    } catch (err) {
      console.warn(`[OfflineExamManager] Sync failed for pending attempt ${item.id}:`, err);
      errors++;
    }
  }

  return { syncedCount, errors };
}

/**
 * 4. Register automatic network reconnection sync listener
 */
export function initOfflineAutoSync(
  onAttemptSynced?: (attempt: TestAttempt, solutions?: Question[]) => void
): () => void {
  const handleOnline = () => {
    console.log('[OfflineExamManager] Internet connection detected! Attempting batch sync...');
    syncPendingSubmissions(onAttemptSynced);
  };

  window.addEventListener('online', handleOnline);

  // Also check on init if online
  if (navigator.onLine && getPendingSubmissions().length > 0) {
    syncPendingSubmissions(onAttemptSynced);
  }

  return () => {
    window.removeEventListener('online', handleOnline);
  };
}
