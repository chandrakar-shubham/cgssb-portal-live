const API_ROOT = "https://firestore.googleapis.com/v1";

function encodeValue(value) {
  if (value === null) return { nullValue: null };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("Firestore values must be finite");
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encodeValue) } };
  if (typeof value === "object" && value !== null) {
    const fields = {};
    for (const [key, child] of Object.entries(value)) fields[key] = encodeValue(child);
    return { mapValue: { fields } };
  }
  throw new TypeError("unsupported Firestore value");
}

function decodeValue(value) {
  if (!value || typeof value !== "object") return undefined;
  if ("nullValue" in value) return null;
  if ("stringValue" in value) return value.stringValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  if ("timestampValue" in value) return value.timestampValue;
  if ("referenceValue" in value) return value.referenceValue;
  if ("arrayValue" in value) return (value.arrayValue.values || []).map(decodeValue);
  if ("mapValue" in value) return decodeFields(value.mapValue.fields || {});
  return undefined;
}

function decodeFields(fields) {
  return Object.fromEntries(Object.entries(fields || {}).map(([key, value]) => [key, decodeValue(value)]));
}

function encodeFields(data) {
  return Object.fromEntries(Object.entries(data || {}).map(([key, value]) => [key, encodeValue(value)]));
}

function documentName(projectId, databaseId, path) {
  const segments = path.split("/");
  if (segments.some(segment => !segment || segment === "." || segment === "..")) {
    throw new TypeError("invalid Firestore document path");
  }
  return `projects/${projectId}/databases/${databaseId}/documents/${segments.join("/")}`;
}

function decodeDocument(document, path) {
  if (!document || typeof document !== "object" || !document.fields) return null;
  return { ...decodeFields(document.fields), __path: path };
}

export class FirestoreRestError extends Error {
  constructor(status, code) {
    super(`Firestore REST request failed (${status})`);
    this.name = "FirestoreRestError";
    this.status = status;
    this.code = code || "FIRESTORE_REST_ERROR";
  }
}

/**
 * Minimal Firestore REST client for Cloudflare Workers/Node runtimes.
 * getAccessToken must return a fresh server OAuth token; never pass a client
 * Firebase ID token here. No credentials are stored by this client.
 */
export function createFirestoreRestClient({ projectId, databaseId = "(default)", getAccessToken, fetchImpl = fetch }) {
  if (typeof projectId !== "string" || !projectId ||
      typeof databaseId !== "string" || !databaseId ||
      typeof getAccessToken !== "function" || typeof fetchImpl !== "function") {
    throw new TypeError("Firestore REST client configuration is incomplete");
  }
  const base = `${API_ROOT}/projects/${encodeURIComponent(projectId)}/databases/${encodeURIComponent(databaseId)}/documents`;

  async function request(url, init = {}) {
    const token = await getAccessToken();
    if (typeof token !== "string" || !token) throw new Error("FIRESTORE_ACCESS_TOKEN_UNAVAILABLE");
    const response = await fetchImpl(url, {
      ...init,
      headers: {
        authorization: `Bearer ${token}`,
        ...(init.body ? { "content-type": "application/json" } : {}),
        ...init.headers,
      },
    });
    if (!response.ok) {
      let code = "FIRESTORE_REST_ERROR";
      try {
        const body = await response.json();
        code = body?.error?.status || body?.error?.message || code;
      } catch {}
      throw new FirestoreRestError(response.status, String(code).slice(0, 100));
    }
    return response;
  }

  return Object.freeze({
    async getDocument(path) {
      const name = documentName(projectId, databaseId, path);
      let response;
      try {
        response = await request(`${API_ROOT}/${name}`);
      } catch (error) {
        if (error instanceof FirestoreRestError && error.status === 404) return null;
        throw error;
      }
      const document = await response.json();
      return decodeDocument(document, path);
    },

    async batchGetDocuments(paths) {
      if (!Array.isArray(paths) || paths.length > 500) throw new TypeError("invalid Firestore batch-get paths");
      if (paths.length === 0) return [];
      const names = paths.map(path => documentName(projectId, databaseId, path));
      const response = await request(`${base}:batchGet`, {
        method: "POST",
        body: JSON.stringify({ documents: names }),
      });
      const text = await response.text();
      let rows;
      try {
        const parsed = JSON.parse(text);
        rows = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        rows = text.split("\n").filter(Boolean).map(line => JSON.parse(line));
      }
      const requestedPath = new Map(names.map((name, index) => [name, paths[index]]));
      const documents = [];
      for (const row of rows) {
        if (!row?.found?.name) continue;
        const path = requestedPath.get(row.found.name);
        if (!path) continue;
        const document = decodeDocument(row.found, path);
        if (document) documents.push(document);
      }
      return documents;
    },

    async commitWrites(writes) {
      if (!Array.isArray(writes) || writes.length === 0 || writes.length > 500) {
        throw new TypeError("invalid Firestore commit writes");
      }
      const encodedWrites = writes.map(write => {
        if (!write || typeof write.path !== "string" || !write.data || typeof write.data !== "object") {
          throw new TypeError("invalid Firestore write");
        }
        return {
          update: {
            name: documentName(projectId, databaseId, write.path),
            fields: encodeFields(write.data),
          },
          ...(write.currentDocument ? { currentDocument: write.currentDocument } : {}),
        };
      });
      const response = await request(`${base}:commit`, {
        method: "POST",
        body: JSON.stringify({ writes: encodedWrites }),
      });
      return response.json();
    },
  });
}
