import React, { useState, useMemo } from 'react';
import { MockTest, Question, PreviousYearPaper, TestAttempt } from '../types';
import { isFirebaseConfigured } from '../firebase/config';
import { migrateAllLocalDataToFirestore, MigrationSummary } from '../firebase/firestoreService';
import { getStoredBundles } from '../utils/bundleStore';
import {
  Database,
  Table,
  GitBranch,
  Key,
  Network,
  HardDrive,
  Code2,
  Server,
  ArrowRight,
  Download,
  Upload,
  RefreshCw,
  Search,
  CheckCircle2,
  Check,
  Copy,
  Zap,
  ShieldCheck,
  Activity,
  Cpu,
  Layers,
  FileCode,
  ExternalLink,
  Cloud,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface AdminDatabaseViewProps {
  tests: MockTest[];
  questions: Question[];
  pypPapers: PreviousYearPaper[];
  attempts: TestAttempt[];
  onRestoreSnapshot?: (data: { tests: MockTest[]; questions: Question[]; pypPapers: PreviousYearPaper[] }) => void;
  onOpenToolsModal?: () => void;
}

export const AdminDatabaseView: React.FC<AdminDatabaseViewProps> = ({
  tests,
  questions,
  pypPapers,
  attempts,
  onRestoreSnapshot,
  onOpenToolsModal,
}) => {
  const [selectedSchemaTable, setSelectedSchemaTable] = useState<'all' | 'questions' | 'mock_tests' | 'previous_year_papers' | 'test_attempts'>('all');
  const [schemaSearchQuery, setSchemaSearchQuery] = useState('');
  const [copiedDdl, setCopiedDdl] = useState(false);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);

  // Firebase Cloud Migration state
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<string | null>(null);
  const [migrationProgress, setMigrationProgress] = useState<{ current: number; total: number } | null>(null);
  const [migrationResult, setMigrationResult] = useState<MigrationSummary | null>(null);

  const handleMigrateToFirebase = async () => {
    if (!isFirebaseConfigured) {
      alert('Firebase is not configured yet. Please check your firebase-applet-config.json file.');
      return;
    }
    const confirmed = window.confirm(
      `Sync all ${questions.length} questions, ${tests.length} tests, and test series bundles directly to your Cloud Firestore Database (asia-south1 / Mumbai)?`
    );
    if (!confirmed) return;

    setIsMigrating(true);
    setMigrationResult(null);
    setMigrationStatus('Starting Firebase Cloud Firestore batch migration...');

    try {
      const storedBundles = getStoredBundles();
      const result = await migrateAllLocalDataToFirestore({
        questions,
        tests,
        bundles: storedBundles,
        attempts,
        onProgress: (msg, current, total) => {
          setMigrationStatus(msg);
          setMigrationProgress({ current, total });
        },
      });

      setMigrationResult(result);
      if (result.success) {
        setBackupMessage(`Successfully synced ${result.questionsCount} questions, ${result.testsCount} tests, and ${result.bundlesCount} bundles to Cloud Firestore!`);
      }
    } catch (err: any) {
      console.error('Migration error:', err);
      setMigrationStatus(`Migration error: ${err?.message || 'Failed'}`);
    } finally {
      setIsMigrating(false);
    }
  };

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

  const handleDownloadSnapshot = () => {
    const dbSnapshot = {
      version: '2.5.0',
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

    setBackupMessage('Snapshot downloaded successfully!');
    setTimeout(() => setBackupMessage(null), 3000);
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-900/50 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-bold">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span>Production MySQL 8.0+ & MariaDB Schema Architecture</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Database Engine & Architecture Explorer
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Live schema inspection, Entity-Relationship mappings (ERD), full bilingual UTF-8 character encoding, and 1-click snapshot management.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2.5 shrink-0 items-center">
            <button
              onClick={handleCopyDdl}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center space-x-2 transition shadow-lg shadow-indigo-600/20 active:scale-95 cursor-pointer"
            >
              {copiedDdl ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copiedDdl ? 'DDL Copied!' : 'Copy Schema DDL'}</span>
            </button>

            <button
              onClick={handleDownloadSnapshot}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-2 transition shadow-lg shadow-emerald-600/20 active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download DB JSON Backup</span>
            </button>

            {onOpenToolsModal && (
              <button
                onClick={onOpenToolsModal}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center space-x-2 transition border border-slate-700 cursor-pointer"
              >
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>All Backup & PDF Tools</span>
              </button>
            )}
          </div>
        </div>

        {/* Success Alert */}
        {backupMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{backupMessage}</span>
          </div>
        )}
      </div>

      {/* Firebase Cloud Firestore Migration & Hostinger Static Hosting Center */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 border border-amber-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold">
              <Cloud className="w-3.5 h-3.5 text-amber-400" />
              <span>Firebase Cloud Firestore Migration (Static Hosting Ready)</span>
            </div>
            <h2 className="text-xl font-black text-white">
              Hostinger Premium Web Hosting + Firebase Database
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Your static web hosting (Apache/LiteSpeed on Hostinger) serves the React app bundle directly via <code className="text-amber-300 font-mono">public_html</code>.
              All live questions, mock tests, bundles, and attempts connect directly to <strong className="text-white">Google Cloud Firestore (Mumbai asia-south1)</strong> with 0 server crashes, 0 maintenance, and 100% Free Tier scaling.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <button
              onClick={handleMigrateToFirebase}
              disabled={isMigrating}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs flex items-center justify-center space-x-2 transition shadow-xl shadow-amber-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isMigrating ? (
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
              ) : (
                <Zap className="w-4 h-4 text-slate-950" />
              )}
              <span>{isMigrating ? 'Migrating to Cloud Firestore...' : '1-Click Migrate All Data to Firebase'}</span>
            </button>
          </div>
        </div>

        {/* Progress & Result Box */}
        {(isMigrating || migrationStatus || migrationResult) && (
          <div className="mt-5 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center space-x-2">
                {isMigrating ? <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                <span>{migrationStatus}</span>
              </span>
              {migrationProgress && (
                <span className="font-mono text-amber-300 font-bold">
                  {Math.round((migrationProgress.current / (migrationProgress.total || 1)) * 100)}% ({migrationProgress.current}/{migrationProgress.total})
                </span>
              )}
            </div>

            {migrationProgress && (
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.round((migrationProgress.current / (migrationProgress.total || 1)) * 100)}%` }}
                />
              </div>
            )}

            {migrationResult && migrationResult.success && (
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-center">
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-xs text-slate-400">Questions Synced</div>
                  <div className="text-lg font-black text-emerald-400">{migrationResult.questionsCount}</div>
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-xs text-slate-400">Mock Tests Synced</div>
                  <div className="text-lg font-black text-blue-400">{migrationResult.testsCount}</div>
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-xs text-slate-400">Series Bundles</div>
                  <div className="text-lg font-black text-amber-400">{migrationResult.bundlesCount}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4.5 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-xs font-medium">Questions Bank</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Table className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{questions.length}</div>
          <span className="text-[11px] text-indigo-300 font-mono mt-1 block">`questions` table (28 cols)</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4.5 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-xs font-medium">Mock Test Series</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{tests.length}</div>
          <span className="text-[11px] text-blue-300 font-mono mt-1 block">`mock_tests` table (22 cols)</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4.5 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-xs font-medium">PYP Archives</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{pypPapers.length}</div>
          <span className="text-[11px] text-emerald-300 font-mono mt-1 block">`previous_year_papers` (18 cols)</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4.5 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-xs font-medium">Live Attempt Logs</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{attempts.length}</div>
          <span className="text-[11px] text-amber-300 font-mono mt-1 block">`test_attempts` (20 cols)</span>
        </div>
      </div>

      {/* ERD Architecture Diagram Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Network className="w-4 h-4 text-indigo-400" />
              <span>Visual Entity-Relationship Architecture (ERD)</span>
            </h2>
            <p className="text-xs text-slate-400">Click on any table card to filter its detailed columns and data dictionary below.</p>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30">
            InnoDB Engine • utf8mb4_unicode_ci
          </span>
        </div>

        {/* 4 Interactive ERD Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SCHEMA_TABLES.map(table => {
            const isSelected = selectedSchemaTable === table.id;
            const borderClass = isSelected
              ? 'border-indigo-500 bg-indigo-950/20 shadow-indigo-500/10'
              : 'border-slate-800 hover:border-slate-700 bg-slate-950/70';

            return (
              <div
                key={table.id}
                onClick={() => setSelectedSchemaTable(isSelected ? 'all' : (table.id as any))}
                className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer relative shadow-lg ${borderClass}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                      <Table className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-mono font-black text-base text-white block">{table.name}</span>
                      <span className="text-[11px] text-slate-400">{table.badge}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="px-2.5 py-1 rounded-md bg-slate-800 text-[10px] font-mono text-indigo-300 border border-slate-700">
                      {table.columns.length} Columns
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-[10px] font-mono text-emerald-300 border border-emerald-500/30">
                      {table.rowCount} Loaded
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  {table.description}
                </p>

                <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-800/80">
                  <span className="text-amber-400 font-bold">PK: {table.primaryKey}</span>
                  <span>•</span>
                  <span className="text-slate-400">
                    Indexes: {table.indexes.join(', ')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Relational Foreign Key Flow Cards */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
            <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
            <span>Foreign Key & Relational Connectors</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-indigo-400 font-bold">mock_tests.sections[].questionIds</span>
                <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[9px] font-mono font-bold">1 : N (Many)</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Sections JSON array embeds question IDs referencing <code className="text-white font-mono">questions.id</code> to assemble exam papers.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-emerald-400 font-bold">pyp_papers.linked_mock_test_id</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-mono font-bold">1 : 1 (Link)</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Links official historical archives directly to interactive playable exams in <code className="text-white font-mono">mock_tests.id</code>.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-amber-400 font-bold">test_attempts.test_id</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-mono font-bold">N : 1 (Attempts)</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Foreign reference connecting candidate submission logs to the parent <code className="text-white font-mono">mock_tests.id</code>.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-teal-400 font-bold">test_attempts.user_id</span>
                <span className="px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 text-[9px] font-mono font-bold">N : 1 (Candidate)</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Associates live attempt results, diagnostic sector scores, and ranks with the authenticated student candidate.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Data Dictionary & Column Inspector */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <HardDrive className="w-4 h-4 text-indigo-400" />
              <span>Data Dictionary & Column Definitions</span>
            </h2>
            <p className="text-xs text-slate-400">Examine columns, data types, constraints, and business logic mapping.</p>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search column or type..."
              value={schemaSearchQuery}
              onChange={e => setSchemaSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-52"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedSchemaTable('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedSchemaTable === 'all'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All Tables (4)
          </button>
          {SCHEMA_TABLES.map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedSchemaTable(t.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono transition cursor-pointer flex items-center space-x-1.5 ${
                selectedSchemaTable === t.id
                  ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>{t.name}</span>
              <span className="text-[10px] opacity-70">({t.columns.length})</span>
            </button>
          ))}
        </div>

        {/* Table Listing */}
        <div className="space-y-6">
          {filteredColumns.map(table => (
            <div key={table.id} className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/70 shadow-lg">
              <div className="bg-slate-950 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <Table className="w-4 h-4 text-indigo-400" />
                  <span className="font-mono font-bold text-sm text-white">{table.name}</span>
                  <span className="text-xs text-slate-400">({table.badge})</span>
                </div>
                <span className="text-[11px] font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/30">
                  {table.columns.length} columns defined
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/90 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-2.5">Column Name</th>
                      <th className="px-4 py-2.5">Data Type</th>
                      <th className="px-4 py-2.5">Key / Index</th>
                      <th className="px-4 py-2.5">Nullable</th>
                      <th className="px-4 py-2.5">Default</th>
                      <th className="px-4 py-2.5">Purpose & Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
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

      {/* Raw SQL Preview */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Code2 className="w-4 h-4 text-indigo-400" />
            <span>Complete MySQL DDL Source Code (server/db/schema.sql)</span>
          </h2>
          <button
            onClick={handleCopyDdl}
            className="px-3 py-1.5 rounded-lg bg-indigo-600/90 hover:bg-indigo-500 text-white font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copiedDdl ? 'Copied' : 'Copy DDL'}</span>
          </button>
        </div>
        <pre className="p-4 rounded-2xl bg-slate-950 text-xs font-mono text-slate-300 overflow-x-auto max-h-72 border border-slate-800 leading-relaxed">
          {MYSQL_DDL_SCRIPT}
        </pre>
      </div>
    </div>
  );
};
