import test from "node:test";
import assert from "node:assert/strict";
import { validateTrustedCatalogSnapshot } from "../src/trustedCatalogSnapshot.mjs";

const validSnapshot = {
  schemaVersion: 1,
  metadata: {
    projectId: "cgssb-audit-dev",
    databaseId: "cgssb-audit-dev",
    exportedAt: "2026-11-01T10:30:00.000Z",
  },
  tests: [{ id: "synthetic-test-1" }],
  questions: [{ id: "synthetic-question-1", correctOption: "A" }],
};

const target = {
  expectedProjectId: "cgssb-audit-dev",
  expectedDatabaseId: "cgssb-audit-dev",
};

test("accepts a versioned snapshot matching the confirmed isolated target", () => {
  const result = validateTrustedCatalogSnapshot({ snapshot: validSnapshot, ...target });
  assert.equal(result.projectId, target.expectedProjectId);
  assert.equal(result.databaseId, target.expectedDatabaseId);
  assert.equal(result.tests.length, 1);
  assert.equal(result.questions.length, 1);
  assert.equal(Object.isFrozen(result), true);
});

test("requires an explicit operator-confirmed target", () => {
  assert.throws(
    () => validateTrustedCatalogSnapshot({ snapshot: validSnapshot }),
    error => error.code === "MISSING_TARGET_CONFIRMATION",
  );
});

test("rejects snapshot project or database metadata that differs from confirmation", () => {
  assert.throws(
    () => validateTrustedCatalogSnapshot({
      snapshot: { ...validSnapshot, metadata: { ...validSnapshot.metadata, projectId: "other-audit-dev" } },
      ...target,
    }),
    error => error.code === "SNAPSHOT_TARGET_MISMATCH",
  );
  assert.throws(
    () => validateTrustedCatalogSnapshot({
      snapshot: { ...validSnapshot, metadata: { ...validSnapshot.metadata, databaseId: "other-audit-dev" } },
      ...target,
    }),
    error => error.code === "SNAPSHOT_TARGET_MISMATCH",
  );
});

test("rejects production and unisolated project/database identifiers", () => {
  for (const projectId of ["gen-lang-client-0783153446", "cgssb-production", "cgssb-audit"]) {
    assert.throws(
      () => validateTrustedCatalogSnapshot({
        snapshot: { ...validSnapshot, metadata: { ...validSnapshot.metadata, projectId } },
        expectedProjectId: projectId,
        expectedDatabaseId: target.expectedDatabaseId,
      }),
      error => error.code === "PRODUCTION_OR_UNISOLATED_PROJECT",
    );
  }
  for (const databaseId of ["(default)", "production", "cgssb-live"]) {
    assert.throws(
      () => validateTrustedCatalogSnapshot({
        snapshot: { ...validSnapshot, metadata: { ...validSnapshot.metadata, databaseId } },
        expectedProjectId: target.expectedProjectId,
        expectedDatabaseId: databaseId,
      }),
      error => error.code === "PRODUCTION_OR_UNISOLATED_DATABASE",
    );
  }
});

test("rejects malformed version, timestamp, metadata, and record arrays", () => {
  const cases = [
    [{ ...validSnapshot, schemaVersion: 2 }, "UNSUPPORTED_SNAPSHOT_VERSION"],
    [{ ...validSnapshot, metadata: null }, "INVALID_SNAPSHOT_METADATA"],
    [{ ...validSnapshot, metadata: { ...validSnapshot.metadata, exportedAt: "yesterday" } }, "INVALID_EXPORT_TIMESTAMP"],
    [{ ...validSnapshot, metadata: { ...validSnapshot.metadata, exportedAt: "2026-02-30T10:30:00.000Z" } }, "INVALID_EXPORT_TIMESTAMP"],
    [{ ...validSnapshot, metadata: { ...validSnapshot.metadata, exportedAt: "2026-11-01T25:30:00Z" } }, "INVALID_EXPORT_TIMESTAMP"],
    [{ ...validSnapshot, tests: null }, "INVALID_SNAPSHOT_RECORDS"],
    [{ ...validSnapshot, questions: [null] }, "INVALID_SNAPSHOT_RECORD"],
    [{ ...validSnapshot, tests: [{ id: "copied-production-test" }] }, "NON_SYNTHETIC_RECORD_ID"],
    [{ ...validSnapshot, questions: [{ id: "copied-production-question" }] }, "NON_SYNTHETIC_RECORD_ID"],
    [null, "INVALID_SNAPSHOT"],
  ];
  for (const [snapshot, code] of cases) {
    assert.throws(
      () => validateTrustedCatalogSnapshot({ snapshot, ...target }),
      error => error.code === code,
      code,
    );
  }
});

