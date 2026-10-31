import { scoreAttempt } from "./scoring.mjs";

/**
 * Score a validated trusted definition, never request-provided question data.
 * The definition must have been created by buildTrustedTestDefinition().
 */
export function scoreTrustedTestDefinition(definition, responses) {
  if (!definition || typeof definition !== "object" ||
      typeof definition.testId !== "string" ||
      !Array.isArray(definition.questions) ||
      definition.questions.length < 1 ||
      definition.questions.length > 500 ||
      !Array.isArray(definition.questionIds) ||
      definition.questions.length !== definition.questionIds.length ||
      !Number.isFinite(definition.defaultMarks) ||
      !Number.isFinite(definition.defaultNegativeMarks)) {
    throw new TypeError("validated trusted test definition is required");
  }

  const resolvedIds = definition.questions.map(question => question?.id);
  if (resolvedIds.some(id => typeof id !== "string") ||
      new Set(resolvedIds).size !== resolvedIds.length ||
      resolvedIds.some((id, index) => id !== definition.questionIds[index])) {
    throw new TypeError("trusted test definition question IDs do not match resolved records");
  }

  return scoreAttempt({
    questions: definition.questions,
    responses,
    defaultMarks: definition.defaultMarks,
    defaultNegativeMarks: definition.defaultNegativeMarks,
  });
}
