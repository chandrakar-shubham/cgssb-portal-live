import test from "node:test";
import assert from "node:assert/strict";
import { scoreAttempt } from "../src/scoring.mjs";

/**
 * Compatibility oracle copied from the current legacy submitAttempt scoring
 * expressions in src/utils/apiClient.ts. This is intentionally an audit model,
 * not production code. Tests below pin known differences so they cannot be
 * mistaken for parity while the scoring contract is being decided.
 */
function legacyQuestionScore(question, answer) {
  const marks = Number(question.marks || 1);
  const penalty = Number(question.negativeMarks ?? ((question.marks || 1) / 3));
  const attempted = answer != null;
  const correct = attempted && answer === question.correctOption;
  const score = !attempted ? 0 : correct ? marks : -penalty;
  return {
    score: Math.max(0, Number(score.toFixed(2))),
    maxScore: marks,
    negativeMarksDeducted: attempted && !correct ? penalty : 0,
  };
}

test("AUDIT: missing question marks diverge when the trusted test default is not 1", () => {
  const question = { id: "q1", correctOption: "A" };
  const legacy = legacyQuestionScore(question, "A");
  const trusted = scoreAttempt({
    questions: [question],
    responses: { q1: "A" },
    defaultMarks: 2,
    defaultNegativeMarks: 0.5,
  });

  assert.deepEqual(
    { score: legacy.score, maxScore: legacy.maxScore },
    { score: 1, maxScore: 1 },
  );
  assert.deepEqual(
    { score: trusted.netScore, maxScore: trusted.maxScore },
    { score: 2, maxScore: 2 },
  );
  assert.notEqual(legacy.score, trusted.netScore);
});

test("AUDIT: missing negative marks diverge when the test default differs from one-third", () => {
  const question = { id: "q1", correctOption: "A", marks: 3 };
  const legacy = legacyQuestionScore(question, "B");
  const trusted = scoreAttempt({
    questions: [question],
    responses: { q1: "B" },
    defaultMarks: 3,
    defaultNegativeMarks: 0.5,
  });

  assert.equal(legacy.negativeMarksDeducted, 1);
  assert.equal(trusted.negDeduction, 0.5);
  assert.notEqual(legacy.negativeMarksDeducted, trusted.negDeduction);
});

test("AUDIT: explicit zero marks are treated as missing by legacy but preserved by trusted scorer", () => {
  const question = { id: "q1", correctOption: "A", marks: 0, negativeMarks: 0 };
  const legacy = legacyQuestionScore(question, "A");
  const trusted = scoreAttempt({
    questions: [question],
    responses: { q1: "A" },
    defaultMarks: 2,
    defaultNegativeMarks: 0.5,
  });

  assert.equal(legacy.score, 1);
  assert.equal(legacy.maxScore, 1);
  assert.equal(trusted.netScore, 0);
  assert.equal(trusted.maxScore, 0);
});

test("AUDIT: the approved scorer must still reject question types without a defined answer contract", () => {
  assert.throws(() => scoreAttempt({
    questions: [{ id: "match1", questionType: "matching", correctOption: "A" }],
    responses: { match1: "A" },
  }), /unsupported question type/);
});
