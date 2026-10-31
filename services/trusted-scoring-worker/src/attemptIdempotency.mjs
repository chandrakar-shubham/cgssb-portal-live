const encoder = new TextEncoder();
const ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const ANSWER_VALUES = new Set(["A", "B", "C", "D", null]);

function assertNonEmptyString(value, name, maxLength = 256) {
  if (typeof value !== "string" || value.length === 0 || value.length > maxLength) {
    throw new TypeError(`invalid ${name}`);
  }
}

function assertIdentifier(value, name) {
  if (typeof value !== "string" || !ID_PATTERN.test(value)) {
    throw new TypeError(`invalid ${name}`);
  }
}

function canonicalResponses(responses) {
  if (!responses || typeof responses !== "object" || Array.isArray(responses)) {
    throw new TypeError("responses must be an object");
  }
  const entries = Object.entries(responses);
  if (entries.length > 500) throw new TypeError("too many responses");
  for (const [questionId, answer] of entries) {
    assertIdentifier(questionId, "question id");
    if (!ANSWER_VALUES.has(answer ?? null)) throw new TypeError("invalid response value");
  }
  // Question IDs are ASCII-safe identifiers; code-point ordering is stable
  // across runtimes/locales, unlike locale-sensitive collation.
  return entries
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .map(([questionId, answer]) => [questionId, answer ?? null]);
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Build a user- and test-scoped idempotency document key plus a request
 * fingerprint. The repository MUST transactionally compare the fingerprint
 * before replaying a prior result; same key + different fingerprint is a 409.
 * This helper does not itself persist data or guarantee idempotency.
 */
export async function buildAttemptIdempotency({ uid, testId, clientAttemptId, responses, timeTakenSeconds }) {
  assertNonEmptyString(uid, "authenticated uid");
  assertIdentifier(testId, "test id");
  assertIdentifier(clientAttemptId, "client attempt id");
  if (!Number.isInteger(timeTakenSeconds) || timeTakenSeconds < 0 || timeTakenSeconds > 86400) {
    throw new TypeError("invalid timeTakenSeconds");
  }

  const canonical = JSON.stringify({
    uid,
    testId,
    responses: canonicalResponses(responses),
    timeTakenSeconds,
  });
  const scope = await sha256Hex(JSON.stringify([uid, testId, clientAttemptId]));
  const fingerprint = await sha256Hex(canonical);
  return {
    documentId: `attempt_${scope}`,
    fingerprint,
  };
}
