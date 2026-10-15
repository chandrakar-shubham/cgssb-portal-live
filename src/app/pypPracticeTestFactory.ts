import type { MockTest, PreviousYearPaper, Question } from '../types';

export function createPracticeTestFromPyp(paper: PreviousYearPaper, relevantQuestions: Question[], fallbackQuestions: Question[]): MockTest {
  const chosenQuestions = relevantQuestions.length > 0 ? relevantQuestions : fallbackQuestions;
  return {
    id: `pyp-test-${paper.id}`,
    title: `${paper.title} (Real Exam Simulation)`,
    category: paper.examCategory,
    authorityId: paper.authorityId,
    programId: paper.programId,
    postId: paper.postId,
    seriesId: paper.seriesId,
    isPYP: true,
    originType: 'pyq',
    pypYear: paper.year,
    description: `Official past paper simulation. Converted from archived examination ${paper.year}.`,
    durationMinutes: paper.durationMinutes,
    questionCount: relevantQuestions.length > 0 ? relevantQuestions.length : paper.totalQuestions,
    marksPerQuestion: paper.examCategory === 'CGPSC' ? 2.0 : 1.0,
    negativeMarksPerQuestion: paper.examCategory === 'CGPSC' ? 0.666 : 0.333,
    sections: [{ id: 'pyp-sec-1', name: 'Official Exam Paper', questionIds: chosenQuestions.map(q => q.id) }],
    difficultyDistribution: { easy: 40, medium: 40, hard: 20 },
    attemptsCount: 0,
    createdAt: new Date().toISOString(),
  };
}
