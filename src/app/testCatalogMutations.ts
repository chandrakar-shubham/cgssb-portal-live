import type { MockTest } from '../types';

export function togglePublishedState(tests: MockTest[], testId: string): MockTest[] {
  const target = tests.find(test => test.id === testId);
  const nextStatus = target ? target.isPublished === false : false;
  return tests.map(test => test.id === testId ? { ...test, isPublished: nextStatus } : test);
}
export function updateTestById(tests: MockTest[], testId: string, updates: Partial<MockTest>): MockTest[] {
  return tests.map(test => test.id === testId ? { ...test, ...updates } : test);
}
