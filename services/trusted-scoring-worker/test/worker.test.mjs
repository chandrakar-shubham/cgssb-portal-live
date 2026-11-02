import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.mjs";

const env = { FIREBASE_PROJECT_ID: "test-project" };

test("health endpoint exposes minimal trusted API status", async () => {
  const response = await worker.fetch(new Request("https://worker.test/healthz"), env);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    ok: true,
    service: "cgssb-trusted-scoring",
    mode: "trusted-api",
  });
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("unknown route is not found", async () => {
  const response = await worker.fetch(new Request("https://worker.test/not-a-route"), env);
  assert.equal(response.status, 404);
  assert.equal((await response.json()).error, "NOT_FOUND");
});

test("submission rejects missing bearer token", async () => {
  const response = await worker.fetch(
    new Request("https://worker.test/v1/attempts:submit", { method: "POST" }),
    env,
  );
  assert.equal(response.status, 401);
  assert.equal((await response.json()).error, "UNAUTHENTICATED");
});

test("submission rejects malformed bearer token", async () => {
  const response = await worker.fetch(
    new Request("https://worker.test/v1/attempts:submit", {
      method: "POST",
      headers: { authorization: "Bearer not-a-jwt" },
      body: JSON.stringify({ score: 100 }),
    }),
    env,
  );
  assert.equal(response.status, 401);
  assert.equal((await response.json()).error, "UNAUTHENTICATED");
});

test("unconfigured project fails closed", async () => {
  const response = await worker.fetch(
    new Request("https://worker.test/v1/attempts:submit", {
      method: "POST",
      headers: { authorization: "Bearer a.b.c" },
    }),
    { FIREBASE_PROJECT_ID: "REPLACE_WITH_NON_PRODUCTION_FIREBASE_PROJECT_ID" },
  );
  assert.equal(response.status, 401);
});


test("invalid bearer is rejected before Firestore configuration is initialized", async () => {
  let invoked = false;
  const response = await worker.fetch(
    new Request("https://worker.test/v1/attempts:submit", {
      method: "POST",
      headers: {
        authorization: "Bearer not-a-valid-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        testId: "test-1",
        clientAttemptId: "attempt-1",
        responses: { q1: "A" },
        timeTakenSeconds: 10,
      }),
    }),
    {
      FIREBASE_PROJECT_ID: "test-project",
      ATTEMPT_REPOSITORY: {
        get() { invoked = true; throw new Error("must not be called"); },
      },
    },
  );
  assert.equal(response.status, 401);
  assert.equal(invoked, false);
});
