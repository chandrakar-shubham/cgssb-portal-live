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


## Cloud Run deployment

The repository includes `.github/workflows/content-manager-mcp-deploy.yml`. It uses GitHub OIDC/Workload Identity Federation, so no Google service-account JSON key is stored in GitHub.

Configure these GitHub Actions secrets before running the deployment workflow:

- `GCP_PROJECT_ID` — Google Cloud project containing the MCP runtime.
- `GCP_REGION` — Cloud Run region, for example `asia-south1`.
- `CLOUD_RUN_SERVICE` — Cloud Run service name, for example `cgssb-content-manager-mcp`.
- `GCP_WORKLOAD_IDENTITY_PROVIDER` — full Workload Identity Provider resource name.
- `GCP_DEPLOY_SERVICE_ACCOUNT` — deployer service-account email.
- `GCP_RUNTIME_SERVICE_ACCOUNT` — runtime service-account email. Grant it the Firebase/Firestore permissions required by the Admin SDK.
- `FIREBASE_PROJECT_ID` — Firebase/GCP project ID used by the existing CGSSBTest Firestore.
- `FIRESTORE_DATABASE_ID` — named Firestore database ID when the project uses one.
- `MCP_BEARER_TOKEN` — temporary development token, minimum 32 characters.

The deployment workflow intentionally uses `--allow-unauthenticated` at Cloud Run and performs authentication at the MCP application layer. This is required because ChatGPT/MCP clients must be able to reach the HTTPS MCP endpoint before presenting their application-level credentials.

### Authentication roadmap

The bearer token is a development bridge only. For a ChatGPT custom MCP app with authenticated write actions, replace it with MCP OAuth 2.1 before production distribution. OpenAI's current guidance requires an OAuth-compatible protected-resource metadata flow for authenticated custom MCP servers. See the OpenAI authentication guidance before exposing write tools publicly.

### First deployment verification

After deployment, the workflow checks:

`GET <cloud-run-url>/healthz`

The MCP endpoint is:

`https://<cloud-run-url>/mcp`

Do not publish the endpoint or credentials until the OAuth/authentication configuration has been reviewed.
