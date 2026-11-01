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
    { ...definition, id: "test-unsupported", sections: [{ id: "s1", questionIds: ["q1-structured"] }], questionCount: 1 },
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
    ["UNSUPPORTED_QUESTION_TYPE"],
    ["QUESTION_MISSING"],
    ["QUESTION_COUNT_MISMATCH"],
  ]);
  assert.equal(JSON.stringify(report).includes("secret explanation"), false);
  assert.equal(JSON.stringify(report).includes("correctOption"), false);
  assert.equal(Object.isFrozen(report), true);
  assert.equal(Object.isFrozen(report.results), true);
  assert.equal(Object.isFrozen(report.results[0]), true);
  assert.equal(Object.isFrozen(report.results[0].issueCodes), true);
  assert.throws(() => report.results[0].issueCodes.push("INJECTED"), TypeError);
});

test("catalog audit rejects non-array snapshots instead of guessing", () => {
  assert.throws(() => auditTrustedTestCatalog({ tests: null, questions }), /must be arrays/);
});

test("catalog audit rejects every occurrence of a duplicated test ID", () => {
  const duplicate = { ...definition, id: "same-test" };
  const report = auditTrustedTestCatalog({
    tests: [duplicate, { ...duplicate, title: "Second copy" }, definition],
    questions,
  });

  assert.equal(report.compatibleCount, 1);
  assert.equal(report.incompatibleCount, 2);
  assert.deepEqual(report.issueCodeCounts, { DUPLICATE_TEST_IDS: 2 });
  assert.equal(Object.isFrozen(report.issueCodeCounts), true);
  assert.deepEqual(report.results.map(item => item.issueCodes), [
    ["DUPLICATE_TEST_IDS"],
    ["DUPLICATE_TEST_IDS"],
    [],
  ]);
});

test("catalog audit maps validation failures to stable typed issue codes", () => {
  const cases = [
    [{ ...definition, isPublished: false }, questions, "TEST_NOT_PUBLISHED"],
    [{ ...definition, sections: [] }, questions, "MISSING_EXPLICIT_SECTIONS"],
    [{ ...definition, sections: [{ id: "s1" }] }, questions, "MISSING_EXPLICIT_QUESTION_IDS"],
    [{ ...definition, sections: [{ id: "s1", questionIds: ["bad id"] }] }, questions, "INVALID_QUESTION_ID"],
    [{ ...definition, sections: [{ id: "s1", questionIds: ["q1", "q1"] }], questionCount: 2 }, questions, "DUPLICATE_QUESTION_IDS"],
    [{ ...definition, durationMinutes: 0 }, questions, "INVALID_DURATION"],
    [{ ...definition, marksPerQuestion: 101 }, questions, "INVALID_DEFAULT_MARKS"],
    [{ ...definition, negativeMarksPerQuestion: 101 }, questions, "INVALID_DEFAULT_NEGATIVE_MARKS"],
    [definition, [...questions, { id: "q1", correctOption: "B" }], "DUPLICATE_CANONICAL_QUESTION_IDS"],
    [definition, [{ id: "q1", correctOption: "A", marks: 101 }, questions[1]], "INVALID_QUESTION_MARKS"],
    [definition, [{ id: "q1", correctOption: "A", negativeMarks: 101 }, questions[1]], "INVALID_QUESTION_NEGATIVE_MARKS"],
    [definition, [{ id: "q1", questionType: "matching", correctOption: "A" }, questions[1]], "UNSUPPORTED_QUESTION_TYPE"],
    [definition, [{ id: "q1", correctOption: "E" }, questions[1]], "INVALID_CORRECT_OPTION"],
  ];

  for (const [candidate, snapshot, expectedCode] of cases) {
    const report = auditTrustedTestCatalog({ tests: [candidate], questions: snapshot });
    assert.deepEqual(report.results[0].issueCodes, [expectedCode], expectedCode);
    assert.equal(report.results[0].compatible, false);
  }
});

test("catalog issue totals reconcile exactly with per-test issue codes", () => {
  const repeatedInvalid = { ...definition, id: "bad id" };
  const report = auditTrustedTestCatalog({
    tests: [
      repeatedInvalid,
      { ...repeatedInvalid, title: "Repeated invalid ID" },
      { ...definition, id: "unsupported", sections: [{ id: "s1", questionIds: ["q1"] }], questionCount: 1 },
      { ...definition, id: 42 },
    ],
    questions: [
      { id: "q1", questionType: "matching", correctOption: "A" },
      questions[1],
    ],
  });

  assert.deepEqual(report.issueCodeCounts, {
    DUPLICATE_TEST_IDS: 2,
    INVALID_TEST_ID: 4,
    UNSUPPORTED_QUESTION_TYPE: 1,
  });
  const reconciled = Object.fromEntries(
    report.results.flatMap(result => result.issueCodes).reduce((counts, code) => {
      counts.set(code, (counts.get(code) || 0) + 1);
      return counts;
    }, new Map()),
  );
  assert.deepEqual(reconciled, report.issueCodeCounts);
  assert.equal(report.incompatibleCount, report.totalTests);
});
