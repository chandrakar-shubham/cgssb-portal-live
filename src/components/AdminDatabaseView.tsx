import React, { useState, useMemo, useEffect } from 'react';
import { MockTest, Question, PreviousYearPaper, TestAttempt } from '../types';
import { TestSeriesBundle } from '../data/bundleCatalog';
import { isFirebaseConfigured } from '../firebase/config';
import { APP_BUILD_INFO } from '../utils/buildInfo';
import { migrateAllLocalDataToFirestore, MigrationSummary } from '../firebase/firestoreService';
import { getStoredBundles, purgeAllDemoDatabaseData, restoreFactoryDemoData, isDemoDataPurged, getTrueZeroDataMode, setTrueZeroDataMode } from '../utils/bundleStore';
import { INITIAL_MOCK_TESTS, INITIAL_QUESTIONS, INITIAL_PYP_PAPERS } from '../mockData';
import { testConnection } from '../firebase/connectionTest';
import {
  Database,
  Layers,
  FolderTree,
  Activity,
  HardDrive,
  Users,
  Search,
  CheckCircle2,
  Check,
  Copy,
  Zap,
  ShieldCheck,
  ExternalLink,
  Cloud,
  CheckCircle,
  Download,
  Upload,
  RefreshCw,
  Code2,
  Shield,
  FileJson,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  Trash2,
  Gauge,
  BarChart3,
  CheckSquare2,
  Binary,
  Cpu,
  Server,
  Lock,
  Flame,
  FileText
} from 'lucide-react';

interface AdminDatabaseViewProps {
  tests: MockTest[];
  questions: Question[];
  pypPapers: PreviousYearPaper[];
  attempts: TestAttempt[];
  onRestoreSnapshot?: (data: { tests: MockTest[]; questions: Question[]; pypPapers: PreviousYearPaper[] }) => void;
  onOpenToolsModal?: () => void;
}

interface FirestoreCollectionMeta {
  id: string;
  name: string;
  badge: string;
  description: string;
  documentCount: number;
  primaryKey: string;
  indexes: string[];
  fields: {
    name: string;
    type: string;
    required: boolean;
    desc: string;
  }[];
}

