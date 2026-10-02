---
name: cgssb-content-management
description: Operate the CGSSBTest Content Manager through the CGSSB Content Manager MCP tools. Use this skill when importing, reviewing, validating, or publishing canonical exam/recruitment content.
---

# CGSSB Content Management

Use the canonical hierarchy:

Authority → Recruitment/Examination → Post → Test Series.

## Required workflow

1. Call `cgssb_get_catalog` when the target series is not already known.
2. Call `cgssb_get_series` before changing an existing series.
3. For syllabus subjects, use `cgssb_upsert_subjects`. It creates reusable `examSubjects` records and updates the series syllabus. Weightage is calculated from the exam blueprint total marks.
4. Use `cgssb_update_exam_blueprint` for blueprint changes.
5. Call `cgssb_validate_series` after syllabus or blueprint changes.
6. Keep content in DRAFT while it is being assembled or reviewed.
7. Only call `cgssb_publish_series` when the user explicitly asks to publish and the validation is clean.

## Source fidelity

When the user provides an official syllabus/notification, preserve the source's terminology and organization. Do not silently invent syllabus topics or reconcile contradictions without telling the user.

## Safety

Never expose Firebase credentials or service-account data. Never bypass the Content Manager tools by constructing direct Firestore writes in a client context.