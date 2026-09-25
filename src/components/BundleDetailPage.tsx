import React, { useState, useMemo } from 'react';
import { TestSeriesBundle, BundleTestItem } from '../data/bundleCatalog';
import { MockTest } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  AlertCircle,
  ArrowLeft,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Crown,
  FileText,
  Flame,
  Globe2,
  HelpCircle,
  Layers,
  Lock,
  Percent,
  Play,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Users,
  Zap,
  Check,
  QrCode,
  Loader2
} from 'lucide-react';
import {
  calculateDaysRemaining,
  isUserPassActive,
  checkDeviceAuthorization
} from '../utils/devicePassManager';

interface BundleDetailPageProps {
  bundle: TestSeriesBundle;
  availableTests: MockTest[];
  onBack: () => void;
  onStartTest: (test: MockTest) => void;
  onExplorePass: () => void;
  isEnrolled?: boolean;
  onEnrollSuccess?: (bundleId: string) => void;
}

export const BundleDetailPage: React.FC<BundleDetailPageProps> = ({
  bundle,
  availableTests,
  onBack,
  onStartTest,
  onExplorePass,
  isEnrolled = false,
  onEnrollSuccess,
}) => {
  const { user, activateProPass } = useAuth();
  const isPassActive = isUserPassActive(user);
  const daysRemaining = calculateDaysRemaining(user?.passExpiresAt);

  const [activeTab, setActiveTab] = useState<'tests' | 'syllabus' | 'pattern' | 'faqs'>('tests');
  const [selectedSyllabusIndex, setSelectedSyllabusIndex] = useState<number | null>(0);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [paymentStep, setPaymentStep] = useState<'plan' | 'qr' | 'processing' | 'success'>('plan');
  const [activeUpiApp, setActiveUpiApp] = useState<'phonepe' | 'gpay' | 'paytm' | 'bhim'>('phonepe');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const isCgpsc = bundle.authority === 'CGPSC';

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Find or synthesize a playable MockTest for a given test item
  const resolvePlayableTest = (item: BundleTestItem): MockTest => {
    const found = availableTests.find(t => t.id === item.id);
    if (found) return found;

    const matchByTitle = availableTests.find(t =>
      t.title.toLowerCase().includes(item.title.toLowerCase()) ||
      (t.category === bundle.authority)
    );

    if (matchByTitle) {
      return {
        ...matchByTitle,
        id: item.id,
        title: item.title,
        durationMinutes: item.durationMinutes || matchByTitle.durationMinutes,
        questionCount: item.questionCount || matchByTitle.questionCount,
      };
    }

    const base = availableTests[0] || {
      id: item.id,
      title: item.title,
      category: bundle.authority,
      durationMinutes: item.durationMinutes || 120,
      questionCount: item.questionCount || 100,
      marksPerQuestion: isCgpsc ? 2.0 : 1.0,
      negativeMarksPerQuestion: isCgpsc ? 0.667 : 0.25,
      sections: [{ id: 'sec-1', name: 'General', questionIds: [] }],
      attemptsCount: item.attemptsCount,
      createdAt: new Date().toISOString(),
    };

    return {
      ...base,
      id: item.id,
      title: item.title,
      durationMinutes: item.durationMinutes,
      questionCount: item.questionCount,
    };
  };

  const handleStartItemTest = (item: BundleTestItem) => {
    if (!item.isFreePreview && !isPassActive) {
      setIsPassModalOpen(true);
      return;
    }
    const testToLaunch = resolvePlayableTest(item);
    onStartTest(testToLaunch);
  };

  const handleSimulatePayment = () => {
    setPaymentStep('processing');
    setTimeout(() => {
      activateProPass(selectedPlan);
      setPaymentStep('success');
      showToast(`🎉 All-Access Pass activated! All tests across all bundles unlocked!`);
      if (onEnrollSuccess) {
        onEnrollSuccess(bundle.id);
      }
    }, 1200);
  };

  const firstFreeItem = bundle.testItems.find(t => t.isFreePreview) || bundle.testItems[0];

  return (
    <div className="space-y-6 pb-16 font-sans text-slate-100 selection:bg-emerald-500 selection:text-slate-950">
      {/* Toast notification */}
      {toastMsg && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 bg-emerald-500 text-slate-950 px-4 py-3 rounded-2xl shadow-2xl font-bold flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Navigation Breadcrumb */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-2 text-xs sm:text-sm font-bold text-slate-400 hover:text-white transition px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-400" />
          <span>Back to All Test Series</span>
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href);
                showToast('Link copied to clipboard!');
              }
            }}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition cursor-pointer flex items-center space-x-1.5 text-xs"
            title="Copy share link"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Share Series</span>
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <section className={`relative overflow-hidden rounded-3xl border p-6 sm:p-8 shadow-2xl ${
        isCgpsc
          ? 'bg-gradient-to-br from-rose-950/80 via-slate-900 to-slate-950 border-rose-900/40'
          : 'bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-950 border-emerald-900/40'
      }`}>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-4 max-w-4xl">
          {/* Tagline & Authority */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-md text-xs font-black uppercase tracking-wider border ${
              isCgpsc ? 'bg-rose-900/50 text-rose-300 border-rose-700/50' : 'bg-emerald-900/50 text-emerald-300 border-emerald-700/50'
            }`}>
              {bundle.authority} Official Blueprint
            </span>
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold text-amber-300 bg-amber-950/50 border border-amber-800/40 flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{bundle.badge}</span>
            </span>
            <span className="text-xs text-slate-400 bg-slate-950/60 px-2.5 py-0.5 rounded-md border border-slate-800">
              Exam Year {bundle.targetYear}
            </span>
          </div>

          {/* Heading */}
          <div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              {bundle.title}
            </h1>
            <p className="text-sm sm:text-base font-medium text-emerald-300/90 mt-1">
              {bundle.titleHindi}
            </p>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
            {bundle.fullDescription}
          </p>

          {/* Key Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block font-medium">Tests in Series</span>
              <span className="text-sm sm:text-base font-black text-white flex items-center space-x-1">
                <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                <span>{bundle.totalTestsCount} Tests</span>
                <span className="text-[10px] text-emerald-400 font-normal">({bundle.freeTestsCount} Free)</span>
              </span>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block font-medium">Medium</span>
              <span className="text-sm sm:text-base font-black text-teal-300 flex items-center space-x-1">
                <Globe2 className="w-3.5 h-3.5 text-teal-400" />
                <span>{bundle.languageDisplay.split(' ')[0]}</span>
              </span>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block font-medium">Enrolled Aspirants</span>
              <span className="text-sm sm:text-base font-black text-white flex items-center space-x-1">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span>{bundle.enrolledStudentsCount.toLocaleString()}+</span>
              </span>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block font-medium">Universal Pass Status</span>
              <span className="text-sm sm:text-base font-black text-amber-300 flex items-center space-x-1">
                <Crown className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{isPassActive ? (daysRemaining > 0 ? `${daysRemaining}d Left` : 'Active') : 'Included in Pass'}</span>
              </span>
            </div>
          </div>

          {/* CTA Action Row - Universal Pass Model */}
          <div className="pt-3 flex flex-wrap items-center gap-3">
            {isPassActive ? (
              <div className="inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-sm font-black shadow-md">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>All-Access Pass Active • All {bundle.totalTestsCount} Tests Unlocked</span>
              </div>
            ) : (
              <button
                onClick={() => setIsPassModalOpen(true)}
                className="px-6 py-3.5 rounded-2xl font-black text-sm bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 shadow-xl shadow-amber-950/50 hover:brightness-110 transition flex items-center space-x-2 cursor-pointer"
              >
                <Crown className="w-4 h-4 fill-slate-950" />
                <span>Unlock with All-Access Pass (From ₹199)</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            )}

            {firstFreeItem && (
              <button
                onClick={() => handleStartItemTest(firstFreeItem)}
                className="px-5 py-3 rounded-2xl font-bold text-sm bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700 hover:border-slate-600 transition flex items-center space-x-2 cursor-pointer"
              >
                <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                <span>Attempt Free Sample Mock (150 Qs)</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('syllabus')}
              className="px-4 py-3 rounded-2xl font-semibold text-xs sm:text-sm text-slate-300 hover:text-white bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition flex items-center space-x-1.5 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-teal-400" />
              <span>View Official Syllabus & Topics</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('tests')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center space-x-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'tests'
              ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800/80'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Tests in Bundle ({bundle.testItems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('syllabus')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center space-x-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'syllabus'
              ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800/80'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Detailed Syllabus ({bundle.syllabusBreakdown.length} Subjects)</span>
        </button>

        <button
          onClick={() => setActiveTab('pattern')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center space-x-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'pattern'
              ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800/80'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Exam Pattern & Marking Rules</span>
        </button>

        <button
          onClick={() => setActiveTab('faqs')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center space-x-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'faqs'
              ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800/80'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>FAQs & Guidance</span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: TESTS IN BUNDLE (Universal Pass Model)                         */}
      {/* ===================================================================== */}
      {activeTab === 'tests' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-900/70 p-3.5 rounded-2xl border border-slate-800">
            <div className="flex items-center space-x-2 text-xs text-slate-300">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                All tests simulate <strong>TCS iON Computer-Based CBT Interface</strong> with bilingual Hindi/English switching and live analysis.
              </span>
            </div>

            {isPassActive ? (
              <span className="text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/30 px-2.5 py-1 rounded-xl shrink-0 font-bold flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>All Tests Unlocked for Practice</span>
              </span>
            ) : (
              <span className="text-xs text-amber-300 bg-amber-950/40 border border-amber-800/30 px-2.5 py-1 rounded-xl shrink-0 font-medium">
                {bundle.freeTestsCount} Free Sample Mocks • All-Access Pass unlocks remainder
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {bundle.testItems.map((item, idx) => {
              const isItemPlayable = item.isFreePreview || isPassActive;

              return (
                <div
                  key={item.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border transition-all ${
                    item.isFreePreview
                      ? 'bg-slate-900/90 border-emerald-900/50 hover:border-emerald-500/60 shadow-md'
                      : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black text-slate-400 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                        Mock #{idx + 1}
                      </span>

                      {item.isFreePreview ? (
                        <span className="text-[11px] font-black text-emerald-300 bg-emerald-950/60 border border-emerald-700/50 px-2 py-0.5 rounded-full flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>FREE SAMPLE</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-amber-300 bg-amber-950/50 border border-amber-800/40 px-2 py-0.5 rounded-full flex items-center space-x-1">
                          <Crown className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>ALL-ACCESS PASS</span>
                        </span>
                      )}

                      <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                        {item.type.replace('_', ' ')}
                      </span>
                    </div>

                    <h4 className="text-base font-extrabold text-white">
                      {item.title}
                    </h4>

                    {item.titleHindi && (
                      <p className="text-xs font-medium text-slate-400">
                        {item.titleHindi}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 pt-1">
                      <span className="flex items-center space-x-1">
                        <BookOpen className="w-3.5 h-3.5 text-teal-400" />
                        <span>{item.questionCount} Questions</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>{item.durationMinutes} Minutes</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Award className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{item.marks} Total Marks</span>
                      </span>
                      <span className="text-slate-500">
                        ({item.attemptsCount.toLocaleString()} attempts)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0 self-start sm:self-center">
                    {isItemPlayable ? (
                      <button
                        onClick={() => handleStartItemTest(item)}
                        className="px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-900/40 transition flex items-center space-x-2 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-slate-950" />
                        <span>Start Test</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsPassModalOpen(true)}
                        className="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 flex items-center space-x-1.5 transition cursor-pointer"
                      >
                        <Crown className="w-3.5 h-3.5 fill-amber-400" />
                        <span>Unlock with Pass</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: DETAILED SYLLABUS & MARKS WEIGHTAGE                            */}
      {/* ===================================================================== */}
      {activeTab === 'syllabus' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 p-5 rounded-3xl border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-black text-white">
                Official Syllabus & Subject-Wise Marks Distribution
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Every mock test in this bundle follows the exact official mark weightage distribution outlined below.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Subject selector list */}
            <div className="space-y-2">
              {bundle.syllabusBreakdown.map((sec, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedSyllabusIndex(idx)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition flex items-center justify-between cursor-pointer ${
                    selectedSyllabusIndex === idx
                      ? 'bg-emerald-500/15 border-emerald-500/50 text-white font-bold shadow-md'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <span className="text-xs font-bold block truncate text-white">{sec.subject}</span>
                    <span className="text-[11px] text-slate-400 block truncate">{sec.subjectHindi}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-emerald-400 block">{sec.marks} Marks</span>
                    <span className="text-[10px] text-slate-500 block">{sec.weightagePercentage}% Weight</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Selected subject detailed topics */}
            <div className="md:col-span-2 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4">
              {selectedSyllabusIndex !== null && bundle.syllabusBreakdown[selectedSyllabusIndex] ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <h4 className="text-base sm:text-lg font-black text-white">
                        {bundle.syllabusBreakdown[selectedSyllabusIndex].subject}
                      </h4>
                      <p className="text-xs text-emerald-400 font-medium">
                        {bundle.syllabusBreakdown[selectedSyllabusIndex].subjectHindi}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                      <span className="text-slate-400">Weightage:</span>
                      <strong className="text-white font-black">
                        {bundle.syllabusBreakdown[selectedSyllabusIndex].marks} Marks ({bundle.syllabusBreakdown[selectedSyllabusIndex].questionCount} Qs)
                      </strong>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <span className="text-xs font-bold text-slate-300 block uppercase tracking-wider">
                      Prescribed Syllabus Topics:
                    </span>
                    <ul className="grid grid-cols-1 gap-2.5">
                      {bundle.syllabusBreakdown[selectedSyllabusIndex].topics.map((topic, tIdx) => (
                        <li
                          key={tIdx}
                          className="flex items-start space-x-2 text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                          <span className="leading-relaxed">{topic}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: EXAM PATTERN & MARKING SCHEME                                  */}
      {/* ===================================================================== */}
      {activeTab === 'pattern' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-1">
              <span className="text-xs font-semibold text-slate-400 block">Total Questions</span>
              <span className="text-xl font-black text-white">{bundle.examPattern.totalQuestions} Questions</span>
              <p className="text-[11px] text-slate-500">All multiple-choice single correct</p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-1">
              <span className="text-xs font-semibold text-slate-400 block">Maximum Marks</span>
              <span className="text-xl font-black text-emerald-400">{bundle.examPattern.totalMarks} Marks</span>
              <p className="text-[11px] text-slate-500">{bundle.examPattern.markingScheme}</p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-1">
              <span className="text-xs font-semibold text-slate-400 block">Total Duration</span>
              <span className="text-xl font-black text-amber-300">{bundle.examPattern.durationMinutes} Minutes</span>
              <p className="text-[11px] text-slate-500">Live countdown with auto-submit</p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-1">
              <span className="text-xs font-semibold text-slate-400 block">Negative Marking</span>
              <span className="text-xl font-black text-rose-400">{bundle.examPattern.negativeMarkPenalty.split(' ')[0]}</span>
              <p className="text-[11px] text-slate-500">Deducted for incorrect response</p>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-4">
            <h4 className="text-base font-black text-white flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Official Examination Blueprint Guidelines</span>
            </h4>

            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
              {bundle.examPattern.keyRules.map((rule, idx) => (
                <li key={idx} className="flex items-start space-x-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: FAQS & CANDIDATE GUIDANCE                                      */}
      {/* ===================================================================== */}
      {activeTab === 'faqs' && (
        <div className="space-y-4">
          {bundle.faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-2"
            >
              <h4 className="text-sm sm:text-base font-extrabold text-white flex items-center space-x-2">
                <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{faq.question}</span>
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 pl-6 leading-relaxed">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ===================================================================== */}
      {/* UNIVERSAL ALL-ACCESS PASS ACTIVATION MODAL                            */}
      {/* ===================================================================== */}
      {isPassModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => {
                setIsPassModalOpen(false);
                setPaymentStep('plan');
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
            >
              ✕
            </button>

            {/* Header */}
            <div>
              <div className="flex items-center space-x-2 text-xs font-semibold text-amber-400 mb-1">
                <Crown className="w-4 h-4 fill-amber-400" />
                <span>Unified All-Access Pass</span>
              </div>
              <h3 className="text-xl font-black text-white">
                Unlock {bundle.title} & ALL Other Exams
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                One pass unlocks this test series plus all CG Teacher, CGPSC, and CG Vyapam bundles.
              </p>
            </div>

            {/* Step: Plan Selection */}
            {paymentStep === 'plan' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Monthly Pass */}
                  <div
                    onClick={() => setSelectedPlan('monthly')}
                    className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between space-y-2 ${
                      selectedPlan === 'monthly'
                        ? 'bg-slate-800/90 border-amber-500 shadow-md'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-black text-sm text-white">Monthly Pass</span>
                      <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded font-bold">30 Days</span>
                    </div>
                    <div className="flex items-baseline space-x-1.5">
                      <span className="text-2xl font-black text-white">₹199</span>
                      <span className="text-xs text-slate-500 line-through">₹299</span>
                    </div>
                    <span className="text-[11px] text-slate-400">Ideal for 30-day revision</span>
                  </div>

                  {/* Yearly Pass */}
                  <div
                    onClick={() => setSelectedPlan('yearly')}
                    className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between space-y-2 relative overflow-hidden ${
                      selectedPlan === 'yearly'
                        ? 'bg-gradient-to-b from-slate-800 via-amber-950/30 to-slate-800 border-amber-500 shadow-lg'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="absolute -top-1 -right-6 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-[9px] px-6 py-0.5 rotate-12 uppercase">
                      50% OFF
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="font-black text-sm text-white">Yearly Pass</span>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold">365 Days</span>
                    </div>
                    <div className="flex items-baseline space-x-1.5">
                      <span className="text-2xl font-black text-white">₹599</span>
                      <span className="text-xs text-slate-500 line-through">₹1199</span>
                    </div>
                    <span className="text-[11px] text-amber-300 font-semibold">Best Value (~₹1.6/day)</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs text-slate-300">
                  <div className="flex items-center space-x-2 font-bold text-white">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>One Device, One Pass Security Included</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Unlocks all {bundle.totalTestsCount} tests in this series + all other 42+ full mock series on this device.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setPaymentStep('qr')}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:brightness-110 text-slate-950 font-black text-sm shadow-xl transition cursor-pointer flex items-center justify-center space-x-2"
                >
                  <span>Proceed to Pay ₹{selectedPlan === 'monthly' ? 199 : 599} via UPI</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Step: UPI QR */}
            {paymentStep === 'qr' && (
              <div className="space-y-4">
                <div className="p-4 bg-white rounded-2xl flex flex-col items-center justify-center space-y-2 shadow-inner">
                  <div className="w-40 h-40 bg-slate-100 rounded-xl border border-slate-300 flex flex-col items-center justify-center relative p-2">
                    <QrCode className="w-32 h-32 text-slate-900" />
                    <span className="text-[9px] font-mono text-slate-600 bg-white px-1.5 rounded border border-slate-200 absolute bottom-1">
                      UPI ID: cgssbtest@upi
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-800 text-center">
                    Pay ₹{selectedPlan === 'monthly' ? 199 : 599} for {selectedPlan === 'monthly' ? '30 Days' : '365 Days'}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setActiveUpiApp('phonepe')}
                    className={`p-2 rounded-xl border transition cursor-pointer ${
                      activeUpiApp === 'phonepe' ? 'bg-purple-600/20 border-purple-500 text-purple-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    PhonePe
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveUpiApp('gpay')}
                    className={`p-2 rounded-xl border transition cursor-pointer ${
                      activeUpiApp === 'gpay' ? 'bg-blue-600/20 border-blue-500 text-blue-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Google Pay
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveUpiApp('paytm')}
                    className={`p-2 rounded-xl border transition cursor-pointer ${
                      activeUpiApp === 'paytm' ? 'bg-cyan-600/20 border-cyan-500 text-cyan-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Paytm
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveUpiApp('bhim')}
                    className={`p-2 rounded-xl border transition cursor-pointer ${
                      activeUpiApp === 'bhim' ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    BHIM UPI
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleSimulatePayment}
                  className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm transition flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>I Have Paid ₹{selectedPlan === 'monthly' ? 199 : 599} • Activate Now</span>
                </button>
              </div>
            )}

            {/* Step: Processing */}
            {paymentStep === 'processing' && (
              <div className="py-8 flex flex-col items-center justify-center space-y-3 text-center">
                <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
                <h4 className="font-bold text-white text-sm">
                  Verifying UPI Payment & Unlocking All Bundles...
                </h4>
              </div>
            )}

            {/* Step: Success */}
            {paymentStep === 'success' && (
              <div className="py-6 flex flex-col items-center justify-center space-y-3 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <h4 className="font-black text-white text-lg">
                  All-Access Pass Activated!
                </h4>
                <p className="text-xs text-slate-300 max-w-xs">
                  All {bundle.totalTestsCount} tests in {bundle.title} and all other series are completely unlocked for {selectedPlan === 'monthly' ? '30 days' : '365 days'}.
                </p>
                <div className="pt-3 w-full">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPassModalOpen(false);
                      setPaymentStep('plan');
                    }}
                    className="w-full py-3 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs transition cursor-pointer shadow-lg shadow-emerald-500/20"
                  >
                    Start Practicing Now
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};
