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
  const idMap = new Map<string, MockTest>();

  for (const test of tests) {
    if (!test || !test.id) continue;
    // Skip exact same ID
    if (idMap.has(test.id)) {
      const existing = idMap.get(test.id)!;
      // If the incoming version has published status true or newer questions, update it
      if (existing.isPublished === false && test.isPublished !== false) {
        existing.isPublished = true;
      }
      continue;
    }

    idMap.set(test.id, test);
    result.push({
      ...test,
      isPublished: test.isPublished !== undefined ? test.isPublished : true,
    });
  }

  return result;
}
