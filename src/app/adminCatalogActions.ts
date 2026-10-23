import type { Dispatch, SetStateAction } from 'react';
import type { MockTest, PreviousYearPaper, Question } from '../types';
import { createQuestion } from './questionFactory';
import { createPypPaper } from './pypFactory';
import { createMockTest } from './mockTestFactory';
import { createTestFromPyp } from './pypTestFactory';
import { updateQuestionById, removeQuestionById } from './questionCatalogMutations';
import { togglePublishedState, updateTestById } from './testCatalogMutations';
import { mergeCompletedQuestions } from './completedQuestionMerge';
import { linkPypToTest } from './pypLinkedTestUpdate';
import { mergePublishedQuestions, mergePublishedTests } from './adminCatalogPublishMerge';
import { getPypDeleteStorageKey, getPypStorageKey } from './pypMetadata';
import { addDeletedId, removeDeletedId } from '../utils/localDeletionStore';
import { mergeQuestions, mergeTests } from './catalogMerge';
import { dedupeById } from './examQuestionSet';
import {
  saveTestToFirestore,
  saveQuestionsToFirestore,
  deleteQuestionFromFirestore,
  deleteTestFromFirestore,
  savePypPaperToFirestore,
  deletePypPaperFromFirestore,
} from '../firebase/firestoreService';
import { cleanTestFromAllBundles } from '../utils/bundleStore';

type StateSetter<T> = Dispatch<SetStateAction<T>>;

export interface AdminCatalogActionDependencies {
  questions: Question[];
  pypPapers: PreviousYearPaper[];
  tests: MockTest[];
  setQuestions: StateSetter<Question[]>;
  setPypPapers: StateSetter<PreviousYearPaper[]>;
  setTests: StateSetter<MockTest[]>;
}

/**
 * Keep admin catalog event handlers out of App.tsx. The factory is deliberately
 * created per render so snapshot-based actions receive the latest catalog state.
 * Existing persistence semantics are retained in this extraction.
 */
