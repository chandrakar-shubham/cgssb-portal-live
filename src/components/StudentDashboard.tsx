import React, { useState, useEffect, useMemo, useDeferredValue } from 'react';
import { useAuth } from '../context/AuthContext';
import { ExamCategory, MockTest } from '../types';
import { EXAM_PATTERNS } from '../mockData';
import { deduplicateAndConsolidateTests } from '../utils/testDeduplication';
import {
  Clock,
  Award,
  AlertCircle,
  Play,
  CheckCircle2,
  BookOpen,
  Filter,
  Search,
  Zap,
  Info,
  ChevronRight,
  TrendingUp,
  Target,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
  Plus,
  Layers,
  ShieldCheck,
  Check,
  X,
  FolderTree,
  UserCheck,
  LayoutGrid,
  Crown,
  Lock,
  History,
  Trophy
} from 'lucide-react';
import { OFFICIAL_BUNDLES_CATALOG, TestSeriesBundle } from '../data/bundleCatalog';
import { getStoredBundles, findBundleBySlugOrId } from '../utils/bundleStore';
import { BundleCompactCard } from './BundleCompactCard';
import { BundleDetailPage } from './BundleDetailPage';
import { HotSliderAndOffers } from './HotSliderAndOffers';
import { ChangeTargetModal, TARGET_EXAM_OPTIONS, TargetExamOption } from './ChangeTargetModal';
import { LiveTestLeaderboard } from './LiveTestLeaderboard';
import { calculateDaysRemaining, isUserPassActive } from '../utils/devicePassManager';

export type TestSegment = 'ALL' | 'MOCK' | 'PYP' | 'PRO';

