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
