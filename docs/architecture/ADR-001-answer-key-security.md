# ADR-001: Protect exam answer keys and authoritative scoring

- **Status:** Proposed — blocked on backend/hosting decision
- **Date:** 2026-10-27
- **Scope:** Question delivery, attempt submission, scoring, solution review, and Firestore access rules
- **Related work:** PR #10, `security/student-question-api-projection`

## Context

The portal currently uses Firebase Hosting and Cloud Firestore on the Spark plan. The student projection collection and allowlist projection reduce accidental exposure through selected application paths, but they do not protect answer keys while direct reads of the canonical `questions` collection remain publicly permitted.

The browser also computes scores using canonical question data. Any scoring function shipped to a browser is modifiable by the student and cannot be treated as authoritative. Firestore Security Rules cannot redact individual fields from a document: read access to a document exposes its fields.

## Verified implementation constraints

- `firebase.json` configures Firebase Hosting as a static SPA with an `index.html` rewrite; no trusted API rewrite is configured.
- `firestore.rules` currently permits public reads of `/questions/{questionId}`.
- `src/app/examSessionQuestions.ts` loads questions through Firestore service functions.
- `src/firebase/firestoreService.ts` has canonical question read helpers used by exam delivery.
- `src/app/examScoring.ts` compares student responses with `correctOption` in client code.
- `src/components/SolutionsScreen.tsx` requires answer keys and explanations for post-submission review.
- `src/utils/apiClient.ts` runs in the browser. Its `submitAttempt` helper reads canonical questions and calculates the score client-side; its name does not make it a trusted server.

## Decision

Do not tighten canonical question read rules or merge/deploy the projection-only change until a trusted scoring and review architecture exists and all student flows have migrated.

### Preferred production design

Use a trusted backend endpoint for exam session issuance, attempt submission, scoring, and solution release. The backend must verify Firebase ID tokens, enforce test access and attempt ownership, load answer keys using server credentials, calculate scores server-side, and return solutions only after the attempt is accepted (or when the test's review policy permits it). Keep canonical answer keys inaccessible to student clients.

The least disruptive option is a Firebase Cloud Function or Cloud Run service, which requires moving the Firebase project to the Blaze billing plan. Blaze is pay-as-you-go, not a fixed monthly fee; free usage quotas may apply, but usage can incur charges. Set budget alerts and usage limits where available before deploying. A budget alert is not itself a hard spending cap.

### If the project must remain on Spark

Keep the current client-only exam flow explicitly classified as **not secure against answer-key extraction or score tampering**. Do not advertise scores/ranks as verified. A separate trusted service (for example, a carefully secured external worker/API) is a possible architecture, but it must be designed, threat-modelled, load-tested, and deployed independently; it is not equivalent to putting scoring logic in the frontend. Do not add a service-account private key to frontend code, repository files, or build-time public environment variables.

## Required migration sequence

1. Select and approve a trusted backend path and its operating-cost boundary.
2. Define endpoint contracts and policy for when solutions are released.
3. Implement server-side ID-token verification, test authorization, idempotent submissions, server-side scoring, and safe response DTOs.
4. Migrate every student read path to the projection or trusted endpoint. Audit direct Firestore reads, listeners, fallback/local question sources, public question-detail/SEO routes, and attempt/solution flows.
5. Add emulator tests proving a student cannot read canonical answer-key documents, cannot write another user's attempt, cannot change a score, and cannot obtain solutions before permitted release.
6. Backfill `studentQuestions` in bounded pages, then run the full parity/forbidden-field verifier against the production project with an explicit operator-run maintenance window and report the result. Emulator results do not prove production data is migrated.
7. Test complete student journeys (start, resume, submit, duplicate submit, network retry, solution review, reattempt) and load/concurrency behaviour.
8. Deploy backend first, verify health and telemetry, then deploy client changes, then tighten Firestore rules in a separate reviewed release.
9. Keep a tested rollback plan. Never roll back to public canonical reads after answer-key confidentiality is promised.

## Release gates

- [ ] Trusted backend selected and funded/operationally approved.
- [ ] No student client path can read canonical answer-key documents.
- [ ] Score and attempt ownership are enforced server-side.
- [ ] Solution-release policy is enforced server-side.
- [ ] Projection verifier has full production coverage and passes.
- [ ] Rules emulator and student journey tests pass.
- [ ] Load test passes agreed SLOs with acceptable error rate.
- [ ] Rollback plan and deployment evidence are recorded.

## Explicit non-goals

- This ADR does not migrate production data, change billing, deploy a backend, tighten live Firestore rules, or claim answer-key confidentiality is already achieved.
