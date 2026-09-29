import { useState, useEffect, useCallback } from 'react';
import { Question } from '../types';
import { INITIAL_QUESTIONS } from '../mockData';
import { migrateLegacyQuestion } from '../utils/taxonomyMigration';
import {
  fetchQuestionsFromFirestore,
  saveQuestionsToFirestore,
  saveSingleQuestionToFirestore,
  deleteQuestionFromFirestore,
  subscribeToQuestions
} from '../firebase/firestoreService';

export function useQuestionManager() {
  const [questions, setQuestions] = useState<Question[]>(() => {
    try {
      const saved = localStorage.getItem('cgssb_questions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map(migrateLegacyQuestion);
        }
      }
    } catch {}
    return [];
  });

  // Real-time Cloud Firestore synchronization across all devices
  useEffect(() => {
    const unsubscribe = subscribeToQuestions((firestoreQuestions) => {
      if (Array.isArray(firestoreQuestions)) {
        setQuestions(firestoreQuestions.map(migrateLegacyQuestion));
        try {
          localStorage.setItem('cgssb_questions', JSON.stringify(firestoreQuestions));
        } catch {}
      }
    });

    fetchQuestionsFromFirestore().then((remoteQs) => {
      if (Array.isArray(remoteQs)) {
        setQuestions(remoteQs.map(migrateLegacyQuestion));
        try {
          localStorage.setItem('cgssb_questions', JSON.stringify(remoteQs));
        } catch {}
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
    setQuestions(prev => prev.filter(q => q.id !== questionId));
    deleteQuestionFromFirestore(questionId).catch(err => console.warn('Cloud delete question warning:', err));
  }, []);

  const syncQuestions = useCallback(() => {
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
