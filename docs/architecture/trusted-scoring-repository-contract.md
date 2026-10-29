# Trusted Scoring Repository Contract

**Status:** Implementation contract for the isolated worker scaffold; not wired to production data.

## Boundary

The browser supplies only:
- test ID,
- response map,
- client-generated attempt idempotency key,
- elapsed time telemetry.

The worker derives identity exclusively from a successfully verified Firebase ID token. It must never accept a UID, role, score, answer key, question definition, test publication state, or entitlement from request JSON.

## Required repository operations

A production adapter must implement these operations with a documented credential model and least privilege:

1. `loadPublishedTest(testId)`: fetch authoritative test definition and reject missing/unpublished tests.
2. `loadCanonicalQuestions(questionIds)`: fetch canonical question records by exact ID; reject missing/duplicate IDs and preserve the test's declared order.
3. `authorizeAttempt({ uid, test, now })`: enforce current access policy (free test, purchase/pass, enrollment, blocked status, attempt limits, and any schedule window) from trusted records. Authentication alone is not eligibility.
4. `commitAttempt({ uid, testId, idempotencyDocumentId, fingerprint, result, metadata })`: atomically create the attempt and idempotency record, or replay the exact prior result.
5. `loadAttemptForReview({ uid, attemptId, now })`: enforce ownership/admin permission and the server-side solution-release policy before returning any answer or explanation.

No adapter is currently implemented. The worker must continue returning 503 until all operations and their authorization rules are integrated and tested. The submission orchestration now calls `authorizeAttempt` after loading trusted published-test metadata but **before** loading canonical questions, so unauthorized requests do not trigger answer-key reads.

## Published test resolution

`src/trustedTestDefinition.mjs` is a fail-closed pure helper:
- Requires `isPublished === true`.
- Requires each section to enumerate explicit `questionIds`.
- Requires unique question IDs and exact agreement with `questionCount`.
- Resolves only those IDs against canonical questions.
- Rejects missing questions, duplicate canonical IDs, malformed duration, and invalid scoring configuration.
- Never uses the current browser's broad exam/category/all-question fallback.

Before production integration, reconcile these requirements with actual production test documents. Tests that do not have complete explicit question IDs must be corrected through the admin catalog first; the worker must not guess a question set.

## Atomic idempotency requirements

`src/attemptIdempotency.mjs` derives:
- a deterministic document key scoped to authenticated UID, test ID, and client attempt key;
- a SHA-256 fingerprint of UID, test ID, sorted responses, and elapsed-time telemetry.

The helper is not a persistence implementation. In a single transaction, the adapter must:
- if no record exists, create the finalized attempt and idempotency record together;
- if the same key and same fingerprint already exist, return the original stored result unchanged;
- if the same key exists with a different fingerprint, return a conflict (HTTP 409) and do not overwrite the original attempt;
- never allow a different UID to read or replay another user's attempt;
- avoid logging tokens, answer keys, or raw response payloads.

The stored result must be immutable to student clients. The current Firestore rules allow students to create their own attempt documents with client-supplied scores, so those rules are not a substitute for trusted scoring. Do not point this adapter at production until an approved access model and rules/data design exist.

## Scoring contract

Use `src/scoring.mjs` only with question objects loaded from the trusted repository. It currently supports single-choice A/B/C/D questions only and rejects unsupported types. It must not be called with question data from the browser. The test definition's configured marks/negative-marking policy and per-question overrides must be normalized and regression-tested against current exam behavior before cutover.

## Release gates

- [ ] Confirm production test documents use explicit question IDs and reconcile missing/duplicate IDs.
- [ ] Decide entitlement and attempt-limit policy from authoritative collections.
- [ ] Decide solution release rules for mock tests, PYP, current affairs, and SEO solved-question pages separately.
- [ ] Select a trusted data-access identity with least privilege; no broad service-account key committed to Git.
- [ ] Implement transactionally atomic attempt/idempotency persistence and cross-user denial tests.
- [ ] Run worker unit tests and integration tests against a non-production project with synthetic accounts.
- [ ] Migrate browser submission/review consumers and verify response compatibility.
- [ ] Run load and abuse tests, then approve a staged deployment/rollback plan.

Until these gates pass, the worker remains a non-production scaffold and the draft PR must not be merged or deployed.


## Eligibility policy helper added (not yet wired)
`services/trusted-scoring-worker/src/attemptEligibility.mjs` now defines a pure, testable policy against the repository's existing field contracts:
- Rejects unpublished/missing tests and blocked/suspended student records.
- Allows published tests not explicitly marked `isPro: true`.
- For premium tests, accepts only an unexpired profile pass or active unexpired user entitlement. Series enrollment metadata alone does not grant premium access, consistent with the Firestore rules comment that the active pass is authoritative for pass-based access.
- Rejects expired/malformed passes and expired/cancelled/mismatched enrollments.

This helper is not an authorization control until a trusted adapter loads the test, user, entitlement, and enrollment records using the verified UID and invokes it. Before production use, confirm whether all premium access paths in the live catalog are represented by the pass/entitlement records (including bundle-level purchases, device binding, attempt limits, and schedule windows). Missing policy paths must be implemented before rollout; do not silently treat this helper as a complete entitlement implementation.
