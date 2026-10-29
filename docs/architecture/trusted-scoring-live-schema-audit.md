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
