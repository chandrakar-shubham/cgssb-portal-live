import { useState, useEffect, useCallback } from 'react';
import { MockTest } from '../types';
import { INITIAL_MOCK_TESTS } from '../mockData';
import { cleanTestFromAllBundles } from '../utils/bundleStore';
import {
  fetchTestsFromFirestore,
  saveTestToFirestore,
  deleteTestFromFirestore,
  subscribeToTests
} from '../firebase/firestoreService';

export function useTestManager() {
  const [tests, setTests] = useState<MockTest[]>(() => {
    try {
      const saved = localStorage.getItem('cgssb_tests');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  // Real-time Cloud Firestore synchronization across all devices
  useEffect(() => {
    const unsubscribe = subscribeToTests((firestoreTests) => {
      setTests(firestoreTests);
      try {
        localStorage.setItem('cgssb_tests', JSON.stringify(firestoreTests));
      } catch {}
    });

    fetchTestsFromFirestore().then((remoteTests) => {
      if (Array.isArray(remoteTests)) {
        setTests(remoteTests);
        try {
          localStorage.setItem('cgssb_tests', JSON.stringify(remoteTests));
        } catch {}
      }
    }).catch(() => {});

    return () => unsubscribe();
  }, []);

  // Listen for local broadcast test updates
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
      console.warn('LocalStorage quota warning for tests:', e);
    }
  }, [tests]);

  const addTest = useCallback((newTest: Partial<MockTest>) => {
    const testObj: MockTest = {
      id: newTest.id || `test-custom-${Date.now()}`,
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
    setTests(prev => [testObj, ...prev.filter(t => t.id !== testObj.id)]);
    saveTestToFirestore(testObj).catch(err => console.warn('Cloud save test warning:', err));
  }, []);

  const updateTest = useCallback((testId: string, updates: Partial<MockTest>) => {
    setTests(prev => {
      const updated = prev.map(t => (t.id === testId ? { ...t, ...updates } : t));
      const target = updated.find(t => t.id === testId);
      if (target) {
        saveTestToFirestore(target).catch(err => console.warn('Cloud update test warning:', err));
      }
      return updated;
    });
  }, []);

  const deleteTest = useCallback((testId: string) => {
    cleanTestFromAllBundles(testId);
    setTests(prev => prev.filter(t => t.id !== testId));
    deleteTestFromFirestore(testId).catch(err => console.warn('Cloud delete test warning:', err));
  }, []);

  const togglePublishTest = useCallback((testId: string) => {
    setTests(prev => {
      const updated = prev.map(t => (t.id === testId ? { ...t, isPublished: !t.isPublished } : t));
      const target = updated.find(t => t.id === testId);
      if (target) {
        saveTestToFirestore(target).catch(() => {});
      }
      return updated;
    });
  }, []);

  const syncDefaultCatalog = useCallback(() => {
    setTests(INITIAL_MOCK_TESTS);
    try {
      localStorage.setItem('cgssb_tests', JSON.stringify(INITIAL_MOCK_TESTS));
    } catch {}
    for (const t of INITIAL_MOCK_TESTS) {
      saveTestToFirestore(t).catch(() => {});
    }
  }, []);

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
