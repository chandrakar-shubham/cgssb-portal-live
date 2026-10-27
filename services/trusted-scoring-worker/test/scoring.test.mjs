import test from "node:test";
import assert from "node:assert/strict";
import { scoreAttempt } from "../src/scoring.mjs";

const questions = [
  { id: "q1", questionType: "single", correctOption: "B", marks: 2, negativeMarks: 0.5 },
  { id: "q2", questionType: "mcq", correctOption: "A", marks: 2, negativeMarks: 0.5 },
  { id: "q3", questionType: "single-choice", correctOption: "D", marks: 1, negativeMarks: 0.25 },
];

test("scores correct, incorrect, and unattempted answers from trusted question records", () => {
  const result = scoreAttempt({
    questions,
    responses: { q1: "B", q2: "C", q3: null },
  });
  assert.deepEqual(result, {
    correctCount: 1,
    incorrectCount: 1,
    unattemptedCount: 1,
    attemptedCount: 2,
    rawScore: 2,
    negDeduction: 0.5,
    netScore: 1.5,
    maxScore: 5,
    percentage: 30,
    accuracy: 50,
  });
});

test("score is floored at zero and rounds to two decimal places", () => {
  const result = scoreAttempt({
    questions: [
      { id: "a", correctOption: "A", marks: 1, negativeMarks: 2 },
      { id: "b", correctOption: "B", marks: 1, negativeMarks: 2 },
    ],
    responses: { a: "C", b: "D" },
  });
  assert.equal(result.netScore, 0);
  assert.equal(result.percentage, 0);
  assert.equal(result.negDeduction, 4);
});

test("rejects response IDs outside the trusted test", () => {
  assert.throws(() => scoreAttempt({
    questions,
    responses: { injected: "A" },
  }), /outside the test/);
});

test("rejects unsupported question types instead of guessing their grading rules", () => {
  assert.throws(() => scoreAttempt({
    questions: [{ id: "q", questionType: "multiple-correct", correctOption: "A" }],
    responses: { q: "A" },
  }), /unsupported question type/);
});

test("rejects malformed response values", () => {
  assert.throws(() => scoreAttempt({
    questions,
    responses: { q1: ["A", "B"] },
  }), /unsupported answer representation/);
});

test("rejects duplicate question IDs in trusted test data", () => {
  assert.throws(() => scoreAttempt({
    questions: [
      { id: "q", correctOption: "A" },
      { id: "q", correctOption: "B" },
    ],
    responses: {},
  }), /duplicate question IDs/);
});

test("rejects missing answer keys in trusted records", () => {
  assert.throws(() => scoreAttempt({
    questions: [{ id: "q", questionType: "single" }],
    responses: { q: "A" },
  }), /no valid correct option/);
});
