import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.mjs";

test("health endpoint exposes service health without database configuration", async () => {
  const response = await worker.fetch(new Request("https://worker.example/healthz"), {});
  assert.equal(response.status, 200);
  assert.equal((await response.json()).ok, true);
});

test("submission endpoint rejects missing bearer tokens before repository access", async () => {
  const response = await worker.fetch(new Request("https://worker.example/v1/attempts:submit", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      testId: "test-1", clientAttemptId: "attempt-1",
      responses: {}, timeTakenSeconds: 0,
    }),
  }), {});
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "UNAUTHENTICATED" });
});

test("unknown routes remain not found", async () => {
  const response = await worker.fetch(new Request("https://worker.example/v1/unknown"), {});
  assert.equal(response.status, 404);
});

test("review endpoint requires a bearer token before repository access", async () => {
  const response = await worker.fetch(new Request("https://worker.example/v1/attempts/attempt-123/review"), {});
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "UNAUTHENTICATED" });
});

test("review endpoint rejects malformed attempt identifiers as an unknown route", async () => {
  const response = await worker.fetch(new Request("https://worker.example/v1/attempts/invalid%2Fid/review"), {});
  assert.equal(response.status, 404);
});

test("browser preflight allows only the configured CGSSB origin and headers", async () => {
  const response = await worker.fetch(new Request("https://worker.example/v1/attempts:submit", {
    method: "OPTIONS",
    headers: {
      origin: "https://cgtest.in",
      "access-control-request-method": "POST",
      "access-control-request-headers": "authorization,content-type",
    },
  }), { ALLOWED_ORIGINS: "https://cgtest.in" });
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-allow-origin"), "https://cgtest.in");
  assert.match(response.headers.get("access-control-allow-methods") || "", /POST/);
  assert.match(response.headers.get("access-control-allow-headers") || "", /Authorization/i);
  assert.equal(response.headers.get("vary"), "Origin");
});

test("browser requests from unconfigured origins are rejected", async () => {
  const response = await worker.fetch(new Request("https://worker.example/healthz", {
    headers: { origin: "https://attacker.example" },
  }), { ALLOWED_ORIGINS: "https://cgtest.in" });
  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { error: "CORS_ORIGIN_NOT_ALLOWED" });
});

test("allowed browser origin receives CORS headers on API responses", async () => {
  const response = await worker.fetch(new Request("https://worker.example/healthz", {
    headers: { origin: "https://cgtest.in" },
  }), { ALLOWED_ORIGINS: "https://cgtest.in" });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("access-control-allow-origin"), "https://cgtest.in");
});
