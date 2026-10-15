import type { Question } from '../types';

export function updateQuestionById(questions: Question[], id: string, updates: Partial<Question>): Question[] {
  return questions.map(question => question.id === id ? { ...question, ...updates } : question);
}
export function removeQuestionById(questions: Question[], id: string): Question[] {
  return questions.filter(question => question.id !== id);
}
