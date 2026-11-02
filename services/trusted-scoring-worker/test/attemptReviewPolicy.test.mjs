import test from "node:test";
import assert from "node:assert/strict";
import { authorizeAttemptReview } from "../src/attemptReviewPolicy.mjs";

const base = {
  requesterUid: "student-1",
  attemptOwnerUid: "student-1",
  releasePolicy: { mode: "immediate" },
  now: Date.parse("2026-10-29T10:00:00Z"),
};

test("requires authenticated identity", () => {
  assert.equal(authorizeAttemptReview({ ...base, requesterUid: "" }).status, 401);
});

test("does not disclose a different student's attempt", () => {
  const result = authorizeAttemptReview({ ...base, requesterUid: "student-2" });
  assert.equal(result.status, 404);
  assert.equal(result.reason, "ATTEMPT_NOT_FOUND");
});

test("owner can view solutions after immediate release", () => {
  const result = authorizeAttemptReview(base);
  assert.equal(result.allowed, true);
  assert.equal(result.canViewSolutions, true);
});

test("scheduled solutions remain hidden until release timestamp", () => {
  const releasePolicy = { mode: "scheduled", releaseAt: "2026-10-29T12:00:00Z" };
  const before = authorizeAttemptReview({ ...base, releasePolicy });
  const after = authorizeAttemptReview({ ...base, releasePolicy, now: Date.parse("2026-10-29T12:00:00Z") });
  assert.equal(before.canViewSolutions, false);
  assert.equal(after.canViewSolutions, true);
});

test("manual release fails closed unless trusted record explicitly releases solutions", () => {
  assert.equal(authorizeAttemptReview({ ...base, releasePolicy: { mode: "manual", isReleased: false } }).canViewSolutions, false);
  assert.equal(authorizeAttemptReview({ ...base, releasePolicy: { mode: "manual", isReleased: true } }).canViewSolutions, true);
});

test("authorized admin can review another user's attempt; client cannot self-assert admin", () => {
  const admin = authorizeAttemptReview({ ...base, requesterUid: "admin-1", isAuthorizedAdmin: true });
  const student = authorizeAttemptReview({ ...base, requesterUid: "student-2", isAuthorizedAdmin: false });
  assert.equal(admin.canViewSolutions, true);
  assert.equal(student.status, 404);
});

test("unknown or malformed release policy does not reveal solutions", () => {
  assert.equal(authorizeAttemptReview({ ...base, releasePolicy: { mode: "future" } }).canViewSolutions, false);
  assert.equal(authorizeAttemptReview({ ...base, releasePolicy: { mode: "scheduled", releaseAt: "invalid" } }).canViewSolutions, false);
});
