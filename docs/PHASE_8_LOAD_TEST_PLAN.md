# Phase 8 — Load & Concurrency Test Plan

## Current status

Phase 7 production validation is complete, but a real 10,000-user test has **not** been executed. This plan separates CDN/Hosting capacity from authenticated Firestore workload so results are not misleading.

## Gate 8.1 — Read-only Hosting load

Use `scripts/phase8-load-test.mjs`.

Safe default:
- 25 virtual users
- 30 seconds
- GET-only
- no authentication
- no Firestore writes

Progression should be staged: 25 → 100 → 250 → 500 → 1,000 concurrent clients. Increase only after the previous stage is clean.

Metrics:
- request throughput
- error rate
- p50/p95/p99 latency
- timeout rate

The harness exits non-zero when error rate exceeds 1% or p95 exceeds 2 seconds. These are engineering guardrails, not claims about Firebase's contractual limits.

## Gate 8.2 — Authenticated application workload

Do **not** create 10,000 real accounts from the browser.

Run against an isolated/staging Firebase project with controlled test identities and synthetic data. Exercise:
1. login/session restoration
2. published program/catalog reads
3. test start
4. question reads
5. answer/attempt writes
6. result submission
7. leaderboard writes
8. retry after transient failure

Capture Firestore reads/writes, latency, rejected requests, contention, and quota errors.

## Gate 8.3 — 10K concurrency model

The 10K scenario should be modeled as a workload mix, not 10K identical requests. Example:
- 10% login/session activity
- 20% catalog/test discovery
- 50% question/answer activity
- 10% result submission
- 10% leaderboard/profile activity

Use realistic think time and staggered arrivals. Measure peak simultaneous requests and Firestore operations.

## Gate 8.4 — Failure testing

Test:
- network interruption
- duplicate submission
- refresh during an active attempt
- expired auth token
- Firestore transient failure
- concurrent result submission
- leaderboard write contention

Expected behavior must be idempotent and must not corrupt attempt state.

## Gate 8.5 — Exit criteria

Do not label the system “10K ready” until:
- staged load completes without unacceptable error/latency
- authenticated workload is tested in an isolated environment
- Firestore quota/operation behavior is measured
- attempt/result writes remain correct under concurrency
- refresh/session persistence survives load
- failure/retry tests pass
- results and environment are recorded in a versioned report

## Important constraint

The public production site should not be used for destructive or write-heavy load generation. The read-only harness is deliberately limited to HTTP GET traffic. A real Firestore workload test requires a controlled staging project and test credentials.
