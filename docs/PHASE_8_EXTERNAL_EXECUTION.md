# Phase 8 — External Load Execution

The repository contains the safe read-only harness in `scripts/phase8-load-test.mjs`.

## Production URL

Use the deployed Firebase Hosting URL from the current Firebase project. Do not substitute an unverified hostname.

## Required execution environment

Run from an external machine/runner with outbound HTTPS access and record:
- runner region
- timestamp
- commit SHA
- Node version
- VUS
- duration
- target URL

## Stages

1. 25 VUs / 30s
2. 100 VUs / 60s
3. 250 VUs / 60s
4. 500 VUs / 120s
5. 1,000 VUs / 120s

Only advance when the previous stage is clean.

## Metrics

Record:
- requests
- errors
- error rate
- requests/sec
- p50
- p95
- p99
- max latency

The harness fails when error rate >1% or p95 >2 seconds. These are project engineering guardrails, not Firebase contractual limits.

## Do not run write-load against production

The supplied harness is GET-only and does not authenticate or write Firestore. Do not modify it into a production Firestore write test.

Authenticated workload testing must use an isolated Firebase project with synthetic users/data. The test should cover login, catalog reads, test start, question reads, answer writes, submission, results, and leaderboard writes.

## Acceptance

A stage is evidence, not a guarantee. Do not claim “10K ready” until an isolated authenticated workload has demonstrated the required concurrency and data-integrity behavior and the results have been recorded.
