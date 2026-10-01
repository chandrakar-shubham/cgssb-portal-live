/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * CGSSB Portal - Release v2.5.2
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { Navbar } from './components/Navbar';
import { StudentDashboard } from './components/StudentDashboard';
import { StudentTestsPage, getStudentSlug } from './components/StudentTestsPage';
import { PYPSection } from './components/PYPSection';
import { AnalyticsHub } from './components/AnalyticsHub';
import { ExamEngine } from './components/ExamEngine';
import { SolutionsScreen } from './components/SolutionsScreen';
import { lazyWithRetry } from './utils/lazyWithRetry';

const AdminQuestionBank = lazyWithRetry(() => import('./components/AdminQuestionBank').then(m => ({ default: m.AdminQuestionBank })));
const AdminPYPManager = lazyWithRetry(() => import('./components/AdminPYPManager').then(m => ({ default: m.AdminPYPManager })));
const AdminAITestCreator = lazyWithRetry(() => import('./components/AdminAITestCreator').then(m => ({ default: m.AdminAITestCreator })));
const AdminTestCatalog = lazyWithRetry(() => import('./components/AdminTestCatalog').then(m => ({ default: m.AdminTestCatalog })));
const AdminAndroidAPIManager = lazyWithRetry(() => import('./components/AdminAndroidAPIManager').then(m => ({ default: m.AdminAndroidAPIManager })));
const AdminPortalLogin = lazyWithRetry(() => import('./components/AdminPortalLogin').then(m => ({ default: m.AdminPortalLogin })));
const AdminCurrentAffairsStudio = lazyWithRetry(() => import('./components/AdminCurrentAffairsStudio').then(m => ({ default: m.AdminCurrentAffairsStudio })));
const AdminCMSDashboard = lazyWithRetry(() => import('./components/AdminCMSDashboard').then(m => ({ default: m.AdminCMSDashboard })));
const AdminDatabaseView = lazyWithRetry(() => import('./components/AdminDatabaseView').then(m => ({ default: m.AdminDatabaseView })));
const AdminHeader = lazyWithRetry(() => import('./components/AdminHeader').then(m => ({ default: m.AdminHeader })));
const AdminSubNav = lazyWithRetry(() => import('./components/AdminSubNav').then(m => ({ default: m.AdminSubNav })));
import { AuthModal } from './components/AuthModal';
import { MilestoneCelebrationModal } from './components/MilestoneCelebrationModal';
import { ExamInstructionsScreen } from './components/ExamInstructionsScreen';
import { CGPSCHeroPage } from './components/CGPSCHeroPage';
import { CGSSBHeroPage } from './components/CGSSBHeroPage';
import { TestPassSection } from './components/TestPassSection';
import { MistakeNotebook } from './components/MistakeNotebook';
import { BookmarksManager } from './components/BookmarksManager';
import { ChhattisgarhiRevisionModule } from './components/ChhattisgarhiRevisionModule';
import { StudentProfileModal } from './components/StudentProfileModal';
import { StudentReferral } from './components/StudentReferral';
const AdminToolsAndBackupsModal = lazyWithRetry(() => import('./components/AdminToolsAndBackupsModal').then(m => ({ default: m.AdminToolsAndBackupsModal })));
const AdminCMSPageBuilder = lazyWithRetry(() => import('./components/AdminCMSPageBuilder').then(m => ({ default: m.AdminCMSPageBuilder })));
import { DynamicPageRenderer } from './components/DynamicPageRenderer';
const AdminCMSPostManager = lazyWithRetry(() => import('./components/AdminCMSPostManager').then(m => ({ default: m.AdminCMSPostManager })));
import { DynamicPostRenderer } from './components/DynamicPostRenderer';
const AdminCMSTestSeriesManager = lazyWithRetry(() => import('./components/AdminCMSTestSeriesManager').then(m => ({ default: m.AdminCMSTestSeriesManager })));
const AdminCMSThemeCustomizer = lazyWithRetry(() => import('./components/AdminCMSThemeCustomizer').then(m => ({ default: m.AdminCMSThemeCustomizer })));
const AdminWorkspaceLayout = lazyWithRetry(() => import('./components/AdminWorkspaceLayout').then(m => ({ default: m.AdminWorkspaceLayout })));
const AdminBundleStudio = lazyWithRetry(() => import('./components/AdminBundleStudio').then(m => ({ default: m.AdminBundleStudio })));
import { UniversalIngestionStudio, IngestionContentType } from './components/UniversalIngestionStudio';
import { ChapterTestSection } from './components/ChapterTestSection';
import { PracticeSetSection } from './components/PracticeSetSection';
import { SEOQuestionView } from './components/SEOQuestionView';
const AdminChapterTestManager = lazyWithRetry(() => import('./components/AdminChapterTestManager').then(m => ({ default: m.AdminChapterTestManager })));
const AdminPracticeSetManager = lazyWithRetry(() => import('./components/AdminPracticeSetManager').then(m => ({ default: m.AdminPracticeSetManager })));
const AdminStudentManagement = lazyWithRetry(() => import('./components/AdminStudentManagement').then(m => ({ default: m.AdminStudentManagement })));
const AdminRoleManagement = lazyWithRetry(() => import('./components/AdminRoleManagement').then(m => ({ default: m.AdminRoleManagement })));
import { LiveTestLeaderboard } from './components/LiveTestLeaderboard';
import { LegalModal, LegalTab } from './components/LegalModal';
import { syncBundlesFromFirestore, cleanTestFromAllBundles } from './utils/bundleStore';
import { useRemoteConfig } from './context/RemoteConfigContext';
const AdminRemoteConfigStudio = lazyWithRetry(() => import('./components/AdminRemoteConfigStudio').then(m => ({ default: m.AdminRemoteConfigStudio })));
const AdminSliderStudio = lazyWithRetry(() => import('./components/AdminSliderStudio').then(m => ({ default: m.AdminSliderStudio })));
import { useTestManager } from './hooks/useTestManager';
import { useQuestionManager } from './hooks/useQuestionManager';
import { usePypManager } from './hooks/usePypManager';
import { useCmsManager } from './hooks/useCmsManager';
import { ArrowLeft, Trophy, Bell, AlertTriangle, Radio, X, Gift } from 'lucide-react';
import {
  CMSPage,
  CMSPost,
  CMSTestSeriesPack,
  CMSSiteSettings
} from './types/cms';
import { getAdminToken, api } from './utils/apiClient';
import {
  cacheTestBundleForDevice,
  clearCachedTestBundle,
} from './utils/offlineExamManager';
import {
  INITIAL_CMS_PAGES,
  INITIAL_CMS_POSTS,
  INITIAL_CMS_SERIES_PACKS,
  INITIAL_CMS_SETTINGS
} from './defaultCmsData';
import {
  MockTest,
  Question,
  PreviousYearPaper,
  TestAttempt,
  ExamCategory,
  QuestionPaletteStatus
} from './types';
import {
  INITIAL_MOCK_TESTS,
  INITIAL_QUESTIONS,
  INITIAL_PYP_PAPERS,
  INITIAL_ATTEMPTS
} from './mockData';
import {
  normalizeSubjectName,
  migrateLegacyQuestion,
  migrateLegacyAttempt,
  runTaxonomyMigration
} from './utils/taxonomyMigration';
import { extractHierarchyFromApp } from './utils/examHierarchy';
import { Shield, Lock, ExternalLink, Smartphone } from 'lucide-react';
import { auth } from './firebase/config';
import { isUserPassActive } from './utils/devicePassManager';
import { buildLeaderboardProfilesForUser } from './utils/leaderboardProfiles';
import { testConnection } from './firebase/connectionTest';
import {
  fetchTestsFromFirestore,
  saveTestToFirestore,
  fetchQuestionsFromFirestore,
  saveQuestionsToFirestore,
  deleteQuestionFromFirestore,
  deleteTestFromFirestore,
  fetchPypPapersFromFirestore,
  savePypPaperToFirestore,
  deletePypPaperFromFirestore,
  fetchMyAttemptsFromFirestore,
  saveAttemptToFirestore,
  saveLeaderboardProfilesToFirestore,
} from './firebase/firestoreService';

