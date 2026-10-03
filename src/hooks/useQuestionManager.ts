import { useState, useEffect, useCallback } from 'react';
import { Question } from '../types';
import { migrateLegacyQuestion } from '../utils/taxonomyMigration';
import {
  fetchQuestionsFromFirestore,
  saveQuestionsToFirestore,
  saveSingleQuestionToFirestore,
  deleteQuestionFromFirestore,
  subscribeToQuestions
} from '../firebase/firestoreService';

export function useQuestionManager(enabled = true) {
  const [questions, setQuestions] = useState<Question[]>([]);

  // Real-time Cloud Firestore synchronization across all devices
  useEffect(() => {
    if (!enabled) {
      setQuestions([]);
      return;
    }
    const unsubscribe = subscribeToQuestions((firestoreQuestions) => {
      if (Array.isArray(firestoreQuestions)) {
        setQuestions(firestoreQuestions.map(migrateLegacyQuestion));
      }
    });

    return () => unsubscribe();
  }, [enabled]);

  // Listen for local broadcast question updates
  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (Array.isArray(e.detail)) {
        setQuestions(e.detail.map(migrateLegacyQuestion));
      }
    };
    window.addEventListener('cgssb-questions-updated', handleUpdate);
    return () => window.removeEventListener('cgssb-questions-updated', handleUpdate);
  }, []);


  const addQuestions = useCallback((newQuestions: Question[]) => {
    // New production questions must be linked to the canonical exam catalog.
    // Legacy taxonomy-only records remain readable/editable for migration, but
    // cannot be created as new production content.
    if (!import.meta.env.DEV && newQuestions.some(q => !q?.programId)) {
      console.error('Rejected production question creation: canonical programId is required.');
      return;
    }
    setQuestions(prev => {
      const map = new Map(prev.map(q => [q.id, q]));
      newQuestions.forEach(q => map.set(q.id, migrateLegacyQuestion(q)));
      return Array.from(map.values());
    });
    saveQuestionsToFirestore(newQuestions).catch(async err => { console.error('Cloud save questions failed:', err); setQuestions((await fetchQuestionsFromFirestore()).map(migrateLegacyQuestion)); });
  }, []);

  const updateQuestion = useCallback((updatedQuestion: Question) => {
    const migrated = migrateLegacyQuestion(updatedQuestion);
    setQuestions(prev => prev.map(q => (q.id === migrated.id ? migrated : q)));
    saveSingleQuestionToFirestore(migrated).catch(async err => { console.error('Cloud update question failed:', err); setQuestions((await fetchQuestionsFromFirestore()).map(migrateLegacyQuestion)); });
  }, []);

  const deleteQuestion = useCallback((questionId: string) => {
    setQuestions(prev => prev.filter(q => q.id !== questionId));
    deleteQuestionFromFirestore(questionId).catch(async err => { console.error('Cloud delete question failed:', err); setQuestions((await fetchQuestionsFromFirestore()).map(migrateLegacyQuestion)); });
  }, []);

  // Factory/demo question restoration is intentionally disabled in production.
  const syncQuestions = useCallback(() => {
    if (!import.meta.env.DEV) {
      console.warn('Demo question restore is disabled in production.');
      return;
    }
  }, []);

  return {
    questions,
    setQuestions,
    addQuestions,
    updateQuestion,
    deleteQuestion,
    syncQuestions,
  };
}
