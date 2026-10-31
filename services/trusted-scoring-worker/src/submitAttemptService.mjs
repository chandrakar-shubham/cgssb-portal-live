import { buildAttemptIdempotency } from "./attemptIdempotency.mjs";
import { buildTrustedTestDefinition } from "./trustedTestDefinition.mjs";
import { scoreTrustedTestDefinition } from "./trustedScoring.mjs";

/**
 * Submission receipts deliberately omit per-question correctness and scoring
 * details. Those belong behind the separately authorized solution-release
 * endpoint; aggregate score/counts remain available for the immediate result.
 */
const SUBMISSION_RECEIPT_FIELDS = [
  "id", "userId", "userName", "testId", "testTitle", "category",
  "submittedAt", "timeTakenSeconds", "totalDurationSeconds", "responses",
  "questionStatuses", "score", "maxScore", "percentage", "accuracy",
  "correctCount", "incorrectCount", "unattemptedCount", "attemptedCount",
  "markedForReviewCount", "negativeMarksDeducted", "sectorAnalysis", "submissionId",
];

function toSubmissionReceipt(attempt) {
  if (!attempt || typeof attempt !== "object" || Array.isArray(attempt)) return null;
  const receipt = {};
  for (const field of SUBMISSION_RECEIPT_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(attempt, field)) continue;
    const value = attempt[field];
    if (field === "responses" || field === "questionStatuses") {
      if (!value || typeof value !== "object" || Array.isArray(value)) continue;
      const projected = {};
      for (const [questionId, entry] of Object.entries(value)) {
        if (!/^[A-Za-z0-9_-]{1,128}$/.test(questionId)) continue;
        if (field === "responses" && [null, "A", "B", "C", "D"].includes(entry ?? null)) {
          projected[questionId] = entry ?? null;
        } else if (field === "questionStatuses" &&
            ["unanswered", "answered", "markedForReview", "marked_for_review"].includes(entry)) {
          projected[questionId] = entry;
        }
      }
      receipt[field] = projected;
    } else if (field === "sectorAnalysis") {
      if (!Array.isArray(value)) continue;
      receipt[field] = value.filter(item => item && typeof item === "object" && !Array.isArray(item)).map(item => {
        const projected = {};
        if (typeof item.subject === "string") projected.subject = item.subject.slice(0, 120);
        for (const metric of ["total", "correct", "incorrect", "unattempted", "accuracy", "score", "maxScore"]) {
          if (Number.isFinite(item[metric])) projected[metric] = item[metric];
        }
        return projected;
      });
    } else if (typeof value === "string" || typeof value === "boolean" ||
        (typeof value === "number" && Number.isFinite(value))) {
      receipt[field] = value;
    }
  }
  return receipt;
}

/**
 * Dependency-injected trusted submission orchestration. No credentials or
 * database client live here; repository methods must enforce trusted access.
 */
