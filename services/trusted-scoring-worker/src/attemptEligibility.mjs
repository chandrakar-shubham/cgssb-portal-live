/**
 * Pure attempt eligibility policy. All records passed here must be loaded by
 * the trusted repository using the verified UID; never pass request JSON.
 *
 * Current app contracts: MockTest.isPro, User.status/isBlocked/hasProPass/
 * passExpiresAt, and UserEntitlement.status/expiresAt. Series enrollments are
 * organization/entitlement metadata, not an independent premium grant.
 */
function isFutureDate(value, now) {
  if (typeof value !== "string" || value.length === 0) return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && timestamp > now;
}

function hasValidEntitlementPass(uid, entitlement, now) {
  if (!entitlement || entitlement.status !== "ACTIVE" ||
      entitlement.userId !== uid || !isFutureDate(entitlement.expiresAt, now)) {
    return false;
  }

  // Students may create only a 30-day welcome/campaign entitlement. Do not
  // let a client-supplied far-future expiry turn that bootstrap grant into a
  // perpetual premium pass. Paid/admin entitlements remain server-managed.
  if (entitlement.source === "WELCOME_FREE" || entitlement.source === "FREE_CAMPAIGN") {
    if (entitlement.planType !== entitlement.source || entitlement.durationDays !== 30) {
      return false;
    }
    const issuedAt = typeof entitlement.issuedAt === "string"
      ? Date.parse(entitlement.issuedAt)
      : Number.NaN;
    const expiresAt = Date.parse(entitlement.expiresAt);
    const maxDurationMs = 30 * 24 * 60 * 60 * 1000;
    return Number.isFinite(issuedAt) && issuedAt <= now &&
      Number.isFinite(expiresAt) && expiresAt > now &&
      expiresAt <= issuedAt + maxDurationMs;
  }

  return true;
}

function hasValidPass(uid, user, entitlement, now) {
  const profilePass = user?.hasProPass === true && isFutureDate(user.passExpiresAt, now);
  return profilePass || hasValidEntitlementPass(uid, entitlement, now);
}

/**
 * @returns { {allowed:boolean,status:number,reason:string} }
 */
export function authorizeStudentAttempt({ uid, test, user, entitlement = null, now = Date.now() }) {
  if (typeof uid !== "string" || uid.length === 0) {
    return { allowed: false, status: 401, reason: "UNAUTHENTICATED" };
  }
  if (!Number.isFinite(now)) {
    return { allowed: false, status: 500, reason: "INVALID_POLICY_CLOCK" };
  }
  if (!test || typeof test !== "object" || test.isPublished !== true) {
    return { allowed: false, status: 404, reason: "TEST_NOT_FOUND" };
  }
  // The profile must be the exact document belonging to the verified UID.
  // Missing IDs are malformed trusted data and must not be treated as a match.
  if (!user || typeof user.id !== "string" || user.id !== uid) {
    return { allowed: false, status: 403, reason: "STUDENT_PROFILE_UNAVAILABLE" };
  }
  if (user.isBlocked === true || user.status === "blocked" || user.status === "suspended") {
    return { allowed: false, status: 403, reason: "STUDENT_BLOCKED" };
  }

  // Existing catalog semantics: only tests explicitly marked isPro are gated.
  if (test.isPro !== true) {
    return { allowed: true, status: 200, reason: "FREE_TEST" };
  }

  // The live rules document says series enrollments organize My Tests; the
  // active pass/entitlement is authoritative for access. Do not grant premium
  // access merely because a student can create or mutate enrollment metadata.
  if (hasValidPass(uid, user, entitlement, now)) {
    return { allowed: true, status: 200, reason: "ACTIVE_PASS" };
  }
  return { allowed: false, status: 403, reason: "PREMIUM_ACCESS_REQUIRED" };
}
