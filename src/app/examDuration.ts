import type { MockTest } from '../types';
export function getExamDurationSeconds(test: Pick<MockTest, 'durationMinutes'>): number { return (test.durationMinutes || 90) * 60; }
