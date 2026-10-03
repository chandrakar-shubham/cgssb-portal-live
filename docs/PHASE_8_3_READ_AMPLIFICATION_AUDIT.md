# Phase 8.3 — Firestore Read-Amplification Audit

## Status

**Audit completed against `main` at commit `c651af5d0545a804525a9cdb7f23863b162e540d`.**

This audit is intentionally read-only. It does not introduce production writes or authenticated load testing.

## Findings

### 1. Student question loading has a bounded path

The Firestore service contains:

- `fetchQuestionsByIdsFromFirestore()` — chunks `documentId in` queries into groups of 30.
- `fetchQuestionsByProgramFromFirestore(programId, limitCount)` — clamps the requested limit to a maximum of 500.

These are appropriate building blocks for student exam/question flows because the query size is explicitly bounded.

### 2. Published PYP catalog has a bounded path

`fetchPublishedPypPapersFromFirestore(limitCount)` clamps the catalog limit to 200 and orders by year.

This matches the Phase 8 direction for student PYP reads.

### 3. Leaderboard reads are bounded

`fetchLeaderboardProfilesFromFirestore()` clamps the result limit to 100 and uses the composite Firestore indexes defined in `firestore.indexes.json`.

The security rules also require public leaderboard list queries to specify a limit of at most 100.

### 4. Legacy unbounded service functions remain

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

The presence of the functions is not itself a capacity failure; the critical requirement is that student routes never invoke them. They should remain available only where an admin-specific workflow genuinely requires full collection synchronization, or be removed after reference verification.

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

1. Verify every call site of the four legacy unbounded catalog functions.
2. Verify every call site of the collection-wide realtime listeners.
3. Classify each caller as:
   - Student
   - Admin
   - Startup/bootstrap
   - Dead/unused
4. Replace any Student/Startup caller with a bounded query.
5. Keep Admin-only full-collection reads isolated from student bundles.
6. Add a regression test that rejects newly introduced student use of unbounded catalog functions.
7. Re-run the existing read-only production gate only after the call-site audit.

## Capacity interpretation

The highest demonstrated production read-only gate remains **2,250 VUs**. The 2,500-VU run remains a failed configured gate.

These results do **not** establish 10,000 authenticated concurrent-student capacity.

The correct next target is reducing and measuring Firestore reads per real student session, not blindly increasing HTTP VUs.

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
