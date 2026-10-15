import type { Question, TestAttempt } from '../types';

export function resolveAttemptReviewQuestions(attempt: TestAttempt, questions: Question[]): Question[] {
  const attemptQuestions = questions.filter(question => Object.keys(attempt.responses).includes(question.id));
  return attemptQuestions.length > 0 ? attemptQuestions : questions;
}
