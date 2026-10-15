import type { Question, TestAttempt } from '../types';
export function getQuestionsForAttemptReview(attempt: TestAttempt, catalog: Question[]): Question[] { const responseIds = new Set(Object.keys(attempt.responses)); const matching = catalog.filter(question => responseIds.has(question.id)); return matching.length > 0 ? matching : catalog; }
