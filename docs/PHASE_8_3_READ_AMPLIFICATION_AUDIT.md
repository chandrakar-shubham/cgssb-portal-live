# Phase 8.3 — Firestore Read-Amplification Audit

## Status

**Audit completed against `main` through the Phase 8.3 bounded-read fixes and subsequent 2,500-VU validation run.**

This audit is intentionally read-only. It does not introduce production writes or authenticated load testing.

## Findings

### 1. Student test catalog loading has a bounded path

`useTestManager()` now receives an admin-only enable flag. Student routes perform a one-time published-test query capped at 200 records; only authenticated admin routes retain the full realtime catalog listener.

### 2. Student question loading has a bounded path

The Firestore service contains:

- `fetchQuestionsByIdsFromFirestore()` — chunks `documentId in` queries into groups of 30.
- `fetchQuestionsByProgramFromFirestore(programId, limitCount)` — clamps the requested limit to a maximum of 500.

These are appropriate building blocks for student exam/question flows because the query size is explicitly bounded.

### 3. Published PYP catalog has a bounded path

`fetchPublishedPypPapersFromFirestore(limitCount)` clamps the catalog limit to 200 and orders by year.

This matches the Phase 8 direction for student PYP reads.

### 4. Leaderboard reads are bounded

`fetchLeaderboardProfilesFromFirestore()` clamps the result limit to 100 and uses the composite Firestore indexes defined in `firestore.indexes.json`.

The security rules also require public leaderboard list queries to specify a limit of at most 100.

### 5. Bundle/catalog validation is bounded

Student bundle startup now fetches at most 100 published bundles. Canonical `examTestSeries` validation no longer scans the entire collection; it fetches only the referenced series IDs in Firestore `in` chunks of 30.

### 6. Legacy unbounded service functions remain

The service layer still contains these unbounded functions:

- `fetchTestsFromFirestore()`
- `fetchQuestionsFromFirestore()`
- `fetchPypPapersFromFirestore()`
- `fetchBundlesFromFirestore()`

It also contains collection-wide realtime listeners such as:

- `subscribeToTests()`
- `subscribeToQuestions()`
- `subscribeToPypPapers()`
- `subscribeToBundles()`

These functions should **not** be used by student-facing production flows.

The presence of the functions is not itself a capacity failure; the critical requirement is that student routes never invoke them. They remain available for admin-specific workflows that genuinely require full collection synchronization.

## Security/read-budget observations

### Attempts

Student attempts are protected by Firestore rules:

- reads are owner-scoped;
- list queries must be constrained to the authenticated user's UID;
- creation requires ownership and validated numeric/result fields;
- student attempts are immutable after creation.

This is appropriate for preventing a client from rewriting historical submissions.

### Public catalog collections

The following collections intentionally allow public reads:

- `mockTests`
- `questions`
- `pypPapers`
- `bundles`
- `pages`
- `posts`
- `seriesPacks`
- current-affairs collections
- `remoteConfig`

Therefore, **application-level query bounding remains important even when Firestore rules allow the read**.

## Required next engineering action

Before another production concurrency increase:

1. Complete the remaining source-wide call-site audit of legacy unbounded functions/listeners using repository search or local checkout tooling.
2. Run the current Phase 8 read-only gate at 3,500 VUs for 60 seconds.
3. Only after reviewing the 3,500-VU artifact should 5,000 VUs be considered as a separately approved promotion gate.
4. Keep authenticated write testing isolated to staging with synthetic accounts.
5. Regression protection is now enforced in CI by `scripts/phase8-read-bound-guard.mjs`, wired through `npm run test:phase8:read-bound`.

## Capacity interpretation

The highest demonstrated production read-only test remains **2,500 VUs**; the next controlled promotion gate is **3,500 VUs**. The 2,500-VU run passed the configured HTTP acceptance thresholds, but it is not the current controlled promotion gate.

These results do **not** establish 10,000 authenticated concurrent-student capacity. The latest code changes are CI/deploy validated. The existing 2,500-VU result remains the latest capacity evidence; the required 3,500-VU controlled gate has not yet been executed on the current hardened branch.

The correct next target is reducing and measuring Firestore reads per real student session, not blindly increasing HTTP VUs.

## Load-gate evidence retention

The Phase 8 external read-load workflow now persists `phase8-load-result.json` and uploads it as a GitHub Actions artifact for each run. The artifact includes the run ID, request/error counts, status distribution, latency percentiles, RPS, and the configured acceptance result. This makes each controlled capacity measurement reproducible and auditable instead of relying only on console output.

## Spark-plan constraint

No authenticated production write/load test should be introduced merely to improve the capacity claim. The authenticated Phase 8 harness correctly requires an isolated staging project and synthetic accounts.

## Acceptance criteria for Phase 8.3

- No student route invokes an unbounded catalog read.
- No student route attaches a collection-wide catalog listener.
- Student question loading is bounded by IDs/program and explicit limits.
- Student PYP listing is bounded.
- Leaderboard reads remain bounded.
- Firestore rules remain unchanged unless a concrete security regression is identified.
- Existing Spark-compatible architecture remains intact.
