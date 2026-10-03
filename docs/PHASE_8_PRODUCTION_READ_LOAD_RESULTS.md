# Phase 8 Production Read Load Results

## Scope

This phase measured the public production web surface with a read-only HTTP workload. It did not authenticate users and did not create, update, or delete Firestore documents.

Target:

`https://gen-lang-client-0783153446.web.app`

Student-like routes:

- `/`
- `/cgvyapam/mock-tests`
- `/cgpsc/mock-tests`
- `/leaderboard`
- `/cgvyapam/pyp-papers`
- `/cgvyapam-cgssb/chapter-tests`
- `/cgvyapam-cgssb/practice-drills`

Think time: 700–1400 ms.

## Measured gates

| VUs | Requests | Error rate | p95 | Result |
|---:|---:|---:|---:|---|
| 25 | 40,366 | 0% | 21.4 ms | PASS |
| 100 | 202,574 | 0% | 41.0 ms | PASS |
| 250 | 189,335 | 0% | 43.1 ms | PASS |
| 500 | 203,576 | 0% | 40.2 ms | PASS |
| 1,000 | 271,983 | 0% | 31.0 ms | PASS |
| 1,500 | 81,159 | 0.93% | 158.5 ms | PASS |
| 1,750 | 81,258 | 0.81% | 20.6 ms | PASS |
| 2,000 | 107,405 | 0.93% | 22.5 ms | PASS |
| 2,250 | 124,836 | **0.19%** | **16.7 ms** | **PASS** |
| 2,500 | 121,556 | 4.15% | 1,084.8 ms | FAIL |

The configured gate is error rate <=1% and p95 <=2 seconds.

### 2,250-VU verification

GitHub Actions run: `37124281370`

- Commit: `97391571cefee11ac711d0845777294eda5abbc5`
- Duration: 60 seconds
- Elapsed: 62.22 seconds
- Requests: 124,836
- HTTP 200: 124,602
- Network errors: 234
- Error rate: 0.19%
- Throughput: 2,006.41 requests/sec
- p50: 11.5 ms
- p95: 16.7 ms
- p99: 1,733.2 ms
- max: 2,642.3 ms

The workflow job completed successfully and the measured values satisfy the configured gate.

## Interpretation

The **2,250-VU run is now the highest demonstrated passing read-only production load gate**.

The 2,500-VU run did not pass, so these results must not be converted into a claim that the application supports 2,500 concurrent students. The difference between 2,250 and 2,500 also warrants investigation before treating either number as a hard capacity boundary.

The read-load harness is not an authenticated student workload and does not establish:

- Firebase Authentication capacity
- Firestore read amplification from real application sessions
- exam attempt/submission capacity
- autosave contention
- leaderboard write contention
- Firestore write capacity
- end-to-end authenticated student capacity

The 2,250 test also produced 234 network errors, so the result is a passing gate rather than a zero-error certification.

## Spark-plan decision

No production authenticated-write test is being enabled at this stage. That avoids consuming the limited Spark Firestore quota and avoids creating synthetic attempt records in the authoritative production database.

The authenticated production-read workflow that required repository secrets was intentionally not merged.

## Next engineering gate: application-flow and Firestore read amplification audit

Before increasing HTTP concurrency again, inspect the production client workload that sits behind the tested routes.

### Gate 8.3A — Firestore read-path audit

Audit the code paths used by:

1. Student dashboard / exam discovery
2. Mock-test listing
3. PYP listing
4. Chapter tests
5. Practice drills
6. Leaderboard
7. Test start
8. Question loading
9. Attempt initialization
10. Answer submission/autosave
11. Attempt completion
12. Result/leaderboard refresh

For each flow record:

- Firestore collections touched
- queries per page/session
- documents read per query
- whether reads repeat on re-render
- whether subscriptions are used
- whether queries are bounded
- whether indexes are required
- whether data can be cached
- whether a single student session can multiply reads unexpectedly

The objective is to calculate a realistic **Firestore read budget per student session**, rather than infer capacity from Hosting HTTP concurrency.

### Gate 8.3B — client-side request amplification

Inspect React effects/subscriptions for:

- duplicate listeners
- missing dependency arrays
- mount/unmount resubscription
- redundant fetches
- route transitions that refetch unchanged catalog data
- unbounded collection reads
- repeated leaderboard reads
- repeated question reads

No production write test should be introduced solely to measure this.

### Gate 8.3C — capacity model

After the audit, calculate:

`student_capacity ≈ available_read_budget / reads_per_session`

and separately model:

- concurrent active students
- students browsing
- students actively taking tests
- answer submission rate
- completion bursts

These are engineering estimates, not guarantees.

## Current Phase 8 conclusion

**Highest demonstrated production read-only gate: 2,250 VUs.**

**2,500 VUs: failed configured gate.**

**10K concurrent-user support: not demonstrated and must not be claimed.**

The next work item is the application/Firestore read-amplification audit, not another blind concurrency increase.
