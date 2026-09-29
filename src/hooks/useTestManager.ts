import { useState, useEffect } from 'react';
import { MockTest } from '../types';
import { INITIAL_MOCK_TESTS } from '../mockData';
import { cleanTestFromAllBundles, isDemoDataPurged } from '../utils/bundleStore';

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

export function useTestManager() {
  const [tests, setTests] = useState<MockTest[]>(() => {
    try {
      const deletedSet = getDeletedIds('cgssb_deleted_tests');
      if (isDemoDataPurged()) {
        const saved = localStorage.getItem('cgssb_tests');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed.filter((t: MockTest) => !deletedSet.has(t.id));
        }
        return [];
      }
      const saved = localStorage.getItem('cgssb_tests');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((t: MockTest) => !deletedSet.has(t.id));
        }
      }
      // Only use INITIAL_MOCK_TESTS if first ever run and not purged
      return INITIAL_MOCK_TESTS.filter(t => !deletedSet.has(t.id));
    } catch {}
    return isDemoDataPurged() ? [] : INITIAL_MOCK_TESTS;
  });

  // Listen for broadcast test updates (e.g. Purge/Restore)
  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (Array.isArray(e.detail)) {
        setTests(e.detail);
      }
    };
    window.addEventListener('cgssb-tests-updated', handleUpdate);
    return () => window.removeEventListener('cgssb-tests-updated', handleUpdate);
  }, []);

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
    if (isDemoDataPurged()) return;
    setTests(INITIAL_MOCK_TESTS);
    try {
      localStorage.setItem('cgssb_tests', JSON.stringify(INITIAL_MOCK_TESTS));
    } catch {}
  };

  return {
    tests,
    setTests,
    addTest,
    updateTest,
    deleteTest,
    togglePublishTest,
    syncDefaultCatalog,
  };
}

