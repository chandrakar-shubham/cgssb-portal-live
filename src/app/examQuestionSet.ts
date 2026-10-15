import type { MockTest, Question } from '../types';

/**
 * Pure exam-catalog helpers. Keep these independent from React and persistence
 * so exam question selection can be verified without mounting the application.
 */
export function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    if (item && item.id && !seen.has(item.id)) {
      seen.add(item.id);
      result.push(item);
    }
  }
  return result;
}

/**
 * Resolve the full question set for a test. Section IDs are preferred; legacy
 * tests with incomplete IDs are completed from matching exam/category questions.
 * A stale questionCount never truncates a valid section-defined paper.
 */
export function resolveQuestionsForTest(test: MockTest, source: Question[]): Question[] {
  const expected = Math.max(0, Number(test.questionCount || 0));
  const ids = Array.isArray(test.sections)
    ? test.sections.flatMap(section => Array.isArray(section.questionIds) ? section.questionIds : [])
    : [];

  const selectedIds = new Set<string>();
  const selected: Question[] = [];
  const add = (q: Question) => {
    if (q?.id && !selectedIds.has(q.id)) {
      selectedIds.add(q.id);
      selected.push(q);
    }
  };

  ids.forEach(id => {
    const q = source.find(item => item.id === id);
    if (q) add(q);
  });

  if (expected > selected.length) {
    const examName = String(test.examName || '').trim().toLowerCase();
    const authority = String(test.authority || '').trim().toLowerCase();
    const category = String(test.category || '').trim().toLowerCase();

    const exactExam = examName
      ? source.filter(q => String(q.examName || '').trim().toLowerCase() === examName)
      : [];
    exactExam.forEach(add);

    if (expected > selected.length) {
      source
        .filter(q => {
          if (selectedIds.has(q.id)) return false;
          const qAuthority = String(q.authority || '').trim().toLowerCase();
          const qCategory = String(q.category || '').trim().toLowerCase();
          return (authority && qAuthority === authority) || (category && qCategory === category);
        })
        .forEach(add);
    }
  }

  if (expected > selected.length) {
    source.forEach(add);
  }

  return selected;
}

export function buildExamTest(test: MockTest, examQuestions: Question[]): MockTest {
  const actualCount = examQuestions.length;
  const existingIds = new Set(
    (test.sections || []).flatMap(section => section.questionIds || [])
  );
  const missingIds = examQuestions
    .map(q => q.id)
    .filter(id => !existingIds.has(id));

  if (missingIds.length === 0) {
    return { ...test, questionCount: actualCount };
  }

  return {
    ...test,
    questionCount: actualCount,
    sections: [
      ...(test.sections || []),
      {
        id: 'sec-' + test.id + '-additional',
        name: 'Additional Questions',
        questionIds: missingIds,
      },
    ],
  };
}
