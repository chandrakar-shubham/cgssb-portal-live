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
    questionResults: [
      { questionId: "q1", subject: "General", status: "correct", marks: 2, negativeMarks: 0, score: 2, correctOption: "B" },
      { questionId: "q2", subject: "General", status: "incorrect", marks: 2, negativeMarks: 0.5, score: -0.5, correctOption: "A" },
      { questionId: "q3", subject: "General", status: "unattempted", marks: 1, negativeMarks: 0, score: 0, correctOption: "D" },
    ],
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

test("uses the current app's one-third default penalty when a question omits negative marks", () => {
  const result = scoreAttempt({
    questions: [{ id: "q", correctOption: "A", marks: 3 }],
    responses: { q: "B" },
  });
  assert.equal(result.negDeduction, 1);
  assert.equal(result.netScore, 0);
});

test("scores matching, assertion-reason, and multi-statement questions with one keyed option", () => {
  const structuredQuestions = [
    { id: "match-1", questionType: "matching", correctOption: "C", marks: 2, negativeMarks: 0.5 },
    { id: "assert-1", questionType: "assertion_reason", correctOption: "A", marks: 2, negativeMarks: 0.5 },
    { id: "statement-1", questionType: "multi_statement", correctOption: "D", marks: 2, negativeMarks: 0.5 },
  ];
  const result = scoreAttempt({
    questions: structuredQuestions,
    responses: { "match-1": "C", "assert-1": "B", "statement-1": "D" },
    supportedQuestionTypes: ["single", "single-choice", "mcq", "multiple-choice", "matching", "assertion_reason", "multi_statement", ""],
  });
  assert.equal(result.correctCount, 2);
  assert.equal(result.incorrectCount, 1);
  assert.equal(result.unattemptedCount, 0);
  assert.equal(result.netScore, 3.5);
  assert.deepEqual(result.questionResults.map(item => item.status), ["correct", "incorrect", "correct"]);
});
