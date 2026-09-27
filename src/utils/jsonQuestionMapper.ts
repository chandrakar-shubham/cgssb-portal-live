import { Question, QuestionOption, QuestionType, SubjectCategory, DifficultyLevel, ExamCategory } from '../types';
import { autoClassifyChapter } from './pypEngine';
import { extractStatementsFromStem } from './statementParser';

/**
 * Raw input format matching external PDF-to-JSON converters, AI outputs, and standard spreadsheets
 */
export interface RawJsonQuestionInput {
  // S.No & ID
  'S.No.'?: number | string;
  'S. No.'?: number | string;
  sno?: number | string;
  Sno?: number | string;
  sl_no?: number | string;
  'Sl.No'?: number | string;
  id?: string;
  ID?: string;
  uniqueQuestionId?: string;

  // Exam Meta
  Examname?: string;
  examname?: string;
  examName?: string;
  ExamName?: string;
  'Exam Name'?: string;
  exam_name?: string;
  Exam?: string;
  exam?: string;
  Year?: number | string;
  year?: number | string;
  examYear?: number | string;
  YearOfExam?: number | string;
  authority?: string;
  Authority?: string;
  category?: string;
  Category?: string;
  subCategory?: string;
  SubCategory?: string;
  postName?: string;
  PostName?: string;

  // Taxonomy & Subject
  Subject?: string;
  subject?: string;
  SubjectName?: string;
  subject_name?: string;
  subjectName?: string;
  'विषय'?: string;

  Topic?: string;
  topic?: string;
  TopicName?: string;
  topic_name?: string;
  topicName?: string;
  Chapter?: string;
  chapter?: string;
  chapterName?: string;
  'अध्याय'?: string;
  'टॉपिक'?: string;

  Subtopic?: string;
  subtopic?: string;
  SubTopic?: string;
  subTopic?: string;
  sub_topic?: string;
  subtopicName?: string;
  'उपविषय'?: string;

  SubjectCategory?: string;
  subjectCategory?: string;
  subject_category?: string;
  isLanguage?: boolean;

  // Question Type & Difficulty
  QuestionType?: string;
  questionType?: string;
  question_type?: string;
  type?: string;
  Type?: string;
  format?: string;
  category_type?: string;

  Difficulty?: string;
  difficulty?: string;
  difficultyLevel?: string;
  level?: string;
  Level?: string;

  // Question Text Stems
  'Question(Hindi)'?: string;
  'Question(hindi)'?: string;
  'Question (Hindi)'?: string;
  'Question (hindi)'?: string;
  'Question(hi)'?: string;
  'Question (hi)'?: string;
  Question_Hindi?: string;
  question_hindi?: string;
  question_hi?: string;
  questionHindi?: string;
  textHindi?: string;
  stem_hi?: string;
  'प्रश्न'?: string;

  'Question(English)'?: string;
  'Question(english)'?: string;
  'Question (English)'?: string;
  'Question (english)'?: string;
  'Question(en)'?: string;
  'Question (en)'?: string;
  Question_English?: string;
  question_english?: string;
  question_en?: string;
  questionEnglish?: string;
  question?: string;
  questionText?: string;
  text?: string;
  stem?: string;
  stem_en?: string;
  prompt?: string;
  statement?: string;

  // Structured Components
  options?: any[] | Record<string, any>;
  statements?: any[];
  Statements?: any[];
  columnA?: any[];
  columnB?: any[];

  // Assertion & Reason
  assertion?: string;
  Assertion?: string;
  assertion_en?: string;
  assertion_english?: string;
  assertionEnglish?: string;
  assertionText?: string;
  'Assertion (A)'?: string;
  'Assertion [A]'?: string;
  'Assertion(A)'?: string;
  'अभिकथन'?: string;
  'अभिकथन (A)'?: string;
  'अभिकथन [A]'?: string;
  'कथन'?: string;

