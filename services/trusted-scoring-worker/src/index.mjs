import { verifyFirebaseIdToken } from "./firebaseToken.mjs";
import { parseAttemptSubmission } from "./attemptRequest.mjs";

const json = (body, status = 200, extraHeaders = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      ...extraHeaders,
    },
  });

function readBearer(request) {
  const value = request.headers.get("authorization") || "";
  const match = /^Bearer ([^\s]+)$/i.exec(value);
  return match?.[1] || null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/healthz") {
      return json({ ok: true, service: "cgssb-trusted-scoring", mode: "scaffold" });
    }

    if (request.method !== "POST" || url.pathname !== "/v1/attempts:submit") {
      return json({ error: "NOT_FOUND" }, 404);
    }

    const token = readBearer(request);
    if (!token) return json({ error: "UNAUTHENTICATED" }, 401);

    let identity;
    try {
      identity = await verifyFirebaseIdToken(token, env.FIREBASE_PROJECT_ID);
    } catch {
      // Do not reveal whether the token, key endpoint, project config, or claims failed.
      return json({ error: "UNAUTHENTICATED" }, 401);
    }

    const parsed = await parseAttemptSubmission(request);
    if (!parsed.ok) return json({ error: parsed.error }, parsed.status);

    // Fail closed until a least-privilege data adapter, test eligibility checks,
    // server-side scoring rules, and idempotent attempt persistence are implemented.
    // Never accept a browser-provided score as a fallback.
    if (!env.ATTEMPT_REPOSITORY) {
      return json({
        error: "SCORING_BACKEND_NOT_CONFIGURED",
        message: "Submission is not enabled until trusted persistence and scoring are configured.",
        requestId: crypto.randomUUID(),
      }, 503);
    }

    // Repository bindings are deliberately not invoked until their schema and
    // authorization contract have been reviewed and tested.
    return json({ error: "SCORING_BACKEND_NOT_IMPLEMENTED" }, 503);
  },
};
