import test from "node:test";
import assert from "node:assert/strict";
import worker, { createTrustedScoringWorker } from "../src/index.mjs";

test("health endpoint exposes service health without database configuration", async () => {
  const response = await worker.fetch(new Request("https://worker.example/healthz"), {});
  assert.equal(response.status, 200);
  assert.equal((await response.json()).ok, true);
});

test("submission endpoint rejects missing bearer tokens before repository access", async () => {
  const response = await worker.fetch(new Request("https://worker.example/v1/attempts:submit", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      testId: "test-1", clientAttemptId: "attempt-1",
      responses: {}, timeTakenSeconds: 0,
    }),
  }), {});
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "UNAUTHENTICATED" });
});

test("unknown routes remain not found", async () => {
  const response = await worker.fetch(new Request("https://worker.example/v1/unknown"), {});
  assert.equal(response.status, 404);
});

test("review endpoint requires a bearer token before repository access", async () => {
  const response = await worker.fetch(new Request("https://worker.example/v1/attempts/attempt-123/review"), {});
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "UNAUTHENTICATED" });
});

test("review endpoint rejects malformed attempt identifiers as an unknown route", async () => {
  const response = await worker.fetch(new Request("https://worker.example/v1/attempts/invalid%2Fid/review"), {});
  assert.equal(response.status, 404);
});

test("browser preflight allows only the configured CGSSB origin and headers", async () => {
  const response = await worker.fetch(new Request("https://worker.example/v1/attempts:submit", {
    method: "OPTIONS",
    headers: {
      origin: "https://cgtest.in",
      "access-control-request-method": "POST",
      "access-control-request-headers": "authorization,content-type",
    },
  }), { ALLOWED_ORIGINS: "https://cgtest.in" });
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-allow-origin"), "https://cgtest.in");
  assert.match(response.headers.get("access-control-allow-methods") || "", /POST/);
  assert.match(response.headers.get("access-control-allow-headers") || "", /Authorization/i);
  assert.equal(response.headers.get("vary"), "Origin");
});

test("browser requests from unconfigured origins are rejected", async () => {
  const response = await worker.fetch(new Request("https://worker.example/healthz", {
    headers: { origin: "https://attacker.example" },
  }), { ALLOWED_ORIGINS: "https://cgtest.in" });
  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { error: "CORS_ORIGIN_NOT_ALLOWED" });
});

test("allowed browser origin receives CORS headers on API responses", async () => {
  const response = await worker.fetch(new Request("https://worker.example/healthz", {
    headers: { origin: "https://cgtest.in" },
  }), { ALLOWED_ORIGINS: "https://cgtest.in" });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("access-control-allow-origin"), "https://cgtest.in");
});

function makeJourneyRepository() {
  const attempts = new Map();
  const test = {
    id: "test-1",
    title: "Trusted API Test",
    category: "CGSSB",
    isPublished: true,
    questionCount: 2,
    durationMinutes: 30,
    marksPerQuestion: 2,
    negativeMarksPerQuestion: 0.5,
    solutionReleasePolicy: { mode: "immediate" },
    sections: [{ id: "section-1", questionIds: ["q1", "q2"] }],
  };
  const questions = [
    { id: "q1", correctOption: "A", subject: "General", marks: 2, negativeMarks: 0.5 },
    { id: "q2", correctOption: "B", subject: "General", marks: 2, negativeMarks: 0.5 },
  ];
  return {
    attempts,
    async findAttemptByIdempotencyKey({ uid, testId, documentId }) {
      const value = attempts.get(documentId);
      if (!value) return null;
      if (value.result.userId !== uid || value.result.testId !== testId) {
        throw new Error("ATTEMPT_REPOSITORY_SCOPE_VIOLATION");
      }
      return value;
    },
    async loadPublishedTest(testId) {
      return testId === test.id ? test : null;
    },
    async loadCanonicalQuestions(ids) {
      return questions.filter(question => ids.includes(question.id));
    },
    async loadStudentProfile(uid) {
      return { id: uid, name: "Synthetic Student" };
    },
    async authorizeAttempt() {
      return true;
    },
    async commitAttemptAtomically({ uid, testId, documentId, fingerprint, attempt }) {
      const existing = attempts.get(documentId);
      if (existing) return existing.fingerprint === fingerprint
        ? { kind: "replay", ...existing }
        : { kind: "conflict" };
      const result = { ...attempt, userId: uid, testId, id: documentId };
      const record = { fingerprint, result };
      attempts.set(documentId, record);
      return { kind: "created", result };
    },
    async loadAttemptForReview({ requesterUid, attemptId }) {
      const record = [...attempts.values()].find(item => item.result.id === attemptId);
      if (!record) return null;
      return {
        attempt: record.result,
        isAuthorizedAdmin: false,
        releasePolicy: test.solutionReleasePolicy,
      };
    },
  };
}

