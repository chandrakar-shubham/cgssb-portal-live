# CGSSB Content Manager MCP

This service is the AI bridge between ChatGPT/Codex and the existing CGSSBTest Content Manager.

## What it does

The MCP server exposes small, auditable tools instead of direct Firestore access:

- `cgssb_get_catalog` — inspect the canonical exam/recruitment hierarchy.
- `cgssb_get_series` — inspect a canonical Test Series and its bundle content.
- `cgssb_upsert_subjects` — save reusable subjects and attach them to a series syllabus. Weightage is calculated from total marks.
- `cgssb_update_exam_blueprint` — update the series exam blueprint without publishing it.
- `cgssb_validate_series` — reconcile subject marks/question counts against the exam blueprint.
- `cgssb_publish_series` — explicit, confirmed publish action.

All writes are draft-first except the explicit publish tool. Every write creates an `aiContentManagerAudit` record.

## Authentication

The initial development bridge uses a bearer token so the server is never an unauthenticated admin API. Keep the token in the deployment secret store; never commit it.

For public plugin distribution, replace this development gate with MCP OAuth 2.1 as described by OpenAI's plugin authentication requirements.

## Firebase

The bridge uses the Firebase Admin SDK and therefore requires a trusted server credential. It never ships the credential to the browser.

The existing application remains client-side Firebase + Firestore. This service is additive and does not change student authentication or Firestore rules.

## Local test

```bash
npm install
# set environment variables from .env.example
npm run dev
```

The MCP endpoint is:

`http://localhost:8787/mcp`

Health check:

`http://localhost:8787/healthz`

Use MCP Inspector to test the Streamable HTTP endpoint.

## Deployment

The service needs a stable HTTPS endpoint. It can run on Cloud Run, a Node-capable host, or another serverless/container platform. Firebase Cloud Functions/App Hosting require the Firebase project to be on the Blaze plan, so deployment should be treated as a separate infrastructure decision from the current Firebase Spark student application.

Do not place service-account credentials in the repository or in a client-side environment variable.
