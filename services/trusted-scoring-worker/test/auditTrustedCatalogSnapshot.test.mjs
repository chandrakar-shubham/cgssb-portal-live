import test from "node:test";
import assert from "node:assert/strict";
import { auditTrustedCatalogSnapshot } from "../src/auditTrustedCatalogSnapshot.mjs";

const target = {
  expectedProjectId: "cgssb-audit-dev",
  expectedDatabaseId: "cgssb-audit-dev",
};

function makeSnapshot() {
  return {
    schemaVersion: 1,
    metadata: {
      projectId: target.expectedProjectId,
      databaseId: target.expectedDatabaseId,
      exportedAt: "2026-11-01T10:30:00.000Z",
    },
    tests: [{
      id: "synthetic-test-valid",
      title: "Synthetic valid test",
      isPublished: true,
      questionCount: 1,
      durationMinutes: 30,
      sections: [{ id: "section-1", questionIds: ["synthetic-question-valid"] }],
    }, {
      id: "synthetic-test-invalid",
      title: "Synthetic invalid test",
      isPublished: true,
      questionCount: 1,
      durationMinutes: 30,
      sections: [{ id: "section-2", questionIds: ["synthetic-question-structured"] }],
    }],
    questions: [{
      id: "synthetic-question-valid",
      type: "mcq",
      correctOption: "B",
      explanation: "PRIVATE ANSWER EXPLANATION",
    }, {
      id: "synthetic-question-structured",
      type: "matching",
      correctOption: "A",
      explanation: "PRIVATE STRUCTURED EXPLANATION",
    }],
  };
}

test("audits only a validated snapshot and returns a safe aggregate report", () => {
  const snapshot = makeSnapshot();
  const report = auditTrustedCatalogSnapshot({ snapshot, ...target });

  assert.deepEqual(report.metadata, {
    projectId: target.expectedProjectId,
    databaseId: target.expectedDatabaseId,
    exportedAt: "2026-11-01T10:30:00.000Z",
  });
  assert.equal(report.audit.totalTests, 2);
  assert.equal(report.audit.compatibleCount, 1);
  assert.equal(report.audit.incompatibleCount, 1);
  assert.deepEqual(report.audit.issueCodeCounts, { UNSUPPORTED_QUESTION_TYPE: 1 });
  assert.deepEqual(report.audit.results.map(item => item.testId), [
    "synthetic-test-valid",
    "synthetic-test-invalid",
  ]);

  const serialized = JSON.stringify(report);
  assert.equal(serialized.includes("PRIVATE ANSWER"), false);
  assert.equal(serialized.includes("correctOption"), false);
  assert.equal(serialized.includes("explanation"), false);
  assert.equal(Object.isFrozen(report), true);
  assert.equal(Object.isFrozen(report.metadata), true);
  assert.equal(Object.isFrozen(report.audit), true);
});

test("does not mutate or freeze the caller's snapshot", () => {
  const snapshot = makeSnapshot();
  const before = structuredClone(snapshot);

  auditTrustedCatalogSnapshot({ snapshot, ...target });

  assert.deepEqual(snapshot, before);
  assert.equal(Object.isFrozen(snapshot), false);
  assert.equal(Object.isFrozen(snapshot.tests), false);
  assert.equal(Object.isFrozen(snapshot.questions), false);
});

test("preserves fail-closed target confirmation before auditing", () => {
  const snapshot = makeSnapshot();
  assert.throws(
    () => auditTrustedCatalogSnapshot({ snapshot }),
    error => error.code === "MISSING_TARGET_CONFIRMATION",
  );
  assert.throws(
    () => auditTrustedCatalogSnapshot({
      snapshot,
      ...target,
      expectedDatabaseId: "production",
    }),
    error => error.code === "SNAPSHOT_TARGET_MISMATCH",
  );
});

test("rejects non-synthetic records before the compatibility audit", () => {
  const snapshot = makeSnapshot();
  snapshot.questions[0].id = "live-question-123";
  assert.throws(
    () => auditTrustedCatalogSnapshot({ snapshot, ...target }),
    error => error.code === "NON_SYNTHETIC_RECORD_ID",
  );
});
