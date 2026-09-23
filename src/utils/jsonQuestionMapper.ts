import { Question, QuestionOption, QuestionType, SubjectCategory, DifficultyLevel, ExamCategory } from '../types';
import { autoClassifyChapter } from './pypEngine';

/**
 * Raw input format matching your external PDF-to-JSON converter
 */
export interface RawJsonQuestionInput {
  'S.No.'?: number | string;
  sno?: number | string;
  id?: string;
  Examname?: string;
  examname?: string;
  Year?: number | string;
  year?: number | string;
  Subject?: string;
  subject?: string;
  Topic?: string;
  topic?: string;
  Subtopic?: string;
  subtopic?: string;
  SubjectCategory?: string;
  subjectCategory?: string;
  QuestionType?: string;
  questionType?: string;
  type?: string;
  Difficulty?: string;
  difficulty?: string;
  'Question(Hindi)'?: string;
  'Question(English)'?: string;
  'Question(english)'?: string;
  questionHindi?: string;
  questionEnglish?: string;
  question?: string;
  questionText?: string;
  text?: string;
  textHindi?: string;
  options?: any[];
  statements?: any[];
  columnA?: any[];
  columnB?: any[];
  assertion?: string;
  assertionHindi?: string;
  reason?: string;
  reasonHindi?: string;
  option_A_en?: string;
  option_A_hi?: string;
  option_B_en?: string;
  option_B_hi?: string;
  option_C_en?: string;
  option_C_hi?: string;
  option_D_en?: string;
  option_D_hi?: string;
  // Fallbacks for legacy single option keys
  option_A?: string;
  option_B?: string;
  option_C?: string;
  option_D?: string;
  answer?: string;
  correctOption?: string;
  correctAnswer?: string;
  explanation_en?: string;
  explanation_hi?: string;
  explanationHindi?: string;
  explanation?: string;
  explaination?: string;
  marks?: number;
  negativeMarks?: number;
  idealTimeSeconds?: number;
  pypAppearances?: any[];
}

/**
 * Maps raw JSON converted item into strict Question entity
 * Preserves topic/subtopic auto-detection if missing in input
 */
