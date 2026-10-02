import React, { useState, useMemo, useEffect } from 'react';
import { MockTest, Question, PreviousYearPaper, TestAttempt } from '../types';
import { TestSeriesBundle } from '../data/bundleCatalog';
import { isFirebaseConfigured, firebaseProjectId, firestoreDatabaseId } from '../firebase/config';
import { APP_BUILD_INFO } from '../utils/buildInfo';
import {
  fetchDatabaseObservability,
  runDatabaseIntegrityAudit,
  fetchOrphanedSeriesRecords,
  DatabaseObservabilitySnapshot,
  DatabaseIntegrityAudit,
  OrphanedSeriesRecord
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

const FIRESTORE_RULES_TEXT = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }

    function isPermanentUser() {
      return isAuthenticated() &&
        request.auth.token.firebase.sign_in_provider != 'anonymous';
    }

    function isBootstrapAdmin() {
      return isAuthenticated() &&
        request.auth.uid == 'VOynxZyDOJR4lg2x4va2U3qF5m72';
    }

    function isAdminEmail() {
      return isAuthenticated() &&
        request.auth.token.email_verified == true &&
        request.auth.token.email == 'admin@cgtest.in';
    }

    function isAdmin() {
      return isBootstrapAdmin() ||
        isAdminEmail() ||
        (isAuthenticated() &&
         exists(/databases/$(database)/documents/adminMembers/$(request.auth.uid)));
    }

    function isDelegatedAdmin() {
      return isAuthenticated() &&
        exists(/databases/$(database)/documents/adminMembers/$(request.auth.uid));
    }

    function hasManageStudents() {
      return isBootstrapAdmin() ||
        (isDelegatedAdmin() &&
         get(/databases/$(database)/documents/adminMembers/$(request.auth.uid)).data.adminPermissions.manageStudents == true);
    }

    function hasManageAdmins() {
      return isBootstrapAdmin();
    }

    function hasManageTests() {
      return isBootstrapAdmin() ||
        (isDelegatedAdmin() &&
         get(/databases/$(database)/documents/adminMembers/$(request.auth.uid)).data.adminPermissions.manageTests == true);
    }

    function hasManageQuestions() {
      return isBootstrapAdmin() ||
        (isDelegatedAdmin() &&
         get(/databases/$(database)/documents/adminMembers/$(request.auth.uid)).data.adminPermissions.manageQuestions == true);
    }

    function hasManageCMS() {
      return isBootstrapAdmin() ||
        (isDelegatedAdmin() &&
         get(/databases/$(database)/documents/adminMembers/$(request.auth.uid)).data.adminPermissions.manageCMS == true);
    }

    function hasManagePayments() {
      return isBootstrapAdmin() ||
        (isDelegatedAdmin() &&
         get(/databases/$(database)/documents/adminMembers/$(request.auth.uid)).data.adminPermissions.managePayments == true);
    }

    function hasManageSystem() {
      return isBootstrapAdmin() ||
        (isDelegatedAdmin() &&
         get(/databases/$(database)/documents/adminMembers/$(request.auth.uid)).data.adminPermissions.manageSystem == true);
    }

    function isOwner(userId) {
      return isPermanentUser() && request.auth.uid == userId;
    }

    // User profile. Client can edit only non-privileged profile fields.
    // Admins can manage profiles from the admin portal.
    match /users/{userId} {
      allow read: if isOwner(userId) || isAdmin();
      allow create: if (isOwner(userId) &&
        request.resource.data.keys().hasOnly([
          'id', 'name', 'email', 'phone', 'avatar', 'registeredAt',
          'lastLoginAt', 'targetExam', 'targetYear', 'district',
          'categoryReservation', 'gender', 'education', 'medium', 'bio',
          'dailyGoalQuestions', 'referralCode', 'referredBy', 'lastSyncedAt'
        ])) ||
        (hasManageStudents() &&
         request.resource.data.keys().hasOnly([
          'id', 'name', 'email', 'phone', 'avatar', 'registeredAt',
          'lastLoginAt', 'targetExam', 'targetYear', 'district',
          'categoryReservation', 'gender', 'education', 'medium', 'bio',
          'dailyGoalQuestions', 'referralCode', 'referredBy',
          'lastSyncedAt', 'role', 'status', 'isBlocked', 'completedTestsCount',
          'hasProPass', 'proPassPlan', 'passDurationDays', 'passExpiresAt',
          'boundDeviceId', 'boundDeviceName', 'freePassStage',
          'unlockedMilestoneBonus', 'referralCount', 'referralBonusMonths'
        ]));
      allow update: if hasManageStudents() ||
        (isOwner(userId) &&
         request.resource.data.diff(resource.data).affectedKeys().hasOnly([
          'name', 'email', 'phone', 'avatar', 'lastLoginAt',
          'targetExam', 'targetYear', 'district', 'categoryReservation',
          'gender', 'education', 'medium', 'bio', 'dailyGoalQuestions',
          'lastSyncedAt'
         ]));
      allow delete: if hasManageStudents();
    }

    // Canonical exam taxonomy. Public reads; admin-managed mutations.
    match /examAuthorities/{authorityId} {
      allow read: if true;
      allow write: if hasManageCMS() || hasManageTests();
    }
    match /examPrograms/{programId} {
      allow read: if true;
      allow write: if hasManageCMS() || hasManageTests();
    }
    match /examPosts/{postId} {
      allow read: if true;
      allow write: if hasManageCMS() || hasManageTests();
    }
    match /examTestSeries/{seriesId} {
      allow read: if true;
      allow write: if hasManageCMS() || hasManageTests();
    }
    match /examSubjects/{subjectId} {
      allow read: if true;
      allow write: if hasManageCMS() || hasManageTests();
    }

    // Public exam/catalog content. Admin-only mutations.
    match /mockTests/{testId} {
      allow read: if true;
      allow write: if hasManageTests();
    }
    match /questions/{questionId} {
      allow read: if true;
      allow write: if hasManageQuestions();
    }
    match /pypPapers/{paperId} {
      allow read: if true;
      allow write: if hasManageTests();
    }
    match /bundles/{bundleId} {
      allow read: if true;
      allow write: if hasManageCMS() || hasManageTests();
    }
    match /pages/{pageId} {
      allow read: if true;
      allow write: if hasManageCMS();
    }
    match /posts/{postId} {
      allow read: if true;
      allow write: if hasManageCMS();
    }
    match /seriesPacks/{packId} {
      allow read: if true;
      allow write: if hasManageCMS() || hasManageTests();
    }
    match /cmsSettings/{settingsId} {
      allow read: if true;
      allow write: if hasManageCMS();
    }
    match /slider_banners/{bannerId} {
      allow read: if true;
      allow write: if hasManageCMS() || hasManageSystem();
    }

    // Current-affairs public content. Admin-only mutations.
    match /currentAffairsSources/{docId} {
      allow read: if true;
      allow write: if hasManageQuestions();
    }
    match /currentAffairsTopics/{docId} {
      allow read: if true;
      allow write: if hasManageQuestions();
    }
    match /currentAffairsQuestions/{docId} {
      allow read: if true;
      allow write: if hasManageQuestions();
    }
    match /dailyEditions/{docId} {
      allow read: if true;
      allow write: if hasManageQuestions();
    }
    match /monthlyEditions/{docId} {
      allow read: if true;
      allow write: if hasManageQuestions();
    }
    match /monthlyEditions/{docId}/sections/{sectionId} {
      allow read: if true;
      allow write: if hasManageQuestions();
    }

    // Attempts: authenticated students may create/read only their own attempts.
    // Admins can read/write for support and analytics.
    match /attempts/{attemptId} {
      // The nonexistent-document branch is needed for the idempotent transaction
      // that checks whether this submission ID has already been committed.
      allow get: if hasManageStudents() ||
        (isAuthenticated() && resource == null) ||
        (isOwner(resource.data.userId));
      // Student attempt queries must be constrained to the authenticated owner.
      allow list: if hasManageStudents() ||
        (isPermanentUser() && resource.data.userId == request.auth.uid);
      allow create: if hasManageStudents() ||
        (isOwner(request.resource.data.userId) &&
         request.resource.data.testId is string &&
         request.resource.data.id is string &&
         request.resource.data.submissionId is string &&
         request.resource.data.responses is map &&
         request.resource.data.questionStatuses is map &&
         request.resource.data.correctCount is number &&
         request.resource.data.incorrectCount is number &&
         request.resource.data.unattemptedCount is number &&
         request.resource.data.attemptedCount is number &&
         request.resource.data.maxScore is number &&
         request.resource.data.score is number);
      // Student attempts are immutable after creation. This prevents a second
      // client write from changing score/answers after the idempotent submission.
      allow update: if hasManageStudents();
      allow delete: if hasManageStudents();
    }

    // User-specific application state.
    match /userBookmarks/{userId} {
      allow read, write: if isOwner(userId);
      allow delete: if isOwner(userId);
    }
    match /userMistakes/{userId} {
      allow read, write: if isOwner(userId);
      allow delete: if isOwner(userId);
    }
    match /userEntitlements/{userId} {
      allow read: if isOwner(userId) || isAdmin();
      // A newly registered student may create exactly one free 30-day welcome entitlement.
      // Paid/manual entitlements remain admin-controlled.
      allow create: if isOwner(userId) &&
        request.resource.data.planType in ['WELCOME_FREE', 'FREE_CAMPAIGN'] &&
        request.resource.data.status == 'ACTIVE' &&
        request.resource.data.durationDays == 30 &&
        request.resource.data.source in ['WELCOME_FREE', 'FREE_CAMPAIGN'] &&
        request.resource.data.userId == userId &&
        request.resource.data.keys().hasOnly([
          'userId', 'planType', 'status', 'issuedAt', 'expiresAt',
          'durationDays', 'source', 'planName', 'boundDeviceId',
          'boundDeviceName', 'updatedAt', 'completedTestsCount', 'freePassStage',
           'unlockedMilestoneBonus', 'campaignId'
        ]);
      allow update: if hasManagePayments() ||
        (isOwner(userId) &&
         request.resource.data.userId == userId &&
         request.resource.data.source in ['CLIENT_CHECKOUT', 'FREE_CAMPAIGN'] &&
         request.resource.data.status in ['ACTIVE', 'EXPIRED'] &&
         request.resource.data.durationDays in [30, 90, 365] &&
         request.resource.data.keys().hasOnly([
           'userId', 'planType', 'status', 'issuedAt', 'expiresAt',
           'durationDays', 'source', 'planName', 'boundDeviceId',
           'boundDeviceName', 'updatedAt', 'completedTestsCount', 'freePassStage',
           'unlockedMilestoneBonus', 'campaignId'
         ]));
      allow delete: if hasManagePayments();
    }

    // Student test-series enrollments. The active pass remains the authoritative
    // entitlement for pass-based test access; this collection organizes My Tests.
    match /seriesEnrollments/{enrollmentId} {
      allow get: if isOwner(resource.data.userId) || isAdmin();
      allow list: if hasManageStudents() ||
        (isPermanentUser() && resource.data.userId == request.auth.uid);
      allow create: if isOwner(request.resource.data.userId) &&
        request.resource.data.seriesId is string &&
        request.resource.data.status == 'active' &&
        request.resource.data.accessType == 'PASS' &&
        request.resource.data.amountPaid == 0 &&
        request.resource.data.price is number &&
        request.resource.data.enrolledAt is string &&
        request.resource.data.accessExpiresAt is string &&
        request.resource.data.updatedAt is string &&
        request.resource.data.keys().hasOnly([
          'id', 'userId', 'seriesId', 'status', 'accessType',
          'enrolledAt', 'accessExpiresAt', 'price', 'amountPaid', 'updatedAt'
        ]);
      allow update: if isOwner(resource.data.userId) &&
        request.resource.data.userId == resource.data.userId &&
        request.resource.data.seriesId == resource.data.seriesId &&
        request.resource.data.diff(resource.data).affectedKeys().hasOnly([
          'status', 'accessExpiresAt', 'updatedAt'
        ]);
      allow delete: if isOwner(resource.data.userId) || isAdmin();
    }

    // Legacy per-attempt leaderboard entries remain readable for migration only.
    // New production rankings use compact per-student profile documents below.
    match /leaderboardEntries/{entryId} {
      allow get: if true;
      allow list: if hasManageStudents() || request.query.limit <= 100;
      allow create: if isOwner(request.resource.data.userId) &&
        request.resource.data.source == 'practice_attempt' &&
        request.resource.data.keys().hasOnly([
          'id', 'userId', 'candidateName', 'district', 'category',
          'targetKey', 'targetExam', 'seriesId', 'testId', 'score', 'maxScore',
          'percentage', 'accuracy', 'correctCount', 'incorrectCount',
          'unattemptedCount', 'timeTakenSeconds', 'submittedAt', 'source'
        ]);
      allow update: if isOwner(resource.data.userId) &&
        request.resource.data.userId == resource.data.userId &&
        request.resource.data.diff(resource.data).affectedKeys().hasOnly([
          'candidateName', 'district', 'category', 'targetKey', 'targetExam',
          'seriesId', 'testId', 'score', 'maxScore', 'percentage', 'accuracy',
          'correctCount', 'incorrectCount', 'unattemptedCount', 'timeTakenSeconds',
          'submittedAt', 'source'
        ]);
      allow delete: if isOwner(resource.data.userId) || isAdmin();
    }

    // Compact per-student ranking summaries. Public reads are bounded to 100 rows;
    // writes are restricted to the owning authenticated student.
    match /leaderboardProfiles/{profileId} {
      allow get: if true;
      allow list: if hasManageStudents() || request.query.limit <= 100;
      allow create: if isOwner(request.resource.data.userId) &&
        request.resource.data.source == 'practice_summary' &&
        request.resource.data.keys().hasOnly([
          'id', 'userId', 'scopeType', 'scopeKey', 'targetKey', 'targetExam',
          'seriesId', 'testId', 'candidateName', 'district', 'category',
          'score', 'maxScore', 'averagePercentage', 'averageAccuracy',
          'testsTaken', 'averageTimeSeconds', 'updatedAt', 'source'
        ]);
      allow update: if isOwner(resource.data.userId) &&
        request.resource.data.userId == resource.data.userId &&
        request.resource.data.scopeType == resource.data.scopeType &&
        request.resource.data.scopeKey == resource.data.scopeKey &&
        request.resource.data.diff(resource.data).affectedKeys().hasOnly([
          'candidateName', 'district', 'category', 'score', 'maxScore',
          'averagePercentage', 'averageAccuracy', 'testsTaken',
          'averageTimeSeconds', 'updatedAt', 'targetExam', 'targetKey',
          'seriesId', 'testId', 'source'
        ]);
      allow delete: if isOwner(resource.data.userId) || isAdmin();
    }

    // Referral records may be read only by an admin in Spark mode.
    // This avoids exposing cross-user referral relationships to clients.
    match /referrals/{referralId} {
      allow read, write: if hasManageStudents();
    }

    // Admin/member/coupon management.
    match /adminMembers/{memberId} {
      // Only the bootstrap Super Admin may create, edit, or revoke delegated admin roles.
      // Other admins can read their roster but cannot self-escalate privileges.
      allow read: if isAdmin();
      allow create, update, delete: if hasManageAdmins();
    }
    match /discountCoupons/{couponId} {
      allow read, write: if hasManagePayments();
    }

    // Content Manager audit trail. Only authenticated admins may create/read audit records.
    match /aiContentManagerAudit/{auditId} {
      allow read: if isAdmin();
      allow create: if hasManageCMS() || hasManageTests() || hasManageQuestions();
      allow update, delete: if isBootstrapAdmin();
    }

    // Public configuration.
    match /remoteConfig/{configId} {
      allow read: if true;
      allow write: if hasManageSystem();
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
`;

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
  const [orphanedSeries, setOrphanedSeries] = useState<OrphanedSeriesRecord[]>([]);
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
      const [observability, integrity, orphaned] = await Promise.all([
        fetchDatabaseObservability(100),
        runDatabaseIntegrityAudit(500),
        fetchOrphanedSeriesRecords(500)
      ]);
      setLiveObservability(observability);
      setLiveIntegrity(integrity);
      setOrphanedSeries(orphaned);
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
      {auditError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold">
          Live Firestore audit warning: {auditError}
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
                <span className="text-xs font-bold uppercase tracking-wider">Core Schema Conformance</span>
                <CheckSquare2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-black text-emerald-400">{analytics.schemaComplianceRate === null ? '—' : `${analytics.schemaComplianceRate}%`}</div>
              <div className="text-[11px] text-slate-400">{liveIntegrity?.mode === 'sampled' ? `Sampled audit (${liveIntegrity.sampleLimit}/collection)` : 'Full audit of evaluated documents'}</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Auto-Link Governance</span>
                <Shield className="w-4 h-4 text-purple-400" />
              </div>
              <div className={`text-xl font-black ${analytics.canonicalIntegrityIssues === null ? 'text-amber-300' : analytics.canonicalIntegrityIssues === 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{analytics.canonicalIntegrityIssues === null ? 'Audit pending' : analytics.canonicalIntegrityIssues === 0 ? 'Healthy' : `${analytics.canonicalIntegrityIssues} issues`}</div>
              <div className="text-[11px] text-slate-400">Canonical Series ↔ Bundle integrity</div>
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

          {/* Orphaned Canonical Series Inspector */}
          <div className="bg-slate-900 border border-amber-900/40 rounded-3xl p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-amber-300 flex items-center space-x-2">
                  <FolderTree className="w-4 h-4 text-amber-400" />
                  <span>Orphaned Canonical Series Inspector</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  These are canonical <code className="text-amber-300">examTestSeries</code> records whose linked Bundle document is missing.
                  This inspector is read-only: it will not delete or recreate production data.
                </p>
              </div>
              <div className="shrink-0 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-black">
                {orphanedSeries.length} orphan{orphanedSeries.length === 1 ? '' : 's'}
              </div>
            </div>

            {orphanedSeries.length === 0 ? (
              <div className="rounded-2xl border border-emerald-900/40 bg-emerald-950/20 p-4 text-xs text-emerald-300">
                No orphaned canonical Test Series were found in the current audit scope.
              </div>
            ) : (
              <div className="space-y-3">
                {orphanedSeries.map(series => (
                  <div key={series.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-black text-white">{series.name}</span>
                          {series.nameHindi && <span className="text-xs text-slate-400">{series.nameHindi}</span>}
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-300 border border-rose-500/20">
                            {series.reason === 'bundleId_missing' ? 'bundleId missing' : 'bundle missing'}
                          </span>
                        </div>
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-1 text-[11px] font-mono">
                          <div><span className="text-slate-500">Series ID:</span> <span className="text-slate-300">{series.id}</span></div>
                          <div><span className="text-slate-500">Bundle ID:</span> <span className="text-slate-300">{series.bundleId || '—'}</span></div>
                          <div><span className="text-slate-500">Type:</span> <span className="text-slate-300">{series.seriesType}</span></div>
                          <div><span className="text-slate-500">Authority:</span> <span className="text-slate-300">{series.authorityId || '—'}</span></div>
                          <div><span className="text-slate-500">Program:</span> <span className="text-slate-300">{series.programId || '—'}</span></div>
                          <div><span className="text-slate-500">Post:</span> <span className="text-slate-300">{series.postId || '—'}</span></div>
                          <div><span className="text-slate-500">Status:</span> <span className="text-slate-300">{series.status || '—'}</span></div>
                          <div><span className="text-slate-500">Slug:</span> <span className="text-slate-300">{series.slug || '—'}</span></div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => void navigator.clipboard?.writeText(JSON.stringify(series, null, 2))}
                        className="shrink-0 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700"
                      >
                        <Copy className="inline w-3.5 h-3.5 mr-1.5" />
                        Copy Record
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="text-[11px] text-slate-500 border-t border-slate-800 pt-3">
              Safe next step: inspect these records and determine whether each Bundle was accidentally deleted or the Series is obsolete.
              No automatic repair is performed because the original Bundle content cannot be safely reconstructed from a Series metadata record alone.
            </div>
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
