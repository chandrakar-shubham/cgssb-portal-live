import { useState, useEffect } from 'react';
import { Question } from '../types';
import { INITIAL_QUESTIONS } from '../mockData';
import { migrateLegacyQuestion } from '../utils/taxonomyMigration';

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

export function useQuestionManager() {
  const [questions, setQuestions] = useState<Question[]>(() => {
    try {
      const saved = localStorage.getItem('cgssb_questions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const migrated = parsed.map(migrateLegacyQuestion);
          return mergeWithInitial(INITIAL_QUESTIONS, migrated, 'cgssb_deleted_questions');
        }
      }
    } catch {}
    return mergeWithInitial(INITIAL_QUESTIONS, [], 'cgssb_deleted_questions');
  });

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
    setQuestions(prev => {
      const updated = mergeWithInitial(INITIAL_QUESTIONS, prev, 'cgssb_deleted_questions');
      try {
        localStorage.setItem('cgssb_questions', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  return {
    questions,
    setQuestions,
    addQuestions,
    updateQuestion,
    deleteQuestion,
    syncQuestions,
    mergeWithInitial,
  };
}
