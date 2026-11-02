import type { Question } from '../types';
import type { StudentQuestion } from '../utils/studentQuestionProjection';

export type TrustedReviewQuestion = StudentQuestion & Partial<Pick<Question, 'correctOption' | 'explanation' | 'explanationHindi'>>;

export interface TrustedReviewQuestionResult {
  questionId: string;
  correctOption?: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  explanationHindi?: string;
}

export interface TrustedReviewPayload {
  canViewSolutions: boolean;
  attempt: {
    id: string;
    responses: Record<string, 'A' | 'B' | 'C' | 'D' | null>;
    scoreBreakdown?: { questionResults: TrustedReviewQuestionResult[] };
  };
}

const ANSWERS = new Set(['A', 'B', 'C', 'D', null]);

/** Join projection-only question content to correctness released by the trusted Worker. */
export function buildTrustedReviewQuestions(
  questions: readonly StudentQuestion[],
  review: TrustedReviewPayload,
  expectedAttemptId: string,
): TrustedReviewQuestion[] {
  if (!Array.isArray(questions) || questions.length === 0 || questions.length > 500) {
    throw new Error('Trusted review requires 1..500 student-safe questions.');
  }
  if (!review || typeof review !== 'object' || typeof review.canViewSolutions !== 'boolean' ||
      !review.attempt || typeof review.attempt.id !== 'string' ||
      typeof expectedAttemptId !== 'string' || review.attempt.id !== expectedAttemptId) {
    throw new Error('Trusted review payload is incomplete.');
  }
  const ids = questions.map(question => question?.id);
  if (ids.some(id => typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(id)) || new Set(ids).size !== ids.length) {
    throw new Error('Student review questions contain invalid or duplicate IDs.');
  }
  const responses = review.attempt.responses;
  if (!responses || typeof responses !== 'object' || Array.isArray(responses)) {
    throw new Error('Trusted review responses are missing.');
  }
  const responseIds = Object.keys(responses);
  if (responseIds.length !== ids.length || responseIds.some(id => !ids.includes(id)) ||
      ids.some(id => !Object.prototype.hasOwnProperty.call(responses, id)) ||
      responseIds.some(id => !ANSWERS.has(responses[id]))) {
    throw new Error('Trusted review responses do not match the assigned question set.');
  }
  if (!review.canViewSolutions) {
    if (review.attempt.scoreBreakdown !== undefined) {
      throw new Error('Unreleased trusted review must not contain solution data.');
    }
    return questions.map(question => ({ ...question }));
  }
  const results = review.attempt.scoreBreakdown?.questionResults;
  if (!Array.isArray(results) || results.length !== ids.length) {
    throw new Error('Released trusted review has an incomplete question breakdown.');
  }
  const byId = new Map<string, TrustedReviewQuestionResult>();
  for (const result of results) {
    if (!result || typeof result.questionId !== 'string' || byId.has(result.questionId) ||
        !ids.includes(result.questionId) || !['A', 'B', 'C', 'D'].includes(result.correctOption || '') ||
        (result.explanation !== undefined && typeof result.explanation !== 'string') ||
        (result.explanationHindi !== undefined && typeof result.explanationHindi !== 'string')) {
      throw new Error('Released trusted review contains an invalid question result.');
    }
    byId.set(result.questionId, result);
  }
  return questions.map(question => {
    const result = byId.get(question.id);
    if (!result) throw new Error('Released trusted review is missing a question result.');
    return {
      ...question,
      correctOption: result.correctOption,
      ...(result.explanation !== undefined ? { explanation: result.explanation } : {}),
      ...(result.explanationHindi !== undefined ? { explanationHindi: result.explanationHindi } : {}),
    };
  });
}
