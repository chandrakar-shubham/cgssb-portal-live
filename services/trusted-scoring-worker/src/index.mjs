import { verifyFirebaseIdToken } from "./firebaseToken.mjs";
import { parseAttemptSubmission } from "./attemptRequest.mjs";
import { submitTrustedAttempt } from "./submitAttemptService.mjs";
import { loadAuthorizedAttemptReview } from "./attemptReviewService.mjs";
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
  const match = /^Bearer ([^\s]+)$/i.exec(value);
  return match?.[1] || null;
}

/**
 * Build the Worker with replaceable infrastructure boundaries.
 * Production uses the secure defaults; tests inject deterministic identity and
 * repository adapters to exercise complete HTTP journeys without live secrets.
 */
export function createTrustedScoringWorker({
  verifyToken = verifyFirebaseIdToken,
  parseSubmission = parseAttemptSubmission,
  createRepository = createTrustedAttemptRepository,
} = {}) {
  let repositoryPromise;
  async function getRepository(env) {
    repositoryPromise ||= Promise.resolve().then(() => createRepository(env));
    try {
      return await repositoryPromise;
    } catch (error) {
      repositoryPromise = undefined;
      throw error;
    }
  }

  return {
    async fetch(request, env) {
      const url = new URL(request.url);
      const origin = request.headers.get("origin");
      const allowedOrigins = new Set(
        String(env?.ALLOWED_ORIGINS || "").split(",").map(value => value.trim()).filter(Boolean),
      );

      if (origin && !allowedOrigins.has(origin)) {
        return json({ error: "CORS_ORIGIN_NOT_ALLOWED" }, 403);
      }

      const corsHeaders = origin ? {
        "access-control-allow-origin": origin,
        "access-control-allow-methods": "GET, POST, OPTIONS",
        "access-control-allow-headers": "Authorization, Content-Type",
        "access-control-max-age": "600",
        "vary": "Origin",
      } : {};
      const respond = (body, status = 200) => json(body, status, corsHeaders);

      if (request.method === "OPTIONS") {
        if (!origin) return respond({ error: "CORS_ORIGIN_REQUIRED" }, 400);
        return new Response(null, { status: 204, headers: corsHeaders });
      }

      if (request.method === "GET" && url.pathname === "/healthz") {
        return respond({ ok: true, service: "cgssb-trusted-scoring", mode: "trusted-api" });
      }

      const reviewMatch = request.method === "GET"
        ? /^\/v1\/attempts\/([A-Za-z0-9_-]{1,128})\/review$/.exec(url.pathname)
        : null;
      const isSubmission = request.method === "POST" && url.pathname === "/v1/attempts:submit";
      if (!isSubmission && !reviewMatch) return respond({ error: "NOT_FOUND" }, 404);

      const token = readBearer(request);
      if (!token) return respond({ error: "UNAUTHENTICATED" }, 401);

      let identity;
      try {
        identity = await verifyToken(token, env.FIREBASE_PROJECT_ID);
        if (!identity || typeof identity.uid !== "string" || !identity.uid) {
          return respond({ error: "UNAUTHENTICATED" }, 401);
        }
      } catch {
        return respond({ error: "UNAUTHENTICATED" }, 401);
      }

      if (reviewMatch) {
        let repository;
        try {
          repository = await getRepository(env);
        } catch {
          return respond({ error: "SCORING_BACKEND_NOT_CONFIGURED" }, 503);
        }
        const review = await loadAuthorizedAttemptReview({
          uid: identity.uid, attemptId: reviewMatch[1], repository,
        });
        if (!review.ok) {
          const status = [400, 401, 403, 404, 409].includes(review.status) ? review.status : 503;
          return respond({ error: review.error }, status);
        }
        return respond({
          ok: true,
          canViewSolutions: review.canViewSolutions,
          attempt: review.result,
        });
      }

      const parsed = await parseSubmission(request);
      if (!parsed.ok) return respond({ error: parsed.error }, parsed.status);

      let repository;
      try {
        repository = await getRepository(env);
      } catch {
        return respond({ error: "SCORING_BACKEND_NOT_CONFIGURED" }, 503);
      }

      const result = await submitTrustedAttempt({
        uid: identity.uid,
        submission: parsed.value,
        repository,
      });
      if (!result.ok) {
        const status = [400, 401, 403, 404, 409, 413, 415].includes(result.status) ? result.status : 503;
        return respond({ error: result.error }, status);
      }
      return respond({
        ok: true,
        replayed: result.replayed === true,
        attempt: result.result,
      }, result.status);
    },
  };
}

const worker = createTrustedScoringWorker();
export default worker;
