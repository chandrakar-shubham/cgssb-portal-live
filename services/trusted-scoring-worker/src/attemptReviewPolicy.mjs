/**
 * Pure policy helper for the trusted repository's attempt-review endpoint.
 *
 * Inputs such as isAuthorizedAdmin and release configuration MUST come from
 * verified identity and trusted server-side records, never from request JSON.
 */
export function authorizeAttemptReview({
  requesterUid,
  attemptOwnerUid,
  isAuthorizedAdmin = false,
  releasePolicy,
  now = Date.now(),
}) {
  if (typeof requesterUid !== "string" || requesterUid.length === 0) {
    return { allowed: false, status: 401, reason: "UNAUTHENTICATED" };
  }
  if (typeof attemptOwnerUid !== "string" || attemptOwnerUid.length === 0) {
    return { allowed: false, status: 404, reason: "ATTEMPT_NOT_FOUND" };
  }
  if (!Number.isFinite(now)) {
    return { allowed: false, status: 500, reason: "INVALID_POLICY_CLOCK" };
  }

  const isOwner = requesterUid === attemptOwnerUid;
  if (!isOwner && isAuthorizedAdmin !== true) {
    // Use the same external response for absent and foreign attempts to avoid
    // disclosing whether another student's attempt exists.
    return { allowed: false, status: 404, reason: "ATTEMPT_NOT_FOUND" };
  }

  // Admins may access a review only through the explicit admin path. This
  // helper permits owner access to result metadata but separately gates answers.
  if (isAuthorizedAdmin === true && !isOwner) {
    return { allowed: true, canViewSolutions: true, reason: "AUTHORIZED_ADMIN" };
  }

  if (!releasePolicy || typeof releasePolicy !== "object") {
    return { allowed: true, canViewSolutions: false, reason: "RELEASE_POLICY_MISSING" };
  }

  if (releasePolicy.mode === "immediate") {
    return { allowed: true, canViewSolutions: true, reason: "SOLUTIONS_RELEASED" };
  }

  if (releasePolicy.mode === "scheduled") {
    const releaseAt = Date.parse(releasePolicy.releaseAt);
    if (!Number.isFinite(releaseAt)) {
      return { allowed: true, canViewSolutions: false, reason: "INVALID_RELEASE_SCHEDULE" };
    }
    const released = now >= releaseAt;
    return {
      allowed: true,
      canViewSolutions: released,
      reason: released ? "SOLUTIONS_RELEASED" : "SOLUTIONS_NOT_YET_RELEASED",
    };
  }

  if (releasePolicy.mode === "manual") {
    return {
      allowed: true,
      canViewSolutions: releasePolicy.isReleased === true,
      reason: releasePolicy.isReleased === true ? "SOLUTIONS_RELEASED" : "SOLUTIONS_NOT_YET_RELEASED",
    };
  }

  return { allowed: true, canViewSolutions: false, reason: "UNKNOWN_RELEASE_POLICY" };
}
