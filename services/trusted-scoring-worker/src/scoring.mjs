const VALID_SINGLE_OPTIONS = new Set(["A", "B", "C", "D"]);

/**
 * Pure authoritative-scoring primitive.
 *
 * Inputs must be loaded from trusted server-side records, never copied from
 * request-provided question objects. This intentionally supports only the
 * currently verified single-choice contract; unknown question types fail closed.
 */
export function scoreAttempt({ questions, responses, defaultMarks = 1, defaultNegativeMarks = 0 }) {
  if (!Array.isArray(questions) || questions.length === 0 || questions.length > 500) {
    throw new TypeError("questions must contain 1..500 trusted questions");
  }
  if (!responses || typeof responses !== "object" || Array.isArray(responses)) {
    throw new TypeError("responses must be an object");
  }
  if (!Number.isFinite(defaultMarks) || defaultMarks < 0 || defaultMarks > 100) {
    throw new TypeError("invalid default marks");
  }
  if (!Number.isFinite(defaultNegativeMarks) || defaultNegativeMarks < 0 || defaultNegativeMarks > 100) {
    throw new TypeError("invalid default negative marks");
  }

  const questionIds = new Set();
  const allowedResponseIds = new Set(questions.map(question => question?.id));
  if (allowedResponseIds.has(undefined) || allowedResponseIds.has(null)) {
    throw new TypeError("trusted question is missing an ID");
  }
  if (allowedResponseIds.size !== questions.length) {
    throw new TypeError("trusted test contains duplicate question IDs");
  }

  const responseEntries = Object.entries(responses);
  if (responseEntries.length > questions.length) {
    throw new TypeError("too many response entries");
  }
  for (const [questionId, answer] of responseEntries) {
    if (!allowedResponseIds.has(questionId)) throw new TypeError("response contains a question outside the test");
    if (answer !== null && answer !== undefined && !VALID_SINGLE_OPTIONS.has(answer)) {
      throw new TypeError("unsupported answer representation");
    }
  }

  let correctCount = 0;
  let incorrectCount = 0;
  let unattemptedCount = 0;
  let rawScore = 0;
  let negDeduction = 0;
  let maxScore = 0;

  for (const question of questions) {
    if (questionIds.has(question.id)) throw new TypeError("duplicate question ID");
    questionIds.add(question.id);

    const type = String(question.questionType || question.type || "single").toLowerCase();
    if (!["single", "single-choice", "mcq", "multiple-choice", ""].includes(type)) {
      throw new TypeError("unsupported question type requires an explicit scoring policy");
    }
    if (!VALID_SINGLE_OPTIONS.has(question.correctOption)) {
      throw new TypeError("trusted single-choice question has no valid correct option");
    }

    const marks = question.marks == null ? defaultMarks : Number(question.marks);
    const negativeMarks = question.negativeMarks == null ? defaultNegativeMarks : Number(question.negativeMarks);
    if (!Number.isFinite(marks) || marks < 0 || marks > 100 ||
        !Number.isFinite(negativeMarks) || negativeMarks < 0 || negativeMarks > 100) {
      throw new TypeError("invalid trusted scoring values");
    }

    maxScore += marks;
    const answer = responses[question.id];
    if (answer == null) {
      unattemptedCount += 1;
    } else if (answer === question.correctOption) {
      correctCount += 1;
      rawScore += marks;
    } else {
      incorrectCount += 1;
      negDeduction += negativeMarks;
    }
  }

  const round2 = value => Number(value.toFixed(2));
  const netScore = round2(Math.max(0, rawScore - negDeduction));
  const attemptedCount = correctCount + incorrectCount;
  return {
    correctCount,
    incorrectCount,
    unattemptedCount,
    attemptedCount,
    rawScore: round2(rawScore),
    negDeduction: round2(negDeduction),
    netScore,
    maxScore: round2(maxScore),
    percentage: maxScore > 0 ? round2((netScore / maxScore) * 100) : 0,
    accuracy: attemptedCount > 0 ? round2((correctCount / attemptedCount) * 100) : 0,
  };
}
