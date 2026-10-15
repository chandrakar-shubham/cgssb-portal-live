import type { PreviousYearPaper, Question } from '../types';

export function selectPypQuestionIds(paper: PreviousYearPaper, relevantQuestions: Question[], fallbackQuestions: Question[]): string[] {
  const selected = relevantQuestions.length > 0 ? relevantQuestions : fallbackQuestions;
  return selected.map(question => question.id);
}
