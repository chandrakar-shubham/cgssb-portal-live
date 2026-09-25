import fs from 'fs';
import path from 'path';
import { getPool, isMysqlActive, dbConfig } from './connection.ts';
import type {
  Question,
  MockTest,
  PreviousYearPaper,
  TestAttempt,
  ExamCategory,
  SectorAnalysis
} from '../../src/types.ts';
import {
  INITIAL_QUESTIONS,
  INITIAL_MOCK_TESTS,
  INITIAL_PYP_PAPERS,
  SAMPLE_USER_ATTEMPTS
} from '../../src/mockData.ts';

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'cgssb-db.json');

interface DatabaseShape {
  questions: Question[];
  mockTests: MockTest[];
  pypPapers: PreviousYearPaper[];
  attempts: TestAttempt[];
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadLocalJsonDb(): DatabaseShape {
  ensureDataDir();
  const mergeById = <T extends { id: string }>(initial: T[], saved?: T[]): T[] => {
    const map = new Map<string, T>();
    initial.forEach(item => { if (item && item.id) map.set(item.id, item); });
    if (Array.isArray(saved)) {
      saved.forEach(item => { if (item && item.id) map.set(item.id, item); });
    }
    return Array.from(map.values());
  };

  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        questions: mergeById(INITIAL_QUESTIONS, parsed.questions),
        mockTests: mergeById(INITIAL_MOCK_TESTS, parsed.mockTests),
        pypPapers: mergeById(INITIAL_PYP_PAPERS, parsed.pypPapers),
        attempts: Array.isArray(parsed.attempts) ? parsed.attempts : [...SAMPLE_USER_ATTEMPTS],
      };
    }
  } catch (err) {
    console.warn('⚠️ Failed to load local JSON DB, using initial mock seeds:', err);
  }
  return {
    questions: [...INITIAL_QUESTIONS],
    mockTests: [...INITIAL_MOCK_TESTS],
    pypPapers: [...INITIAL_PYP_PAPERS],
    attempts: [...SAMPLE_USER_ATTEMPTS],
  };
}

let localDb: DatabaseShape = loadLocalJsonDb();

export function saveLocalJsonDb(immediate = false) {
  try {
    ensureDataDir();
    fs.writeFileSync(DB_FILE, JSON.stringify(localDb, null, 2), 'utf-8');
  } catch (err) {
    console.error('❌ Failed to save local JSON DB:', err);
  }
}

// ----------------- QUESTION REPOSITORY -----------------

export async function getAllQuestions(filters?: {
  subject?: string;
  topic?: string;
  subtopic?: string;
  difficulty?: string;
  category?: string;
  search?: string;
}): Promise<Question[]> {
  const pool = getPool();
  if (pool && isMysqlActive()) {
    try {
      let sql = 'SELECT * FROM questions WHERE 1=1';
      const params: any[] = [];

      if (filters?.subject) {
        sql += ' AND subject = ?';
        params.push(filters.subject);
      }
      if (filters?.topic) {
        sql += ' AND topic = ?';
        params.push(filters.topic);
      }
      if (filters?.subtopic) {
        sql += ' AND subtopic = ?';
        params.push(filters.subtopic);
      }
      if (filters?.difficulty) {
        sql += ' AND difficulty = ?';
        params.push(filters.difficulty);
      }
      if (filters?.category) {
        sql += ' AND category = ?';
        params.push(filters.category);
      }
      if (filters?.search) {
        sql += ' AND (LOWER(question_text) LIKE ? OR LOWER(question_hindi) LIKE ? OR LOWER(topic) LIKE ?)';
        const term = `%${filters.search.toLowerCase()}%`;
        params.push(term, term, term);
      }
      sql += ' ORDER BY created_at DESC';

      const [rows] = await pool.query(sql, params);
      return (rows as any[]).map(mapRowToQuestion);
    } catch (err) {
      console.error('MySQL getAllQuestions error, falling back to local memory:', err);
    }
  }

  // Fallback to local memory / JSON
  let filtered = [...localDb.questions];
  if (filters?.subject) filtered = filtered.filter(q => q.subject === filters.subject);
  if (filters?.topic) filtered = filtered.filter(q => q.topic === filters.topic);
  if (filters?.subtopic) filtered = filtered.filter(q => q.subtopic === filters.subtopic);
  if (filters?.difficulty) filtered = filtered.filter(q => q.difficulty === filters.difficulty);
  if (filters?.category) filtered = filtered.filter(q => q.category === filters.category);
  if (filters?.search) {
    const s = filters.search.toLowerCase();
    filtered = filtered.filter(
      q =>
        (q.questionText || q.question || '').toLowerCase().includes(s) ||
        (q.questionHindi && q.questionHindi.toLowerCase().includes(s)) ||
        (q.topic || '').toLowerCase().includes(s)
    );
  }
  return filtered;
}

