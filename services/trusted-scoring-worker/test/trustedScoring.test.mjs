import test from "node:test";
import assert from "node:assert/strict";
import { buildTrustedTestDefinition } from "../src/trustedTestDefinition.mjs";
import { scoreTrustedTestDefinition } from "../src/trustedScoring.mjs";

const trustedDefinition = buildTrustedTestDefinition({
  test: {
    id: "sample-test",
    title: "Sample",
    isPublished: true,
    questionCount: 3,
    durationMinutes: 90,
    marksPerQuestion: 2,
    negativeMarksPerQuestion: 0.5,
    sections: [{ id: "s1", questionIds: ["q1", "q2", "q3"] }],
  },
  questions: [
    { id: "q1", correctOption: "A" },
    { id: "q2", correctOption: "B", marks: 3, negativeMarks: 1 },
    { id: "q3", correctOption: "D" },
    { id: "not-in-test", correctOption: "C" },
  ],
});

test("scores only resolved trusted questions using per-question overrides and test defaults", () => {
  const result = scoreTrustedTestDefinition(trustedDefinition, {
    q1: "A",
    q2: "C",
    q3: null,
  });
  assert.equal(result.correctCount, 1);
  assert.equal(result.incorrectCount, 1);
  assert.equal(result.unattemptedCount, 1);
  assert.equal(result.rawScore, 2);
  assert.equal(result.negDeduction, 1);
  assert.equal(result.netScore, 1);
  assert.equal(result.maxScore, 7);
});

test("rejects a response for a question not assigned to the test", () => {
  assert.throws(() => scoreTrustedTestDefinition(trustedDefinition, {
    q1: "A",
    "not-in-test": "C",
  }), /outside the test/);
});

test("rejects arbitrary objects instead of a trusted definition", () => {
  assert.throws(() => scoreTrustedTestDefinition({ testId: "x", questions: [], questionIds: [] }, {}), /validated trusted test definition/);
});
