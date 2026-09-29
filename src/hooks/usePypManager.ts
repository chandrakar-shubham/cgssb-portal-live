import { useState, useEffect, useCallback } from 'react';
import { PreviousYearPaper } from '../types';
import { INITIAL_PYP_PAPERS } from '../mockData';
import { isDemoDataPurged } from '../utils/bundleStore';
import {
  fetchPypPapersFromFirestore,
  savePypPaperToFirestore,
  deletePypPaperFromFirestore,
  subscribeToPypPapers
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

export function usePypManager() {
  const [pypPapers, setPypPapers] = useState<PreviousYearPaper[]>(() => {
    try {
      const deletedSet = getDeletedIds('cgssb_deleted_pyp');
      if (isDemoDataPurged()) {
        const saved = localStorage.getItem('cgssb_pyp');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            return parsed.filter(p => !deletedSet.has(p.id));
          }
        }
        return [];
      }
      const saved = localStorage.getItem('cgssb_pyp');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter(p => !deletedSet.has(p.id));
        }
      }
      return INITIAL_PYP_PAPERS.filter(p => !deletedSet.has(p.id));
    } catch {}
    return isDemoDataPurged() ? [] : INITIAL_PYP_PAPERS;
  });

  // Real-time Cloud Firestore synchronization across all devices
  useEffect(() => {
    const unsubscribe = subscribeToPypPapers((firestorePapers) => {
      const deletedSet = getDeletedIds('cgssb_deleted_pyp');
      const filtered = firestorePapers.filter(p => !deletedSet.has(p.id));
      if (filtered.length > 0) {
        setPypPapers(filtered);
        try {
          localStorage.setItem('cgssb_pyp', JSON.stringify(filtered));
        } catch {}
      }
    });

    // Initial fetch fallback
    fetchPypPapersFromFirestore().then((remotePapers) => {
      if (Array.isArray(remotePapers) && remotePapers.length > 0) {
        const deletedSet = getDeletedIds('cgssb_deleted_pyp');
        const filtered = remotePapers.filter(p => !deletedSet.has(p.id));
        if (filtered.length > 0) {
          setPypPapers(filtered);
          try {
            localStorage.setItem('cgssb_pyp', JSON.stringify(filtered));
          } catch {}
        }
      }
    }).catch(() => {});

    return () => unsubscribe();
  }, []);

  // Listen for local broadcast pyp updates
  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (Array.isArray(e.detail)) {
        setPypPapers(e.detail);
      }
    };
    window.addEventListener('cgssb-pyp-updated', handleUpdate);
    return () => window.removeEventListener('cgssb-pyp-updated', handleUpdate);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('cgssb_pyp', JSON.stringify(pypPapers));
    } catch (e) {
      console.warn('LocalStorage quota warning for PYP:', e);
    }
  }, [pypPapers]);

  const addPypPaper = useCallback((newPaper: Partial<PreviousYearPaper>) => {
    const paper: PreviousYearPaper = {
      id: newPaper.id || `pyp-custom-${Date.now()}`,
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
    setPypPapers(prev => [paper, ...prev.filter(p => p.id !== paper.id)]);
    savePypPaperToFirestore(paper).catch(err => console.warn('Cloud save PYP paper warning:', err));
  }, []);

  const deletePypPaper = useCallback((id: string) => {
    try {
      const raw = localStorage.getItem('cgssb_deleted_pyp');
      const arr = raw ? JSON.parse(raw) : [];
      if (!arr.includes(id)) arr.push(id);
      localStorage.setItem('cgssb_deleted_pyp', JSON.stringify(arr));
    } catch {}
    setPypPapers(prev => prev.filter(p => p.id !== id));
    deletePypPaperFromFirestore(id).catch(err => console.warn('Cloud delete PYP paper warning:', err));
  }, []);

  const syncPyp = useCallback(() => {
    if (isDemoDataPurged()) return;
    setPypPapers(INITIAL_PYP_PAPERS);
    try {
      localStorage.setItem('cgssb_pyp', JSON.stringify(INITIAL_PYP_PAPERS));
    } catch {}
    for (const p of INITIAL_PYP_PAPERS) {
      savePypPaperToFirestore(p).catch(() => {});
    }
  }, []);

  return {
    pypPapers,
    setPypPapers,
    addPypPaper,
    deletePypPaper,
    syncPyp,
  };
}
