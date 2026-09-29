import { useState, useEffect } from 'react';
import { Question } from '../types';
import { INITIAL_QUESTIONS } from '../mockData';
import { migrateLegacyQuestion } from '../utils/taxonomyMigration';
import { isDemoDataPurged } from '../utils/bundleStore';

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
        if (Array.isArray(parsed)) {
          return parsed.map(migrateLegacyQuestion).filter(q => !deletedSet.has(q.id));
        }
      }
      return INITIAL_QUESTIONS.map(migrateLegacyQuestion).filter(q => !deletedSet.has(q.id));
    } catch {}
    return isDemoDataPurged() ? [] : INITIAL_QUESTIONS.map(migrateLegacyQuestion);
  });

  // Listen for broadcast question updates (e.g. Purge/Restore)
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
      console.warn('LocalStorage quota exceeded for questions:', e);
    }
  }, [questions]);

  const addQuestions = (newQuestions: Question[]) => {
    setQuestions(prev => {
      const map = new Map(prev.map(q => [q.id, q]));
      newQuestions.forEach(q => map.set(q.id, q));
      return Array.from(map.values());
    });
  };

  const updateQuestion = (updatedQuestion: Question) => {
    setQuestions(prev => prev.map(q => (q.id === updatedQuestion.id ? updatedQuestion : q)));
  };

  const deleteQuestion = (questionId: string) => {
    try {
      const raw = localStorage.getItem('cgssb_deleted_questions');
      const arr = raw ? JSON.parse(raw) : [];
      if (!arr.includes(questionId)) arr.push(questionId);
      localStorage.setItem('cgssb_deleted_questions', JSON.stringify(arr));
    } catch {}
    setQuestions(prev => prev.filter(q => q.id !== questionId));
  };

  const syncQuestions = () => {
    if (isDemoDataPurged()) return;
    setQuestions(INITIAL_QUESTIONS.map(migrateLegacyQuestion));
    try {
      localStorage.setItem('cgssb_questions', JSON.stringify(INITIAL_QUESTIONS.map(migrateLegacyQuestion)));
    } catch {}
  };

  return {
    questions,
    setQuestions,
    addQuestions,
    updateQuestion,
    deleteQuestion,
    syncQuestions,
  };
}
