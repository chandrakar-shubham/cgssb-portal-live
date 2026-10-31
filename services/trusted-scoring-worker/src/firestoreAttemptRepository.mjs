import { authorizeStudentAttempt } from "./attemptEligibility.mjs";

/**
 * Firestore REST repository for trusted attempts.
 *
 * The supplied client must use a server-only OAuth access token with narrowly
 * scoped Firestore permissions. It must implement getDocument(path),
 * batchGetDocuments(paths), and commitWrites(writes); commitWrites must call
 * Firestore documents:commit, whose writes are atomic.
 *
 * Trusted attempts are deliberately stored separately from legacy client-
 * writable `attempts` until UI consumers and Firestore rules are migrated.
 */
function isCommitOutcomeUncertain(error) {
  const status = Number(error?.status);
  if (Number.isInteger(status)) {
    return status === 408 || status === 409 || status === 412 ||
      status === 429 || status >= 500;
  }
  const code = String(error?.code || "").toUpperCase();
  if (["ALREADY_EXISTS", "FAILED_PRECONDITION", "ABORTED"].includes(code)) return true;
  return error?.name === "TypeError" || error?.name === "AbortError";
}

export function createFirestoreAttemptRepository({ firestore, now = () => Date.now() }) {
  if (!firestore || typeof firestore.getDocument !== "function" ||
      typeof firestore.batchGetDocuments !== "function" ||
      typeof firestore.commitWrites !== "function") {
    throw new TypeError("Firestore REST client is incomplete");
  }

  async function get(path) {
    return firestore.getDocument(path);
  }

  async function loadStoredAttempt(documentId) {
    return get(`trustedAttempts/${documentId}`);
  }

  async function loadIdempotencyRecord(documentId) {
    return get(`trustedAttemptIdempotency/${documentId}`);
  }

  async function findAttemptByIdempotencyKey({ uid, testId, documentId }) {
    const record = await loadIdempotencyRecord(documentId);
    if (!record) return null;
    if (record.userId !== uid || record.testId !== testId || record.attemptId !== documentId) {
      throw new Error("IDEMPOTENCY_RECORD_SCOPE_VIOLATION");
    }
    const result = await loadStoredAttempt(documentId);
    if (!result || result.userId !== uid || result.testId !== testId) {
      throw new Error("ATTEMPT_REPOSITORY_SCOPE_VIOLATION");
    }
    return { fingerprint: record.fingerprint, result };
  }

  async function loadPublishedTest(testId) {
    const test = await get(`mockTests/${testId}`);
    if (!test) return null;
    return { ...test, id: testId };
  }

  async function loadCanonicalQuestions(questionIds) {
    if (!Array.isArray(questionIds) || questionIds.length > 500) {
      throw new TypeError("invalid canonical question ID list");
    }
    if (new Set(questionIds).size !== questionIds.length ||
        questionIds.some(id => typeof id !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(id))) {
      throw new TypeError("invalid canonical question ID list");
    }
    if (questionIds.length === 0) return [];
    const documents = await firestore.batchGetDocuments(questionIds.map(id => `questions/${id}`));
    const byPath = new Map();
    for (const document of documents) {
      if (document && typeof document.__path === "string") byPath.set(document.__path, document);
    }
    return questionIds.map(id => {
      const question = byPath.get(`questions/${id}`);
      return question ? { ...question, id } : null;
    }).filter(Boolean);
  }

  async function loadStudentProfile(uid) {
    const profile = await get(`users/${uid}`);
    return profile ? { ...profile, id: profile.id } : null;
  }

  async function authorizeAttempt({ uid, test, now: requestNow }) {
    const user = await loadStudentProfile(uid);
    if (!user) return false;
    const entitlement = await get(`userEntitlements/${uid}`);
    return authorizeStudentAttempt({
      uid,
      test,
      user,
      entitlement: entitlement || null,
      now: Number.isFinite(requestNow) ? requestNow : now(),
    }).allowed;
  }

  async function commitAttemptAtomically({ uid, testId, documentId, fingerprint, attempt }) {
    if (attempt?.userId !== uid || attempt?.testId !== testId || attempt?.id !== documentId) {
      throw new Error("ATTEMPT_REPOSITORY_SCOPE_VIOLATION");
    }
    const idempotencyRecord = {
      fingerprint, attemptId: documentId, userId: uid, testId,
    };
    const writes = [
      { path: `trustedAttempts/${documentId}`, data: attempt, currentDocument: { exists: false } },
      { path: `trustedAttemptIdempotency/${documentId}`, data: idempotencyRecord, currentDocument: { exists: false } },
    ];
    try {
      await firestore.commitWrites(writes);
      return { kind: "created", result: attempt };
    } catch (error) {
      // Only ambiguous outcomes (precondition races, throttling, server errors,
      // or transport interruption) justify a read-after-write recovery. A
      // permission/configuration/client error must not be masked by a lookup.
      if (!isCommitOutcomeUncertain(error)) {
        throw new Error("ATTEMPT_PERSISTENCE_FAILED");
      }
      const prior = await findAttemptByIdempotencyKey({ uid, testId, documentId });
      if (!prior) throw new Error("ATTEMPT_PERSISTENCE_FAILED");
      if (prior.fingerprint !== fingerprint) return { kind: "conflict" };
      return { kind: "replay", ...prior };
    }
  }

  async function loadAttemptForReview({ requesterUid, attemptId }) {
    const attempt = await loadStoredAttempt(attemptId);
    if (!attempt) return null;
    if (attempt.id !== attemptId) throw new Error("ATTEMPT_REPOSITORY_SCOPE_VIOLATION");
    const test = await loadPublishedTest(attempt.testId);
    return {
      attempt,
      // No admin role schema is assumed. A future trusted admin adapter must
      // add this only after validating roles from a server-owned source.
      isAuthorizedAdmin: false,
      // Unknown or absent policies are fail-closed by attemptReviewPolicy.
      releasePolicy: test?.solutionReleasePolicy,
    };
  }

  return Object.freeze({
    findAttemptByIdempotencyKey,
    loadPublishedTest,
    loadCanonicalQuestions,
    loadStudentProfile,
    authorizeAttempt,
    commitAttemptAtomically,
    loadAttemptForReview,
  });
}
