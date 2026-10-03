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
| 2,500 | 121,556 | 4.15% | 1,084.8 ms | FAIL |

The configured gate is error rate <=1% and p95 <=2 seconds.

## Interpretation

The 2,000-VU run passed the configured read-load gate. The 2,500-VU run did not. Therefore this evidence should not be converted into a claim that the application supports 2,500 concurrent students.

The 2,500-VU failure is a useful capacity signal: the next investigation should identify whether the errors originate at the hosting/edge/network/client-runner layer before increasing concurrency further.

The read-load harness is not an authenticated student workload and does not establish Firestore write capacity, attempt-submission capacity, leaderboard contention, or authentication capacity.

## Spark-plan decision

No production authenticated-write test is being enabled at this stage. That avoids consuming the limited Spark Firestore write/read quota and avoids creating synthetic attempt records in the authoritative production database.

The authenticated production-read workflow that required repository secrets was intentionally not merged.

## Next engineering gate

1. Inspect the 2,500-VU failure distribution and runner/network behavior.
2. If needed, repeat at 2,250 VUs as a controlled read-only HTTP test.
3. Keep 2,000 VUs as the highest currently demonstrated passing read-load gate.
4. Do not label the site "10K concurrent users supported" based on these results.
5. Authenticated/write capacity testing should be performed in an isolated Firebase environment or only after a deliberately isolated production write/cleanup design is approved.
