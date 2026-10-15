import type { Question } from '../types';
import { dedupeById } from './examQuestionSet';

export function mergeCompletedQuestions(existing: Question[], updatedQuestions: Question[]): Question[] {
  const updatedMap = new Map(updatedQuestions.map(question => [question.id, question]));
  const existingIds = new Set(existing.map(question => question.id));
  const newQuestions = updatedQuestions.filter(question => !existingIds.has(question.id));
  const merged = existing.map(question => updatedMap.has(question.id) ? updatedMap.get(question.id)! : question);
  return dedupeById([...newQuestions, ...merged]);
}
