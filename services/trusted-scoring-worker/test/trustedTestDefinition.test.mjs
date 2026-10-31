import test from "node:test";
import assert from "node:assert/strict";
import { buildTrustedTestDefinition } from "../src/trustedTestDefinition.mjs";

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
