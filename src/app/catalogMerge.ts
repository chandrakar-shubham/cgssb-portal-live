import type { MockTest, Question } from '../types';
import { dedupeById } from './examQuestionSet';

export function mergeQuestions(existing: Question[], incoming: Question[]): Question[] {
  return dedupeById([...incoming, ...existing]);
}
export function mergeTests(existing: MockTest[], incoming: MockTest[]): MockTest[] {
  return dedupeById([...incoming, ...existing]);
}