export async function getQuestionById(id: string): Promise<Question | null> {
  const pool = getPool();
  if (pool && isMysqlActive()) {
    try {
      const [rows] = await pool.query('SELECT * FROM questions WHERE id = ?', [id]);
      const list = rows as any[];
      if (list.length > 0) return mapRowToQuestion(list[0]);
      return null;
    } catch (err) {
      console.error('MySQL getQuestionById error:', err);
    }
  }
  return localDb.questions.find(q => q.id === id) || null;
}

export async function saveQuestion(q: Question): Promise<Question> {
  const pool = getPool();
  if (pool && isMysqlActive()) {
    try {
      const row = mapQuestionToRow(q);
      const sql = `
        INSERT INTO questions (
          id, unique_question_id, authority, category, sub_category, post_name, exam_name, exam_year,
          subject, topic, subtopic, chapter_name, chapter_id, difficulty, question_type, subject_category,
          question_language, question_text, question_hindi, options, statements, column_a, column_b,
          assertion, assertion_hindi, reason, reason_hindi, correct_option, model_key, final_amended_key,
          is_cancelled, marks, negative_marks, explanation, explanation_hindi, image_url, diagram_svg,
          ideal_time_seconds, origin_type, pyp_source, pyp_appearances, repeated_in_exams, similar_question_ids
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          unique_question_id = VALUES(unique_question_id),
          subject = VALUES(subject),
          topic = VALUES(topic),
          subtopic = VALUES(subtopic),
          chapter_name = VALUES(chapter_name),
          difficulty = VALUES(difficulty),
          question_text = VALUES(question_text),
          question_hindi = VALUES(question_hindi),
          options = VALUES(options),
          correct_option = VALUES(correct_option),
          marks = VALUES(marks),
          negative_marks = VALUES(negative_marks),
          explanation = VALUES(explanation),
          explanation_hindi = VALUES(explanation_hindi),
          pyp_appearances = VALUES(pyp_appearances),
          repeated_in_exams = VALUES(repeated_in_exams)
      `;
      await pool.query(sql, [
        row.id, row.unique_question_id, row.authority, row.category, row.sub_category, row.post_name, row.exam_name, row.exam_year,
        row.subject, row.topic, row.subtopic, row.chapter_name, row.chapter_id, row.difficulty, row.question_type, row.subject_category,
        row.question_language, row.question_text, row.question_hindi, JSON.stringify(row.options),
        row.statements ? JSON.stringify(row.statements) : null,
        row.column_a ? JSON.stringify(row.column_a) : null,
        row.column_b ? JSON.stringify(row.column_b) : null,
        row.assertion, row.assertion_hindi, row.reason, row.reason_hindi,
        row.correct_option, row.model_key, row.final_amended_key, row.is_cancelled, row.marks, row.negative_marks,
        row.explanation, row.explanation_hindi, row.image_url, row.diagram_svg, row.ideal_time_seconds,
        row.origin_type, row.pyp_source,
        row.pyp_appearances ? JSON.stringify(row.pyp_appearances) : null,
        row.repeated_in_exams ? JSON.stringify(row.repeated_in_exams) : null,
        row.similar_question_ids ? JSON.stringify(row.similar_question_ids) : null
      ]);
    } catch (err) {
      console.error('MySQL saveQuestion error:', err);
    }
  }

  // Also update local memory/fallback
  const idx = localDb.questions.findIndex(x => x.id === q.id);
  if (idx !== -1) {
    localDb.questions[idx] = q;
  } else {
    localDb.questions.unshift(q);
  }
  saveLocalJsonDb();
  return q;
}

