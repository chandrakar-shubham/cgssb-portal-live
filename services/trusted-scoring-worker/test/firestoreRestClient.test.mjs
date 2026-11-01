import test from "node:test";
import assert from "node:assert/strict";
import { createFirestoreRestClient, FirestoreRestError } from "../src/firestoreRestClient.mjs";

function response(body, status = 200, contentType = "application/json") {
  return new Response(typeof body === "string" ? body : JSON.stringify(body), {
    status, headers: { "content-type": contentType },
  });
}

test("reads and decodes Firestore documents using a server access token", async () => {
  let seenUrl = "";
  let seenAuthorization = "";
  const client = createFirestoreRestClient({
    projectId: "project-test", databaseId: "database-test",
    getAccessToken: async () => "server-oauth-token",
    fetchImpl: async (url, init) => {
      seenUrl = url;
      seenAuthorization = init.headers.authorization;
      return response({
        name: "projects/project-test/databases/database-test/documents/users/u1",
        fields: {
          name: { stringValue: "Student" },
          active: { booleanValue: true },
          count: { integerValue: "4" },
          preferences: { mapValue: { fields: { language: { stringValue: "en" } } } },
        },
      });
    },
  });
  const user = await client.getDocument("users/u1");
  assert.equal(user.name, "Student");
  assert.equal(user.active, true);
  assert.equal(user.count, 4);
  assert.equal(user.preferences.language, "en");
  assert.equal(user.__path, "users/u1");
  assert.match(seenUrl, /documents\/users\/u1$/);
  assert.equal(seenAuthorization, "Bearer server-oauth-token");
});

test("treats a missing Firestore document as null", async () => {
  const client = createFirestoreRestClient({
    projectId: "project-test",
    getAccessToken: async () => "token",
    fetchImpl: async () => response({ error: { status: "NOT_FOUND" } }, 404),
  });
  assert.equal(await client.getDocument("users/missing"), null);
});

test("batch gets only requested documents and maps names back to paths", async () => {
  let requestBody;
  const client = createFirestoreRestClient({
    projectId: "project-test", databaseId: "(default)",
    getAccessToken: async () => "token",
    fetchImpl: async (url, init) => {
      requestBody = JSON.parse(init.body);
      return response([
        { found: {
          name: "projects/project-test/databases/(default)/documents/questions/q2",
          fields: { correctOption: { stringValue: "B" } },
        } },
        { missing: "projects/project-test/databases/(default)/documents/questions/q1" },
      ]);
    },
  });
  const result = await client.batchGetDocuments(["questions/q1", "questions/q2"]);
  assert.equal(requestBody.documents.length, 2);
  assert.equal(result.length, 1);
  assert.equal(result[0].__path, "questions/q2");
  assert.equal(result[0].correctOption, "B");
});

test("decodes newline-delimited Firestore batchGet streaming responses", async () => {
  const client = createFirestoreRestClient({
    projectId: "project-test", databaseId: "named-db",
    getAccessToken: async () => "token",
    fetchImpl: async () => response([
      JSON.stringify({ found: {
        name: "projects/project-test/databases/named-db/documents/questions/q2",
        fields: { correctOption: { stringValue: "C" } },
      } }),
      JSON.stringify({ missing: "projects/project-test/databases/named-db/documents/questions/q1" }),
    ].join("\n"), 200, "application/json"),
  });
  const result = await client.batchGetDocuments(["questions/q1", "questions/q2"]);
  assert.deepEqual(result.map(question => question.__path), ["questions/q2"]);
  assert.equal(result[0].correctOption, "C");
});

