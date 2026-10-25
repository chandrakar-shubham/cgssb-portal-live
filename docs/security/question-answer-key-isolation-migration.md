# Question answer-key isolation migration

Status: **planned / not yet enforced**. This document records the safe sequence for removing public answer-key exposure without breaking current student tests.

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
2. Add a pure projection function and unit tests. Use an explicit allowlist of student-safe fields rather than a denylist alone; this prevents newly added canonical fields from leaking by default.
3. Add an admin-only canonical collection rule and student-readable `studentQuestions` rule. Keep the existing public canonical read temporarily while migration and client switch are incomplete; mark the intermediate state as still exposed.
4. Make every student read path use `studentQuestions`. Keep all admin CRUD paths on canonical `questions`. Ensure result/review behavior does not depend on answer keys being delivered before submission.
5. Add an admin-only, idempotent backfill/sync routine for existing questions. Verify document counts, IDs, and projection parity before flipping read rules. Never run a bulk migration automatically from a student browser.
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
