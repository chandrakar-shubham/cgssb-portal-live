import test from "node:test";
import assert from "node:assert/strict";
import { buildAttemptIdempotency } from "../src/attemptIdempotency.mjs";

const base = {
  uid: "firebase-user-123",
  testId: "cgpsc-pre-2026",
  clientAttemptId: "attempt-local-1",
  responses: { q2: "B", q1: "A" },
  timeTakenSeconds: 1200,
};

test("same UID, test and client key produce a stable document ID", async () => {
  const first = await buildAttemptIdempotency(base);
  const retry = await buildAttemptIdempotency({ ...base, responses: { q1: "A", q2: "B" } });
  assert.equal(first.documentId, retry.documentId);
  assert.equal(first.fingerprint, retry.fingerprint);
});

test("same key with changed answers preserves key but changes fingerprint", async () => {
  const first = await buildAttemptIdempotency(base);
  const changed = await buildAttemptIdempotency({ ...base, responses: { q1: "C", q2: "B" } });
  assert.equal(first.documentId, changed.documentId);
  assert.notEqual(first.fingerprint, changed.fingerprint);
});

test("different users or tests cannot collide on the same client key", async () => {
  const original = await buildAttemptIdempotency(base);
  const otherUser = await buildAttemptIdempotency({ ...base, uid: "firebase-user-456" });
  const otherTest = await buildAttemptIdempotency({ ...base, testId: "different-test" });
  assert.notEqual(original.documentId, otherUser.documentId);
  assert.notEqual(original.documentId, otherTest.documentId);
});

test("rejects missing identity, key and invalid time", async () => {
  await assert.rejects(() => buildAttemptIdempotency({ ...base, uid: "" }), /uid/);
  await assert.rejects(() => buildAttemptIdempotency({ ...base, clientAttemptId: "" }), /client attempt id/);
  await assert.rejects(() => buildAttemptIdempotency({ ...base, timeTakenSeconds: -1 }), /timeTakenSeconds/);
});


test("canonical response fingerprints are stable for punctuation-bearing ASCII IDs", async () => {
  const first = await buildAttemptIdempotency({
    ...base,
    responses: { "q-z": "A", "q_1": "B", "qA": null, "q-2": "C" },
  });
  const reordered = await buildAttemptIdempotency({
    ...base,
    responses: { "q-2": "C", "qA": null, "q_1": "B", "q-z": "A" },
  });
  assert.equal(first.documentId, reordered.documentId);
  assert.equal(first.fingerprint, reordered.fingerprint);
});
