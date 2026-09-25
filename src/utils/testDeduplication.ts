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
  const normalizedTitleMap = new Map<string, MockTest>();

  for (const test of tests) {
    if (!test || !test.id) continue;

    // 1. Check exact same ID
    if (idMap.has(test.id)) {
      const existing = idMap.get(test.id)!;
      if (existing.isPublished === false && test.isPublished !== false) {
        existing.isPublished = true;
      }
      continue;
    }

    // 2. Check normalized title duplicate (prevent double entry from multiple imports)
    const normTitle = test.title
      .toLowerCase()
      .replace(/\s*\((?:official mock test|real exam simulation|official question paper|official simulation|live exam simulation|live exam)\)/gi, '')
      .replace(/[\(\)\[\]\-_\:\.]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (normTitle && normalizedTitleMap.has(normTitle)) {
      const existing = normalizedTitleMap.get(normTitle)!;
      // If the incoming version has more questions or sections, replace the existing one
      const existingQCount = existing.sections?.reduce((sum, s) => sum + (s.questionIds?.length || 0), 0) || existing.questionCount || 0;
      const incomingQCount = test.sections?.reduce((sum, s) => sum + (s.questionIds?.length || 0), 0) || test.questionCount || 0;

      if (incomingQCount > existingQCount) {
        const idx = result.findIndex(t => t.id === existing.id);
        if (idx !== -1) {
          result[idx] = {
            ...test,
            isPublished: test.isPublished !== undefined ? test.isPublished : true,
          };
          idMap.delete(existing.id);
          idMap.set(test.id, test);
          normalizedTitleMap.set(normTitle, test);
        }
      }
      continue;
    }

    idMap.set(test.id, test);
    if (normTitle) {
      normalizedTitleMap.set(normTitle, test);
    }
    result.push({
      ...test,
      isPublished: test.isPublished !== undefined ? test.isPublished : true,
    });
  }

  return result;
}
