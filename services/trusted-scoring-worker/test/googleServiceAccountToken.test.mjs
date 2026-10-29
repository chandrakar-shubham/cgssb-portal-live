import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { createServiceAccountTokenProvider } from "../src/googleServiceAccountToken.mjs";

function decodePart(value) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
}

test("creates a short-lived datastore-scoped OAuth token and caches it", async () => {
  const { privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
    publicKeyEncoding: { type: "spki", format: "pem" },
  });
  let clock = Date.parse("2026-10-29T10:00:00Z");
  let exchanges = 0;
  let assertion;
  const provider = createServiceAccountTokenProvider({
    clientEmail: "trusted-worker@example-project.iam.gserviceaccount.com",
    privateKey,
    now: () => clock,
    fetchImpl: async (url, init) => {
      assert.equal(url, "https://oauth2.googleapis.com/token");
      assert.equal(init.method, "POST");
      const params = new URLSearchParams(init.body);
      assertion = params.get("assertion");
      exchanges += 1;
      return new Response(JSON.stringify({ access_token: "server-token", expires_in: 3600 }), {
        status: 200, headers: { "content-type": "application/json" },
      });
    },
  });
  assert.equal(await provider.getAccessToken(), "server-token");
  assert.equal(await provider.getAccessToken(), "server-token");
  assert.equal(exchanges, 1);
  const [header, claims, signature] = assertion.split(".");
  assert.equal(decodePart(header).alg, "RS256");
  const payload = decodePart(claims);
  assert.equal(payload.iss, "trusted-worker@example-project.iam.gserviceaccount.com");
  assert.equal(payload.scope, "https://www.googleapis.com/auth/datastore");
  assert.equal(payload.aud, "https://oauth2.googleapis.com/token");
  assert.ok(signature.length > 100);
  clock += 3_600_000;
  assert.equal(await provider.getAccessToken(), "server-token");
  assert.equal(exchanges, 2);
});

test("fails closed when OAuth returns an invalid token response", async () => {
  const { privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
    publicKeyEncoding: { type: "spki", format: "pem" },
  });
  const provider = createServiceAccountTokenProvider({
    clientEmail: "worker@example.com",
    privateKey,
    fetchImpl: async () => new Response(JSON.stringify({ access_token: "", expires_in: 3600 }), { status: 200 }),
  });
  await assert.rejects(() => provider.getAccessToken(), /TOKEN_RESPONSE_INVALID/);
});
