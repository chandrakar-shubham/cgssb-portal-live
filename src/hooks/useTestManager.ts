import { useState, useEffect } from 'react';
import { MockTest } from '../types';
import { INITIAL_MOCK_TESTS } from '../mockData';
import { cleanTestFromAllBundles } from '../utils/bundleStore';

function getDeletedIds(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return new Set(parsed);
    }
  } catch {}
  return new Set<string>();
}

function mergeWithInitial<T extends { id: string }>(initial: T[], saved: T[], deletedKey: string): T[] {
  const deletedSet = getDeletedIds(deletedKey);
  const map = new Map<string, T>();
  initial.forEach(item => {
    if (item && item.id && !deletedSet.has(item.id)) map.set(item.id, item);
  });
  saved.forEach(item => {
    if (item && item.id && !deletedSet.has(item.id)) {
      map.set(item.id, item);
    }
  });
  return Array.from(map.values());
}

export function useTestManager() {
  const [tests, setTests] = useState<MockTest[]>(() => {
    try {
      const saved = localStorage.getItem('cgssb_tests');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return mergeWithInitial(INITIAL_MOCK_TESTS, parsed, 'cgssb_deleted_tests');
        }
      }
    } catch {}
    return mergeWithInitial(INITIAL_MOCK_TESTS, [], 'cgssb_deleted_tests');
  });

  useEffect(() => {
    try {
      localStorage.setItem('cgssb_tests', JSON.stringify(tests));
    } catch (e) {
      console.warn('LocalStorage quota exceeded for tests:', e);
    }
  }, [tests]);

  const addTest = (newTest: Partial<MockTest>) => {
    const testObj: MockTest = {
      id: `test-custom-${Date.now()}`,
      title: newTest.title || 'Untitled Test',
      authority: newTest.authority || 'CGSSB',
      category: newTest.category || 'CGSSB',
      subCategory: newTest.subCategory || 'General Cadre',
      postName: newTest.postName || 'Custom Post',
      examName: newTest.examName || 'Custom Exam',
      description: newTest.description || '',
      durationMinutes: newTest.durationMinutes || 120,
      totalMarks: newTest.totalMarks || 100,
      marksPerQuestion: newTest.marksPerQuestion || 1.0,
      negativeMarksPerQuestion: newTest.negativeMarksPerQuestion || 0.333,
      sections: newTest.sections || [],
      questionCount: newTest.questionCount || 0,
      attemptsCount: 1,
      passingPercentage: 40,
      isPublished: true,
      createdAt: new Date().toISOString().split('T')[0],
      ...newTest,
    };
    setTests(prev => [testObj, ...prev]);
  };

  const updateTest = (testId: string, updates: Partial<MockTest>) => {
    setTests(prev => prev.map(t => (t.id === testId ? { ...t, ...updates } : t)));
  };

  const deleteTest = (testId: string) => {
    try {
      const raw = localStorage.getItem('cgssb_deleted_tests');
      const arr = raw ? JSON.parse(raw) : [];
      if (!arr.includes(testId)) arr.push(testId);
      localStorage.setItem('cgssb_deleted_tests', JSON.stringify(arr));
    } catch {}
    cleanTestFromAllBundles(testId);
    setTests(prev => prev.filter(t => t.id !== testId));
  };

  const togglePublishTest = (testId: string) => {
    setTests(prev => prev.map(t => (t.id === testId ? { ...t, isPublished: !t.isPublished } : t)));
  };

  const syncDefaultCatalog = () => {
    setTests(prev => {
      const updated = mergeWithInitial(INITIAL_MOCK_TESTS, prev, 'cgssb_deleted_tests');
      try {
        localStorage.setItem('cgssb_tests', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  return {
    tests,
    setTests,
    addTest,
    updateTest,
    deleteTest,
    togglePublishTest,
    syncDefaultCatalog,
    mergeWithInitial,
  };
}
