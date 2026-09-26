import React, { useState, useMemo } from 'react';
import { MockTest, Question, PreviousYearPaper, TestAttempt } from '../types';
import { APP_BUILD_INFO } from '../utils/buildInfo';
import {
  Database,
  Download,
  Upload,
  Printer,
  Search,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  FileText,
  X,
  Copy,
  Layers,
  Sparkles,
  ShieldCheck,
  Check,
  RefreshCw,
  Eye,
  Table,
  GitBranch,
  Key,
  Network,
  HardDrive,
  Code2,
  Server,
  ArrowRight,
  ExternalLink,
  Cpu
} from 'lucide-react';

interface AdminToolsAndBackupsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tests: MockTest[];
  questions: Question[];
  pypPapers: PreviousYearPaper[];
  attempts: TestAttempt[];
  onRestoreSnapshot?: (data: { tests: MockTest[]; questions: Question[]; pypPapers: PreviousYearPaper[] }) => void;
}

export const AdminToolsAndBackupsModal: React.FC<AdminToolsAndBackupsModalProps> = ({
  isOpen,
  onClose,
  tests,
  questions,
  pypPapers,
  attempts,
  onRestoreSnapshot,
}) => {
  const [activeTab, setActiveTab] = useState<'backup' | 'schema' | 'pdf' | 'quality'>('backup');
  const [selectedSchemaTable, setSelectedSchemaTable] = useState<'all' | 'questions' | 'mock_tests' | 'previous_year_papers' | 'test_attempts'>('all');
  const [schemaSearchQuery, setSchemaSearchQuery] = useState('');
  const [copiedDdl, setCopiedDdl] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState<string>(tests[0]?.id || '');
  const [includeOmr, setIncludeOmr] = useState(true);
  const [includeSolutionsKey, setIncludeSolutionsKey] = useState(true);
  const [coachingWatermark, setCoachingWatermark] = useState('CGSSB & CGPSC EXAM PREP PORTAL - CHHATTISGARH');
  const [backupSuccessMessage, setBackupSuccessMessage] = useState<string | null>(null);

  // -------------------------------------------------------------
  // 1. DATABASE BACKUP / EXPORT & RESTORE
  // -------------------------------------------------------------
  const handleDownloadSnapshot = () => {
    const dbSnapshot = {
      version: APP_BUILD_INFO.version,
      exportedAt: new Date().toISOString(),
      platform: 'CGSSB & CGPSC Portal',
      stats: {
        testsCount: tests.length,
        questionsCount: questions.length,
        pypCount: pypPapers.length,
        attemptsCount: attempts.length,
      },
      data: {
        tests,
        questions,
        pypPapers,
        attempts,
      },
    };

    const blob = new Blob([JSON.stringify(dbSnapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cgssb-portal-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setBackupSuccessMessage('Snapshot downloaded successfully!');
    setTimeout(() => setBackupSuccessMessage(null), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.data && parsed.data.tests && parsed.data.questions) {
          if (onRestoreSnapshot) {
            onRestoreSnapshot({
              tests: parsed.data.tests,
              questions: parsed.data.questions,
              pypPapers: parsed.data.pypPapers || [],
            });
            setBackupSuccessMessage('Database restored successfully from backup!');
            setTimeout(() => setBackupSuccessMessage(null), 3000);
          }
        } else {
          alert('Invalid backup file schema. Missing test or question tables.');
        }
      } catch (err) {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  // -------------------------------------------------------------
  // 2. QUALITY & DEDUPLICATION SCANNER
  // -------------------------------------------------------------
  const qualityReport = useMemo(() => {
    const duplicates: { original: Question; duplicate: Question; similarity: string }[] = [];
    const missingHindi: Question[] = [];
    const missingExplanations: Question[] = [];
    const missingOptions: Question[] = [];

    const seenQuestions = new Map<string, Question>();

    questions.forEach(q => {
      // Normalize stem text
      const cleanStem = (q.questionText || q.question || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

      if (cleanStem.length > 15) {
        if (seenQuestions.has(cleanStem)) {
          duplicates.push({
            original: seenQuestions.get(cleanStem)!,
            duplicate: q,
            similarity: 'Exact Match',
          });
        } else {
          seenQuestions.set(cleanStem, q);
        }
      }

      // Quality checks
      if (!q.questionHindi && !q.subject.toLowerCase().includes('english')) {
        missingHindi.push(q);
      }

      if (!q.explanation && !q.explanationHindi) {
        missingExplanations.push(q);
      }

      if (!q.options || q.options.length < 4) {
        missingOptions.push(q);
      }
    });

    return {
      duplicates,
      missingHindi,
      missingExplanations,
      missingOptions,
      healthScore: Math.max(
        0,
        Math.round(
          100 -
            ((duplicates.length * 5 + missingHindi.length * 2 + missingExplanations.length * 1.5) /
              Math.max(1, questions.length)) *
              20
        )
      ),
    };
  }, [questions]);

  // -------------------------------------------------------------
  // 2. DATABASE SCHEMA METADATA & DATA DICTIONARY
  // -------------------------------------------------------------
  const MYSQL_DDL_SCRIPT = `-- =========================================================================
-- CGSSBTEST Official Database Schema (MySQL 8.0+ / MariaDB)
-- Character Set: utf8mb4 for full Devnagari / Hindi and LaTeX formula support
-- =========================================================================

CREATE TABLE IF NOT EXISTS questions (
  id VARCHAR(64) PRIMARY KEY,
  unique_question_id VARCHAR(100) UNIQUE,
  authority VARCHAR(100) DEFAULT 'CGSSB',
  category VARCHAR(50) NOT NULL DEFAULT 'CGSSB',
  sub_category VARCHAR(150),
  post_name VARCHAR(150),
  exam_name VARCHAR(200),
  exam_year INT,
  subject VARCHAR(150) NOT NULL,
  topic VARCHAR(200) NOT NULL,
  subtopic VARCHAR(200),
  chapter_name VARCHAR(200),
  chapter_id VARCHAR(150),
  difficulty ENUM('Easy', 'Medium', 'Hard') NOT NULL DEFAULT 'Medium',
  question_type ENUM('mcq', 'matching', 'assertion_reason', 'multi_statement') NOT NULL DEFAULT 'mcq',
  subject_category ENUM('language', 'non_language', 'gs_reasoning') DEFAULT 'non_language',
  question_language ENUM('en', 'hi', 'both', 'bilingual') DEFAULT 'both',
  
  -- Question Stems
  question_text TEXT NOT NULL,
  question_hindi TEXT,
  
  -- Structured Components
  options JSON NOT NULL,
  statements JSON,
  column_a JSON,
  column_b JSON,
  assertion TEXT,
  assertion_hindi TEXT,
  reason TEXT,
  reason_hindi TEXT,
  
  -- Answers & Scoring
  correct_option ENUM('A', 'B', 'C', 'D') NOT NULL,
  model_key VARCHAR(10),
  final_amended_key VARCHAR(10),
  is_cancelled BOOLEAN DEFAULT FALSE,
  marks DECIMAL(4,2) NOT NULL DEFAULT 1.00,
  negative_marks DECIMAL(4,3) NOT NULL DEFAULT 0.333,
  explanation TEXT,
  explanation_hindi TEXT,
  image_url VARCHAR(500),
  diagram_svg MEDIUMTEXT,
  ideal_time_seconds INT DEFAULT 45,
  
  -- Provenance & PYQ Relations
  origin_type ENUM('mock', 'pyq') DEFAULT 'mock',
  pyp_source VARCHAR(255),
  pyp_appearances JSON,
  repeated_in_exams JSON,
  similar_question_ids JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_category (category),
  INDEX idx_subject (subject),
  INDEX idx_topic (topic),
  INDEX idx_difficulty (difficulty),
  INDEX idx_origin (origin_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mock_tests (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  authority VARCHAR(100) DEFAULT 'CGSSB',
  category VARCHAR(50) NOT NULL DEFAULT 'CGSSB',
  sub_category VARCHAR(150),
  post_name VARCHAR(150),
  exam_name VARCHAR(200),
  description TEXT,
  duration_minutes INT NOT NULL DEFAULT 120,
  total_marks DECIMAL(6,2),
  marks_per_question DECIMAL(4,2) NOT NULL DEFAULT 1.00,
  negative_marks_per_question DECIMAL(4,3) NOT NULL DEFAULT 0.333,
  is_pyp BOOLEAN DEFAULT FALSE,
  origin_type ENUM('pyq', 'mock') DEFAULT 'mock',
  is_pro BOOLEAN DEFAULT FALSE,
  pyp_year INT,
  pyp_exam_name VARCHAR(200),
  question_count INT NOT NULL DEFAULT 0,
  attempts_count INT NOT NULL DEFAULT 0,
  passing_percentage DECIMAL(4,1) DEFAULT 45.0,
  is_published BOOLEAN DEFAULT TRUE,
  difficulty_distribution JSON,
  sections JSON NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_test_category (category),
  INDEX idx_test_published (is_published),
  INDEX idx_test_is_pyp (is_pyp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS previous_year_papers (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  authority VARCHAR(100) DEFAULT 'CGSSB',
  exam_category VARCHAR(50) NOT NULL DEFAULT 'CGSSB',
  sub_category VARCHAR(150),
  post_name VARCHAR(150),
  exam_name VARCHAR(200),
  exam_year INT NOT NULL,
  total_questions INT NOT NULL DEFAULT 100,
  duration_minutes INT NOT NULL DEFAULT 120,
  marks DECIMAL(6,2) NOT NULL DEFAULT 100.00,
  negative_marking_ratio VARCHAR(100) DEFAULT '-⅓rd (0.33 Marks)',
  linked_mock_test_id VARCHAR(64),
  is_official_paper BOOLEAN DEFAULT TRUE,
  paper_summary TEXT,
  subjects_weightage JSON,
  download_file_name VARCHAR(255),
  file_size VARCHAR(50) DEFAULT '3.5 MB',
  download_url VARCHAR(500),
  linked_question_ids JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_pyp_year (exam_year),
  INDEX idx_pyp_category (exam_category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS test_attempts (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  user_name VARCHAR(150) NOT NULL,
  test_id VARCHAR(64) NOT NULL,
  test_title VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  time_taken_seconds INT NOT NULL DEFAULT 0,
  total_duration_seconds INT NOT NULL DEFAULT 7200,
  
  responses JSON NOT NULL,
  question_statuses JSON NOT NULL,
  
  score DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  max_score DECIMAL(6,2) NOT NULL DEFAULT 100.00,
  percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  accuracy DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  correct_count INT NOT NULL DEFAULT 0,
  incorrect_count INT NOT NULL DEFAULT 0,
  unattempted_count INT NOT NULL DEFAULT 0,
  marked_for_review_count INT NOT NULL DEFAULT 0,
  negative_marks_deducted DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  
  simulated_rank INT DEFAULT 1,
  total_participants INT DEFAULT 1,
  percentile DECIMAL(5,2) DEFAULT 50.00,
  sector_analysis JSON NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_attempt_user (user_id),
  INDEX idx_attempt_test (test_id),
  INDEX idx_attempt_submitted (submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;

  const SCHEMA_TABLES = [
    {
      id: 'questions',
      name: 'questions',
      badge: 'Questions Bank',
      color: 'indigo',
      rowCount: questions.length,
      description: 'Master canonical question bank storing bilingual stems, structured options, multi-statement logic, scoring keys, and PYQ linkages.',
      primaryKey: 'id',
      indexes: ['category', 'subject', 'topic', 'difficulty', 'origin_type', 'unique_question_id (UK)'],
      columns: [
        { name: 'id', type: 'VARCHAR(64)', key: 'PK', nullable: false, defaultVal: 'UUID / q-id', desc: 'Primary key identifying unique question item.' },
        { name: 'unique_question_id', type: 'VARCHAR(100)', key: 'UK', nullable: true, defaultVal: 'NULL', desc: 'Unique question code (e.g. CGSSB-2024-HOS-001) preventing duplicate imports.' },
        { name: 'authority', type: 'VARCHAR(100)', key: '', nullable: true, defaultVal: "'CGSSB'", desc: 'Conducting examination board (CGSSB or CGPSC).' },
        { name: 'category', type: 'VARCHAR(50)', key: 'INDEX', nullable: false, defaultVal: "'CGSSB'", desc: 'Top-level examination category.' },
        { name: 'sub_category', type: 'VARCHAR(150)', key: '', nullable: true, defaultVal: 'NULL', desc: 'Exam group (e.g. Hostel Warden, RI, Patwari, Sub Inspector).' },
        { name: 'post_name', type: 'VARCHAR(150)', key: '', nullable: true, defaultVal: 'NULL', desc: 'Designation / Post name.' },
        { name: 'subject', type: 'VARCHAR(150)', key: 'INDEX', nullable: false, defaultVal: "''", desc: 'Canonical academic subject (e.g. CG GS, Computer, Reasoning).' },
        { name: 'topic', type: 'VARCHAR(200)', key: 'INDEX', nullable: false, defaultVal: "''", desc: 'Topic classification within subject hierarchy.' },
        { name: 'subtopic', type: 'VARCHAR(200)', key: '', nullable: true, defaultVal: 'NULL', desc: 'Specific granular subtopic.' },
        { name: 'difficulty', type: "ENUM('Easy','Medium','Hard')", key: 'INDEX', nullable: false, defaultVal: "'Medium'", desc: 'Calibrated difficulty level for adaptive test assembly.' },
        { name: 'question_type', type: "ENUM('mcq','matching','assertion_reason','multi_statement')", key: '', nullable: false, defaultVal: "'mcq'", desc: 'Structural schema of the question.' },
        { name: 'question_text', type: 'TEXT', key: '', nullable: false, defaultVal: "''", desc: 'Standard English question stem (supports HTML/LaTeX).' },
        { name: 'question_hindi', type: 'TEXT', key: '', nullable: true, defaultVal: 'NULL', desc: 'Devnagari Hindi translated question stem.' },
        { name: 'options', type: 'JSON', key: '', nullable: false, defaultVal: '[]', desc: 'JSON array containing options A, B, C, D with bilingual labels & text.' },
        { name: 'correct_option', type: "ENUM('A','B','C','D')", key: '', nullable: false, defaultVal: "'A'", desc: 'Official correct option key.' },
        { name: 'marks', type: 'DECIMAL(4,2)', key: '', nullable: false, defaultVal: '1.00', desc: 'Positive marks awarded for correct answer.' },
        { name: 'negative_marks', type: 'DECIMAL(4,3)', key: '', nullable: false, defaultVal: '0.333', desc: 'Penalty marks deducted for wrong response.' },
        { name: 'explanation', type: 'TEXT', key: '', nullable: true, defaultVal: 'NULL', desc: 'Detailed pedagogical solution explanation (English).' },
        { name: 'explanation_hindi', type: 'TEXT', key: '', nullable: true, defaultVal: 'NULL', desc: 'Detailed pedagogical solution explanation (Hindi).' },
        { name: 'origin_type', type: "ENUM('mock','pyq')", key: 'INDEX', nullable: false, defaultVal: "'mock'", desc: 'Origin tag identifying mock prep item vs official PYQ.' },
        { name: 'pyp_appearances', type: 'JSON', key: '', nullable: true, defaultVal: '[]', desc: 'Array of historical papers where this question appeared.' },
        { name: 'created_at', type: 'DATETIME', key: '', nullable: false, defaultVal: 'CURRENT_TIMESTAMP', desc: 'Record creation timestamp.' },
      ]
    },
    {
      id: 'mock_tests',
      name: 'mock_tests',
      badge: 'Test Series Catalog',
      color: 'blue',
      rowCount: tests.length,
      description: 'Test catalog configuring exam duration, section partitioning, marking scheme (+1/-0.33, +2/-0.66), and test question mappings.',
      primaryKey: 'id',
      indexes: ['category', 'is_published', 'is_pyp'],
      columns: [
        { name: 'id', type: 'VARCHAR(64)', key: 'PK', nullable: false, defaultVal: 'test-id', desc: 'Primary key identifying unique mock test series.' },
        { name: 'title', type: 'VARCHAR(255)', key: '', nullable: false, defaultVal: "''", desc: 'Full bilingual exam title.' },
        { name: 'authority', type: 'VARCHAR(100)', key: '', nullable: true, defaultVal: "'CGSSB'", desc: 'Board name (CGSSB or CGPSC).' },
        { name: 'category', type: 'VARCHAR(50)', key: 'INDEX', nullable: false, defaultVal: "'CGSSB'", desc: 'Category grouping (CGSSB or CGPSC).' },
        { name: 'duration_minutes', type: 'INT', key: '', nullable: false, defaultVal: '120', desc: 'Total allocated test time limit in minutes.' },
        { name: 'total_marks', type: 'DECIMAL(6,2)', key: '', nullable: true, defaultVal: '100.00', desc: 'Total maximum marks for the paper.' },
        { name: 'marks_per_question', type: 'DECIMAL(4,2)', key: '', nullable: false, defaultVal: '1.00', desc: 'Default positive marking weightage.' },
        { name: 'negative_marks_per_question', type: 'DECIMAL(4,3)', key: '', nullable: false, defaultVal: '0.333', desc: 'Default negative deduction penalty.' },
        { name: 'is_pyp', type: 'BOOLEAN', key: 'INDEX', nullable: false, defaultVal: 'FALSE', desc: 'Flags whether this test is an official Previous Year Paper.' },
        { name: 'is_pro', type: 'BOOLEAN', key: '', nullable: false, defaultVal: 'FALSE', desc: 'Monetization flag: requires Pass Pro subscription.' },
        { name: 'question_count', type: 'INT', key: '', nullable: false, defaultVal: '0', desc: 'Total number of assembled questions in test.' },
        { name: 'attempts_count', type: 'INT', key: '', nullable: false, defaultVal: '0', desc: 'Counter for total completed student submissions.' },
        { name: 'is_published', type: 'BOOLEAN', key: 'INDEX', nullable: false, defaultVal: 'TRUE', desc: 'Publication status: student-visible or draft.' },
        { name: 'sections', type: 'JSON', key: 'FK_REL', nullable: false, defaultVal: '[]', desc: 'Sections JSON array containing section names and questionIds referencing questions.id.' },
        { name: 'difficulty_distribution', type: 'JSON', key: '', nullable: true, defaultVal: '{}', desc: 'Calculated breakdown of Easy, Medium, Hard questions.' },
        { name: 'created_at', type: 'DATETIME', key: '', nullable: false, defaultVal: 'CURRENT_TIMESTAMP', desc: 'Timestamp of test creation.' },
      ]
    },
    {
      id: 'previous_year_papers',
      name: 'previous_year_papers',
      badge: 'Official PYP Archives',
      color: 'emerald',
      rowCount: pypPapers.length,
      description: 'Official Previous Year Exam Paper archive catalog with exam year weightage, direct PDF download URLs, and linked interactive mock tests.',
      primaryKey: 'id',
      indexes: ['exam_year', 'exam_category'],
      columns: [
        { name: 'id', type: 'VARCHAR(64)', key: 'PK', nullable: false, defaultVal: 'pyp-id', desc: 'Primary key identifying official PYP document.' },
        { name: 'title', type: 'VARCHAR(255)', key: '', nullable: false, defaultVal: "''", desc: 'Official paper title with year and shift.' },
        { name: 'exam_category', type: 'VARCHAR(50)', key: 'INDEX', nullable: false, defaultVal: "'CGSSB'", desc: 'Category grouping (CGSSB or CGPSC).' },
        { name: 'exam_year', type: 'INT', key: 'INDEX', nullable: false, defaultVal: '2024', desc: 'Year of official examination conduct.' },
        { name: 'total_questions', type: 'INT', key: '', nullable: false, defaultVal: '100', desc: 'Count of official questions in original paper.' },
        { name: 'duration_minutes', type: 'INT', key: '', nullable: false, defaultVal: '120', desc: 'Official allocated examination time.' },
        { name: 'marks', type: 'DECIMAL(6,2)', key: '', nullable: false, defaultVal: '100.00', desc: 'Official maximum marks.' },
        { name: 'linked_mock_test_id', type: 'VARCHAR(64)', key: 'FK', nullable: true, defaultVal: 'NULL', desc: 'Foreign reference to mock_tests.id enabling 1-click test simulation.' },
        { name: 'linked_question_ids', type: 'JSON', key: 'FK_REL', nullable: true, defaultVal: '[]', desc: 'Array of question UUIDs referencing questions.id in bank.' },
        { name: 'subjects_weightage', type: 'JSON', key: '', nullable: true, defaultVal: '[]', desc: 'Subject marks distribution analysis.' },
        { name: 'download_file_name', type: 'VARCHAR(255)', key: '', nullable: true, defaultVal: 'NULL', desc: 'File name for student PDF download.' },
        { name: 'download_url', type: 'VARCHAR(500)', key: '', nullable: true, defaultVal: 'NULL', desc: 'Direct URL or endpoint for full paper PDF.' },
        { name: 'created_at', type: 'DATETIME', key: '', nullable: false, defaultVal: 'CURRENT_TIMESTAMP', desc: 'Timestamp of PYP catalog entry.' },
      ]
    },
    {
      id: 'test_attempts',
      name: 'test_attempts',
      badge: 'Student Live Submissions',
      color: 'amber',
      rowCount: attempts.length,
      description: 'Candidate test submission logs recording chosen responses, accuracy, score, percentile ranking, and granular sector performance analysis.',
      primaryKey: 'id',
      indexes: ['user_id', 'test_id', 'submitted_at'],
      columns: [
        { name: 'id', type: 'VARCHAR(64)', key: 'PK', nullable: false, defaultVal: 'att-id', desc: 'Primary key identifying unique submission attempt.' },
        { name: 'user_id', type: 'VARCHAR(64)', key: 'INDEX', nullable: false, defaultVal: "''", desc: 'Identifier of candidate student submitting attempt.' },
        { name: 'user_name', type: 'VARCHAR(150)', key: '', nullable: false, defaultVal: "''", desc: 'Full name of candidate at time of submission.' },
        { name: 'test_id', type: 'VARCHAR(64)', key: 'FK', nullable: false, defaultVal: "''", desc: 'Foreign key referencing mock_tests.id of attempted exam.' },
        { name: 'test_title', type: 'VARCHAR(255)', key: '', nullable: false, defaultVal: "''", desc: 'Snapshotted title of attempted test.' },
        { name: 'category', type: 'VARCHAR(50)', key: '', nullable: false, defaultVal: "'CGSSB'", desc: 'Exam category of attempted test.' },
        { name: 'submitted_at', type: 'DATETIME', key: 'INDEX', nullable: false, defaultVal: 'CURRENT_TIMESTAMP', desc: 'Exact submission timestamp.' },
        { name: 'time_taken_seconds', type: 'INT', key: '', nullable: false, defaultVal: '0', desc: 'Time spent in test by candidate (seconds).' },
        { name: 'score', type: 'DECIMAL(6,2)', key: '', nullable: false, defaultVal: '0.00', desc: 'Final calculated net score after negative marks.' },
        { name: 'max_score', type: 'DECIMAL(6,2)', key: '', nullable: false, defaultVal: '100.00', desc: 'Total maximum paper marks.' },
        { name: 'percentage', type: 'DECIMAL(5,2)', key: '', nullable: false, defaultVal: '0.00', desc: 'Calculated percentage score.' },
        { name: 'accuracy', type: 'DECIMAL(5,2)', key: '', nullable: false, defaultVal: '0.00', desc: 'Accuracy percentage (correct / attempted).' },
        { name: 'correct_count', type: 'INT', key: '', nullable: false, defaultVal: '0', desc: 'Count of correct responses.' },
        { name: 'incorrect_count', type: 'INT', key: '', nullable: false, defaultVal: '0', desc: 'Count of incorrect responses deducted.' },
        { name: 'unattempted_count', type: 'INT', key: '', nullable: false, defaultVal: '0', desc: 'Count of skipped questions.' },
        { name: 'simulated_rank', type: 'INT', key: '', nullable: true, defaultVal: '1', desc: 'State-wide simulated rank.' },
        { name: 'percentile', type: 'DECIMAL(5,2)', key: '', nullable: true, defaultVal: '50.00', desc: 'Calculated percentile among all test participants.' },
        { name: 'responses', type: 'JSON', key: '', nullable: false, defaultVal: '{}', desc: 'Key-value map of questionId -> chosenOption (A, B, C, D).' },
        { name: 'sector_analysis', type: 'JSON', key: '', nullable: false, defaultVal: '{}', desc: 'Granular subject, topic, and difficulty diagnostic analysis.' },
      ]
    }
  ];

  const handleCopyDdl = () => {
    navigator.clipboard.writeText(MYSQL_DDL_SCRIPT);
    setCopiedDdl(true);
    setTimeout(() => setCopiedDdl(false), 2500);
  };

  const filteredColumns = useMemo(() => {
    const query = schemaSearchQuery.trim().toLowerCase();
    const activeTables = selectedSchemaTable === 'all' 
      ? SCHEMA_TABLES 
      : SCHEMA_TABLES.filter(t => t.id === selectedSchemaTable);

    if (!query) return activeTables;

    return activeTables.map(t => ({
      ...t,
      columns: t.columns.filter(c => 
        c.name.toLowerCase().includes(query) ||
        c.type.toLowerCase().includes(query) ||
        c.desc.toLowerCase().includes(query) ||
        c.key.toLowerCase().includes(query)
      )
    })).filter(t => t.columns.length > 0);
  }, [selectedSchemaTable, schemaSearchQuery]);

  // -------------------------------------------------------------
  // 3. PRINTABLE PDF QUESTION PAPER GENERATOR
  // -------------------------------------------------------------
  const selectedTest = useMemo(() => {
    return tests.find(t => t.id === selectedTestId) || tests[0];
  }, [tests, selectedTestId]);

  const testQuestions = useMemo(() => {
    if (!selectedTest) return [];
    const qMap = new Map<string, Question>();
    questions.forEach(q => qMap.set(q.id, q));

    const testQIds = selectedTest.sections?.flatMap(s => s.questionIds) || [];
    return testQIds.map(id => qMap.get(id)).filter((q): q is Question => !!q);
  }, [selectedTest, questions]);

  const handlePrintQuestionPaper = () => {
    if (!selectedTest || testQuestions.length === 0) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocked. Please allow popups to open the printable question paper.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${selectedTest.title} - Question Paper</title>
        <meta charset="utf-8" />
        <style>
          @page {
            size: A4;
            margin: 15mm 12mm 15mm 12mm;
          }
          body {
            font-family: 'Times New Roman', serif, sans-serif;
            color: #111;
            line-height: 1.35;
            font-size: 11pt;
            background: #fff;
            margin: 0;
            padding: 0;
          }
          .header-box {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 15px;
          }
          .org-title {
            font-size: 14pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .test-title {
            font-size: 12pt;
            font-weight: bold;
            margin-top: 4px;
          }
          .meta-strip {
            display: flex;
            justify-content: space-between;
            font-size: 9pt;
            margin-top: 6px;
            border-top: 1px solid #ccc;
            padding-top: 4px;
          }
          .watermark {
            position: fixed;
            top: 45%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-35deg);
            font-size: 38pt;
            color: rgba(0, 0, 0, 0.05);
            font-weight: bold;
            text-transform: uppercase;
            z-index: -1;
            pointer-events: none;
            width: 90%;
            text-align: center;
          }
          .two-column-grid {
            column-count: 2;
            column-gap: 20px;
            column-rule: 1px solid #ddd;
          }
          .question-card {
            break-inside: avoid;
            margin-bottom: 16px;
            padding-bottom: 8px;
            border-bottom: 1px dotted #ccc;
          }
          .q-num {
            font-weight: bold;
            float: left;
            margin-right: 5px;
          }
          .q-text-hi {
            font-weight: 600;
            margin-bottom: 2px;
          }
          .q-text-en {
            font-style: italic;
            color: #333;
            font-size: 9.5pt;
            margin-bottom: 6px;
          }
          .options-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4px;
            font-size: 9.5pt;
            margin-top: 4px;
          }
          .omr-sheet-page {
            page-break-before: always;
            padding-top: 20px;
          }
          .omr-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9pt;
            margin-top: 10px;
          }
          .omr-table td, .omr-table th {
            border: 1px solid #333;
            padding: 4px;
            text-align: center;
          }
          .bubble {
            display: inline-block;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            border: 1px solid #333;
            margin: 0 2px;
            font-size: 7pt;
            line-height: 14px;
            text-align: center;
          }
          .answers-page {
            page-break-before: always;
            padding-top: 20px;
          }
          .answer-key-grid {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 6px;
            font-size: 9pt;
            font-family: monospace;
          }
          .key-item {
            border: 1px solid #bbb;
            padding: 4px;
            text-align: center;
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <div class="watermark">${coachingWatermark}</div>

        <div class="header-box">
          <div class="org-title">${coachingWatermark}</div>
          <div class="test-title">${selectedTest.title}</div>
          <div class="meta-strip">
            <span><strong>Total Questions:</strong> ${testQuestions.length}</span>
            <span><strong>Time Allowed:</strong> ${selectedTest.durationMinutes} Minutes</span>
            <span><strong>Max Marks:</strong> ${testQuestions.length * (selectedTest.marksPerQuestion || 1)}</span>
            <span><strong>Negative:</strong> -${selectedTest.negativeMarksPerQuestion || '0.33'}</span>
          </div>
        </div>

        <div class="two-column-grid">
          ${testQuestions
            .map(
              (q, idx) => `
            <div class="question-card">
              <span class="q-num">Q.${idx + 1}</span>
              <div>
                ${q.questionHindi ? `<div class="q-text-hi">${q.questionHindi}</div>` : ''}
                ${q.questionText ? `<div class="q-text-en">${q.questionText}</div>` : ''}
                <div class="options-grid">
                  ${(q.options || [])
                    .map(
                      (opt, oIdx) => `
                    <div>(${['A', 'B', 'C', 'D'][oIdx]}) ${opt.textHindi || opt.text}</div>
                  `
                    )
                    .join('')}
                </div>
              </div>
            </div>
          `
            )
            .join('')}
        </div>

        ${
          includeOmr
            ? `
          <div class="omr-sheet-page">
            <div class="header-box">
              <div class="org-title">OFFICIAL CANDIDATE OMR ANSWER SHEET</div>
              <div class="test-title">${selectedTest.title}</div>
            </div>
            <div style="font-size: 9pt; margin-bottom: 10px;">
              <strong>Candidate Roll No:</strong> ____________________ | <strong>Signature:</strong> ____________________
            </div>
            <table class="omr-table">
              <thead>
                <tr>
                  <th>Q.No</th><th>Response Bubbles</th>
                  <th>Q.No</th><th>Response Bubbles</th>
                  <th>Q.No</th><th>Response Bubbles</th>
                </tr>
              </thead>
              <tbody>
                ${Array.from({ length: Math.ceil(testQuestions.length / 3) })
                  .map((_, rowIdx) => {
                    const q1 = rowIdx + 1;
                    const q2 = rowIdx + 1 + Math.ceil(testQuestions.length / 3);
                    const q3 = rowIdx + 1 + Math.ceil(testQuestions.length / 3) * 2;
                    return `
                    <tr>
                      <td>${q1 <= testQuestions.length ? q1 : ''}</td>
                      <td>${
                        q1 <= testQuestions.length
                          ? `<span class="bubble">A</span><span class="bubble">B</span><span class="bubble">C</span><span class="bubble">D</span>`
                          : ''
                      }</td>
                      <td>${q2 <= testQuestions.length ? q2 : ''}</td>
                      <td>${
                        q2 <= testQuestions.length
                          ? `<span class="bubble">A</span><span class="bubble">B</span><span class="bubble">C</span><span class="bubble">D</span>`
                          : ''
                      }</td>
                      <td>${q3 <= testQuestions.length ? q3 : ''}</td>
                      <td>${
                        q3 <= testQuestions.length
                          ? `<span class="bubble">A</span><span class="bubble">B</span><span class="bubble">C</span><span class="bubble">D</span>`
                          : ''
                      }</td>
                    </tr>
                  `;
                  })
                  .join('')}
              </tbody>
            </table>
          </div>
        `
            : ''
        }

        ${
          includeSolutionsKey
            ? `
          <div class="answers-page">
            <div class="header-box">
              <div class="org-title">OFFICIAL ANSWER KEY & EXPLANATORY SOLUTIONS</div>
              <div class="test-title">${selectedTest.title}</div>
            </div>
            <div class="answer-key-grid">
              ${testQuestions
                .map(
                  (q, idx) => `
                <div class="key-item">
                  <strong>Q.${idx + 1}:</strong> [${q.correctOption}]
                </div>
              `
                )
                .join('')}
            </div>

            <div style="margin-top: 20px; font-size: 9.5pt;">
              <h4 style="border-bottom: 1px solid #333; padding-bottom: 4px;">Detailed Explanations:</h4>
              ${testQuestions
                .map(
                  (q, idx) => `
                <div style="margin-bottom: 10px; break-inside: avoid;">
                  <strong>Q.${idx + 1} (${q.correctOption}):</strong>
                  <span>${q.explanationHindi || q.explanation || 'No explanation.'}</span>
                </div>
              `
                )
                .join('')}
            </div>
          </div>
        `
            : ''
        }

        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 400);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl relative">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-md px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center space-x-2">
                <span>Database Snapshots, Quality Scanner & PDF Generator</span>
              </h2>
              <p className="text-xs text-slate-400">Platform maintenance, deduplication audit, and printable coaching materials</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-4 border-b border-slate-800/80 flex items-center space-x-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab('backup')}
            className={`pb-3 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border-b-2 shrink-0 ${
              activeTab === 'backup'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>DB Backup & Restore</span>
          </button>

          <button
            onClick={() => setActiveTab('schema')}
            className={`pb-3 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border-b-2 shrink-0 ${
              activeTab === 'schema'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Database Schema & Architecture</span>
          </button>

          <button
            onClick={() => setActiveTab('pdf')}
            className={`pb-3 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border-b-2 shrink-0 ${
              activeTab === 'pdf'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Printable PDF & OMR Generator</span>
          </button>

          <button
            onClick={() => setActiveTab('quality')}
            className={`pb-3 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border-b-2 shrink-0 ${
              activeTab === 'quality'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Question Bank Quality Scanner ({qualityReport.healthScore}%)</span>
          </button>
        </div>

        {/* Success toast */}
        {backupSuccessMessage && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{backupSuccessMessage}</span>
          </div>
        )}

        <div className="p-6">
          {/* TAB 1: DB BACKUP */}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">Full Platform Snapshot (One-Click Backup)</h3>
                    <p className="text-xs text-slate-400">Download a full JSON image of all tests, questions, previous year papers, and student attempt histories.</p>
                  </div>
                  <button
                    onClick={handleDownloadSnapshot}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition flex items-center space-x-2 shadow-lg shadow-indigo-600/20 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download DB Snapshot (.json)</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800 text-xs">
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Total Mock Tests</span>
                    <strong className="text-white text-sm">{tests.length}</strong>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Question Bank</span>
                    <strong className="text-white text-sm">{questions.length}</strong>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">PYP Papers</span>
                    <strong className="text-white text-sm">{pypPapers.length}</strong>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Attempt Logs</span>
                    <strong className="text-white text-sm">{attempts.length}</strong>
                  </div>
                </div>
              </div>

              {/* Restore & Purge Section */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-white">Restore & Sync Options</h3>
                  <p className="text-xs text-slate-400">Restore database from a previously downloaded JSON snapshot file or purge local browser storage to load the fresh server catalog.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <label className="inline-flex items-center px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 cursor-pointer transition space-x-2">
                    <Upload className="w-4 h-4" />
                    <span>Select Snapshot File (.json)</span>
                    <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                  </label>

                  <button
                    onClick={() => {
                      if (window.confirm('Reset all mock tests and question banks to factory default? Any unexported local drafts will be overwritten.')) {
                        localStorage.removeItem('cgssb_tests');
                        localStorage.removeItem('cgssb_questions');
                        localStorage.removeItem('cgssb_pyp');
                        localStorage.removeItem('kavya_custom_hierarchy_v2');
                        window.location.reload();
                      }
                    }}
                    className="inline-flex items-center px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30 transition space-x-2 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Purge Local Storage & Reload Master Catalog</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DATABASE SCHEMA & ARCHITECTURE */}
          {activeTab === 'schema' && (
            <div className="space-y-6">
              {/* Architecture & Specs Banner */}
              <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/60 border border-indigo-900/40 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[11px] font-mono font-bold mb-1 border border-indigo-500/30">
                      <Server className="w-3 h-3 text-indigo-400" />
                      <span>MySQL 8.0+ / MariaDB Production Schema</span>
                    </div>
                    <h3 className="text-base font-black text-white">Relational Database Architecture & ERD</h3>
                    <p className="text-xs text-slate-300">
                      ACID-compliant relational structure configured with <code className="text-indigo-300 font-mono">utf8mb4_unicode_ci</code> for full bilingual Devnagari Hindi text and LaTeX mathematical expressions.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={handleCopyDdl}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-lg shadow-indigo-600/20 cursor-pointer active:scale-95"
                    >
                      {copiedDdl ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedDdl ? 'DDL Copied!' : 'Copy Schema SQL'}</span>
                    </button>
                  </div>
                </div>

                {/* Storage Engine Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-800 text-xs">
                  <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-mono">Storage Engine</span>
                    <strong className="text-indigo-300 text-xs">InnoDB (Row Locks & ACID)</strong>
                  </div>
                  <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-mono">Character Set</span>
                    <strong className="text-emerald-300 text-xs">utf8mb4 (Hindi + LaTeX)</strong>
                  </div>
                  <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-mono">Connection Pool</span>
                    <strong className="text-amber-300 text-xs">30 Concurrent Workers</strong>
                  </div>
                  <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-mono">Total Tables</span>
                    <strong className="text-teal-300 text-xs">4 Core Tables (88 Columns)</strong>
                  </div>
                </div>
              </div>

              {/* Visual Entity-Relationship Cards */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                    <Network className="w-4 h-4 text-indigo-400" />
                    <span>Entity-Relationship Architecture (Click table to inspect)</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">Live Memory Sync Active</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {SCHEMA_TABLES.map(table => {
                    const isSelected = selectedSchemaTable === table.id;
                    const borderClass = isSelected
                      ? 'border-indigo-500 bg-indigo-950/20 shadow-indigo-500/10'
                      : 'border-slate-800 hover:border-slate-700 bg-slate-950/60';

                    return (
                      <div
                        key={table.id}
                        onClick={() => setSelectedSchemaTable(isSelected ? 'all' : (table.id as any))}
                        className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer relative shadow-lg ${borderClass}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                              <Table className="w-4 h-4" />
                            </div>
                            <span className="font-mono font-bold text-sm text-white">{table.name}</span>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-mono text-indigo-300 border border-slate-700">
                              {table.columns.length} Cols
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-[10px] font-mono text-emerald-300 border border-emerald-500/30">
                              {table.rowCount} Rows
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-400 leading-relaxed mb-3">
                          {table.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-slate-400">
                          <span className="text-amber-400 font-semibold">PK: {table.primaryKey}</span>
                          <span>•</span>
                          <span className="text-slate-500 truncate max-w-[240px]">
                            Indexes: {table.indexes.join(', ')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Relational Foreign Key Connections Flow */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Foreign Key & Relational Mappings</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-indigo-400 font-bold">mock_tests.sections[].questionIds</span>
                      <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[9px] font-mono">1 : N (Many)</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Sections JSON array embeds question IDs referencing <code className="text-white font-mono">questions.id</code> to assemble exam papers.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-emerald-400 font-bold">pyp_papers.linked_mock_test_id</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-mono">1 : 1 (Link)</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Links official historical archives directly to interactive playable exams in <code className="text-white font-mono">mock_tests.id</code>.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-amber-400 font-bold">test_attempts.test_id</span>
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-mono">N : 1 (Attempts)</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Foreign reference connecting candidate submission logs to the parent <code className="text-white font-mono">mock_tests.id</code>.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-teal-400 font-bold">test_attempts.user_id</span>
                      <span className="px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 text-[9px] font-mono">N : 1 (Candidate)</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Associates live attempt results, diagnostic sector scores, and ranks with the authenticated student candidate.
                    </p>
                  </div>
                </div>
              </div>

              {/* Data Dictionary & Column Inspector */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                      <HardDrive className="w-4 h-4 text-indigo-400" />
                      <span>Data Dictionary & Column Definitions</span>
                    </h4>
                    <p className="text-xs text-slate-400">Examine columns, data types, constraints, and business logic mapping.</p>
                  </div>

                  {/* Filter & Search */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search column or type..."
                        value={schemaSearchQuery}
                        onChange={e => setSchemaSearchQuery(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-44"
                      />
                    </div>
                  </div>
                </div>

                {/* Table Filter Pills */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSelectedSchemaTable('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      selectedSchemaTable === 'all'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    All Tables (4)
                  </button>
                  {SCHEMA_TABLES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedSchemaTable(t.id as any)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono transition cursor-pointer flex items-center space-x-1.5 ${
                        selectedSchemaTable === t.id
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      <span>{t.name}</span>
                      <span className="text-[10px] opacity-70">({t.columns.length})</span>
                    </button>
                  ))}
                </div>

                {/* Column Table Listing */}
                <div className="space-y-6">
                  {filteredColumns.map(table => (
                    <div key={table.id} className="border border-slate-800/80 rounded-2xl overflow-hidden bg-slate-900/70 shadow-md">
                      <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Table className="w-4 h-4 text-indigo-400" />
                          <span className="font-mono font-bold text-sm text-white">{table.name}</span>
                          <span className="text-xs text-slate-400">({table.badge})</span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">{table.columns.length} columns defined</span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-950/80 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
                            <tr>
                              <th className="px-4 py-2.5">Column Name</th>
                              <th className="px-4 py-2.5">Data Type</th>
                              <th className="px-4 py-2.5">Key / Index</th>
                              <th className="px-4 py-2.5">Nullable</th>
                              <th className="px-4 py-2.5">Default</th>
                              <th className="px-4 py-2.5">Purpose & Description</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/50">
                            {table.columns.map((col, idx) => (
                              <tr key={idx} className="hover:bg-slate-800/30 transition">
                                <td className="px-4 py-2.5 font-mono font-bold text-white whitespace-nowrap">
                                  {col.name}
                                </td>
                                <td className="px-4 py-2.5 font-mono text-[11px] whitespace-nowrap">
                                  <span className={`px-2 py-0.5 rounded-md font-semibold ${
                                    col.type.includes('JSON')
                                      ? 'bg-purple-500/10 text-purple-300 border border-purple-500/30'
                                      : col.type.includes('VARCHAR') || col.type.includes('TEXT')
                                      ? 'bg-blue-500/10 text-blue-300 border border-blue-500/30'
                                      : col.type.includes('ENUM')
                                      ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                                      : col.type.includes('DECIMAL') || col.type.includes('INT')
                                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                                  }`}>
                                    {col.type}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 font-mono text-[11px] whitespace-nowrap">
                                  {col.key === 'PK' && (
                                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 inline-flex items-center space-x-1">
                                      <Key className="w-2.5 h-2.5" />
                                      <span>PK</span>
                                    </span>
                                  )}
                                  {col.key === 'UK' && (
                                    <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold border border-teal-500/40">
                                      UNIQUE
                                    </span>
                                  )}
                                  {col.key === 'FK' && (
                                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                                      FK
                                    </span>
                                  )}
                                  {col.key === 'FK_REL' && (
                                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40">
                                      REL_JSON
                                    </span>
                                  )}
                                  {col.key === 'INDEX' && (
                                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/30">
                                      INDEX
                                    </span>
                                  )}
                                  {!col.key && <span className="text-slate-600">—</span>}
                                </td>
                                <td className="px-4 py-2.5 font-mono text-[11px] text-slate-400">
                                  {col.nullable ? 'YES' : 'NO'}
                                </td>
                                <td className="px-4 py-2.5 font-mono text-[11px] text-slate-300">
                                  {col.defaultVal}
                                </td>
                                <td className="px-4 py-2.5 text-slate-300 leading-relaxed min-w-[220px]">
                                  {col.desc}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Raw SQL Preview Block */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                    <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Raw MySQL Schema SQL (schema.sql)</span>
                  </h4>
                  <button
                    onClick={handleCopyDdl}
                    className="text-[11px] font-mono text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedDdl ? 'Copied' : 'Copy SQL'}</span>
                  </button>
                </div>
                <pre className="p-3 rounded-xl bg-slate-900 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48 border border-slate-800">
                  {MYSQL_DDL_SCRIPT}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: PRINTABLE PDF */}
          {activeTab === 'pdf' && (
            <div className="space-y-6">
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white">2-Column Bilingual PDF Paper & OMR Generator</h3>
                  <p className="text-xs text-slate-400">Generate clean, printable question papers with watermark and official bubble OMR sheets for offline coaching or personal test practice.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Select Mock Test or PYP Paper</label>
                    <select
                      value={selectedTestId}
                      onChange={e => setSelectedTestId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      {tests.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.title} ({t.sections?.flatMap(s => s.questionIds).length || 0} Qs)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Watermark / Header Name</label>
                    <input
                      type="text"
                      value={coachingWatermark}
                      onChange={e => setCoachingWatermark(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      placeholder="e.g. Lakshya Academy Raipur"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeOmr}
                      onChange={e => setIncludeOmr(e.target.checked)}
                      className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                    />
                    <span>Include Printable Candidate OMR Sheet</span>
                  </label>

                  <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeSolutionsKey}
                      onChange={e => setIncludeSolutionsKey(e.target.checked)}
                      className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                    />
                    <span>Include Official Answer Key & Solutions at End</span>
                  </label>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={handlePrintQuestionPaper}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition flex items-center space-x-2 shadow-lg shadow-indigo-600/20 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Generate & Print Question Paper ({testQuestions.length} Qs)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: QUALITY SCANNER */}
          {activeTab === 'quality' && (
            <div className="space-y-6">
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">Question Bank Integrity & Deduplication Audit</h3>
                    <p className="text-xs text-slate-400">Scans all questions for duplicates, missing Hindi translations, and incomplete solutions.</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Bank Health Score</span>
                    <span className="text-xl font-black text-emerald-400">{qualityReport.healthScore} / 100</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Duplicates Detected</span>
                    <strong className="text-rose-400 text-base">{qualityReport.duplicates.length}</strong>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Missing Hindi Text</span>
                    <strong className="text-amber-400 text-base">{qualityReport.missingHindi.length}</strong>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Missing Explanations</span>
                    <strong className="text-teal-400 text-base">{qualityReport.missingExplanations.length}</strong>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Incomplete Options</span>
                    <strong className="text-indigo-400 text-base">{qualityReport.missingOptions.length}</strong>
                  </div>
                </div>

                {qualityReport.duplicates.length === 0 ? (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>No duplicate questions detected! All items have unique stems.</span>
                  </div>
                ) : (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold text-rose-400 block">Flagged Duplicate Items:</span>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {qualityReport.duplicates.map((dup, i) => (
                        <div key={i} className="p-2.5 rounded-xl bg-slate-900 border border-rose-500/30 text-xs">
                          <p className="text-white font-medium">{dup.original.questionText || dup.original.question}</p>
                          <div className="text-[10px] text-slate-400 mt-1 flex items-center space-x-2">
                            <span>Original ID: {dup.original.id}</span>
                            <span>•</span>
                            <span>Duplicate ID: {dup.duplicate.id}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
