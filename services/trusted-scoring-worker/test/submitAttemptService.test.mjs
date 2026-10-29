import test from "node:test";
import assert from "node:assert/strict";
import { submitTrustedAttempt } from "../src/submitAttemptService.mjs";

function makeRepository() {
  const records = new Map();
  const testDefinition = {
    id: "test-1", title: "Sample Test", category: "CGSSB", isPublished: true,
    questionCount: 2, durationMinutes: 60, marksPerQuestion: 2,
    negativeMarksPerQuestion: 0.5,
    sections: [{ id: "s1", questionIds: ["q1", "q2"] }],
  };
  const questions = [{ id: "q1", correctOption: "A" }, { id: "q2", correctOption: "B" }];
  return {
    records,
    async findAttemptByIdempotencyKey({ documentId }) { return records.get(documentId) || null; },
    async loadPublishedTest() { return testDefinition; },
    async loadCanonicalQuestions(ids) { return questions.filter(q => ids.includes(q.id)); },
    async loadStudentProfile(uid) { return { id: uid, name: "Test Student" }; },
    async authorizeAttempt() { return true; },
    async commitAttemptAtomically(input) {
      const existing = records.get(input.documentId);
      if (existing) return existing.fingerprint === input.fingerprint
        ? { kind: "replay", ...existing } : { kind: "conflict" };
      const record = { fingerprint: input.fingerprint, result: { attemptId: "server-generated", ...input.attempt } };
      records.set(input.documentId, record);
      return { kind: "created", result: record.result };
    },
  };
}

const submission = {
  testId: "test-1", clientAttemptId: "client-attempt-1",
  timeTakenSeconds: 300, responses: { q1: "A", q2: "C" },
};

test("scores from trusted canonical questions", async () => {
  const result = await submitTrustedAttempt({ uid: "student-1", submission, repository: makeRepository() });
  assert.equal(result.status, 201);
  assert.equal(result.result.correctCount, 1);
  assert.equal(result.result.incorrectCount, 1);
  assert.equal(result.result.score, 1.5);
  assert.equal(result.result.userName, "Test Student");
  assert.equal(result.result.questionStatuses.q1, "answered");
});

test("replays identical retries without duplicate attempts", async () => {
  const repository = makeRepository();
  const first = await submitTrustedAttempt({ uid: "student-1", submission, repository });
  const second = await submitTrustedAttempt({ uid: "student-1", submission, repository });
  assert.equal(first.status, 201);
  assert.equal(second.status, 200);
  assert.equal(second.replayed, true);
  assert.equal(repository.records.size, 1);
});

test("rejects same idempotency key with changed answers", async () => {
  const repository = makeRepository();
  await submitTrustedAttempt({ uid: "student-1", submission, repository });
  const changed = await submitTrustedAttempt({
    uid: "student-1", submission: { ...submission, responses: { q1: "B", q2: "C" } }, repository,
  });
  assert.equal(changed.status, 409);
});

test("denies ineligible users", async () => {
  const repository = makeRepository();
  repository.authorizeAttempt = async () => false;
  const result = await submitTrustedAttempt({ uid: "student-2", submission, repository });
  assert.equal(result.status, 403);
});

test("rejects malformed published test configuration", async () => {
  const repository = makeRepository();
  repository.loadPublishedTest = async () => ({ id: "test-1", isPublished: true });
  const result = await submitTrustedAttempt({ uid: "student-1", submission, repository });
  assert.equal(result.status, 503);
});

test("does not trust client-supplied score or identity fields", async () => {
  const result = await submitTrustedAttempt({
    uid: "verified-user", submission: { ...submission, score: 99999, userId: "attacker" },
    repository: makeRepository(),
  });
  assert.equal(result.status, 201);
  assert.equal(result.result.score, 1.5);
  assert.equal(result.result.userId, "verified-user");
});

test("fails closed when repository adapter is incomplete", async () => {
  const result = await submitTrustedAttempt({ uid: "student-1", submission, repository: {} });
  assert.equal(result.status, 503);
});


test("concurrent duplicate submissions are resolved by the repository's atomic commit", async () => {
  const repository = makeRepository();
  const [first, second] = await Promise.all([
    submitTrustedAttempt({ uid: "student-1", submission, repository }),
    submitTrustedAttempt({ uid: "student-1", submission, repository }),
  ]);
  assert.equal(repository.records.size, 1);
  assert.equal([first, second].filter(result => result.status === 201).length, 1);
  assert.equal([first, second].filter(result => result.status === 200).length, 1);
});

test("different users get separate idempotency scopes for the same client key", async () => {
  const repository = makeRepository();
  const first = await submitTrustedAttempt({ uid: "student-1", submission, repository });
  const second = await submitTrustedAttempt({ uid: "student-2", submission, repository });
  assert.equal(first.status, 201);
  assert.equal(second.status, 201);
  assert.equal(repository.records.size, 2);
});


test("rejects an invalid trusted clock before touching the repository", async () => {
  const repository = makeRepository();
  const result = await submitTrustedAttempt({ uid: "student-1", submission, repository, now: Number.NaN });
  assert.equal(result.status, 400);
  assert.equal(result.error, "INVALID_REQUEST_CLOCK");
  assert.equal(repository.records.size, 0);
});

test("fails closed if the repository returns an attempt from another user or test", async () => {
  const repository = makeRepository();
  repository.findAttemptByIdempotencyKey = async () => ({
    fingerprint: "irrelevant",
    result: { userId: "student-victim", testId: "other-test", score: 100 },
  });
  const result = await submitTrustedAttempt({ uid: "student-1", submission, repository });
  assert.equal(result.status, 503);
  assert.equal(result.error, "ATTEMPT_REPOSITORY_SCOPE_VIOLATION");
  assert.equal(result.result, undefined);
});


test("fails closed if an atomic replay returns another user's result", async () => {
  const repository = makeRepository();
  repository.commitAttemptAtomically = async () => ({
    kind: "replay",
    fingerprint: "not-the-request-fingerprint",
    result: { userId: "student-victim", testId: "test-1", score: 100 },
  });
  const result = await submitTrustedAttempt({ uid: "student-1", submission, repository });
  assert.equal(result.status, 503);
  assert.equal(result.error, "ATTEMPT_REPOSITORY_SCOPE_VIOLATION");
  assert.equal(result.result, undefined);
});


test("rejects a student profile whose ID does not match the verified UID", async () => {
  const repository = makeRepository();
  repository.loadStudentProfile = async () => ({ id: "different-user", name: "Test Student" });
  const result = await submitTrustedAttempt({ uid: "student-1", submission, repository });
  assert.equal(result.status, 403);
  assert.equal(result.error, "STUDENT_PROFILE_UNAVAILABLE");
  assert.equal(repository.records.size, 0);
});


test("fails closed if a newly created attempt result has the wrong user or test scope", async () => {
  const repository = makeRepository();
  repository.commitAttemptAtomically = async () => ({
    kind: "created",
    result: { userId: "student-victim", testId: "other-test", score: 100 },
  });
  const result = await submitTrustedAttempt({ uid: "student-1", submission, repository });
  assert.equal(result.status, 503);
  assert.equal(result.error, "ATTEMPT_REPOSITORY_SCOPE_VIOLATION");
  assert.equal(result.result, undefined);
});
