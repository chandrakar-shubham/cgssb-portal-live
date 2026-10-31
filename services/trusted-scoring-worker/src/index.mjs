import { verifyFirebaseIdToken } from "./firebaseToken.mjs";
import { parseAttemptSubmission } from "./attemptRequest.mjs";
import { submitTrustedAttempt } from "./submitAttemptService.mjs";
import { createTrustedAttemptRepository } from "./createTrustedAttemptRepository.mjs";

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
  const match = /^Bearer ([^\\s]+)$/i.exec(value);
  return match?.[1] || null;
}

// Cloudflare Worker isolates reuse module state between requests. Retain one
// repository/token provider per isolate so OAuth tokens can be safely cached.
let repositoryPromise;
function getRepository(env) {
  repositoryPromise ||= Promise.resolve().then(() => createTrustedAttemptRepository(env));
  return repositoryPromise;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/healthz") {
      return json({ ok: true, service: "cgssb-trusted-scoring", mode: "trusted-api" });
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
      return json({ error: "UNAUTHENTICATED" }, 401);
    }

    const parsed = await parseAttemptSubmission(request);
    if (!parsed.ok) return json({ error: parsed.error }, parsed.status);

    let repository;
    try {
      repository = await getRepository(env);
    } catch {
      return json({ error: "SCORING_BACKEND_NOT_CONFIGURED" }, 503);
    }

    const result = await submitTrustedAttempt({
      uid: identity.uid,
      submission: parsed.value,
      repository,
    });
    if (!result.ok) {
      const status = [400, 401, 403, 404, 409, 413, 415].includes(result.status) ? result.status : 503;
      return json({ error: result.error }, status);
    }
    return json({
      ok: true,
      replayed: result.replayed === true,
      attempt: result.result,
    }, result.status);
  },
};
