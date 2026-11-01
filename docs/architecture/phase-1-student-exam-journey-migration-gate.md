# Phase 1 — Student Exam Journey Migration Gate

**Date:** 2026-11-01  
**Branch:** `security/student-question-api-projection`  
**Status:** Source audit and migration contract; implementation not yet cut over.  
**Production impact:** None. No live data, rules, billing, hosting, secrets, or deployment settings changed.

## Decision

Do not switch the live student journey to the trusted Worker in this change. The repository has a useful Worker core, but the app's existing attempt and review contracts are incompatible with a safe cutover. First introduce explicit transport/domain contracts and prove parity in non-production.

## Verified current journey

### 1. Exam question delivery

- `src/app/examSessionQuestions.ts` calls `fetchQuestionsByIdsFromFirestore`, then falls back to program-wide reads, then optionally to local catalog selection.
- The source service is `src/firebase/firestoreService.ts`; the canonical and student projection read paths must remain separate.
- `src/components/ExamEngine.tsx` accepts `Question[]`, stores candidate responses/statuses in localStorage, and checkpoints the exam. The checkpoint also stores question IDs and count. It does not itself define a trusted question source.
- `src/utils/offlineExamManager.ts` applies `toStudentQuestion` before writing the offline bundle. This is a useful field-redaction boundary, but it cannot protect keys if the browser previously fetched canonical records.

**Required change:** make the exam launch resolver accept only an exact published test definition and an ordered safe question DTO list. Missing, duplicate, or extra IDs must fail closed with a recoverable content error; never silently widen to program/category/all questions. Keep offline cache explicitly best-effort and never treat it as a security boundary.

### 2. Submission and scoring

- `src/utils/apiClient.ts` implements `submitAttempt` in the browser.
- It reads the entire canonical `questions` collection, calls a browser-side resolver that fills missing questions by exam name, authority/category, then all questions, and computes correctness/marks/negative marks in the browser.
- It writes the client-computed attempt to `attempts` using `setDoc(..., { merge: true })`.
- It returns `solutions: testQuestions.map(toStudentQuestion)`; this is a student-safe question projection and does not satisfy the existing review UI's need for `correctOption` and explanations.
- `src/app/persistSubmittedAttempt.ts` separately saves the attempt and leaderboard profile records through injected dependencies. This must be reviewed before replacing the current persistence adapter, to avoid duplicate writes or stale local attempt history.

**Required change:** browser submission payload contains only `testId`, `clientAttemptId`/idempotency key, response map, and bounded time telemetry. The browser must not send scores, correctness, answer keys, marks, or trusted identity/role claims. The Worker derives UID from verified Firebase ID token, resolves exact published test section IDs, authorizes eligibility, loads canonical answers, scores, and commits attempt + idempotency record atomically. The accepted receipt must not contain per-question correctness.

### 3. Review and solution release

- `src/components/SolutionsScreen.tsx` filters correct/incorrect responses by comparing `attempt.responses[q.id]` to `q.correctOption`.
- It also expects question explanations and question content in its `questions` prop.
- `src/app/attemptReviewResolver.ts` accepts caller-provided questions and falls back to the full supplied list.
- Worker route `GET /v1/attempts/{attemptId}/review` exists in `services/trusted-scoring-worker/src/index.mjs` and calls the review service after token verification.
- The route returns `canViewSolutions` plus `attempt: review.result`; the UI contract must explicitly handle the denied/not-yet-released state and the authorized review DTO. Do not infer permission from the presence of data.
- `src/components/SEOQuestionView.tsx` is a separate public solved-question surface. Publicly released solutions must be an explicit publishing decision and must not leak active/unreleased exam keys.

**Required change:** replace client-side question-based review filtering with server-returned per-question result/review DTOs only after the Worker confirms ownership/admin scope and solution release. Keep summary score receipt separate from solution payload. A student who is not yet permitted to see solutions may see only the allowed aggregate result and a clear release state.

## Worker readiness boundary

The Worker implementation contains token verification, request validation, eligibility checks, exact test-definition construction, scoring, idempotency, repository abstraction, atomic Firestore REST commit adapter, and review sanitization. However, source presence is not proof of a deployed service.

- `createTrustedScoringWorker` requires a configured repository and Firebase project environment; missing repository configuration returns 503.
- The current app's `apiClient.ts` still uses Firestore-native browser submission. It does not call the Worker endpoints.
- `src/services/trustedScoringClient.ts` now provides a typed, dependency-injected HTTP client for the Worker submission and review routes. Its contract tests cover the allowlisted payload, Firebase bearer token, idempotent retry receipt, hidden/released review state, invalid input, and network failure. It is deliberately not wired into `apiClient.ts` yet; no Worker endpoint has been deployed or configured, so the production submission path remains unchanged.
- No client integration, deployed endpoint origin, production secrets, Worker health evidence, or live non-production Firestore/IAM proof is established by this source audit.
- The scoring core now supports the app's four declared single-key formats: `mcq`, `matching`, `assertion_reason`, and `multi_statement`, where the student selects one A/B/C/D option and the canonical record supplies one corresponding key. A regression test covers the three structured formats. Multi-select/multiple-correct, integer/numeric-entry, and questions whose grading requires multiple keys or custom rubrics remain unsupported and fail closed; image-based stems are compatible only when their answer still follows the same single-key contract.
- The actual entitlement/pass/device policy and published test schema must be validated against isolated non-production data, not inferred from UI state.

