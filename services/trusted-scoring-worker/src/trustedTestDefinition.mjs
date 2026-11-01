const ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const SUPPORTED_SINGLE_ANSWER_TYPES = new Set([
  "", "single", "single-choice", "mcq", "multiple-choice",
]);

function finiteRange(value, name, { min = 0, max = 100 } = {}) {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new TypeError(`invalid trusted test ${name}`);
  }
  return value;
}

function validateScorableQuestion(question) {
  const type = String(question.questionType || question.type || "single").toLowerCase();
  if (!SUPPORTED_SINGLE_ANSWER_TYPES.has(type)) {
    throw new Error("TRUSTED_TEST_UNSUPPORTED_QUESTION_TYPE");
  }
  if (!["A", "B", "C", "D"].includes(question.correctOption)) {
    throw new Error("TRUSTED_TEST_INVALID_CORRECT_OPTION");
  }
  if (question.marks != null) {
    finiteRange(Number(question.marks), "question marks");
  }
  if (question.negativeMarks != null) {
    finiteRange(Number(question.negativeMarks), "question negative marks");
  }
}

/**
 * Resolve a published test's explicit question IDs against canonical questions.
 * No broad category/exam fallback is permitted in trusted scoring: the test
 * must enumerate exactly the questions it intends to score.
 */
export function buildTrustedTestDefinition({ test, questions }) {
  if (!test || typeof test !== "object" || Array.isArray(test)) {
    throw new TypeError("trusted test is required");
  }
  if (test.isPublished !== true) throw new Error("TEST_NOT_PUBLISHED");
  if (typeof test.id !== "string" || !ID_PATTERN.test(test.id)) {
    throw new TypeError("invalid trusted test id");
  }
  if (!Array.isArray(test.sections) || test.sections.length === 0) {
    throw new TypeError("published test must define explicit sections");
  }
  if (!Array.isArray(questions)) throw new TypeError("canonical questions must be an array");

  const ids = [];
  for (const section of test.sections) {
    if (!section || !Array.isArray(section.questionIds)) {
      throw new TypeError("every test section must contain explicit questionIds");
    }
    for (const id of section.questionIds) {
      if (typeof id !== "string" || !ID_PATTERN.test(id)) {
        throw new TypeError("invalid question ID in trusted test definition");
      }
      ids.push(id);
    }
  }

  if (ids.length === 0 || ids.length > 500) {
    throw new TypeError("trusted test must contain 1..500 explicitly assigned questions");
  }
  if (new Set(ids).size !== ids.length) {
    throw new TypeError("trusted test contains duplicate question IDs");
  }
  if (!Number.isInteger(test.questionCount) || test.questionCount !== ids.length) {
    throw new TypeError("questionCount does not match explicitly assigned questions");
  }

  const byId = new Map();
  for (const question of questions) {
    if (!question || typeof question.id !== "string") continue;
    if (byId.has(question.id)) throw new TypeError("canonical question IDs are not unique");
    byId.set(question.id, question);
  }

  const resolved = ids.map(id => {
    const question = byId.get(id);
    if (!question) throw new Error("TRUSTED_TEST_QUESTION_MISSING");
    validateScorableQuestion(question);
    return question;
  });

  const defaultMarks = finiteRange(Number(test.marksPerQuestion ?? 1), "marksPerQuestion");
  const defaultNegativeMarks = finiteRange(
    Number(test.negativeMarksPerQuestion ?? (defaultMarks / 3)),
    "negativeMarksPerQuestion",
  );
  const durationMinutes = finiteRange(Number(test.durationMinutes), "durationMinutes", { min: 1, max: 24 * 60 });

  return Object.freeze({
    testId: test.id,
    title: typeof test.title === "string" ? test.title : "",
    durationMinutes,
    defaultMarks,
    defaultNegativeMarks,
    questionIds: Object.freeze([...ids]),
    questions: Object.freeze(resolved.map(question => Object.freeze({ ...question }))),
  });
}
