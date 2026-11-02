# Question answer-key isolation migration

Status: **projection infrastructure implemented; production backfill and read-path cutover pending**. The safe student projection helper, admin-only idempotent backfill endpoint, question-write mirroring, and `studentQuestions` rules are now implemented. Canonical `questions` remains publicly readable until backfill verification and the student grading/read-path migration are complete.

## Current risk

The canonical `questions` collection contains both question presentation data and grading material (for example `correctOption`, `correctAnswer`, `modelKey`, `finalAmendedKey`, and explanations). Firestore currently permits public reads of that collection. Firestore rules operate at document level, not field level, so a rule cannot hide selected fields from a readable question document.

The Spark compatibility layer also has a public GET path for `/api/questions`, and the current client-side attempt path reads canonical question records to calculate scores. Merely adding a `studentQuestions` collection or tightening the existing rule in isolation would not close the exposure and could break the exam journey.

## Required target model

- `questions`: canonical authoring/grading records, including answer keys; read/write restricted to authorized content administrators.
- `studentQuestions`: deliberately projected, student-safe question payloads; contains only prompt, options, question type, taxonomy, marks, and presentation metadata. It must not contain correct-answer aliases, answer keys, explanations/solutions, or internal moderation fields.
- Admin authoring/import/edit workflows continue to operate on canonical `questions`.
- Student test-taking, offline caching, question previews that are student-facing, and public question APIs read only `studentQuestions`.
- The projection must be deterministic and tested against every known answer-key alias in `Question` and imported JSON formats.

## Safe rollout order

1. **Inventory all readers/writers**: Firestore service functions, `useQuestionManager`, exam engine, practice mode, PYP, API compatibility routes, offline manager, catalog imports, migration scripts, admin editors, and result/review screens.
2. ✅ Add a pure projection function and unit tests using an explicit allowlist. Student-safe projection infrastructure is in the codebase.
3. ✅ Add the student-readable `studentQuestions` rule with admin-only writes. Canonical `questions` remains publicly readable during this intermediate state.
4. Pending: make every student read path use `studentQuestions`, while keeping admin CRUD on canonical `questions`. Rework result/review so student clients do not need answer keys before submission.
5. Implemented: admin-only idempotent backfill and automatic projection mirroring for admin question writes. Run it from Admin → Database → Backfill Student-Safe Questions, then verify counts, IDs, and projection parity before any cutover. It is never triggered from student startup.
6. Add emulator tests proving: anonymous/student reads of canonical questions fail after cutover; student-safe reads succeed; answer-key fields are absent; unauthorized projection writes fail; authorized admin writes work; create/update/delete synchronization remains correct.
7. Only after the reader audit, backfill verification, and CI pass, remove public reads from `questions`. Deploying rules and running a production migration require a separately reviewed rollout; do not assume a branch change updates production.
8. Re-test full test journeys (test list, attempt, refresh/resume, offline cache, submit, result review, admin authoring/import) before promotion.

## Spark-plan limitation

Even after separating collections, if the browser receives an answer key to grade a submitted test, a user can inspect it. Firestore rules cannot provide trusted server-side scoring. Cryptographically trustworthy exam scoring/official rankings require a trusted backend or other trusted execution path. Until that exists, label client-derived scores and leaderboard summaries as practice-only and do not present them as verified official results.

## Cutover acceptance checklist

- [ ] All student-facing reads enumerated and switched to the safe projection.
- [ ] All answer-key aliases removed from the student payload, including explanations and moderation-only metadata.
- [ ] All existing canonical questions have a verified safe projection.
- [ ] Emulator tests enforce canonical-read denial and projection-read access.
- [ ] Build, rules tests, emulator tests, and end-to-end student journey tests pass.
- [ ] No production migration or rules deployment occurs without an explicit release decision.

## Latest source audit — 2026-11-01

The migration gate remains **BLOCKED**. A source review of the current branch confirms the following concrete blockers:

