import type { PreviousYearPaper } from '../types';

export function linkPypToTest(paper: PreviousYearPaper, testId: string): PreviousYearPaper {
  return { ...paper, linkedMockTestId: testId };
}
