const OPTION_VALUES = new Set(["A", "B", "C", "D"]);
const MAX_BODY_BYTES = 256 * 1024;
const MAX_QUESTIONS = 500;
const ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

/** Parse and validate only untrusted request fields. Never trusts scores or question definitions. */
export async function parseAttemptSubmission(request) {
  const contentType = request.headers.get("content-type") || "";
  if (!/^application\/json(?:\s*;|\s*$)/i.test(contentType)) {
    return { ok: false, status: 415, error: "UNSUPPORTED_MEDIA_TYPE" };
  }

  const declaredLength = request.headers.get("content-length");
  if (declaredLength && (!/^\d+$/.test(declaredLength) || Number(declaredLength) > MAX_BODY_BYTES)) {
    return { ok: false, status: 413, error: "PAYLOAD_TOO_LARGE" };
  }

  let raw;
  try {
    raw = await request.text();
  } catch {
    return { ok: false, status: 400, error: "INVALID_BODY" };
  }
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
    return { ok: false, status: 413, error: "PAYLOAD_TOO_LARGE" };
  }

  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return { ok: false, status: 400, error: "INVALID_JSON" };
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, status: 400, error: "INVALID_BODY" };
  }

  const testId = body.testId;
  if (typeof testId !== "string" || !ID_PATTERN.test(testId)) {
    return { ok: false, status: 400, error: "INVALID_TEST_ID" };
  }

  const responses = body.responses;
  if (!responses || typeof responses !== "object" || Array.isArray(responses)) {
    return { ok: false, status: 400, error: "INVALID_RESPONSES" };
  }
  const entries = Object.entries(responses);
  if (entries.length > MAX_QUESTIONS) {
    return { ok: false, status: 413, error: "TOO_MANY_RESPONSES" };
  }
  for (const [questionId, answer] of entries) {
    if (!ID_PATTERN.test(questionId)) {
      return { ok: false, status: 400, error: "INVALID_QUESTION_ID" };
    }
    if (answer !== null && answer !== undefined && !OPTION_VALUES.has(answer)) {
      return { ok: false, status: 400, error: "INVALID_ANSWER_VALUE" };
    }
  }

  const clientAttemptId = body.clientAttemptId ?? body.idempotencyKey;
  if (clientAttemptId !== undefined &&
      (typeof clientAttemptId !== "string" || !ID_PATTERN.test(clientAttemptId))) {
    return { ok: false, status: 400, error: "INVALID_IDEMPOTENCY_KEY" };
  }

  const timeTakenSeconds = body.timeTakenSeconds ?? 0;
  if (!Number.isInteger(timeTakenSeconds) || timeTakenSeconds < 0 || timeTakenSeconds > 24 * 60 * 60) {
    return { ok: false, status: 400, error: "INVALID_TIME_TAKEN" };
  }

  // Explicitly ignore/reject client-controlled score and identity fields.
  for (const forbidden of ["score", "correctCount", "incorrectCount", "unattemptedCount",
    "correctOption", "answerKey", "explanation", "userId", "role", "isAdmin"]) {
    if (Object.prototype.hasOwnProperty.call(body, forbidden)) {
      return { ok: false, status: 400, error: "FORBIDDEN_CLIENT_FIELD" };
    }
  }

  return {
    ok: true,
    value: {
      testId,
      responses,
      clientAttemptId: clientAttemptId || null,
      timeTakenSeconds,
    },
  };
}
