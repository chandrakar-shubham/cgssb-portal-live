import { buildAttemptIdempotency } from "./attemptIdempotency.mjs";
import { buildTrustedTestDefinition } from "./trustedTestDefinition.mjs";
import { scoreTrustedTestDefinition } from "./trustedScoring.mjs";

/**
 * Dependency-injected trusted submission orchestration. No credentials or
 * database client live here; repository methods must enforce trusted access.
 */
export async function submitTrustedAttempt({ uid, submission, repository, now = Date.now() }) {
  if (typeof uid !== "string" || uid.length === 0) {
    return { ok: false, status: 401, error: "UNAUTHENTICATED" };
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
    "loadCanonicalQuestions", "authorizeAttempt", "commitAttemptAtomically",
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
      if (prior.fingerprint !== idempotency.fingerprint) {
        return { ok: false, status: 409, error: "IDEMPOTENCY_KEY_REUSED" };
      }
      return { ok: true, status: 200, replayed: true, result: prior.result };
    }

    const test = await repository.loadPublishedTest(submission.testId);
    if (!test || test.isPublished !== true) {
      return { ok: false, status: 404, error: "TEST_NOT_FOUND" };
    }
    const questionIds = Array.isArray(test.sections)
      ? test.sections.flatMap(section => Array.isArray(section?.questionIds) ? section.questionIds : [])
      : [];
    const definition = buildTrustedTestDefinition({
      test, questions: await repository.loadCanonicalQuestions(questionIds),
    });

    if (await repository.authorizeAttempt({ uid, test, now }) !== true) {
      return { ok: false, status: 403, error: "ATTEMPT_NOT_AUTHORIZED" };
    }

    const score = scoreTrustedTestDefinition(definition, submission.responses);
    const attempt = {
      testId: definition.testId,
      testTitle: definition.title,
      timeTakenSeconds: submission.timeTakenSeconds,
      questionCount: definition.questionIds.length,
      responses: { ...submission.responses },
      score,
    };
    const committed = await repository.commitAttemptAtomically({
      uid, testId: definition.testId, documentId: idempotency.documentId,
      fingerprint: idempotency.fingerprint, attempt,
    });
    if (!committed || committed.kind === "conflict") {
      return { ok: false, status: 409, error: "IDEMPOTENCY_KEY_REUSED" };
    }
    if (committed.kind === "replay") {
      if (committed.fingerprint !== idempotency.fingerprint) {
        return { ok: false, status: 409, error: "IDEMPOTENCY_KEY_REUSED" };
      }
      return { ok: true, status: 200, replayed: true, result: committed.result };
    }
    if (committed.kind !== "created" || !committed.result) {
      return { ok: false, status: 503, error: "ATTEMPT_PERSISTENCE_FAILED" };
    }
    return { ok: true, status: 201, replayed: false, result: committed.result };
  } catch (error) {
    if (error?.message === "TEST_NOT_PUBLISHED" || error?.message === "TRUSTED_TEST_QUESTION_MISSING") {
      return { ok: false, status: 503, error: "TEST_CONFIGURATION_INVALID" };
    }
    return { ok: false, status: 503, error: "ATTEMPT_SUBMISSION_UNAVAILABLE" };
  }
}
