/**
 * Pure attempt eligibility policy. All records passed here must be loaded by
 * the trusted repository using the verified UID; never pass request JSON.
 *
 * Current app contracts: MockTest.isPro, User.status/isBlocked/hasProPass/
 * passExpiresAt, UserEntitlement.status/expiresAt, SeriesEnrollment fields.
 */
function isFutureDate(value, now) {
  if (typeof value !== "string" || value.length === 0) return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && timestamp > now;
}

function hasValidPass(user, entitlement, now) {
  const profilePass = user?.hasProPass === true && isFutureDate(user.passExpiresAt, now);
  const activeEntitlement = entitlement?.status === "ACTIVE" &&
    isFutureDate(entitlement.expiresAt, now);
  return profilePass || activeEntitlement;
}

function hasValidEnrollment(uid, test, enrollments, now) {
  if (typeof test.seriesId !== "string" || !test.seriesId || !Array.isArray(enrollments)) return false;
  return enrollments.some(enrollment => {
    if (!enrollment || enrollment.userId !== uid || enrollment.seriesId !== test.seriesId ||
        enrollment.status !== "active" ||
        !["PASS", "PURCHASED"].includes(enrollment.accessType)) return false;
    return enrollment.accessExpiresAt == null || isFutureDate(enrollment.accessExpiresAt, now);
  });
}

/**
 * @returns { {allowed:boolean,status:number,reason:string} }
 */
export function authorizeStudentAttempt({ uid, test, user, entitlement = null, enrollments = [], now = Date.now() }) {
  if (typeof uid !== "string" || uid.length === 0) {
    return { allowed: false, status: 401, reason: "UNAUTHENTICATED" };
  }
  if (!Number.isFinite(now)) {
    return { allowed: false, status: 500, reason: "INVALID_POLICY_CLOCK" };
  }
  if (!test || typeof test !== "object" || test.isPublished !== true) {
    return { allowed: false, status: 404, reason: "TEST_NOT_FOUND" };
  }
  if (!user || (typeof user.id === "string" && user.id !== uid)) {
    return { allowed: false, status: 403, reason: "STUDENT_PROFILE_UNAVAILABLE" };
  }
  if (user.isBlocked === true || user.status === "blocked" || user.status === "suspended") {
    return { allowed: false, status: 403, reason: "STUDENT_BLOCKED" };
  }

  // Existing catalog semantics: only tests explicitly marked isPro are gated.
  if (test.isPro !== true) {
    return { allowed: true, status: 200, reason: "FREE_TEST" };
  }

  if (hasValidPass(user, entitlement, now)) {
    return { allowed: true, status: 200, reason: "ACTIVE_PASS" };
  }
  if (hasValidEnrollment(uid, test, enrollments, now)) {
    return { allowed: true, status: 200, reason: "ACTIVE_SERIES_ENROLLMENT" };
  }
  return { allowed: false, status: 403, reason: "PREMIUM_ACCESS_REQUIRED" };
}
