import test from "node:test";
import assert from "node:assert/strict";
import { authorizeStudentAttempt } from "../src/attemptEligibility.mjs";

const now = Date.parse("2026-10-29T10:00:00Z");
const base = {
  uid: "student-1",
  test: { id: "test-1", isPublished: true, isPro: false },
  user: { id: "student-1", status: "active" },
  now,
};

test("allows a published free test for an active student", () => {
  assert.deepEqual(authorizeStudentAttempt(base), {
    allowed: true, status: 200, reason: "FREE_TEST",
  });
});

test("rejects unpublished or missing tests", () => {
  assert.equal(authorizeStudentAttempt({ ...base, test: { isPublished: false } }).status, 404);
  assert.equal(authorizeStudentAttempt({ ...base, test: null }).reason, "TEST_NOT_FOUND");
});

test("rejects blocked and suspended student profiles", () => {
  assert.equal(authorizeStudentAttempt({ ...base, user: { id: "student-1", isBlocked: true } }).reason, "STUDENT_BLOCKED");
  assert.equal(authorizeStudentAttempt({ ...base, user: { id: "student-1", status: "suspended" } }).status, 403);
});

test("rejects a mismatched trusted student profile", () => {
  assert.equal(authorizeStudentAttempt({ ...base, user: { id: "student-victim" } }).reason, "STUDENT_PROFILE_UNAVAILABLE");
});

test("premium test requires an unexpired profile pass or active entitlement", () => {
  const test = { ...base.test, isPro: true };
  assert.equal(authorizeStudentAttempt({ ...base, test }).reason, "PREMIUM_ACCESS_REQUIRED");
  assert.equal(authorizeStudentAttempt({
    ...base, test, user: { id: "student-1", hasProPass: true, passExpiresAt: "2026-10-29T11:00:00Z" },
  }).reason, "ACTIVE_PASS");
  assert.equal(authorizeStudentAttempt({
    ...base, test, entitlement: { status: "ACTIVE", expiresAt: "2026-10-29T11:00:00Z" },
  }).allowed, true);
});

test("expired, pending, or malformed passes do not authorize premium tests", () => {
  const test = { ...base.test, isPro: true };
  assert.equal(authorizeStudentAttempt({
    ...base, test, entitlement: { status: "ACTIVE", expiresAt: "2026-10-29T10:00:00Z" },
  }).allowed, false);
  assert.equal(authorizeStudentAttempt({
    ...base, test, entitlement: { status: "PENDING", expiresAt: "2026-10-29T11:00:00Z" },
  }).allowed, false);
  assert.equal(authorizeStudentAttempt({
    ...base, test, user: { id: "student-1", hasProPass: true, passExpiresAt: "not-a-date" },
  }).allowed, false);
});

test("series enrollment metadata alone cannot grant premium access", () => {
  const test = { ...base.test, isPro: true, seriesId: "series-1" };
  const enrollment = {
    id: "enroll-1", userId: "student-1", seriesId: "series-1",
    status: "active", accessType: "PURCHASED",
  };
  assert.equal(authorizeStudentAttempt({ ...base, test, enrollments: [enrollment] }).reason, "PREMIUM_ACCESS_REQUIRED");
  assert.equal(authorizeStudentAttempt({ ...base, test, enrollments: [{ ...enrollment, userId: "student-victim" }] }).allowed, false);
  assert.equal(authorizeStudentAttempt({ ...base, test, enrollments: [{ ...enrollment, seriesId: "other-series" }] }).allowed, false);
});

test("expired and cancelled enrollment metadata does not grant access", () => {
  const test = { ...base.test, isPro: true, seriesId: "series-1" };
  const enrollment = {
    userId: "student-1", seriesId: "series-1", status: "active",
    accessType: "PASS", accessExpiresAt: "2026-10-29T09:59:59Z",
  };
  assert.equal(authorizeStudentAttempt({ ...base, test, enrollments: [enrollment] }).allowed, false);
  assert.equal(authorizeStudentAttempt({
    ...base, test, enrollments: [{ ...enrollment, status: "cancelled", accessExpiresAt: undefined }],
  }).allowed, false);
});

test("rejects missing identity and invalid policy clock", () => {
  assert.equal(authorizeStudentAttempt({ ...base, uid: "" }).status, 401);
  assert.equal(authorizeStudentAttempt({ ...base, now: Number.NaN }).reason, "INVALID_POLICY_CLOCK");
});


test("fails closed when a trusted student profile is missing its required identity", () => {
  assert.equal(authorizeStudentAttempt({ ...base, user: { status: "active" } }).reason, "STUDENT_PROFILE_UNAVAILABLE");
  assert.equal(authorizeStudentAttempt({ ...base, user: { id: "" } }).reason, "STUDENT_PROFILE_UNAVAILABLE");
});

test("premium entitlement expiry must be strictly in the future", () => {
  const premiumTest = { ...base.test, isPro: true };
  assert.equal(authorizeStudentAttempt({
    ...base, test: premiumTest,
    entitlement: { status: "ACTIVE", expiresAt: "2026-10-29T10:00:00Z" },
  }).reason, "PREMIUM_ACCESS_REQUIRED");
  assert.equal(authorizeStudentAttempt({
    ...base, test: premiumTest,
    entitlement: { status: "ACTIVE", expiresAt: "2026-10-29T10:00:00.001Z" },
  }).reason, "ACTIVE_PASS");
});
