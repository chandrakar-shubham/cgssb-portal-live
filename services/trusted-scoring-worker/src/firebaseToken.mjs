const GOOGLE_SECURETOKEN_JWKS =
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

let cachedKeys = null;
let cacheExpiresAt = 0;

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return Uint8Array.from(atob(padded), character => character.charCodeAt(0));
}

function decodeJsonSegment(segment) {
  return JSON.parse(new TextDecoder().decode(decodeBase64Url(segment)));
}

async function getSigningKeys(now = Date.now()) {
  if (cachedKeys && now < cacheExpiresAt) return cachedKeys;

  const response = await fetch(GOOGLE_SECURETOKEN_JWKS, {
    headers: { accept: "application/json" },
  });
  if (!response.ok) throw new Error("Firebase signing keys unavailable");

  const body = await response.json();
  if (!Array.isArray(body.keys) || body.keys.length === 0) {
    throw new Error("Firebase signing keys response invalid");
  }

  const maxAge = response.headers.get("cache-control")?.match(/max-age=(\d+)/i);
  const ttlSeconds = Math.min(Math.max(Number(maxAge?.[1] || 300), 60), 3600);
  cachedKeys = body.keys;
  cacheExpiresAt = now + ttlSeconds * 1000;
  return cachedKeys;
}

/**
 * Verifies Firebase ID token signature and core claims. Fails closed on any
 * malformed token, unavailable key service, unknown key ID, or claim mismatch.
 */
export async function verifyFirebaseIdToken(token, projectId, nowSeconds = Math.floor(Date.now() / 1000)) {
  if (!projectId || projectId.includes("REPLACE_WITH")) {
    throw new Error("Firebase project is not configured");
  }
  if (typeof token !== "string" || token.length > 12_000) {
    throw new Error("Invalid bearer token");
  }

  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Malformed bearer token");

  const header = decodeJsonSegment(parts[0]);
  const claims = decodeJsonSegment(parts[1]);
  if (header.alg !== "RS256" || typeof header.kid !== "string") {
    throw new Error("Unsupported token signing algorithm");
  }

  const issuer = `https://securetoken.google.com/${projectId}`;
  if (
    claims.aud !== projectId ||
    claims.iss !== issuer ||
    typeof claims.sub !== "string" ||
    claims.sub.length === 0 ||
    claims.sub.length > 128 ||
    !Number.isFinite(claims.exp) ||
    claims.exp <= nowSeconds ||
    !Number.isFinite(claims.iat) ||
    claims.iat > nowSeconds + 60 ||
    claims.iat < nowSeconds - 60 * 60 * 24 * 7
  ) {
    throw new Error("Invalid token claims");
  }

  const keys = await getSigningKeys();
  const jwk = keys.find(key => key.kid === header.kid && key.kty === "RSA" && key.use === "sig");
  if (!jwk) {
    cachedKeys = null;
    cacheExpiresAt = 0;
    throw new Error("Unknown token signing key");
  }

  const publicKey = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const signedContent = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  const signature = decodeBase64Url(parts[2]);
  const validSignature = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    publicKey,
    signature,
    signedContent,
  );
  if (!validSignature) throw new Error("Invalid token signature");

  return { uid: claims.sub, claims };
}