export function createAdminCatalogActions(deps: AdminCatalogActionDependencies) {
  const { questions, pypPapers, tests, setQuestions, setPypPapers, setTests } = deps;

  const handleAddQuestion = (qData: Partial<Question>) => {
    const newQ = createQuestion(qData);
    removeDeletedId('cgssb_deleted_questions', newQ.id);
    setQuestions(prev => [newQ, ...prev]);
    saveQuestionsToFirestore([newQ]).catch(() => null);
  };

  const handleUpdateQuestion = (id: string, qData: Partial<Question>) => {
    setQuestions(prev => {
      const updated = updateQuestionById(prev, id, qData);
      const target = updated.find(q => q.id === id);
      if (target) saveQuestionsToFirestore([target]).catch(() => null);
      return updated;
    });
  };

  const handleDeleteQuestion = (id: string) => {
    addDeletedId('cgssb_deleted_questions', id);
    const updated = removeQuestionById(questions, id);
    setQuestions(updated);
    try {
      localStorage.setItem('cgssb_questions', JSON.stringify(updated));
    } catch {}
    deleteQuestionFromFirestore(id).catch(() => null);
  };

  const handleAddPYP = (pypData: Partial<PreviousYearPaper>) => {
    const newPaper = createPypPaper(pypData);
    removeDeletedId('cgssb_deleted_pyp', newPaper.id);
    setPypPapers(prev => dedupeById([newPaper, ...prev]));
    savePypPaperToFirestore(newPaper).catch(() => null);
  };

  const handleDeletePYP = (id: string) => {
    addDeletedId(getPypDeleteStorageKey(), id);
    const updated = pypPapers.filter(p => p.id !== id);
    setPypPapers(updated);
    try {
      localStorage.setItem(getPypStorageKey(), JSON.stringify(updated));
    } catch {}
    deletePypPaperFromFirestore(id).catch(() => null);
  };

  const handleConvertPYPToMockTest = (pyp: PreviousYearPaper) => {
    const newTest = createTestFromPyp(pyp, questions);
    removeDeletedId('cgssb_deleted_tests', newTest.id);
    setTests(prev => mergePublishedTests(prev, [newTest]));
    saveTestToFirestore(newTest).catch(() => null);
    const updatedPaper = linkPypToTest(pyp, newTest.id);
    setPypPapers(prev => prev.map(p => (p.id === pyp.id ? updatedPaper : p)));
    savePypPaperToFirestore(updatedPaper).catch(() => null);
  };

  const handleTogglePublishTest = async (testId: string) => {
    setTests(prev => {
      const updated = togglePublishedState(prev, testId);
      const target = updated.find(t => t.id === testId);
      if (target) saveTestToFirestore(target).catch(() => null);
      return updated;
    });
  };

  const handleUpdateTest = async (testId: string, updates: Partial<MockTest>) => {
    removeDeletedId('cgssb_deleted_tests', testId);
    setTests(prev => {
      const updated = updateTestById(prev, testId, updates);
      const target = updated.find(t => t.id === testId);
      if (target) saveTestToFirestore(target).catch(() => null);
      return updated;
    });
  };

  const handleDeleteTest = async (testId: string) => {
    addDeletedId('cgssb_deleted_tests', testId);
    setTests(tests.filter(t => t.id !== testId));
    cleanTestFromAllBundles(testId);
    deleteTestFromFirestore(testId).catch(() => null);
  };

  const handleAddTest = (newTest: Partial<MockTest>) => {
    const fullTest = createMockTest(newTest);
    removeDeletedId('cgssb_deleted_tests', fullTest.id);
    setTests(prev => dedupeById([fullTest, ...prev]));
    saveTestToFirestore(fullTest).catch(() => null);
  };

  const handleTestPublished = (newTest: MockTest, newQuestions: Question[]) => {
    removeDeletedId('cgssb_deleted_tests', newTest.id);
    newQuestions.forEach(q => removeDeletedId('cgssb_deleted_questions', q.id));
    setQuestions(prev => mergePublishedQuestions(prev, newQuestions));
    setTests(prev => dedupeById([newTest, ...prev]));
    saveTestToFirestore(newTest).catch(() => null);
    saveQuestionsToFirestore(newQuestions).catch(() => null);
  };

  const handleBulkQuestionsAdded = (newQs: Question[]) => {
    if (!newQs || newQs.length === 0) return;
    newQs.forEach(q => removeDeletedId('cgssb_deleted_questions', q.id));
    setQuestions(prev => mergeQuestions(prev, newQs));
    saveQuestionsToFirestore(newQs).catch(() => null);
  };

  const handleBulkTestsAdded = (newTests: MockTest[]) => {
    if (!newTests || newTests.length === 0) return;
    newTests.forEach(t => removeDeletedId('cgssb_deleted_tests', t.id));
    setTests(prev => mergeTests(prev, newTests));
    newTests.forEach(t => saveTestToFirestore(t).catch(() => null));
  };

  const handleSaveCompletedTestAndQuestions = (updatedTest: MockTest, updatedQuestions: Question[]) => {
    handleUpdateTest(updatedTest.id, updatedTest);
    if (updatedQuestions && updatedQuestions.length > 0) {
      setQuestions(prev => mergeCompletedQuestions(prev, updatedQuestions));
      saveQuestionsToFirestore(updatedQuestions).catch(() => null);
    }
  };

  return {
    handleAddQuestion,
    handleUpdateQuestion,
    handleDeleteQuestion,
    handleAddPYP,
    handleDeletePYP,
    handleConvertPYPToMockTest,
    handleTogglePublishTest,
    handleUpdateTest,
    handleDeleteTest,
    handleAddTest,
    handleTestPublished,
    handleBulkQuestionsAdded,
    handleBulkTestsAdded,
    handleSaveCompletedTestAndQuestions,
  };
}
