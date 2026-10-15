import type { Question } from '../types';

export function createQuestion(qData: Partial<Question>): Question {
  return {
    id: qData.id || `q-cg-${Date.now().toString().slice(-6)}`,
    subject: qData.subject || 'Chhattisgarh Special Knowledge',
    topic: qData.topic || 'General',
    subtopic: qData.subtopic || 'General',
    difficulty: qData.difficulty || 'Medium',
    category: qData.category || 'CGSSB',
    authorityId: qData.authorityId,
    programId: qData.programId,
    postId: qData.postId,
    seriesId: qData.seriesId,
    questionText: qData.questionText || '',
    questionHindi: qData.questionHindi || '',
    options: qData.options || [],
    correctOption: qData.correctOption || 'A',
    marks: qData.marks || 1.0,
    negativeMarks: qData.negativeMarks || 0.333,
    explanation: qData.explanation || '',
    explanationHindi: qData.explanationHindi || '',
    pypSource: qData.pypSource || '',
    pypAppearances: qData.pypAppearances || [],
    createdAt: new Date().toISOString().split('T')[0],
  };
}
