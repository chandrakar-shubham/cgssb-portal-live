import { MockTest } from '../types';

/**
 * Normalizes test titles by removing suffix variations such as
 * "(Official Mock Test)", "(Real Exam Simulation)", "(Official Question Paper)", etc.
 */
export function getBaseTestTitle(title: string): string {
  if (!title) return '';
  return title
    .replace(/\s*\((?:Official Mock Test|Real Exam Simulation|Official Question Paper|Official Simulation|Live Exam Simulation|Live Exam)\)/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Deduplicates and consolidates mock tests.
 * Resolves duplicate tests created by multiple conversions/bulk imports of the same exam paper.
 * Preserves the test with the most complete question bank and valid settings.
 */
export function deduplicateAndConsolidateTests(tests: MockTest[]): MockTest[] {
  const result: MockTest[] = [];
  const titleMap = new Map<string, MockTest>();
  const idMap = new Map<string, MockTest>();

  for (const test of tests) {
    if (!test || !test.id) continue;
    // Skip exact same ID
    if (idMap.has(test.id)) continue;

    const baseTitle = getBaseTestTitle(test.title).toLowerCase();
    const key = `${test.category}_${baseTitle}`;

    if (titleMap.has(key)) {
      const existing = titleMap.get(key)!;
      const existingQCount = (existing.sections?.reduce((sum, s) => sum + (s.questionIds?.length || 0), 0)) || existing.questionCount || 0;
      const currentQCount = (test.sections?.reduce((sum, s) => sum + (s.questionIds?.length || 0), 0)) || test.questionCount || 0;

      // Keep the one with more questions or better metadata
      if (currentQCount > existingQCount) {
        const merged: MockTest = {
          ...test,
          isPublished: test.isPublished !== false,
          attemptsCount: Math.max(existing.attemptsCount || 0, test.attemptsCount || 0),
        };
        titleMap.set(key, merged);
        const idx = result.findIndex(t => t.id === existing.id);
        if (idx !== -1) {
          result[idx] = merged;
        }
      } else {
        if (existing.isPublished === false && test.isPublished === true) {
          existing.isPublished = true;
        }
        existing.attemptsCount = Math.max(existing.attemptsCount || 0, test.attemptsCount || 0);
      }
    } else {
      idMap.set(test.id, test);
      titleMap.set(key, test);
      result.push({
        ...test,
        isPublished: test.isPublished !== undefined ? test.isPublished : true,
      });
    }
  }

  return result;
}
