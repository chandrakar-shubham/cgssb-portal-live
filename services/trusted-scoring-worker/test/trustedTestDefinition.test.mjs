import test from "node:test";
import assert from "node:assert/strict";
import { auditTrustedTestCatalog, buildTrustedTestDefinition } from "../src/trustedTestDefinition.mjs";

const questions = [
  { id: "q1", correctOption: "A", marks: 2 },
  { id: "q2", correctOption: "C", marks: 1 },
  { id: "unused", correctOption: "D" },
];
const definition = {
  id: "test-1",
  title: "Sample",
  isPublished: true,
  questionCount: 2,
  durationMinutes: 60,
  marksPerQuestion: 1,
  negativeMarksPerQuestion: 0.25,
  sections: [{ id: "section-1", questionIds: ["q1", "q2"] }],
};

test("resolves only explicitly assigned canonical questions", () => {
  const result = buildTrustedTestDefinition({ test: definition, questions });
  assert.equal(result.testId, "test-1");
  assert.deepEqual(result.questionIds, ["q1", "q2"]);
  assert.deepEqual(result.questions.map(q => q.id), ["q1", "q2"]);
  assert.equal(result.defaultNegativeMarks, 0.25);
});

test("rejects unpublished tests", () => {
  assert.throws(() => buildTrustedTestDefinition({ test: { ...definition, isPublished: false }, questions }), /TEST_NOT_PUBLISHED/);
});

test("rejects missing explicit question lists instead of falling back to all questions", () => {
  assert.throws(() => buildTrustedTestDefinition({
    test: { ...definition, sections: [{ id: "s1" }] }, questions,
  }), /explicit questionIds/);
});

test("rejects count mismatches and duplicate IDs", () => {
  assert.throws(() => buildTrustedTestDefinition({
    test: { ...definition, questionCount: 3 }, questions,
  }), /questionCount/);
  assert.throws(() => buildTrustedTestDefinition({
    test: { ...definition, sections: [{ id: "s1", questionIds: ["q1", "q1"] }] }, questions,
  }), /duplicate question IDs/);
});

test("rejects missing canonical questions and malformed scoring configuration", () => {
  assert.throws(() => buildTrustedTestDefinition({
    test: { ...definition, sections: [{ id: "s1", questionIds: ["q1", "q404"] }], questionCount: 2 }, questions,
  }), /TRUSTED_TEST_QUESTION_MISSING/);
  assert.throws(() => buildTrustedTestDefinition({
    test: { ...definition, durationMinutes: 0 }, questions,
  }), /durationMinutes/);
});

test("rejects duplicate canonical IDs", () => {
  assert.throws(() => buildTrustedTestDefinition({
    test: definition, questions: [...questions, { id: "q1", correctOption: "B" }],
  }), /canonical question IDs are not unique/);
});

test("rejects question types without an approved single-answer scoring contract", () => {
  for (const questionType of ["matching", "assertion_reason", "multi_statement", "essay"]) {
    assert.throws(() => buildTrustedTestDefinition({
      test: definition,
      questions: [{ id: "q1", questionType, correctOption: "A" }, questions[1]],
    }), /TRUSTED_TEST_UNSUPPORTED_QUESTION_TYPE/);
  }
});

test("rejects canonical questions with missing or invalid answer keys", () => {
  for (const correctOption of [undefined, null, "", "E", 1]) {
    assert.throws(() => buildTrustedTestDefinition({
      test: definition,
      questions: [{ id: "q1", correctOption }, questions[1]],
    }), /TRUSTED_TEST_INVALID_CORRECT_OPTION/);
  }
});

test("rejects malformed per-question scoring values before scoring", () => {
  for (const question of [
    { id: "q1", correctOption: "A", marks: -1 },
    { id: "q1", correctOption: "A", marks: 101 },
    { id: "q1", correctOption: "A", marks: "not-a-number" },
    { id: "q1", correctOption: "A", negativeMarks: -0.1 },
    { id: "q1", correctOption: "A", negativeMarks: 101 },
  ]) {
    assert.throws(() => buildTrustedTestDefinition({
      test: definition,
      questions: [question, questions[1]],
    }), /invalid trusted test question/);
  }
});

test("accepts the known single-answer type aliases used by the trusted scorer", () => {
  for (const questionType of ["single", "single-choice", "mcq", "multiple-choice"]) {
    const result = buildTrustedTestDefinition({
      test: { ...definition, sections: [{ id: "s1", questionIds: ["q1"] }], questionCount: 1 },
      questions: [{ id: "q1", type: questionType, correctOption: "B" }],
    });
    assert.deepEqual(result.questionIds, ["q1"]);
  }
});


test("catalog audit reports compatibility counts and safe issue codes without answer-key data", () => {
  const catalog = [
    definition,
    { ...definition, id: "test-unsupported", sections: [{ id: "s1", questionIds: ["q1"] }], questionCount: 1 },
    { ...definition, id: "test-missing", sections: [{ id: "s1", questionIds: ["q404"] }], questionCount: 1 },
    { ...definition, id: "test-count", questionCount: 99 },
  ];
  const report = auditTrustedTestCatalog({
    tests: catalog,
    questions: [
      ...questions,
      { id: "q1-structured", questionType: "matching", correctOption: "A", explanation: "secret explanation" },
    ],
  });

  assert.equal(report.totalTests, 4);
  assert.equal(report.compatibleCount, 1);
  assert.equal(report.incompatibleCount, 3);
  assert.deepEqual(report.results.map(item => item.issueCodes), [
    [],
    ["QUESTION_MISSING"],
    ["QUESTION_MISSING"],
    ["QUESTION_COUNT_MISMATCH"],
  ]);
  assert.equal(JSON.stringify(report).includes("secret explanation"), false);
  assert.equal(JSON.stringify(report).includes("correctOption"), false);
});

test("catalog audit rejects non-array snapshots instead of guessing", () => {
  assert.throws(() => auditTrustedTestCatalog({ tests: null, questions }), /must be arrays/);
});
