# Trusted Scoring Contract — Decision Gate

**Status:** Proposed compatibility contract; not approved for production cutover.  
**Scope:** Mock-test scoring and attempt-result compatibility.  
**Production impact:** None. This document does not change scoring code, saved attempts, Firestore rules, billing, or deployment.

## Why this gate exists

There are two current browser scoring paths:

- `src/utils/apiClient.ts` computes submission scores using each question's `marks` and `negativeMarks`, with legacy fallback expressions `Number(q.marks || 1)` and `q.negativeMarks ?? ((q.marks || 1) / 3)`.
- `src/app/examScoring.ts` computes live/summary scores using test-level `marksPerQuestion` and `negativeMarksPerQuestion`.

The proposed trusted worker uses per-question values where present, then test-level defaults. These are not equivalent for all records. The app's TypeScript types say question scoring fields are required, but types do not prove historical Firestore records are complete or consistent.

## Proposed contract to evaluate

The safest migration path is **data-driven parity first**, not a silent scoring rewrite:

1. For every published test in a controlled non-production dataset, resolve only the explicit IDs in its sections and inspect scoring fields without exporting answer keys.
2. Classify each record: question marks missing/null, question marks zero, penalty missing/null, penalty zero, invalid/non-finite/negative values, and disagreement between test-level and question-level values.
3. Decide which historical contract is authoritative for each existing test family before implementing fallback behavior.
4. For newly authored tests, require explicit valid scoring values or a documented inheritance rule at publish time. Reject invalid records rather than silently guessing.
5. Preserve the current saved-attempt result shape while moving score calculation to the trusted service. Keep the client from supplying authoritative score/count fields.
6. Define a versioned scoring-policy identifier for new trusted attempts, so later policy changes do not silently reinterpret old attempts.

## Decisions that must be explicit

| Decision | Existing behavior / risk | Gate |
|---|---|---|
| Positive marks | API path uses question marks with `|| 1`; exam summary uses test default | Choose per-question, test-level, or validated inheritance policy |
| Negative marks | API path defaults to one-third of `(q.marks || 1)`; exam summary uses test default | Choose fallback and validate against real published data |
| Explicit zero | API `|| 1` treats zero as missing; trusted scorer preserves zero | Decide whether zero is valid or invalid; migrate records before enforcing |
| Overall score | Both current paths floor overall score at zero | Preserve and test |
| Per-subject score | API path may retain negative subject score; trusted orchestration floors each subject at zero | Decide whether subject score is raw or floored and check dashboards |
| Rounding | Current paths round at different stages / precision | Specify precision and round only at defined boundaries |
| Review status | Exam UI sends five palette statuses; trusted request currently rejects status maps and synthesizes answered/unanswered | Define validated status-only metadata; never use it for grading |
| Question types | App supports MCQ, matching, assertion/reason, multi-statement; trusted scorer supports single-answer A/B/C/D only | Implement a type-specific answer contract and tests before enabling each type |

## Differential test requirements

For each approved scoring policy, tests must compare the trusted scorer against an independent reference implementation over:

- all-correct, all-wrong, mixed, skipped, and all-skipped attempts;
- missing, null, zero, fractional, and invalid marks/penalties;
- score values at rounding boundaries;
- multiple subjects, including a subject whose raw score is negative;
- each supported question type and invalid answer representation;
- status metadata including each allowed palette status and unknown question IDs;
- exact result schema consumed by `SolutionsScreen`, attempt history, analytics, and scorecards.

The current `scoringParityAudit.test.mjs` intentionally asserts known divergences. Those audit tests must be replaced by equality assertions once the policy is approved and implemented; divergence tests alone are not a release gate.

## Release gates

- [ ] Actual published test data inspected in a non-production environment; no production answer keys exported.
- [ ] Assessment owner approves the scoring contract and zero semantics.
- [ ] Differential tests pass for every supported question type.
- [ ] Attempt-result shape validated against the existing UI and analytics consumers.
- [ ] Review-status behavior explicitly preserved or intentionally retired.
- [ ] Trusted repository adapter and eligibility policy integration-tested with synthetic accounts.
- [ ] Submission/review migration and rollback rehearsed end to end.
- [ ] Concurrency test passes against the intended hosting/backend configuration.
- [ ] Production backfill/verification and cutover receive explicit operator approval.

Until these gates pass, the trusted worker must remain fail-closed and the PR must remain unmerged.
