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
4. `commitAttemptAtomically({ uid, testId, documentId, fingerprint, attempt })`: atomically create the attempt and idempotency record, or replay the exact prior result.
5. `loadAttemptForReview({ uid, attemptId, now })`: enforce ownership/admin permission and the server-side solution-release policy before returning any answer or explanation.

No adapter is currently implemented. The worker must continue returning 503 until all operations and their authorization rules are integrated and tested. The submission orchestration calls `authorizeAttempt` after loading trusted published-test metadata but **before** loading canonical questions. It also validates that the trusted student profile ID exactly matches the verified UID before loading canonical questions. Regression tests assert that unauthorized requests and mismatched profiles do not trigger answer-key reads.

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


## Submission receipt versus solution review
The submission orchestration now strips `scoreBreakdown` from immediate and idempotent-replay receipts. The stored attempt retains the trusted per-question result for a future review flow, but correctness details must be returned only through a separate endpoint that enforces attempt ownership/admin access and the test's trusted solution-release policy. Aggregate score and counts remain in the receipt for immediate result compatibility. This is a service-level guard; the HTTP endpoint is still not wired to the service.


## Review service scaffold added
`src/attemptReviewService.mjs` now composes trusted attempt lookup with `authorizeAttemptReview`. It applies the same 404 behavior to missing and foreign attempts, uses server-derived admin status and release policy, allowlists the returned attempt receipt fields, and includes `scoreBreakdown` only when the policy permits solution viewing. Regression tests cover ownership, admin authorization, malformed release policy, and response allowlisting. This remains an isolated service: no HTTP route or production repository adapter calls it yet, so it is not a deployed access control.

The review service also verifies that the repository-returned attempt ID matches the requested ID and projects nested `scoreBreakdown.questionResults` through an explicit field allowlist; it does not return the nested objects wholesale. Regression tests assert internal fields and unapproved answer metadata are omitted. The repository adapter must still enforce least-privilege access and return trusted release/admin metadata.

The review response projector now sanitizes nested `responses`, `questionStatuses`, and `sectorAnalysis` fields as well as `scoreBreakdown`. It validates question IDs and known answer/status values and allowlists sector metric fields. Tests include malformed nested values and internal metadata to ensure these objects are not passed through wholesale.


## Firestore REST adapter implementation (not connected to the HTTP route)
`src/firestoreRestClient.mjs` now provides authenticated Firestore REST reads, batched question reads, typed Firestore value encoding/decoding, and `documents:commit` writes. `src/googleServiceAccountToken.mjs` creates and caches short-lived Google OAuth access tokens from a service-account PKCS#8 key; the key and service-account email must be configured as Worker secrets, and IAM must be restricted to the required collections. `src/firestoreAttemptRepository.mjs` implements the repository operations and atomically creates both `trustedAttempts/{id}` and `trustedAttemptIdempotency/{id}` using Firestore create-only preconditions in one commit. A failed/concurrent commit is resolved by reading the trusted idempotency record and replaying only an exact fingerprint match.

The adapter deliberately uses `trustedAttempts` and `trustedAttemptIdempotency`, not the existing client-writable `attempts` collection. This avoids treating legacy client-created scores as trusted. These new collections still require a reviewed deny-by-default client Firestore rules policy, least-privilege server IAM, live-schema compatibility checks, and a UI/history migration plan. The worker HTTP route does not instantiate or call this adapter yet. No credentials, rules, live data, or deployment settings were changed. Tests use mocked Firestore REST responses and therefore validate adapter logic, not live IAM, Firestore transaction behavior, or production load.

Submission receipts are now allowlisted too: persisted replay documents are projected through an explicit top-level field list and sanitized nested response/status/subject-analysis maps. Synthetic `__path` and unknown repository fields are not returned. This is important because the Firestore REST decoder adds internal path metadata to returned documents. A regression test injects such fields into a stored attempt and asserts they are omitted from the replay response.
