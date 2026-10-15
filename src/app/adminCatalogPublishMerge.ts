import type { MockTest, Question } from '../types';
import { dedupeById } from './examQuestionSet';

export function mergePublishedQuestions(existing: Question[], incoming: Question[]): Question[] {
  return dedupeById([...incoming, ...existing]);
}
export function mergePublishedTests(existing: MockTest[], incoming: MockTest[]): MockTest[] {
  return dedupeById([...incoming, ...existing]);
}
