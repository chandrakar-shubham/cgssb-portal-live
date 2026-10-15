import type { MockTest, PreviousYearPaper } from '../types';
export function findLinkedPypTest(paper: PreviousYearPaper, tests: MockTest[]): MockTest | undefined { return tests.find(test => test.id === paper.linkedMockTestId); }
