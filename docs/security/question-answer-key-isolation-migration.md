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