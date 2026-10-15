import type { Question, QuestionPaletteStatus } from '../types';
import { normalizeSubjectName } from '../utils/taxonomyMigration';

type ExamScoreInput = {
  questions: Question[];
  responses: Record<string, 'A' | 'B' | 'C' | 'D' | null>;
  questionStatuses: Record<string, QuestionPaletteStatus>;
  marksPerQuestion: number;
  negativeMarksPerQuestion: number;
};

export type ExamScore = {
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  attemptedCount: number;
  netScore: number;
  maxScore: number;
  percentage: number;
  accuracy: number;
  negDeduction: number;
  sectorAnalysis: Array<{
    subject: string;
    total: number;
    correct: number;
    incorrect: number;
    unattempted: number;
    accuracy: number;
    score: number;
    maxScore: number;
  }>;
};

/** Pure scoring calculation; persistence and UI state remain in the application layer. */
export function calculateExamScore({
  questions,
  responses,
  marksPerQuestion,
  negativeMarksPerQuestion,
}: ExamScoreInput): ExamScore {
  let correctCount = 0;
  let incorrectCount = 0;
  let unattemptedCount = 0;
  const subjectMap: Record<string, { total: number; correct: number; incorrect: number; unattempted: number }> = {};

  questions.forEach(q => {
    const resp = responses[q.id];
    const cleanSubj = normalizeSubjectName(q.subject, `${q.questionHindi || ''} ${q.questionText || ''}`);
    if (!subjectMap[cleanSubj]) subjectMap[cleanSubj] = { total: 0, correct: 0, incorrect: 0, unattempted: 0 };
    subjectMap[cleanSubj].total += 1;
    if (resp == null) {
      unattemptedCount += 1;
      subjectMap[cleanSubj].unattempted += 1;
    } else if (resp === q.correctOption) {
      correctCount += 1;
      subjectMap[cleanSubj].correct += 1;
    } else {
      incorrectCount += 1;
      subjectMap[cleanSubj].incorrect += 1;
    }
  });

  const rawScore = correctCount * marksPerQuestion;
  const negDeduction = Number((incorrectCount * negativeMarksPerQuestion).toFixed(2));
  const netScore = Number(Math.max(0, rawScore - negDeduction).toFixed(2));
  const maxScore = questions.length * marksPerQuestion;
  const percentage = maxScore > 0 ? Number(((netScore / maxScore) * 100).toFixed(2)) : 0;
  const attemptedCount = correctCount + incorrectCount;
  const accuracy = attemptedCount > 0 ? Number(((correctCount / attemptedCount) * 100).toFixed(2)) : 0;

  const sectorAnalysis = Object.keys(subjectMap).map(subject => {
    const data = subjectMap[subject];
    const subjMax = data.total * marksPerQuestion;
    const subjScore = Number(Math.max(0, data.correct * marksPerQuestion - data.incorrect * negativeMarksPerQuestion).toFixed(2));
    const subjAttempted = data.correct + data.incorrect;
    return {
      subject,
      total: data.total,
      correct: data.correct,
      incorrect: data.incorrect,
      unattempted: data.unattempted,
      accuracy: subjAttempted > 0 ? Number(((data.correct / subjAttempted) * 100).toFixed(2)) : 0,
      score: subjScore,
      maxScore: subjMax,
    };
  });

  return {
    correctCount,
    incorrectCount,
    unattemptedCount,
    attemptedCount,
    netScore,
    maxScore,
    percentage,
    accuracy,
    negDeduction,
    sectorAnalysis,
  };
}
