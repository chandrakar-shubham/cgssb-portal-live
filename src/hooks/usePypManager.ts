import { useState, useEffect } from 'react';
import { PreviousYearPaper } from '../types';
import { INITIAL_PYP_PAPERS } from '../mockData';

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

export function usePypManager() {
  const [pypPapers, setPypPapers] = useState<PreviousYearPaper[]>(() => {
    try {
      const saved = localStorage.getItem('cgssb_pyp');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return mergeWithInitial(INITIAL_PYP_PAPERS, parsed, 'cgssb_deleted_pyp');
        }
      }
    } catch {}
    return mergeWithInitial(INITIAL_PYP_PAPERS, [], 'cgssb_deleted_pyp');
  });

  useEffect(() => {
    try {
      localStorage.setItem('cgssb_pyp', JSON.stringify(pypPapers));
    } catch (e) {
      console.warn('LocalStorage quota exceeded for PYP:', e);
    }
  }, [pypPapers]);

  const addPypPaper = (newPaper: Partial<PreviousYearPaper>) => {
    const paper: PreviousYearPaper = {
      id: `pyp-custom-${Date.now()}`,
      title: newPaper.title || 'Official Exam Paper',
      examCategory: newPaper.examCategory || 'CGSSB',
      year: newPaper.year || 2026,
      totalQuestions: newPaper.totalQuestions || 100,
      durationMinutes: newPaper.durationMinutes || 120,
      marks: newPaper.marks || 100,
      negativeMarkingRatio: newPaper.negativeMarkingRatio || '-⅓rd',
      paperSummary: newPaper.paperSummary || '',
      subjectsWeightage: newPaper.subjectsWeightage || [],
      downloadFileName: newPaper.downloadFileName || 'Paper.pdf',
      fileSize: newPaper.fileSize || '2.5 MB',
      ...newPaper,
    };
    setPypPapers(prev => [paper, ...prev]);
  };

  const deletePypPaper = (id: string) => {
    try {
      const raw = localStorage.getItem('cgssb_deleted_pyp');
      const arr = raw ? JSON.parse(raw) : [];
      if (!arr.includes(id)) arr.push(id);
      localStorage.setItem('cgssb_deleted_pyp', JSON.stringify(arr));
    } catch {}
    setPypPapers(prev => prev.filter(p => p.id !== id));
  };

  const syncPyp = () => {
    setPypPapers(prev => {
      const updated = mergeWithInitial(INITIAL_PYP_PAPERS, prev, 'cgssb_deleted_pyp');
      try {
        localStorage.setItem('cgssb_pyp', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  return {
    pypPapers,
    setPypPapers,
    addPypPaper,
    deletePypPaper,
    syncPyp,
    mergeWithInitial,
  };
}