function createJourneyWorker(repository, uid = "student-1") {
  return createTrustedScoringWorker({
    verifyToken: async token => token === "synthetic-firebase-token" ? { uid } : null,
    createRepository: async () => repository,
  });
}

test("authenticated HTTP submission returns aggregate receipt without per-question correctness", async () => {
  const repository = makeJourneyRepository();
  const journeyWorker = createJourneyWorker(repository);
  const response = await journeyWorker.fetch(new Request("https://worker.example/v1/attempts:submit", {
    method: "POST",
    headers: {
      authorization: "Bearer synthetic-firebase-token",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      testId: "test-1",
      clientAttemptId: "attempt-journey-1",
      timeTakenSeconds: 120,
      responses: { q1: "A", q2: "C" },
    }),
  }), { FIREBASE_PROJECT_ID: "synthetic-project" });

  assert.equal(response.status, 201);
  const payload = await response.json();
  assert.equal(payload.ok, true);
  assert.equal(payload.replayed, false);
  assert.equal(payload.attempt.correctCount, 1);
  assert.equal(payload.attempt.incorrectCount, 1);
  assert.equal("scoreBreakdown" in payload.attempt, false);
  assert.equal("correctOption" in payload.attempt, false);
  assert.equal(repository.attempts.size, 1);
});

test("authenticated HTTP retry returns the original idempotent receipt", async () => {
  const repository = makeJourneyRepository();
  const journeyWorker = createJourneyWorker(repository);
  const request = () => new Request("https://worker.example/v1/attempts:submit", {
    method: "POST",
    headers: {
      authorization: "Bearer synthetic-firebase-token",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      testId: "test-1",
      clientAttemptId: "attempt-journey-retry",
      timeTakenSeconds: 120,
      responses: { q1: "A", q2: "C" },
    }),
  });
  const first = await journeyWorker.fetch(request(), { FIREBASE_PROJECT_ID: "synthetic-project" });
  const second = await journeyWorker.fetch(request(), { FIREBASE_PROJECT_ID: "synthetic-project" });
  assert.equal(first.status, 201);
  assert.equal(second.status, 200);
  assert.equal((await second.json()).replayed, true);
  assert.equal(repository.attempts.size, 1);
});

test("review reveals per-question scoring only after owner and release policy checks", async () => {
  const repository = makeJourneyRepository();
  const journeyWorker = createJourneyWorker(repository);
  const submission = await journeyWorker.fetch(new Request("https://worker.example/v1/attempts:submit", {
    method: "POST",
    headers: {
      authorization: "Bearer synthetic-firebase-token",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      testId: "test-1",
      clientAttemptId: "attempt-review-1",
      timeTakenSeconds: 120,
      responses: { q1: "A", q2: "C" },
    }),
  }), { FIREBASE_PROJECT_ID: "synthetic-project" });
  const receipt = await submission.json();

  const review = await journeyWorker.fetch(new Request(
    `https://worker.example/v1/attempts/${receipt.attempt.id}/review`,
    { headers: { authorization: "Bearer synthetic-firebase-token" } },
  ), { FIREBASE_PROJECT_ID: "synthetic-project" });

  assert.equal(review.status, 200);
  const payload = await review.json();
  assert.equal(payload.canViewSolutions, true);
  assert.equal(payload.attempt.scoreBreakdown.questionResults.length, 2);
});