  assertionHindi?: string;
  assertion_hi?: string;
  assertion_hindi?: string;

  reason?: string;
  Reason?: string;
  reason_en?: string;
  reason_english?: string;
  reasonEnglish?: string;
  reasonText?: string;
  'Reason (R)'?: string;
  'Reason [R]'?: string;
  'Reason(R)'?: string;
  'कारण'?: string;
  'कारण (R)'?: string;
  'कारण [R]'?: string;

  reasonHindi?: string;
  reason_hi?: string;
  reason_hindi?: string;

  // Bilingual Flat Option Keys
  option_A_en?: string;
  option_A_hi?: string;
  option_B_en?: string;
  option_B_hi?: string;
  option_C_en?: string;
  option_C_hi?: string;
  option_D_en?: string;
  option_D_hi?: string;

  option_a_en?: string;
  option_a_hi?: string;
  option_b_en?: string;
  option_b_hi?: string;
  option_c_en?: string;
  option_c_hi?: string;
  option_d_en?: string;
  option_d_hi?: string;

  optionA_en?: string;
  optionA_hi?: string;
  optionB_en?: string;
  optionB_hi?: string;
  optionC_en?: string;
  optionC_hi?: string;
  optionD_en?: string;
  optionD_hi?: string;

  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  optionAHindi?: string;
  optionBHindi?: string;
  optionCHindi?: string;
  optionDHindi?: string;
  optionA_Hindi?: string;
  optionB_Hindi?: string;
  optionC_Hindi?: string;
  optionD_Hindi?: string;

  option_A?: string;
  option_B?: string;
  option_C?: string;
  option_D?: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;

  'Option A'?: string;
  'Option B'?: string;
  'Option C'?: string;
  'Option D'?: string;
  'OptionA'?: string;
  'OptionB'?: string;
  'OptionC'?: string;
  'OptionD'?: string;
  A?: string;
  B?: string;
  C?: string;
  D?: string;
  '(A)'?: string;
  '(B)'?: string;
  '(C)'?: string;
  '(D)'?: string;

  // Answer Keys
  answer?: string | number;
  Answer?: string | number;
  ANSWER?: string | number;
  correctOption?: string | number;
  correct_option?: string | number;
  correctAnswer?: string | number;
  correct_answer?: string | number;
  ans?: string | number;
  Ans?: string | number;
  ANS?: string | number;
  key?: string | number;
  Key?: string | number;
  modelKey?: string;
  finalAmendedKey?: string;

  // Explanations
  explanation_en?: string;
  explanation_hi?: string;
  explanationHindi?: string;
  explanation_hindi?: string;
  explanationEnglish?: string;
  explanation?: string;
  explaination?: string;
  solution?: string;
  Solution?: string;
  sol?: string;
  'व्याख्या'?: string;
  'स्पष्टीकरण'?: string;

  // Scoring & Metrics
  marks?: number | string;
  Marks?: number | string;
  mark?: number | string;
  negativeMarks?: number | string;
  negative_marks?: number | string;
  negativeMarking?: number | string;
  penalty?: number | string;
  idealTimeSeconds?: number | string;
  imageUrl?: string;
  image_url?: string;
  image?: string;
  diagramUrl?: string;
  pypAppearances?: any[];
  originType?: 'mock' | 'pyq';
  pypSource?: string;
}

export interface QuestionMappingDefaults {
  authority?: string;
  category?: ExamCategory | string;
  examName?: string;
  postName?: string;
  subCategory?: string;
  year?: number;
  subject?: string;
  topic?: string;
  subtopic?: string;
  marks?: number;
  negativeMarks?: number;
  originType?: 'mock' | 'pyq';
}

/**
 * Maps raw JSON converted item into strict Question entity
 * Preserves all schemas, multi-types, bilingual texts, and auto-detects missing fields
 */
