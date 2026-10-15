import type { MockTest, Question } from '../types';
import { migrateLegacyQuestion } from '../utils/taxonomyMigration';
import { fetchQuestionsByIdsFromFirestore, fetchQuestionsByProgramFromFirestore } from '../firebase/firestoreService';

export async function loadExamSessionQuestions(test: MockTest, fallbackQuestions: Question[], allowLocalFallback: boolean): Promise<Question[]> {
  const ids = Array.from(new Set((test.sections || []).flatMap(section =>
    Array.isArray(section.questionIds) ? section.questionIds.map(String) : []
  )));
  let result = ids.length ? (await fetchQuestionsByIdsFromFirestore(ids)).map(migrateLegacyQuestion) : [];
  if (result.length === 0 && test.programId) {
    result = (await fetchQuestionsByProgramFromFirestore(test.programId)).map(migrateLegacyQuestion);
  }
  if (result.length === 0 && allowLocalFallback) {
    const { resolveQuestionsForTest } = await import('./examQuestionSet');
    result = resolveQuestionsForTest(test, fallbackQuestions);
  }
  return result;
}
