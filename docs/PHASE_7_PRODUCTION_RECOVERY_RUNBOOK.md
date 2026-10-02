# Phase 7 — Production Recovery Runbook

## Scope
This runbook defines the production data-recovery requirements for CGSSB Test. Firestore is the authoritative production database.

## Current production invariants
- Canonical hierarchy: Authority → Recruitment/Exam → Post → Test Series → Bundle → Tests → Questions.
- Test Series and its linked Bundle are one logical aggregate.
- Production content creation must use canonical catalog IDs.
- Browser JSON exports are audit snapshots only, not backups and not restore inputs.
- Client-side code must never contain privileged Firebase service-account credentials.
- The browser must never provide a destructive production restore operation.

## Backup architecture
A real backup must run outside the browser using a trusted server-side process with least-privilege credentials.

Recommended flow:
1. Firestore production database.
2. Scheduled server-side export.
3. Versioned, immutable backup artifact in controlled storage.
4. Integrity manifest containing export timestamp, Firebase project/database identity, collection counts, and a checksum/manifest identifier.
5. Recovery verification on an isolated non-production target.
6. Documented approval before any production restoration.

The backup job must include, at minimum:
- canonical catalog collections: examAuthorities, examPrograms, examPosts, examTestSeries, examSubjects
- bundles, mockTests, questions, pypPapers
- student/attempt data required by the application's retention policy
- CMS/current-affairs collections required for service continuity

## Credential boundary
Do not place a service-account JSON key, private key, Admin SDK credentials, or privileged Firestore credentials in Vite/React source, Firebase Hosting assets, or browser local storage.

If the project remains on Firebase Spark, provision the backup infrastructure separately (for example a trusted server/CI environment or an available managed export facility). The frontend alone cannot implement a trustworthy privileged Firestore backup.

## Recovery procedure
1. Identify the exact backup artifact and verify its integrity manifest.
2. Restore to an isolated/non-production Firestore target first.
3. Run the application's database integrity audit.
4. Verify canonical Series ↔ Bundle relationships and required program/post/series IDs.
5. Verify test → question references and PYP links.
6. Run authentication, test-start, submission, result, and leaderboard smoke tests against the isolated target.
7. Record the recovery result and approval.
8. Only then execute an explicitly authorized production recovery.

## Orphan handling
Normal deletion is canonical and moves the paired Series + Bundle together. The orphan inspector is for historical leftovers from the old lifecycle only. An orphan may be finalized only after confirming that no Bundle references the Series.

## Phase 7 exit gate
Phase 7 is complete only when:
- Firestore is the authoritative production source.
- Canonical catalog ingestion is the production content path.
- Production test/question/PYP writes enforce canonical IDs.
- Orphan detection and guarded cleanup are operational.
- Unsafe browser restore is absent.
- Production observability is live.
- A real server-side backup mechanism is provisioned.
- At least one isolated recovery drill passes.