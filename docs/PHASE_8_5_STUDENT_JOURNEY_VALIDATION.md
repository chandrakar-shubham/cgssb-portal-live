# Phase 8.5 — Student Journey & Firestore Capacity Validation

## Safety boundary

- Production HTTP capacity evidence is limited to the seven public GET routes in the Phase 8 promotion workflows.
- Do not run authenticated requests, attempt creation, answer submission, leaderboard writes, or cleanup against the production Firebase project.
- The authenticated workload harness is staging-only. It must use a separate isolated project/database, dedicated synthetic accounts, and a cleanup service-account credential.
- This repository is configured for Firebase Spark. Do not enable billing, upgrade to Blaze, create a replacement database, or change IAM/billing settings as part of this phase.
- CI's Phase 8.5 guard is a source-contract check. It is not a substitute for an actual staging run.

## Verified code paths

1. `ExamEngine.tsx` restores and periodically checkpoints the exam state locally, checks that the saved question count matches the active test, and reuses a stable session ID as the submission ID.
2. `App.tsx` scores the current question set, calls `saveAttemptToFirestore`, then writes leaderboard profiles. Persistence failures return `false`, allowing the exam screen to preserve its checkpoint and unlock retry.
3. `saveAttemptToFirestore` checks the signed-in Firebase UID against the attempt owner and uses a Firestore transaction. If the attempt document already exists, it returns that record instead of creating a duplicate.
4. Firestore rules restrict student attempt creation to the authenticated owner and make student attempts immutable after creation; public leaderboard list queries are capped at 100.
5. Question-by-ID reads are chunked in groups of 30; leaderboard profile queries cap at 100.
6. Student attempt history is fetched in document-ID cursor pages of at most 100 records, accumulated to preserve existing full-history consumers, then sorted newest-first in memory. Paging by document ID also retains legacy attempts that lack `submittedAt`. If any page fails, the helper returns an empty result rather than silently presenting a partial history. A composite `attempts` index supports the owner + submission-time query.

## Attempt-history pagination contract

- Each Firestore query is limited to 100 documents and continues from the last document snapshot.
- Returned results remain newest-first and use document ID as a deterministic tie-breaker; the underlying page query uses document ID so records missing `submittedAt` are not skipped.
- All pages are collected to preserve the current all-history contract used by analytics, mistake tracking, test result/re-attempt recovery, and leaderboard-profile calculations. No silent 100-attempt history cap is introduced.
- A failure on any page returns an empty list rather than a misleading partial history.
- This bounds each individual query and response, but it does **not** bound total reads for users with very long histories. A future product-level history UI migration can load older history on demand only after analytics and aggregate calculations have explicit all-time semantics.

## Staging execution checklist

Run only after a genuinely isolated staging environment and synthetic accounts are available:

- [ ] Confirm staging project ID is not `gen-lang-client-0783153446`.
- [ ] Confirm staging database ID is the intended existing database; do not rely on an implicit default database.
- [ ] Create dedicated synthetic accounts and one staging-only mock test with a known question set.
- [ ] Exercise sign-in, test catalog read, bounded question loading, answer/checkpoint recovery, submit, duplicate-submit retry, attempts history, leaderboard profile write/read, and cleanup.
- [ ] Verify cross-user attempt reads/writes are denied by Firestore Security Rules.
- [ ] Verify failed profile writes can be retried without duplicating the attempt.
- [ ] Confirm every generated attempt is removed from staging and cleanup errors are zero.
- [ ] Retain structured request counts, p50/p95/p99, error codes, Firestore permission failures, cleanup counts, and run SHA.
- [ ] Do not promote authenticated workload size until a lower-load staging run passes and evidence is reviewed.

## Current status

- [x] 10,000-VU / 60-second production HTTP GET-only promotion gate passed (run 38043270055).
- [x] Phase 8.5 source-contract guard added to CI.
- [ ] Actual authenticated staging journey: pending isolated staging configuration and credentials.
- [x] Attempt-history cursor pagination implemented; emulator coverage verifies 205 records across multiple pages without overlap.
- [ ] Actual authenticated staging journey: pending isolated staging configuration and credentials.
