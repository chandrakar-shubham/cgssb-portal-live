# Phase 8 — Authenticated Production Read Gate

This gate is intentionally read-only. It exercises Firebase Authentication and Firestore Security Rules against the production project without mutating production data.

## Required GitHub Actions secrets

- `PHASE8_PROD_PROJECT_ID`
- `PHASE8_PROD_API_KEY`
- `PHASE8_PROD_TEST_USERS_JSON`

Use only dedicated synthetic Firebase Authentication accounts. Never use real student credentials.

## Workload

Each virtual user signs in with a pre-created test account and repeatedly performs authenticated Firestore reads across:

- own `users/{uid}` profile
- owner-scoped `attempts`
- owner-scoped `seriesEnrollments`
- canonical `examPrograms`
- `examPosts`
- `examTestSeries`
- `bundles`
- `mockTests`
- `questions`
- `pypPapers`

Think time is 700–1400 ms to approximate a student session rather than a tight-loop HTTP hammer.

## What this proves

It validates:

1. Firebase Auth sign-in works under concurrent demand.
2. Authenticated Firestore requests receive valid ID tokens.
3. Production Firestore rules permit the expected student reads.
4. Canonical catalog/content reads remain available under concurrent authenticated traffic.
5. Latency and network-error behavior can be measured separately from the existing public HTTP gate.

It does **not** prove 10,000-user capacity, and it intentionally does not test production writes.

## Next gate

Only after this read gate is clean should a write workload be considered. A production write test must use dedicated test users, synthetic attempt IDs, an explicit run marker, and server-side cleanup with a tightly scoped service credential. The current application rules do not allow ordinary students to delete attempts, so a production write test must not be implemented with unsafe client-side cleanup.