export async function deleteQuestion(id: string): Promise<boolean> {
  const pool = getPool();
  if (pool && isMysqlActive()) {
    try {
      await pool.query('DELETE FROM questions WHERE id = ?', [id]);
    } catch (err) {
      console.error('MySQL deleteQuestion error:', err);
    }
  }
  const before = localDb.questions.length;
  localDb.questions = localDb.questions.filter(q => q.id !== id);
  saveLocalJsonDb();
  return before !== localDb.questions.length;
}

export async function bulkUpsertQuestions(questionsList: Question[]): Promise<{ inserted: number; updated: number }> {
  let inserted = 0;
  let updated = 0;

  for (const q of questionsList) {
    const exists = localDb.questions.some(x => x.id === q.id || (q.uniqueQuestionId && x.uniqueQuestionId === q.uniqueQuestionId));
    if (exists) updated++;
    else inserted++;
    await saveQuestion(q);
  }
  return { inserted, updated };
}

// ----------------- MOCK TESTS REPOSITORY -----------------

export async function getAllMockTests(filters?: { category?: string; publishedOnly?: boolean }): Promise<MockTest[]> {
  const pool = getPool();
  if (pool && isMysqlActive()) {
    try {
      let sql = 'SELECT * FROM mock_tests WHERE 1=1';
      const params: any[] = [];
      if (filters?.publishedOnly) {
        sql += ' AND is_published = TRUE';
      }
      if (filters?.category && filters.category !== 'ALL') {
        sql += ' AND category = ?';
        params.push(filters.category);
      }
      sql += ' ORDER BY created_at DESC';
      const [rows] = await pool.query(sql, params);
      return (rows as any[]).map(mapRowToMockTest);
    } catch (err) {
      console.error('MySQL getAllMockTests error:', err);
    }
  }

  let list = [...localDb.mockTests];
  if (filters?.publishedOnly) {
    list = list.filter(t => t.isPublished !== false);
  }
  if (filters?.category && filters.category !== 'ALL') {
    list = list.filter(t => t.category === filters.category);
  }
  return list;
}

export async function getMockTestById(id: string): Promise<MockTest | null> {
  const pool = getPool();
  if (pool && isMysqlActive()) {
    try {
      const [rows] = await pool.query('SELECT * FROM mock_tests WHERE id = ?', [id]);
      const list = rows as any[];
      if (list.length > 0) return mapRowToMockTest(list[0]);
      return null;
    } catch (err) {
      console.error('MySQL getMockTestById error:', err);
    }
  }
  return localDb.mockTests.find(t => t.id === id) || null;
}

export async function saveMockTest(t: MockTest): Promise<MockTest> {
  const pool = getPool();
  if (pool && isMysqlActive()) {
    try {
      const sql = `
        INSERT INTO mock_tests (
          id, title, authority, category, sub_category, post_name, exam_name, description,
          duration_minutes, total_marks, marks_per_question, negative_marks_per_question,
          is_pyp, origin_type, is_pro, pyp_year, pyp_exam_name, question_count, attempts_count,
          passing_percentage, is_published, difficulty_distribution, sections
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          title = VALUES(title),
          category = VALUES(category),
          description = VALUES(description),
          duration_minutes = VALUES(duration_minutes),
          total_marks = VALUES(total_marks),
          marks_per_question = VALUES(marks_per_question),
          negative_marks_per_question = VALUES(negative_marks_per_question),
          is_pyp = VALUES(is_pyp),
          question_count = VALUES(question_count),
          attempts_count = VALUES(attempts_count),
          is_published = VALUES(is_published),
          difficulty_distribution = VALUES(difficulty_distribution),
          sections = VALUES(sections)
      `;
      await pool.query(sql, [
        t.id, t.title, t.authority || 'CGSSB', t.category, t.subCategory || null, t.postName || null, t.examName || null,
        t.description || '', t.durationMinutes, t.totalMarks || (t.questionCount * t.marksPerQuestion),
        t.marksPerQuestion, t.negativeMarksPerQuestion, t.isPYP ? 1 : 0, t.originType || 'mock', t.isPro ? 1 : 0,
        t.pypYear || null, t.pypExamName || null, t.questionCount, t.attemptsCount || 0,
        t.passingPercentage || 45, t.isPublished !== false ? 1 : 0,
        t.difficultyDistribution ? JSON.stringify(t.difficultyDistribution) : null,
        JSON.stringify(t.sections || [])
      ]);
    } catch (err) {
      console.error('MySQL saveMockTest error:', err);
    }
  }

  const idx = localDb.mockTests.findIndex(x => x.id === t.id);
  if (idx !== -1) {
    localDb.mockTests[idx] = t;
  } else {
    localDb.mockTests.unshift(t);
  }
  saveLocalJsonDb();
  return t;
}

