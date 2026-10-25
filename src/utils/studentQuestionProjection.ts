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
    if (!Object.prototype.hasOwnProperty.call(source, field)) continue;

    const value = source[field];
    // Nested objects need their own allowlists: copying `options`, `statements`,
    // or matching columns wholesale could leak answer markers added by future
    // importers even when the top-level question fields are safe.
    if (field === 'options' && Array.isArray(value)) {
      projected[field] = value.map(option => {
        if (!option || typeof option !== 'object') return {};
        const item = option as Record<string, unknown>;
        const safe: Record<string, unknown> = {};
        for (const key of ['label', 'id', 'text', 'textHindi']) {
          if (Object.prototype.hasOwnProperty.call(item, key)) safe[key] = item[key];
        }
        return safe;
      });
    } else if (['statements', 'columnA', 'columnB'].includes(field) && Array.isArray(value)) {
      projected[field] = value.map(entry => {
        if (!entry || typeof entry !== 'object') return {};
        const item = entry as Record<string, unknown>;
        const safe: Record<string, unknown> = {};
        for (const key of ['id', 'text', 'textHindi']) {
          if (Object.prototype.hasOwnProperty.call(item, key)) safe[key] = item[key];
        }
        return safe;
      });
    } else {
      projected[field] = value;
    }
  }
  return projected as StudentQuestion;
}

export function toStudentQuestions(questions: Array<Question | Record<string, unknown>>): StudentQuestion[] {
  return questions.map(toStudentQuestion);
}
