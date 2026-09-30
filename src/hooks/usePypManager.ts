import { useState, useEffect, useCallback } from 'react';
import { PreviousYearPaper } from '../types';
import {
  fetchPypPapersFromFirestore,
  savePypPaperToFirestore,
  deletePypPaperFromFirestore,
  subscribeToPypPapers
} from '../firebase/firestoreService';

export function usePypManager() {
  const [pypPapers, setPypPapers] = useState<PreviousYearPaper[]>(() => {
    try {
      const saved = localStorage.getItem('cgssb_pyp');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {}
    return [];
  });

  // Real-time Cloud Firestore synchronization across all devices
  useEffect(() => {
    const unsubscribe = subscribeToPypPapers((firestorePapers) => {
      if (Array.isArray(firestorePapers)) {
        setPypPapers(firestorePapers);
        try {
          localStorage.setItem('cgssb_pyp', JSON.stringify(firestorePapers));
        } catch {}
      }
    });

    fetchPypPapersFromFirestore().then((remotePapers) => {
      if (Array.isArray(remotePapers)) {
        setPypPapers(remotePapers);
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
    setPypPapers(prev => prev.filter(p => p.id !== id));
    deletePypPaperFromFirestore(id).catch(err => console.warn('Cloud delete PYP paper warning:', err));
  }, []);

  // Factory/demo PYP restoration is intentionally disabled in production.
  const syncPyp = useCallback(() => {
    if (!import.meta.env.DEV) {
      console.warn('Demo PYP restore is disabled in production.');
      return;
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