function MainApp() {
  const { user, deductCredits, isAdminAuthenticated, isStudentBlocked, recordTestCompletion } = useAuth();
  const { config, isMaintenanceMode } = useRemoteConfig();
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  // Route & SEO State
  const parseRouteFromLocation = (): { route: 'student' | 'admin'; tab: string; pageSlug?: string; postSlug?: string; studentSlug?: string } => {
    if (typeof window === 'undefined') return { route: 'student', tab: 'tests' };
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();

    const studentTestsMatch = path.match(/^\/u\/([^/]+)\/tests(?:\/.*)?$/i);
    if (studentTestsMatch) {
      return { route: 'student', tab: 'student-tests', studentSlug: decodeURIComponent(studentTestsMatch[1]) };
    }
    if (path.startsWith('/admin') || hash.startsWith('#/admin') || hash === '#admin') {
      return { route: 'admin', tab: 'admin-pyp' };
    }
    if (path.startsWith('/page/') || path.startsWith('/pages/') || path.startsWith('/p/')) {
      const parts = path.split('/');
      const slug = parts[2] || '';
      return { route: 'student', tab: 'page', pageSlug: slug };
    }
    if (path === '/about' || path === '/syllabus-guide' || path === '/legal') {
      return { route: 'student', tab: 'page', pageSlug: path.replace('/', '') };
    }
    if (path.startsWith('/post/') || path.startsWith('/posts/')) {
      const parts = path.split('/');
      const slug = parts[2] || '';
      return { route: 'student', tab: 'posts', postSlug: slug };
    }
    if (path.includes('chapter') || hash.includes('chapter')) {
      return { route: 'student', tab: 'chapters' };
    }
    if (path.includes('practice') || hash.includes('practice')) {
      return { route: 'student', tab: 'practice' };
    }
    if (path.includes('leaderboard') || hash.includes('leaderboard')) {
      return { route: 'student', tab: 'leaderboard' };
    }
    if (path.includes('cgpsc') || hash.includes('cgpsc')) {
      return { route: 'student', tab: 'cgpsc' };
    }
    if (path.includes('cgssb') || hash.includes('cgssb') || path.includes('vyapam') || hash.includes('vyapam')) {
      return { route: 'student', tab: 'cgssb' };
    }
    if (path.includes('pass') || hash.includes('pass')) {
      return { route: 'student', tab: 'pass' };
    }
    if (path.includes('pyp') || hash.includes('pyp')) {
      return { route: 'student', tab: 'pyp' };
    }
    if (path.includes('analytics') || hash.includes('analytics')) {
      return { route: 'student', tab: 'analytics' };
    }
    if (path.includes('mistakes') || hash.includes('mistakes')) {
      return { route: 'student', tab: 'mistakes' };
    }
    if (path.includes('bookmarks') || hash.includes('bookmarks')) {
      return { route: 'student', tab: 'bookmarks' };
    }
    if (path.includes('posts') || hash.includes('posts')) {
      return { route: 'student', tab: 'posts' };
    }
    if (path.includes('chhattisgarh') || hash.includes('chhattisgarh') || path.includes('flashcards')) {
      return { route: 'student', tab: 'chhattisgarh-deck' };
    }
    if (path.includes('referral') || hash.includes('referral') || path.includes('invite') || hash.includes('invite')) {
      return { route: 'student', tab: 'referral' };
    }
    return { route: 'student', tab: 'tests' };
  };

  const initialRoute = parseRouteFromLocation();
  const [currentRoute, setCurrentRoute] = useState<'student' | 'admin'>(initialRoute.route);
  const [studentActiveTab, setStudentActiveTabState] = useState<string>(initialRoute.tab);
  const [selectedSEOQuestion, setSelectedSEOQuestion] = useState<Question | null>(null);

  const getTabPath = (tab: string) => {
    switch (tab) {
      case 'student-tests': return user ? `/u/${getStudentSlug(user)}/tests` : '/';
      case 'tests': return '/';
      case 'chapters': return '/cgvyapam-cgssb/chapter-tests';
      case 'practice': return '/cgvyapam-cgssb/practice-drills';
      case 'leaderboard': return '/leaderboard';
      case 'cgpsc': return '/cgpsc/mock-tests';
      case 'cgssb': return '/cgvyapam/mock-tests';
      case 'pass': return '/pass';
      case 'pyp': return '/cgvyapam/pyp-papers';
      case 'analytics': return '/analytics';
      case 'mistakes': return '/mistakes';
      case 'bookmarks': return '/bookmarks';
      case 'chhattisgarh-deck': return '/chhattisgarhi-revision';
      case 'referral': return '/invite-earn';
      case 'posts': return '/posts';
      default: return '/';
    }
  };

  const getPageTitle = (tab: string) => {
    switch (tab) {
      case 'chapters': return 'CG Vyapam & CGPSC Chapter Tests (Topic-wise Quizzes) | cgtest.in';
      case 'practice': return 'CG Vyapam Daily Practice Drills & Solved MCQs | cgtest.in';
      case 'leaderboard': return 'State-Wide Live Merit Leaderboard & Percentile Ranks | cgtest.in';
      case 'cgpsc': return 'CGPSC Prelims & Forest Service Mock Tests 2026 | cgtest.in';
      case 'cgssb': return 'CG Vyapam Hostel Warden, Patwari & RI Tests 2026 | cgtest.in';
      case 'pass': return 'CG Exam Pass Pro - Unlimited Test Series Access | cgtest.in';
      case 'pyp': return 'CGPSC & Vyapam Previous Year Papers (PYQ Bank) | cgtest.in';
      case 'analytics': return 'Performance Analytics & Simulated Rank | cgtest.in';
      case 'mistakes': return 'Mistake Notebook & Error Log (कमज़ोर विषय री-टेस्ट) | cgtest.in';
      case 'bookmarks': return 'Starred Questions & Personal Notes (बुकमार्क) | cgtest.in';
      case 'chhattisgarh-deck': return 'Chhattisgarhi Language & GK Flashcards Revision | cgtest.in';
      case 'referral': return 'Invite & Earn (+1 Mo Free) | Student Referral Program | cgtest.in';
      default: return 'cgtest.in | CGPSC, CG Vyapam & Teacher Recruitment Mock Tests';
    }
  };

  // Navigates and updates browser URL + document title for SEO
  const setStudentActiveTab = (tab: string) => {
    setActivePageSlug(null);
    setStudentActiveTabState(tab);
    setCurrentRoute('student');
    const targetPath = getTabPath(tab);
    if (window.location.pathname !== targetPath) {
      try {
        window.history.pushState({}, '', targetPath);
      } catch {
        window.location.hash = `#${targetPath}`;
      }
    }
    document.title = getPageTitle(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Track browser forward / back button and hash changes
  useEffect(() => {
    const handleLocationChange = () => {
      const { route, tab, pageSlug, postSlug } = parseRouteFromLocation();
      setCurrentRoute(route);
      setStudentActiveTabState(tab);
      if (pageSlug) setActivePageSlug(pageSlug);
      if (postSlug) setActivePostSlug(postSlug);
      document.title = route === 'admin' ? 'Admin Portal & CMS | cgtest.in' : tab === 'student-tests' ? 'My Tests | cgtest.in' : getPageTitle(tab);
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const navigateToAdmin = () => {
    if (window.location.pathname !== '/admin') {
      try {
        window.history.pushState({}, '', '/admin');
      } catch {
        window.location.hash = '#/admin';
      }
    }
    document.title = 'Admin Portal & CMS | CGSSB Test';
    setCurrentRoute('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToStudent = () => {
    setStudentActiveTab('tests');
  };

  const [selectedCategory, setSelectedCategory] = useState<ExamCategory | 'ALL'>('ALL');

  // Admin Navigation State (Strictly for admin tabs)
  const [adminActiveTab, setAdminActiveTab] = useState<string>('admin-overview');

  // Student Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalInitialMode, setAuthModalInitialMode] = useState<'signin' | 'signup'>('signup');
  const [showMilestoneCelebrationModal, setShowMilestoneCelebrationModal] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState<LegalTab>('privacy');
  const openLegalModal = (tab: LegalTab) => {
    setLegalTab(tab);
    setIsLegalModalOpen(true);
  };

  // Admin Modals
  const [isAdminToolsModalOpen, setIsAdminToolsModalOpen] = useState(false);
  const [isUniversalIngestOpen, setIsUniversalIngestOpen] = useState(false);
  const [universalIngestConfig, setUniversalIngestConfig] = useState<{
    type?: IngestionContentType;
    lockType?: boolean;
    initialInputTab?: 'SMART_PASTE' | 'JSON_EDITOR' | 'AI_GEMINI';
    authority?: string;
    examName?: string;
    cadre?: string;
    bundleId?: string;
  }>({});

  const openUniversalIngestion = (config?: {
    type?: IngestionContentType;
    lockType?: boolean;
    initialInputTab?: 'SMART_PASTE' | 'JSON_EDITOR' | 'AI_GEMINI';
    authority?: string;
    examName?: string;
    cadre?: string;
    bundleId?: string;
  }) => {
    setUniversalIngestConfig(config || {});
    setIsUniversalIngestOpen(true);
  };

  // Pre-Flight Exam Instructions State (TCS iON Screen)
  const [preFlightTest, setPreFlightTest] = useState<MockTest | null>(null);

  // Active Exam Session & Review
  const [activeExamTest, setActiveExamTest] = useState<MockTest | null>(null);
  const [activeExamQuestions, setActiveExamQuestions] = useState<Question[]>([]);
  const [activeAttemptReview, setActiveAttemptReview] = useState<TestAttempt | null>(null);
  const [attemptReviewReturnPath, setAttemptReviewReturnPath] = useState<string | null>(null);

  // Helper to deduplicate objects with an 'id' attribute
  function dedupeById<T extends { id: string }>(items: T[]): T[] {
    const seen = new Set<string>();
    const result: T[] = [];
    for (const item of items) {
      if (item && item.id && !seen.has(item.id)) {
        seen.add(item.id);
        result.push(item);
      }
    }
    return result;
  }

  // Resolve the complete question set for a test.
  // Some legacy test documents contain stale/incomplete section.questionIds even
  // though questionCount and the actual question bank contain the full paper.
  function resolveQuestionsForTest(test: MockTest, source: Question[]): Question[] {
    const expected = Math.max(0, Number(test.questionCount || 0));
    const ids = Array.isArray(test.sections)
      ? test.sections.flatMap(section => Array.isArray(section.questionIds) ? section.questionIds : [])
      : [];

    const selectedIds = new Set<string>();
    const selected: Question[] = [];
    const add = (q: Question) => {
      if (q?.id && !selectedIds.has(q.id)) {
        selectedIds.add(q.id);
        selected.push(q);
      }
    };

    ids.forEach(id => {
      const q = source.find(item => item.id === id);
      if (q) add(q);
    });

    if (expected > selected.length) {
      const examName = String(test.examName || '').trim().toLowerCase();
      const authority = String(test.authority || '').trim().toLowerCase();
      const category = String(test.category || '').trim().toLowerCase();

      const exactExam = examName
        ? source.filter(q => String(q.examName || '').trim().toLowerCase() === examName)
        : [];
      exactExam.forEach(add);

      if (expected > selected.length) {
        source
          .filter(q => {
            if (selectedIds.has(q.id)) return false;
            const qAuthority = String(q.authority || '').trim().toLowerCase();
            const qCategory = String(q.category || '').trim().toLowerCase();
            return (authority && qAuthority === authority) || (category && qCategory === category);
          })
          .forEach(add);
      }
    }

    if (expected > selected.length) {
      source.forEach(add);
    }

    // The section question IDs are the canonical paper definition. Never truncate
    // a valid section-defined paper because a stale questionCount says 20/50/100.
    return selected;
  }

  function buildExamTest(test: MockTest, examQuestions: Question[]): MockTest {
    const actualCount = examQuestions.length;
    const existingIds = new Set(
      (test.sections || []).flatMap(section => section.questionIds || [])
    );
    const missingIds = examQuestions
      .map(q => q.id)
      .filter(id => !existingIds.has(id));

    if (missingIds.length === 0) {
      return { ...test, questionCount: actualCount };
    }

    return {
      ...test,
      questionCount: actualCount,
      sections: [
        ...(test.sections || []),
        {
          id: 'sec-' + test.id + '-additional',
          name: 'Additional Questions',
          questionIds: missingIds,
        },
      ],
    };
  }

  // Helper to get deleted IDs set from localStorage
  function getDeletedIds(key: string): Set<string> {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return new Set(parsed);
      }
    } catch {}
    return new Set<string>();
  }

  function addDeletedId(key: string, id: string) {
    try {
      const set = getDeletedIds(key);
      set.add(id);
      localStorage.setItem(key, JSON.stringify(Array.from(set)));
    } catch {}
  }

  function removeDeletedId(key: string, id: string) {
    try {
      const set = getDeletedIds(key);
      if (set.has(id)) {
        set.delete(id);
        localStorage.setItem(key, JSON.stringify(Array.from(set)));
      }
    } catch {}
  }

  // Helper to deduplicate and merge initial items with saved local state (respecting deletions)
  function mergeWithInitial<T extends { id: string }>(initial: T[], saved: T[], deletedKey: string): T[] {
    const deletedSet = getDeletedIds(deletedKey);
    const map = new Map<string, T>();
    // 1. First populate all built-in latest catalog items (skipping deleted)
    initial.forEach(item => {
      if (item && item.id && !deletedSet.has(item.id)) map.set(item.id, item);
    });
    // 2. Add/overlay saved items (skipping deleted)
    saved.forEach(item => {
      if (item && item.id && !deletedSet.has(item.id)) {
        map.set(item.id, item);
      }
    });
    return Array.from(map.values());
  }

  // App Data State (Encapsulated via Headless Domain Hooks)
  const {
    tests,
    setTests,
    syncDefaultCatalog: handleSyncDefaultCatalog,
  } = useTestManager();

  const {
    questions,
    setQuestions,
  } = useQuestionManager();

  const {
    pypPapers,
    setPypPapers,
  } = usePypManager();

  const {
    cmsPages,
    cmsPosts,
    cmsSeriesPacks,
    cmsSettings,
    handleSaveCmsPage,
    handleDeleteCmsPage,
    handleSaveCmsPost,
    handleDeleteCmsPost,
    handleSaveCmsSeriesPack,
    handleDeleteCmsSeriesPack,
    handleSaveCmsSettings,
  } = useCmsManager();

  // Selected slug for dynamic page or post viewing
  const [activePageSlug, setActivePageSlug] = useState<string | null>(null);
  const [activePostSlug, setActivePostSlug] = useState<string | null>(null);

  const [attempts, setAttempts] = useState<TestAttempt[]>([]);

  // Run taxonomy migration on initial mount
  useEffect(() => {
    runTaxonomyMigration(INITIAL_QUESTIONS, INITIAL_ATTEMPTS);

    // Listen for governance events (Test restore, Cascade publish, Data Purge/Restore)
    const handleRestored = (e: any) => {
      if (e.detail && e.detail.id) {
        setTests(prev => dedupeById([e.detail, ...prev]));
      }
    };

    const handleCascadePublish = (e: any) => {
      if (e.detail && Array.isArray(e.detail.affectedTestIds)) {
        const { newPublishStatus, affectedTestIds } = e.detail;
        const targetIds = new Set(affectedTestIds);
        setTests(prev => prev.map(t => targetIds.has(t.id) ? { ...t, isPublished: newPublishStatus } : t));
      }
    };

    const handleTestsUpdated = (e: any) => {
      if (Array.isArray(e.detail)) setTests(e.detail);
    };

    const handleQuestionsUpdated = (e: any) => {
      if (Array.isArray(e.detail)) setQuestions(e.detail.map(migrateLegacyQuestion));
    };

    const handlePypUpdated = (e: any) => {
      if (Array.isArray(e.detail)) setPypPapers(e.detail);
    };

    window.addEventListener('cgssb-test-restored', handleRestored);
    window.addEventListener('cgssb-governance-publish-cascade', handleCascadePublish);
    window.addEventListener('cgssb-tests-updated', handleTestsUpdated);
    window.addEventListener('cgssb-questions-updated', handleQuestionsUpdated);
    window.addEventListener('cgssb-pyp-updated', handlePypUpdated);
    return () => {
      window.removeEventListener('cgssb-test-restored', handleRestored);
      window.removeEventListener('cgssb-governance-publish-cascade', handleCascadePublish);
      window.removeEventListener('cgssb-tests-updated', handleTestsUpdated);
      window.removeEventListener('cgssb-questions-updated', handleQuestionsUpdated);
      window.removeEventListener('cgssb-pyp-updated', handlePypUpdated);
    };
  }, []);


  // Managers own their Firestore subscriptions. Keep App-level startup focused on
  // data that is not already subscribed through a domain manager.
  useEffect(() => {
    // Production invariant: an empty database is valid production state.
    testConnection().catch(() => null);

    // Test Series bundles are maintained separately from the test/question managers.
    syncBundlesFromFirestore().catch(() => null);
  }, []);

  // Hydrate the current student's attempts directly from Firestore.
  // This survives refresh/login and is the source of truth for Re-attempt/View Result.
  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setAttempts([]);
      return;
    }
    fetchMyAttemptsFromFirestore(user.id)
      .then(items => { if (!cancelled) setAttempts(items); })
      .catch(() => { if (!cancelled) setAttempts([]); });
    return () => { cancelled = true; };
  }, [user?.id]);

  // START TEST HANDLER (Routes through TCS iON Pre-Flight Screen)
  const handleStartTest = (test: MockTest) => {
    if (isStudentBlocked) {
      alert(`Account Suspended: ${user?.blockReason || 'Your student account has been suspended by the administrator.'}`);
      return;
    }
    // Guest Policy: 1 Free Test before requiring signup (claims 1-month free pass on signup)
    if (!user) {
      const hasTakenGuestTest = typeof window !== 'undefined' && localStorage.getItem('cgtest_guest_test_completed') === 'true';
      if (hasTakenGuestTest) {
        setAuthModalInitialMode('signup');
        setIsAuthModalOpen(true);
        return;
      }
    }
    // If test is marked as Pro and candidate does not have pass
    if (test.isPro && !isUserPassActive(user)) {
      setStudentActiveTab('pass');
      return;
    }
    setActiveAttemptReview(null);
    setPreFlightTest(test);
  };

  const handleConfirmStartExam = (chosenLanguage: 'hi' | 'en') => {
    if (!preFlightTest) return;

    const examQuestions = resolveQuestionsForTest(preFlightTest, questions);
    if (examQuestions.length === 0) {
      alert('This test has no available questions yet. Please try again after the question bank finishes loading.');
      return;
    }

    // All-access passes are time-based and do not consume per-test credits.
    const examTest = buildExamTest(preFlightTest, examQuestions);
    cacheTestBundleForDevice(examTest, examQuestions);
    setActiveExamQuestions(examQuestions);
    setActiveExamTest(examTest);
    setPreFlightTest(null);
  };

  // PRACTICE PYP AS TEST HANDLER
  const handlePracticePaper = (paper: PreviousYearPaper) => {
    const existingTest = tests.find(t => t.id === paper.linkedMockTestId);
    if (existingTest) {
      handleStartTest(existingTest);
      return;
    }

    const relevantQs = questions.filter(q => q.category === paper.examCategory);
    const pypTest: MockTest = {
      id: `pyp-test-${paper.id}`,
      title: `${paper.title} (Real Exam Simulation)`,
      category: paper.examCategory,
      isPYP: true,
      originType: 'pyq',
      pypYear: paper.year,
      description: `Official past paper simulation. Converted from archived examination ${paper.year}.`,
      durationMinutes: paper.durationMinutes,
      questionCount: relevantQs.length > 0 ? relevantQs.length : paper.totalQuestions,
      marksPerQuestion: paper.examCategory === 'CGPSC' ? 2.0 : 1.0,
      negativeMarksPerQuestion: paper.examCategory === 'CGPSC' ? 0.666 : 0.333,
      sections: [
        {
          id: 'pyp-sec-1',
          name: 'Official Exam Paper',
          questionIds: relevantQs.length > 0 ? relevantQs.map(q => q.id) : questions.map(q => q.id),
        },
      ],
      difficultyDistribution: { easy: 40, medium: 40, hard: 20 },
      attemptsCount: 0,
      createdAt: new Date().toISOString(),
    };

    handleStartTest(pypTest);
  };

  // SUBMIT TEST HANDLER — Firebase-only scoring + persistent attempt storage.
  const handleSubmitTest = async (submission: {
    testId: string;
    timeTakenSeconds: number;
    responses: Record<string, 'A' | 'B' | 'C' | 'D' | null>;
    questionStatuses: Record<string, QuestionPaletteStatus>;
    submissionId: string;
  }): Promise<boolean> => {
    if (!activeExamTest) return false;
    const currentTest = activeExamTest;
    const activeQuestionList = resolveQuestionsForTest(currentTest, questions);
    if (activeQuestionList.length === 0) return false;

    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;
    const subjectMap: Record<string, { total: number; correct: number; incorrect: number; unattempted: number }> = {};

    activeQuestionList.forEach(q => {
      const resp = submission.responses[q.id];
      const cleanSubj = normalizeSubjectName(q.subject, `${q.questionHindi || ''} ${q.questionText || ''}`);
      if (!subjectMap[cleanSubj]) subjectMap[cleanSubj] = { total: 0, correct: 0, incorrect: 0, unattempted: 0 };
      subjectMap[cleanSubj].total += 1;
      if (resp == null) {
        unattemptedCount += 1;
        subjectMap[cleanSubj].unattempted += 1;
      } else if (resp === q.correctOption) {
        correctCount += 1;
        subjectMap[cleanSubj].correct += 1;
      } else {
        incorrectCount += 1;
        subjectMap[cleanSubj].incorrect += 1;
      }
    });

    const marksPerQ = currentTest.marksPerQuestion || 1;
    const negPenaltyPerQ = currentTest.negativeMarksPerQuestion || 0;
    const rawScore = correctCount * marksPerQ;
    const negDeduction = Number((incorrectCount * negPenaltyPerQ).toFixed(2));
    const netScore = Number(Math.max(0, rawScore - negDeduction).toFixed(2));
    const maxScore = activeQuestionList.length * marksPerQ;
    const percentage = maxScore > 0 ? Number(((netScore / maxScore) * 100).toFixed(2)) : 0;
    const attemptedCount = correctCount + incorrectCount;
    const accuracy = attemptedCount > 0 ? Number(((correctCount / attemptedCount) * 100).toFixed(2)) : 0;

    const sectorAnalysis = Object.keys(subjectMap).map(subj => {
      const data = subjectMap[subj];
      const subjMax = data.total * marksPerQ;
      const subjScore = Number(Math.max(0, data.correct * marksPerQ - data.incorrect * negPenaltyPerQ).toFixed(2));
      const subjAtt = data.correct + data.incorrect;
      return {
        subject: subj,
        total: data.total,
        correct: data.correct,
        incorrect: data.incorrect,
        unattempted: data.unattempted,
        accuracy: subjAtt > 0 ? Number(((data.correct / subjAtt) * 100).toFixed(2)) : 0,
        score: subjScore,
        maxScore: subjMax,
      };
    });

    const targetExam = user?.targetExam || currentTest.examName || currentTest.title;
    const authority = String(currentTest.authority || currentTest.category || 'CG').toUpperCase();
    const year = user?.targetYear || 2026;
    const normalizedTarget = String(targetExam).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
    const targetKey = authority + ':' + normalizedTarget + ':' + year;
    const seriesId = currentTest.bundleId || currentTest.id;
    const safeSubmissionId = String(submission.submissionId || '').trim();
    const fallbackSubmissionId = `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const stableSubmissionId = safeSubmissionId || fallbackSubmissionId;
    const attemptId = user?.id
      ? 'att-' + encodeURIComponent(user.id + '-' + currentTest.id + '-' + stableSubmissionId)
      : 'att-guest-' + encodeURIComponent(currentTest.id + '-' + stableSubmissionId);

    const newAttempt: TestAttempt = {
      id: attemptId,
      testId: currentTest.id,
      testTitle: currentTest.title,
      category: currentTest.category,
      userId: user?.id || 'guest',
      userName: user?.name || 'Aspirant Student',
      submittedAt: new Date().toISOString(),
      timeTakenSeconds: submission.timeTakenSeconds,
      totalDurationSeconds: (currentTest.durationMinutes || 90) * 60,
      score: netScore,
      maxScore,
      percentage,
      accuracy,
      correctCount,
      incorrectCount,
      unattemptedCount,
      attemptedCount,
      negativeMarksDeducted: negDeduction,
      responses: submission.responses,
      questionStatuses: submission.questionStatuses,
      markedForReviewCount: Object.values(submission.questionStatuses).filter(s => s === 'marked_for_review' || s === 'answered_and_marked').length,
      sectorAnalysis,
      seriesId,
      targetKey,
      targetExam,
      submissionId: stableSubmissionId,
    };

    let persistedAttempt = newAttempt;
    if (user?.id) {
      try {
        persistedAttempt = await saveAttemptToFirestore(newAttempt);
        const allMineAttempts = [persistedAttempt, ...attempts.filter(a => a.userId === user.id && a.id !== persistedAttempt.id)];
        const profiles = buildLeaderboardProfilesForUser(user, allMineAttempts);
        await saveLeaderboardProfilesToFirestore(profiles);
      } catch (error) {
        console.warn('Attempt persistence failed; keeping exam checkpoint for retry:', error);
        return false;
      }
    }

    setAttempts(prev => [persistedAttempt, ...prev.filter(a => a.id !== persistedAttempt.id)]);
    setActiveExamTest(null);
    setActiveExamQuestions([]);
    setActiveAttemptReview(persistedAttempt);
    clearCachedTestBundle(currentTest.id);

    const milestoneRes = recordTestCompletion();
    if (milestoneRes.unlockedBonus) setShowMilestoneCelebrationModal(true);
    if (!user && typeof window !== 'undefined') localStorage.setItem('cgtest_guest_test_completed', 'true');
    return true;
  };

  // ADMIN QUESTION BANK ACTIONS
  const handleAddQuestion = (qData: Partial<Question>) => {
    const newQ: Question = {
      id: qData.id || `q-cg-${Date.now().toString().slice(-6)}`,
      subject: qData.subject || 'Chhattisgarh Special Knowledge',
      topic: qData.topic || 'General',
      subtopic: qData.subtopic || 'General',
      difficulty: qData.difficulty || 'Medium',
      category: qData.category || 'CGSSB',
      questionText: qData.questionText || '',
      questionHindi: qData.questionHindi || '',
      options: qData.options || [],
      correctOption: qData.correctOption || 'A',
      marks: qData.marks || 1.0,
      negativeMarks: qData.negativeMarks || 0.333,
      explanation: qData.explanation || '',
      explanationHindi: qData.explanationHindi || '',
      pypSource: qData.pypSource || '',
      pypAppearances: qData.pypAppearances || [],
      createdAt: new Date().toISOString().split('T')[0],
    };
    const adminHeaders = () => {
      const token = getAdminToken();
      return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
    };

    removeDeletedId('cgssb_deleted_questions', newQ.id);
    setQuestions(prev => [newQ, ...prev]);
    saveQuestionsToFirestore([newQ]).catch(() => null);
  };

  const handleUpdateQuestion = (id: string, qData: Partial<Question>) => {
    const token = getAdminToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    setQuestions(prev => {
      const updated = prev.map(q => (q.id === id ? { ...q, ...qData } : q));
      const target = updated.find(q => q.id === id);
      if (target) {
        saveQuestionsToFirestore([target]).catch(() => null);
      }
      return updated;
    });
  };

  const handleDeleteQuestion = (id: string) => {
    addDeletedId('cgssb_deleted_questions', id);
    const token = getAdminToken();
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    const updated = questions.filter(q => q.id !== id);
    setQuestions(updated);
    try {
      localStorage.setItem('cgssb_questions', JSON.stringify(updated));
    } catch {}
    deleteQuestionFromFirestore(id).catch(() => null);
  };

  // ADMIN PYP ACTIONS
  const handleAddPYP = (pypData: Partial<PreviousYearPaper>) => {
    const paperId = pypData.id || `pyp-${Date.now()}`;
    const newPaper: PreviousYearPaper = {
      id: paperId,
      title: pypData.title || 'Official Exam Paper',
      examCategory: pypData.examCategory || 'CGSSB',
      year: pypData.year || 2024,
      totalQuestions: pypData.totalQuestions || 100,
      durationMinutes: pypData.durationMinutes || 120,
      marks: pypData.marks || 100,
      negativeMarkingRatio: pypData.negativeMarkingRatio || '1/3rd (0.333)',
      paperSummary: pypData.paperSummary || '',
      subjectsWeightage: pypData.subjectsWeightage || [],
      isOfficialPaper: true,
      downloadFileName: pypData.downloadFileName,
      linkedMockTestId: pypData.linkedMockTestId,
      linkedQuestionIds: pypData.linkedQuestionIds,
    };
    removeDeletedId('cgssb_deleted_pyp', newPaper.id);
    setPypPapers(prev => dedupeById([newPaper, ...prev]));
    savePypPaperToFirestore(newPaper).catch(() => null);
    const token = getAdminToken();
  };

  const handleDeletePYP = (id: string) => {
    addDeletedId('cgssb_deleted_pyp', id);
    const updated = pypPapers.filter(p => p.id !== id);
    setPypPapers(updated);
    try {
      localStorage.setItem('cgssb_pyp', JSON.stringify(updated));
    } catch {}
    deletePypPaperFromFirestore(id).catch(() => null);
    const token = getAdminToken();
  };

  const handleConvertPYPToMockTest = (pyp: PreviousYearPaper) => {
    const testId = pyp.linkedMockTestId || `test-from-${pyp.id}`;
    const newTest: MockTest = {
      id: testId,
      title: `${pyp.title} (Official Mock Test)`,
      category: pyp.examCategory,
      description: `Official past paper simulation. Converted from archived examination ${pyp.year}.`,
      durationMinutes: pyp.durationMinutes,
      questionCount: pyp.totalQuestions,
      marksPerQuestion: pyp.examCategory === 'CGPSC' ? 2.0 : 1.0,
      negativeMarksPerQuestion: pyp.examCategory === 'CGPSC' ? 0.66 : 0.333,
      sections: [
        {
          id: `sec-${pyp.id}`,
          name: 'Official Exam Paper',
          questionIds: questions.filter(q => q.category === pyp.examCategory).map(q => q.id),
        },
      ],
      difficultyDistribution: { easy: 40, medium: 40, hard: 20 },
      attemptsCount: 0,
      createdAt: new Date().toISOString(),
    };

    removeDeletedId('cgssb_deleted_tests', newTest.id);
    setTests(prev => dedupeById([newTest, ...prev]));
    saveTestToFirestore(newTest).catch(() => null);
    const updatedPaper = { ...pyp, linkedMockTestId: newTest.id };
    setPypPapers(prev =>
      prev.map(p => (p.id === pyp.id ? updatedPaper : p))
    );
    savePypPaperToFirestore(updatedPaper).catch(() => null);
    const token = getAdminToken();
  };

  // ADMIN TEST MANAGEMENT ACTIONS
  const handleTogglePublishTest = async (testId: string) => {
    const target = tests.find(t => t.id === testId);
    const nextStatus = target ? target.isPublished === false : false;
    setTests(prev => {
      const updated = prev.map(t => (t.id === testId ? { ...t, isPublished: nextStatus } : t));
      const updatedTarget = updated.find(t => t.id === testId);
      if (updatedTarget) {
        saveTestToFirestore(updatedTarget).catch(() => null);
      }
      return updated;
    });
    try {
      const token = getAdminToken();
    } catch (err) {
      console.warn('Failed to sync publish status with server:', err);
    }
  };

  const handleUpdateTest = async (testId: string, updates: Partial<MockTest>) => {
    let targetTest: MockTest | null = null;
    removeDeletedId('cgssb_deleted_tests', testId);
    setTests(prev => {
      const updated = prev.map(t => (t.id === testId ? { ...t, ...updates } : t));
      targetTest = updated.find(t => t.id === testId) || null;
      if (targetTest) {
        saveTestToFirestore(targetTest).catch(() => null);
      }
      return updated;
    });
    try {
      const token = getAdminToken();
    } catch (err) {
      console.warn('Failed to update test on server:', err);
    }
  };

  const handleDeleteTest = async (testId: string) => {
    addDeletedId('cgssb_deleted_tests', testId);
    const updated = tests.filter(t => t.id !== testId);
    setTests(updated);
    try {
    } catch {}
    cleanTestFromAllBundles(testId);
    deleteTestFromFirestore(testId).catch(() => null);
    try {
      const token = getAdminToken();
    } catch (err) {
      console.warn('Failed to delete test on server:', err);
    }
  };

  const handleAddTest = (newTest: Partial<MockTest>) => {
    const fullTest: MockTest = {
      id: newTest.id || `test-${Date.now()}`,
      title: newTest.title || 'New Mock Test',
      category: newTest.category || 'CGSSB',
      description: newTest.description || '',
      durationMinutes: newTest.durationMinutes || 120,
      questionCount: newTest.questionCount || 100,
      marksPerQuestion: newTest.marksPerQuestion || 1.0,
      negativeMarksPerQuestion: newTest.negativeMarksPerQuestion || 0.333,
      sections: newTest.sections || [{ id: 'sec-1', name: 'General', questionIds: [] }],
      attemptsCount: 0,
      isPublished: newTest.isPublished !== false,
      createdAt: new Date().toISOString(),
    };
    removeDeletedId('cgssb_deleted_tests', fullTest.id);
    setTests(prev => dedupeById([fullTest, ...prev]));
    saveTestToFirestore(fullTest).catch(() => null);
    const token = getAdminToken();
  };

  // ADMIN AI TEST CREATOR PUBLISH ACTION
  const handleTestPublished = (newTest: MockTest, newQuestions: Question[]) => {
    removeDeletedId('cgssb_deleted_tests', newTest.id);
    newQuestions.forEach(q => removeDeletedId('cgssb_deleted_questions', q.id));
    setQuestions(prev => dedupeById([...newQuestions, ...prev]));
    setTests(prev => dedupeById([newTest, ...prev]));
    saveTestToFirestore(newTest).catch(() => null);
    saveQuestionsToFirestore(newQuestions).catch(() => null);
    const token = getAdminToken();
  };

  // UNIFIED BULK QUESTIONS ADDED (Syncs directly to Cloud Firestore & backend)
  const handleBulkQuestionsAdded = (newQs: Question[]) => {
    if (!newQs || newQs.length === 0) return;
    newQs.forEach(q => removeDeletedId('cgssb_deleted_questions', q.id));
    setQuestions(prev => dedupeById([...newQs, ...prev]));
    saveQuestionsToFirestore(newQs).catch(() => null);
    const token = getAdminToken();
  };

  // UNIFIED BULK TESTS ADDED (Syncs directly to Cloud Firestore & backend)
  const handleBulkTestsAdded = (newTests: MockTest[]) => {
    if (!newTests || newTests.length === 0) return;
    newTests.forEach(t => removeDeletedId('cgssb_deleted_tests', t.id));
    setTests(prev => dedupeById([...newTests, ...prev]));
    newTests.forEach(t => {
      saveTestToFirestore(t).catch(() => null);
    });
    const token = getAdminToken();
    newTests.forEach(t => {
    });
  };

  // UNIFIED COMPLETE TEST & QUESTIONS SAVE (Syncs directly to Cloud Firestore & backend)
  const handleSaveCompletedTestAndQuestions = (updatedTest: MockTest, updatedQuestions: Question[]) => {
    handleUpdateTest(updatedTest.id, updatedTest);
    if (updatedQuestions && updatedQuestions.length > 0) {
      setQuestions(prev => {
        const updatedMap = new Map(updatedQuestions.map(q => [q.id, q]));
        const existingIds = new Set(prev.map(q => q.id));
        const newQuestions = updatedQuestions.filter(q => !existingIds.has(q.id));
        const merged = prev.map(q => updatedMap.has(q.id) ? updatedMap.get(q.id)! : q);
        return dedupeById([...newQuestions, ...merged]);
      });
      saveQuestionsToFirestore(updatedQuestions).catch(() => null);
      const token = getAdminToken();
    }
  };

  // MISTAKE RETEST ENGINE HANDLER
  const handleStartMistakeTest = (test: MockTest, mistakeQuestions: Question[]) => {
    if (!test || !mistakeQuestions || mistakeQuestions.length === 0) return;
    setQuestions(prev => dedupeById([...mistakeQuestions, ...prev]));
    setActiveExamTest(test);
  };

  // BOOKMARK PRACTICE HANDLER
  const handleStartBookmarkPractice = (test: MockTest, bookmarkedQuestions: Question[]) => {
    if (!test || !bookmarkedQuestions || bookmarkedQuestions.length === 0) return;
    setQuestions(prev => dedupeById([...bookmarkedQuestions, ...prev]));
    setActiveExamTest(test);
  };

  // RESTORE SNAPSHOT HANDLER
  const handleRestoreSnapshot = (data: { tests: MockTest[]; questions: Question[]; pypPapers: PreviousYearPaper[] }) => {
    if (data.tests) setTests(dedupeById(data.tests));
    if (data.questions) setQuestions(dedupeById(data.questions.map(migrateLegacyQuestion)));
    if (data.pypPapers) setPypPapers(dedupeById(data.pypPapers));
  };

  // LIVE UNRESOLVED MISTAKES COUNT FOR NAVBAR BADGE
  const unresolvedMistakesCount = React.useMemo(() => {
    const qMap = new Map(questions.map(q => [q.id, q]));
    const missedQIds = new Set<string>();
    attempts.forEach(att => {
      Object.entries(att.responses).forEach(([qid, userAns]) => {
        const q = qMap.get(qid);
        if (q && userAns !== q.correctOption) {
          missedQIds.add(qid);
        }
      });
    });
    return missedQIds.size;
  }, [attempts, questions]);

  // =========================================================================
  // VIEW 0: PRE-FLIGHT EXAM INSTRUCTIONS SCREEN (TCS iON CONSOLE)
  // =========================================================================
  if (preFlightTest) {
    return (
      <ExamInstructionsScreen
        test={preFlightTest}
        onStartExam={handleConfirmStartExam}
        onCancel={() => setPreFlightTest(null)}
      />
    );
  }

  // =========================================================================
  // VIEW 1: ACTIVE FULLSCREEN EXAM SESSION
  // =========================================================================
  if (activeExamTest) {
    const resolvedQuestions = activeExamQuestions.length > 0
      ? activeExamQuestions
      : resolveQuestionsForTest(activeExamTest, questions);

    return (
      <ExamEngine
        test={activeExamTest}
        questions={resolvedQuestions}
        onExit={() => {
          setActiveExamTest(null);
          setActiveExamQuestions([]);
        }}
        onSubmit={handleSubmitTest}
      />
    );
  }

  // =========================================================================
  // VIEW 2: ACTIVE ATTEMPT REVIEW SCREEN
  // =========================================================================
  if (activeAttemptReview) {
    const attemptQuestions = questions.filter(q =>
      Object.keys(activeAttemptReview.responses).includes(q.id)
    );
    const resolvedQuestions = attemptQuestions.length > 0 ? attemptQuestions : questions;

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar
          activeTab={studentActiveTab}
          setActiveTab={tab => {
            setActiveAttemptReview(null);
            setStudentActiveTab(tab);
          }}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
        />
        <main className="flex-1">
          <SolutionsScreen
            attempt={activeAttemptReview}
            questions={resolvedQuestions}
            onBackToDashboard={() => {
              const returnPath = attemptReviewReturnPath;
              setActiveAttemptReview(null);
              setAttemptReviewReturnPath(null);
              if (returnPath) {
                window.history.pushState({}, '', returnPath);
                window.dispatchEvent(new PopStateEvent('popstate'));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            onOpenAuthModal={() => {
              setAuthModalInitialMode('signup');
              setIsAuthModalOpen(true);
            }}
            onReattempt={() => {
              const test = tests.find(t => t.id === activeAttemptReview.testId);
              if (test) {
                setActiveAttemptReview(null);
                setAttemptReviewReturnPath(null);
                handleStartTest(test);
              }
            }}
          />
        </main>
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: SEPARATED ADMIN PORTAL (/admin)
  // Accessible at https://darkorange-chimpanzee-661223.hostingersite.com/admin
  // =========================================================================
  if (currentRoute === 'admin') {
    return (
      <React.Suspense fallback={
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-slate-300">Loading Admin Portal OS...</p>
        </div>
      }>
        {/* If not logged in as Admin, show dedicated AdminPortalLogin */}
        {!isAdminAuthenticated ? (
          <AdminPortalLogin
            onSuccess={() => {}}
            onNavigateHome={navigateToStudent}
          />
        ) : (
          // Authenticated Admin Dashboard (FAANG Workspace OS)
          <AdminWorkspaceLayout
            activeTab={adminActiveTab}
            setActiveTab={setAdminActiveTab}
            onNavigateToStudent={navigateToStudent}
            onOpenToolsModal={() => setIsAdminToolsModalOpen(true)}
            onOpenUniversalIngest={() => openUniversalIngestion()}
            onQuickCreateQuestion={() => setAdminActiveTab('admin-questions')}
            onQuickCreateTest={() => setAdminActiveTab('admin-tests')}
          >
            {adminActiveTab === 'admin-overview' && (
              <AdminCMSDashboard
                tests={tests}
                questions={questions}
                pypPapers={pypPapers}
                attempts={attempts}
                onNavigateTab={tab => setAdminActiveTab(tab)}
                onSyncDefaultCatalog={handleSyncDefaultCatalog}
              />
            )}

            {adminActiveTab === 'admin-cms-pages' && (
              <AdminCMSPageBuilder
                pages={cmsPages}
                onSavePage={handleSaveCmsPage}
                onDeletePage={handleDeleteCmsPage}
              />
            )}

            {adminActiveTab === 'admin-cms-posts' && (
              <AdminCMSPostManager
                posts={cmsPosts}
                onSavePost={handleSaveCmsPost}
                onDeletePost={handleDeleteCmsPost}
              />
            )}

            {adminActiveTab === 'admin-cms-customizer' && (
              <AdminCMSThemeCustomizer
                settings={cmsSettings}
                onSaveSettings={handleSaveCmsSettings}
              />
            )}

            {adminActiveTab === 'admin-database' && (
              <AdminDatabaseView
                tests={tests}
                questions={questions}
                pypPapers={pypPapers}
                attempts={attempts}
                onRestoreSnapshot={handleRestoreSnapshot}
                onOpenToolsModal={() => setIsAdminToolsModalOpen(true)}
              />
            )}

            {adminActiveTab === 'admin-cms-series' && (
              <AdminBundleStudio
                availableTests={tests}
                availableQuestions={questions}
                onNavigateToPreview={(bundle) => {
                  setCurrentRoute('student');
                  setStudentActiveTabState('tests');
                  if (typeof window !== 'undefined') {
                    window.history.pushState({ bundleId: bundle.id }, '', `/series/${bundle.slug}`);
                  }
                }}
                onTestsAdded={handleBulkTestsAdded}
                onQuestionsAdded={handleBulkQuestionsAdded}
                onOpenUniversalIngest={openUniversalIngestion}
                onDeleteTest={handleDeleteTest}
                onTogglePublishTest={handleTogglePublishTest}
                onStartTest={handleStartTest}
              />
            )}

            {adminActiveTab === 'admin-pyp' && (
              <AdminPYPManager
                pypPapers={pypPapers}
                tests={tests}
                questions={questions}
                onAddPYP={handleAddPYP}
                onDeletePYP={handleDeletePYP}
                onConvertPYPToMockTest={handleConvertPYPToMockTest}
                onTogglePublishTest={handleTogglePublishTest}
                onStartTest={handleStartTest}
                onQuestionsAdded={handleBulkQuestionsAdded}
                onTestAdded={handleAddTest}
                onUpdateTest={handleUpdateTest}
                onOpenUniversalIngest={openUniversalIngestion}
                onSaveCompletedTest={handleSaveCompletedTestAndQuestions}
              />
            )}

            {adminActiveTab === 'admin-chapters' && (
              <AdminChapterTestManager
                tests={tests}
                questions={questions}
                onAddTest={handleAddTest}
                onUpdateTest={handleUpdateTest}
                onDeleteTest={handleDeleteTest}
                onStartTest={handleStartTest}
                onOpenUniversalIngest={openUniversalIngestion}
              />
            )}

            {adminActiveTab === 'admin-practice' && (
              <AdminPracticeSetManager
                questions={questions}
                onAddQuestion={handleAddQuestion}
                onUpdateQuestion={handleUpdateQuestion}
                onDeleteQuestion={handleDeleteQuestion}
                onOpenUniversalIngest={openUniversalIngestion}
              />
            )}

            {adminActiveTab === 'admin-questions' && (
              <AdminQuestionBank
                questions={questions}
                onAddQuestion={handleAddQuestion}
                onUpdateQuestion={handleUpdateQuestion}
                onDeleteQuestion={handleDeleteQuestion}
                allHierarchyRecords={extractHierarchyFromApp(tests, pypPapers, questions)}
                onAddPYP={handleAddPYP}
                onQuestionsAdded={handleBulkQuestionsAdded}
                onTestAdded={handleAddTest}
              />
            )}

            {adminActiveTab === 'admin-ca-studio' && (
              <AdminCurrentAffairsStudio />
            )}

            {adminActiveTab === 'admin-ai' && (
              <AdminAITestCreator
                pypPapers={pypPapers}
                onTestPublished={handleTestPublished}
                onNavigateToCatalog={() => setAdminActiveTab('admin-tests')}
              />
            )}

            {adminActiveTab === 'admin-tests' && (
              <AdminTestCatalog
                tests={tests}
                questions={questions}
                onStartTest={handleStartTest}
                onTogglePublishTest={handleTogglePublishTest}
                onUpdateTest={handleUpdateTest}
                onDeleteTest={handleDeleteTest}
                onAddTest={handleAddTest}
                onNavigateToAICreator={() => setAdminActiveTab('admin-ai')}
                onAddPYP={handleAddPYP}
                onQuestionsAdded={handleBulkQuestionsAdded}
                onTestAdded={handleAddTest}
                onSaveCompletedTest={handleSaveCompletedTestAndQuestions}
              />
            )}

            {adminActiveTab === 'admin-android-api' && (
              <AdminAndroidAPIManager />
            )}

            {adminActiveTab === 'admin-remote-config' && (
              <AdminRemoteConfigStudio />
            )}

            {adminActiveTab === 'admin-slider' && (
              <AdminSliderStudio />
            )}

            {(adminActiveTab === 'admin-students' || adminActiveTab === 'admin-marketing') && (
              <AdminStudentManagement attempts={attempts} />
            )}

            {adminActiveTab === 'admin-roles' && (
              <AdminRoleManagement />
            )}

            {/* Global Admin Modals */}
            <AdminToolsAndBackupsModal
              isOpen={isAdminToolsModalOpen}
              onClose={() => setIsAdminToolsModalOpen(false)}
              tests={tests}
              questions={questions}
              pypPapers={pypPapers}
              attempts={attempts}
              onRestoreSnapshot={handleRestoreSnapshot}
            />

            <UniversalIngestionStudio
              isOpen={isUniversalIngestOpen}
              onClose={() => setIsUniversalIngestOpen(false)}
              initialType={universalIngestConfig.type || 'MOCK_TEST'}
              lockType={universalIngestConfig.lockType || false}
              initialInputTab={universalIngestConfig.initialInputTab || 'SMART_PASTE'}
              defaultAuthority={universalIngestConfig.authority || 'CGSSB'}
              defaultExamName={universalIngestConfig.examName || 'CG Teacher Recruitment 2026'}
              defaultCadre={universalIngestConfig.cadre || 'Assistant Teacher (Sahayak Shikshak)'}
              defaultBundleId={universalIngestConfig.bundleId || ''}
              onQuestionsIngested={newQs => setQuestions(prev => dedupeById([...newQs, ...prev]))}
              onMockTestCreated={newTest => setTests(prev => dedupeById([newTest, ...prev]))}
              onPypCreated={newPyp => setPypPapers(prev => dedupeById([newPyp, ...prev]))}
            />
          </AdminWorkspaceLayout>
        )}
      </React.Suspense>
    );
  }

  // =========================================================================
  // VIEW 4: MAINTENANCE MODE INTERCEPTOR (SERVER-DRIVEN CONTROL)
  // =========================================================================
  if (isMaintenanceMode) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="p-5 rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-2xl animate-pulse">
          <AlertTriangle className="w-12 h-12" />
        </div>
        <div className="max-w-md space-y-2">
          <h1 className="text-2xl font-black text-white">{config.maintenanceMode?.title || 'System Maintenance'}</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            {config.maintenanceMode?.message || 'We are performing routine server upgrades. The portal will resume shortly.'}
          </p>
          {config.maintenanceMode?.estimatedEndTime && (
            <div className="pt-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-900 border border-slate-800 text-amber-300">
                Estimated Resumption: {config.maintenanceMode.estimatedEndTime}
              </span>
            </div>
          )}
        </div>
        <div className="pt-4 flex items-center space-x-3">
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700 transition cursor-pointer"
          >
            Check Status (Refresh)
          </button>
          <button
            onClick={() => {
              setCurrentRoute('admin');
              if (typeof window !== 'undefined') window.history.pushState({}, '', '/admin');
            }}
            className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer"
          >
            Admin Controller Access
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 5: STUDENT / CANDIDATE PORTAL (/)
  // =========================================================================
  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Dynamic Global Announcement Banner (Server-Controlled) */}
      {config.globalAlertBanner?.enabled && !isBannerDismissed && (
        <div className={`px-4 py-2 text-xs font-bold flex items-center justify-between border-b transition ${
          config.globalAlertBanner.type === 'alert'
            ? 'bg-rose-950/90 text-rose-200 border-rose-800/80'
            : config.globalAlertBanner.type === 'warning'
            ? 'bg-amber-950/90 text-amber-200 border-amber-800/80'
            : config.globalAlertBanner.type === 'success'
            ? 'bg-emerald-950/90 text-emerald-200 border-emerald-800/80'
            : 'bg-indigo-950/90 text-indigo-200 border-indigo-800/80'
        }`}>
          <div className="max-w-7xl mx-auto flex items-center space-x-2.5 flex-1 justify-center">
            <span className="w-2 h-2 rounded-full bg-current animate-ping shrink-0" />
            <span className="truncate">{config.globalAlertBanner.message}</span>
            {config.globalAlertBanner.actionText && (
              <button
                type="button"
                onClick={() => setStudentActiveTab(config.globalAlertBanner.actionLinkTab || 'tests')}
                className="ml-2 px-2.5 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-white font-black text-[11px] underline cursor-pointer transition shrink-0"
              >
                {config.globalAlertBanner.actionText}
              </button>
            )}
          </div>
          {config.globalAlertBanner.isDismissible && (
            <button
              onClick={() => setIsBannerDismissed(true)}
              className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer ml-2 shrink-0"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      <Navbar
        activeTab={studentActiveTab}
        setActiveTab={setStudentActiveTab}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onNavigateToAdmin={navigateToAdmin}
        mistakesCount={unresolvedMistakesCount}
      />

      <main className="flex-1 pb-20 md:pb-8">
        {!selectedSEOQuestion && studentActiveTab === 'student-tests' && (
          <StudentTestsPage
            tests={tests}
            attempts={attempts}
            onStartTest={handleStartTest}
            onReviewAttempt={attempt => {
              setAttemptReviewReturnPath(user ? `/u/${getStudentSlug(user)}/tests/${encodeURIComponent(attempt.testId)}` : null);
              setActiveAttemptReview(attempt);
            }}
            onBrowseSeries={() => setStudentActiveTab('tests')}
            onOpenAuthModal={() => {
              setAuthModalInitialMode('signin');
              setIsAuthModalOpen(true);
            }}
          />
        )}

        {!selectedSEOQuestion && studentActiveTab === 'tests' && (
          <StudentDashboard
            tests={tests}
            onStartTest={handleStartTest}
            onReviewAttempt={attempt => setActiveAttemptReview(attempt)}
            attempts={attempts}
            onSelectCategory={cat => setSelectedCategory(cat)}
            selectedCategory={selectedCategory}
            onExplorePass={() => setStudentActiveTab('pass')}
            onOpenReferral={() => setStudentActiveTab('referral')}
            onOpenLeaderboardPage={() => setStudentActiveTab('leaderboard')}
            onOpenAuthModal={() => {
              setAuthModalInitialMode('signup');
              setIsAuthModalOpen(true);
            }}
            onTogglePublishTest={handleTogglePublishTest}
            onUpdateTest={handleUpdateTest}
            onDeleteTest={handleDeleteTest}
            onAddTest={handleAddTest}
          />
        )}

        {!selectedSEOQuestion && studentActiveTab === 'leaderboard' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={() => setStudentActiveTab('tests')}
                className="inline-flex items-center space-x-2 text-xs sm:text-sm font-bold text-slate-400 hover:text-white transition px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-emerald-400" />
                <span>Back to Dashboard</span>
              </button>

              <div className="flex items-center space-x-2 text-xs font-black text-amber-300 bg-amber-950/40 border border-amber-800/40 px-3.5 py-1.5 rounded-xl">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>CGSSB & CGPSC State Merit Portal</span>
              </div>
            </div>

            <LiveTestLeaderboard
              tests={tests}
              onStartTest={handleStartTest}
              onExplorePass={() => setStudentActiveTab('pass')}
            />
          </div>
        )}

        {/* Dedicated Student Referral & Invite & Earn Page */}
        {!selectedSEOQuestion && studentActiveTab === 'referral' && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={() => setStudentActiveTab('tests')}
                className="inline-flex items-center space-x-2 text-xs sm:text-sm font-bold text-slate-400 hover:text-white transition px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-emerald-400" />
                <span>Back to Dashboard</span>
              </button>

              <div className="flex items-center space-x-2 text-xs font-black text-amber-300 bg-amber-950/40 border border-amber-800/40 px-3.5 py-1.5 rounded-xl">
                <Gift className="w-4 h-4 text-amber-400" />
                <span>Invite & Earn (+1 Mo Free)</span>
              </div>
            </div>

            <StudentReferral
              onOpenAuthModal={() => {
                setAuthModalInitialMode('signup');
                setIsAuthModalOpen(true);
              }}
            />
          </div>
        )}

        {/* Standalone SEO Question Detail Page */}
        {selectedSEOQuestion && (
          <SEOQuestionView
            question={selectedSEOQuestion}
            allTests={tests}
            allPypPapers={pypPapers}
            onBackToDashboard={() => setSelectedSEOQuestion(null)}
            onStartRelatedTest={handleStartTest}
          />
        )}

        {!selectedSEOQuestion && studentActiveTab === 'chapters' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <ChapterTestSection
              tests={tests}
              questions={questions}
              onStartTest={handleStartTest}
              selectedCategory={selectedCategory}
            />
          </div>
        )}

        {!selectedSEOQuestion && studentActiveTab === 'practice' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <PracticeSetSection
              questions={questions}
              onViewQuestionSEO={q => setSelectedSEOQuestion(q)}
              selectedCategory={selectedCategory}
            />
          </div>
        )}

        {!selectedSEOQuestion && studentActiveTab === 'cgpsc' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <CGPSCHeroPage
              tests={tests}
              pypPapers={pypPapers}
              onStartTest={handleStartTest}
              onPracticePYP={handlePracticePaper}
              onExplorePass={() => setStudentActiveTab('pass')}
            />
          </div>
        )}

        {!selectedSEOQuestion && studentActiveTab === 'cgssb' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <CGSSBHeroPage
              tests={tests}
              pypPapers={pypPapers}
              onStartTest={handleStartTest}
              onPracticePYP={handlePracticePaper}
              onExplorePass={() => setStudentActiveTab('pass')}
            />
          </div>
        )}

        {!selectedSEOQuestion && studentActiveTab === 'pass' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <TestPassSection
              onExploreTests={() => setStudentActiveTab('tests')}
            />
          </div>
        )}

        {!selectedSEOQuestion && studentActiveTab === 'pyp' && (
          <PYPSection
            pypPapers={pypPapers}
            onPracticePaper={handlePracticePaper}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onOpenAdminPYP={navigateToAdmin}
          />
        )}

        {!selectedSEOQuestion && studentActiveTab === 'analytics' && (
          <AnalyticsHub
            attempts={attempts}
            onReviewAttempt={attempt => setActiveAttemptReview(attempt)}
            onExploreTests={() => setStudentActiveTab('tests')}
          />
        )}

        {!selectedSEOQuestion && studentActiveTab === 'mistakes' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <MistakeNotebook
              attempts={attempts}
              questions={questions}
              onStartMistakeTest={handleStartMistakeTest}
              onExploreTests={() => setStudentActiveTab('tests')}
            />
          </div>
        )}

        {!selectedSEOQuestion && studentActiveTab === 'bookmarks' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <BookmarksManager
              questions={questions}
              onStartPractice={handleStartBookmarkPractice}
              onExploreTests={() => setStudentActiveTab('tests')}
            />
          </div>
        )}

        {!selectedSEOQuestion && studentActiveTab === 'chhattisgarh-deck' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <ChhattisgarhiRevisionModule />
          </div>
        )}

        {!selectedSEOQuestion && (studentActiveTab === 'page' || activePageSlug) && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
            <button
              onClick={() => {
                setActivePageSlug(null);
                setStudentActiveTab('tests');
              }}
              className="inline-flex items-center space-x-2 text-xs sm:text-sm font-bold text-slate-400 hover:text-white transition px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-400" />
              <span>Back to All Tests</span>
            </button>
            {(() => {
              const targetPage = cmsPages.find(p => p.slug === activePageSlug || p.id === activePageSlug) || cmsPages[0];
              if (!targetPage) {
                return (
                  <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
                    <p className="text-sm font-bold text-slate-300">Page Not Found</p>
                    <p className="text-xs text-slate-500">The requested page does not exist or has been removed.</p>
                  </div>
                );
              }
              return (
                <DynamicPageRenderer
                  page={targetPage}
                  onNavigateToTests={() => {
                    setActivePageSlug(null);
                    setStudentActiveTab('tests');
                  }}
                  siteSettingsTheme={cmsSettings?.pageThemes?.[targetPage.themeArchetype || 'hero_landing']}
                />
              );
            })()}
          </div>
        )}

        {!selectedSEOQuestion && studentActiveTab === 'posts' && (
          <DynamicPostRenderer
            posts={cmsPosts}
            selectedPostSlug={activePostSlug}
            onSelectPost={slug => setActivePostSlug(slug)}
            onBackToList={() => setActivePostSlug(null)}
            siteSettingsTheme={
              activePostSlug
                ? cmsSettings?.postThemes?.[cmsPosts.find(p => p.slug === activePostSlug)?.themeArchetype || 'exam_notification']
                : undefined
            }
          />
        )}
      </main>

      {/* Student Portal Footer with SEO Links */}
      <footer className="bg-slate-900 border-t border-slate-800 py-8 mt-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-6 border-b border-slate-800">
            <div>
              <h4 className="font-extrabold text-white text-xs uppercase tracking-wider mb-2">Exams & Test Series</h4>
              <ul className="space-y-1.5 text-slate-400">
                <li>
                  <button onClick={() => setStudentActiveTab('cgpsc')} className="hover:text-emerald-400 transition text-left">
                    CGPSC State Services (SSE)
                  </button>
                </li>
                <li>
                  <button onClick={() => setStudentActiveTab('cgssb')} className="hover:text-emerald-400 transition text-left">
                    CG Vyapam Hostel Warden
                  </button>
                </li>
                <li>
                  <button onClick={() => setStudentActiveTab('cgssb')} className="hover:text-emerald-400 transition text-left">
                    CG Vyapam Patwari & RI
                  </button>
                </li>
                <li>
                  <button onClick={() => setStudentActiveTab('tests')} className="hover:text-emerald-400 transition text-left">
                    All Full-Length Mock Tests
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-extrabold text-white text-xs uppercase tracking-wider mb-2">Study Material</h4>
              <ul className="space-y-1.5 text-slate-400">
                <li>
                  <button onClick={() => setStudentActiveTab('pyp')} className="hover:text-emerald-400 transition text-left">
                    Official PYP Papers (2012-2024)
                  </button>
                </li>
                <li>
                  <button onClick={() => setStudentActiveTab('pyp')} className="hover:text-emerald-400 transition text-left">
                    Chhattisgarhi Bhasha Grammar
                  </button>
                </li>
                <li>
                  <button onClick={() => setStudentActiveTab('tests')} className="hover:text-emerald-400 transition text-left">
                    Hostel Warden Computer 50 Qs
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-extrabold text-white text-xs uppercase tracking-wider mb-2">Pass & Monetization</h4>
              <ul className="space-y-1.5 text-slate-400">
                <li>
                  <button onClick={() => setStudentActiveTab('pass')} className="hover:text-amber-400 font-bold transition text-left">
                    CG Exam Pass Pro (₹99 / ₹299)
                  </button>
                </li>
                <li>
                  <button onClick={() => setStudentActiveTab('pass')} className="hover:text-amber-400 transition text-left">
                    Yearly Unlimited Access
                  </button>
                </li>
                <li>
                  <button onClick={() => setStudentActiveTab('analytics')} className="hover:text-emerald-400 transition text-left">
                    All-India Rank & Percentile
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-extrabold text-white text-xs uppercase tracking-wider mb-2">Examination Standard</h4>
              <ul className="space-y-1.5 text-slate-400">
                <li className="text-slate-400 font-medium">TCS iON Computer-Based CBT Simulation</li>
                <li className="text-slate-400 font-medium">Bilingual Questions (Hindi & English)</li>
                <li className="text-slate-400 font-medium">Official -1/4 & -1/3 State Negative Marking</li>
              </ul>
            </div>
          </div>

          {/* Non-Government Disclaimer Banner */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
            <span className="font-semibold text-amber-400 block mb-0.5">Official Non-Government Platform Notice:</span>
            cgtest.in is an independent examination preparation and diagnostic mock testing platform for students in Chhattisgarh. It is not affiliated with, sponsored by, or endorsed by the Chhattisgarh Professional Examination Board (CG Vyapam), CGPSC, or any State/Central government agency. All exam names and syllabi are used strictly for descriptive educational preparation purposes.
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-extrabold text-white">
                cgtest<span className="text-emerald-400">.in</span>
              </span>
              <span className="text-slate-600">•</span>
              <span>cgtest.in</span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 font-semibold">Chhattisgarh State Exam Preparation Platform</span>
            </div>

            {/* Legal Safeguard Links */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-slate-400">
              <button
                onClick={() => openLegalModal('privacy')}
                className="hover:text-emerald-400 underline underline-offset-2 transition"
              >
                Privacy Policy
              </button>
              <span className="text-slate-700">•</span>
              <button
                onClick={() => openLegalModal('terms')}
                className="hover:text-emerald-400 underline underline-offset-2 transition"
              >
                Terms of Service
              </button>
              <span className="text-slate-700">•</span>
              <button
                onClick={() => openLegalModal('disclaimer')}
                className="hover:text-amber-400 underline underline-offset-2 transition"
              >
                Disclaimer
              </button>
              <span className="text-slate-700">•</span>
              <button
                onClick={() => openLegalModal('refund')}
                className="hover:text-emerald-400 underline underline-offset-2 transition"
              >
                Refund Policy
              </button>
              <span className="text-slate-700">•</span>
              <button
                onClick={() => openLegalModal('contact')}
                className="hover:text-emerald-400 underline underline-offset-2 transition"
              >
                Candidate Support
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Trust, Safety & Legal Policies Modal */}
      <LegalModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        initialTab={legalTab}
      />

      {/* Student Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalInitialMode}
      />

      {/* 5-Test Milestone Celebration Modal (+2 Months Bonus Unlocked) */}
      <MilestoneCelebrationModal
        isOpen={showMilestoneCelebrationModal}
        onClose={() => setShowMilestoneCelebrationModal(false)}
        onContinuePractice={() => {
          setShowMilestoneCelebrationModal(false);
          setStudentActiveTab('tests');
        }}
        completedCount={user?.completedTestsCount || 5}
      />

      {/* Student Profile & Target Setting Modal */}
      <StudentProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      {/* Admin Central Tools, DB Backups & PDF Generator Modal */}
      <AdminToolsAndBackupsModal
        isOpen={isAdminToolsModalOpen}
        onClose={() => setIsAdminToolsModalOpen(false)}
        tests={tests}
        questions={questions}
        pypPapers={pypPapers}
        attempts={attempts}
        onRestoreSnapshot={handleRestoreSnapshot}
      />

      {/* Universal Ingestion Studio (Universal Master Engine) */}
      <UniversalIngestionStudio
        isOpen={isUniversalIngestOpen}
        onClose={() => setIsUniversalIngestOpen(false)}
        initialType={universalIngestConfig.type || 'MOCK_TEST'}
        lockType={universalIngestConfig.lockType || false}
        defaultAuthority={universalIngestConfig.authority || 'CGSSB'}
        defaultExamName={universalIngestConfig.examName || 'CG Teacher Recruitment 2026'}
        defaultCadre={universalIngestConfig.cadre || 'Assistant Teacher (Sahayak Shikshak)'}
        defaultBundleId={universalIngestConfig.bundleId || ''}
        onQuestionsIngested={newQs => setQuestions(prev => dedupeById([...newQs, ...prev]))}
        onMockTestCreated={newTest => setTests(prev => dedupeById([newTest, ...prev]))}
        onPypCreated={newPyp => setPypPapers(prev => dedupeById([newPyp, ...prev]))}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <MainApp />
      </LanguageProvider>
    </AuthProvider>
  );
}
