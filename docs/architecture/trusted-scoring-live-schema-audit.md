# Trusted Scoring: Live Schema Compatibility Audit

**Status:** Source-contract audit only. No production database was queried or changed.

## Confirmed repository contracts

The application TypeScript contracts and Firestore rules establish the following:

- Test documents use the `mockTests` collection and the `MockTest` shape in `src/types.ts`.
- `MockTest` includes `id`, `isPublished?`, `isPro?`, `questionCount`, `durationMinutes`, `marksPerQuestion`, `negativeMarksPerQuestion`, and `sections: { id, name, questionIds[] }[]`.
- Canonical question records are in `questions`; the `Question` contract has `correctOption`, `marks`, `negativeMarks`, and question types `mcq`, `matching`, `assertion_reason`, and `multi_statement`.
- Student profiles are in `users`; status may be `active`, `blocked`, or `suspended`. The profile has `hasProPass`, `passExpiresAt`, and optional device-binding fields.
- Entitlement documents are in `userEntitlements/{userId}`, with `status`, `expiresAt`, `planType`, and related metadata. Rules reserve access-bearing updates to payment admins, apart from narrowly limited welcome-entitlement creation.
- `seriesEnrollments` is student-readable by owner and stores `accessType`, `status`, `seriesId`, and `accessExpiresAt`. The Firestore rules explicitly state that this collection organizes My Tests and that the active pass remains authoritative for pass-based test access. Student-created enrollments are limited to `accessType == 'PASS'` and zero amount paid.
- Student clients may create their own `attempts` documents under current rules, with client-supplied score/count fields. This is not authoritative scoring and must not be treated as secure persistence for the trusted worker.

## Critical compatibility gates

1. **Do not assume the live catalog is fully compatible.** The worker requires `isPublished === true`, explicit section question IDs, unique IDs, and exact `questionCount`. The source contract does not prove every production document satisfies these constraints.
2. **Do not infer purchased-series entitlements.** Current rules only permit student-created `PASS` enrollments; any actual purchase/checkout path and its authoritative records must be audited before granting access in the worker.
3. **Do not silently bypass device binding.** User and entitlement records contain device-binding fields. Decide whether/how these are enforced by the existing live client before implementing server authorization.
4. **Do not treat `isPro` as the entire access policy.** Confirm free previews, bundles, pass stages, schedules, attempt limits, blocked status, and all paid paths against the actual application behavior.
5. **Question-type compatibility is incomplete by design.** The trusted scorer currently supports single-answer A/B/C/D questions and fails closed for unsupported question types. Although the app has matching, assertion/reason, and multi-statement types, each must be verified to have a single answer-key representation before it is enabled.
6. **No trusted persistence adapter exists.** Current student rules permit client-side attempt creation and do not provide a worker-only identity. A real adapter needs a secure server identity and atomic attempt/idempotency writes. Do not reuse browser permissions as a substitute for a trusted backend.

## Required pre-cutover evidence

- Read-only inventory of actual published test documents and question references in a controlled environment.
- Report counts for missing publication flags, invalid/missing section question IDs, duplicate IDs, and question-count mismatches without exposing answer keys.
- Document current free-preview, pass, enrollment, device-binding, bundle, schedule, and attempt-limit semantics from code and records.
- Build the adapter and run integration tests against a non-production Firebase project using synthetic accounts.
- Migrate submission and review together; verify saved attempt compatibility, leaderboard/analytics, solution-release policy, and rollback.
- Run realistic concurrency/load tests before any production cutover.

## Safety state

This audit changes no Firestore rules, database records, credentials, billing plan, production deployment, or live student submission path. The worker endpoint must remain fail-closed until the gates above are satisfied.


## Additional scoring parity finding (must resolve before cutover)

The existing browser submission path in `src/utils/apiClient.ts` scores each question using `Number(q.marks || 1)` for positive marks and `q.negativeMarks ?? ((q.marks || 1) / 3)` for penalties. It does not currently use `test.marksPerQuestion` or `test.negativeMarksPerQuestion` in that calculation. The trusted worker instead uses the test-level defaults when a question's marks are missing and treats an explicit zero as zero. These paths can produce different scores for incomplete or zero-valued question records.

The browser path also includes `questionStatuses` to calculate `markedForReviewCount`, while the trusted worker's minimal wire contract intentionally rejects that field and currently sets `markedForReviewCount: 0`. This is a legitimate hardening boundary, but the client must be migrated to send a separately validated, non-authoritative review-status map if the product needs to preserve that metric. The server must validate IDs and allowed status values against the resolved test and must never use statuses to decide correctness.

Before the trusted scorer is considered compatible:
- Define a single documented source of truth for marks and negative marks (per-question versus test defaults).
- Decide whether zero marks are valid data or treated as missing; validate existing records accordingly.
- Add differential tests that run representative canonical question/test records through both legacy semantics and the approved server contract.
- Preserve or intentionally retire `markedForReviewCount` with explicit UI/analytics acceptance.
- Check rounding behavior, per-subject clamping, and score breakdown consumers. Current browser per-subject aggregation can retain a negative subject score even though the overall score is floored at zero; the trusted worker currently floors each subject score independently.


## Executable compatibility audit

The worker test suite now includes `test/scoringParityAudit.test.mjs`. These tests intentionally **pass by proving the known legacy/trusted differences**, rather than pretending the implementations are already equivalent. They cover:

- Missing question marks when the test-level default is not 1.
- Missing negative marks when the test-level penalty differs from one-third.
- Explicit zero marks, which the legacy `q.marks || 1` expression treats as missing.
- Unsupported matching questions remaining rejected until an explicit answer/scoring contract is implemented.

These tests are a temporary migration guard, not approval of either scoring policy. Before cutover, product/assessment owners must choose the canonical rules, then replace divergence assertions with parity tests against that approved contract. Per-subject aggregation and rounding still require separate parity coverage. No student flow or production configuration was changed by this audit.