| Surface | Current implementation | Required disposition |
|---|---|---|
| `src/app/examSessionQuestions.ts` | Legacy live loader calls `fetchQuestionsByIdsFromFirestore`, then expands to program questions, then may use local catalog fallback. | Replace only after the exam renderer, session persistence, and submission contracts are switched to `StudentQuestion`; do not silently change the live loader in isolation. |
| `src/firebase/firestoreService.ts` | Canonical readers remain available: explicit-ID, program-wide, full collection, and realtime subscription functions. | Classify each call site as admin-only or student-facing; remove student access before canonical rules are tightened. |
| `src/utils/apiClient.ts` `submitAttempt` | Reads the full canonical `questions` collection, resolves incomplete papers using exam/category/global fallbacks, computes marks in the browser, and writes a client-computed attempt with merge semantics. | Replace with the trusted Worker contract. Do not treat this client score as verified, and do not return answer-bearing review data. |
| `src/utils/apiClient.ts` public `GET /api/questions` | Uses `studentQuestions`, not the canonical collection. | Keep this projection-only behavior and retain its regression coverage. |
| `src/app/studentExamSessionQuestions.ts` | Strict projection-only loader exists and is tested for exact IDs/order, identity, schema, and answer-key rejection. | Suitable as a migration component, not proof that the production exam journey has switched. |
| `src/utils/offlineExamManager.ts` | Offline cache is a convenience layer and is not an authorization boundary. | Ensure it receives only projection DTOs after the live journey is migrated; clear/expire legacy cached canonical payloads as part of the separately tested client migration. |
| `firestore.rules` | Both `questions` and `studentQuestions` currently allow public reads; projection writes are admin-restricted. | Canonical public reads remain a critical exposure. Tightening them now would break the still-active legacy exam and client-scoring paths. Perform only after all student canonical reads are removed and emulator/end-to-end tests prove parity. |

### Explicit release blockers

1. The student exam launch path is still wired to the legacy canonical loader.
2. The browser submission path still reads canonical answer keys and computes its own score.
3. Firestore still permits public reads of canonical question documents.
4. The trusted Worker client exists but is not wired to the live Firebase Auth/session UI, and no deployed Worker endpoint or isolated non-production end-to-end evidence is established.
5. Review/solution UI still has a legacy question-based contract; it must consume the Worker review DTO and enforce release/ownership state before cutover.

### Safe next implementation boundary

Continue building and testing the projection-only student journey as an isolated path. The next integration must be an end-to-end adapter change behind a non-production-only feature configuration, with no fallback to canonical reads or browser scoring when enabled. Keep the current production path unchanged until Worker deployment, isolated Firestore/IAM validation, review parity, and explicit release approval are complete.

This audit is source-level evidence only. It does not assert that production rules, data, hosting, or traffic have changed.
## Trusted review receipt integration — 2026-11-01

The isolated trusted review orchestrator now validates the complete Worker review receipt through the same strict parser used for first-submit receipts before loading student question projections. It explicitly preserves the distinction between:
- `attempt.id`: the trusted Firestore attempt document ID used by the review endpoint; and
- `attempt.submissionId`: the client-generated idempotency key used to make submission retries safe.

The orchestrator returns a validated `TestAttempt` aggregate alongside the projection-only questions. Regression coverage verifies aggregate score provenance, both IDs, fail-closed feature gating, cross-student/cross-test rejection before projection reads, and invalid client submission IDs. This closes a DTO adaptation gap in the isolated review path; it does **not** connect the live `SolutionsScreen` or authorize rollout.

### Remaining student journey blockers (confirmed in source)

- `src/App.tsx` still invokes `calculateExamScore` in the browser, persists the legacy attempt and leaderboard profiles, and sets that legacy record as the active review.
- `SolutionsScreen` still requires the legacy `TestAttempt` + `Question[]` contract and performs question correctness filtering against `Question.correctOption`.
- The isolated trusted review orchestrator is not called by `App.tsx`; no trusted-vs-legacy attempt provenance discriminator exists in the live review route.
- The Worker derives `questionStatuses` from submitted answers and currently does not accept marked-for-review palette state. That behavior must be reconciled with the live exam UX and approved scoring contract before using the trusted result screen.
- The Worker review receipt can now be parsed into the aggregate `TestAttempt` type, but this alone does not reconcile leaderboard/profile writes, milestones, analytics, offline cache, saved attempt consumers, or scoring parity.