export function mapRawJsonToQuestion(raw: RawJsonQuestionInput, index: number = 0): Question {
  const examName = String(raw.Examname || raw.examname || 'CG Exam').trim();
  const year = Number(raw.Year || raw.year || 2026);
  const snoRaw = raw['S.No.'] ?? raw.sno ?? (index + 1);
  const snoNum = Number(snoRaw) || (index + 1);
  const paddedSno = String(snoNum).padStart(3, '0');

  // Slugify exam name for clean unique ID (e.g., CG-LECT-2026-001)
  const examSlug = examName
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/-+/g, '-')
    .toUpperCase()
    .slice(0, 12);
  const generatedId = raw.id || `${examSlug}-${year}-${paddedSno}`;

  // Subject Category: 'language' | 'non_language'
  let subjectCategory: SubjectCategory = 'non_language';
  const rawSubjCat = String(raw.SubjectCategory || raw.subjectCategory || '').toLowerCase();
  if (rawSubjCat === 'language') {
    subjectCategory = 'language';
  } else {
    const rawSubj = String(raw.Subject || raw.subject || '').toLowerCase();
    if (rawSubj.includes('english') || rawSubj.includes('hindi') || rawSubj.includes('chhattisgarhi') || rawSubj.includes('sanskrit')) {
      subjectCategory = 'language';
    }
  }

  // Question Type: 'mcq' | 'matching' | 'assertion_reason' | 'multi_statement'
  // Supports both questionType and type aliases
  let questionType: QuestionType = 'mcq';
  const rawType = String(raw.QuestionType || raw.questionType || raw.type || '').toLowerCase();
  if (rawType.includes('match') || Array.isArray(raw.columnA)) {
    questionType = 'matching';
  } else if (rawType.includes('assertion') || rawType.includes('reason') || Boolean(raw.assertion)) {
    questionType = 'assertion_reason';
  } else if (rawType.includes('statement') || rawType.includes('multi') || (Array.isArray(raw.statements) && raw.statements.length > 0)) {
    questionType = 'multi_statement';
  }

  // Question Stems
  const stemEnglish = String(raw['Question(English)'] || raw['Question(english)'] || raw.questionEnglish || raw.question || raw.questionText || raw.text || '').trim();
  const stemHindi = String(raw['Question(Hindi)'] || raw.questionHindi || raw.textHindi || '').trim();

  // Language mode
  const questionLanguage = stemEnglish && stemHindi ? 'both' : stemHindi ? 'hi' : 'en';

  // Options (Supports both structured array options and legacy option_A... keys)
  let options: QuestionOption[] = [];

  if (Array.isArray(raw.options) && raw.options.length > 0) {
    options = raw.options.map((opt: any, idx: number) => {
      const rawLabel = String(opt.label || opt.id || String.fromCharCode(65 + idx)).toUpperCase();
      const label = (['A', 'B', 'C', 'D'].includes(rawLabel) ? rawLabel : undefined) as 'A' | 'B' | 'C' | 'D' | undefined;
      const id = String(opt.id || opt.label || rawLabel).toUpperCase();
      const textEn = String(opt.text ?? opt.textEnglish ?? opt.option ?? '').trim();
      const textHi = String(opt.textHindi ?? opt.text ?? textEn).trim();
      return {
        label,
        id,
        text: textEn || textHi,
        textHindi: textHi || textEn,
      };
    });
  } else {
    const optionA_en = String(raw.option_A_en ?? raw.option_A ?? '').trim();
    const optionA_hi = String(raw.option_A_hi ?? raw.option_A ?? optionA_en).trim();

    const optionB_en = String(raw.option_B_en ?? raw.option_B ?? '').trim();
    const optionB_hi = String(raw.option_B_hi ?? raw.option_B ?? optionB_en).trim();

    const optionC_en = String(raw.option_C_en ?? raw.option_C ?? '').trim();
    const optionC_hi = String(raw.option_C_hi ?? raw.option_C ?? optionC_en).trim();

    const optionD_en = String(raw.option_D_en ?? raw.option_D ?? '').trim();
    const optionD_hi = String(raw.option_D_hi ?? raw.option_D ?? optionD_en).trim();

    options = [
      { label: 'A', id: 'A', text: optionA_en || optionA_hi, textHindi: optionA_hi || optionA_en },
      { label: 'B', id: 'B', text: optionB_en || optionB_hi, textHindi: optionB_hi || optionB_en },
      { label: 'C', id: 'C', text: optionC_en || optionC_hi, textHindi: optionC_hi || optionC_en },
      { label: 'D', id: 'D', text: optionD_en || optionD_hi, textHindi: optionD_hi || optionD_en },
    ];
  }

  // Correct Answer: supports correctOption, correctAnswer, and answer aliases
  const rawAns = String(raw.correctOption || raw.correctAnswer || raw.answer || 'A').trim().toUpperCase();
  const validOptionLetters = ['A', 'B', 'C', 'D', 'E'];
  const correctOption: 'A' | 'B' | 'C' | 'D' = validOptionLetters.includes(rawAns)
    ? (rawAns as 'A' | 'B' | 'C' | 'D')
    : (rawAns.includes('B') ? 'B' : rawAns.includes('C') ? 'C' : rawAns.includes('D') ? 'D' : 'A');

  // Explanations
  const explanation = String(raw.explanation_en || raw.explanation || raw.explaination || '').trim();
  const explanationHindi = String(raw.explanation_hi || raw.explanationHindi || raw.explaination || explanation).trim();

  // Difficulty
  const rawDiff = String(raw.Difficulty || raw.difficulty || 'Medium').toLowerCase();
  const difficulty: DifficultyLevel = rawDiff.includes('easy') ? 'Easy' : rawDiff.includes('hard') ? 'Hard' : 'Medium';

  // Topic & Subject Resolution:
  // If the raw JSON includes Subject and Topic, preserve them.
  // Otherwise, use our existing high-accuracy auto-detection engine.
  let subject = String(raw.Subject || raw.subject || '').trim();
  let topic = String(raw.Topic || raw.topic || '').trim();
  let subtopic = String(raw.Subtopic || raw.subtopic || '').trim();

  if (!subject || !topic) {
    const opt0Hi = options[0]?.textHindi || options[0]?.text || '';
    const opt1Hi = options[1]?.textHindi || options[1]?.text || '';
    const detected = autoClassifyChapter(
      `${stemHindi} ${stemEnglish} ${opt0Hi} ${opt1Hi}`,
      'Chhattisgarh General Studies',
      `${examName} (${year}) Official`
    );
    subject = subject || detected.subject;
    topic = topic || detected.topic;
    subtopic = subtopic || detected.subtopic || 'General';
  }

  // Ideal Topper time calculation (Benchmark seconds per question)
  // Matching and Multi-statement take slightly more time than standard MCQs
  let idealSeconds = 50;
  if (difficulty === 'Easy') idealSeconds = 35;
  else if (difficulty === 'Hard') idealSeconds = 75;
  if (questionType === 'matching' || questionType === 'multi_statement') idealSeconds += 20;

  return {
    id: generatedId,
    uniqueQuestionId: generatedId,
    examName,
    year,
    category: (raw as any).category || (examName.toLowerCase().includes('psc') ? 'CGPSC' : 'CGSSB'),
    subject,
    topic,
    subtopic: subtopic || 'General',
    difficulty,
    marks: Number(raw.marks) || 1,
    negativeMarks: Number(raw.negativeMarks) || 0.25,
    questionType,
    type: questionType, // alias
    subjectCategory,
    questionLanguage,
    question: stemEnglish || stemHindi,
    questionHindi: stemHindi || stemEnglish,
    questionText: stemEnglish || stemHindi, // alias
    text: stemEnglish || stemHindi, // alias
    questionEnglish: stemEnglish, // alias
    options,
    correctOption,
    correctAnswer: correctOption, // alias
    explanation,
    explanationHindi,
    idealTimeSeconds: Number(raw.idealTimeSeconds) || idealSeconds,
    pypAppearances: Array.isArray(raw.pypAppearances) ? raw.pypAppearances : (examName ? [{ examName, year }] : []),
    statements: raw.statements,
    columnA: raw.columnA,
    columnB: raw.columnB,
    assertion: raw.assertion,
    assertionHindi: raw.assertionHindi,
    reason: raw.reason,
    reasonHindi: raw.reasonHindi,
  };
}

/**
 * Validates array of questions prior to bulk import
 */
export function validateBulkQuestions(questions: any[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!Array.isArray(questions) || questions.length === 0) {
    return { isValid: false, errors: ['JSON must be a non-empty array of question objects.'] };
  }

  questions.slice(0, 100).forEach((q, idx) => {
    const rowNum = idx + 1;
    if (!q || typeof q !== 'object') {
      errors.push(`Item #${rowNum} is not an object.`);
      return;
    }

    // Has question stem
    const hasStem = Boolean(
      q['Question(Hindi)'] || q['Question(English)'] || q['Question(english)'] ||
      q.questionHindi || q.questionEnglish || q.question || q.questionText
    );
    if (!hasStem) {
      errors.push(`Item #${rowNum} is missing question text (Question(English) or Question(Hindi)).`);
    }

    // Has answer (supports answer, correctOption, correctAnswer)
    const ans = q.answer || q.correctOption || q.correctAnswer;
    if (!ans) {
      errors.push(`Item #${rowNum} is missing 'correctOption', 'correctAnswer', or 'answer' (A, B, C, or D).`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}
