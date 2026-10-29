const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/datastore";

function base64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function encodeJson(value) {
  return base64Url(new TextEncoder().encode(JSON.stringify(value)));
}

function decodePemPkcs8(pem) {
  if (typeof pem !== "string") throw new TypeError("service-account private key is missing");
  const normalized = pem.replace(/\\n/g, "\n");
  const match = /-----BEGIN PRIVATE KEY-----([\s\S]+?)-----END PRIVATE KEY-----/.exec(normalized);
  if (!match) throw new TypeError("service-account private key must be PKCS#8 PEM");
  const base64 = match[1].replace(/\s/g, "");
  const binary = atob(base64);
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

/**
 * Creates a short-lived Google OAuth token provider for a server-only service
 * account. Store email/private key as Worker secrets; never expose them to the
 * browser or commit them to the repository. IAM must grant least privilege.
 */
export function createServiceAccountTokenProvider({
  clientEmail,
  privateKey,
  fetchImpl = fetch,
  now = () => Date.now(),
}) {
  if (typeof clientEmail !== "string" || !clientEmail.includes("@") ||
      typeof privateKey !== "string" || typeof fetchImpl !== "function") {
    throw new TypeError("service-account token provider configuration is incomplete");
  }
  let cachedToken = null;
  let cachedExpiry = 0;
  let importedKeyPromise = null;

  async function getAccessToken() {
    const currentTime = now();
    if (!Number.isFinite(currentTime)) throw new Error("INVALID_TOKEN_CLOCK");
    if (cachedToken && currentTime < cachedExpiry - 60_000) return cachedToken;

    importedKeyPromise ||= crypto.subtle.importKey(
      "pkcs8",
      decodePemPkcs8(privateKey),
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const key = await importedKeyPromise;
    const issuedAt = Math.floor(currentTime / 1000);
    const header = encodeJson({ alg: "RS256", typ: "JWT" });
    const claims = encodeJson({
      iss: clientEmail,
      scope: SCOPE,
      aud: TOKEN_URL,
      iat: issuedAt,
      exp: issuedAt + 3600,
    });
    const unsigned = `${header}.${claims}`;
    const signature = await crypto.subtle.sign(
      { name: "RSASSA-PKCS1-v1_5" },
      key,
      new TextEncoder().encode(unsigned),
    );
    const assertion = `${unsigned}.${base64Url(new Uint8Array(signature))}`;

    const response = await fetchImpl(TOKEN_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }).toString(),
    });
    if (!response.ok) throw new Error("GOOGLE_OAUTH_TOKEN_EXCHANGE_FAILED");
    const result = await response.json();
    if (typeof result.access_token !== "string" || !result.access_token ||
        !Number.isFinite(Number(result.expires_in)) || Number(result.expires_in) < 120) {
      throw new Error("GOOGLE_OAUTH_TOKEN_RESPONSE_INVALID");
    }
    cachedToken = result.access_token;
    cachedExpiry = currentTime + Number(result.expires_in) * 1000;
    return cachedToken;
  }

  return Object.freeze({ getAccessToken });
}
