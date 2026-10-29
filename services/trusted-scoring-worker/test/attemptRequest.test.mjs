import test from "node:test";
import assert from "node:assert/strict";
import { parseAttemptSubmission } from "../src/attemptRequest.mjs";

function request(body, headers = { "content-type": "application/json" }) {
  return new Request("https://worker.test/v1/attempts:submit", {
    method: "POST",
    headers,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

test("accepts a bounded, well-formed answer submission", async () => {
  const result = await parseAttemptSubmission(request({
    testId: "test_1",
    responses: { q1: "A", q2: null },
    clientAttemptId: "attempt_123",
    timeTakenSeconds: 300,
  }));
  assert.equal(result.ok, true);
  assert.deepEqual(result.value, {
    testId: "test_1",
    responses: { q1: "A", q2: null },
    clientAttemptId: "attempt_123",
    timeTakenSeconds: 300,
  });
});

test("rejects malformed JSON", async () => {
  const result = await parseAttemptSubmission(request("{", { "content-type": "application/json" }));
  assert.equal(result.status, 400);
  assert.equal(result.error, "INVALID_JSON");
});

test("rejects non-JSON content type", async () => {
  const result = await parseAttemptSubmission(request("{}", { "content-type": "text/plain" }));
  assert.equal(result.status, 415);
});

test("rejects oversized declared payload", async () => {
  const result = await parseAttemptSubmission(request("{}", {
    "content-type": "application/json",
    "content-length": String(300 * 1024),
  }));
  assert.equal(result.status, 413);
});

test("rejects client-provided score or identity fields", async () => {
  for (const forbidden of [
    { score: 100 }, { correctCount: 50 }, { userId: "victim" },
    { role: "admin" }, { answerKey: "A" }, { explanation: "leak" },
  ]) {
    const result = await parseAttemptSubmission(request({
      testId: "test_1", responses: {}, clientAttemptId: "attempt_123", timeTakenSeconds: 1, ...forbidden,
    }));
    assert.equal(result.ok, false);
    assert.equal(result.error, "FORBIDDEN_CLIENT_FIELD");
  }
});

test("rejects unknown answer representations", async () => {
  const result = await parseAttemptSubmission(request({
    testId: "test_1", responses: { q1: ["A", "B"] }, clientAttemptId: "attempt_123", timeTakenSeconds: 1,
  }));
  assert.equal(result.error, "INVALID_ANSWER_VALUE");
});

test("rejects invalid test and question IDs", async () => {
  const badTest = await parseAttemptSubmission(request({
    testId: "../test", responses: {}, timeTakenSeconds: 1,
  }));
  assert.equal(badTest.error, "INVALID_TEST_ID");

  const badQuestion = await parseAttemptSubmission(request({
    testId: "test_1", responses: { "q/1": "A" }, clientAttemptId: "attempt_123", timeTakenSeconds: 1,
  }));
  assert.equal(badQuestion.error, "INVALID_QUESTION_ID");
});

test("rejects excessive response count", async () => {
  const responses = Object.fromEntries(Array.from({ length: 501 }, (_, i) => [`q${i}`, "A"]));
  const result = await parseAttemptSubmission(request({
    testId: "test_1", responses, clientAttemptId: "attempt_123", timeTakenSeconds: 1,
  }));
  assert.equal(result.status, 413);
  assert.equal(result.error, "TOO_MANY_RESPONSES");
});

test("rejects out-of-range duration and invalid idempotency keys", async () => {
  const badTime = await parseAttemptSubmission(request({
    testId: "test_1", responses: {}, clientAttemptId: "attempt_123", timeTakenSeconds: -1,
  }));
  assert.equal(badTime.error, "INVALID_TIME_TAKEN");

  const badKey = await parseAttemptSubmission(request({
    testId: "test_1", responses: {}, timeTakenSeconds: 1, clientAttemptId: "bad/key",
  }));
  assert.equal(badKey.error, "INVALID_IDEMPOTENCY_KEY");
});

test("requires a client attempt id for safe idempotent submission", async () => {
  const missing = await parseAttemptSubmission(request({
    testId: "test_1", responses: { q1: "A" }, timeTakenSeconds: 1,
  }));
  assert.equal(missing.ok, false);
  assert.equal(missing.error, "MISSING_IDEMPOTENCY_KEY");

  const empty = await parseAttemptSubmission(request({
    testId: "test_1", responses: {}, timeTakenSeconds: 1, clientAttemptId: "",
  }));
  assert.equal(empty.error, "MISSING_IDEMPOTENCY_KEY");
});

test("rejects unreviewed submission fields rather than silently accepting them", async () => {
  for (const extra of [{ userName: "Injected Name" }, { debug: true }, { isAdmin: true }]) {
    const result = await parseAttemptSubmission(request({
      testId: "test_1", responses: {}, clientAttemptId: "attempt_123",
      timeTakenSeconds: 1, ...extra,
    }));
    assert.equal(result.ok, false);
    assert.equal(result.error, "FORBIDDEN_CLIENT_FIELD");
  }
});
