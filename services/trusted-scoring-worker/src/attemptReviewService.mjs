import { authorizeAttemptReview } from "./attemptReviewPolicy.mjs";

const RECEIPT_FIELDS = [
  "id", "userId", "userName", "testId", "testTitle", "category",
  "submittedAt", "timeTakenSeconds", "totalDurationSeconds", "responses",
  "questionStatuses", "score", "maxScore", "percentage", "accuracy",
  "correctCount", "incorrectCount", "unattemptedCount", "attemptedCount",
  "markedForReviewCount", "negativeMarksDeducted", "sectorAnalysis",
  "submissionId",
];

/**
 * Load a review using a trusted repository, then apply ownership and release
 * policy before exposing per-question correctness. Admin status and release
 * policy must be derived server-side, never from request input.
 */
export async function loadAuthorizedAttemptReview({ uid, attemptId, repository, now = Date.now() }) {
  if (typeof uid !== "string" || uid.length === 0) {
    return { ok: false, status: 401, error: "UNAUTHENTICATED" };
  }
  if (!Number.isFinite(now)) {
    return { ok: false, status: 400, error: "INVALID_REQUEST_CLOCK" };
  }
  if (typeof attemptId !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(attemptId)) {
    return { ok: false, status: 400, error: "INVALID_ATTEMPT_ID" };
  }
  if (!repository || typeof repository.loadAttemptForReview !== "function") {
    return { ok: false, status: 503, error: "REVIEW_BACKEND_NOT_CONFIGURED" };
  }

  try {
    const record = await repository.loadAttemptForReview({ requesterUid: uid, attemptId, now });
    if (!record || !record.attempt) {
      return { ok: false, status: 404, error: "ATTEMPT_NOT_FOUND" };
    }
    const attempt = record.attempt;
    const policy = authorizeAttemptReview({
      requesterUid: uid,
      attemptOwnerUid: attempt.userId,
      isAuthorizedAdmin: record.isAuthorizedAdmin === true,
      releasePolicy: record.releasePolicy,
      now,
    });
    if (!policy.allowed) {
      return { ok: false, status: policy.status, error: policy.reason };
    }

    const result = {};
    for (const field of RECEIPT_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(attempt, field)) result[field] = attempt[field];
    }
    if (policy.canViewSolutions === true && attempt.scoreBreakdown &&
        typeof attempt.scoreBreakdown === "object") {
      result.scoreBreakdown = attempt.scoreBreakdown;
    }
    return {
      ok: true,
      status: 200,
      canViewSolutions: policy.canViewSolutions === true,
      result,
    };
  } catch {
    return { ok: false, status: 503, error: "ATTEMPT_REVIEW_UNAVAILABLE" };
  }
}
