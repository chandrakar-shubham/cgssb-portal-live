import test from "node:test";
import assert from "node:assert/strict";
import { createTrustedScoringWorker } from "../src/index.mjs";

function makeRepository() {
  const records = new Map();
  let releasePolicy = { mode: "manual", isReleased: false };
  let canonicalReads = 0;
  const testDefinition = {
    id: "test-1", title: "HTTP Journey Test", category: "CGSSB",
    isPublished: true, questionCount: 2, durationMinutes: 30,
    marksPerQuestion: 2, negativeMarksPerQuestion: 0.5,
    sections: [{ id: "section-1", questionIds: ["q1", "q2"] }],
  };
  const questions = [
    { id: "q1", subject: "Maths", correctOption: "A" },
    { id: "q2", subject: "Maths", correctOption: "B" },
  ];
  return {
    records,
    setReleasePolicy(value) { releasePolicy = value; },
    get canonicalReads() { return canonicalReads; },
    async findAttemptByIdempotencyKey({ documentId }) {
      return records.get(documentId) || null;
    },
    async loadPublishedTest() { return testDefinition; },
    async loadCanonicalQuestions(ids) {
      canonicalReads += 1;
      return questions.filter(question => ids.includes(question.id));
    },
    async loadStudentProfile(uid) { return { id: uid, name: "Integration Student" }; },
    async authorizeAttempt({ uid }) { return uid === "student-1"; },
    async commitAttemptAtomically({ documentId, fingerprint, attempt }) {
      const previous = records.get(documentId);
      if (previous) {
        return previous.fingerprint === fingerprint
          ? { kind: "replay", ...previous }
          : { kind: "conflict" };
      }
      const record = { fingerprint, result: attempt };
      records.set(documentId, record);
      return { kind: "created", result: attempt };
    },
    async loadAttemptForReview({ requesterUid, attemptId }) {
      const record = [...records.values()].find(item => item.result.id === attemptId);
      if (!record) return null;
      return {
        attempt: record.result,
        isAuthorizedAdmin: false,
        releasePolicy,
      };
    },
  };
}

function setup() {
  const repository = makeRepository();
  const worker = createTrustedScoringWorker({
    verifyToken: async token => {
      if (token === "student-token") return { uid: "student-1" };
      if (token === "other-token") return { uid: "student-2" };
      throw new Error("invalid token");
    },
    createRepository: async () => repository,
  });
  const headers = {
    authorization: "Bearer student-token",
    "content-type": "application/json",
  };
  return { worker, repository, headers };
}

const payload = {
  testId: "test-1",
  clientAttemptId: "client-attempt-1",
  timeTakenSeconds: 120,
  responses: { q1: "A", q2: "C" },
};

test("HTTP submission -> idempotent retry -> unreleased review -> released review", async () => {
  const { worker, repository, headers } = setup();
  const submit = () => worker.fetch(new Request("https://worker.test/v1/attempts:submit", {
    method: "POST", headers, body: JSON.stringify(payload),
  }), { FIREBASE_PROJECT_ID: "test-project" });

  const first = await submit();
  const firstBody = await first.json();
  assert.equal(first.status, 201);
  assert.equal(firstBody.ok, true);
  assert.equal(firstBody.replayed, false);
  assert.equal(firstBody.attempt.score, 1.5);
  assert.equal("scoreBreakdown" in firstBody.attempt, false);
  assert.equal(repository.records.size, 1);

  const retry = await submit();
  const retryBody = await retry.json();
  assert.equal(retry.status, 200);
  assert.equal(retryBody.replayed, true);
  assert.equal(retryBody.attempt.id, firstBody.attempt.id);
  assert.equal(repository.records.size, 1);

  const reviewUrl = `https://worker.test/v1/attempts/${firstBody.attempt.id}/review`;
  const hidden = await worker.fetch(new Request(reviewUrl, {
    headers: { authorization: "Bearer student-token" },
  }), { FIREBASE_PROJECT_ID: "test-project" });
  const hiddenBody = await hidden.json();
  assert.equal(hidden.status, 200);
  assert.equal(hiddenBody.canViewSolutions, false);
  assert.equal("scoreBreakdown" in hiddenBody.attempt, false);

  repository.setReleasePolicy({ mode: "manual", isReleased: true });
  const released = await worker.fetch(new Request(reviewUrl, {
    headers: { authorization: "Bearer student-token" },
  }), { FIREBASE_PROJECT_ID: "test-project" });
  const releasedBody = await released.json();
  assert.equal(released.status, 200);
  assert.equal(releasedBody.canViewSolutions, true);
  assert.equal(releasedBody.attempt.scoreBreakdown.questionResults[0].status, "correct");
});

test("HTTP submission rejects a different student's eligibility before answer-key reads", async () => {
  const { worker, repository } = setup();
  const response = await worker.fetch(new Request("https://worker.test/v1/attempts:submit", {
    method: "POST",
    headers: {
      authorization: "Bearer other-token",
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  }), { FIREBASE_PROJECT_ID: "test-project" });
  assert.equal(response.status, 403);
  assert.equal((await response.json()).error, "ATTEMPT_NOT_AUTHORIZED");
  assert.equal(repository.canonicalReads, 0);
  assert.equal(repository.records.size, 0);
});

test("HTTP review conceals another student's attempt", async () => {
  const { worker, headers } = setup();
  const submitted = await worker.fetch(new Request("https://worker.test/v1/attempts:submit", {
    method: "POST", headers, body: JSON.stringify(payload),
  }), { FIREBASE_PROJECT_ID: "test-project" });
  const attempt = (await submitted.json()).attempt;
  const response = await worker.fetch(new Request(
    `https://worker.test/v1/attempts/${attempt.id}/review`,
    { headers: { authorization: "Bearer other-token" } },
  ), { FIREBASE_PROJECT_ID: "test-project" });
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: "ATTEMPT_NOT_FOUND" });
});

test("HTTP route rejects client-supplied score and identity fields", async () => {
  const { worker, headers, repository } = setup();
  const response = await worker.fetch(new Request("https://worker.test/v1/attempts:submit", {
    method: "POST", headers,
    body: JSON.stringify({ ...payload, score: 999, userId: "victim" }),
  }), { FIREBASE_PROJECT_ID: "test-project" });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, "FORBIDDEN_CLIENT_FIELD");
  assert.equal(repository.records.size, 0);
});
