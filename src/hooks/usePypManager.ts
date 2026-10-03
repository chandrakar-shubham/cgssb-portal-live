import { useState, useEffect, useCallback } from 'react';
import { PreviousYearPaper } from '../types';
import {
  fetchPypPapersFromFirestore,
  fetchPublishedPypPapersFromFirestore,
  savePypPaperToFirestore,
  deletePypPaperFromFirestore,
  subscribeToPypPapers
} from '../firebase/firestoreService';

export function usePypManager(enabled = true) {
  const [pypPapers, setPypPapers] = useState<PreviousYearPaper[]>([]);

  // Real-time Cloud Firestore synchronization across all devices
  useEffect(() => {
    if (!enabled) {
      fetchPublishedPypPapersFromFirestore().then((remotePapers) => {
        if (Array.isArray(remotePapers)) setPypPapers(remotePapers);
      }).catch(() => {});
      return;
    }

    const unsubscribe = subscribeToPypPapers((firestorePapers) => {
      if (Array.isArray(firestorePapers)) {
        setPypPapers(firestorePapers);
      }
    });

    fetchPypPapersFromFirestore().then((remotePapers) => {
      if (Array.isArray(remotePapers)) {
        setPypPapers(remotePapers);
      }
    }).catch(() => {});

    return () => unsubscribe();
  }, [enabled]);

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
    // New production PYP records must be linked to the canonical exam catalog.
    if (!import.meta.env.DEV && !newPaper.programId) {
      console.error('Rejected production PYP creation: canonical programId is required.');
      return;
    }
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
    savePypPaperToFirestore(paper).catch(async err => { console.error('Cloud save PYP paper failed:', err); setPypPapers(await fetchPypPapersFromFirestore()); });
  }, []);

  const deletePypPaper = useCallback((id: string) => {
    setPypPapers(prev => prev.filter(p => p.id !== id));
    deletePypPaperFromFirestore(id).catch(async err => { console.error('Cloud delete PYP paper failed:', err); setPypPapers(await fetchPypPapersFromFirestore()); });
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
