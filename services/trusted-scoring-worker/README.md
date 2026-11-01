# CGSSB Trusted Scoring Worker

This Worker is a separate, server-authoritative scoring service. It is **not deployed or connected to the student app** by this repository change. The student app must continue using its existing production path until the non-production integration, scoring-policy, entitlement, review, and rollback gates are approved.

## Runtime configuration

The Worker reads these Cloudflare bindings:

| Binding | Type | Purpose |
|---|---|---|
| `FIREBASE_PROJECT_ID` | Variable | Exact Firebase project containing the target test/user/question records |
| `FIRESTORE_DATABASE_ID` | Variable | Exact Firestore database ID; this project uses a named database, so do not assume `(default)` |
| `ALLOWED_ORIGINS` | Variable | Comma-separated browser origins allowed by CORS |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Secret | Server-only service-account email |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | Secret | Server-only PKCS#8 private key PEM |

The two service-account values are secrets, never repository variables, frontend environment values, Firebase web config, or committed files. The Worker uses them to obtain short-lived Google OAuth tokens for the Firestore REST API. The service account must be dedicated to this Worker and granted only the minimum Firestore permissions required for the collections and operations used by the repository adapter. Have the Firebase/IAM owner approve the exact role before granting it; do not use Owner or Editor.

The checked-in `wrangler.toml` intentionally contains `REPLACE_WITH_NON_PRODUCTION_...` placeholders. Replace them only in a local/non-production working copy after creating an isolated Firebase project and named Firestore database. Do not point this Worker at the production project or database during validation.

## Required synthetic fixtures

Create dedicated non-production fixtures only:

- A Firebase Auth account whose UID begins with `synthetic-`.
- A `users/{uid}` profile whose stored `id` exactly equals that UID.
- A published `mockTests/{testId}` document whose ID begins with `synthetic-`, with explicit unique section `questionIds`, exact `questionCount`, and a supported single-answer question format.
- Canonical `questions/{questionId}` documents for every assigned ID; each ID must begin with `synthetic-`.

Do not copy production student records or answer keys into the test project. Use invented question content and answer keys.

## Local verification

From the repository root:

```bash
npm --prefix services/trusted-scoring-worker test
npm run check:trusted-firestore-smoke
```

The first command runs deterministic Worker unit and HTTP-journey tests using injected in-memory infrastructure. The second only syntax-checks the operator smoke-test script; neither command accesses a live Firestore database.

After an isolated project, named database, synthetic fixtures, and approved least-privilege service account exist, run the live smoke test from a secure local shell. Supply the following environment variables without placing their values in source control or chat:

```text
FIREBASE_PROJECT_ID
FIRESTORE_DATABASE_ID
TRUSTED_FIRESTORE_EXPECTED_PROJECT_ID
TRUSTED_FIRESTORE_NONPROD_CONFIRMATION
TRUSTED_FIRESTORE_TEST_UID
TRUSTED_FIRESTORE_TEST_ID
GOOGLE_SERVICE_ACCOUNT_EMAIL
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
```

The smoke test fails closed unless the configured and confirmed project IDs match, both project and database IDs end in `-dev`, `-test`, `-qa`, `-staging`, or `-sandbox`, the confirmation exactly equals `NON_PRODUCTION:<project-id>:<database-id>`, and the UID, test ID, and all question IDs use the `synthetic-` prefix. It checks fixture reads, atomic attempt/idempotency creation, exact replay, changed-payload conflict, and cleanup of the uniquely generated smoke records.

Example invocation after setting those variables securely in the shell:

```bash
node scripts/trusted-firestore-smoke.mjs
```

Do not paste private keys or OAuth tokens into terminal transcripts, issue comments, pull requests, or support messages.

## Deployment is a separate approval gate

Do not run `wrangler deploy`, configure production secrets, alter production IAM, change Firestore rules, or update the student app endpoint as part of routine branch validation. Before any non-production Worker deployment, review the environment bindings and synthetic fixtures, then deploy only to the isolated non-production project/database. Verify `GET /healthz`, authenticated synthetic submission, idempotent retry, review before release, review after release, and cross-user denial.

The production cutover remains blocked on the approved scoring contract, full entitlement/device/campaign policy, published-catalog compatibility audit, client review/history/leaderboard integration, non-production Firestore proof, realistic capacity testing, and an operator-approved rollback plan. Passing repository CI is not evidence that the Worker is deployed or production-ready.
