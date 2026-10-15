import type { MockTest } from '../types';

export function buildAttemptIdentity(input: { userId?: string; targetExam?: string; targetYear?: number; test: MockTest; submissionId?: string }) {
  const targetExam = input.targetExam || input.test.examName || input.test.title;
  const authority = String(input.test.authority || input.test.category || 'CG').toUpperCase();
  const year = input.targetYear || 2026;
  const normalizedTarget = String(targetExam).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
  const targetKey = authority + ':' + normalizedTarget + ':' + year;
  const seriesId = input.test.bundleId || input.test.id;
  const safeSubmissionId = String(input.submissionId || '').trim();
  const stableSubmissionId = safeSubmissionId || `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const attemptId = input.userId
    ? 'att-' + encodeURIComponent(input.userId + '-' + input.test.id + '-' + stableSubmissionId)
    : 'att-guest-' + encodeURIComponent(input.test.id + '-' + stableSubmissionId);
  return { targetExam, targetKey, seriesId, stableSubmissionId, attemptId };
}
