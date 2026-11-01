const encoder = new TextEncoder();
const ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const ANSWER_VALUES = new Set(["A", "B", "C", "D", null]);
const PALETTE_STATUSES = new Set(["not_visited", "unanswered", "answered", "marked_for_review", "answered_and_marked"]);
function assertNonEmptyString(value, name, maxLength = 256) {
  if (typeof value !== "string" || value.length === 0 || value.length > maxLength) throw new TypeError(`invalid ${name}`);
}
function assertIdentifier(value, name) {
  if (typeof value !== "string" || !ID_PATTERN.test(value)) throw new TypeError(`invalid ${name}`);
}
function canonicalResponses(responses) {
  if (!responses || typeof responses !== "object" || Array.isArray(responses)) throw new TypeError("responses must be an object");
  const entries = Object.entries(responses);
  if (entries.length > 500) throw new TypeError("too many responses");
  for (const [questionId, answer] of entries) {
    assertIdentifier(questionId, "question id");
    if (!ANSWER_VALUES.has(answer ?? null)) throw new TypeError("invalid response value");
  }
  return entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([id, answer]) => [id, answer ?? null]);
}
function canonicalQuestionStatuses(questionStatuses = {}) {
  if (!questionStatuses || typeof questionStatuses !== "object" || Array.isArray(questionStatuses)) throw new TypeError("questionStatuses must be an object");
  const entries = Object.entries(questionStatuses);
  if (entries.length > 500) throw new TypeError("too many question statuses");
  for (const [id, status] of entries) {
    assertIdentifier(id, "question status id");
    if (!PALETTE_STATUSES.has(status)) throw new TypeError("invalid question status");
  }
  return entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
}
async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}
/** Build a user/test-scoped idempotency key and fingerprint; the repository must compare it atomically. */
export async function buildAttemptIdempotency({ uid, testId, clientAttemptId, responses, questionStatuses = {}, timeTakenSeconds }) {
  assertNonEmptyString(uid, "authenticated uid");
  assertIdentifier(testId, "test id");
  assertIdentifier(clientAttemptId, "client attempt id");
  if (!Number.isInteger(timeTakenSeconds) || timeTakenSeconds < 0 || timeTakenSeconds > 86400) throw new TypeError("invalid timeTakenSeconds");
  const canonical = JSON.stringify({ uid, testId, responses: canonicalResponses(responses), questionStatuses: canonicalQuestionStatuses(questionStatuses), timeTakenSeconds });
  const scope = await sha256Hex(JSON.stringify([uid, testId, clientAttemptId]));
  return { documentId: `attempt_${scope}`, fingerprint: await sha256Hex(canonical) };
}
