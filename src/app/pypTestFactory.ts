import type { MockTest, PreviousYearPaper, Question } from '../types';

export function createTestFromPyp(pyp: PreviousYearPaper, questions: Question[]): MockTest {
  return {
    id: pyp.linkedMockTestId || `test-from-${pyp.id}`,
    title: `${pyp.title} (Official Mock Test)`,
    category: pyp.examCategory,
    authorityId: pyp.authorityId,
    programId: pyp.programId,
    postId: pyp.postId,
    seriesId: pyp.seriesId,
    description: `Official past paper simulation. Converted from archived examination ${pyp.year}.`,
    durationMinutes: pyp.durationMinutes,
    questionCount: pyp.totalQuestions,
    marksPerQuestion: pyp.examCategory === 'CGPSC' ? 2.0 : 1.0,
    negativeMarksPerQuestion: pyp.examCategory === 'CGPSC' ? 0.66 : 0.333,
    sections: [{
      id: `sec-${pyp.id}`,
      name: 'Official Exam Paper',
      questionIds: (pyp.programId
        ? questions.filter(q => String(q.programId || '') === String(pyp.programId))
        : questions.filter(q => q.category === pyp.examCategory)
      ).map(q => q.id),
    }],
    difficultyDistribution: { easy: 40, medium: 40, hard: 20 },
    attemptsCount: 0,
    createdAt: new Date().toISOString(),
  };
}