test("commits both attempt writes with create-only preconditions", async () => {
  let requestBody;
  const client = createFirestoreRestClient({
    projectId: "project-test",
    getAccessToken: async () => "token",
    fetchImpl: async (_url, init) => {
      requestBody = JSON.parse(init.body);
      return response({ writeResults: [{}, {}] });
    },
  });
  await client.commitWrites([
    { path: "trustedAttempts/a1", data: { score: 2 }, currentDocument: { exists: false } },
    { path: "trustedAttemptIdempotency/a1", data: { fingerprint: "fp" }, currentDocument: { exists: false } },
  ]);
  assert.equal(requestBody.writes.length, 2);
  assert.equal(requestBody.writes[0].currentDocument.exists, false);
  assert.equal(requestBody.writes[1].currentDocument.exists, false);
  assert.equal(requestBody.writes[0].update.fields.score.integerValue, "2");
});

test("does not allow invalid document paths or non-finite values", async () => {
  const client = createFirestoreRestClient({
    projectId: "project-test", getAccessToken: async () => "token",
    fetchImpl: async () => response({}),
  });
  await assert.rejects(() => client.getDocument("users/../other"), /invalid Firestore document path/);
  await assert.rejects(() => client.commitWrites([{ path: "trustedAttempts/a1", data: { score: Number.NaN } }]), /finite/);
});

test("surfaces typed Firestore REST errors without returning response bodies", async () => {
  const client = createFirestoreRestClient({
    projectId: "project-test", getAccessToken: async () => "token",
    fetchImpl: async () => response({ error: { status: "PERMISSION_DENIED", message: "sensitive details" } }, 403),
  });
  await assert.rejects(
    () => client.getDocument("users/u1"),
    error => error instanceof FirestoreRestError && error.status === 403 && !error.message.includes("sensitive"),
  );
});


test("runs bounded owner-filtered trusted history queries with a stable cursor", async () => {
  let requestBody;
  const client = createFirestoreRestClient({
    projectId: "project-test", databaseId: "(default)",
    getAccessToken: async () => "server-token",
    fetchImpl: async (url, init) => {
      assert.match(url, /documents:runQuery$/);
      requestBody = JSON.parse(init.body);
      return response([{
        document: {
          name: "projects/project-test/databases/(default)/documents/trustedAttempts/a1",
          fields: {
            id: { stringValue: "a1" },
            userId: { stringValue: "student-1" },
            submittedAt: { stringValue: "2026-11-01T10:00:00.000Z" },
          },
        },
      }]);
    },
  });
  const rows = await client.queryDocuments({
    collectionId: "trustedAttempts",
    filters: [{ field: "userId", op: "EQUAL", value: "student-1" }],
    orderBy: [
      { field: "submittedAt", direction: "DESCENDING" },
      { field: "__name__", direction: "DESCENDING" },
    ],
    limit: 10,
    cursor: { submittedAt: "2026-10-31T10:00:00.000Z", id: "a0" },
  });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].userId, "student-1");
  const query = requestBody.structuredQuery;
  assert.equal(query.where.fieldFilter.field.fieldPath, "userId");
  assert.equal(query.where.fieldFilter.value.stringValue, "student-1");
  assert.equal(query.limit, 10);
  assert.equal(query.orderBy[0].field.fieldPath, "submittedAt");
  assert.equal(query.startAt.values[0].stringValue, "2026-10-31T10:00:00.000Z");
  assert.match(query.startAt.values[1].referenceValue, /trustedAttempts\/a0$/);
});

test("rejects unsafe Firestore query definitions before network access", async () => {
  let calls = 0;
  const client = createFirestoreRestClient({
    projectId: "project-test", getAccessToken: async () => "token",
    fetchImpl: async () => { calls += 1; return response([]); },
  });
  await assert.rejects(() => client.queryDocuments({
    collectionId: "trustedAttempts", filters: [{ field: "userId", op: "GREATER_THAN", value: "u1" }],
    orderBy: [], limit: 10,
  }), /invalid Firestore query filter/);
  await assert.rejects(() => client.queryDocuments({
    collectionId: "trustedAttempts", filters: [{ field: "userId", op: "EQUAL", value: "u1" }],
    orderBy: [], limit: 101,
  }), /invalid Firestore structured query/);
  assert.equal(calls, 0);
});