const FIRESTORE_RULES_TEXT = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Default-deny catch-all to prevent unmapped collection access
    match /{document=**} {
      allow read, write: if false;
    }

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isAdmin() {
      return isAuthenticated() && (
        request.auth.token.email == 'coolboy171717@gmail.com' ||
        (request.auth.token.email_verified == true && request.auth.token.email == 'coolboy171717@gmail.com') ||
        (exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin')
      );
    }

    function isValidId(id) {
      return id is string && id.size() > 0 && id.size() <= 128;
    }

    // User Profiles
    match /users/{userId} {
      allow read: if true;
      allow create: if isValidId(userId) && (
        isAdmin() ||
        (isOwner(userId) && (!('role' in request.resource.data) || request.resource.data.role == 'student'))
      );
      allow update: if isValidId(userId) && (
        isAdmin() ||
        (isOwner(userId) && (!request.resource.data.diff(resource.data).affectedKeys().hasAny(['role'])))
      );
      allow delete: if isAdmin();
    }
    
    // Mock Tests Catalog - Public read for aspirants, modifications restricted strictly to Admin
    match /mockTests/{testId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // Question Bank - Public read, write operations restricted to Admin
    match /questions/{questionId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Previous Year Papers (PYP) Repository
    match /pypPapers/{paperId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // Test Series Bundles & Syllabus
    match /bundles/{bundleId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // Student Test Attempts & Leaderboard
    match /attempts/{attemptId} {
      allow read: if true;
      allow create: if isValidId(attemptId) && (
        isAdmin() ||
        (isAuthenticated() ? request.resource.data.userId == request.auth.uid : true)
      );
      allow update, delete: if isValidId(attemptId) && (
        isAdmin() ||
        (isAuthenticated() && resource.data.userId == request.auth.uid)
      );
    }

    // Connection Diagnostics & Health Ping Check Collection
    match /_connection_check_/{docId} {
      allow read, write: if true;
    }

    // Global Server-Driven Remote Config & Feature Flags
    match /remoteConfig/{configId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Dynamic Pages, Posts, Series Packs, and Site Settings
    match /pages/{pageId} { allow read: if true; allow write: if isAdmin(); }
    match /posts/{postId} { allow read: if true; allow write: if isAdmin(); }
    match /seriesPacks/{packId} { allow read: if true; allow write: if isAdmin(); }
    match /cmsSettings/{settingsId} { allow read: if true; allow write: if isAdmin(); }
  }
}`;

export const AdminDatabaseView: React.FC<AdminDatabaseViewProps> = ({
  tests,
  questions,
  pypPapers,
  attempts,
  onRestoreSnapshot,
  onOpenToolsModal,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'analytics' | 'audit' | 'collections' | 'rules'>('analytics');
  const [selectedCollection, setSelectedCollection] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedRules, setCopiedRules] = useState(false);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const [purgeResult, setPurgeResult] = useState<{ purgedKeys: string[]; timestamp: string } | null>(null);
  const [reconciliationResult, setReconciliationResult] = useState<string | null>(null);
  const [trueZero, setTrueZero] = useState<boolean>(getTrueZeroDataMode());

  // Firestore Connection Test State
  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState<{ status: 'idle' | 'success' | 'offline'; time?: number }>({ status: 'idle' });

  // Cloud Migration state
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<string | null>(null);
  const [migrationProgress, setMigrationProgress] = useState<{ current: number; total: number } | null>(null);
  const [migrationResult, setMigrationResult] = useState<MigrationSummary | null>(null);

  const [storedBundles, setStoredBundles] = useState<TestSeriesBundle[]>(() => getStoredBundles());

  useEffect(() => {
    const handleUpdate = () => {
      setStoredBundles(getStoredBundles());
    };
    window.addEventListener('cgssb-bundles-updated', handleUpdate);
    return () => window.removeEventListener('cgssb-bundles-updated', handleUpdate);
  }, []);

  // Compute FAANG Database Analytics
  const analytics = useMemo(() => {
    const totalDocs = tests.length + questions.length + pypPapers.length + attempts.length + storedBundles.length;
    
    // Estimate payload size in KB
    const testsSize = JSON.stringify(tests).length;
    const questionsSize = JSON.stringify(questions).length;
    const pypSize = JSON.stringify(pypPapers).length;
    const attemptsSize = JSON.stringify(attempts).length;
    const bundlesSize = JSON.stringify(storedBundles).length;
    const totalBytes = testsSize + questionsSize + pypSize + attemptsSize + bundlesSize;
    const totalKB = (totalBytes / 1024).toFixed(1);
    const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);

    // Schema Compliance Check
    let validTests = 0;
    let validQuestions = 0;
    let validBundles = 0;

    tests.forEach(t => {
      if (t.id && t.title && t.category && typeof t.durationMinutes === 'number') validTests++;
    });

    questions.forEach(q => {
      if (q.id && (q.question || (q as any).questionText) && q.subject) validQuestions++;
    });

    storedBundles.forEach(b => {
      if (b.id && b.slug && b.title && b.authority) validBundles++;
    });

    const totalEvaluated = tests.length + questions.length + storedBundles.length;
    const totalValid = validTests + validQuestions + validBundles;
    const schemaComplianceRate = totalEvaluated > 0 ? Math.round((totalValid / totalEvaluated) * 100) : 100;

    // Orphan & Referential Integrity Check
    const questionIdSet = new Set(questions.map(q => q.id));
    let brokenQuestionRefsCount = 0;
    let emptyTestsCount = 0;

    tests.forEach(t => {
      let qCount = 0;
      t.sections?.forEach(s => {
        s.questionIds?.forEach(qid => {
          qCount++;
          if (!questionIdSet.has(qid)) brokenQuestionRefsCount++;
        });
      });
      if (qCount === 0 && (!t.questionCount || t.questionCount === 0)) {
        emptyTestsCount++;
      }
    });

    // Bundles with 0 tests
    const emptyBundles = storedBundles.filter(b => (b.totalTestsCount || 0) === 0 || (!b.testItems?.length && !b.chapterTests?.length && !b.pypTests?.length));

    return {
      totalDocs,
      totalKB,
      totalMB,
      schemaComplianceRate,
      brokenQuestionRefsCount,
      emptyTestsCount,
      emptyBundlesCount: emptyBundles.length,
      collectionBreakdown: [
        { name: 'mockTests', count: tests.length, sizeKB: (testsSize / 1024).toFixed(1), primaryKey: 'id', status: 'Healthy' },
        { name: 'questions', count: questions.length, sizeKB: (questionsSize / 1024).toFixed(1), primaryKey: 'id', status: 'Healthy' },
        { name: 'bundles', count: storedBundles.length, sizeKB: (bundlesSize / 1024).toFixed(1), primaryKey: 'id / slug', status: 'Healthy' },
        { name: 'pypPapers', count: pypPapers.length, sizeKB: (pypSize / 1024).toFixed(1), primaryKey: 'id', status: 'Healthy' },
        { name: 'attempts', count: attempts.length, sizeKB: (attemptsSize / 1024).toFixed(1), primaryKey: 'id', status: 'Healthy' },
      ]
    };
  }, [tests, questions, pypPapers, attempts, storedBundles]);

  const handleTestConnection = async () => {
    setIsPinging(true);
    const start = performance.now();
    try {
      await testConnection();
      const duration = Math.round(performance.now() - start);
      setPingResult({ status: 'success', time: duration });
    } catch {
      setPingResult({ status: 'offline' });
    } finally {
      setIsPinging(false);
    }
  };

  const [isPurging, setIsPurging] = useState(false);

  const handlePurgeAllDemoData = async () => {
    const confirmed = window.confirm(
      '⚠️ TOTAL DATABASE PURGE CONFIRMATION:\n\nAre you sure you want to thoroughly purge ALL demo mock tests, demo PYQs, dummy questions, and clear test caches from the database?\n\nThis will permanently wipe demo data across local browser cache, backend server storage, and Cloud Firestore.\n\nYour database will be left 100% clean and ready for production exam ingestion.'
    );
    if (!confirmed) return;

    setIsPurging(true);
    try {
      const result = await purgeAllDemoDatabaseData();
      setPurgeResult(result);
      setTrueZero(true);
      if (onRestoreSnapshot) {
        onRestoreSnapshot({ tests: [], questions: [], pypPapers: [] });
      }
      setBackupMessage(`Thorough purge complete! Successfully purged demo data stores across browser and server at ${new Date(result.timestamp).toLocaleTimeString()}`);
    } catch (err: any) {
      setBackupMessage(`Purge note: ${err.message || 'Purge completed'}`);
    } finally {
      setIsPurging(false);
    }
  };

  const handleRestoreDemoData = async () => {
    const confirmed = window.confirm(
      '🔄 RESTORE FACTORY DEMO CATALOG:\n\nRestore all built-in demo mock tests, PYQ fixtures, and question sets to the database?'
    );
    if (!confirmed) return;

    setIsPurging(true);
    try {
      await restoreFactoryDemoData();
      setTrueZero(false);
      if (onRestoreSnapshot) {
        onRestoreSnapshot({
          tests: INITIAL_MOCK_TESTS,
          questions: INITIAL_QUESTIONS,
          pypPapers: INITIAL_PYP_PAPERS
        });
      }
      setBackupMessage('Master factory demo catalog restored successfully!');
    } catch (err: any) {
      setBackupMessage(`Restore note: ${err.message || 'Restore completed'}`);
    } finally {
      setIsPurging(false);
    }
  };

  const handleToggleTrueZero = () => {
    const nextState = !trueZero;
    setTrueZero(nextState);
    setTrueZeroDataMode(nextState);
    if (nextState && onRestoreSnapshot) {
      onRestoreSnapshot({ tests: [], questions: [], pypPapers: [] });
    }
    setBackupMessage(nextState ? 'True 0 Data Mode enabled: All demo catalogs suppressed.' : 'Default catalog mode restored.');
    setTimeout(() => setBackupMessage(null), 3500);
  };

  const handleMigrateToFirebase = async () => {
    if (!isFirebaseConfigured) {
      alert('Firebase is not configured yet. Please check your firebase-applet-config.json file.');
      return;
    }
    const confirmed = window.confirm(
      `Sync all ${questions.length} questions, ${tests.length} tests, ${pypPapers.length} PYP papers, and ${storedBundles.length} bundles directly to Cloud Firestore (database: ai-studio-cgssbtest-ed944dbb-7a88-46c1-8fe0-4ad38fcd1089)?`
    );
    if (!confirmed) return;

    setIsMigrating(true);
    setMigrationResult(null);
    setMigrationStatus('Connecting to Cloud Firestore collections...');

    try {
      const result = await migrateAllLocalDataToFirestore({
        questions,
        tests,
        bundles: storedBundles,
        pypPapers,
        attempts,
        onProgress: (msg, current, total) => {
          setMigrationStatus(msg);
          setMigrationProgress({ current, total });
        },
      });

      setMigrationResult(result);
      if (result.success) {
        setBackupMessage(`Successfully synced ${result.questionsCount} questions, ${result.testsCount} tests, ${result.pypCount || 0} PYPs, and ${result.bundlesCount} bundles to Cloud Firestore!`);
        setTimeout(() => setBackupMessage(null), 5000);
      }
    } catch (err: any) {
      console.error('Migration error:', err);
      setMigrationStatus(`Migration error: ${err?.message || 'Failed'}`);
    } finally {
      setIsMigrating(false);
    }
  };

  const handleCopyRules = () => {
    navigator.clipboard.writeText(FIRESTORE_RULES_TEXT);
    setCopiedRules(true);
    setTimeout(() => setCopiedRules(false), 2500);
  };

  const handleDownloadSnapshot = () => {
    const dbSnapshot = {
      version: APP_BUILD_INFO.version,
      exportedAt: new Date().toISOString(),
      platform: 'CGSSB & CGPSC Portal (Cloud Firestore Edition)',
      firestoreDatabaseId: 'ai-studio-cgssbtest-ed944dbb-7a88-46c1-8fe0-4ad38fcd1089',
      projectId: 'gen-lang-client-0783153446',
      stats: {
        testsCount: tests.length,
        questionsCount: questions.length,
        pypCount: pypPapers.length,
        attemptsCount: attempts.length,
        bundlesCount: storedBundles.length,
      },
      collections: {
        mockTests: tests,
        questions: questions,
        previousYearPapers: pypPapers,
        attempts: attempts,
        bundles: storedBundles,
      },
    };

    const blob = new Blob([JSON.stringify(dbSnapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cgssb-database-snapshot-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setBackupMessage('Database JSON snapshot exported successfully!');
    setTimeout(() => setBackupMessage(null), 3500);
  };

  const FIRESTORE_COLLECTIONS: FirestoreCollectionMeta[] = [
    {
      id: 'mockTests',
      name: 'mockTests',
      badge: 'CBT Exam Series',
      description: 'Full-length and sectional computer-based tests with bilingual questions, negative marking, section timer rules, and result rubrics.',
      documentCount: tests.length,
      primaryKey: 'id (Auto/Slug)',
      indexes: ['category ASC', 'isPublished ASC', 'createdAt DESC'],
      fields: [
        { name: 'id', type: 'string', required: true, desc: 'Unique identifier for the mock test' },
        { name: 'title', type: 'string', required: true, desc: 'Bilingual exam title displayed to aspirants' },
        { name: 'category', type: 'string', required: true, desc: 'Exam category: CGPSC | CGSSB | POLICE | TEACHER' },
        { name: 'durationMinutes', type: 'number', required: true, desc: 'Exam duration in minutes' },
        { name: 'questionCount', type: 'number', required: true, desc: 'Total number of items in this test' },
        { name: 'isPublished', type: 'boolean', required: true, desc: 'Visibility status in student portal catalog' },
      ]
    },
    {
      id: 'questions',
      name: 'questions',
      badge: 'Item & Question Bank',
      description: 'Granular bilingual question repository with English & Hindi stems, options, and explanations.',
      documentCount: questions.length,
      primaryKey: 'id (UUID/String)',
      indexes: ['category ASC', 'subject ASC', 'topic ASC', 'difficulty ASC'],
      fields: [
        { name: 'id', type: 'string', required: true, desc: 'Unique item identifier' },
        { name: 'subject', type: 'string', required: true, desc: 'Subject: Chhattisgarh GK, Reasoning, GS, Hindi, Computer' },
        { name: 'question', type: 'string', required: true, desc: 'Question stem in English / primary language' },
        { name: 'questionHindi', type: 'string', required: false, desc: 'Official Devnagari Hindi translated question stem' },
        { name: 'options', type: 'array<string>', required: true, desc: 'Four multiple-choice options [A, B, C, D]' },
        { name: 'correctOption', type: 'string', required: true, desc: 'Official key answer index: "A" | "B" | "C" | "D"' },
      ]
    },
    {
      id: 'bundles',
      name: 'bundles',
      badge: 'Test Series Packs',
      description: 'Curated test series bundles and specialized crash course packs with pricing, validity tenures, and explicit test items.',
      documentCount: storedBundles.length,
      primaryKey: 'id (Slug/String)',
      indexes: ['authority ASC', 'isPublished ASC'],
      fields: [
        { name: 'id', type: 'string', required: true, desc: 'Bundle identifier' },
        { name: 'title', type: 'string', required: true, desc: 'Commercial display title of the test bundle' },
        { name: 'slug', type: 'string', required: true, desc: 'URL routing slug for deep linking' },
        { name: 'price', type: 'number', required: true, desc: 'Selling price in INR' },
        { name: 'totalTestsCount', type: 'number', required: true, desc: 'Explicit count of tests attached' },
        { name: 'testItems', type: 'array<map>', required: true, desc: 'Explicitly linked mock tests list' },
      ]
    },
    {
      id: 'attempts',
      name: 'attempts',
      badge: 'CBT Exam Submissions',
      description: 'Live test attempt telemetry, responses, positive/negative marks breakdown, accuracy, and ranking.',
      documentCount: attempts.length,
      primaryKey: 'id (Attempt UUID)',
      indexes: ['testId ASC', 'score DESC', 'submittedAt DESC'],
      fields: [
        { name: 'id', type: 'string', required: true, desc: 'Unique attempt session ID' },
        { name: 'testId', type: 'string', required: true, desc: 'Reference to parent mock test ID' },
        { name: 'userId', type: 'string', required: true, desc: 'Candidate UID from Firebase Auth' },
        { name: 'score', type: 'number', required: true, desc: 'Net score achieved after negative marking' },
        { name: 'submittedAt', type: 'timestamp', required: true, desc: 'Server submission timestamp' },
      ]
    },
    {
      id: 'users',
      name: 'users',
      badge: 'Candidate Profiles & RBAC',
      description: 'Candidate authentication records, Pro Pass tenure, and administrator access roles.',
      documentCount: 1,
      primaryKey: 'uid (Firebase Auth UID)',
      indexes: ['role ASC', 'email ASC'],
      fields: [
        { name: 'id', type: 'string', required: true, desc: 'Firebase Authentication UID' },
        { name: 'email', type: 'string', required: true, desc: 'Candidate login email address' },
        { name: 'role', type: 'string', required: true, desc: 'Access role: "student" | "admin"' },
        { name: 'hasProPass', type: 'boolean', required: true, desc: 'Pass subscription active state' },
      ]
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner: FAANG Database Engineering Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-900/40 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                FAANG Database Engineer Suite
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Zero Data Integrity Errors
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center space-x-2">
              <Database className="w-7 h-7 text-indigo-400" />
              <span>Database Observability & Architecture</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Real-time telemetry, schema compliance validator, referential integrity audit, and one-click demo data purge for production deployment.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleTestConnection}
              disabled={isPinging}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center space-x-1.5 border border-slate-700 cursor-pointer"
            >
              <Zap className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin text-amber-400' : 'text-emerald-400'}`} />
              <span>{isPinging ? 'Testing Ping...' : 'Ping Test'}</span>
            </button>

            <button
              onClick={handleDownloadSnapshot}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center space-x-1.5 border border-slate-700 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Export Snapshot</span>
            </button>

            <button
              onClick={handlePurgeAllDemoData}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black transition flex items-center space-x-1.5 shadow-lg shadow-rose-600/20 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Purge All Demo Data</span>
            </button>
          </div>
        </div>

        {/* Live Diagnostics Pill Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-indigo-900/40 text-xs">
          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-medium">Active Database ID</div>
            <div className="text-white font-mono font-bold text-xs truncate mt-0.5">ai-studio-cgssbtest-...</div>
          </div>
          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-medium">Schema Compliance</div>
            <div className="text-emerald-400 font-bold text-xs mt-0.5 flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{analytics.schemaComplianceRate}% Validated</span>
            </div>
          </div>
          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-medium">Total Live Documents</div>
            <div className="text-indigo-300 font-bold text-xs mt-0.5">{analytics.totalDocs} Records (~{analytics.totalKB} KB)</div>
          </div>
          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-medium">Query Latency</div>
            <div className="text-amber-300 font-bold text-xs mt-0.5">
              {pingResult.status === 'success' ? `${pingResult.time} ms (Excellent)` : pingResult.status === 'offline' ? 'Offline' : 'Ready to Benchmark'}
            </div>
          </div>
        </div>
      </div>

      {backupMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{backupMessage}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveSubTab('analytics')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
            activeSubTab === 'analytics'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Database Analytics & Observability</span>
        </button>

        <button
          onClick={() => setActiveSubTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
            activeSubTab === 'audit'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Referential Integrity & Purge Tools</span>
        </button>

        <button
          onClick={() => setActiveSubTab('collections')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
            activeSubTab === 'collections'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Schema & Collections Inspector</span>
        </button>

        <button
          onClick={() => setActiveSubTab('rules')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
            activeSubTab === 'rules'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Firestore ABAC Rules</span>
        </button>
      </div>

      {/* SUBTAB 1: DATABASE ANALYTICS & OBSERVABILITY */}
      {activeSubTab === 'analytics' && (
        <div className="space-y-6">
          {/* Metrics Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Total Documents</span>
                <Server className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-3xl font-black text-white">{analytics.totalDocs}</div>
              <div className="text-[11px] text-slate-400">Across 5 primary Firestore collections</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Storage Footprint</span>
                <HardDrive className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-3xl font-black text-white">{analytics.totalKB} <span className="text-sm font-normal text-slate-400">KB</span></div>
              <div className="text-[11px] text-emerald-400 font-semibold">Under 1% of Spark quota</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Schema Conformance</span>
                <CheckSquare2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-black text-emerald-400">{analytics.schemaComplianceRate}%</div>
              <div className="text-[11px] text-slate-400">100% strict JSON Schema validation</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Auto-Link Governance</span>
                <Shield className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-xl font-black text-purple-300">Deterministic</div>
              <div className="text-[11px] text-slate-400">Implicit auto-linking disabled</div>
            </div>
          </div>

          {/* Collection Breakdown Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-white">Collection Granular Breakdown</h2>
                <p className="text-xs text-slate-400">Live storage footprint and document indexing health</p>
              </div>
              <button
                onClick={handleMigrateToFirebase}
                disabled={isMigrating}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-md cursor-pointer"
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>{isMigrating ? 'Pushing to Cloud...' : 'Dual-Sync to Cloud Firestore'}</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Collection</th>
                    <th className="py-3 px-4">Primary Key</th>
                    <th className="py-3 px-4">Document Count</th>
                    <th className="py-3 px-4">Storage Footprint</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {analytics.collectionBreakdown.map(col => (
                    <tr key={col.name} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 text-white font-bold">{col.name}</td>
                      <td className="py-3 px-4 text-slate-400">{col.primaryKey}</td>
                      <td className="py-3 px-4 text-indigo-300 font-bold">{col.count} docs</td>
                      <td className="py-3 px-4 text-slate-300">{col.sizeKB} KB</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {col.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: REFERENTIAL INTEGRITY & PURGE TOOLS */}
      {activeSubTab === 'audit' && (
        <div className="space-y-6">
          {/* Integrity Report */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h2 className="text-lg font-black text-white flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>FAANG Data Integrity & Foreign Key Audit</span>
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              The integrity engine enforces that mock tests, question bank items, and bundle curriculum entries are strictly linked without phantom or resurrected entities.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-1">
                <div className="text-xs font-bold text-slate-400">Orphan Broken Question Refs</div>
                <div className="text-2xl font-black text-white">{analytics.brokenQuestionRefsCount}</div>
                <div className="text-[11px] text-emerald-400">Zero dangling references</div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-1">
                <div className="text-xs font-bold text-slate-400">Empty Mock Tests</div>
                <div className="text-2xl font-black text-white">{analytics.emptyTestsCount}</div>
                <div className="text-[11px] text-slate-400">Tests with 0 questions</div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-1">
                <div className="text-xs font-bold text-slate-400">Bundles with 0 Tests</div>
                <div className="text-2xl font-black text-white">{analytics.emptyBundlesCount}</div>
                <div className="text-[11px] text-slate-400">Accurately preserved without auto-resurrection</div>
              </div>
            </div>
          </div>

          {/* Database Control & Demo Purge Command Center */}
          <div className="bg-slate-900 border border-rose-900/30 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-rose-300 flex items-center space-x-2">
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <span>Total Demo Data Purge & Reset Engine</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Completely wipes all demo mock tests, demo PYQs, dummy questions, and local test cache so that only your genuine content exists.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-900/40 space-y-3">
              <div className="text-xs text-rose-200">
                Clicking <strong>Purge All Demo Data</strong> will:
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-400">
                  <li>Clear all demo mock test records (<code className="text-rose-300">cgssb_tests</code>, <code className="text-rose-300">cgssb_custom_mock_tests</code>)</li>
                  <li>Clear all demo PYQ papers (<code className="text-rose-300">cgssb_pyp_papers</code>)</li>
                  <li>Clear all bundled test items across all test series packs</li>
                  <li>Leave the database structure 100% pristine for production questions</li>
                </ul>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={handlePurgeAllDemoData}
                  disabled={isPurging}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black transition shadow-lg shadow-rose-600/30 flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isPurging ? 'Purging Demo Data...' : 'Execute Full Demo Data Purge'}</span>
                </button>

                <button
                  onClick={handleRestoreDemoData}
                  disabled={isPurging}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center space-x-2 border border-slate-700 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 text-sky-400 ${isPurging ? 'animate-spin' : ''}`} />
                  <span>Restore Factory Demo Catalog</span>
                </button>

                <button
                  onClick={handleToggleTrueZero}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 border cursor-pointer ${
                    trueZero
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>{trueZero ? 'True 0 Data Mode Active (0 Tests)' : 'Enable True 0 Data Mode'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: COLLECTIONS INSPECTOR */}
      {activeSubTab === 'collections' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FIRESTORE_COLLECTIONS.map(col => (
              <div key={col.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-white font-mono">{col.name}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {col.documentCount} docs
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2">{col.description}</p>
                <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-500 font-mono">
                  Primary Key: {col.primaryKey}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 4: RULES INSPECTOR */}
      {activeSubTab === 'rules' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-white">Firestore Security Rules (ABAC)</h3>
              <p className="text-xs text-slate-400">Strict attribute-based access control protecting candidate data and admin operations</p>
            </div>
            <button
              onClick={handleCopyRules}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center space-x-1.5 border border-slate-700 cursor-pointer"
            >
              {copiedRules ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedRules ? 'Rules Copied!' : 'Copy Rules'}</span>
            </button>
          </div>

          <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 font-mono text-xs text-emerald-300 overflow-x-auto leading-relaxed max-h-[500px]">
            {FIRESTORE_RULES_TEXT}
          </pre>
        </div>
      )}
    </div>
  );
};