The next safe boundary is a separately tested trusted submission journey adapter that coordinates submission receipt persistence, review loading, and downstream side effects. Do not switch `handleSubmitTest`, remove the legacy path, tighten canonical Firestore rules, or deploy the Worker until the non-production Firestore/IAM gate, published-test compatibility audit, scoring-policy decision, and complete student journey tests pass.
## Trusted exam palette-state parity — 2026-11-01

The isolated trusted submission path now carries the exam palette's non-scoring metadata (`not_visited`, `unanswered`, `answered`, `marked_for_review`, `answered_and_marked`) through the typed client and Worker request parser. The Worker validates status IDs against the published test, rejects answer/status contradictions, includes palette metadata in the idempotency fingerprint, persists the validated map in the server-authored receipt, and calculates `markedForReviewCount` from that validated metadata. Scoring remains exclusively based on trusted canonical questions and submitted answers.

Regression tests cover request validation, status/answer consistency, marked-for-review aggregation, idempotency changes, safe client transport, and student-side snapshot validation. This resolves a material result-metadata parity gap in the isolated adapter. It does **not** switch the live exam submission handler, write client-side mirror attempts, or make the Worker eligible for production rollout.

## Trusted-attempt history migration audit — 2026-11-01

The student history contract has been audited before adding a trusted-history endpoint. The current `fetchMyAttemptsFromFirestore` implementation deliberately loads the complete owner-scoped legacy history in 100-document cursor pages, ordering by document ID so older records without `submittedAt` are not omitted. It restores newest-first ordering in memory and returns an empty result rather than a silently truncated list if a later page fails.

This complete list is consumed by more than the history screen: analytics, mistake tracking, re-attempt recovery, and leaderboard-profile calculations depend on it. Therefore, replacing the loader with a single recent-page API or an arbitrary history cap would be a behavioral regression. Trusted attempts currently live in the server-owned `trustedAttempts` collection and must not be exposed through client Firestore reads or copied into client-writable `attempts` documents.

Before connecting trusted attempts to the student history UI, the migration must provide an authenticated Worker list endpoint with verified-UID scoping, bounded cursor pagination, deterministic ordering, strict cursor validation, and an allowlisted history DTO. The DTO must omit canonical question content, answer keys, explanations, score breakdowns, idempotency fingerprints, and internal Firestore metadata. The client adapter must consume every page (or expose an explicit complete-history contract) and merge legacy and trusted records without duplicate attempts, preserving the existing newest-first ordering and all-history semantics.

The current Worker Firestore REST client supports document reads, batch gets, and atomic commits, but not structured queries. The Worker repository therefore does not yet have a safe owner-scoped paginated query primitive. The next implementation step is to add and test that query primitive and repository pagination independently, including empty histories, page boundaries, malformed cursors, duplicate timestamps, cross-owner isolation, and no answer-key/score-breakdown leakage. Only after that contract is proven should the client history loader and downstream consumers be adapted. No live handler, Firestore rule, index deployment, or production data path is changed by this audit.


## Trusted attempt history API — 2026-11-01

A separately authenticated `GET /v1/attempts` Worker route now exposes bounded pages from the server-owned `trustedAttempts` collection. It derives the owner UID only from the verified Firebase bearer token, accepts a page size from 1–50, validates an opaque cursor, applies a server-side `userId == UID` filter, and orders by submission timestamp plus document name for stable pagination. The Worker response is projected through an explicit history-field allowlist; score breakdowns, correctness fields, canonical questions, explanations, idempotency fingerprints, and internal Firestore metadata are not returned. The Firestore REST adapter adds a bounded `runQuery` primitive, and the repository independently rechecks owner UID on returned rows.

The client now exposes a strict `listMyAttempts` transport adapter that obtains a fresh Firebase token, uses the existing no-store/redirect protections, validates the page envelope and attempt identities, and rejects unknown or solution-bearing fields. This adapter is isolated: it is not yet merged into the legacy complete-history loader or student UI. Existing history still includes older legacy attempts without timestamps, so combining sources must preserve all-history semantics and avoid duplicate IDs. A composite index declaration was added for `trustedAttempts(userId, submittedAt DESC)`; it is configuration only and has not been deployed to production. The endpoint is not enabled on a deployed Worker and no production data or rules were changed.