export async function deleteMockTest(id: string): Promise<boolean> {
  const pool = getPool();
  if (pool && isMysqlActive()) {
    try {
      await pool.query('DELETE FROM mock_tests WHERE id = ?', [id]);
    } catch (err) {
      console.error('MySQL deleteMockTest error:', err);
    }
  }
  const before = localDb.mockTests.length;
  localDb.mockTests = localDb.mockTests.filter(t => t.id !== id);
  saveLocalJsonDb();
  return before !== localDb.mockTests.length;
}

// ----------------- PREVIOUS YEAR PAPERS REPOSITORY -----------------

export async function getAllPypPapers(category?: string): Promise<PreviousYearPaper[]> {
  const pool = getPool();
  if (pool && isMysqlActive()) {
    try {
      let sql = 'SELECT * FROM previous_year_papers WHERE 1=1';
      const params: any[] = [];
      if (category) {
        sql += ' AND exam_category = ?';
        params.push(category);
      }
      sql += ' ORDER BY exam_year DESC, created_at DESC';
      const [rows] = await pool.query(sql, params);
      return (rows as any[]).map(mapRowToPyp);
    } catch (err) {
      console.error('MySQL getAllPypPapers error:', err);
    }
  }

  let list = [...localDb.pypPapers];
  if (category) {
    list = list.filter(p => p.examCategory === category);
  }
  return list;
}

export async function savePypPaper(p: PreviousYearPaper): Promise<PreviousYearPaper> {
  const pool = getPool();
  if (pool && isMysqlActive()) {
    try {
      const sql = `
        INSERT INTO previous_year_papers (
          id, title, authority, exam_category, sub_category, post_name, exam_name, exam_year,
          total_questions, duration_minutes, marks, negative_marking_ratio, linked_mock_test_id,
          is_official_paper, paper_summary, subjects_weightage, download_file_name, file_size,
          download_url, linked_question_ids
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          title = VALUES(title),
          exam_category = VALUES(exam_category),
          exam_year = VALUES(exam_year),
          total_questions = VALUES(total_questions),
          duration_minutes = VALUES(duration_minutes),
          marks = VALUES(marks),
          negative_marking_ratio = VALUES(negative_marking_ratio),
          linked_mock_test_id = VALUES(linked_mock_test_id),
          paper_summary = VALUES(paper_summary),
          subjects_weightage = VALUES(subjects_weightage),
          linked_question_ids = VALUES(linked_question_ids)
      `;
      await pool.query(sql, [
        p.id, p.title, p.authority || 'CGSSB', p.examCategory, p.subCategory || null, p.postName || null, p.examName || null,
        p.year, p.totalQuestions, p.durationMinutes, p.marks, p.negativeMarkingRatio, p.linkedMockTestId || null,
        p.isOfficialPaper ? 1 : 0, p.paperSummary || '', JSON.stringify(p.subjectsWeightage || []),
        p.downloadFileName, p.fileSize || '3.5 MB', p.downloadUrl || null, JSON.stringify(p.linkedQuestionIds || [])
      ]);
    } catch (err) {
      console.error('MySQL savePypPaper error:', err);
    }
  }

  const idx = localDb.pypPapers.findIndex(x => x.id === p.id);
  if (idx !== -1) {
    localDb.pypPapers[idx] = p;
  } else {
    localDb.pypPapers.unshift(p);
  }
  saveLocalJsonDb();
  return p;
}

