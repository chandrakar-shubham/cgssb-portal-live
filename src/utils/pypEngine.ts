import {
  Question,
  ExamCategory,
  PreviousYearPaper,
  MockTest,
  BulkImportQuestion,
  PYQAppearance
} from '../types';

export type ExamPreset = 'CGSSB' | 'CGPSC' | 'HOSTEL_WARDEN' | 'CG_TEACHER';

export interface ExamPresetConfig {
  name: string;
  category: ExamCategory;
  marksPerQ: number;
  negativeMarksPerQ: number;
  durationMinutes: number;
  defaultModule: string;
}

export const EXAM_PRESETS: Record<ExamPreset, ExamPresetConfig> = {
  CGSSB: {
    name: 'CGSSB / CG Vyapam Combined Exam Standard',
    category: 'CGSSB',
    marksPerQ: 1.0,
    negativeMarksPerQ: 0.33,
    durationMinutes: 180,
    defaultModule: 'cg_special'
  },
  CGPSC: {
    name: 'CGPSC State Service Prelims (Paper-I GS)',
    category: 'CGPSC',
    marksPerQ: 2.0,
    negativeMarksPerQ: 0.67,
    durationMinutes: 120,
    defaultModule: 'cg_special'
  },
  HOSTEL_WARDEN: {
    name: 'CGSSB Hostel Warden (छात्रावास अधीक्षक)',
    category: 'CGSSB',
    marksPerQ: 1.0,
    negativeMarksPerQ: 0.25,
    durationMinutes: 150,
    defaultModule: 'computer'
  },
  CG_TEACHER: {
    name: 'CG Teacher Eligibility / Atmanand Recruitment',
    category: 'SWAMI_ATMANAND',
    marksPerQ: 1.0,
    negativeMarksPerQ: 0.33,
    durationMinutes: 150,
    defaultModule: 'cdp_education'
  }
};

/**
 * Generates an official unique question identifier:
 * e.g. QID-CGSSB-2024-001 or QID-CGPSC-2023-042
 */
export function generateUniqueQuestionId(
  category: ExamCategory | string,
  year: number,
  sequenceNum: number
): string {
  let prefix = 'CGSSB';
  if (category.includes('CGPSC')) prefix = 'CGPSC';
  else if (category.includes('Teacher') || category.includes('TET') || category.includes('SWAMI')) prefix = 'CGTET';
  else if (category.includes('Police')) prefix = 'CGPOL';
  else if (category.includes('CENTRAL')) prefix = 'CENTRAL';

  const paddedNum = String(sequenceNum).padStart(3, '0');
  return `QID-${prefix}-${year}-${paddedNum}`;
}

/**
 * Calculates string similarity (Levenshtein-based token overlap) to detect repeated questions
 */
export function calculateQuestionSimilarity(q1Text: string, q2Text: string): number {
  if (!q1Text || !q2Text) return 0;
  
  const cleanTokens = (t: string) => 
    t.toLowerCase()
      .replace(/[^\w\s\u0900-\u097F]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2);

  const tokens1 = cleanTokens(q1Text);
  const tokens2 = cleanTokens(q2Text);

  if (tokens1.length === 0 || tokens2.length === 0) return 0;

  const set2 = new Set(tokens2);
  let matchCount = 0;

  tokens1.forEach(t => {
    if (set2.has(t)) matchCount++;
  });

  const overlap1 = matchCount / tokens1.length;
  const overlap2 = matchCount / tokens2.length;
  return Math.round(((overlap1 + overlap2) / 2) * 100);
}

/**
 * Finds questions in existing question bank that match above threshold (70%+)
 */
export function findSimilarQuestions(
  newQuestionText: string,
  existingBank: Question[],
  thresholdPercent = 65
): Array<Question & { similarityScore: number }> {
  if (!newQuestionText || !existingBank || existingBank.length === 0) return [];

  const matches: Array<Question & { similarityScore: number }> = [];

  for (const q of existingBank) {
    const text1 = q.questionText || q.text || '';
    const textHindi1 = q.questionHindi || q.textHindi || '';
    const scoreEn = calculateQuestionSimilarity(newQuestionText, text1);
    const scoreHi = textHindi1 ? calculateQuestionSimilarity(newQuestionText, textHindi1) : 0;
    const maxScore = Math.max(scoreEn, scoreHi);

    if (maxScore >= thresholdPercent) {
      matches.push({
        ...q,
        similarityScore: maxScore
      });
    }
  }

  return matches.sort((a, b) => b.similarityScore - a.similarityScore);
}