## Trusted history pagination and merge adapter — 2026-11-01

The typed client now provides `listAllMyAttempts()`, which follows every bounded Worker page, rejects a non-advancing cursor, deduplicates trusted IDs, and returns newest-first history. A pure merge helper now combines already-validated trusted receipts with the complete legacy history, filters both sources to the authenticated UID, gives trusted receipts precedence for duplicate IDs, and applies newest-first ordering with an ID tie-breaker.

The merge helper is deliberately not connected to `App.tsx`. The current app history hydration still loads the complete legacy `attempts` history, which feeds dashboard/re-attempt flows, analytics, mistake tracking, and other student/admin views. The browser submission handler also still calculates and persists legacy attempts and leaderboard profiles. Wiring the merge into the live state before trusted submission, review, and downstream side effects are migrated would create mixed-provenance records and inconsistent reporting.

CI initially caught an incorrect expected order in the new merge test: the fixture's legacy record had a newer timestamp than the separate trusted record. The implementation's newest-first order was correct; the fixture expectation has been corrected and the full workflows are rerunning on the latest commit.

### Remaining history cutover requirements

- Add an explicit loading/error/degraded state so a trusted-history outage cannot silently hide server-authored attempts or present a misleading partial history.
- Preserve legacy records with missing timestamps and complete 100-document cursor pagination.
- Confirm trusted DTO compatibility with dashboard, analytics, mistake notebook, reattempt recovery, leaderboard, and admin reporting.
- Keep the live history state on the legacy path until the full trusted submission/review journey and side effects are proven in isolated non-production infrastructure.

No live UI, Firestore rules, indexes, Worker deployment, production data, or hosting configuration changed.


## Integrated trusted student submission and review journey — 2026-11-02

A new isolated orchestration boundary now coordinates the existing trusted submission and review components in one operation. It fails closed unless the trusted-scoring gate is explicitly enabled for a non-anonymous authenticated Firebase identity; submits only the validated answer/palette payload; obtains the server-authored attempt ID; requests the owner-scoped Worker review; loads only the published student-safe question projections; and verifies that the submission and review receipts agree on attempt identity, idempotency ID, score aggregates, and every submitted answer.

The adapter returns a single trusted attempt aggregate, solution-release state, projection-backed review questions, and the idempotent replay indicator. It has no legacy canonical-question fallback and does not write a client-authored attempt, leaderboard profile, milestone, or analytics event. Dedicated regression coverage checks the disabled gate, exact student/test scope, submit-to-review sequencing, projection-only question loading, withheld solutions, and receipt mismatch rejection. Both CI workflows now run this integration test.

This is an isolated integration milestone, not a live cutover. App.tsx still uses the legacy browser-scored submit and review route. Before any UI switch, the remaining work includes a non-production Worker deployment and Firebase/IAM validation, trusted review screen adaptation, leaderboard/profile/milestone/analytics reconciliation, complete history source merging with outage-state semantics, offline cache migration, and full student-journey end-to-end tests. No production deployment, rules/index deployment, data write, hosting change, or feature enablement was performed.


## Trusted history DTO validation and complete merge adapter — 2026-11-02

The history integration now has a strict adapter that converts the Worker history allowlist into the application TestAttempt shape before it can be merged into student state. It verifies authenticated owner identity, attempt/test identifiers, category and timestamps, numeric aggregates, response and palette maps, per-question answer/status consistency, count invariants, marked-for-review totals, sector analysis, and optional metadata. It rejects unknown/solution-bearing fields and malformed or cross-student records.

The complete-history loader fetches every trusted page, validates every record, and only then merges it with the complete legacy list. Trusted attempts win duplicate IDs, both sources are filtered to the authenticated UID, and newest-first deterministic ordering is retained. A trusted API or DTO failure is surfaced instead of silently presenting legacy-only data as a complete history. Dedicated tests cover validation, duplicate precedence, owner filtering, and outage propagation; both CI workflows now include this adapter test.

This adapter remains isolated and is not connected to the live App history hydration. A UI integration must expose a clear loading/error state and avoid updating analytics/leaderboard from incomplete history. No production endpoint, Firestore index/rule, deployment, or data path was changed.
