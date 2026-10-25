import type { Question, QuestionOption } from '../types';

/**
 * Student-facing question payload. Deliberately uses an allowlist so future
 * canonical/admin fields are not exposed by default.
 *
 * This is a projection helper only; callers must read the studentQuestions
 * collection before this can be considered a security boundary.
 */
export type StudentQuestion = Pick<
  Question,
  | 'id'
  | 'uniqueQuestionId'
  | 'authority'
  | 'subCategory'
  | 'postName'
  | 'examName'
  | 'year'
  | 'authorityId'
  | 'programId'
  | 'postId'
  | 'seriesId'
  | 'category'
  | 'subject'
  | 'topic'
  | 'subtopic'
  | 'difficulty'
  | 'marks'
  | 'negativeMarks'
  | 'questionType'
  | 'type'
  | 'subjectCategory'
  | 'questionLanguage'
  | 'question'
  | 'questionHindi'
  | 'questionText'
  | 'text'
  | 'questionEnglish'
  | 'textHindi'
  | 'statements'
  | 'columnA'
  | 'columnB'
  | 'assertion'
  | 'assertionHindi'
  | 'reason'
  | 'reasonHindi'
  | 'options'
  | 'imageUrl'
  | 'diagramSvg'
  | 'currentAffairTopicId'
  | 'exams'
  | 'subjects'
  | 'region'
  | 'sourceIds'
  | 'date'
  | 'monthYear'
  | 'idealTimeSeconds'
  | 'originType'
  | 'pypSource'
  | 'examSource'
  | 'pypAppearances'
  | 'repeatedInExams'
  | 'similarQuestionIds'
  | 'moduleId'
  | 'chapterId'
  | 'chapterName'
  | 'chapter'
  | 'createdAt'
  | 'updatedAt'
> & { options: QuestionOption[] };

const STUDENT_QUESTION_FIELDS = [
  'id', 'uniqueQuestionId', 'authority', 'subCategory', 'postName', 'examName',
  'year', 'authorityId', 'programId', 'postId', 'seriesId', 'category',
  'subject', 'topic', 'subtopic', 'difficulty', 'marks', 'negativeMarks',
  'questionType', 'type', 'subjectCategory', 'questionLanguage', 'question',
  'questionHindi', 'questionText', 'text', 'questionEnglish', 'textHindi',
  'statements', 'columnA', 'columnB', 'assertion', 'assertionHindi', 'reason',
  'reasonHindi', 'options', 'imageUrl', 'diagramSvg', 'currentAffairTopicId',
  'exams', 'subjects', 'region', 'sourceIds', 'date', 'monthYear',
  'idealTimeSeconds', 'originType', 'pypSource', 'examSource', 'pypAppearances',
  'repeatedInExams', 'similarQuestionIds', 'moduleId', 'chapterId',
  'chapterName', 'chapter', 'createdAt', 'updatedAt',
] as const;

/** Remove answer keys, explanations, and unknown fields by explicit allowlist. */
export function toStudentQuestion(question: Question | Record<string, unknown>): StudentQuestion {
  const source = question as Record<string, unknown>;
  const projected: Record<string, unknown> = {};
  for (const field of STUDENT_QUESTION_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(source, field)) projected[field] = source[field];
  }
  return projected as StudentQuestion;
}

export function toStudentQuestions(questions: Array<Question | Record<string, unknown>>): StudentQuestion[] {
  return questions.map(toStudentQuestion);
}
