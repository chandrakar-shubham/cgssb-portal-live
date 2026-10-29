import test from "node:test";
import assert from "node:assert/strict";
import { loadAuthorizedAttemptReview } from "../src/attemptReviewService.mjs";

const baseAttempt = {
  id: "attempt-1",
  userId: "student-1",
  userName: "Test Student",
  testId: "test-1",
  score: 8,
  correctCount: 4,
  responses: { q1: "A" },
  questionStatuses: { q1: "answered" },
  scoreBreakdown: {
    rawScore: 10,
    questionResults: [{ questionId: "q1", status: "correct", score: 2 }],
  },
  internalRepositoryField: "must not leak",
};

function repository(overrides = {}) {
  return {
    async loadAttemptForReview() {
      return {
        attempt: baseAttempt,
        releasePolicy: { mode: "manual", isReleased: false },
        isAuthorizedAdmin: false,
        ...overrides,
      };
    },
  };
}

test("requires authenticated identity and a valid attempt ID", async () => {
  assert.equal((await loadAuthorizedAttemptReview({ uid: "", attemptId: "attempt-1", repository: repository() })).status, 401);
  assert.equal((await loadAuthorizedAttemptReview({ uid: "student-1", attemptId: "../attempt", repository: repository() })).status, 400);
});

test("returns 404 for another student's attempt", async () => {
  const result = await loadAuthorizedAttemptReview({
    uid: "student-2", attemptId: "attempt-1", repository: repository(),
  });
  assert.equal(result.status, 404);
  assert.equal(result.error, "ATTEMPT_NOT_FOUND");
  assert.equal(result.result, undefined);
});

test("hides per-question correctness until trusted release", async () => {
  const result = await loadAuthorizedAttemptReview({
    uid: "student-1", attemptId: "attempt-1", repository: repository(),
  });
  assert.equal(result.status, 200);
  assert.equal(result.canViewSolutions, false);
  assert.equal(result.result.score, 8);
  assert.equal("scoreBreakdown" in result.result, false);
  assert.equal("internalRepositoryField" in result.result, false);
});

test("reveals per-question breakdown only after trusted manual release", async () => {
  const result = await loadAuthorizedAttemptReview({
    uid: "student-1",
    attemptId: "attempt-1",
    repository: repository({ releasePolicy: { mode: "manual", isReleased: true } }),
  });
  assert.equal(result.canViewSolutions, true);
  assert.equal(result.result.scoreBreakdown.questionResults[0].status, "correct");
});

test("server-authorized admin may review another user's attempt", async () => {
  const result = await loadAuthorizedAttemptReview({
    uid: "admin-1",
    attemptId: "attempt-1",
    repository: repository({ isAuthorizedAdmin: true }),
  });
  assert.equal(result.status, 200);
  assert.equal(result.canViewSolutions, true);
  assert.equal(result.result.scoreBreakdown.rawScore, 10);
});

test("does not trust a client-supplied admin flag", async () => {
  const repo = repository();
  const result = await loadAuthorizedAttemptReview({
    uid: "student-2", attemptId: "attempt-1", repository: repo,
    isAuthorizedAdmin: true,
  });
  assert.equal(result.status, 404);
});

test("fails closed when review persistence is unavailable", async () => {
  const result = await loadAuthorizedAttemptReview({
    uid: "student-1", attemptId: "attempt-1", repository: {},
  });
  assert.equal(result.status, 503);
});

test("does not reveal solutions for malformed release policy", async () => {
  const result = await loadAuthorizedAttemptReview({
    uid: "student-1",
    attemptId: "attempt-1",
    repository: repository({ releasePolicy: { mode: "scheduled", releaseAt: "invalid" } }),
  });
  assert.equal(result.canViewSolutions, false);
  assert.equal("scoreBreakdown" in result.result, false);
});
