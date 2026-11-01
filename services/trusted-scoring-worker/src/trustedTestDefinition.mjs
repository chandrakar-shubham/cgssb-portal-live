const ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const SUPPORTED_SINGLE_ANSWER_TYPES = new Set([
  "", "single", "single-choice", "mcq", "multiple-choice",
]);

function cloneAndFreezeQuestion(question) {
  let clone;
  try {
    clone = structuredClone(question);
  } catch {
    throw trustedDefinitionError("INVALID_QUESTION_SNAPSHOT", "canonical questions must contain cloneable JSON data", TypeError);
  }

  const active = new WeakSet();
  function freezeRecursively(value) {
    if (!value || typeof value !== "object") return value;
    if (active.has(value)) {
      throw trustedDefinitionError("INVALID_QUESTION_SNAPSHOT", "canonical questions must not contain circular references", TypeError);
    }
    const prototype = Object.getPrototypeOf(value);
    if (!Array.isArray(value) && prototype !== Object.prototype && prototype !== null) {
      throw trustedDefinitionError("INVALID_QUESTION_SNAPSHOT", "canonical questions must contain only plain JSON objects and arrays", TypeError);
    }
    if (Object.getOwnPropertySymbols(value).length > 0) {
      throw trustedDefinitionError("INVALID_QUESTION_SNAPSHOT", "canonical questions must not contain symbol properties", TypeError);
    }

    active.add(value);
    for (const child of Object.values(value)) freezeRecursively(child);
    active.delete(value);
    return Object.freeze(value);
  }

  return freezeRecursively(clone);
}

function trustedDefinitionError(code, message, ErrorType = Error) {
  const error = new ErrorType(message);
  error.code = code;
  return error;
}

function finiteRange(value, name, { min = 0, max = 100 } = {}) {
  if (!Number.isFinite(value) || value < min || value > max) {
    const code = name === "marksPerQuestion" ? "INVALID_DEFAULT_MARKS"
      : name === "negativeMarksPerQuestion" ? "INVALID_DEFAULT_NEGATIVE_MARKS"
      : name === "durationMinutes" ? "INVALID_DURATION"
      : name === "question marks" ? "INVALID_QUESTION_MARKS"
      : name === "question negative marks" ? "INVALID_QUESTION_NEGATIVE_MARKS"
      : "INVALID_SCORING_VALUE";
    throw trustedDefinitionError(code, `invalid trusted test ${name}`, TypeError);
  }
  return value;
}

function validateScorableQuestion(question) {
  const type = String(question.questionType || question.type || "single").toLowerCase();
  if (!SUPPORTED_SINGLE_ANSWER_TYPES.has(type)) {
    throw trustedDefinitionError("UNSUPPORTED_QUESTION_TYPE", "TRUSTED_TEST_UNSUPPORTED_QUESTION_TYPE");
  }
  if (!["A", "B", "C", "D"].includes(question.correctOption)) {
    throw trustedDefinitionError("INVALID_CORRECT_OPTION", "TRUSTED_TEST_INVALID_CORRECT_OPTION");
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
    throw trustedDefinitionError("INVALID_TEST_DEFINITION", "trusted test is required", TypeError);
  }
  if (test.isPublished !== true) throw trustedDefinitionError("TEST_NOT_PUBLISHED", "TEST_NOT_PUBLISHED");
  if (typeof test.id !== "string" || !ID_PATTERN.test(test.id)) {
    throw trustedDefinitionError("INVALID_TEST_ID", "invalid trusted test id", TypeError);
  }
  if (!Array.isArray(test.sections) || test.sections.length === 0) {
    throw trustedDefinitionError("MISSING_EXPLICIT_SECTIONS", "published test must define explicit sections", TypeError);
  }
  if (!Array.isArray(questions)) throw trustedDefinitionError("INVALID_QUESTION_SNAPSHOT", "canonical questions must be an array", TypeError);

  const ids = [];
  for (const section of test.sections) {
    if (!section || !Array.isArray(section.questionIds)) {
      throw trustedDefinitionError("MISSING_EXPLICIT_QUESTION_IDS", "every test section must contain explicit questionIds", TypeError);
    }
    for (const id of section.questionIds) {
      if (typeof id !== "string" || !ID_PATTERN.test(id)) {
        throw trustedDefinitionError("INVALID_QUESTION_ID", "invalid question ID in trusted test definition", TypeError);
      }
      ids.push(id);
    }
  }

  if (ids.length === 0 || ids.length > 500) {
    throw trustedDefinitionError("QUESTION_COUNT_OUT_OF_RANGE", "trusted test must contain 1..500 explicitly assigned questions", TypeError);
  }
  if (new Set(ids).size !== ids.length) {
    throw trustedDefinitionError("DUPLICATE_QUESTION_IDS", "trusted test contains duplicate question IDs", TypeError);
  }
  if (!Number.isInteger(test.questionCount) || test.questionCount !== ids.length) {
    throw trustedDefinitionError("QUESTION_COUNT_MISMATCH", "questionCount does not match explicitly assigned questions", TypeError);
  }

  const byId = new Map();
  for (const question of questions) {
    if (!question || typeof question.id !== "string") continue;
    if (byId.has(question.id)) throw trustedDefinitionError("DUPLICATE_CANONICAL_QUESTION_IDS", "canonical question IDs are not unique", TypeError);
    byId.set(question.id, question);
  }

  const resolved = ids.map(id => {
    const question = byId.get(id);
    if (!question) throw trustedDefinitionError("QUESTION_MISSING", "TRUSTED_TEST_QUESTION_MISSING");
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
    questions: Object.freeze(resolved.map(cloneAndFreezeQuestion)),
  });
}


