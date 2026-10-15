import type { PreviousYearPaper, Question } from '../types';
export function selectPypQuestionIds(paper: PreviousYearPaper, relevantQuestions: Question[], fallbackQuestions: Question[]): string[] { return (relevantQuestions.length > 0 ? relevantQuestions : fallbackQuestions).map(question => question.id); }
