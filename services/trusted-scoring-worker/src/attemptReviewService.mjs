import { authorizeAttemptReview } from "./attemptReviewPolicy.mjs";

const RECEIPT_FIELDS = [
  "id", "userId", "userName", "testId", "testTitle", "category",
  "submittedAt", "timeTakenSeconds", "totalDurationSeconds", "responses",
  "questionStatuses", "score", "maxScore", "percentage", "accuracy",
  "correctCount", "incorrectCount", "unattemptedCount", "attemptedCount",
  "markedForReviewCount", "negativeMarksDeducted", "sectorAnalysis",
  "submissionId",
];

const QUESTION_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const ANSWERS = new Set(["A", "B", "C", "D", null]);
const QUESTION_STATUSES = new Set(["unanswered", "answered", "markedForReview", "marked_for_review"]);

function projectAnswerMap(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const result = {};
  for (const [questionId, answer] of Object.entries(value)) {
    if (QUESTION_ID_PATTERN.test(questionId) && ANSWERS.has(answer ?? null)) {
      result[questionId] = answer ?? null;
    }
  }
  return result;
}

function projectQuestionStatuses(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const result = {};
  for (const [questionId, status] of Object.entries(value)) {
    if (QUESTION_ID_PATTERN.test(questionId) && QUESTION_STATUSES.has(status)) {
      result[questionId] = status;
    }
  }
  return result;
}

function projectSectorAnalysis(value) {
  if (!Array.isArray(value)) return undefined;
  const allowed = ["subject", "total", "correct", "incorrect", "unattempted", "accuracy", "score", "maxScore"];
  return value.filter(item => item && typeof item === "object" && !Array.isArray(item)).map(item => {
    const projected = {};
    if (typeof item.subject === "string") projected.subject = item.subject.slice(0, 120);
    for (const field of allowed.slice(1)) {
      if (Number.isFinite(item[field])) projected[field] = item[field];
    }
    return projected;
  });
}

function projectAttemptReceipt(attempt) {
  const result = {};
  for (const field of RECEIPT_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(attempt, field)) continue;
    if (field === "responses") {
      const projected = projectAnswerMap(attempt.responses);
      if (projected) result.responses = projected;
    } else if (field === "questionStatuses") {
      const projected = projectQuestionStatuses(attempt.questionStatuses);
      if (projected) result.questionStatuses = projected;
    } else if (field === "sectorAnalysis") {
      const projected = projectSectorAnalysis(attempt.sectorAnalysis);
      if (projected) result.sectorAnalysis = projected;
    } else {
      const value = attempt[field];
      if (typeof value === "string" || typeof value === "boolean" ||
          (typeof value === "number" && Number.isFinite(value))) {
        result[field] = value;
      }
    }
  }
  return result;
}

function projectScoreBreakdown(value) {
  if (!value || typeof value !== "object" || !Array.isArray(value.questionResults)) return null;
  const questionResults = value.questionResults.map(item => {
    if (!item || typeof item !== "object") return null;
    const projected = {};
    for (const field of ["questionId", "subject", "status", "marks", "negativeMarks", "score"]) {
      if (Object.prototype.hasOwnProperty.call(item, field)) projected[field] = item[field];
    }
    return projected;
  }).filter(Boolean);
  return {
    ...(Number.isFinite(value.rawScore) ? { rawScore: value.rawScore } : {}),
    questionResults,
  };
}

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
    // Do not trust an adapter response that does not match the requested ID.
    if (attempt.id !== attemptId) {
      return { ok: false, status: 503, error: "ATTEMPT_REPOSITORY_SCOPE_VIOLATION" };
    }
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

    const result = projectAttemptReceipt(attempt);
    if (policy.canViewSolutions === true) {
      const scoreBreakdown = projectScoreBreakdown(attempt.scoreBreakdown);
      if (scoreBreakdown) result.scoreBreakdown = scoreBreakdown;
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