interface StudentDashboardProps {
  tests: MockTest[];
  onStartTest: (test: MockTest) => void;
  onSelectCategory: (category: ExamCategory | 'ALL') => void;
  selectedCategory: ExamCategory | 'ALL';
  onExplorePass?: () => void;
  onOpenLeaderboardPage?: () => void;
  onUpdateTest?: (testId: string, updates: Partial<MockTest>) => void;
  onDeleteTest?: (testId: string) => void;
  onTogglePublishTest?: (testId: string) => void;
  onDeduplicateTests?: () => void;
  onAddTest?: (newTest: Partial<MockTest>) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  tests,
  onStartTest,
  onSelectCategory,
  selectedCategory,
  onExplorePass,
  onOpenLeaderboardPage,
  onUpdateTest,
  onDeleteTest,
  onTogglePublishTest,
  onDeduplicateTests,
  onAddTest,
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [displayMode, setDisplayMode] = useState<'nested' | 'grid'>('nested');
  const [adminPublishFilter, setAdminPublishFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [selectedPatternModal, setSelectedPatternModal] = useState<ExamCategory | null>(null);
  const [editingTest, setEditingTest] = useState<MockTest | null>(null);
  const [isCreatingTest, setIsCreatingTest] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [testSegment, setTestSegment] = useState<TestSegment>('ALL');

  // Bundle Portal View & State
  const [bundles, setBundles] = useState<TestSeriesBundle[]>(() => getStoredBundles());
  const [selectedBundle, setSelectedBundle] = useState<TestSeriesBundle | null>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const hash = window.location.hash;
      const seriesMatch = path.match(/\/series\/([a-zA-Z0-9_-]+)/) || hash.match(/#series-([a-zA-Z0-9_-]+)/);
      if (seriesMatch && seriesMatch[1]) {
        const stored = getStoredBundles();
        return findBundleBySlugOrId(seriesMatch[1], stored) || null;
      }
    }
    return null;
  });
  const [portalDisplayMode, setPortalDisplayMode] = useState<'bundles' | 'individual' | 'leaderboard'>('bundles');
  const [bundleAuthorityFilter, setBundleAuthorityFilter] = useState<'ALL' | 'CGSSB' | 'CGPSC'>('ALL');
  const [enrolledBundleIds, setEnrolledBundleIds] = useState<string[]>([]);
  const [leaderboardSelectedTestId, setLeaderboardSelectedTestId] = useState<string>('');

  useEffect(() => {
    setBundles(getStoredBundles());
  }, []);

  const handleOpenBundleDetail = (bundle: TestSeriesBundle) => {
    setSelectedBundle(bundle);
    if (typeof window !== 'undefined') {
      window.history.pushState({ bundleId: bundle.id }, '', `/series/${bundle.slug}`);
    }
  };

  const handleBackFromBundleDetail = () => {
    setSelectedBundle(null);
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', '/test-series');
    }
  };

  // User Target Exam State
  const [userTarget, setUserTarget] = useState<string>(() => {
    return localStorage.getItem('cgssb_user_target') || 'CG Teacher 2026';
  });
  const [isChangeTargetModalOpen, setIsChangeTargetModalOpen] = useState(false);

  const targetSubtitle = useMemo(() => {
    const match = TARGET_EXAM_OPTIONS.find(
      o => o.name.toLowerCase() === userTarget.toLowerCase() || o.id.toLowerCase() === userTarget.toLowerCase()
    );
    return match?.subtitle || 'Full practice suite for CG Teacher Recruitment (All 3 Cadres), CGPSC SSE Prelims & Vyapam exams.';
  }, [userTarget]);

  const handleSelectTarget = (target: TargetExamOption) => {
    setUserTarget(target.name);
    localStorage.setItem('cgssb_user_target', target.name);
    if (target.category && target.category !== 'ALL') {
      onSelectCategory(target.category);
    }
    showToast(`Target exam updated to "${target.name}"!`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const categories: { id: ExamCategory | 'ALL'; label: string; badge?: string }[] = [
    { id: 'ALL', label: 'All Exams' },
    { id: 'TEACHER_RECRUITMENT', label: 'CG शिक्षक भर्ती 2026', badge: 'All 3 Cadres • 150 Qs • -¼' },
    { id: 'CGSSB', label: 'CGSSB / Vyapam', badge: '100 Qs • +1 • -⅓' },
    { id: 'CGPSC', label: 'CGPSC SSE Prelims', badge: '100 Qs • +2 • -⅓' },
    { id: 'SWAMI_ATMANAND', label: 'Swami Atmanand', badge: '100 Qs • +1 • -⅓' },
    { id: 'CENTRAL_EXAMS', label: 'Central (Rail, SSC, Bank)', badge: 'Coming Soon' },
  ];

  // For students: deduplicate automatically and hide drafts
  // For admins: deduplicate or show all tests with draft/published controls
  const processedTests = useMemo(() => {
    return deduplicateAndConsolidateTests(tests);
  }, [tests]);

  // Statistics for Segment Tabs
  const segmentStats = useMemo(() => {
    const listToCount = (isAdmin ? tests : processedTests).filter(t => {
      if (!t || !t.id) return false;
      if (!isAdmin && t.isPublished === false) return false;
      if (selectedCategory !== 'ALL' && t.category !== selectedCategory) return false;
      return true;
    });

    let mockCount = 0;
    let pypCount = 0;
    let proCount = 0;

    listToCount.forEach(t => {
      const isPyp = Boolean(
        t.isPYP ||
        t.originType === 'pyq' ||
        t.pypYear ||
        t.title.toLowerCase().includes('pyp') ||
        t.title.toLowerCase().includes('previous year') ||
        t.title.toLowerCase().includes('official')
      );
      if (isPyp) pypCount++;
      else mockCount++;
      if (t.isPro) proCount++;
    });

    return {
      all: listToCount.length,
      mock: mockCount,
      pyp: pypCount,
      pro: proCount,
    };
  }, [tests, processedTests, isAdmin, selectedCategory]);

  const filteredTests = useMemo(() => {
    const listToFilter = isAdmin ? tests : processedTests;
    const seen = new Set<string>();

    return listToFilter.filter(test => {
      if (!test || !test.id) return false;
      if (seen.has(test.id)) return false;
      seen.add(test.id);

      // Student view: only published tests
      if (!isAdmin && test.isPublished === false) return false;

      // Admin filter
      if (isAdmin) {
        if (adminPublishFilter === 'published' && test.isPublished === false) return false;
        if (adminPublishFilter === 'draft' && test.isPublished !== false) return false;
      }

      const isPyp = Boolean(
        test.isPYP ||
        test.originType === 'pyq' ||
        test.pypYear ||
        test.title.toLowerCase().includes('pyp') ||
        test.title.toLowerCase().includes('previous year') ||
        test.title.toLowerCase().includes('official')
      );

      // Segment filter
      if (testSegment === 'MOCK' && isPyp) return false;
      if (testSegment === 'PYP' && !isPyp) return false;
      if (testSegment === 'PRO' && !test.isPro) return false;

      const testCat = String(test.category || 'CGSSB').toUpperCase().trim();
      const selCat = String(selectedCategory || 'ALL').toUpperCase().trim();
      const matchesCategory =
        selCat === 'ALL' ||
        testCat === selCat ||
        (selCat === 'TEACHER_RECRUITMENT' && (
          testCat.includes('TEACHER') ||
          testCat.includes('SHIKSHAK') ||
          testCat.includes('LECTURER') ||
          testCat.includes('ASST') ||
          (test.subCategory && test.subCategory.toLowerCase().includes('teacher')) ||
          (test.postName && test.postName.toLowerCase().includes('teacher')) ||
          (test.postName && test.postName.toLowerCase().includes('lecturer'))
        )) ||
        (selCat === 'CGPSC' && testCat.includes('PSC')) ||
        (selCat === 'CGSSB' && (testCat.includes('SSB') || testCat.includes('VYAPAM') || testCat.includes('PATWARI') || testCat.includes('WARDEN'))) ||
        (selCat === 'SWAMI_ATMANAND' && (testCat.includes('ATMANAND') || testCat.includes('SAGES'))) ||
        (selCat === 'CENTRAL_EXAMS' && (testCat.includes('CENTRAL') || testCat.includes('SSC') || testCat.includes('RAIL')));
      const s = deferredSearchTerm.toLowerCase().trim();
      const matchesSearch =
        !s ||
        test.title.toLowerCase().includes(s) ||
        test.description.toLowerCase().includes(s);
      return matchesCategory && matchesSearch;
    });
  }, [tests, processedTests, isAdmin, adminPublishFilter, testSegment, selectedCategory, deferredSearchTerm]);

  // Admin stats
  const totalPublishedCount = useMemo(() => {
    return tests.filter(t => t.isPublished !== false).length;
  }, [tests]);

  const totalDraftCount = useMemo(() => {
    return tests.filter(t => t.isPublished === false).length;
  }, [tests]);

  // Card-within-Card Hierarchy Data Types
  // Level 2 (Recruitment Drive / SubCategory) -> Level 3 (Cadre / Post) -> Level 4/5 (Specific Tests)
  interface PostGroup {
    postName: string;
    tests: MockTest[];
  }

  interface DriveGroup {
    authority: string;
    subCategory: string;
    postGroups: PostGroup[];
    totalTests: number;
    vacancies?: string;
  }

  const driveGroups: DriveGroup[] = useMemo(() => {
    const drivesMap = new Map<string, {
      authority: string;
      subCategory: string;
      postsMap: Map<string, MockTest[]>;
    }>();

    filteredTests.forEach(t => {
      let auth = t.authority || '';
      if (!auth) {
        if (t.category === 'CGPSC') auth = 'CGPSC';
        else if (t.category === 'SWAMI_ATMANAND') auth = 'Swami Atmanand';
        else if (t.category === 'CENTRAL_EXAMS') auth = 'Central Exams';
        else auth = 'CGSSB';
      }

      let subCat = t.subCategory || '';
      if (!subCat) {
        const titleLower = t.title.toLowerCase();
        if (titleLower.includes('lecturer') || titleLower.includes('teacher') || titleLower.includes('shikshak')) {
          subCat = 'Teacher Recruitment 2026';
        } else if (titleLower.includes('patwari') || titleLower.includes('revenue') || titleLower.includes('ri')) {
          subCat = 'Patwari & Revenue Inspector (RI)';
        } else if (t.category === 'CGPSC') {
          subCat = 'State Service Examination (Prelims)';
        } else if (t.category === 'SWAMI_ATMANAND') {
          subCat = 'Swami Atmanand Excellence Schools';
        } else {
          subCat = 'General Recruitment 2026';
        }
      }

      let post = t.postName || '';
      if (!post) {
        const titleLower = t.title.toLowerCase();
        if (titleLower.includes('english lecturer') || titleLower.includes('lecturer english')) {
          post = 'CG Lecturer 2026';
        } else if (titleLower.includes('physics lecturer') || titleLower.includes('lecturer physics')) {
          post = 'CG Lecturer 2026';
        } else if (titleLower.includes('lecturer')) {
          post = 'CG Lecturer 2026';
        } else if (titleLower.includes('shikshak') || titleLower.includes('teacher')) {
          post = 'CG Teacher 2026';
        } else if (titleLower.includes('assistant') || titleLower.includes('sahayak')) {
          post = 'CG Assistant Teacher 2026';
        } else if (titleLower.includes('patwari')) {
          post = 'CG Patwari 2024';
        } else if (t.examName) {
          post = t.examName;
        } else {
          post = 'General Cadre';
        }
      }

      const driveKey = `${auth}:::${subCat}`;
      if (!drivesMap.has(driveKey)) {
        drivesMap.set(driveKey, {
          authority: auth,
          subCategory: subCat,
          postsMap: new Map<string, MockTest[]>(),
        });
      }

      const drive = drivesMap.get(driveKey)!;
      if (!drive.postsMap.has(post)) {
        drive.postsMap.set(post, []);
      }
      drive.postsMap.get(post)!.push(t);
    });

    const result: DriveGroup[] = [];
    drivesMap.forEach(d => {
      const postGroups: PostGroup[] = [];
      let totalTests = 0;

      d.postsMap.forEach((testsList, postName) => {
        postGroups.push({ postName, tests: testsList });
        totalTests += testsList.length;
      });

      let vacancies: string | undefined = undefined;
      const lower = d.subCategory.toLowerCase();
      if (lower.includes('teacher')) vacancies = '5,000+ Posts (Vyapam 2026)';
      else if (lower.includes('patwari')) vacancies = '301 Posts';
      else if (lower.includes('state service')) vacancies = '242 Posts';
      else if (lower.includes('police')) vacancies = '975 Posts';

      result.push({
        authority: d.authority,
        subCategory: d.subCategory,
        postGroups,
        totalTests,
        vacancies,
      });
    });

    return result;
  }, [filteredTests]);

  const renderTestCard = (test: MockTest) => {
    const pattern = EXAM_PATTERNS[test.category];
    const isPublished = test.isPublished !== false;
    const isPypTest = Boolean(
      test.isPYP ||
      test.originType === 'pyq' ||
      test.pypYear ||
      test.title.toLowerCase().includes('pyp') ||
      test.title.toLowerCase().includes('previous year') ||
      test.title.toLowerCase().includes('official')
    );

    return (
      <div
        key={test.id}
        className={`bg-slate-900/90 border rounded-2xl p-3 sm:p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-lg hover:shadow-emerald-950/20 group relative ${
          isAdmin && !isPublished
            ? 'border-amber-500/40 bg-slate-900/60'
            : 'border-slate-800 hover:border-emerald-500/40'
        }`}
      >
        {/* ========================================================================= */}
        {/* MOBILE ULTRA-COMPACT VIEW (< sm) - Takes only ~76px, 4-5 tests per screen */}
        {/* ========================================================================= */}
        <div className="sm:hidden flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center space-x-1.5 text-[10px] text-slate-400">
              {isPypTest ? (
                <span className="font-bold text-amber-400 flex items-center space-x-0.5">
                  <History className="w-2.5 h-2.5" />
                  <span>PYP {test.pypYear ? `(${test.pypYear})` : ''}</span>
                </span>
              ) : (
                <span className="font-bold text-indigo-400">Mock</span>
              )}
              <span aria-hidden="true">·</span>
              <span>{test.durationMinutes}m</span>
              <span aria-hidden="true">·</span>
              <span>{test.questionCount} Qs</span>
              <span aria-hidden="true">·</span>
              <span className={test.isPro ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                {test.isPro ? '👑 PRO' : 'FREE'}
              </span>
            </div>

            <h3 className="font-bold text-sm text-white truncate leading-tight group-hover:text-emerald-300 transition-colors">
              {test.title}
            </h3>

            <div className="text-[10px] text-slate-400 flex items-center space-x-1 truncate">
              <span>+{test.marksPerQuestion} / -{test.negativeMarksPerQuestion.toFixed(2)}</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-300 font-semibold">{test.attemptsCount.toLocaleString()} attempts</span>
            </div>
          </div>

          <div className="shrink-0 flex items-center space-x-1.5">
            <button
              type="button"
              onClick={() => {
                setLeaderboardSelectedTestId(test.id);
                setPortalDisplayMode('leaderboard');
              }}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition cursor-pointer"
              title="View Leaderboard & State Ranks"
            >
              <Trophy className="w-3.5 h-3.5" />
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setEditingTest(test)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
                title="Edit test"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
            {test.isPro && !user?.hasProPass && !isAdmin ? (
              <button
                type="button"
                onClick={() => onExplorePass ? onExplorePass() : onStartTest(test)}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs flex items-center space-x-1 shadow-sm active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <Crown className="w-3 h-3 fill-slate-950" />
                <span>Unlock</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onStartTest(test)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center space-x-1 shadow-sm active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <Play className="w-3 h-3 fill-slate-950" />
                <span>Start</span>
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* DESKTOP FULL DETAILED VIEW (sm and above) */}
        {/* ========================================================================= */}
        <div className="hidden sm:block">
          {/* Card Top Category Pill & Questions Count */}
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-950 border border-slate-800 text-emerald-400">
                {test.examName || pattern?.shortName || test.category}
              </span>

              {/* Provenance Badge: Official PYP vs Fresh Mock */}
              {isPypTest ? (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500/15 text-amber-300 border border-amber-500/40 flex items-center space-x-1 shadow-sm">
                  <History className="w-2.5 h-2.5 text-amber-400" />
                  <span>OFFICIAL PYP {test.pypYear ? `(${test.pypYear})` : ''}</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/40 flex items-center space-x-1 shadow-sm">
                  <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
                  <span>FULL MOCK TEST</span>
                </span>
              )}

              {test.isPro ? (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center space-x-1">
                  <Crown className="w-2.5 h-2.5 fill-amber-400" />
                  <span>PRO PASS</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  FREE STARTER
                </span>
              )}
              {/* Admin Status Pill */}
              {isAdmin && (
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center space-x-1 ${
                    isPublished
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isPublished ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  <span>{isPublished ? 'Published' : 'Draft'}</span>
                </span>
              )}
            </div>
            <span className="text-[11px] font-semibold text-slate-400 flex items-center space-x-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{test.durationMinutes} Mins</span>
            </span>
          </div>

          <h3 className="font-bold text-sm sm:text-base text-white group-hover:text-emerald-300 transition-colors leading-snug">
            {test.title}
          </h3>

          {/* Breadcrumb path hint */}
          {(test.postName || test.examName) && (
            <div className="mt-1 text-[11px] font-mono text-slate-400 flex items-center space-x-1 truncate">
              <span className="text-emerald-400/90 font-semibold">{test.postName || test.subCategory}</span>
              <span>&gt;</span>
              <span className="text-slate-300 truncate">{test.examName || test.title}</span>
            </div>
          )}

          <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
            {test.description}
          </p>

          {/* Exam Marking Spec Pill Box */}
          <div className="mt-3.5 bg-slate-950/70 rounded-xl p-2 border border-slate-850 grid grid-cols-3 text-center text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Questions</span>
              <span className="font-bold text-white text-xs">{test.questionCount} Qs</span>
            </div>
            <div className="border-x border-slate-800">
              <span className="text-[10px] text-slate-400 block font-medium">Correct</span>
              <span className="font-bold text-emerald-400 text-xs">+{test.marksPerQuestion}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Negative</span>
              <span className="font-bold text-rose-400 text-xs">
                -{test.negativeMarksPerQuestion.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Section breakdown tags */}
          <div className="mt-2.5 flex flex-wrap gap-1">
            {test.sections.map(sec => (
              <span
                key={sec.id}
                className="px-2 py-0.5 rounded bg-slate-800/70 text-[10px] text-slate-300 font-medium"
              >
                {sec.name}
              </span>
            ))}
          </div>

          {/* Card Footer Actions (Desktop) */}
          <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>
                <span className="text-slate-300 font-semibold">{test.attemptsCount.toLocaleString()}</span> attempted
              </span>

              {/* ADMIN QUICK ACTIONS ROW */}
              {isAdmin ? (
                <div className="flex items-center space-x-1.5">
                  {/* Toggle Publish / Unpublish */}
                  {onTogglePublishTest && (
                    <button
                      type="button"
                      onClick={() => {
                        onTogglePublishTest(test.id);
                        showToast(isPublished ? `Unpublished "${test.title}"` : `Published "${test.title}" to students!`);
                      }}
                      className={`p-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer flex items-center space-x-1 ${
                        isPublished
                          ? 'bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border-slate-700'
                          : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
                      }`}
                      title={isPublished ? 'Unpublish test (hide from students)' : 'Publish test (make visible to students)'}
                    >
                      {isPublished ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span className="text-[10px] hidden sm:inline">{isPublished ? 'Unpublish' : 'Publish'}</span>
                    </button>
                  )}

                  {/* Edit Button */}
                  <button
                    type="button"
                    onClick={() => setEditingTest(test)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs transition cursor-pointer"
                    title="Edit Test Settings"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete Button */}
                  {onDeleteTest && (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(test.id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 text-xs transition cursor-pointer"
                      title="Delete Mock Test"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ) : null}
            </div>

            {/* Primary Action Row: Start Test + View Leaderboard */}
            <div className="flex items-center gap-2">
              {test.isPro && !isUserPassActive(user) && !isAdmin ? (
                <button
                  onClick={() => onExplorePass ? onExplorePass() : onStartTest(test)}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-slate-950 font-black text-xs flex items-center justify-center space-x-1.5 transition shadow-sm active:scale-95 cursor-pointer"
                >
                  <Crown className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Unlock with All-Access Pass</span>
                </button>
              ) : (
                <button
                  onClick={() => onStartTest(test)}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center space-x-1.5 transition shadow-sm active:scale-95 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  <span>{isAdmin ? 'Test Exam Simulation' : test.isPro ? 'Start Pro Test' : 'Start Diagnostic Mock'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setLeaderboardSelectedTestId(test.id);
                  setPortalDisplayMode('leaderboard');
                }}
                className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 border border-slate-700 hover:border-amber-500/40 transition cursor-pointer flex items-center space-x-1.5"
                title="View Live Leaderboard for this test"
              >
                <Trophy className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold hidden sm:inline">Ranks</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // If a bundle is selected, show its dedicated clutter-free page!
  if (selectedBundle) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <BundleDetailPage
          bundle={selectedBundle}
          availableTests={processedTests}
          onBack={handleBackFromBundleDetail}
          onStartTest={onStartTest}
          onExplorePass={onExplorePass || (() => {})}
          isEnrolled={enrolledBundleIds.includes(selectedBundle.id)}
          onEnrollSuccess={(bId) => setEnrolledBundleIds(prev => [...new Set([...prev, bId])])}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-xs shadow-2xl flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ADMIN CONTROL BAR (Only visible to Admin) */}
      {isAdmin && (
        <div className="bg-slate-900 border-2 border-emerald-500/40 rounded-2xl p-4 sm:p-5 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base font-bold text-white">Admin Live Test Catalog</h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Live Control
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Manage published tests, toggle student visibility, eliminate duplicate tests, and edit marking schemes.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Quick Status Stats */}
              <div className="flex items-center space-x-1 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                <span className="text-slate-400">Total:</span>
                <span className="font-bold text-white ml-1">{tests.length}</span>
                <span className="text-slate-600 mx-1.5">•</span>
                <span className="text-emerald-400">Published:</span>
                <span className="font-bold text-emerald-300 ml-1">{totalPublishedCount}</span>
                <span className="text-slate-600 mx-1.5">•</span>
                <span className="text-amber-400">Drafts:</span>
                <span className="font-bold text-amber-300 ml-1">{totalDraftCount}</span>
              </div>

              {/* Deduplicate Action */}
              {onDeduplicateTests && (
                <button
                  type="button"
                  onClick={() => {
                    onDeduplicateTests();
                    showToast('Cleaned duplicate tests and synced catalog!');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                  title="Consolidates duplicate test versions (e.g. Real Exam Simulation vs Official Mock Test)"
                >
                  <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                  <span>Consolidate Duplicates</span>
                </button>
              )}

              {/* Add New Mock Test */}
              <button
                type="button"
                onClick={() => setIsCreatingTest(true)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition flex items-center space-x-1.5 shadow-md cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Mock Test</span>
              </button>
            </div>
          </div>

          {/* Admin Publish Filter Tabs */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center space-x-2 text-xs">
            <span className="text-slate-400 font-semibold mr-1">Status Filter:</span>
            <button
              onClick={() => setAdminPublishFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition ${
                adminPublishFilter === 'all'
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({tests.length})
            </button>
            <button
              onClick={() => setAdminPublishFilter('published')}
              className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center space-x-1 ${
                adminPublishFilter === 'published'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Published Only ({totalPublishedCount})</span>
            </button>
            <button
              onClick={() => setAdminPublishFilter('draft')}
              className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center space-x-1 ${
                adminPublishFilter === 'draft'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-amber-400'
              }`}
            >
              <EyeOff className="w-3 h-3" />
              <span>Drafts / Hidden ({totalDraftCount})</span>
            </button>
          </div>
        </div>
      )}

      {/* Student Profile & Quick Stats Bar (Only shown for non-admin) */}
      {!isAdmin && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-5 shadow-lg relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-base sm:text-xl shadow-inner shrink-0">
                {user?.name ? user.name[0].toUpperCase() : 'A'}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <h1 className="text-sm sm:text-lg font-bold text-white tracking-tight truncate">
                    Welcome back, {user?.name || 'Aspirant'}
                  </h1>
                  <button
                    type="button"
                    onClick={() => setIsChangeTargetModalOpen(true)}
                    className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-xl text-[10px] sm:text-xs font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition group cursor-pointer"
                    title="Click to change your target exam"
                  >
                    <Target className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                    <span>Target: {userTarget}</span>
                    <span className="text-[9px] text-emerald-400 font-mono underline decoration-dotted ml-0.5">Change</span>
                  </button>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 truncate hidden sm:block">
                  {targetSubtitle}
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-3 border-t sm:border-t-0 sm:border-l border-slate-800/80 pt-2 sm:pt-0 sm:pl-4 shrink-0 min-w-0">
              <div className="bg-slate-950/60 rounded-xl p-1.5 sm:p-2.5 border border-slate-800/80 text-center min-w-0">
                <span className="text-[9px] sm:text-[10px] text-slate-400 block font-medium truncate">All-Access Pass</span>
                <span className="text-xs sm:text-sm font-black text-amber-300 flex items-center justify-center space-x-1 mt-0.5 truncate">
                  <Crown className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-400 text-amber-400 shrink-0" />
                  <span className="truncate">
                    {isUserPassActive(user)
                      ? calculateDaysRemaining(user?.passExpiresAt) > 0
                        ? `${calculateDaysRemaining(user?.passExpiresAt)}d Left`
                        : 'Active'
                      : 'Free Tier'}
                  </span>
                </span>
              </div>
              <div className="bg-slate-950/60 rounded-xl p-1.5 sm:p-2.5 border border-slate-800/80 text-center min-w-0">
                <span className="text-[9px] sm:text-[10px] text-slate-400 block font-medium truncate">Practiced</span>
                <span className="text-xs sm:text-sm font-black text-white flex items-center justify-center space-x-1 mt-0.5 truncate">
                  <Target className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-400 shrink-0" />
                  <span>4 Mocks</span>
                </span>
              </div>
              <div className="bg-slate-950/60 rounded-xl p-1.5 sm:p-2.5 border border-slate-800/80 text-center min-w-0">
                <span className="text-[9px] sm:text-[10px] text-slate-400 block font-medium truncate">Accuracy</span>
                <span className="text-xs sm:text-sm font-black text-teal-300 flex items-center justify-center space-x-1 mt-0.5 truncate">
                  <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-teal-400 shrink-0" />
                  <span>88.5%</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Animated Slider for Hot Test Series & Advertisement of Offers */}
      {!isAdmin && (
        <HotSliderAndOffers
          onExplorePass={onExplorePass || (() => {})}
          onOpenBundle={setSelectedBundle}
          onStartTest={onStartTest}
          tests={tests}
          onOpenLeaderboard={testId => {
            if (testId) setLeaderboardSelectedTestId(testId);
            if (onOpenLeaderboardPage) {
              onOpenLeaderboardPage();
            } else {
              setPortalDisplayMode('leaderboard');
            }
          }}
        />
      )}

      {/* Exam Categories Navigation Tabs (Horizontal Scrollable on Mobile with no-scrollbar) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Browse CGSSB and CGPSC Test Series</span>
            </h2>
            <p className="text-xs text-slate-400">
              Browse launched exam bundles with dedicated syllabus and test portals, or practice full-length mock tests.
            </p>
          </div>

          {/* Primary View Toggle: Bundles vs Individual Tests vs Live Leaderboard */}
          <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-2xl border border-slate-800 text-xs self-start sm:self-center overflow-x-auto no-scrollbar touch-scroll max-w-full">
            <button
              type="button"
              onClick={() => setPortalDisplayMode('bundles')}
              className={`px-3 py-1.5 rounded-xl font-black transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer shrink-0 ${
                portalDisplayMode === 'bundles'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Test Series ({bundles.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setPortalDisplayMode('individual')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer shrink-0 ${
                portalDisplayMode === 'individual'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Tests ({segmentStats.all})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (onOpenLeaderboardPage) {
                  onOpenLeaderboardPage();
                } else {
                  setPortalDisplayMode('leaderboard');
                }
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer shrink-0 ${
                portalDisplayMode === 'leaderboard'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-amber-400'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Live Leaderboard</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            </button>
          </div>
        </div>

        {/* LAUNCHED BUNDLES VIEW (Clutter-Free with Dedicated Pages) */}
        {portalDisplayMode === 'bundles' ? (
          <div className="space-y-4">
            <div className="space-y-4 bg-slate-950/60 p-4 sm:p-5 rounded-3xl border border-slate-800/80">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1 text-xs">
                  <span className="text-slate-500 font-semibold mr-1 shrink-0">Filter Authority:</span>
                  <button
                    onClick={() => setBundleAuthorityFilter('ALL')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
                      bundleAuthorityFilter === 'ALL'
                        ? 'bg-slate-800 text-white border border-slate-700'
                        : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800/80'
                    }`}
                  >
                    All Bundles ({bundles.length})
                  </button>
                  <button
                    onClick={() => setBundleAuthorityFilter('CGSSB')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer flex items-center space-x-1.5 ${
                      bundleAuthorityFilter === 'CGSSB'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                        : 'text-slate-400 hover:text-emerald-400 bg-slate-900 border border-slate-800/80'
                    }`}
                  >
                    <span>CGSSB / Vyapam ({bundles.filter(b => b.authority === 'CGSSB').length})</span>
                  </button>
                  <button
                    onClick={() => setBundleAuthorityFilter('CGPSC')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer flex items-center space-x-1.5 ${
                      bundleAuthorityFilter === 'CGPSC'
                        ? 'bg-rose-950 text-rose-300 border border-rose-700'
                        : 'text-slate-400 hover:text-rose-400 bg-slate-900 border border-slate-800/80'
                    }`}
                  >
                    <span>CGPSC SSE ({bundles.filter(b => b.authority === 'CGPSC').length})</span>
                  </button>
                </div>

                <span className="text-[11px] text-slate-400 hidden md:inline">
                  Click any card to view syllabus & included tests
                </span>
              </div>

              {/* Compact Bundles Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bundles.filter(b => bundleAuthorityFilter === 'ALL' || b.authority === bundleAuthorityFilter).map(bundle => (
                  <BundleCompactCard
                    key={bundle.id}
                    bundle={bundle}
                    onOpenBundle={handleOpenBundleDetail}
                    onEnrollNow={handleOpenBundleDetail}
                    onStartFreeTest={b => {
                      const freeItem = b.testItems.find(t => t.isFreePreview) || b.testItems[0];
                      if (freeItem) {
                        const match = tests.find(t => t.id === freeItem.id) || tests[0];
                        if (match) onStartTest(match);
                      }
                    }}
                    hasEnrolled={enrolledBundleIds.includes(bundle.id)}
                  />
                ))}
              </div>
            </div>

            {/* Quick banner to switch to individual tests & leaderboard */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white text-sm">Need individual topic tests or live state ranks?</div>
                  <div className="text-slate-400 text-xs">Search and filter across all {segmentStats.all} mocks, PYQs, or inspect top rankers across Chhattisgarh.</div>
                </div>
              </div>
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenLeaderboardPage) {
                      onOpenLeaderboardPage();
                    } else {
                      setPortalDisplayMode('leaderboard');
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-amber-300 hover:text-amber-200 font-bold border border-slate-700 transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>State Leaderboard</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPortalDisplayMode('individual')}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-emerald-400 hover:text-emerald-300 font-bold border border-slate-700 transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <span>All Tests ({segmentStats.all})</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex overflow-x-auto no-scrollbar touch-scroll gap-1.5 sm:gap-2 pb-1">
              {categories.map(cat => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => onSelectCategory(cat.id as any)}
                    className={`px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 whitespace-nowrap cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    <span>{cat.label}</span>
                    {cat.badge && (
                      <span
                        className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                          isSelected
                            ? 'bg-slate-950/20 text-slate-950'
                            : cat.badge === 'Coming Soon'
                            ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {cat.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Category Pattern Guide Banner */}
            {selectedCategory !== 'ALL' && EXAM_PATTERNS[selectedCategory as ExamCategory] && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
                <div className="flex items-start space-x-2.5">
                  <div className="p-1.5 bg-emerald-500/15 rounded-lg text-emerald-400 mt-0.5 shrink-0">
                    <Info className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 flex-wrap">
                      <span className="font-bold text-white text-xs sm:text-sm">
                        {EXAM_PATTERNS[selectedCategory as ExamCategory].name}
                      </span>
                      <span className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px] text-emerald-300 font-semibold border border-slate-700">
                        Official Pattern
                      </span>
                    </div>
                    <p className="text-slate-300 mt-0.5 leading-relaxed text-xs">
                      {EXAM_PATTERNS[selectedCategory as ExamCategory].description}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPatternModal(selectedCategory as ExamCategory)}
                  className="whitespace-nowrap px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold text-xs transition border border-slate-700 shrink-0 cursor-pointer"
                >
                  Syllabus & Marking
                </button>
              </div>
            )}

            {/* Test Series & PYP Segment Bar (Smooth Horizontal Scroll on Mobile) */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-1.5 flex items-center justify-between text-xs shadow-md overflow-x-auto no-scrollbar touch-scroll max-w-full">
              <div className="flex overflow-x-auto no-scrollbar touch-scroll items-center gap-1.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setTestSegment('ALL')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center space-x-1.5 shrink-0 whitespace-nowrap cursor-pointer ${
                    testSegment === 'ALL'
                      ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span>All Tests</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-700/60 font-mono">{segmentStats.all}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTestSegment('MOCK')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center space-x-1.5 shrink-0 whitespace-nowrap cursor-pointer ${
                    testSegment === 'MOCK'
                      ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50 shadow-sm'
                      : 'text-slate-400 hover:text-indigo-300'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Full Mocks</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-500/30 font-mono">{segmentStats.mock}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTestSegment('PYP')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center space-x-1.5 shrink-0 whitespace-nowrap cursor-pointer ${
                    testSegment === 'PYP'
                      ? 'bg-amber-600/30 text-amber-300 border border-amber-500/50 shadow-sm'
                      : 'text-slate-400 hover:text-amber-300'
                  }`}
                >
                  <History className="w-3.5 h-3.5 text-amber-400" />
                  <span>Official PYP</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-950 text-amber-300 border border-amber-500/30 font-mono">{segmentStats.pyp}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTestSegment('PRO')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center space-x-1.5 shrink-0 whitespace-nowrap cursor-pointer ${
                    testSegment === 'PRO'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                      : 'text-slate-400 hover:text-amber-400'
                  }`}
                >
                  <Crown className="w-3.5 h-3.5 fill-amber-400" />
                  <span>Pass Pro</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950/20 font-mono">{segmentStats.pro}</span>
                </button>
              </div>

              <span className="text-[11px] text-slate-400 font-medium px-2 hidden lg:inline shrink-0">
                Showing {filteredTests.length} tests
              </span>
            </div>

            {/* Search & Filter Header with View Mode Switcher */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search mock tests..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                {/* View Mode Toggle: Nested Card-within-Card vs Grid */}
                <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setDisplayMode('nested')}
                    className={`px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition cursor-pointer ${
                      displayMode === 'nested'
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="View nested by Recruitment Drive and Cadre / Post (Card within Card)"
                  >
                    <FolderTree className="w-3.5 h-3.5" />
                    <span>Hierarchy View (Card-in-Card)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisplayMode('grid')}
                    className={`px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition cursor-pointer ${
                      displayMode === 'grid'
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="View standard flat grid"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Grid View</span>
                  </button>
                </div>

                <div className="text-xs text-slate-400 font-medium hidden sm:block">
                  Showing <span className="text-emerald-400 font-bold">{filteredTests.length}</span> tests
                </div>
              </div>
            </div>

            {/* Empty State */}
            {filteredTests.length === 0 && (
              <div className="text-center py-14 bg-slate-900/60 rounded-3xl border border-slate-800 p-8 space-y-4">
                <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
                <div>
                  <h3 className="text-base font-bold text-white">No mock tests match this filter</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                    {tests.length > 0
                      ? `You have ${tests.length} test${tests.length === 1 ? '' : 's'} in your database, but none match the current filter (${selectedCategory !== 'ALL' ? `Category: ${selectedCategory}, ` : ''}Segment: ${testSegment}${searchTerm ? `, Search: "${searchTerm}"` : ''}).`
                      : 'No mock tests have been uploaded yet. Head to Admin Portal > PYP Manager to upload your tests!'}
                  </p>
                </div>
                {tests.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    {selectedCategory !== 'ALL' && (
                      <button
                        type="button"
                        onClick={() => onSelectCategory('ALL')}
                        className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-sm cursor-pointer"
                      >
                        Show All Exams ({tests.length} Tests)
                      </button>
                    )}
                    {testSegment !== 'ALL' && (
                      <button
                        type="button"
                        onClick={() => setTestSegment('ALL')}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition cursor-pointer"
                      >
                        Reset Segment (View All Types)
                      </button>
                    )}
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm('')}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition cursor-pointer"
                      >
                        Clear Search Term
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* MODE 1: HIERARCHICAL RECRUITMENT VIEW ("Card within Card") */}
            {filteredTests.length > 0 && displayMode === 'nested' && (
              <div className="space-y-4 sm:space-y-6">
                {driveGroups.map(drive => (
                  <div
                    key={`${drive.authority}-${drive.subCategory}`}
                    className="bg-slate-900/90 border border-slate-750 hover:border-slate-700 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-xl space-y-3.5 sm:space-y-5 transition-all"
                  >
                    {/* Outer Card Header: Recruitment Drive (e.g. Teacher Recruitment 2026) */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 sm:pb-4 border-b border-slate-800">
                      <div className="flex items-start sm:items-center space-x-2.5 sm:space-x-3.5">
                        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                          <FolderTree className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                            <span className="text-[10px] sm:text-[11px] font-mono font-bold px-1.5 sm:px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              {drive.authority}
                            </span>
                            <span className="text-slate-500 text-xs">&gt;</span>
                            <h3 className="text-sm sm:text-lg font-black text-white">
                              {drive.subCategory}
                            </h3>
                          </div>
                          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 hidden sm:block">
                            Recruitment series organized with cadre-level mock tests and detailed bilingual solutions.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
                        {drive.vacancies && (
                          <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg sm:rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/25 text-[10px] sm:text-xs font-bold">
                            {drive.vacancies}
                          </span>
                        )}
                        <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg sm:rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 text-[10px] sm:text-xs font-bold">
                          {drive.totalTests} Mocks
                        </span>
                      </div>
                    </div>

                    {/* One Layer Inside: Cadre / Post Cards ("Card within Card") */}
                    <div className="space-y-3 sm:space-y-4">
                      {drive.postGroups.map(postGroup => (
                        <div
                          key={postGroup.postName}
                          className="bg-slate-950/70 border border-slate-800/90 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-md space-y-3 sm:space-y-4 transition-all"
                        >
                          {/* Cadre Inner Card Header */}
                          <div className="flex items-center justify-between pb-2.5 border-b border-slate-855">
                            <div className="flex items-center space-x-2 sm:space-x-2.5">
                              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                                <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </div>
                              <div>
                                <div className="flex items-center space-x-1.5 sm:space-x-2 flex-wrap">
                                  <span className="text-xs sm:text-sm font-bold text-amber-300">
                                    {postGroup.postName}
                                  </span>
                                  <span className="text-[9px] sm:text-[10px] text-slate-400 font-mono">
                                    ({postGroup.tests.length} {postGroup.tests.length === 1 ? 'Paper' : 'Papers'})
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Specific Mock Test Cards inside this Cadre */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
                            {postGroup.tests.map(test => renderTestCard(test))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* MODE 2: STANDARD FLAT GRID VIEW */}
            {filteredTests.length > 0 && displayMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-5">
                {filteredTests.map(test => renderTestCard(test))}
              </div>
            )}
          </div>
        )}

        {/* ===================================================================== */}
        {/* VIEW C: LIVE ALL-CHHATTISGARH TEST LEADERBOARD                         */}
        {/* ===================================================================== */}
        {portalDisplayMode === 'leaderboard' && (
          <LiveTestLeaderboard
            tests={tests}
            initialTestId={leaderboardSelectedTestId || tests[0]?.id}
            onStartTest={onStartTest}
            onExplorePass={onExplorePass}
          />
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3 text-rose-400">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">Delete Mock Test</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently remove this test from the catalog? This will delete the mock test entry and student test listings.
            </p>
            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs hover:bg-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (onDeleteTest && deleteConfirmId) {
                    onDeleteTest(deleteConfirmId);
                    showToast('Mock test deleted successfully.');
                  }
                  setDeleteConfirmId(null);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Create Test Modal */}
      {(editingTest || isCreatingTest) && (
        <EditTestModal
          test={editingTest}
          isOpen={!!(editingTest || isCreatingTest)}
          onClose={() => {
            setEditingTest(null);
            setIsCreatingTest(false);
          }}
          onSave={updates => {
            if (editingTest && onUpdateTest) {
              onUpdateTest(editingTest.id, updates);
              showToast(`Updated "${updates.title || editingTest.title}"`);
            } else if (isCreatingTest && onAddTest) {
              onAddTest(updates);
              showToast(`Created new mock test "${updates.title}"`);
            }
            setEditingTest(null);
            setIsCreatingTest(false);
          }}
        />
      )}

      {/* Central Exams Coming Soon Preview Section */}
      {selectedCategory === 'CENTRAL_EXAMS' && (
        <div className="mt-8 bg-gradient-to-br from-amber-950/30 via-slate-800 to-slate-900 border border-amber-600/40 rounded-2xl p-6 text-center max-w-2xl mx-auto shadow-xl">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3">
            <Award className="w-6 h-6" />
          </div>
          <span className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs font-bold border border-amber-500/40 inline-block mb-2">
            In Active Development
          </span>
          <h3 className="text-lg font-bold text-white">Central Competitive Exams (Railway, SSC, Banking, UPSC)</h3>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            The curriculum setters are indexing previous 10 years question banks for RRB NTPC, SSC CGL Tier 1 & 2, IBPS PO/Clerk, and UPSC CSE Prelims. Full mock test series will launch shortly.
          </p>
          <div className="mt-4 flex justify-center space-x-2">
            <button
              onClick={() => onSelectCategory('CGSSB')}
              className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 transition"
            >
              Practice CGSSB Tests Now
            </button>
          </div>
        </div>
      )}

      {/* Pattern Modal */}
      {selectedPatternModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <span>{EXAM_PATTERNS[selectedPatternModal].name}</span>
              </h3>
              <button
                onClick={() => setSelectedPatternModal(null)}
                className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 bg-slate-800 rounded"
              >
                ✕ Close
              </button>
            </div>
            <div className="space-y-3 text-xs text-slate-300">
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <span className="text-slate-400 block font-bold mb-1">Standard Specifications</span>
                <p>Questions: {EXAM_PATTERNS[selectedPatternModal].totalQuestions} Questions</p>
                <p>Marks per Correct: +{EXAM_PATTERNS[selectedPatternModal].marksPerCorrect}</p>
                <p>Negative Penalty: -{EXAM_PATTERNS[selectedPatternModal].negativeMarksPerWrong} marks</p>
                <p>Duration: {EXAM_PATTERNS[selectedPatternModal].durationMinutes} Minutes</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Target Exam Modal */}
      <ChangeTargetModal
        isOpen={isChangeTargetModalOpen}
        onClose={() => setIsChangeTargetModalOpen(false)}
        currentTargetName={userTarget}
        onSelectTarget={handleSelectTarget}
      />
    </div>
  );
};

interface EditTestModalProps {
  test: MockTest | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<MockTest>) => void;
}

const EditTestModal: React.FC<EditTestModalProps> = ({ test, isOpen, onClose, onSave }) => {
  const [title, setTitle] = useState(test?.title || '');
  const [category, setCategory] = useState<ExamCategory>(test?.category || 'CGSSB');
  const [description, setDescription] = useState(test?.description || '');
  const [durationMinutes, setDurationMinutes] = useState(test?.durationMinutes || 120);
  const [questionCount, setQuestionCount] = useState(test?.questionCount || 100);
  const [marksPerQuestion, setMarksPerQuestion] = useState(test?.marksPerQuestion || 1.0);
  const [negativeMarksPerQuestion, setNegativeMarksPerQuestion] = useState(test?.negativeMarksPerQuestion || 0.333);
  const [isPublished, setIsPublished] = useState(test?.isPublished !== false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Edit3 className="w-4 h-4 text-emerald-400" />
            <span>{test ? 'Edit Mock Test' : 'Create New Mock Test'}</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xs font-bold">
            ✕
          </button>
        </div>

        <form
          onSubmit={e => {
            e.preventDefault();
            onSave({
              title,
              category,
              description,
              durationMinutes: Number(durationMinutes),
              questionCount: Number(questionCount),
              marksPerQuestion: Number(marksPerQuestion),
              negativeMarksPerQuestion: Number(negativeMarksPerQuestion),
              isPublished,
            });
          }}
          className="space-y-3.5 text-xs"
        >
          <div>
            <label className="block text-slate-300 font-bold mb-1">Test Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. CGPSC State Service Prelims Paper-I (General Studies) 2024"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-bold mb-1">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as ExamCategory)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
              >
                <option value="CGSSB">CGSSB / Vyapam</option>
                <option value="CGPSC">CGPSC SSE</option>
                <option value="SWAMI_ATMANAND">Swami Atmanand</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 font-bold mb-1">Duration (Mins)</label>
              <input
                type="number"
                value={durationMinutes}
                onChange={e => setDurationMinutes(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 font-bold mb-1">Questions</label>
              <input
                type="number"
                value={questionCount}
                onChange={e => setQuestionCount(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-bold mb-1">Marks per Q</label>
              <input
                type="number"
                step="0.1"
                value={marksPerQuestion}
                onChange={e => setMarksPerQuestion(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-bold mb-1">Negative Penalty</label>
              <input
                type="number"
                step="0.001"
                value={negativeMarksPerQuestion}
                onChange={e => setNegativeMarksPerQuestion(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
            />
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-white font-bold block">Published Status</span>
              <span className="text-[11px] text-slate-400">
                When enabled, students can see and practice this mock test.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsPublished(!isPublished)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center space-x-1.5 ${
                isPublished
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {isPublished ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
              <span>{isPublished ? 'Published (Live)' : 'Draft (Hidden)'}</span>
            </button>
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