const KNOWN_ISSUE_CODES = new Set([
  "TEST_NOT_PUBLISHED",
  "QUESTION_MISSING",
  "UNSUPPORTED_QUESTION_TYPE",
  "INVALID_CORRECT_OPTION",
  "INVALID_QUESTION_MARKS",
  "INVALID_QUESTION_NEGATIVE_MARKS",
  "QUESTION_COUNT_MISMATCH",
  "DUPLICATE_QUESTION_IDS",
  "DUPLICATE_CANONICAL_QUESTION_IDS",
  "INVALID_DURATION",
  "INVALID_DEFAULT_MARKS",
  "INVALID_DEFAULT_NEGATIVE_MARKS",
  "MISSING_EXPLICIT_SECTIONS",
  "MISSING_EXPLICIT_QUESTION_IDS",
  "INVALID_QUESTION_ID",
  "QUESTION_COUNT_OUT_OF_RANGE",
  "INVALID_TEST_ID",
  "INVALID_TEST_DEFINITION",
  "INVALID_QUESTION_SNAPSHOT",
  "INVALID_SCORING_VALUE",
  "DUPLICATE_TEST_IDS",
]);

function catalogIssueCode(error) {
  return KNOWN_ISSUE_CODES.has(error?.code) ? error.code : "INVALID_TEST_DEFINITION";
}

/**
 * Read-only compatibility report for caller-supplied catalog snapshots.
 * The report intentionally contains no question text, answer keys, or explanations.
 */
export function auditTrustedTestCatalog({ tests, questions }) {
  if (!Array.isArray(tests) || !Array.isArray(questions)) {
    throw new TypeError("tests and canonical questions must be arrays");
  }

  const testIdCounts = new Map();
  for (const test of tests) {
    if (typeof test?.id !== "string") continue;
    testIdCounts.set(test.id, (testIdCounts.get(test.id) || 0) + 1);
  }

  const results = tests.map(test => {
    const testId = typeof test?.id === "string" ? test.id : null;
    const issueCodes = [];
    if (testId !== null && testIdCounts.get(testId) > 1) {
      issueCodes.push("DUPLICATE_TEST_IDS");
    }
    try {
      buildTrustedTestDefinition({ test, questions });
    } catch (error) {
      issueCodes.push(catalogIssueCode(error));
    }
    return {
      testId,
      compatible: issueCodes.length === 0,
      issueCodes,
    };
  });

  const compatibleCount = results.filter(item => item.compatible).length;
  const issueCodeCounts = Object.create(null);
  for (const result of results) {
    for (const code of result.issueCodes) {
      issueCodeCounts[code] = (issueCodeCounts[code] || 0) + 1;
    }
  }
  const frozenIssueCodeCounts = Object.freeze(
    Object.fromEntries(Object.entries(issueCodeCounts).sort(([a], [b]) => a.localeCompare(b))),
  );

  return Object.freeze({
    totalTests: results.length,
    compatibleCount,
    incompatibleCount: results.length - compatibleCount,
    issueCodeCounts: frozenIssueCodeCounts,
    results: Object.freeze(results.map(item => Object.freeze({
      ...item,
      issueCodes: Object.freeze([...item.issueCodes]),
    }))),
  });
}