// ----------------- TEST ATTEMPTS REPOSITORY -----------------

export async function getAllTestAttempts(userId?: string): Promise<TestAttempt[]> {
  const pool = getPool();
  if (pool && isMysqlActive()) {
    try {
      let sql = 'SELECT * FROM test_attempts WHERE 1=1';
      const params: any[] = [];
      if (userId) {
        sql += ' AND user_id = ?';
        params.push(userId);
      }
      sql += ' ORDER BY submitted_at DESC';
      const [rows] = await pool.query(sql, params);
      return (rows as any[]).map(mapRowToAttempt);
    } catch (err) {
      console.error('MySQL getAllTestAttempts error:', err);
    }
  }

  let list = [...localDb.attempts];
  if (userId) {
    list = list.filter(a => a.userId === userId);
  }
  return list;
}

export async function getTestAttemptById(id: string): Promise<TestAttempt | null> {
  const pool = getPool();
  if (pool && isMysqlActive()) {
    try {
      const [rows] = await pool.query('SELECT * FROM test_attempts WHERE id = ?', [id]);
      const list = rows as any[];
      if (list.length > 0) return mapRowToAttempt(list[0]);
      return null;
    } catch (err) {
      console.error('MySQL getTestAttemptById error:', err);
    }
  }
  return localDb.attempts.find(a => a.id === id) || null;
}