test("review does not disclose another student's attempt", async () => {
  const repository = makeJourneyRepository();
  const ownerWorker = createJourneyWorker(repository, "owner-uid");
  const submission = await ownerWorker.fetch(new Request("https://worker.example/v1/attempts:submit", {
    method: "POST",
    headers: {
      authorization: "Bearer synthetic-firebase-token",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      testId: "test-1",
      clientAttemptId: "attempt-owner-only",
      timeTakenSeconds: 30,
      responses: { q1: "A", q2: "B" },
    }),
  }), { FIREBASE_PROJECT_ID: "synthetic-project" });
  const receipt = await submission.json();
  const otherStudentWorker = createJourneyWorker(repository, "different-uid");
  const review = await otherStudentWorker.fetch(new Request(
    `https://worker.example/v1/attempts/${receipt.attempt.id}/review`,
    { headers: { authorization: "Bearer synthetic-firebase-token" } },
  ), { FIREBASE_PROJECT_ID: "synthetic-project" });

  assert.equal(review.status, 404);
  assert.deepEqual(await review.json(), { error: "ATTEMPT_NOT_FOUND" });
});

test("authenticated submission rejects client-supplied score and identity fields", async () => {
  const repository = makeJourneyRepository();
  const journeyWorker = createJourneyWorker(repository);
  const response = await journeyWorker.fetch(new Request("https://worker.example/v1/attempts:submit", {
    method: "POST",
    headers: {
      authorization: "Bearer synthetic-firebase-token",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      testId: "test-1",
      clientAttemptId: "attempt-injected-score",
      timeTakenSeconds: 30,
      responses: { q1: "A", q2: "B" },
      score: 999,
      userId: "victim-uid",
    }),
  }), { FIREBASE_PROJECT_ID: "synthetic-project" });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "FORBIDDEN_CLIENT_FIELD" });
  assert.equal(repository.attempts.size, 0);
});


test("authenticated history endpoint is owner-scoped, bounded and excludes solution internals", async () => {
  const rows = [
    { id: "attempt-new", userId: "student-1", testId: "test-1", testTitle: "Test", submittedAt: "2026-11-01T10:00:00.000Z", score: 8, responses: { q1: "A" }, scoreBreakdown: { questionResults: [{ correctOption: "B" }] }, internalSecret: "no" },
    { id: "attempt-old", userId: "student-1", testId: "test-1", testTitle: "Test", submittedAt: "2026-10-31T10:00:00.000Z", score: 6 },
    { id: "foreign", userId: "other-user", testId: "test-1", testTitle: "Test", submittedAt: "2026-10-30T10:00:00.000Z", score: 99 },
  ];
  let query;
  const repository = {
    async listAttemptsForStudent(input) {
      query = input;
      return rows.filter(row => row.userId === input.uid).slice(0, input.pageSize);
    },
  };
  const journeyWorker = createJourneyWorker(repository);
  const response = await journeyWorker.fetch(new Request("https://worker.example/v1/attempts?limit=1", {
    headers: { authorization: "Bearer synthetic-firebase-token" },
  }), { FIREBASE_PROJECT_ID: "synthetic-project" });
  assert.equal(response.status, 200);
  assert.equal(query.uid, "student-1");
  assert.equal(query.pageSize, 2);
  const payload = await response.json();
  assert.equal(payload.attempts.length, 1);
  assert.equal(payload.attempts[0].id, "attempt-new");
  assert.equal(payload.attempts[0].score, 8);
  assert.equal("scoreBreakdown" in payload.attempts[0], false);
  assert.equal("internalSecret" in payload.attempts[0], false);
  assert.equal(typeof payload.nextCursor, "string");
});

test("history endpoint rejects malformed cursors and oversized pages", async () => {
  const repository = { async listAttemptsForStudent() { throw new Error("must not query"); } };
  const journeyWorker = createJourneyWorker(repository);
  const badCursor = await journeyWorker.fetch(new Request("https://worker.example/v1/attempts?cursor=not-json", {
    headers: { authorization: "Bearer synthetic-firebase-token" },
  }), { FIREBASE_PROJECT_ID: "synthetic-project" });
  assert.equal(badCursor.status, 400);
  const oversized = await journeyWorker.fetch(new Request("https://worker.example/v1/attempts?limit=51", {
    headers: { authorization: "Bearer synthetic-firebase-token" },
  }), { FIREBASE_PROJECT_ID: "synthetic-project" });
  assert.equal(oversized.status, 400);
});

test("history endpoint requires authentication", async () => {
  const response = await worker.fetch(new Request("https://worker.example/v1/attempts"), {});
  assert.equal(response.status, 401);
});