export function mapRawJsonToQuestion(
  raw: RawJsonQuestionInput,
  index: number = 0,
  defaults?: QuestionMappingDefaults
): Question {
  const examName = String(
    raw.Examname ||
    raw.examname ||
    raw.examName ||
    raw.ExamName ||
    raw['Exam Name'] ||
    raw.exam_name ||
    raw.Exam ||
    raw.exam ||
    defaults?.examName ||
    'CG Exam'
  ).trim();

  const yearNum = Number(
    raw.Year ||
    raw.year ||
    raw.examYear ||
    raw.YearOfExam ||
    defaults?.year ||
    2026
  );
  const year = isNaN(yearNum) ? 2026 : yearNum;

  const snoRaw = raw['S.No.'] ?? raw['S. No.'] ?? raw.sno ?? raw.Sno ?? raw.sl_no ?? raw['Sl.No'] ?? (index + 1);
  const snoNum = Number(snoRaw) || (index + 1);
  const paddedSno = String(snoNum).padStart(3, '0');

  // Slugify exam name for clean unique ID (e.g., CG-LECT-2026-001)
  const examSlug = examName
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/-+/g, '-')
    .toUpperCase()
    .slice(0, 12) || 'CG-EXAM';
  const generatedId = String(raw.id || raw.ID || raw.uniqueQuestionId || `${examSlug}-${year}-${paddedSno}`);

  // Question Stems
  const stemEnglish = String(
    raw['Question(English)'] ||
    raw['Question(english)'] ||
    raw['Question (English)'] ||
    raw['Question (english)'] ||
    raw['Question(en)'] ||
    raw['Question (en)'] ||
    raw.Question_English ||
    raw.question_english ||
    raw.question_en ||
    raw.questionEnglish ||
    raw.question ||
    raw.questionText ||
    raw.text ||
    raw.stem ||
    raw.stem_en ||
    raw.prompt ||
    raw.statement ||
    ''
  ).trim();

  const stemHindi = String(
    raw['Question(Hindi)'] ||
    raw['Question(hindi)'] ||
    raw['Question (Hindi)'] ||
    raw['Question (hindi)'] ||
    raw['Question(hi)'] ||
    raw['Question (hi)'] ||
    raw.Question_Hindi ||
    raw.question_hindi ||
    raw.question_hi ||
    raw.questionHindi ||
    raw.textHindi ||
    raw.stem_hi ||
    raw['प्रश्न'] ||
    ''
  ).trim();

  const combinedStem = `${stemEnglish} ${stemHindi}`.toLowerCase();

  // Column A and Column B resolution (handles array, stringified JSON, newline text, and key aliases)
  const parseColumnItems = (val: any, prefix: '1' | 'A'): any[] | undefined => {
    if (!val) return undefined;
    if (Array.isArray(val) && val.length > 0) {
      return val.map((item, idx) => {
        if (typeof item === 'string') {
          const id = prefix === '1' ? String(idx + 1) : String.fromCharCode(65 + idx);
          return { id, text: item, textHindi: item };
        }
        return {
          id: String(item.id || item.label || (prefix === '1' ? idx + 1 : String.fromCharCode(65 + idx))),
          text: String(item.text || item.textEnglish || item.title || item.value || ''),
          textHindi: String(item.textHindi || item.text || item.textEnglish || item.value || ''),
        };
      });
    }
    if (typeof val === 'string' && val.trim().length > 0) {
      const trimmed = val.trim();
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) return parseColumnItems(parsed, prefix);
        } catch {
          // ignore json parse failure
        }
      }
      // Newline-separated list
      const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length > 0) {
        return lines.map((line, idx) => {
          const id = prefix === '1' ? String(idx + 1) : String.fromCharCode(65 + idx);
          const clean = line.replace(/^[0-9A-Za-z]+[\.\:\)\-]\s*/, '');
          return { id, text: clean || line, textHindi: clean || line };
        });
      }
    }
    return undefined;
  };

  const rawColA = raw.columnA || (raw as any)['Column A'] || (raw as any)['ColumnA'] || (raw as any).column_a || (raw as any).column1 || (raw as any)['Column 1'] || (raw as any)['List-I'] || (raw as any)['List I'] || (raw as any)['सूची-I'] || (raw as any)['सूची I'] || (raw as any)['सूची 1'] || (raw as any).list1 || (raw as any).listA;
  const rawColB = raw.columnB || (raw as any)['Column B'] || (raw as any)['ColumnB'] || (raw as any).column_b || (raw as any).column2 || (raw as any)['Column 2'] || (raw as any)['List-II'] || (raw as any)['List II'] || (raw as any)['सूची-II'] || (raw as any)['सूची II'] || (raw as any)['सूची 2'] || (raw as any).list2 || (raw as any).listB;
  const columnA = parseColumnItems(rawColA, '1');
  const columnB = parseColumnItems(rawColB, 'A');

  // Assertion and Reason resolution (handles key aliases and inline extraction)
  let assertionEn = String(
    raw.assertion ||
    raw.Assertion ||
    raw['Assertion (A)'] ||
    raw['Assertion [A]'] ||
    raw['Assertion(A)'] ||
    raw.assertion_en ||
    raw.assertion_english ||
    raw.assertionEnglish ||
    raw.assertionText ||
    raw['अभिकथन'] ||
    raw['अभिकथन (A)'] ||
    raw['अभिकथन [A]'] ||
    raw['कथन'] ||
    ''
  ).trim();

  let assertionHi = String(
    raw.assertionHindi ||
    raw.assertion_hi ||
    raw.assertion_hindi ||
    raw['अभिकथन'] ||
    raw['अभिकथन (A)'] ||
    raw['अभिकथन [A]'] ||
    assertionEn
  ).trim();

  let reasonEn = String(
    raw.reason ||
    raw.Reason ||
    raw['Reason (R)'] ||
    raw['Reason [R]'] ||
    raw['Reason(R)'] ||
    raw.reason_en ||
    raw.reason_english ||
    raw.reasonEnglish ||
    raw.reasonText ||
    raw['कारण'] ||
    raw['कारण (R)'] ||
    raw['कारण [R]'] ||
    ''
  ).trim();

  let reasonHi = String(
    raw.reasonHindi ||
    raw.reason_hi ||
    raw.reason_hindi ||
    raw['कारण'] ||
    raw['कारण (R)'] ||
    raw['कारण [R]'] ||
    reasonEn
  ).trim();

  if (!assertionEn && !reasonEn) {
    const inlineMatch = (stemEnglish || stemHindi).match(/(.*?)(?:Assertion|अभिकथन)\s*[\(\[]A[\)\]]?[:\s]+(.*?)(?:Reason|कारण)\s*[\(\[]R[\)\]]?[:\s]+(.*)/i);
    if (inlineMatch) {
      assertionEn = inlineMatch[2].trim();
      reasonEn = inlineMatch[3].trim();
      if (!assertionHi) assertionHi = assertionEn;
      if (!reasonHi) reasonHi = reasonEn;
    }
  }

  // Question Type: 'mcq' | 'matching' | 'assertion_reason' | 'multi_statement'
  let questionType: QuestionType = 'mcq';
  const rawType = String(
    raw.QuestionType ||
    raw.questionType ||
    raw.question_type ||
    raw.type ||
    raw.Type ||
    raw.format ||
    raw.category_type ||
    ''
  ).toLowerCase();

  if (
    rawType.includes('match') ||
    Boolean(columnA && columnB) ||
    combinedStem.includes('match the') ||
    combinedStem.includes('सुमेलित') ||
    combinedStem.includes('list-i') ||
    combinedStem.includes('सूची-i')
  ) {
    questionType = 'matching';
  } else if (
    rawType.includes('assertion') ||
    rawType.includes('reason') ||
    rawType.includes('अभिकथन') ||
    rawType.includes('a/r') ||
    rawType.includes('ar') ||
    Boolean(assertionEn || reasonEn) ||
    (combinedStem.includes('assertion') && combinedStem.includes('reason')) ||
    (combinedStem.includes('अभिकथन') && combinedStem.includes('कारण')) ||
    combinedStem.includes('labelled as assertion') ||
    combinedStem.includes('labelled as reason') ||
    combinedStem.includes('assertion [a]') ||
    combinedStem.includes('assertion (a)') ||
    combinedStem.includes('अभिकथन (a)') ||
    combinedStem.includes('अभिकथन [a]')
  ) {
    questionType = 'assertion_reason';
  }

  // Multi-statement segment auto-detection if not structured in raw input
  let finalStatements = raw.statements || (raw as any).Statements || (raw as any).statementList || (raw as any).segments;
  if (Array.isArray(finalStatements) && finalStatements.length > 0) {
    finalStatements = finalStatements.map((seg: any, idx: number) => {
      if (typeof seg === 'string') {
        const id = String(idx + 1);
        return { id, label: id, text: seg, textHindi: seg };
      }
      const label = String(seg.label || seg.id || idx + 1);
      return {
        id: label,
        label: label,
        text: String(seg.text || seg.textEnglish || ''),
        textHindi: String(seg.textHindi || seg.text || seg.textEnglish || ''),
      };
    });
  }

  const parsedEn = stemEnglish ? extractStatementsFromStem(stemEnglish) : null;
  const parsedHi = stemHindi ? extractStatementsFromStem(stemHindi) : null;

  if (rawType.includes('statement') || rawType.includes('multi') || (Array.isArray(finalStatements) && finalStatements.length > 0)) {
    questionType = 'multi_statement';
  } else if (questionType !== 'assertion_reason' && questionType !== 'matching' && (parsedEn?.hasSegments || parsedHi?.hasSegments)) {
    questionType = 'multi_statement';
    const primary = parsedEn?.hasSegments ? parsedEn : parsedHi!;
    const secondary = parsedEn?.hasSegments ? parsedHi : null;
    finalStatements = primary.segments.map((seg, idx) => ({
      id: seg.id,
      label: seg.label,
      text: seg.text,
      textHindi: secondary?.segments[idx]?.text || seg.text,
    }));
  }

  // Subject Category: 'language' | 'non_language'
  let rawSubj = String(
    raw.Subject ||
    raw.subject ||
    raw.SubjectName ||
    raw.subject_name ||
    raw.subjectName ||
    raw['विषय'] ||
    defaults?.subject ||
    ''
  ).trim();

  let subjectCategory: SubjectCategory = 'non_language';
  const rawSubjCat = String(raw.SubjectCategory || raw.subjectCategory || raw.subject_category || '').toLowerCase();
  if (rawSubjCat === 'language' || raw.isLanguage === true) {
    subjectCategory = 'language';
  } else {
    const subjLower = rawSubj.toLowerCase();
    if (
      subjLower.includes('english') ||
      subjLower.includes('hindi') ||
      subjLower.includes('chhattisgarhi') ||
      subjLower.includes('sanskrit') ||
      subjLower.includes('urdu')
    ) {
      subjectCategory = 'language';
    }
  }

  // Language mode
  const questionLanguage = stemEnglish && stemHindi ? 'both' : stemHindi ? 'hi' : 'en';

  // Options Parsing (supports arrays, dictionary object, or top-level flat keys)
  let options: QuestionOption[] = [];
  const rawOptions = raw.options;

  if (Array.isArray(rawOptions) && rawOptions.length > 0) {
    options = rawOptions.map((opt: any, idx: number) => {
      if (typeof opt === 'string') {
        const letter = (['A', 'B', 'C', 'D', 'E'][idx] || String.fromCharCode(65 + idx)) as 'A' | 'B' | 'C' | 'D';
        return { label: letter, id: letter, text: opt, textHindi: opt };
      }
      const rawLabel = String(opt.label || opt.id || ['A', 'B', 'C', 'D', 'E'][idx] || 'A').toUpperCase();
      const label = (['A', 'B', 'C', 'D', 'E'].includes(rawLabel) ? rawLabel : String.fromCharCode(65 + idx)) as 'A' | 'B' | 'C' | 'D';
      const id = label;
      const textEn = String(opt.text ?? opt.textEnglish ?? opt.option ?? opt.option_en ?? opt.value ?? opt.val ?? '').trim();
      const textHi = String(opt.textHindi ?? opt.option_hi ?? opt.text ?? opt.value ?? textEn).trim();
      return {
        label,
        id,
        text: textEn || textHi,
        textHindi: textHi || textEn,
      };
    });
  } else if (rawOptions && typeof rawOptions === 'object' && !Array.isArray(rawOptions)) {
    // Dictionary format: { "A": "Text", "B": "Text" }
    options = Object.entries(rawOptions).map(([key, val]: [string, any], idx) => {
      const letter = (key.toUpperCase().replace(/[^A-E]/g, '') || ['A', 'B', 'C', 'D'][idx] || 'A') as 'A' | 'B' | 'C' | 'D';
      const textVal = typeof val === 'string' ? val : String(val?.text || val?.value || val?.textEnglish || '');
      const textHiVal = typeof val === 'object' && val?.textHindi ? String(val.textHindi) : textVal;
      return {
        label: letter,
        id: letter,
        text: textVal || textHiVal,
        textHindi: textHiVal || textVal,
      };
    });
  } else {
    // Top-level flat keys
    const optionA_en = String(
      raw.option_A_en ??
      raw.option_a_en ??
      raw.optionA_en ??
      raw.optionA ??
      raw.option_A ??
      raw.option_a ??
      raw['Option A'] ??
      raw.OptionA ??
      raw.A ??
      raw['(A)'] ??
      ''
    ).trim();

    const optionA_hi = String(
      raw.option_A_hi ??
      raw.option_a_hi ??
      raw.optionA_hi ??
      raw.optionAHindi ??
      raw.optionA_Hindi ??
      optionA_en
    ).trim();

    const optionB_en = String(
      raw.option_B_en ??
      raw.option_b_en ??
      raw.optionB_en ??
      raw.optionB ??
      raw.option_B ??
      raw.option_b ??
      raw['Option B'] ??
      raw.OptionB ??
      raw.B ??
      raw['(B)'] ??
      ''
    ).trim();

    const optionB_hi = String(
      raw.option_B_hi ??
      raw.option_b_hi ??
      raw.optionB_hi ??
      raw.optionBHindi ??
      raw.optionB_Hindi ??
      optionB_en
    ).trim();

    const optionC_en = String(
      raw.option_C_en ??
      raw.option_c_en ??
      raw.optionC_en ??
      raw.optionC ??
      raw.option_C ??
      raw.option_c ??
      raw['Option C'] ??
      raw.OptionC ??
      raw.C ??
      raw['(C)'] ??
      ''
    ).trim();

    const optionC_hi = String(
      raw.option_C_hi ??
      raw.option_c_hi ??
      raw.optionC_hi ??
      raw.optionCHindi ??
      raw.optionC_Hindi ??
      optionC_en
    ).trim();

    const optionD_en = String(
      raw.option_D_en ??
      raw.option_d_en ??
      raw.optionD_en ??
      raw.optionD ??
      raw.option_D ??
      raw.option_d ??
      raw['Option D'] ??
      raw.OptionD ??
      raw.D ??
      raw['(D)'] ??
      ''
    ).trim();

    const optionD_hi = String(
      raw.option_D_hi ??
      raw.option_d_hi ??
      raw.optionD_hi ??
      raw.optionDHindi ??
      raw.optionD_Hindi ??
      optionD_en
    ).trim();

    options = [
      { label: 'A', id: 'A', text: optionA_en || optionA_hi || 'Option A', textHindi: optionA_hi || optionA_en || 'विकल्प A' },
      { label: 'B', id: 'B', text: optionB_en || optionB_hi || 'Option B', textHindi: optionB_hi || optionB_en || 'विकल्प B' },
      { label: 'C', id: 'C', text: optionC_en || optionC_hi || 'Option C', textHindi: optionC_hi || optionC_en || 'विकल्प C' },
      { label: 'D', id: 'D', text: optionD_en || optionD_hi || 'Option D', textHindi: optionD_hi || optionD_en || 'विकल्प D' },
    ];
  }

  // Correct Answer: supports correctOption, correctAnswer, and answer aliases
  const rawAnsStr = String(
    raw.correctOption ??
    raw.correct_option ??
    raw.correctAnswer ??
    raw.correct_answer ??
    raw.answer ??
    raw.Answer ??
    raw.ANSWER ??
    raw.ans ??
    raw.Ans ??
    raw.ANS ??
    raw.key ??
    raw.Key ??
    raw.modelKey ??
    'A'
  ).trim();

  let correctOption: 'A' | 'B' | 'C' | 'D' = 'A';
  const cleanAns = rawAnsStr.replace(/[\(\)\[\]\.\:\s]/g, '').toUpperCase();

  if (cleanAns === 'A' || cleanAns === '1' || cleanAns === 'अ' || cleanAns === 'A)') correctOption = 'A';
  else if (cleanAns === 'B' || cleanAns === '2' || cleanAns === 'ब' || cleanAns === 'B)') correctOption = 'B';
  else if (cleanAns === 'C' || cleanAns === '3' || cleanAns === 'स' || cleanAns === 'C)') correctOption = 'C';
  else if (cleanAns === 'D' || cleanAns === '4' || cleanAns === 'द' || cleanAns === 'D)') correctOption = 'D';
  else if (cleanAns.includes('B') || cleanAns.includes('2')) correctOption = 'B';
  else if (cleanAns.includes('C') || cleanAns.includes('3')) correctOption = 'C';
  else if (cleanAns.includes('D') || cleanAns.includes('4')) correctOption = 'D';

  // Explanations
  const explanation = String(
    raw.explanation_en ||
    raw.explanation ||
    raw.explaination ||
    raw.explanationEnglish ||
    raw.solution ||
    raw.Solution ||
    raw.sol ||
    ''
  ).trim();

  const explanationHindi = String(
    raw.explanation_hi ||
    raw.explanationHindi ||
    raw.explanation_hindi ||
    raw['व्याख्या'] ||
    raw['स्पष्टीकरण'] ||
    explanation
  ).trim();

  // Difficulty
  const rawDiff = String(
    raw.Difficulty ||
    raw.difficulty ||
    raw.difficultyLevel ||
    raw.level ||
    raw.Level ||
    'Medium'
  ).toLowerCase();

  const difficulty: DifficultyLevel = rawDiff.includes('easy') ? 'Easy' : rawDiff.includes('hard') ? 'Hard' : 'Medium';

  // Topic & Subject Resolution:
  // If the raw JSON includes Subject and Topic, preserve them faithfully.
  // Otherwise, use defaults if supplied, or fallback to autoClassifyChapter.
  let topic = String(
    raw.Topic ||
    raw.topic ||
    raw.TopicName ||
    raw.topic_name ||
    raw.topicName ||
    raw.Chapter ||
    raw.chapter ||
    raw.chapterName ||
    raw['अध्याय'] ||
    raw['टॉपिक'] ||
    defaults?.topic ||
    ''
  ).trim();

  let subtopic = String(
    raw.Subtopic ||
    raw.subtopic ||
    raw.SubTopic ||
    raw.subTopic ||
    raw.sub_topic ||
    raw.subtopicName ||
    raw['उपविषय'] ||
    defaults?.subtopic ||
    'General'
  ).trim();

  if (!rawSubj || !topic) {
    const opt0Hi = options[0]?.textHindi || options[0]?.text || '';
    const opt1Hi = options[1]?.textHindi || options[1]?.text || '';
    const detected = autoClassifyChapter(
      `${stemHindi} ${stemEnglish} ${opt0Hi} ${opt1Hi}`,
      'Chhattisgarh General Studies',
      `${examName} (${year}) Official`
    );
    rawSubj = rawSubj || defaults?.subject || detected.subject;
    topic = topic || defaults?.topic || detected.topic;
    subtopic = subtopic || defaults?.subtopic || detected.subtopic || 'General';
  }

  // Marks and negativeMarks
  const marks = Number(raw.marks || raw.Marks || raw.mark || defaults?.marks) || 1;
  const negativeMarks = Number(
    raw.negativeMarks ||
    raw.negative_marks ||
    raw.negativeMarking ||
    raw.penalty ||
    defaults?.negativeMarks
  ) || 0.25;

  // Ideal Topper time calculation (Benchmark seconds per question)
  let idealSeconds = 50;
  if (difficulty === 'Easy') idealSeconds = 35;
  else if (difficulty === 'Hard') idealSeconds = 75;
  if (questionType === 'matching' || questionType === 'multi_statement') idealSeconds += 20;

  const rawAuthority = raw.authority || raw.Authority || defaults?.authority || (examName.toLowerCase().includes('psc') ? 'CGPSC' : 'CGSSB');
  const rawCategory = raw.category || raw.Category || defaults?.category || (examName.toLowerCase().includes('psc') ? 'CGPSC' : 'CGSSB');

  const originType = raw.originType || defaults?.originType || (examName.toLowerCase().includes('pyp') || examName.toLowerCase().includes('official') ? 'pyq' : 'mock');

  return {
    id: generatedId,
    uniqueQuestionId: generatedId,
    authority: rawAuthority,
    category: rawCategory as ExamCategory,
    subCategory: raw.subCategory || raw.SubCategory || defaults?.subCategory || examName,
    postName: raw.postName || raw.PostName || defaults?.postName || 'CG Candidate Exam',
    examName,
    year,
    subject: rawSubj,
    topic,
    subtopic: subtopic || 'General',
    difficulty,
    marks,
    negativeMarks,
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
    explanationHindi: explanationHindi || explanation,
    idealTimeSeconds: Number(raw.idealTimeSeconds) || idealSeconds,
    originType,
    imageUrl: raw.imageUrl || raw.image_url || raw.image || raw.diagramUrl || undefined,
    pypAppearances: Array.isArray(raw.pypAppearances)
      ? raw.pypAppearances
      : (raw.pypSource ? [{ examName: raw.pypSource, year }] : (examName ? [{ examName, year }] : [])),
    statements: finalStatements,
    columnA,
    columnB,
    assertion: assertionEn || undefined,
    assertionHindi: assertionHi || assertionEn || undefined,
    reason: reasonEn || undefined,
    reasonHindi: reasonHi || reasonEn || undefined,
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
      q['Question(Hindi)'] ||
      q['Question(English)'] ||
      q['Question(english)'] ||
      q['Question (Hindi)'] ||
      q['Question (English)'] ||
      q.questionHindi ||
      q.questionEnglish ||
      q.question ||
      q.questionText ||
      q.text ||
      q.stem ||
      q.prompt
    );
    if (!hasStem) {
      errors.push(`Item #${rowNum} is missing question text (Question(English) or Question(Hindi)).`);
    }

    // Has answer
    const ans = q.answer || q.Answer || q.correctOption || q.correctAnswer || q.ans || q.key;
    if (!ans) {
      errors.push(`Item #${rowNum} is missing 'correctOption', 'correctAnswer', or 'answer' (A, B, C, or D).`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}
