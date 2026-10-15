import type { MockTest, PreviousYearPaper, Question } from '../types';
import { dedupeById } from './examQuestionSet';
import { migrateLegacyQuestion } from '../utils/taxonomyMigration';
export function upsertRestoredTest(tests: MockTest[], restored: MockTest): MockTest[] { return dedupeById([restored, ...tests]); }
export function applyPublishCascade(tests: MockTest[], affectedIds: string[], published: boolean): MockTest[] { const ids = new Set(affectedIds); return tests.map(test => ids.has(test.id) ? { ...test, isPublished: published } : test); }
export function replaceTestsFromGovernanceEvent(detail: unknown, current: MockTest[]): MockTest[] { return Array.isArray(detail) ? detail as MockTest[] : current; }
export function replaceQuestionsFromGovernanceEvent(detail: unknown, current: Question[]): Question[] { return Array.isArray(detail) ? (detail as Question[]).map(migrateLegacyQuestion) : current; }
export function replacePypFromGovernanceEvent(detail: unknown, current: PreviousYearPaper[]): PreviousYearPaper[] { return Array.isArray(detail) ? detail as PreviousYearPaper[] : current; }