## Safe implementation order

1. Add explicit DTO types: `StudentExamQuestion`, `AttemptSubmissionRequest`, `AttemptReceipt`, `AttemptReviewResponse`. Keep canonical/admin `Question` separate.
2. Add a strict resolver that verifies exact section IDs and exact counts, preserving configured section/order. Unit-test missing IDs, duplicate IDs, count mismatch, unpublished test, and empty paper. No broad fallback.
3. ~~Add a Worker HTTP client~~ **Transport client implemented:** `src/services/trustedScoringClient.ts` obtains a fresh Firebase ID token through an injected `getIdToken()` function, sends only allowlisted submission fields, preserves idempotent retry semantics, and never logs bearer tokens or response maps. Remaining: wire it to Firebase Auth and the UI behind an explicit non-production endpoint configuration, then test the full app journey.
4. Add a non-production feature flag/configuration for the Worker endpoint. Fail closed for authoritative submissions if the endpoint is unavailable; do not silently fall back to browser scoring and call the result verified. Keep the existing production path unchanged until explicit cutover.
5. Adapt the result UI to consume only `AttemptReceipt`. Do not fabricate review data from safe question projections.
6. Add a dedicated review client and `SolutionsScreen` adapter for the review DTO, including pending-release, denied, not-found, and retry states.
7. Reconcile leaderboard and profile updates. Do not let the browser write trusted ranks/percentiles; if only client aggregation is available, label it unverified and isolate it from authoritative score persistence.
8. Test end-to-end with emulator/isolated Worker repository: start, refresh/resume, timeout, submit, double click, network retry/lost acknowledgement, cross-user review, review before release, review after release, and all supported question types.
9. Only after successful non-production journeys and explicit operator approval, deploy Worker first, verify health, then enable client traffic for synthetic users, then staged cohorts. Tighten Firestore canonical read rules only after every direct client read path is removed and production projection verification is complete.

## Required invariants

- A student client never reads `questions/{id}` canonical answer-key documents.
- A student client never writes an authoritative score or modifies an accepted attempt.
- Test composition is fixed by trusted published metadata; no fallback paper expansion.
- Submission is idempotent for a given authenticated UID, test ID, and client attempt ID.
- Attempt ownership is checked on every review request.
- Solution release is enforced server-side, independently of UI state.
- No service-account private key or Worker secret is shipped to the browser.
- The app never silently falls back from trusted scoring to client scoring while displaying a verified result.
- Existing production exam launch, submission, history, leaderboard and review behavior remains unchanged until a complete migration is verified.

## Read-only published-definition audit utility

`src/firebase/studentExamDefinitionAuditFirestore.ts` exposes a read-only Firestore entry point for a controlled audit. It queries `mockTests` where `isPublished == true`, limits the scan to 501 records to detect overflow, validates Firestore document ID against the embedded `id`, then checks explicit IDs in `studentQuestions`. It never reads canonical `/questions` and never writes. The audit has a default 5,000-question-ID budget (maximum 25,000) and a bounded worker pool (default concurrency 4, maximum 10). Results retain source order. A run exceeding 500 published tests fails closed and must be explicitly scoped rather than silently truncating.

This utility is not invoked automatically. A guarded operator command is available as `npm run audit:published-exams`. It requires both `CGSSB_AUDIT_CONFIRM_PROJECT_ID` to exactly match the configured Firebase project and `CGSSB_AUDIT_CONFIRM_READ_ONLY=YES`; optional limits are `CGSSB_AUDIT_MAX_QUESTION_IDS` (default 5,000; max 25,000) and `CGSSB_AUDIT_CONCURRENCY` (default 4; max 10). Example (replace the project ID with the exact configured value): `CGSSB_AUDIT_CONFIRM_PROJECT_ID=<project-id> CGSSB_AUDIT_CONFIRM_READ_ONLY=YES npm run audit:published-exams`. It uses the app's public Firebase web configuration and existing Firestore read rules; it does not require a service-account key and never writes. Run only from an authorized controlled environment; retain the aggregate summary securely and do not publish test IDs/titles. It is a readiness audit, not proof that the student client has migrated to trusted scoring.

## Gate result

**NOT READY FOR STUDENT CLIENT CUTOVER.** The source audit confirms a Worker foundation but the browser journey still reads canonical answers and computes/writes the score itself. This is an intentional stop, not a production failure. Keep PR #10 draft and do not merge or deploy until the above invariants are proven by integrated tests.
