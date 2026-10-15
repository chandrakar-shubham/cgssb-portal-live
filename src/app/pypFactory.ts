import type { PreviousYearPaper } from '../types';

export function createPypPaper(pypData: Partial<PreviousYearPaper>): PreviousYearPaper {
  return {
    id: pypData.id || `pyp-${Date.now()}`,
    title: pypData.title || 'Official Exam Paper',
    examCategory: pypData.examCategory || 'CGSSB',
    authorityId: pypData.authorityId,
    programId: pypData.programId,
    postId: pypData.postId,
    seriesId: pypData.seriesId,
    year: pypData.year || 2024,
    totalQuestions: pypData.totalQuestions || 100,
    durationMinutes: pypData.durationMinutes || 120,
    marks: pypData.marks || 100,
    negativeMarkingRatio: pypData.negativeMarkingRatio || '1/3rd (0.333)',
    paperSummary: pypData.paperSummary || '',
    subjectsWeightage: pypData.subjectsWeightage || [],
    isOfficialPaper: true,
    downloadFileName: pypData.downloadFileName,
    linkedMockTestId: pypData.linkedMockTestId,
    linkedQuestionIds: pypData.linkedQuestionIds,
  };
}
