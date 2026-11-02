import test from "node:test";
import assert from "node:assert/strict";
import { createTrustedAttemptRepository } from "../src/createTrustedAttemptRepository.mjs";

const validEnvironment = {
  FIREBASE_PROJECT_ID: "cgssb-isolated-test",
  FIRESTORE_DATABASE_ID: "cgssb-nonprod-test",
  GOOGLE_SERVICE_ACCOUNT_EMAIL: "trusted-worker@example.iam.gserviceaccount.com",
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: "not-imported-until-first-token-request",
};

test("refuses missing Worker bindings before constructing any infrastructure", () => {
  for (const environment of [
    {},
    { ...validEnvironment, FIREBASE_PROJECT_ID: "" },
    { ...validEnvironment, FIRESTORE_DATABASE_ID: undefined },
    { ...validEnvironment, GOOGLE_SERVICE_ACCOUNT_EMAIL: undefined },
    { ...validEnvironment, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: undefined },
  ]) {
    assert.throws(
      () => createTrustedAttemptRepository(environment, {
        fetchImpl: async () => { throw new Error("network must not be reached"); },
      }),
      /TRUSTED_FIRESTORE_CONFIGURATION_INCOMPLETE/,
    );
  }
});

test("refuses checked-in project and database placeholders", () => {
  for (const environment of [
    { ...validEnvironment, FIREBASE_PROJECT_ID: "REPLACE_WITH_NON_PRODUCTION_FIREBASE_PROJECT_ID" },
    { ...validEnvironment, FIRESTORE_DATABASE_ID: "REPLACE_WITH_NON_PRODUCTION_DATABASE_ID" },
  ]) {
    assert.throws(
      () => createTrustedAttemptRepository(environment),
      /TRUSTED_FIRESTORE_CONFIGURATION_INCOMPLETE/,
    );
  }
});

test("constructs the repository with explicit non-production bindings without network access", () => {
  const repository = createTrustedAttemptRepository(validEnvironment, {
    fetchImpl: async () => { throw new Error("network must not be reached during construction"); },
  });
  for (const method of [
    "findAttemptByIdempotencyKey",
    "loadPublishedTest",
    "loadCanonicalQuestions",
    "loadStudentProfile",
    "authorizeAttempt",
    "commitAttemptAtomically",
    "loadAttemptForReview",
  ]) {
    assert.equal(typeof repository[method], "function", `missing repository method: ${method}`);
  }
});
