import { useState, useEffect, useCallback } from 'react';
import { MockTest } from '../types';
import { cleanTestFromAllBundles } from '../utils/bundleStore';
import {
  fetchTestsFromFirestore,
  saveTestToFirestore,
  deleteTestFromFirestore,
  subscribeToTests
} from '../firebase/firestoreService';

export function useTestManager() {
  const [tests, setTests] = useState<MockTest[]>([]);

  // Real-time Cloud Firestore synchronization across all devices
  useEffect(() => {
    const unsubscribe = subscribeToTests((firestoreTests) => {
      setTests(firestoreTests);
    });

    fetchTestsFromFirestore().then((remoteTests) => {
      if (Array.isArray(remoteTests)) {
        setTests(remoteTests);
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
    saveTestToFirestore(testObj).catch(async err => { console.error('Cloud save test failed:', err); setTests(await fetchTestsFromFirestore()); });
  }, []);

  const updateTest = useCallback((testId: string, updates: Partial<MockTest>) => {
    setTests(prev => {
      const updated = prev.map(t => (t.id === testId ? { ...t, ...updates } : t));
      const target = updated.find(t => t.id === testId);
      if (target) {
        saveTestToFirestore(target).catch(async err => { console.error('Cloud update test failed:', err); setTests(await fetchTestsFromFirestore()); });
      }
      return updated;
    });
  }, []);

  const deleteTest = useCallback((testId: string) => {
    cleanTestFromAllBundles(testId);
    setTests(prev => prev.filter(t => t.id !== testId));
    deleteTestFromFirestore(testId).catch(async err => { console.error('Cloud delete test failed:', err); setTests(await fetchTestsFromFirestore()); });
  }, []);

  const togglePublishTest = useCallback((testId: string) => {
    setTests(prev => {
      const updated = prev.map(t => (t.id === testId ? { ...t, isPublished: !t.isPublished } : t));
      const target = updated.find(t => t.id === testId);
      if (target) {
        saveTestToFirestore(target).catch(async err => { console.error('Cloud publish toggle failed:', err); setTests(await fetchTestsFromFirestore()); });
      }
      return updated;
    });
  }, []);

  // Factory/demo catalog restoration is intentionally disabled in production.
  const syncDefaultCatalog = useCallback(() => {
    if (!import.meta.env.DEV) {
      console.warn('Demo catalog restore is disabled in production.');
      return;
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
