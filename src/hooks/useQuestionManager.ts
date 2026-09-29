import { useState, useEffect, useCallback } from 'react';
import { Question } from '../types';
import { INITIAL_QUESTIONS } from '../mockData';
import { migrateLegacyQuestion } from '../utils/taxonomyMigration';
import { isDemoDataPurged } from '../utils/bundleStore';
import {
  fetchQuestionsFromFirestore,
  saveQuestionsToFirestore,
  saveSingleQuestionToFirestore,
  deleteQuestionFromFirestore,
  subscribeToQuestions
} from '../firebase/firestoreService';

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

export function useQuestionManager() {
  const [questions, setQuestions] = useState<Question[]>(() => {
    try {
      const deletedSet = getDeletedIds('cgssb_deleted_questions');
      if (isDemoDataPurged()) {
        const saved = localStorage.getItem('cgssb_questions');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            return parsed.map(migrateLegacyQuestion).filter(q => !deletedSet.has(q.id));
          }
        }
        return [];
      }
      const saved = localStorage.getItem('cgssb_questions');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(migrateLegacyQuestion).filter(q => !deletedSet.has(q.id));
        }
      }
      return INITIAL_QUESTIONS.map(migrateLegacyQuestion).filter(q => !deletedSet.has(q.id));
    } catch {}
    return isDemoDataPurged() ? [] : INITIAL_QUESTIONS.map(migrateLegacyQuestion);
  });

  // Real-time Cloud Firestore synchronization across all devices
  useEffect(() => {
    const unsubscribe = subscribeToQuestions((firestoreQuestions) => {
      const deletedSet = getDeletedIds('cgssb_deleted_questions');
      const filtered = firestoreQuestions.map(migrateLegacyQuestion).filter(q => !deletedSet.has(q.id));
      if (filtered.length > 0) {
        setQuestions(filtered);
        try {
          localStorage.setItem('cgssb_questions', JSON.stringify(filtered));
        } catch {}
      }
    });

    // Initial fetch fallback
    fetchQuestionsFromFirestore().then((remoteQs) => {
      if (Array.isArray(remoteQs) && remoteQs.length > 0) {
        const deletedSet = getDeletedIds('cgssb_deleted_questions');
        const filtered = remoteQs.map(migrateLegacyQuestion).filter(q => !deletedSet.has(q.id));
        if (filtered.length > 0) {
          setQuestions(filtered);
          try {
            localStorage.setItem('cgssb_questions', JSON.stringify(filtered));
          } catch {}
        }
      }
    }).catch(() => {});

    return () => unsubscribe();
  }, []);

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

  useEffect(() => {
    try {
      localStorage.setItem('cgssb_questions', JSON.stringify(questions));
    } catch (e) {
      console.warn('LocalStorage quota warning for questions:', e);
    }
  }, [questions]);

  const addQuestions = useCallback((newQuestions: Question[]) => {
    setQuestions(prev => {
      const map = new Map(prev.map(q => [q.id, q]));
      newQuestions.forEach(q => map.set(q.id, migrateLegacyQuestion(q)));
      return Array.from(map.values());
    });
    saveQuestionsToFirestore(newQuestions).catch(err => console.warn('Cloud save questions warning:', err));
  }, []);

  const updateQuestion = useCallback((updatedQuestion: Question) => {
    const migrated = migrateLegacyQuestion(updatedQuestion);
    setQuestions(prev => prev.map(q => (q.id === migrated.id ? migrated : q)));
    saveSingleQuestionToFirestore(migrated).catch(err => console.warn('Cloud update question warning:', err));
  }, []);

  const deleteQuestion = useCallback((questionId: string) => {
    try {
      const raw = localStorage.getItem('cgssb_deleted_questions');
      const arr = raw ? JSON.parse(raw) : [];
      if (!arr.includes(questionId)) arr.push(questionId);
      localStorage.setItem('cgssb_deleted_questions', JSON.stringify(arr));
    } catch {}
    setQuestions(prev => prev.filter(q => q.id !== questionId));
    deleteQuestionFromFirestore(questionId).catch(err => console.warn('Cloud delete question warning:', err));
  }, []);

  const syncQuestions = useCallback(() => {
    if (isDemoDataPurged()) return;
    const items = INITIAL_QUESTIONS.map(migrateLegacyQuestion);
    setQuestions(items);
    try {
      localStorage.setItem('cgssb_questions', JSON.stringify(items));
    } catch {}
    saveQuestionsToFirestore(items).catch(() => {});
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
