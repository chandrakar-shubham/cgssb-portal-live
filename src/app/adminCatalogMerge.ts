import type { MockTest, Question } from '../types';
import { dedupeById } from './examQuestionSet';
export function prependQuestionCatalog(existing: Question[], incoming: Question[]): Question[] { return dedupeById([...incoming, ...existing]); }
export function prependTestCatalog(existing: MockTest[], incoming: MockTest[]): MockTest[] { return dedupeById([...incoming, ...existing]); }
