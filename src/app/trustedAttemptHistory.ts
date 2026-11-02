import type { TestAttempt } from '../types';

/**
 * Merge already-validated trusted receipts with legacy history without
 * truncating either source. Trusted records win duplicate IDs so a legacy
 * client-authored document cannot shadow a server-authored receipt.
 */
export function mergeStudentAttemptHistory(
  legacyAttempts: readonly TestAttempt[],
  trustedAttempts: readonly TestAttempt[],
  authenticatedUid: string,
): TestAttempt[] {
  if (typeof authenticatedUid !== 'string' || !authenticatedUid) {
    throw new Error('Authenticated student identity is required for attempt history.');
  }
  const byId = new Map<string, TestAttempt>();
  for (const attempt of legacyAttempts) {
    if (attempt?.userId !== authenticatedUid || typeof attempt.id !== 'string' || !attempt.id) continue;
    byId.set(attempt.id, attempt);
  }
  for (const attempt of trustedAttempts) {
    if (attempt?.userId !== authenticatedUid || typeof attempt.id !== 'string' || !attempt.id) continue;
    byId.set(attempt.id, attempt);
  }
  return [...byId.values()].sort((a, b) =>
    String(b.submittedAt || '').localeCompare(String(a.submittedAt || '')) ||
    String(b.id || '').localeCompare(String(a.id || ''))
  );
}
