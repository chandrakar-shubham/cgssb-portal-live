import type { MockTest } from '../types';

export function createMockTest(newTest: Partial<MockTest>): MockTest {
  return {
    id: newTest.id || `test-${Date.now()}`,
    title: newTest.title || 'New Mock Test',
    category: newTest.category || 'CGSSB',
    authorityId: newTest.authorityId,
    programId: newTest.programId,
    postId: newTest.postId,
    seriesId: newTest.seriesId,
    description: newTest.description || '',
    durationMinutes: newTest.durationMinutes || 120,
    questionCount: newTest.questionCount || 100,
    marksPerQuestion: newTest.marksPerQuestion || 1.0,
    negativeMarksPerQuestion: newTest.negativeMarksPerQuestion || 0.333,
    sections: newTest.sections || [{ id: 'sec-1', name: 'General', questionIds: [] }],
    attemptsCount: 0,
    isPublished: newTest.isPublished !== false,
    createdAt: new Date().toISOString(),
  };
}
