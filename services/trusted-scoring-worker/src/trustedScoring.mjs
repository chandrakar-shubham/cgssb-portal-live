import { scoreAttempt } from "./scoring.mjs";

/**
 * Score a validated trusted definition, never request-provided question data.
 * The definition must have been created by buildTrustedTestDefinition().
 */
export function scoreTrustedTestDefinition(definition, responses) {
  if (!definition || typeof definition !== "object" ||
      typeof definition.testId !== "string" ||
      !Array.isArray(definition.questions) ||
      !Array.isArray(definition.questionIds) ||
      definition.questions.length !== definition.questionIds.length) {
    throw new TypeError("validated trusted test definition is required");
  }
  return scoreAttempt({
    questions: definition.questions,
    responses,
    defaultMarks: definition.defaultMarks,
    defaultNegativeMarks: definition.defaultNegativeMarks,
  });
}