/**
 * Classifies a question into Subject, Topic (Chapter), and Subtopic based on text content & taxonomy
 */
export function autoClassifyChapter(text: string, defaultSubject: string, defaultTopic: string) {
  const lower = text.toLowerCase();

  // 1. History of Chhattisgarh (इतिहास)
  if (
    lower.includes('कलचुरी') || lower.includes('kalchuri') ||
    lower.includes('रतनपुर') || lower.includes('ratanpur') ||
    lower.includes('तुम्माण') || lower.includes('tumman') ||
    lower.includes('मराठा') || lower.includes('maratha') ||
    lower.includes('विद्रोह') || lower.includes('revolt') ||
    lower.includes('भूमकाल') || lower.includes('bhumkal') ||
    lower.includes('काकतीय') || lower.includes('kakatiya') ||
    lower.includes('गठन') || lower.includes('formation') ||
    lower.includes('राज्य') && (lower.includes('वर्ष') || lower.includes('स्थापना'))
  ) {
    return {
      subject: 'Chhattisgarh Special Knowledge',
      topic: 'History of Chhattisgarh',
      chapterName: 'History of Chhattisgarh (छत्तीसगढ़ का इतिहास)',
      subtopic: lower.includes('कलचुरी') || lower.includes('kalchuri')
        ? 'Kalchuri Dynasty'
        : lower.includes('विद्रोह') || lower.includes('revolt')
        ? 'Tribal Revolts & Freedom Struggle'
        : 'Modern State Formation (2000)'
    };
  }

  // 2. Geography, Rivers, Waterfalls & Minerals (भूगोल एवं प्राकृतिक संसाधन)
  if (
    lower.includes('जलप्रपात') || lower.includes('waterfall') ||
    lower.includes('नदी') || lower.includes('river') ||
    lower.includes('महानदी') || lower.includes('mahanadi') ||
    lower.includes('इंद्रावती') || lower.includes('indravati') ||
    lower.includes('चित्रकोट') || lower.includes('chitrakote') ||
    lower.includes('तीरथगढ़') || lower.includes('खनिज') ||
    lower.includes('mineral') || lower.includes('अभयारण्य') ||
    lower.includes('राष्ट्रीय उद्यान') || lower.includes('national park')
  ) {
    return {
      subject: 'Chhattisgarh Special Knowledge',
      topic: 'Geography & Natural Resources',
      chapterName: 'Geography & Natural Resources (भूगोल एवं नदियाँ)',
      subtopic: lower.includes('जलप्रपात') || lower.includes('नदी') || lower.includes('waterfall') || lower.includes('river')
        ? 'River Basins (Mahanadi, Indravati)'
        : lower.includes('खनिज') || lower.includes('mineral')
        ? 'Minerals & Industrial Zones'
        : 'Forests & National Parks'
    };
  }

  // 3. Culture, Tribes, Folk Dances & Tourism (संस्कृति, जनजातियां एवं पर्यटन)
  if (
    lower.includes('जनजाति') || lower.includes('tribe') ||
    lower.includes('गोंड') || lower.includes('बैगा') || lower.includes('माड़िया') ||
    lower.includes('दशहरा') || lower.includes('dussehra') ||
    lower.includes('बस्तर') || lower.includes('bastar') ||
    lower.includes('नृत्य') || lower.includes('dance') ||
    lower.includes('करमा') || lower.includes('पंथ') || lower.includes('राउत') ||
    lower.includes('दंतेश्वरी') || lower.includes('मड़ई') || lower.includes('मेला')
  ) {
    return {
      subject: 'Chhattisgarh Special Knowledge',
      topic: 'Culture, Tribes & Tourism',
      chapterName: 'Culture, Tribes & Tourism (संस्कृति एवं जनजातियाँ)',
      subtopic: lower.includes('दशहरा') || lower.includes('dussehra') || lower.includes('मेला')
        ? 'Bastar Dussehra & Madai Mela'
        : lower.includes('नृत्य') || lower.includes('dance')
        ? 'Folk Dances (Karma, Raut Nacha, Panthi)'
        : 'Tribal Traditions (Gond, Baiga, Maria)'
    };
  }

  // 4. Administration & Economy (प्रशासन, पंचायती राज एवं अर्थव्यवस्था)
  if (
    lower.includes('पंचायत') || lower.includes('panchayat') ||
    lower.includes('विधानसभा') || lower.includes('legislature') ||
    lower.includes('बजट') || lower.includes('budget') ||
    lower.includes('योजना') || lower.includes('scheme') ||
    lower.includes('जिला') || lower.includes('district')
  ) {
    return {
      subject: 'Chhattisgarh Special Knowledge',
      topic: 'Administration & Economy',
      chapterName: 'Administration & Economy (प्रशासन एवं अर्थव्यवस्था)',
      subtopic: lower.includes('पंचायत') || lower.includes('panchayat')
        ? 'Panchayati Raj & Urban Local Bodies'
        : 'State Budget & Welfare Schemes'
    };
  }

  // 5. Computer Knowledge (कंप्यूटर ज्ञान)
  if (
    lower.includes('computer') || lower.includes('कंप्यूटर') ||
    lower.includes('internet') || lower.includes('इंटरनेट') ||
    lower.includes('ram') || lower.includes('rom') || lower.includes('cpu') ||
    lower.includes('ms word') || lower.includes('excel') || lower.includes('software') ||
    lower.includes('hardware') || lower.includes('operating system')
  ) {
    return {
      subject: 'General Science & Computer Knowledge',
      topic: 'Computer Fundamentals (Vyapam)',
      chapterName: 'Computer Fundamentals (कंप्यूटर सामान्य ज्ञान)',
      subtopic: 'MS Office & Operating Systems'
    };
  }

  // 6. Language: Chhattisgarhi & Hindi (छत्तीसगढ़ी भाषा एवं व्याकरण)
  if (
    lower.includes('हाना') || lower.includes('कहावत') || lower.includes('मुहावरे') ||
    lower.includes('छत्तीसगढ़ी') || lower.includes('chhattisgarhi') ||
    lower.includes('संधि') || lower.includes('समास') || lower.includes('पर्यायवाची') ||
    lower.includes('विलोम') || lower.includes('वर्तनी')
  ) {
    return {
      subject: 'General Hindi & Chhattisgarhi Language',
      topic: lower.includes('छत्तीसगढ़ी') ? 'Chhattisgarhi Bhasha & Vyakaran' : 'Samanya Hindi',
      chapterName: lower.includes('छत्तीसगढ़ी') ? 'Chhattisgarhi Language (छत्तीसगढ़ी भाषा)' : 'General Hindi (सामान्य हिन्दी)',
      subtopic: lower.includes('हाना') ? 'Idioms & Proverbs (Hana)' : 'Sandhi & Samas'
    };
  }

  // 7. Reasoning & Quantitative Aptitude (तर्कशक्ति एवं गणित)
  if (
    lower.includes('प्रतिशत') || lower.includes('percentage') ||
    lower.includes('अनुपात') || lower.includes('ratio') ||
    lower.includes('लाभ') || lower.includes('हानि') || lower.includes('profit') ||
    lower.includes('रीजनिंग') || lower.includes('reasoning') ||
    lower.includes('coding') || lower.includes('रक्त संबंध') || lower.includes('blood relation')
  ) {
    return {
      subject: 'General Mental Ability & Reasoning',
      topic: lower.includes('प्रतिशत') || lower.includes('ratio') ? 'Quantitative Aptitude' : 'Analytical Reasoning',
      chapterName: 'Mental Ability & Mathematics (मानसिक योग्यता एवं गणित)',
      subtopic: 'Percentages & Profit-Loss'
    };
  }

  // Default fallback
  return {
    subject: defaultSubject,
    topic: defaultTopic,
    chapterName: defaultTopic,
    subtopic: 'General Topic'
  };
}