export async function submitTrustedAttempt({ uid, submission, repository, now = Date.now() }) {
  if (typeof uid !== "string" || uid.length === 0) {
    return { ok: false, status: 401, error: "UNAUTHENTICATED" };
  }
  if (!Number.isFinite(now)) {
    return { ok: false, status: 400, error: "INVALID_REQUEST_CLOCK" };
  }
  if (!submission || typeof submission.testId !== "string" ||
      !submission.responses || typeof submission.responses !== "object" ||
      Array.isArray(submission.responses) ||
      typeof submission.clientAttemptId !== "string" ||
      !Number.isInteger(submission.timeTakenSeconds)) {
    return { ok: false, status: 400, error: "INVALID_SUBMISSION" };
  }
  const required = [
    "findAttemptByIdempotencyKey", "loadPublishedTest",
    "loadCanonicalQuestions", "loadStudentProfile", "authorizeAttempt", "commitAttemptAtomically",
  ];
  if (!repository || required.some(method => typeof repository[method] !== "function")) {
    return { ok: false, status: 503, error: "SCORING_BACKEND_NOT_CONFIGURED" };
  }

  let idempotency;
  try {
    idempotency = await buildAttemptIdempotency({
      uid, testId: submission.testId, clientAttemptId: submission.clientAttemptId,
      responses: submission.responses, timeTakenSeconds: submission.timeTakenSeconds,
    });
  } catch {
    return { ok: false, status: 400, error: "INVALID_SUBMISSION" };
  }

  try {
    const prior = await repository.findAttemptByIdempotencyKey({
      uid, testId: submission.testId, documentId: idempotency.documentId,
    });
    if (prior) {
      if (prior.result?.userId !== uid || prior.result?.testId !== submission.testId) {
        return { ok: false, status: 503, error: "ATTEMPT_REPOSITORY_SCOPE_VIOLATION" };
      }
      if (prior.fingerprint !== idempotency.fingerprint) {
        return { ok: false, status: 409, error: "IDEMPOTENCY_KEY_REUSED" };
      }
      return { ok: true, status: 200, replayed: true, result: toSubmissionReceipt(prior.result) };
    }

    const test = await repository.loadPublishedTest(submission.testId);
    if (!test || test.isPublished !== true) {
      return { ok: false, status: 404, error: "TEST_NOT_FOUND" };
    }
    // Authorize against trusted test metadata before loading canonical questions.
    // This avoids unnecessary answer-key reads for users who cannot take the test.
    if (await repository.authorizeAttempt({ uid, test, now }) !== true) {
      return { ok: false, status: 403, error: "ATTEMPT_NOT_AUTHORIZED" };
    }

    // Validate the authenticated user's profile before any canonical answer-key
    // reads. Authorization above should enforce eligibility; this is an
    // independent identity-integrity check against the trusted profile record.
    const profile = await repository.loadStudentProfile(uid);
    if (!profile || profile.id !== uid ||
        typeof profile.name !== "string" || !profile.name.trim()) {
      return { ok: false, status: 403, error: "STUDENT_PROFILE_UNAVAILABLE" };
    }

    const questionIds = Array.isArray(test.sections)
      ? test.sections.flatMap(section => Array.isArray(section?.questionIds) ? section.questionIds : [])
      : [];
    const definition = buildTrustedTestDefinition({
      test, questions: await repository.loadCanonicalQuestions(questionIds),
    });
    const score = scoreTrustedTestDefinition(definition, submission.responses);
    const questionStatuses = Object.fromEntries(definition.questionIds.map(questionId => [
      questionId,
      submission.responses[questionId] == null ? "unanswered" : "answered",
    ]));
    const sectorMap = new Map();
    for (const result of score.questionResults) {
      const current = sectorMap.get(result.subject) || {
        subject: result.subject, total: 0, correct: 0, incorrect: 0,
        unattempted: 0, rawScore: 0, maxScore: 0,
      };
      current.total += 1;
      current.maxScore += result.marks;
      if (result.status === "correct") current.correct += 1;
      else if (result.status === "incorrect") current.incorrect += 1;
      else current.unattempted += 1;
      current.rawScore += result.score;
      sectorMap.set(result.subject, current);
    }
    const sectorAnalysis = [...sectorMap.values()].map(item => ({
      subject: item.subject,
      total: item.total,
      correct: item.correct,
      incorrect: item.incorrect,
      unattempted: item.unattempted,
      accuracy: item.correct + item.incorrect > 0
        ? Number(((item.correct / (item.correct + item.incorrect)) * 100).toFixed(2)) : 0,
      score: Number(Math.max(0, item.rawScore).toFixed(2)),
      maxScore: Number(item.maxScore.toFixed(2)),
    }));
    const attempt = {
      id: idempotency.documentId,
      userId: uid,
      userName: profile.name.trim(),
      testId: definition.testId,
      testTitle: definition.title,
      category: test.category,
      submittedAt: new Date(now).toISOString(),
      timeTakenSeconds: submission.timeTakenSeconds,
      totalDurationSeconds: definition.durationMinutes * 60,
      responses: { ...submission.responses },
      questionStatuses,
      score: score.netScore,
      maxScore: score.maxScore,
      percentage: score.percentage,
      accuracy: score.accuracy,
      correctCount: score.correctCount,
      incorrectCount: score.incorrectCount,
      unattemptedCount: score.unattemptedCount,
      attemptedCount: score.attemptedCount,
      markedForReviewCount: 0,
      negativeMarksDeducted: score.negDeduction,
      sectorAnalysis,
      submissionId: submission.clientAttemptId,
      scoreBreakdown: {
        rawScore: score.rawScore,
        questionResults: score.questionResults,
      },
    };
    const committed = await repository.commitAttemptAtomically({
      uid, testId: definition.testId, documentId: idempotency.documentId,
      fingerprint: idempotency.fingerprint, attempt,
    });
    if (!committed || committed.kind === "conflict") {
      return { ok: false, status: 409, error: "IDEMPOTENCY_KEY_REUSED" };
    }
    if (committed.kind === "replay") {
      if (committed.result?.userId !== uid || committed.result?.testId !== definition.testId) {
        return { ok: false, status: 503, error: "ATTEMPT_REPOSITORY_SCOPE_VIOLATION" };
      }
      if (committed.fingerprint !== idempotency.fingerprint) {
        return { ok: false, status: 409, error: "IDEMPOTENCY_KEY_REUSED" };
      }
      return { ok: true, status: 200, replayed: true, result: toSubmissionReceipt(committed.result) };
    }
    if (committed.kind !== "created" || !committed.result) {
      return { ok: false, status: 503, error: "ATTEMPT_PERSISTENCE_FAILED" };
    }
    // Treat the adapter's create response as untrusted until its scope matches
    // the authenticated caller and selected test; never return a cross-scope result.
    if (committed.result.userId !== uid || committed.result.testId !== definition.testId) {
      return { ok: false, status: 503, error: "ATTEMPT_REPOSITORY_SCOPE_VIOLATION" };
    }
    return { ok: true, status: 201, replayed: false, result: toSubmissionReceipt(committed.result) };
  } catch (error) {
    if (error?.message === "TEST_NOT_PUBLISHED" || error?.message === "TRUSTED_TEST_QUESTION_MISSING") {
      return { ok: false, status: 503, error: "TEST_CONFIGURATION_INVALID" };
    }
    return { ok: false, status: 503, error: "ATTEMPT_SUBMISSION_UNAVAILABLE" };
  }
}
