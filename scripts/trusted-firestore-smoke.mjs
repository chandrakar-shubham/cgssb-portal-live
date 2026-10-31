import { randomUUID } from "node:crypto";
import { createServiceAccountTokenProvider } from "../services/trusted-scoring-worker/src/googleServiceAccountToken.mjs";
import { createFirestoreRestClient } from "../services/trusted-scoring-worker/src/firestoreRestClient.mjs";
import { createFirestoreAttemptRepository } from "../services/trusted-scoring-worker/src/firestoreAttemptRepository.mjs";
import { buildTrustedTestDefinition } from "../services/trusted-scoring-worker/src/trustedTestDefinition.mjs";

function required(name) {
  const value = process.env[name];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const projectId = required("FIREBASE_PROJECT_ID");
const databaseId = required("FIRESTORE_DATABASE_ID");
const expectedProjectId = required("TRUSTED_FIRESTORE_EXPECTED_PROJECT_ID");
const confirmation = required("TRUSTED_FIRESTORE_NONPROD_CONFIRMATION");
const uid = required("TRUSTED_FIRESTORE_TEST_UID");
const testId = required("TRUSTED_FIRESTORE_TEST_ID");
const privateKey = required("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY");
const clientEmail = required("GOOGLE_SERVICE_ACCOUNT_EMAIL");

assert(projectId === expectedProjectId, "Configured and explicitly confirmed project IDs do not match");
assert(/-(dev|test|qa|staging|sandbox)$/.test(projectId),
  "Refusing smoke test: project ID must end in -dev, -test, -qa, -staging, or -sandbox");
assert(/-(dev|test|qa|staging|sandbox)$/.test(databaseId),
  "Refusing smoke test: database ID must end in -dev, -test, -qa, -staging, or -sandbox");
assert(confirmation === `NON_PRODUCTION:${projectId}:${databaseId}`,
  "Refusing smoke test: explicit non-production project/database confirmation does not match");
assert(uid.startsWith("synthetic-"), "Refusing smoke test: test UID must use the synthetic- prefix");
assert(testId.startsWith("synthetic-"), "Refusing smoke test: test ID must use the synthetic- prefix");

const tokenProvider = createServiceAccountTokenProvider({ clientEmail, privateKey });
const firestore = createFirestoreRestClient({
  projectId,
  databaseId,
  getAccessToken: tokenProvider.getAccessToken,
});
const repository = createFirestoreAttemptRepository({ firestore });
const runId = randomUUID().replace(/-/g, "");
const attemptId = `smoke_${runId}`;
const attemptPath = `trustedAttempts/${attemptId}`;
const idempotencyPath = `trustedAttemptIdempotency/${attemptId}`;
const baseUrl = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/${encodeURIComponent(databaseId)}/documents`;

async function deleteDocument(path) {
  const token = await tokenProvider.getAccessToken();
  const response = await fetch(`${baseUrl}/${path}`, {
    method: "DELETE",
    headers: { authorization: `Bearer ${token}` },
  });
  if (response.status !== 404 && !response.ok) {
    throw new Error(`SMOKE_CLEANUP_FAILED_${response.status}`);
  }
}

try {
  // Validate the exact synthetic fixture schema before creating any records.
  const [test, profile] = await Promise.all([
    repository.loadPublishedTest(testId),
    repository.loadStudentProfile(uid),
  ]);
  assert(test?.isPublished === true, "Synthetic test is missing or not published");
  assert(profile?.id === uid, "Synthetic user profile ID must exactly match its Firebase UID");
  assert(Array.isArray(test.sections) && test.sections.length > 0,
    "Synthetic test must contain explicit sections and question IDs");
  const questionIds = test.sections.flatMap(section => section?.questionIds || []);
  assert(questionIds.length > 0 && questionIds.length <= 500,
    "Synthetic test must assign between 1 and 500 canonical questions");
  assert(questionIds.every(id => typeof id === "string" && id.startsWith("synthetic-")),
    "Every assigned question ID must use the synthetic- prefix");
  const questions = await repository.loadCanonicalQuestions(questionIds);
  const definition = buildTrustedTestDefinition({ test, questions });
  assert(definition.questionIds.length === questionIds.length,
    "Trusted test definition did not resolve all assigned questions");
  console.log("PASS: service-account OAuth and synthetic test/user/question reads");

  const fingerprint = `smoke-${runId}`;
  const attempt = {
    id: attemptId,
    userId: uid,
    testId,
    score: 0,
    correctCount: 0,
    incorrectCount: 0,
    unansweredCount: definition.questionIds.length,
    timeTakenSeconds: 0,
    responses: {},
    scoreBreakdown: { questionResults: [] },
    createdAt: new Date().toISOString(),
    smokeTest: true,
  };
  const args = { uid, testId, documentId: attemptId, fingerprint, attempt };
  const first = await repository.commitAttemptAtomically(args);
  assert(first.kind === "created", `Expected atomic create, received ${first.kind}`);
  const [storedAttempt, storedIdempotency] = await Promise.all([
    firestore.getDocument(attemptPath),
    firestore.getDocument(idempotencyPath),
  ]);
  assert(storedAttempt?.smokeTest === true, "Trusted attempt read-after-write verification failed");
  assert(storedIdempotency?.fingerprint === fingerprint, "Idempotency record read-after-write verification failed");
  console.log("PASS: atomic creation of trusted attempt and idempotency record");

  const replay = await repository.commitAttemptAtomically(args);
  assert(replay.kind === "replay" && replay.fingerprint === fingerprint,
    "Identical retry did not replay the original committed result");
  const conflict = await repository.commitAttemptAtomically({ ...args, fingerprint: `${fingerprint}-changed` });
  assert(conflict.kind === "conflict", "Changed payload did not return an idempotency conflict");
  console.log("PASS: exact retry replay and changed-payload conflict");
} finally {
  await Promise.all([deleteDocument(attemptPath), deleteDocument(idempotencyPath)]);
  console.log("PASS: synthetic smoke-test documents cleaned up");
}

console.log(`Trusted Firestore non-production smoke test passed for ${projectId}/${databaseId}.`);
