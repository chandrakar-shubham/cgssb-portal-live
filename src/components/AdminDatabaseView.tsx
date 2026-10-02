import React, { useState, useMemo, useEffect } from 'react';
import { MockTest, Question, PreviousYearPaper, TestAttempt } from '../types';
import { TestSeriesBundle } from '../data/bundleCatalog';
import { isFirebaseConfigured, firebaseProjectId, firestoreDatabaseId } from '../firebase/config';
import { APP_BUILD_INFO } from '../utils/buildInfo';
import {
  fetchDatabaseObservability,
  runDatabaseIntegrityAudit,
  DatabaseObservabilitySnapshot,
  DatabaseIntegrityAudit
} from '../firebase/firestoreService';
import { getStoredBundles, purgeAllDemoDatabaseData, isDemoDataPurged, getTrueZeroDataMode, setTrueZeroDataMode } from '../utils/bundleStore';
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

export const AdminDatabaseView: React.FC<AdminDatabaseViewProps> = ({
  tests,
  questions,
  pypPapers,
  attempts,
  onRestoreSnapshot,
  onOpenToolsModal,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'analytics' | 'audit' | 'collections' | 'rules'>('analytics');
  const [copiedRules, setCopiedRules] = useState(false);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const [trueZero, setTrueZero] = useState<boolean>(getTrueZeroDataMode());

  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState<{ status: 'idle' | 'success' | 'offline'; time?: number }>({ status: 'idle' });

  const [isPurging, setIsPurging] = useState(false);
  const [liveObservability, setLiveObservability] = useState<DatabaseObservabilitySnapshot | null>(null);
  const [liveIntegrity, setLiveIntegrity] = useState<DatabaseIntegrityAudit | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  const refreshDatabaseAudit = async () => {
    if (!isFirebaseConfigured) {
      setAuditError('Firebase is not configured.');
      return;
    }
    setIsAuditing(true);
    setAuditError(null);
    try {
      const [observability, integrity] = await Promise.all([
        fetchDatabaseObservability(100),
        runDatabaseIntegrityAudit(500)
      ]);
      setLiveObservability(observability);
      setLiveIntegrity(integrity);
    } catch (error) {
      setAuditError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsAuditing(false);
    }
  };

  useEffect(() => {
    void refreshDatabaseAudit();
  }, []);

  const analytics = useMemo(() => {
    const totalDocs = liveObservability?.totalDocuments ?? null;
    const estimatedKB = liveObservability ? (liveObservability.estimatedBytes / 1024).toFixed(1) : null;
    const evaluated = liveIntegrity?.schemaEvaluatedDocuments || 0;
    const valid = liveIntegrity?.schemaValidDocuments || 0;
    const schemaComplianceRate = evaluated > 0 ? Math.round((valid / evaluated) * 100) : null;

    const collectionBreakdown = liveObservability?.collections.map(col => ({
      name: col.name,
      count: col.count,
      sizeKB: (col.estimatedBytes / 1024).toFixed(1),
      primaryKey: col.name === 'users' ? 'uid' : 'id',
      status: col.status === 'error' ? 'Error' : 'Healthy'
    })) || [];

    return {
      totalDocs,
      totalKB: estimatedKB,
      schemaComplianceRate,
      brokenQuestionRefsCount: liveIntegrity?.testsWithMissingQuestions ?? null,
      emptyTestsCount: liveIntegrity?.testsWithZeroQuestions ?? null,
      emptyBundlesCount: liveIntegrity?.bundlesWithZeroTests ?? null,
      canonicalIntegrityIssues: liveIntegrity
        ? liveIntegrity.seriesWithoutBundle + liveIntegrity.bundlesWithoutSeries + liveIntegrity.mismatchedSeriesBundles
        : null,
      collectionBreakdown
    };
  }, [liveObservability, liveIntegrity]);

  const handleTestConnection = async () => {
    setIsPinging(true);
    const start = performance.now();
    try {
      await testConnection();
      setPingResult({ status: 'success', time: Math.round(performance.now() - start) });
    } catch {
      setPingResult({ status: 'offline' });
    } finally {
      setIsPinging(false);
    }
  };

  const handlePurgeAllDemoData = async () => {
    const confirmation = window.prompt(
      'Production safety: this action only deletes Firestore documents explicitly marked isDemo=true.\\n\\nType PURGE MARKED DEMO to continue.'
    );
    if (confirmation !== 'PURGE MARKED DEMO') return;

    setIsPurging(true);
    try {
      const result = await purgeAllDemoDatabaseData();
      const deleted = result.purgedKeys.length ? result.purgedKeys.join(', ') : 'no marked demo documents';
      setBackupMessage('Safe demo purge completed: ' + deleted + '.');
      await refreshDatabaseAudit();
    } catch (err: any) {
      setBackupMessage('Demo purge failed: ' + (err?.message || 'Unknown error'));
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
    setBackupMessage(nextState ? 'True 0 Data Mode enabled: demo catalogs suppressed.' : 'Default catalog mode restored.');
    setTimeout(() => setBackupMessage(null), 3500);
  };

  const handleCopyRules = () => {
    navigator.clipboard.writeText(FIRESTORE_RULES_TEXT);
    setCopiedRules(true);
    setTimeout(() => setCopiedRules(false), 2500);
  };

  const handleDownloadSnapshot = () => {
    const auditSnapshot = {
      version: APP_BUILD_INFO.version,
      exportedAt: new Date().toISOString(),
      platform: 'CGSSB Portal — Firestore Audit Snapshot',
      firestore: {
        projectId: firebaseProjectId,
        databaseId: firestoreDatabaseId,
        observability: liveObservability,
        integrity: liveIntegrity,
      },
      appState: {
        testsCount: tests.length,
        questionsCount: questions.length,
        pypCount: pypPapers.length,
        attemptsCount: attempts.length,
      },
    };

    const blob = new Blob([JSON.stringify(auditSnapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cgssb-firestore-audit-' + new Date().toISOString().split('T')[0] + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setBackupMessage('Live Firestore audit snapshot exported.');
    setTimeout(() => setBackupMessage(null), 3500);
  };

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
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${liveIntegrity ? (analytics.canonicalIntegrityIssues === 0 && analytics.brokenQuestionRefsCount === 0 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30') : 'bg-amber-500/20 text-amber-300 border-amber-500/30'}`}>
                {liveIntegrity ? (analytics.canonicalIntegrityIssues === 0 && analytics.brokenQuestionRefsCount === 0 ? 'Integrity Healthy' : 'Integrity Issues Found') : 'Audit Pending'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center space-x-2">
              <Database className="w-7 h-7 text-indigo-400" />
              <span>Database Observability & Architecture</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Live Firestore telemetry, bounded schema validation, canonical referential-integrity auditing, and production-safe demo-data controls.
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
              <span>{isPinging ? 'Pinging Firestore...' : 'Ping Firestore'}</span>
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
              <span>Purge Demo Data</span>
            </button>
          </div>
        </div>

        {/* Live Diagnostics Pill Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-indigo-900/40 text-xs">
          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-medium">Firestore Database</div>
            <div className="text-white font-mono font-bold text-xs truncate mt-0.5">{firestoreDatabaseId}</div><div className="text-[10px] text-slate-500 truncate mt-1">{firebaseProjectId}</div>
          </div>
          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-medium">Schema Compliance</div>
            <div className="text-emerald-400 font-bold text-xs mt-0.5 flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{analytics.schemaComplianceRate === null ? 'Audit pending' : `${analytics.schemaComplianceRate}% validated`}</span>
            </div>
          </div>
          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-medium">Total Live Documents</div>
            <div className="text-indigo-300 font-bold text-xs mt-0.5">{analytics.totalDocs === null ? 'Audit pending' : `${analytics.totalDocs.toLocaleString()} docs`}</div>
          </div>
          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-medium">Query Latency</div>
            <div className="text-amber-300 font-bold text-xs mt-0.5">
              {pingResult.status === 'success' ? `${pingResult.time} ms` : pingResult.status === 'offline' ? 'Offline' : 'Not measured'}
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
              <div className="text-[11px] text-slate-400">Across {liveObservability?.collections.length || 0} monitored collections</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Sampled Payload</span>
                <HardDrive className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-3xl font-black text-white">{analytics.totalKB} <span className="text-sm font-normal text-slate-400">KB</span></div>
              <div className="text-[11px] text-slate-400 font-semibold">Sample estimate; not billed Firestore storage</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Schema Conformance</span>
                <CheckSquare2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-black text-emerald-400">{analytics.schemaComplianceRate}%</div>
              <div className="text-[11px] text-slate-400">{liveIntegrity?.mode === 'sampled' ? `Sampled audit (${liveIntegrity.sampleLimit}/collection)` : 'Full audit of evaluated documents'}</div>
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
                <p className="text-xs text-slate-400">Live document counts, sampled payload size, and query health</p>
              </div>

              <button
                onClick={() => void refreshDatabaseAudit()}
                disabled={isAuditing}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center space-x-1.5 border border-slate-700 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
                <span>{isAuditing ? 'Auditing...' : 'Refresh Audit'}</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Collection</th>
                    <th className="py-3 px-4">Primary Key</th>
                    <th className="py-3 px-4">Document Count</th>
                    <th className="py-3 px-4">Sampled Payload</th>
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
                <div className={`text-2xl font-black ${analytics.brokenQuestionRefsCount === 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{analytics.brokenQuestionRefsCount === null ? '—' : analytics.brokenQuestionRefsCount}</div>
                <div className="text-[11px] text-slate-400">{analytics.brokenQuestionRefsCount === 0 ? 'No broken refs in audit scope' : 'Broken question references detected'}</div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-1">
                <div className="text-xs font-bold text-slate-400">Empty Mock Tests</div>
                <div className="text-2xl font-black text-white">{analytics.emptyTestsCount === null ? '—' : analytics.emptyTestsCount}</div>
                <div className="text-[11px] text-slate-400">Tests with 0 questions</div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-1">
                <div className="text-xs font-bold text-slate-400">Bundles with 0 Tests</div>
                <div className="text-2xl font-black text-white">{analytics.emptyBundlesCount === null ? '—' : analytics.emptyBundlesCount}</div>
                <div className="text-[11px] text-slate-400">Bundles with no linked tests</div>
              </div>
            </div>
          </div>


          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-black text-white flex items-center space-x-2">
              <FolderTree className="w-4 h-4 text-indigo-400" />
              <span>Canonical Series ↔ Bundle Integrity</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl">
                <div className="text-xs text-slate-400">Series without Bundle</div>
                <div className="text-2xl font-black text-rose-300">{liveIntegrity?.seriesWithoutBundle ?? '—'}</div>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl">
                <div className="text-xs text-slate-400">Bundle without Series</div>
                <div className="text-2xl font-black text-rose-300">{liveIntegrity?.bundlesWithoutSeries ?? '—'}</div>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl">
                <div className="text-xs text-slate-400">Hierarchy Mismatches</div>
                <div className="text-2xl font-black text-rose-300">{liveIntegrity?.mismatchedSeriesBundles ?? '—'}</div>
              </div>
            </div>
            {liveIntegrity && (
              <div className="text-[11px] text-slate-500">
                Audit mode: <strong className="text-slate-300">{liveIntegrity.mode}</strong> · up to {liveIntegrity.sampleLimit} documents per audited collection.
              </div>
            )}
          </div>

          {/* Database Control & Demo Purge Command Center */}
          <div className="bg-slate-900 border border-rose-900/30 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-rose-300 flex items-center space-x-2">
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <span>Production-Safe Demo Data Purge</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Deletes only documents explicitly tagged isDemo=true. Production documents, canonical taxonomy, and local caches are never deleted.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-900/40 space-y-3">
              <div className="text-xs text-rose-200">
                Clicking <strong>Purge Marked Demo Data</strong> will:
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-400">
                  <li>Delete only <code className="text-rose-300">isDemo=true</code> documents from mockTests, questions, pypPapers, and bundles</li>
                  <li>Never delete canonical examAuthorities, examPrograms, examPosts, or examTestSeries</li>
                  <li>Never clear production local caches or student data</li>
                  <li>Refresh the live observability audit after deletion</li>
                </ul>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={handlePurgeAllDemoData}
                  disabled={isPurging}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black transition shadow-lg shadow-rose-600/30 flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isPurging ? 'Purging Marked Demo...' : 'Purge Marked Demo Data'}</span>
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
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-black text-white">Live Firestore Collections</h2>
                <p className="text-xs text-slate-400">Counts come from Firestore aggregation queries; payload size is a bounded sample estimate.</p>
              </div>
              <button
                onClick={() => void refreshDatabaseAudit()}
                disabled={isAuditing}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 disabled:opacity-50"
              >
                <RefreshCw className={`inline w-3.5 h-3.5 mr-1.5 ${isAuditing ? 'animate-spin' : ''}`} />
                {isAuditing ? 'Auditing...' : 'Refresh'}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Collection</th>
                    <th className="py-3 px-4">Documents</th>
                    <th className="py-3 px-4">Sample</th>
                    <th className="py-3 px-4">Payload</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {(liveObservability?.collections || []).map(col => (
                    <tr key={col.name} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 text-white font-bold">{col.name}</td>
                      <td className="py-2.5 px-4 text-indigo-300">{col.count === null ? '—' : col.count.toLocaleString()}</td>
                      <td className="py-2.5 px-4 text-slate-400">{col.sampleCount}</td>
                      <td className="py-2.5 px-4 text-slate-300">{(col.estimatedBytes / 1024).toFixed(1)} KB</td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${col.status === 'error' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}`}>
                          {col.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!liveObservability && <div className="text-xs text-slate-500 py-6 text-center">Waiting for live Firestore audit…</div>}
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
