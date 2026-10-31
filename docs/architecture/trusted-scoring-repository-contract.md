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

The Firestore REST client accepts an explicit `databaseId`. Configure it from the verified target environment rather than relying on the `(default)` database: the application has used a named Firestore database. `wrangler.toml` now contains a non-production placeholder `FIRESTORE_DATABASE_ID`; it is intentionally not populated with production values. Never point this adapter at live data until the exact project/database pair, service-account permissions, and test schema have been verified.


## HTTP submission route integration status

The Worker `POST /v1/attempts:submit` route now calls the trusted submission orchestration and the Firestore repository factory after Firebase ID-token verification and strict request parsing. The route derives the user ID only from the verified token, returns a minimal allowlisted attempt receipt, and keeps backend configuration failures fail-closed (503). Repository initialization is cached per Worker isolate for OAuth token reuse and a failed initialization can be retried. Basic HTTP guard tests cover health, missing bearer token, and unknown routes.

Required Cloudflare Worker configuration (not currently populated):
- Variables: `FIREBASE_PROJECT_ID`, `FIRESTORE_DATABASE_ID`.
- Secrets: `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` (PKCS#8 PEM; escaped newline form is supported).

Do not configure these against production yet. Before a non-production integration test, provision a dedicated test Firebase project/database and synthetic user/test/question documents, create a service account with the narrowest practical Firestore access, and apply client-deny rules for `trustedAttempts` and `trustedAttemptIdempotency`. The adapter's trusted collections and current Firestore security rules must be reviewed together. The app's actual stored user profile must contain an `id` matching the UID; the adapter now preserves the stored ID rather than manufacturing it from the document path, and a regression test covers mismatch rejection.

The route is wired in source but no Worker deployment, secrets, Firestore rules, production records, or live student client migration has occurred. The tests still use mocked Firestore transport; real non-production integration remains a mandatory gate.


## Current implementation status correction (2026-10-31)

This section supersedes earlier historical status sentences above that describe the adapter or HTTP routes as not yet implemented/wired. The Worker now wires both `POST /v1/attempts:submit` and `GET /v1/attempts/{attemptId}/review` to the trusted service/repository factory. The Firestore REST repository and service-account OAuth token provider are implemented in source. The current CI suite includes unit, repository, REST transport, route, and in-memory HTTP journey tests; the latest reviewed CI workflows passed on commit `5cd2efbe1a035a02cb2dfc2014c1ee5834b8e9cf` before this documentation/rules-only follow-up.

The Firestore rules source now contains explicit client-deny matches for `trustedAttempts/{attemptId}` and `trustedAttemptIdempotency/{idempotencyId}`. This is a source change on the draft PR branch only: it has **not** been deployed. The existing broad deny fallback already denied unmatched collections; the explicit matches make the intended server-owned boundary auditable. Because Firestore rules are additive across matching blocks, these explicit denies do not override any future permissive overlapping match; do not add another broad allow for these paths.

Still unverified: live non-production Firestore REST behavior (including streamed `:batchGet` response parsing and create-only `:commit` preconditions), service-account IAM, actual user/test/question schema compatibility, rules emulator evaluation, and end-to-end integration with synthetic accounts. No secrets, service-account credentials, production records, deployed rules, or Worker deployment have been changed. Treat all earlier paragraphs labelled as historical scaffolding notes as chronological implementation notes, not current status.


## Emulator authorization verification (2026-10-31)

The CI workflow now runs both the static Firestore rules regression checks and `scripts/firestore-trusted-access.emulator.test.ts` against the Firestore Emulator. The emulator test seeds synthetic records with the emulator-only rules bypass, then verifies that unauthenticated clients, a synthetic authenticated student, and the bootstrap-admin identity are denied document reads, collection queries, creates, updates, and deletes for both trusted collections. The CI job provisions Temurin Java 21 because the current Firebase CLI requires Java 21 or newer. The full Firebase Spark CI and Build Integrity workflows passed on commit `dde3f3afe81e2d35f44c85f446757769b4b0603a`; the emulator log explicitly reports all three identity cases passed.

This proves the client Firestore Rules boundary in the emulator only. It does not prove server OAuth IAM, production rules deployment, Firestore REST behavior against a real database, or application migration. A separate REST-client regression now covers newline-delimited streaming responses from Firestore `:batchGet`, in addition to array-shaped responses and create-only `:commit` request preconditions.


## Commit failure recovery hardening (2026-10-31)

The Firestore repository now classifies commit errors before attempting read-after-write recovery. Only known precondition/concurrency conflicts (`ALREADY_EXISTS`, `FAILED_PRECONDITION`, `ABORTED`, HTTP 409/412), transient/throttled/server responses (408/429/5xx), and transport interruptions trigger an idempotency lookup. Permanent authorization/configuration/client errors fail closed without a recovery read, so a permission denial cannot be hidden by a secondary lookup. Tests cover a 403 with zero recovery reads and a lost acknowledgement after the atomic write, which must replay the exact stored result. Firebase Spark CI and Build Integrity both passed on commit `039a384716a97ce6017d198a5d29c23c5dea4079`.

This remains unit/emulator validation only. Real non-production service-account IAM and Firestore REST integration still require an isolated Firebase project/database and synthetic data; no project credentials or deployment were supplied or changed.


## Gated live non-production smoke test (2026-10-31)

Added `scripts/trusted-firestore-smoke.mjs` for an operator-run integration check when a dedicated non-production Firebase project/database and synthetic fixtures are available. It refuses to run unless the project and database IDs have approved non-production suffixes, the expected project ID matches, an exact confirmation string is supplied, and the UID/test/question IDs are synthetic. It exchanges a server-only service-account key for a datastore-scoped OAuth token; validates a published test, matching synthetic profile UID, explicit assigned question IDs and canonical question reads; creates the trusted attempt and idempotency record atomically; verifies exact retry replay and changed-payload conflict; and deletes its uniquely generated smoke documents in a `finally` cleanup.

Required environment variables are documented in the script's error messages and names: `FIREBASE_PROJECT_ID`, `FIRESTORE_DATABASE_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`, `TRUSTED_FIRESTORE_EXPECTED_PROJECT_ID`, `TRUSTED_FIRESTORE_NONPROD_CONFIRMATION`, `TRUSTED_FIRESTORE_TEST_UID`, and `TRUSTED_FIRESTORE_TEST_ID`. The confirmation must equal `NON_PRODUCTION:<projectId>:<databaseId>`; the project/database must end in `-dev`, `-test`, `-qa`, `-staging`, or `-sandbox`; fixture UID/test/question IDs must start with `synthetic-`. CI checks script syntax only and never runs it or receives credentials. This is a guarded operator-run integration script, not proof of a live integration. No secrets, project configuration, database documents, deployed rules, or production resources were changed.


### Smoke-test cleanup failure semantics (2026-10-31)

The smoke test tracks whether the atomic commit has been attempted. If authentication or fixture validation fails before any write is attempted, it skips cleanup so a second token request cannot obscure the original failure. Immediately before the atomic commit call, it marks the write as potentially started; from that point, cleanup always attempts to delete both unique smoke documents, including after an ambiguous/lost commit acknowledgement. Cleanup failures remain visible as test failures rather than being silently ignored. This does not relax the non-production guard or change any production resources.
