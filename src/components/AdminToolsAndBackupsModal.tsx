import React, { useState, useMemo } from 'react';
import { MockTest, Question, PreviousYearPaper, TestAttempt } from '../types';
import { APP_BUILD_INFO } from '../utils/buildInfo';
import { getStoredBundles } from '../utils/bundleStore';
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
  FolderTree,
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
  const [selectedSchemaCollection, setSelectedSchemaCollection] = useState<string>('all');
  const [schemaSearchQuery, setSchemaSearchQuery] = useState('');
  const [copiedBlueprint, setCopiedBlueprint] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState<string>(tests[0]?.id || '');
  const [includeOmr, setIncludeOmr] = useState(true);
  const [includeSolutionsKey, setIncludeSolutionsKey] = useState(true);
  const [coachingWatermark, setCoachingWatermark] = useState('CGSSB & CGPSC EXAM PREP PORTAL - CHHATTISGARH');
  const [backupSuccessMessage, setBackupSuccessMessage] = useState<string | null>(null);

  const storedBundles = useMemo(() => getStoredBundles(), []);

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
  // 2. CLOUD FIRESTORE SCHEMA METADATA & DATA DICTIONARY
  // -------------------------------------------------------------
  const FIRESTORE_BLUEPRINT_JSON = JSON.stringify({
    entities: {
      User: {
        title: "User",
        description: "Registered candidate profile with authentication and access pass details",
        type: "object",
        properties: {
          id: { type: "string", description: "Firebase Auth UID" },
          name: { type: "string", description: "Candidate full name" },
          email: { type: "string", description: "Candidate email address" },
          phone: { type: "string", description: "Candidate phone number" },
          role: { type: "string", enum: ["student", "admin"], description: "User access role" },
          hasProPass: { type: "boolean", description: "Whether candidate has active all-access pass" },
          proPassPlan: { type: "string", description: "Pass duration plan (monthly/yearly)" },
          passExpiresAt: { type: "string", description: "ISO timestamp of pass expiration" },
          targetExam: { type: "string", description: "Target exam e.g. CG Teacher, CGPSC" },
          targetYear: { type: "number", description: "Target exam year" },
          district: { type: "string", description: "Chhattisgarh residential district" },
          registeredAt: { type: "string", description: "Registration ISO timestamp" }
        },
        required: ["id", "email", "role", "registeredAt"]
      },
      MockTest: {
        title: "MockTest",
        description: "Full mock test or sectional test definition",
        type: "object",
        properties: {
          id: { type: "string", description: "Unique test identifier" },
          title: { type: "string", description: "Test title" },
          category: { type: "string", description: "Exam category e.g. CGSSB, CGPSC" },
          durationMinutes: { type: "number", description: "Test timer duration in minutes" },
          totalMarks: { type: "number", description: "Total marks for the test" },
          questionCount: { type: "number", description: "Number of questions in test" },
          isPublished: { type: "boolean", description: "Publish status" },
          isPro: { type: "boolean", description: "Whether test requires Pro Pass" },
          isPYP: { type: "boolean", description: "Whether paper is Previous Year Paper" },
          createdAt: { type: "string", description: "Creation ISO timestamp" }
        },
        required: ["id", "title", "category", "durationMinutes"]
      },
      Question: {
        title: "Question",
        description: "Bilingual examination question item",
        type: "object",
        properties: {
          id: { type: "string", description: "Question identifier" },
          questionText: { type: "string", description: "English question stem" },
          questionHindi: { type: "string", description: "Hindi question stem" },
          subject: { type: "string", description: "Subject classification" },
          topic: { type: "string", description: "Topic or chapter" },
          difficulty: { type: "string", description: "Difficulty level" },
          marks: { type: "number", description: "Marks for correct answer" },
          negativeMarks: { type: "number", description: "Penalty for incorrect answer" },
          correctOption: { type: "string", description: "Correct option index or letter" }
        },
        required: ["id", "questionText", "subject"]
      },
      TestSeriesBundle: {
        title: "TestSeriesBundle",
        description: "Test Series Bundle with curriculum, syllabus and dates",
        type: "object",
        properties: {
          id: { type: "string", description: "Bundle identifier" },
          slug: { type: "string", description: "URL slug for SEO landing page" },
          title: { type: "string", description: "Bundle title in English" },
          titleHindi: { type: "string", description: "Bundle title in Hindi" },
          authority: { type: "string", description: "Exam authority (CGSSB/CGPSC)" },
          price: { type: "number", description: "Offer price" },
          originalPrice: { type: "number", description: "MRP price" },
          totalTestsCount: { type: "number", description: "Total tests included" },
          freeTestsCount: { type: "number", description: "Free preview tests count" }
        },
        required: ["id", "slug", "title", "authority"]
      },
      TestAttempt: {
        title: "TestAttempt",
        description: "Student completed or in-progress test attempt submission",
        type: "object",
        properties: {
          id: { type: "string", description: "Attempt submission ID" },
          userId: { type: "string", description: "Attempting student UID" },
          testId: { type: "string", description: "Attempted mock test ID" },
          testTitle: { type: "string", description: "Title of the test" },
          score: { type: "number", description: "Final calculated score" },
          totalMarks: { type: "number", description: "Maximum marks possible" },
          accuracy: { type: "number", description: "Accuracy percentage" },
          timeSpentSeconds: { type: "number", description: "Time spent in seconds" },
          completedAt: { type: "string", description: "Submission ISO timestamp" }
        },
        required: ["id", "userId", "testId", "score", "completedAt"]
      }
    },
    firestore: {
      "/users/{userId}": {
        schema: { "$ref": "#/entities/User" },
        description: "User profile records and authorization state"
      },
      "/mockTests/{testId}": {
        schema: { "$ref": "#/entities/MockTest" },
        description: "Live mock test catalog items"
      },
      "/questions/{questionId}": {
        schema: { "$ref": "#/entities/Question" },
        description: "Global question bank repository items"
      },
      "/bundles/{bundleId}": {
        schema: { "$ref": "#/entities/TestSeriesBundle" },
        description: "Test series exam bundles and packages"
      },
      "/attempts/{attemptId}": {
        schema: { "$ref": "#/entities/TestAttempt" },
        description: "Student test attempts and leaderboard scores"
      }
    }
  }, null, 2);

  const SCHEMA_COLLECTIONS = [
    {
      id: 'questions',
      name: 'questions',
      badge: 'Cloud Firestore Collection',
      color: 'indigo',
      documentCount: questions.length,
      description: 'Master canonical question bank storing bilingual stems, structured options, multi-statement logic, scoring keys, and PYQ linkages.',
      primaryKey: 'id (Doc ID / UUID)',
      indexes: ['category ASC', 'subject ASC', 'topic ASC', 'difficulty ASC'],
      fields: [
        { name: 'id', type: 'string', key: 'DOC_ID', required: true, defaultVal: 'UUID / auto-id', desc: 'Firestore Document ID identifying unique question item.' },
        { name: 'uniqueQuestionId', type: 'string', key: 'INDEX', required: false, defaultVal: 'null', desc: 'Unique question code (e.g. CGSSB-2024-HOS-001) preventing duplicate imports.' },
        { name: 'authority', type: 'string', key: '', required: false, defaultVal: '"CGSSB"', desc: 'Conducting examination board (CGSSB or CGPSC).' },
        { name: 'category', type: 'string', key: 'INDEX', required: true, defaultVal: '"CGSSB"', desc: 'Top-level examination category (CGSSB, CGPSC, TEACHER, POLICE).' },
        { name: 'subject', type: 'string', key: 'INDEX', required: true, defaultVal: '""', desc: 'Canonical academic subject (e.g. CG GS, Computer, Reasoning).' },
        { name: 'topic', type: 'string', key: 'INDEX', required: true, defaultVal: '""', desc: 'Topic classification within subject hierarchy.' },
        { name: 'subtopic', type: 'string', key: '', required: false, defaultVal: 'null', desc: 'Specific granular subtopic.' },
        { name: 'difficulty', type: 'string (enum)', key: 'INDEX', required: true, defaultVal: '"Medium"', desc: 'Calibrated difficulty level: "Easy" | "Medium" | "Hard".' },
        { name: 'questionText', type: 'string', key: '', required: true, defaultVal: '""', desc: 'Standard English question stem (supports HTML/LaTeX).' },
        { name: 'questionHindi', type: 'string', key: '', required: false, defaultVal: 'null', desc: 'Devnagari Hindi translated question stem.' },
        { name: 'options', type: 'array<string>', key: '', required: true, defaultVal: '[]', desc: 'Array containing options A, B, C, D with labels & text.' },
        { name: 'correctOption', type: 'string', key: '', required: true, defaultVal: '"A"', desc: 'Official correct option key ("A" | "B" | "C" | "D").' },
        { name: 'marks', type: 'number', key: '', required: true, defaultVal: '1.00', desc: 'Positive marks awarded for correct answer.' },
        { name: 'negativeMarks', type: 'number', key: '', required: true, defaultVal: '0.333', desc: 'Penalty marks deducted for wrong response.' },
        { name: 'explanation', type: 'string', key: '', required: false, defaultVal: 'null', desc: 'Pedagogical solution explanation (English).' },
        { name: 'explanationHindi', type: 'string', key: '', required: false, defaultVal: 'null', desc: 'Pedagogical solution explanation (Hindi).' },
        { name: 'pypAppearances', type: 'array<map>', key: '', required: false, defaultVal: '[]', desc: 'Array of historical papers where this question appeared.' },
        { name: 'createdAt', type: 'timestamp', key: '', required: true, defaultVal: 'serverTimestamp()', desc: 'Firestore record creation timestamp.' },
      ]
    },
    {
      id: 'mockTests',
      name: 'mockTests',
      badge: 'Cloud Firestore Collection',
      color: 'blue',
      documentCount: tests.length,
      description: 'Test catalog configuring exam duration, section partitioning, marking scheme (+1/-0.33, +2/-0.66), and test question mappings.',
      primaryKey: 'id (Doc ID / Slug)',
      indexes: ['category ASC', 'isPublished ASC', 'createdAt DESC'],
      fields: [
        { name: 'id', type: 'string', key: 'DOC_ID', required: true, defaultVal: 'test-id', desc: 'Firestore Document ID identifying unique mock test series.' },
        { name: 'title', type: 'string', key: '', required: true, defaultVal: '""', desc: 'Full bilingual exam title.' },
        { name: 'category', type: 'string', key: 'INDEX', required: true, defaultVal: '"CGSSB"', desc: 'Category grouping (CGSSB, CGPSC, TEACHER, POLICE).' },
        { name: 'durationMinutes', type: 'number', key: '', required: true, defaultVal: '120', desc: 'Total allocated test time limit in minutes.' },
        { name: 'totalMarks', type: 'number', key: '', required: false, defaultVal: '100.00', desc: 'Total maximum marks for the paper.' },
        { name: 'marksPerQuestion', type: 'number', key: '', required: true, defaultVal: '1.00', desc: 'Default positive marking weightage.' },
        { name: 'negativeMarksPerQuestion', type: 'number', key: '', required: true, defaultVal: '0.333', desc: 'Default negative deduction penalty.' },
        { name: 'isPublished', type: 'boolean', key: 'INDEX', required: true, defaultVal: 'true', desc: 'Publication status: student-visible or draft.' },
        { name: 'isPro', type: 'boolean', key: '', required: false, defaultVal: 'false', desc: 'Monetization flag: requires Pass Pro subscription.' },
        { name: 'sections', type: 'array<map>', key: 'RELATION', required: true, defaultVal: '[]', desc: 'Sections array containing section names and questionIds referencing questions/{id}.' },
        { name: 'createdAt', type: 'timestamp', key: '', required: true, defaultVal: 'serverTimestamp()', desc: 'Firestore timestamp of test creation.' },
      ]
    },
    {
      id: 'bundles',
      name: 'bundles',
      badge: 'Cloud Firestore Collection',
      color: 'amber',
      documentCount: storedBundles.length,
      description: 'Curated test series bundles and specialized crash course packs with pricing, validity tenures, and linked mock test IDs.',
      primaryKey: 'id (Doc ID / Slug)',
      indexes: ['category ASC', 'isFeatured DESC'],
      fields: [
        { name: 'id', type: 'string', key: 'DOC_ID', required: true, defaultVal: 'bundle-id', desc: 'Unique bundle identifier slug.' },
        { name: 'title', type: 'string', key: '', required: true, defaultVal: '""', desc: 'Commercial display title of the test bundle.' },
        { name: 'slug', type: 'string', key: 'INDEX', required: true, defaultVal: '""', desc: 'URL routing slug for deep linking.' },
        { name: 'price', type: 'number', key: '', required: true, defaultVal: '199', desc: 'Selling price in INR.' },
        { name: 'originalPrice', type: 'number', key: '', required: false, defaultVal: '499', desc: 'Original MRP value before discount.' },
        { name: 'validityDays', type: 'number', key: '', required: true, defaultVal: '365', desc: 'Subscription validity in days.' },
        { name: 'testIds', type: 'array<string>', key: 'RELATION', required: true, defaultVal: '[]', desc: 'List of mock test IDs included in this bundle.' },
      ]
    },
    {
      id: 'attempts',
      name: 'attempts',
      badge: 'Cloud Firestore Collection',
      color: 'emerald',
      documentCount: attempts.length,
      description: 'Candidate test submission logs recording chosen responses, accuracy, score, percentile ranking, and granular performance analysis.',
      primaryKey: 'id (Attempt UUID)',
      indexes: ['testId ASC', 'score DESC', 'submittedAt DESC'],
      fields: [
        { name: 'id', type: 'string', key: 'DOC_ID', required: true, defaultVal: 'att-id', desc: 'Firestore Document ID identifying unique submission attempt.' },
        { name: 'testId', type: 'string', key: 'INDEX', required: true, defaultVal: '""', desc: 'Reference to parent mockTests/{id}.' },
        { name: 'userId', type: 'string', key: 'INDEX', required: true, defaultVal: '""', desc: 'Identifier of candidate student submitting attempt (Firebase Auth UID).' },
        { name: 'userName', type: 'string', key: '', required: true, defaultVal: '""', desc: 'Full name of candidate at time of submission.' },
        { name: 'score', type: 'number', key: 'INDEX', required: true, defaultVal: '0.00', desc: 'Net score achieved after negative deduction.' },
        { name: 'accuracy', type: 'number', key: '', required: true, defaultVal: '0.00', desc: 'Accuracy percentage.' },
        { name: 'responses', type: 'map', key: '', required: true, defaultVal: '{}', desc: 'Key-value map of questionId -> chosenOption (A, B, C, D).' },
        { name: 'submittedAt', type: 'timestamp', key: '', required: true, defaultVal: 'serverTimestamp()', desc: 'Server submission timestamp.' },
      ]
    },
    {
      id: 'users',
      name: 'users',
      badge: 'Cloud Firestore Collection',
      color: 'teal',
      documentCount: 1,
      description: 'Candidate authentication records, Pro Pass tenure, district preferences, wallet credits, and administrator access roles.',
      primaryKey: 'id (Firebase Auth UID)',
      indexes: ['role ASC', 'email ASC'],
      fields: [
        { name: 'id', type: 'string', key: 'DOC_ID', required: true, defaultVal: 'uid', desc: 'Firebase Authentication UID.' },
        { name: 'email', type: 'string', key: 'INDEX', required: true, defaultVal: '""', desc: 'Candidate login email address.' },
        { name: 'name', type: 'string', key: '', required: true, defaultVal: '""', desc: 'Full candidate name.' },
        { name: 'role', type: 'string', key: 'INDEX', required: true, defaultVal: '"student"', desc: 'Access role: "student" | "admin".' },
        { name: 'hasProPass', type: 'boolean', key: '', required: true, defaultVal: 'false', desc: 'Pass subscription active state.' },
        { name: 'registeredAt', type: 'timestamp', key: '', required: true, defaultVal: 'serverTimestamp()', desc: 'Registration timestamp.' },
      ]
    }
  ];

  const handleCopyBlueprint = () => {
    navigator.clipboard.writeText(FIRESTORE_BLUEPRINT_JSON);
    setCopiedBlueprint(true);
    setTimeout(() => setCopiedBlueprint(false), 2500);
  };

  const filteredCollections = useMemo(() => {
    const query = schemaSearchQuery.trim().toLowerCase();
    const activeCollections = selectedSchemaCollection === 'all' 
      ? SCHEMA_COLLECTIONS 
      : SCHEMA_COLLECTIONS.filter(t => t.id === selectedSchemaCollection);

    if (!query) return activeCollections;

    return activeCollections.map(t => ({
      ...t,
      fields: t.fields.filter(c => 
        c.name.toLowerCase().includes(query) ||
        c.type.toLowerCase().includes(query) ||
        c.desc.toLowerCase().includes(query) ||
        c.key.toLowerCase().includes(query)
      )
    })).filter(t => t.fields.length > 0);
  }, [selectedSchemaCollection, schemaSearchQuery]);

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
            <FolderTree className="w-3.5 h-3.5" />
            <span>Firestore Schema & Architecture</span>
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
                    <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[11px] font-mono font-bold mb-1 border border-amber-500/30">
                      <Server className="w-3 h-3 text-amber-400" />
                      <span>Google Cloud Firestore Enterprise Database</span>
                    </div>
                    <h3 className="text-base font-black text-white">Firestore Document Architecture & Collections</h3>
                    <p className="text-xs text-slate-300">
                      High-availability NoSQL document architecture on <code className="text-amber-300 font-mono">ai-studio-cgssbtest-ed944dbb-7a88-46c1-8fe0-4ad38fcd1089</code> (Mumbai asia-south1). Sub-millisecond queries with native Devnagari Hindi and LaTeX formula storage.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={handleCopyBlueprint}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-lg shadow-indigo-600/20 cursor-pointer active:scale-95"
                    >
                      {copiedBlueprint ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedBlueprint ? 'Blueprint Copied!' : 'Copy Blueprint JSON'}</span>
                    </button>
                  </div>
                </div>

                {/* Storage Engine Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-800 text-xs">
                  <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-mono">Database Engine</span>
                    <strong className="text-amber-300 text-xs">Cloud Firestore (Enterprise)</strong>
                  </div>
                  <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-mono">Region</span>
                    <strong className="text-emerald-300 text-xs">asia-south1 (Mumbai)</strong>
                  </div>
                  <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-mono">Security Model</span>
                    <strong className="text-indigo-300 text-xs">ABAC Rules (rules_v2)</strong>
                  </div>
                  <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-mono">Active Collections</span>
                    <strong className="text-teal-300 text-xs">5 Core Cloud Collections</strong>
                  </div>
                </div>
              </div>

              {/* Visual Entity-Relationship Cards */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                    <Network className="w-4 h-4 text-indigo-400" />
                    <span>Cloud Firestore Collections (Click collection to inspect)</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">Live Memory Sync Active</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {SCHEMA_COLLECTIONS.map(col => {
                    const isSelected = selectedSchemaCollection === col.id;
                    const borderClass = isSelected
                      ? 'border-indigo-500 bg-indigo-950/20 shadow-indigo-500/10'
                      : 'border-slate-800 hover:border-slate-700 bg-slate-950/60';

                    return (
                      <div
                        key={col.id}
                        onClick={() => setSelectedSchemaCollection(isSelected ? 'all' : col.id)}
                        className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer relative shadow-lg ${borderClass}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                              <FolderTree className="w-4 h-4" />
                            </div>
                            <span className="font-mono font-bold text-sm text-white">/{col.name}</span>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-mono text-indigo-300 border border-slate-700">
                              {col.fields.length} Fields
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-[10px] font-mono text-emerald-300 border border-emerald-500/30">
                              {col.documentCount} Docs
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-400 leading-relaxed mb-3">
                          {col.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-slate-400">
                          <span className="text-amber-400 font-semibold">ID: {col.primaryKey}</span>
                          <span>•</span>
                          <span className="text-slate-500 truncate max-w-[240px]">
                            Indexes: {col.indexes.join(', ')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Relational Document References Flow */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Firestore Document References & Relational Mappings</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-indigo-400 font-bold">mockTests/{"{testId}"}.sections[].questionIds</span>
                      <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[9px] font-mono">1 : N (Embedded Array)</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Sections JSON array embeds question IDs referencing <code className="text-white font-mono">questions/{"{questionId}"}</code> documents to assemble exam papers.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-emerald-400 font-bold">bundles/{"{bundleId}"}.testIds</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-mono">1 : N (Package Links)</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Curated test series package embeds array of test IDs linking to <code className="text-white font-mono">mockTests/{"{testId}"}</code>.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-amber-400 font-bold">attempts/{"{attemptId}"}.testId</span>
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-mono">N : 1 (Attempt Log)</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Foreign reference connecting candidate submission logs to the parent <code className="text-white font-mono">mockTests/{"{testId}"}</code>.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-teal-400 font-bold">attempts/{"{attemptId}"}.userId</span>
                      <span className="px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 text-[9px] font-mono">N : 1 (Candidate UID)</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Associates live attempt results, diagnostic sector scores, and ranks with the authenticated student in <code className="text-white font-mono">users/{"{userId}"}</code>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Data Dictionary & Field Inspector */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                      <HardDrive className="w-4 h-4 text-indigo-400" />
                      <span>Firestore Collection Schemas & Field Dictionary</span>
                    </h4>
                    <p className="text-xs text-slate-400">Examine collection document fields, NoSQL data types, indexing, and rule constraints.</p>
                  </div>

                  {/* Filter & Search */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search field or type..."
                        value={schemaSearchQuery}
                        onChange={e => setSchemaSearchQuery(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-44"
                      />
                    </div>
                  </div>
                </div>

                {/* Collection Filter Pills */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSelectedSchemaCollection('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      selectedSchemaCollection === 'all'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    All Collections ({SCHEMA_COLLECTIONS.length})
                  </button>
                  {SCHEMA_COLLECTIONS.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedSchemaCollection(t.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono transition cursor-pointer flex items-center space-x-1.5 ${
                        selectedSchemaCollection === t.id
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      <span>/{t.name}</span>
                      <span className="text-[10px] opacity-70">({t.fields.length})</span>
                    </button>
                  ))}
                </div>

                {/* Field Listing */}
                <div className="space-y-6">
                  {filteredCollections.map(col => (
                    <div key={col.id} className="border border-slate-800/80 rounded-2xl overflow-hidden bg-slate-900/70 shadow-md">
                      <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <FolderTree className="w-4 h-4 text-indigo-400" />
                          <span className="font-mono font-bold text-sm text-white">/{col.name}</span>
                          <span className="text-xs text-slate-400">({col.badge})</span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">{col.fields.length} document fields defined</span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-950/80 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
                            <tr>
                              <th className="px-4 py-2.5">Field Name</th>
                              <th className="px-4 py-2.5">Firestore Type</th>
                              <th className="px-4 py-2.5">Key / Index</th>
                              <th className="px-4 py-2.5">Required</th>
                              <th className="px-4 py-2.5">Default / Value</th>
                              <th className="px-4 py-2.5">Purpose & Description</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/50">
                            {col.fields.map((f, idx) => (
                              <tr key={idx} className="hover:bg-slate-800/30 transition">
                                <td className="px-4 py-2.5 font-mono font-bold text-white whitespace-nowrap">
                                  {f.name}
                                </td>
                                <td className="px-4 py-2.5 font-mono text-[11px] whitespace-nowrap">
                                  <span className={`px-2 py-0.5 rounded-md font-semibold ${
                                    f.type.includes('map')
                                      ? 'bg-purple-500/10 text-purple-300 border border-purple-500/30'
                                      : f.type.includes('string')
                                      ? 'bg-blue-500/10 text-blue-300 border border-blue-500/30'
                                      : f.type.includes('boolean')
                                      ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                                      : f.type.includes('number')
                                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                                      : f.type.includes('timestamp')
                                      ? 'bg-teal-500/10 text-teal-300 border border-teal-500/30'
                                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                                  }`}>
                                    {f.type}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 font-mono text-[11px] whitespace-nowrap">
                                  {f.key === 'DOC_ID' && (
                                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 inline-flex items-center space-x-1">
                                      <Key className="w-2.5 h-2.5" />
                                      <span>DOC_ID</span>
                                    </span>
                                  )}
                                  {f.key === 'RELATION' && (
                                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40">
                                      REL_REF
                                    </span>
                                  )}
                                  {f.key === 'INDEX' && (
                                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/30">
                                      INDEXED
                                    </span>
                                  )}
                                  {!f.key && <span className="text-slate-600">—</span>}
                                </td>
                                <td className="px-4 py-2.5 font-mono text-[11px] text-slate-400">
                                  {f.required ? <span className="text-emerald-400 font-bold">YES</span> : 'OPTIONAL'}
                                </td>
                                <td className="px-4 py-2.5 font-mono text-[11px] text-slate-300">
                                  {f.defaultVal}
                                </td>
                                <td className="px-4 py-2.5 text-slate-300 leading-relaxed min-w-[220px]">
                                  {f.desc}
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

              {/* Raw Schema Preview Block */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                    <Code2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Cloud Firestore Collection Schema (firebase-blueprint.json)</span>
                  </h4>
                  <button
                    onClick={handleCopyBlueprint}
                    className="text-[11px] font-mono text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedBlueprint ? 'Copied' : 'Copy Blueprint'}</span>
                  </button>
                </div>
                <pre className="p-3 rounded-xl bg-slate-900 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48 border border-slate-800">
                  {FIRESTORE_BLUEPRINT_JSON}
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