export async function saveTestAttempt(a: TestAttempt): Promise<TestAttempt> {
  const pool = getPool();
  if (pool && isMysqlActive()) {
    try {
      const sql = `
        INSERT INTO test_attempts (
          id, user_id, user_name, test_id, test_title, category, submitted_at, time_taken_seconds,
          total_duration_seconds, responses, question_statuses, score, max_score, percentage,
          accuracy, correct_count, incorrect_count, unattempted_count, marked_for_review_count,
          negative_marks_deducted, simulated_rank, total_participants, percentile, sector_analysis
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      await pool.query(sql, [
        a.id, a.userId, a.userName, a.testId, a.testTitle, a.category,
        new Date(a.submittedAt).toISOString().slice(0, 19).replace('T', ' '),
        a.timeTakenSeconds, a.totalDurationSeconds, JSON.stringify(a.responses),
        JSON.stringify(a.questionStatuses), a.score, a.maxScore, a.percentage, a.accuracy,
        a.correctCount, a.incorrectCount, a.unattemptedCount, a.markedForReviewCount,
        a.negativeMarksDeducted, a.simulatedRank, a.totalParticipants, a.percentile,
        JSON.stringify(a.sectorAnalysis)
      ]);
    } catch (err) {
      console.error('MySQL saveTestAttempt error:', err);
    }
  }

  localDb.attempts.unshift(a);
  saveLocalJsonDb();
  return a;
}

// ----------------- FULL DATABASE SNAPSHOT EXPORT/IMPORT -----------------

export async function getDatabaseCounts(): Promise<{ questions: number; mockTests: number; pypPapers: number; attempts: number }> {
  const pool = getPool();
  if (pool && isMysqlActive()) {
    try {
      const [[qRes]]: any = await pool.query('SELECT COUNT(*) as count FROM questions');
      const [[tRes]]: any = await pool.query('SELECT COUNT(*) as count FROM mock_tests');
      const [[pRes]]: any = await pool.query('SELECT COUNT(*) as count FROM previous_year_papers');
      const [[aRes]]: any = await pool.query('SELECT COUNT(*) as count FROM test_attempts');
      return {
        questions: qRes.count,
        mockTests: tRes.count,
        pypPapers: pRes.count,
        attempts: aRes.count,
      };
    } catch (err) {
      console.error('MySQL getDatabaseCounts error:', err);
    }
  }

  return {
    questions: localDb.questions.length,
    mockTests: localDb.mockTests.length,
    pypPapers: localDb.pypPapers.length,
    attempts: localDb.attempts.length,
  };
}

export function getLocalSnapshot(): DatabaseShape {
  return localDb;
}

// ----------------- HELPERS / ROW MAPPERS -----------------

function safeJsonParse<T>(val: any, fallback: T): T {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

function mapRowToQuestion(r: any): Question {
  return {
    id: r.id,
    uniqueQuestionId: r.unique_question_id || undefined,
    authority: r.authority || 'CGSSB',
    category: r.category as ExamCategory,
    subCategory: r.sub_category || undefined,
    postName: r.post_name || undefined,
    examName: r.exam_name || undefined,
    year: r.exam_year || undefined,
    subject: r.subject,
    topic: r.topic,
    subtopic: r.subtopic || undefined,
    chapter: r.chapter_name || undefined,
    chapterName: r.chapter_name || undefined,
    chapterId: r.chapter_id || undefined,
    difficulty: r.difficulty,
    questionType: r.question_type || 'mcq',
    subjectCategory: r.subject_category || 'non_language',
    questionLanguage: r.question_language || 'both',
    questionText: r.question_text,
    question: r.question_text,
    questionHindi: r.question_hindi || undefined,
    textHindi: r.question_hindi || undefined,
    options: safeJsonParse(r.options, []),
    statements: safeJsonParse(r.statements, undefined),
    columnA: safeJsonParse(r.column_a, undefined),
    columnB: safeJsonParse(r.column_b, undefined),
    assertion: r.assertion || undefined,
    assertionHindi: r.assertion_hindi || undefined,
    reason: r.reason || undefined,
    reasonHindi: r.reason_hindi || undefined,
    correctOption: r.correct_option,
    correctAnswer: r.correct_option,
    modelKey: r.model_key || undefined,
    finalAmendedKey: r.final_amended_key || undefined,
    isCancelled: Boolean(r.is_cancelled),
    marks: Number(r.marks) || 1.0,
    negativeMarks: Number(r.negative_marks) || 0.333,
    explanation: r.explanation || undefined,
    explanationHindi: r.explanation_hindi || undefined,
    imageUrl: r.image_url || undefined,
    diagramSvg: r.diagram_svg || undefined,
    idealTimeSeconds: r.ideal_time_seconds || 45,
    originType: r.origin_type || 'mock',
    pypSource: r.pyp_source || undefined,
    pypAppearances: safeJsonParse(r.pyp_appearances, undefined),
    repeatedInExams: safeJsonParse(r.repeated_in_exams, undefined),
    similarQuestionIds: safeJsonParse(r.similar_question_ids, undefined),
    createdAt: r.created_at ? new Date(r.created_at).toISOString().split('T')[0] : undefined,
  };
}

function mapQuestionToRow(q: Question): any {
  return {
    id: q.id,
    unique_question_id: q.uniqueQuestionId || null,
    authority: q.authority || 'CGSSB',
    category: q.category || 'CGSSB',
    sub_category: q.subCategory || null,
    post_name: q.postName || null,
    exam_name: q.examName || null,
    exam_year: q.year || null,
    subject: q.subject || 'Chhattisgarh General Studies',
    topic: q.topic || 'General',
    subtopic: q.subtopic || null,
    chapter_name: q.chapterName || q.chapter || null,
    chapter_id: q.chapterId || null,
    difficulty: q.difficulty || 'Medium',
    question_type: q.questionType || 'mcq',
    subject_category: q.subjectCategory || 'non_language',
    question_language: q.questionLanguage || 'both',
    question_text: q.questionText || q.question || '',
    question_hindi: q.questionHindi || q.textHindi || null,
    options: q.options || [],
    statements: q.statements || null,
    column_a: q.columnA || null,
    column_b: q.columnB || null,
    assertion: q.assertion || null,
    assertion_hindi: q.assertionHindi || null,
    reason: q.reason || null,
    reason_hindi: q.reasonHindi || null,
    correct_option: q.correctOption || q.correctAnswer || 'A',
    model_key: q.modelKey || null,
    final_amended_key: q.finalAmendedKey || null,
    is_cancelled: q.isCancelled ? 1 : 0,
    marks: q.marks || 1.0,
    negative_marks: q.negativeMarks || 0.333,
    explanation: q.explanation || null,
    explanation_hindi: q.explanationHindi || null,
    image_url: q.imageUrl || null,
    diagram_svg: q.diagramSvg || null,
    ideal_time_seconds: q.idealTimeSeconds || 45,
    origin_type: q.originType || 'mock',
    pyp_source: q.pypSource || null,
    pyp_appearances: q.pypAppearances || null,
    repeated_in_exams: q.repeatedInExams || null,
    similar_question_ids: q.similarQuestionIds || null,
  };
}

function mapRowToMockTest(r: any): MockTest {
  return {
    id: r.id,
    title: r.title,
    authority: r.authority || 'CGSSB',
    category: r.category as ExamCategory,
    subCategory: r.sub_category || undefined,
    postName: r.post_name || undefined,
    examName: r.exam_name || undefined,
    description: r.description || '',
    durationMinutes: Number(r.duration_minutes) || 120,
    totalMarks: Number(r.total_marks) || 100,
    marksPerQuestion: Number(r.marks_per_question) || 1.0,
    negativeMarksPerQuestion: Number(r.negative_marks_per_question) || 0.333,
    isPYP: Boolean(r.is_pyp),
    originType: r.origin_type || 'mock',
    isPro: Boolean(r.is_pro),
    pypYear: r.pyp_year || undefined,
    pypExamName: r.pyp_exam_name || undefined,
    sections: safeJsonParse(r.sections, []),
    questionCount: Number(r.question_count) || 0,
    attemptsCount: Number(r.attempts_count) || 0,
    passingPercentage: Number(r.passing_percentage) || 45,
    isPublished: Boolean(r.is_published),
    difficultyDistribution: safeJsonParse(r.difficulty_distribution, { easy: 40, medium: 40, hard: 20 }),
    createdAt: r.created_at ? new Date(r.created_at).toISOString().split('T')[0] : undefined,
  };
}

function mapRowToPyp(r: any): PreviousYearPaper {
  return {
    id: r.id,
    title: r.title,
    authority: r.authority || 'CGSSB',
    examCategory: r.exam_category as ExamCategory,
    subCategory: r.sub_category || undefined,
    postName: r.post_name || undefined,
    examName: r.exam_name || undefined,
    year: Number(r.exam_year),
    totalQuestions: Number(r.total_questions) || 100,
    durationMinutes: Number(r.duration_minutes) || 120,
    marks: Number(r.marks) || 100,
    negativeMarkingRatio: r.negative_marking_ratio || '-⅓rd (0.33 Marks)',
    linkedMockTestId: r.linked_mock_test_id || undefined,
    isOfficialPaper: Boolean(r.is_official_paper),
    paperSummary: r.paper_summary || '',
    subjectsWeightage: safeJsonParse(r.subjects_weightage, []),
    downloadFileName: r.download_file_name || 'PYP_Paper.pdf',
    fileSize: r.file_size || '3.5 MB',
    downloadUrl: r.download_url || undefined,
    linkedQuestionIds: safeJsonParse(r.linked_question_ids, []),
    createdAt: r.created_at ? new Date(r.created_at).toISOString().split('T')[0] : undefined,
  };
}

function mapRowToAttempt(r: any): TestAttempt {
  return {
    id: r.id,
    userId: r.user_id,
    userName: r.user_name,
    testId: r.test_id,
    testTitle: r.test_title,
    category: r.category as ExamCategory,
    submittedAt: new Date(r.submitted_at).toISOString(),
    timeTakenSeconds: Number(r.time_taken_seconds),
    totalDurationSeconds: Number(r.total_duration_seconds),
    responses: safeJsonParse(r.responses, {}),
    questionStatuses: safeJsonParse(r.question_statuses, {}),
    score: Number(r.score),
    maxScore: Number(r.max_score),
    percentage: Number(r.percentage),
    accuracy: Number(r.accuracy),
    correctCount: Number(r.correct_count),
    incorrectCount: Number(r.incorrect_count),
    unattemptedCount: Number(r.unattempted_count),
    markedForReviewCount: Number(r.marked_for_review_count),
    negativeMarksDeducted: Number(r.negative_marks_deducted),
    simulatedRank: Number(r.simulated_rank),
    totalParticipants: Number(r.total_participants),
    percentile: Number(r.percentile),
    sectorAnalysis: safeJsonParse(r.sector_analysis, []),
  };
}

// ----------------- NO-CODE CMS REPOSITORY -----------------

import type { CMSPage, CMSPost, CMSTestSeriesPack, CMSSiteSettings } from '../../src/types/cms.ts';
import {
  INITIAL_CMS_SETTINGS,
  INITIAL_CMS_PAGES,
  INITIAL_CMS_POSTS,
  INITIAL_CMS_SERIES_PACKS
} from '../../src/defaultCmsData.ts';

let cmsPagesDb: CMSPage[] = [...INITIAL_CMS_PAGES];
let cmsPostsDb: CMSPost[] = [...INITIAL_CMS_POSTS];
let cmsSeriesDb: CMSTestSeriesPack[] = [...INITIAL_CMS_SERIES_PACKS];
let cmsSettingsDb: CMSSiteSettings = { ...INITIAL_CMS_SETTINGS };

export async function getAllCmsPages(): Promise<CMSPage[]> {
  return cmsPagesDb;
}

export async function getCmsPageBySlug(slug: string): Promise<CMSPage | null> {
  return cmsPagesDb.find(p => p.slug === slug) || null;
}

export async function saveCmsPage(page: CMSPage): Promise<CMSPage> {
  const idx = cmsPagesDb.findIndex(p => p.id === page.id);
  if (idx !== -1) cmsPagesDb[idx] = page;
  else cmsPagesDb.unshift(page);
  return page;
}

export async function deleteCmsPage(id: string): Promise<boolean> {
  const before = cmsPagesDb.length;
  cmsPagesDb = cmsPagesDb.filter(p => p.id !== id);
  return before !== cmsPagesDb.length;
}

export async function getAllCmsPosts(): Promise<CMSPost[]> {
  return cmsPostsDb;
}

export async function getCmsPostBySlug(slug: string): Promise<CMSPost | null> {
  return cmsPostsDb.find(p => p.slug === slug) || null;
}

export async function saveCmsPost(post: CMSPost): Promise<CMSPost> {
  const idx = cmsPostsDb.findIndex(p => p.id === post.id);
  if (idx !== -1) cmsPostsDb[idx] = post;
  else cmsPostsDb.unshift(post);
  return post;
}

export async function deleteCmsPost(id: string): Promise<boolean> {
  const before = cmsPostsDb.length;
  cmsPostsDb = cmsPostsDb.filter(p => p.id !== id);
  return before !== cmsPostsDb.length;
}

export async function getAllCmsSeriesPacks(): Promise<CMSTestSeriesPack[]> {
  return cmsSeriesDb;
}

export async function saveCmsSeriesPack(pack: CMSTestSeriesPack): Promise<CMSTestSeriesPack> {
  const idx = cmsSeriesDb.findIndex(p => p.id === pack.id);
  if (idx !== -1) cmsSeriesDb[idx] = pack;
  else cmsSeriesDb.unshift(pack);
  return pack;
}

export async function deleteCmsSeriesPack(id: string): Promise<boolean> {
  const before = cmsSeriesDb.length;
  cmsSeriesDb = cmsSeriesDb.filter(p => p.id !== id);
  return before !== cmsSeriesDb.length;
}

export async function getCmsSettings(): Promise<CMSSiteSettings> {
  return cmsSettingsDb;
}

export async function saveCmsSettings(settings: CMSSiteSettings): Promise<CMSSiteSettings> {
  cmsSettingsDb = settings;
  return cmsSettingsDb;
}

