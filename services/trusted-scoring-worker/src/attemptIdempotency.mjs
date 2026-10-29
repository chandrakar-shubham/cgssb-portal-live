const encoder = new TextEncoder();

function assertNonEmptyString(value, name, maxLength = 256) {
  if (typeof value !== "string" || value.length === 0 || value.length > maxLength) {
    throw new TypeError(`invalid ${name}`);
  }
}

function canonicalResponses(responses) {
  if (!responses || typeof responses !== "object" || Array.isArray(responses)) {
    throw new TypeError("responses must be an object");
  }
  // Question IDs are ASCII-safe identifiers; code-point ordering is stable
  // across runtimes/locales, unlike localeCompare for collation-sensitive keys.
  return Object.entries(responses)
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
  assertNonEmptyString(testId, "test id", 128);
  assertNonEmptyString(clientAttemptId, "client attempt id", 128);
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