test("bounds snapshot sizes and synthetic record identifier lengths", () => {
  const tooManyTests = { ...validSnapshot, tests: Array.from({ length: 5001 }, (_, i) => ({ id: `synthetic-test-${i}` })) };
  assert.throws(
    () => validateTrustedCatalogSnapshot({ snapshot: tooManyTests, ...target }),
    error => error.code === "SNAPSHOT_RECORD_LIMIT_EXCEEDED",
  );

  const tooManyQuestions = { ...validSnapshot, questions: Array.from({ length: 25001 }, (_, i) => ({ id: `synthetic-question-${i}` })) };
  assert.throws(
    () => validateTrustedCatalogSnapshot({ snapshot: tooManyQuestions, ...target }),
    error => error.code === "SNAPSHOT_RECORD_LIMIT_EXCEEDED",
  );

  const oversizedId = { ...validSnapshot, tests: [{ id: `synthetic-${"x".repeat(130)}` }] };
  assert.throws(
    () => validateTrustedCatalogSnapshot({ snapshot: oversizedId, ...target }),
    error => error.code === "NON_SYNTHETIC_RECORD_ID",
  );
});

test("rejects duplicate test IDs and duplicate question IDs", () => {
  const duplicateTests = {
    ...validSnapshot,
    tests: [{ id: "synthetic-test-duplicate" }, { id: "synthetic-test-duplicate" }],
  };
  assert.throws(
    () => validateTrustedCatalogSnapshot({ snapshot: duplicateTests, ...target }),
    error => error.code === "DUPLICATE_SNAPSHOT_RECORD_ID",
  );

  const duplicateQuestions = {
    ...validSnapshot,
    questions: [{ id: "synthetic-question-duplicate" }, { id: "synthetic-question-duplicate" }],
  };
  assert.throws(
    () => validateTrustedCatalogSnapshot({ snapshot: duplicateQuestions, ...target }),
    error => error.code === "DUPLICATE_SNAPSHOT_RECORD_ID",
  );
});


test("returns detached, deeply immutable test and question records", () => {
  const snapshot = {
    ...validSnapshot,
    tests: [{
      id: "synthetic-test-nested",
      sections: [{ id: "section-1", questionIds: ["synthetic-question-nested"] }],
    }],
    questions: [{
      id: "synthetic-question-nested",
      options: [{ id: "A", text: "Synthetic option" }],
    }],
  };

  const result = validateTrustedCatalogSnapshot({ snapshot, ...target });

  assert.notEqual(result.tests, snapshot.tests);
  assert.notEqual(result.tests[0], snapshot.tests[0]);
  assert.equal(Object.isFrozen(result.tests), true);
  assert.equal(Object.isFrozen(result.tests[0]), true);
  assert.equal(Object.isFrozen(result.tests[0].sections), true);
  assert.equal(Object.isFrozen(result.tests[0].sections[0]), true);
  assert.equal(Object.isFrozen(result.tests[0].sections[0].questionIds), true);
  assert.equal(Object.isFrozen(result.questions[0].options[0]), true);

  snapshot.tests[0].sections[0].questionIds[0] = "synthetic-question-mutated";
  snapshot.questions[0].options[0].text = "Mutated by caller";
  assert.equal(result.tests[0].sections[0].questionIds[0], "synthetic-question-nested");
  assert.equal(result.questions[0].options[0].text, "Synthetic option");
});