export interface ClientSideBulkImportParams {
  questions: BulkImportQuestion[];
  paperConfig: {
    title: string;
    examCategory: ExamCategory;
    year: number;
    durationMinutes: number;
    marks: number;
    negativeMarkingRatio: string;
    paperSummary: string;
    subjectsWeightage: { subject: string; questionCount: number; percentage: number }[];
  };
  existingQuestions?: Question[];
}

/**
 * High-performance client-side ingestion engine
 * Converts BulkImportQuestion[] to full Question[], PreviousYearPaper, and MockTest
 * Works completely offline or in static web hosting environments (like Hostinger)
 */
export function processBulkImportClientSide({
  questions: incomingList,
  paperConfig,
  existingQuestions = []
}: ClientSideBulkImportParams): {
  paper: PreviousYearPaper;
  mockTest: MockTest;
  questions: Question[];
} {
  const targetCategory: ExamCategory = paperConfig.examCategory || 'CGPSC';
  const catPrefix = targetCategory === 'CGPSC' ? 'CGPSC' : targetCategory === 'CENTRAL_EXAMS' ? 'CENTRAL' : 'CGSSB';
  const isCgpsc = targetCategory === 'CGPSC';
  const year = Number(paperConfig.year || 2024);
  const paperTitle = paperConfig.title || `${catPrefix} ${year} Official Paper`;

  const processedQuestions: Question[] = [];

  for (let idx = 0; idx < incomingList.length; idx++) {
    const item = incomingList[idx];
    const sno = Number(item['S.No.'] || idx + 1);
    const rawExamname = String(item.Examname || paperTitle).trim();
    const uniqueKey = item.uniqueQuestionId || `${catPrefix}-${year}-Q${String(sno).padStart(3, '0')}`;
    const questionId = `q-pyp-${uniqueKey.toLowerCase()}`;

    const questionHindi = String(item['Question(Hindi)'] || '').trim();
    const questionEnglish = String(item['Question(english)'] || '').trim();

    const optA = String(item.option_A || 'Option A').trim();
    const optB = String(item.option_B || 'Option B').trim();
    const optC = String(item.option_C || 'Option C').trim();
    const optD = String(item.option_D || 'Option D').trim();

    let answer: 'A' | 'B' | 'C' | 'D' = 'A';
    const rawAnswer = String(item.answer || 'A').toUpperCase().trim();
    if (['A', 'B', 'C', 'D'].includes(rawAnswer)) {
      answer = rawAnswer as 'A' | 'B' | 'C' | 'D';
    } else if (rawAnswer.includes('B')) {
      answer = 'B';
    } else if (rawAnswer.includes('C')) {
      answer = 'C';
    } else if (rawAnswer.includes('D')) {
      answer = 'D';
    }

    const explanation = String(item.explaination || `Official Answer: Option (${answer})`).trim();

    // Taxonomy & Chapter
    const defaultSubj = targetCategory === 'CGPSC'
      ? 'Chhattisgarh General Studies (CGPSC)'
      : targetCategory === 'CENTRAL_EXAMS'
      ? 'General Studies & Aptitude (Central)'
      : 'Chhattisgarh Special Knowledge';
    const defaultTopic = `${rawExamname} (${year}) Official`;

    const combinedText = `${questionHindi} ${questionEnglish} ${explanation}`;
    const classification = autoClassifyChapter(combinedText, defaultSubj, defaultTopic);

    const assignedSubject = String(item.subject || classification.subject);
    const assignedTopic = String(item.topic || classification.topic);
    const assignedChapterName = String(item.chapterName || item.chapter || classification.chapterName || assignedTopic);
    const assignedSubtopic = String(item.subtopic || classification.subtopic || `Question #${sno}`);

    const appearancesList: PYQAppearance[] = [{ examName: rawExamname, year, shift: 'Official' }];
    if (item.repeatedInExams) {
      const reps = Array.isArray(item.repeatedInExams) ? item.repeatedInExams : String(item.repeatedInExams).split(',');
      for (const r of reps) {
        const trimmed = String(r).trim();
        if (trimmed && !appearancesList.some(a => a.examName.toLowerCase() === trimmed.toLowerCase())) {
          appearancesList.push({ examName: trimmed, year, shift: 'Official' });
        }
      }
    }

    const formattedQ: Question = {
      id: questionId,
      uniqueQuestionId: uniqueKey,
      subject: assignedSubject,
      topic: assignedTopic,
      subtopic: assignedSubtopic,
      chapter: assignedChapterName,
      chapterName: assignedChapterName,
      chapterId: assignedChapterName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      difficulty: 'Medium',
      category: targetCategory,
      questionText: questionEnglish || questionHindi,
      questionHindi: questionHindi || questionEnglish,
      questionEnglish: questionEnglish || questionHindi,
      options: [
        { id: 'A', text: optA, textHindi: optA },
        { id: 'B', text: optB, textHindi: optB },
        { id: 'C', text: optC, textHindi: optC },
        { id: 'D', text: optD, textHindi: optD },
      ],
      correctOption: answer,
      correctAnswer: answer,
      marks: isCgpsc ? 2.0 : 1.0,
      negativeMarks: isCgpsc ? 0.667 : 0.333,
      explanation: explanation,
      explanationHindi: explanation,
      pypSource: `${rawExamname} ${year} (Q${sno})`,
      pypAppearances: appearancesList,
      repeatedInExams: appearancesList.map(a => `${a.examName} (${a.year})`),
      createdAt: new Date().toISOString().split('T')[0],
    };

    processedQuestions.push(formattedQ);
  }

  // Create Paper
  const paperId = `pyp-${catPrefix.toLowerCase()}-${year}-${Date.now()}`;
  const paper: PreviousYearPaper = {
    id: paperId,
    title: paperTitle,
    examCategory: targetCategory,
    year: year,
    totalQuestions: processedQuestions.length,
    durationMinutes: paperConfig.durationMinutes || (isCgpsc ? 120 : 180),
    marks: paperConfig.marks || (isCgpsc ? processedQuestions.length * 2 : processedQuestions.length),
    negativeMarkingRatio: paperConfig.negativeMarkingRatio || (isCgpsc ? '-⅓rd (0.667 Marks)' : '-⅓rd (0.33 Marks)'),
    paperSummary: paperConfig.paperSummary || `Official question paper archive for ${paperTitle} containing ${processedQuestions.length} bilingual questions.`,
    subjectsWeightage: paperConfig.subjectsWeightage || [
      { subject: isCgpsc ? 'Chhattisgarh General Studies' : 'Chhattisgarh Special Knowledge', questionCount: Math.round(processedQuestions.length * 0.5), percentage: 50 },
      { subject: 'General Aptitude, Reasoning & Language', questionCount: Math.round(processedQuestions.length * 0.5), percentage: 50 },
    ],
    downloadFileName: `${paperTitle.replace(/\s+/g, '_')}.pdf`,
    fileSize: '3.5 MB',
    isOfficialPaper: true,
    linkedQuestionIds: processedQuestions.map(q => q.id),
    linkedMockTestId: `test-from-${paperId}`,
  };

  // Create Mock Test
  const mockTest: MockTest = {
    id: `test-from-${paperId}`,
    title: `${paperTitle} (Real Exam Simulation)`,
    category: targetCategory,
    description: paper.paperSummary,
    durationMinutes: paper.durationMinutes,
    questionCount: processedQuestions.length,
    marksPerQuestion: isCgpsc ? 2.0 : 1.0,
    negativeMarksPerQuestion: isCgpsc ? 0.667 : 0.333,
    isPYP: true,
    pypYear: year,
    pypExamName: paperTitle,
    sections: [
      {
        id: `sec-${paperId}`,
        name: 'Official Question Paper',
        questionIds: processedQuestions.map(q => q.id),
      },
    ],
    attemptsCount: 0,
    isPublished: true,
    difficultyDistribution: { easy: 40, medium: 40, hard: 20 },
    createdAt: new Date().toISOString().split('T')[0],
  };

  return {
    paper,
    mockTest,
    questions: processedQuestions,
  };
}

