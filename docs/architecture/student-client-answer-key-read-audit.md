# Student Client Answer-Key Read Audit

**Date:** 2026-11-01  
**Branch:** `security/student-question-api-projection`  
**Status:** Source-level audit; no runtime behavior changed.  
**Production impact:** None. No Firestore rules, data, secrets, billing, or deployments were changed.

## Executive finding

The student-safe `studentQuestions` projection is not yet the effective source for the full student exam journey. The current browser submission path still reads the canonical `questions` collection, calculates correctness and scores in the browser, and writes a client-computed attempt. The live exam loader also reads canonical questions. Therefore, tightening `/questions/{questionId}` rules now would break exam loading and/or submission/review compatibility; leaving the rule public continues to expose answer keys.

The trusted-scoring Worker routes in this PR do not yet replace these browser paths. Passing Worker unit/HTTP-journey tests does not establish that the production student UI calls those routes.

## Confirmed source paths

| Path | Current behavior | Security / compatibility consequence |
|---|---|---|
| `src/utils/apiClient.ts` — `submitAttempt` | Reads the entire `questions` collection, resolves the test set in the browser, reads `correctOption`, calculates scores, then writes to `attempts`. | Direct answer-key exposure; client-computed scores are not authoritative. Also uses broad fallbacks when section IDs are incomplete. |
| `src/app/examSessionQuestions.ts` — `loadExamSessionQuestions` | Fetches canonical questions by section IDs; if none are returned, falls back to program-wide question reads; optionally falls back to local catalog questions. | Student exam loading still depends on canonical reads and can select a broader set than the explicit published test definition. |
| `src/app/examQuestionSet.ts` — `resolveQuestionsForTest` | Resolves explicit IDs, then fills gaps by exam name, authority/category, and finally all available questions. | Legacy compatibility helper is unsuitable as a trusted server test resolver; it can silently change the exam paper. |
| `src/app/attemptReviewResolver.ts` | Selects questions for review from caller-supplied question data and falls back to the full supplied set. | Must be replaced by an authenticated trusted review response; client-supplied question objects cannot be trusted for correctness. |
| `src/components/SEOQuestionView.tsx` | Renders the correct option and explanation for solved-question content. | This is a separate intentionally public solution surface; it needs an explicit publication/release policy and must not be accidentally broken by the exam migration. |
| `src/firebase/studentQuestionProjectionService.ts` | Mirrors canonical records to `studentQuestions`, verifies full projection parity, and backfills in bounded batches. | Projection rollout tooling exists, but does not itself migrate the student exam, grading, or review journeys. |

## Existing rules consequence

In `firestore.rules`, `/questions/{questionId}` currently has public read access, while `/studentQuestions/{questionId}` has public read access to the allowlisted projection. This is intentionally transitional. The projection verification gate is necessary but insufficient: all runtime consumers must be migrated and tested before canonical reads are denied.

## Required migration sequence

1. **Inventory every canonical question read.** Search all runtime source paths, including exam launch, active session restoration, PYP, review, saved attempts, admin tools, analytics, SEO solved pages, and offline/cache flows. Classify each as student, admin, or public-solution use.
2. **Separate question delivery from grading.** Student exam delivery must use a projection that contains only display fields and stable question IDs. It must not contain `correctOption`, explanation/solution fields, aliases, or unknown fields.
3. **Make test composition authoritative.** The trusted backend must resolve only explicit published test section IDs and exact counts. Do not use the browser's program/category/all-question fallback to fill a paper. Inventory and repair incompatible published tests before migration.
4. **Move submission to the trusted Worker.** The browser sends only the test ID, response map, idempotency key, and allowed telemetry. The Worker derives UID from the verified Firebase token, loads canonical answers server-side after eligibility checks, scores, and persists atomically. Client-computed score/count fields must be rejected.
5. **Move review to the trusted Worker.** Review must use the authenticated `GET /v1/attempts/{attemptId}/review` response and its server-enforced ownership/admin and solution-release policy. Do not fetch canonical answers in the browser to reconstruct review.
6. **Preserve non-grading product behavior deliberately.** Decide and test palette status counts, attempt history, leaderboard/analytics, PYP review, offline behavior, and SEO solution publication separately. Do not expose correctness merely to preserve a client-side metric.
7. **Run journey tests against the actual UI adapters.** Cover fresh launch, refresh/resume, submission, retry/replay, review before/after release, cross-user denial, and all supported question types. Worker-only injected HTTP tests are not enough.
8. **Only then tighten rules.** After a complete read inventory, projection backfill/verification, trusted non-production Firestore integration, and UI compatibility tests pass, deploy restrictive rules in a staged and reversible change. Production cutover requires explicit operator approval.

## Immediate blockers retained

- The student app's current `submitAttempt` implementation has not been migrated to the Worker.
- `loadExamSessionQuestions` still reads canonical questions.
- Browser scoring and client-writable attempt persistence remain active.
- The scoring policy is not approved; see `trusted-scoring-contract-decision-gate.md`.
- Actual published-test schema and entitlement/campaign/device-binding semantics have not been verified against an isolated non-production Firebase database.
- The Worker adapter has not been proven against live non-production Firestore/IAM.
- Question types beyond single-answer A/B/C/D remain unsupported by trusted scoring.

## Release decision

**Do not tighten canonical question rules, merge PR #10, or deploy the Worker as the authoritative exam path based on projection tests alone.** Keep the existing production path unchanged until the student UI migration and all non-production integration gates pass. Firebase Spark remains the hosting constraint; this audit assumes no paid-plan upgrade or new infrastructure.

## Verification scope

This document was produced by inspecting the current PR branch source files listed above and `firestore.rules`. It is not a live Firestore data audit and makes no claim about the completeness or validity of production documents.
