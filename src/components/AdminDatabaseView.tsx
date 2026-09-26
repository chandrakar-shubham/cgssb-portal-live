import React, { useState, useMemo } from 'react';
import { MockTest, Question, PreviousYearPaper, TestAttempt } from '../types';
import { isFirebaseConfigured } from '../firebase/config';
import { APP_BUILD_INFO } from '../utils/buildInfo';
import { migrateAllLocalDataToFirestore, MigrationSummary } from '../firebase/firestoreService';
import { getStoredBundles } from '../utils/bundleStore';
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
  ArrowRight
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
        (exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin')
      );
    }
    
    // User Profiles
    match /users/{userId} {
      allow read: if true;
      allow create, update: if true;
      allow delete: if isAdmin();
    }
    
    // Mock Tests Catalog
    match /mockTests/{testId} {
      allow read: if true;
      allow write: if true;
    }
    
    // Question Bank
    match /questions/{questionId} {
      allow read: if true;
      allow write: if true;
    }
    
    // Test Series Bundles
    match /bundles/{bundleId} {
      allow read: if true;
      allow write: if true;
    }
    
    // Student Test Attempts & Leaderboard
    match /attempts/{attemptId} {
      allow read: if true;
      allow create, update, delete: if true;
    }

    // Connection Ping Check Collection
    match /_connection_check_/{docId} {
      allow read, write: if true;
    }
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
  const [activeSubTab, setActiveSubTab] = useState<'collections' | 'rules' | 'sync'>('collections');
  const [selectedCollection, setSelectedCollection] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedRules, setCopiedRules] = useState(false);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);

  // Firestore Connection Test State
  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState<{ status: 'idle' | 'success' | 'offline'; time?: number }>({ status: 'idle' });

  // Cloud Migration state
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<string | null>(null);
  const [migrationProgress, setMigrationProgress] = useState<{ current: number; total: number } | null>(null);
  const [migrationResult, setMigrationResult] = useState<MigrationSummary | null>(null);

  const storedBundles = useMemo(() => getStoredBundles(), []);

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

  const handleMigrateToFirebase = async () => {
    if (!isFirebaseConfigured) {
      alert('Firebase is not configured yet. Please check your firebase-applet-config.json file.');
      return;
    }
    const confirmed = window.confirm(
      `Sync all ${questions.length} questions, ${tests.length} tests, and ${storedBundles.length} bundles directly to Cloud Firestore (database: ai-studio-cgssbtest-ed944dbb-7a88-46c1-8fe0-4ad38fcd1089)?`
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
        attempts,
        onProgress: (msg, current, total) => {
          setMigrationStatus(msg);
          setMigrationProgress({ current, total });
        },
      });

      setMigrationResult(result);
      if (result.success) {
        setBackupMessage(`Successfully synced ${result.questionsCount} questions, ${result.testsCount} tests, and ${result.bundlesCount} bundles to Cloud Firestore!`);
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
    a.download = `cgssb-firestore-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setBackupMessage('Firestore snapshot downloaded successfully!');
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
        { name: 'id', type: 'string', required: true, desc: 'Unique identifier for the mock test (e.g. "cgpsc-pre-2026-01")' },
        { name: 'title', type: 'string', required: true, desc: 'Bilingual exam title displayed to aspirants' },
        { name: 'category', type: 'string', required: true, desc: 'Exam category: CGPSC | CGSSB | POLICE | TEACHER' },
        { name: 'description', type: 'string', required: false, desc: 'Detailed syllabus coverage and test instructions' },
        { name: 'durationMinutes', type: 'number', required: true, desc: 'Exam duration in minutes (e.g. 120)' },
        { name: 'questionCount', type: 'number', required: true, desc: 'Total number of items in this test' },
        { name: 'marksPerQuestion', type: 'number', required: true, desc: 'Positive marks awarded per correct response (1.0 or 2.0)' },
        { name: 'negativeMarksPerQuestion', type: 'number', required: true, desc: 'Official negative marks deducted (-0.333 or -0.5)' },
        { name: 'sections', type: 'array<map>', required: true, desc: 'Sectional partitioning with question ID references' },
        { name: 'isPro', type: 'boolean', required: false, desc: 'True if test requires active CG Pass Pro membership' },
        { name: 'isPublished', type: 'boolean', required: true, desc: 'Visibility status in student portal catalog' },
        { name: 'createdAt', type: 'timestamp', required: true, desc: 'Document creation timestamp' },
      ]
    },
    {
      id: 'questions',
      name: 'questions',
      badge: 'Item & Question Bank',
      description: 'Granular bilingual question repository with English & Hindi stems, LaTeX math formulas, 4 options, explanations, and PYP exam citations.',
      documentCount: questions.length,
      primaryKey: 'id (UUID/String)',
      indexes: ['category ASC', 'subject ASC', 'topic ASC', 'difficulty ASC'],
      fields: [
        { name: 'id', type: 'string', required: true, desc: 'Unique item identifier' },
        { name: 'category', type: 'string', required: true, desc: 'Target exam category (CGPSC, CGSSB)' },
        { name: 'subject', type: 'string', required: true, desc: 'Subject: Chhattisgarh GK, Reasoning, GS, Hindi, Computer' },
        { name: 'topic', type: 'string', required: true, desc: 'Syllabus topic (e.g., Kalchuri Dynasty, Bastar Tribes)' },
        { name: 'question', type: 'string', required: true, desc: 'Question stem in English / primary language' },
        { name: 'questionHindi', type: 'string', required: false, desc: 'Official Devnagari Hindi translated question stem' },
        { name: 'options', type: 'array<string>', required: true, desc: 'Four multiple-choice options [A, B, C, D]' },
        { name: 'optionsHindi', type: 'array<string>', required: false, desc: 'Bilingual Hindi options [A, B, C, D]' },
        { name: 'correctOption', type: 'string', required: true, desc: 'Official key answer index: "A" | "B" | "C" | "D"' },
        { name: 'explanation', type: 'string', required: false, desc: 'Step-by-step analytical solution and reference notes' },
        { name: 'explanationHindi', type: 'string', required: false, desc: 'Hindi explanation with factual reference citations' },
        { name: 'difficulty', type: 'string', required: true, desc: '"Easy" | "Medium" | "Hard"' },
        { name: 'pypAppearances', type: 'array<map>', required: false, desc: 'Historical PYQ appearances across past exams' },
      ]
    },
    {
      id: 'bundles',
      name: 'bundles',
      badge: 'Test Series Packs',
      description: 'Curated test series bundles and specialized crash course packs with pricing, validity tenures, and linked mock test IDs.',
      documentCount: storedBundles.length,
      primaryKey: 'id (Slug/String)',
      indexes: ['category ASC', 'isFeatured DESC'],
      fields: [
        { name: 'id', type: 'string', required: true, desc: 'Bundle identifier (e.g. "cgpsc-pre-2026-master-pack")' },
        { name: 'title', type: 'string', required: true, desc: 'Commercial display title of the test bundle' },
        { name: 'slug', type: 'string', required: true, desc: 'URL routing slug for deep linking' },
        { name: 'price', type: 'number', required: true, desc: 'Selling price in INR (e.g. 199)' },
        { name: 'originalPrice', type: 'number', required: false, desc: 'Original MRP value before discount' },
        { name: 'validityDays', type: 'number', required: true, desc: 'Subscription validity in days (e.g. 365)' },
        { name: 'testIds', type: 'array<string>', required: true, desc: 'List of mock test IDs included in this bundle' },
      ]
    },
    {
      id: 'attempts',
      name: 'attempts',
      badge: 'CBT Exam Submissions',
      description: 'Live test attempt telemetry, responses, positive/negative marks breakdown, accuracy, and state-wide simulated ranking.',
      documentCount: attempts.length,
      primaryKey: 'id (Attempt UUID)',
      indexes: ['testId ASC', 'score DESC', 'submittedAt DESC'],
      fields: [
        { name: 'id', type: 'string', required: true, desc: 'Unique attempt session ID' },
        { name: 'testId', type: 'string', required: true, desc: 'Reference to parent mock test ID' },
        { name: 'userId', type: 'string', required: true, desc: 'Candidate UID from Firebase Auth' },
        { name: 'userName', type: 'string', required: true, desc: 'Student display name on live merit rank list' },
        { name: 'score', type: 'number', required: true, desc: 'Net score achieved after negative marking' },
        { name: 'maxMarks', type: 'number', required: true, desc: 'Total attainable marks' },
        { name: 'accuracy', type: 'number', required: true, desc: 'Accuracy percentage (correct / attempted * 100)' },
        { name: 'responses', type: 'map', required: true, desc: 'Key-value map of questionId -> chosenOption' },
        { name: 'submittedAt', type: 'timestamp', required: true, desc: 'Server submission timestamp' },
      ]
    },
    {
      id: 'users',
      name: 'users',
      badge: 'Candidate Profiles & RBAC',
      description: 'Candidate authentication records, Pro Pass tenure, district preferences, wallet credits, and administrator access roles.',
      documentCount: 1,
      primaryKey: 'uid (Firebase Auth UID)',
      indexes: ['role ASC', 'email ASC'],
      fields: [
        { name: 'id', type: 'string', required: true, desc: 'Firebase Authentication UID' },
        { name: 'email', type: 'string', required: true, desc: 'Candidate login email address' },
        { name: 'name', type: 'string', required: true, desc: 'Full candidate name' },
        { name: 'role', type: 'string', required: true, desc: 'Access role: "student" | "admin"' },
        { name: 'hasProPass', type: 'boolean', required: true, desc: 'Pass subscription active state' },
        { name: 'proPassPlan', type: 'string', required: false, desc: 'Active pass plan name' },
        { name: 'passExpiresAt', type: 'timestamp', required: false, desc: 'Expiry ISO date of current pass' },
        { name: 'credits', type: 'number', required: true, desc: 'Student wallet credits balance' },
      ]
    }
  ];

  const filteredCollections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = selectedCollection === 'all'
      ? FIRESTORE_COLLECTIONS
      : FIRESTORE_COLLECTIONS.filter(c => c.id === selectedCollection);

    if (!q) return list;

    return list.map(c => ({
      ...c,
      fields: c.fields.filter(f =>
        f.name.toLowerCase().includes(q) ||
        f.type.toLowerCase().includes(q) ||
        f.desc.toLowerCase().includes(q)
      )
    })).filter(c => c.fields.length > 0);
  }, [selectedCollection, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Top Main Cloud Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/90 to-slate-900 border border-indigo-900/60 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold">
              <Cloud className="w-3.5 h-3.5 text-amber-400" />
              <span>Google Cloud Firestore (Enterprise Edition)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center space-x-3">
              <span>Cloud Firestore Database Engine</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                Live Active
              </span>
            </h1>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              Real-time NoSQL document store powering the CGSSB Exam Portal. All mock tests, item banks, candidate attempts, and subscriptions synchronize instantly with Google Cloud servers with zero server maintenance.
            </p>

            {/* Connection Details Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono">
              <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-indigo-300">
                Database: <strong className="text-white">ai-studio-cgssbtest-ed944dbb-7a88-46c1-8fe0-4ad38fcd1089</strong>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-teal-300">
                Project: <strong className="text-white">gen-lang-client-0783153446</strong>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-amber-300">
                Region: <strong className="text-white">asia-south1 (Mumbai)</strong>
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2.5 shrink-0 items-center">
            <button
              onClick={handleTestConnection}
              disabled={isPinging}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center space-x-2 transition border border-slate-700 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isPinging ? 'animate-spin' : ''}`} />
              <span>{isPinging ? 'Pinging Cloud...' : 'Test Connection'}</span>
            </button>

            <button
              onClick={handleDownloadSnapshot}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center space-x-2 transition shadow-lg shadow-indigo-600/20 active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON Backup</span>
            </button>

            <a
              href="https://console.firebase.google.com/project/gen-lang-client-0783153446/firestore/databases/ai-studio-cgssbtest-ed944dbb-7a88-46c1-8fe0-4ad38fcd1089/data"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center space-x-2 transition shadow-lg shadow-amber-500/20 active:scale-95"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in Firebase Console</span>
            </a>
          </div>
        </div>

        {/* Live Ping Status Notice */}
        {pingResult.status === 'success' && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center space-x-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Cloud Firestore Verified & Online! Ping round-trip latency: {pingResult.time}ms. Documents are read/write accessible.</span>
          </div>
        )}

        {backupMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center space-x-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{backupMessage}</span>
          </div>
        )}
      </div>

      {/* 1-Click Cloud Firestore Synchronization Center */}
      <div className="bg-gradient-to-r from-amber-950/30 via-slate-900 to-indigo-950/30 border border-amber-500/30 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-2 text-amber-400 font-bold text-xs">
              <Zap className="w-4 h-4" />
              <span>Cloud Firestore Master Data Synchronizer</span>
            </div>
            <h2 className="text-lg font-black text-white">
              Push All Questions, Mock Tests & Bundles Directly to Cloud Firestore
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Populates your live Google Cloud Firestore collections (<code className="text-amber-300 font-mono">questions</code>, <code className="text-amber-300 font-mono">mockTests</code>, <code className="text-amber-300 font-mono">bundles</code>) so any device or web visitor gets the latest live catalog immediately.
            </p>
          </div>

          <div className="shrink-0">
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
              <span>{isMigrating ? 'Migrating to Cloud Firestore...' : '1-Click Sync All Data to Firestore'}</span>
            </button>
          </div>
        </div>

        {/* Progress & Result Box */}
        {(isMigrating || migrationStatus || migrationResult) && (
          <div className="mt-4 p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-center">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[11px] text-slate-400">Questions Synced</div>
                  <div className="text-base font-black text-emerald-400">{migrationResult.questionsCount}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[11px] text-slate-400">Mock Tests Synced</div>
                  <div className="text-base font-black text-blue-400">{migrationResult.testsCount}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[11px] text-slate-400">Series Bundles</div>
                  <div className="text-base font-black text-amber-400">{migrationResult.bundlesCount}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[11px] text-slate-400">Attempts Synced</div>
                  <div className="text-base font-black text-purple-400">{migrationResult.attemptsCount}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sub Tabs: Collections Explorer vs Security Rules */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveSubTab('collections')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
            activeSubTab === 'collections'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Firestore Collections & Schemas</span>
        </button>

        <button
          onClick={() => setActiveSubTab('rules')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
            activeSubTab === 'rules'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Deployed Security Rules (`firestore.rules`)</span>
        </button>
      </div>

      {/* TAB 1: COLLECTIONS & SCHEMAS */}
      {activeSubTab === 'collections' && (
        <div className="space-y-6">
          {/* Collection Cards Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {FIRESTORE_COLLECTIONS.map(col => {
              const isSelected = selectedCollection === col.id;
              return (
                <div
                  key={col.id}
                  onClick={() => setSelectedCollection(isSelected ? 'all' : col.id)}
                  className={`p-4 rounded-2xl border transition cursor-pointer relative shadow-lg ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-950/30 ring-1 ring-indigo-500'
                      : 'border-slate-800 bg-slate-900/90 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-bold text-sm text-white">/{col.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                      {col.documentCount} docs
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2">{col.badge}</p>
                </div>
              );
            })}
          </div>

          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search collection fields, types, or rules..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-indigo-500 outline-none"
              />
            </div>
            {selectedCollection !== 'all' && (
              <button
                onClick={() => setSelectedCollection('all')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                Clear collection filter
              </button>
            )}
          </div>

          {/* Collection Detail Accordions */}
          <div className="space-y-6">
            {filteredCollections.map(col => (
              <div key={col.id} className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-black text-lg text-white">collection('/{col.name}')</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold">
                        {col.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{col.description}</p>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0 text-xs font-mono">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-400">
                      ID: {col.primaryKey}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
                      {col.documentCount} Documents
                    </span>
                  </div>
                </div>

                {/* Fields Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px] tracking-wider">
                        <th className="py-2.5 px-3">Field Name</th>
                        <th className="py-2.5 px-3">Firestore Type</th>
                        <th className="py-2.5 px-3">Required</th>
                        <th className="py-2.5 px-3">Description & Blueprint Constraint</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      {col.fields.map(field => (
                        <tr key={field.name} className="hover:bg-slate-850/50 transition">
                          <td className="py-2.5 px-3 font-mono font-bold text-indigo-300">{field.name}</td>
                          <td className="py-2.5 px-3">
                            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-amber-300">
                              {field.type}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            {field.required ? (
                              <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                                Required
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500">Optional</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-300">{field.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Firestore Indexes */}
                <div className="pt-2 flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-400 border-t border-slate-800/60">
                  <span className="text-slate-500 font-bold">Indexes:</span>
                  {col.indexes.map(idx => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                      {idx}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: FIRESTORE SECURITY RULES INSPECTOR */}
      {activeSubTab === 'rules' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Active Firestore Security Rules (`firestore.rules`)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Rules version 2 deployed to project <code className="text-indigo-300 font-mono">gen-lang-client-0783153446</code> and database <code className="text-indigo-300 font-mono">ai-studio-cgssbtest-...</code>
              </p>
            </div>

            <button
              onClick={handleCopyRules}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center space-x-1.5 border border-slate-700 cursor-pointer"
            >
              {copiedRules ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedRules ? 'Rules Copied!' : 'Copy Rules'}</span>
            </button>
          </div>

          {/* Rules Code Container */}
          <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 font-mono text-xs text-emerald-300 overflow-x-auto leading-relaxed max-h-[500px]">
            {FIRESTORE_RULES_TEXT}
          </pre>
        </div>
      )}
    </div>
  );
};
