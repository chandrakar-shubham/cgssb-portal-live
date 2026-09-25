import React, { useState } from 'react';
import { MockTest, PreviousYearPaper } from '../types';
import { OFFICIAL_BUNDLES_CATALOG, TestSeriesBundle } from '../data/bundleCatalog';
import { BundleCompactCard } from './BundleCompactCard';
import { BundleDetailPage } from './BundleDetailPage';
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  FileText,
  Flame,
  GraduationCap,
  Layers,
  Play,
  Search,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
  Zap
} from 'lucide-react';

interface CGPSCHeroPageProps {
  tests: MockTest[];
  pypPapers: PreviousYearPaper[];
  onStartTest: (test: MockTest) => void;
  onPracticePYP: (paper: PreviousYearPaper) => void;
  onExplorePass: () => void;
}

export const CGPSCHeroPage: React.FC<CGPSCHeroPageProps> = ({
  tests,
  pypPapers,
  onStartTest,
  onPracticePYP,
  onExplorePass,
}) => {
  const [selectedBundle, setSelectedBundle] = useState<TestSeriesBundle | null>(null);
  const [activeTab, setActiveTab] = useState<'bundles' | 'tests' | 'pyp'>('bundles');
  const [searchQuery, setSearchQuery] = useState('');
  const [enrolledBundleIds, setEnrolledBundleIds] = useState<string[]>([]);

  // Filter CGPSC specific bundles
  const cgpscBundles = OFFICIAL_BUNDLES_CATALOG.filter(b => b.authority === 'CGPSC');

  // Filter CGPSC specific tests
  const cgpscTests = tests.filter(
    t => t.category === 'CGPSC' || t.authority?.toUpperCase().includes('CGPSC') || t.title.toUpperCase().includes('CGPSC')
  );

  // Filter CGPSC specific previous year papers
  const cgpscPapers = pypPapers.filter(
    p => p.examCategory === 'CGPSC' || p.authority?.toUpperCase().includes('CGPSC') || p.title.toUpperCase().includes('CGPSC')
  );

  const filteredTests = cgpscTests.filter(t =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEnrollSuccess = (bundleId: string) => {
    setEnrolledBundleIds(prev => [...new Set([...prev, bundleId])]);
  };

  // If a bundle is selected, show its dedicated clutter-free page!
  if (selectedBundle) {
    return (
      <BundleDetailPage
        bundle={selectedBundle}
        availableTests={tests}
        onBack={() => setSelectedBundle(null)}
        onStartTest={onStartTest}
        onExplorePass={onExplorePass}
        isEnrolled={enrolledBundleIds.includes(selectedBundle.id)}
        onEnrollSuccess={handleEnrollSuccess}
      />
    );
  }

  return (
    <div className="space-y-8 pb-12 font-sans selection:bg-rose-500 selection:text-white">
      {/* 1. CGPSC Authority Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-950/70 via-slate-900 to-slate-950 border border-rose-900/40 p-6 sm:p-10 shadow-2xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold">
            <Award className="w-3.5 h-3.5 text-rose-400" />
            <span>छत्तीसगढ़ लोक सेवा आयोग (CGPSC) • State Service Examination 2026</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            CGPSC State Service Exam 2026 <br />
            <span className="bg-gradient-to-r from-rose-400 via-amber-300 to-rose-200 bg-clip-text text-transparent">
              High-Precision Mock Test Series
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
            Prepare with standard <strong>+2 Marks / -0.66 Negative Marking</strong> pattern, bilingual questions in Hindi and English, complete syllabus breakdowns for Paper 1 (GS) & Paper 2 (CSAT), and authentic Previous Year Papers from 2012 to 2024.
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-slate-950/80 p-3 rounded-2xl border border-rose-900/30">
              <span className="text-[11px] text-slate-400 block font-medium">Exam Scheme</span>
              <span className="text-sm font-black text-white">Paper 1 (GS) + Paper 2 (CSAT)</span>
            </div>
            <div className="bg-slate-950/80 p-3 rounded-2xl border border-rose-900/30">
              <span className="text-[11px] text-slate-400 block font-medium">Marking System</span>
              <span className="text-sm font-black text-rose-400">+2.0 / -0.667 (⅓)</span>
            </div>
            <div className="bg-slate-950/80 p-3 rounded-2xl border border-rose-900/30">
              <span className="text-[11px] text-slate-400 block font-medium">Available Mocks</span>
              <span className="text-sm font-black text-white">{cgpscTests.length} Full Tests</span>
            </div>
            <div className="bg-slate-950/80 p-3 rounded-2xl border border-rose-900/30">
              <span className="text-[11px] text-slate-400 block font-medium">Official PYPs</span>
              <span className="text-sm font-black text-amber-300">{cgpscPapers.length} Papers</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Tab Navigation Switcher */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('bundles')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
              activeTab === 'bundles'
                ? 'bg-rose-600 text-white font-black shadow-lg shadow-rose-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Test Series Bundles ({cgpscBundles.length} Batches)</span>
          </button>

          <button
            onClick={() => setActiveTab('tests')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
              activeTab === 'tests'
                ? 'bg-rose-600 text-white font-black shadow-lg shadow-rose-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>All CGPSC Tests ({cgpscTests.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('pyp')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
              activeTab === 'pyp'
                ? 'bg-rose-600 text-white font-black shadow-lg shadow-rose-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Official PYP Bank ({cgpscPapers.length})</span>
          </button>
        </div>

        {activeTab !== 'bundles' && (
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search tests..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 3. CGPSC TEST SERIES BUNDLES SECTION (REQUESTED BY USER)               */}
      {/* ===================================================================== */}
      {activeTab === 'bundles' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold text-rose-400 uppercase tracking-wider">
                <Flame className="w-3.5 h-3.5 fill-rose-400" />
                <span>CGPSC State Service Prelims 2026 Test Bundles</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                Dedicated CGPSC PRE 2026 Portal with Syllabus & Paper 1 + 2 Tests
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Compact bundle card with instant Enroll Now option and clutter-free dedicated syllabus pages.
              </p>
            </div>

            <button
              onClick={onExplorePass}
              className="self-start sm:self-center px-3.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold hover:bg-amber-500/25 transition flex items-center space-x-1.5 cursor-pointer"
            >
              <span>Unlock with CG Exam Pass Pro</span>
            </button>
          </div>

          {/* Compact Bundles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {cgpscBundles.map(bundle => (
              <BundleCompactCard
                key={bundle.id}
                bundle={bundle}
                onOpenBundle={setSelectedBundle}
                onEnrollNow={b => setSelectedBundle(b)}
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

          {/* 3 Pillar feature cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-800/80">
            <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl flex items-start space-x-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Paper 1: General Studies</h4>
                <p className="text-xs text-slate-400 mt-1">
                  50 Qs from Chhattisgarh Special Knowledge (100 Marks) + 50 Qs from General Studies of India (100 Marks).
                </p>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl flex items-start space-x-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Paper 2: CSAT Aptitude</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Qualifying 33% (66 Marks) criteria with Chhattisgarhi language without English translation.
                </p>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl flex items-start space-x-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Exact -0.667 Penalty</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Authentic 1/3rd negative deduction per incorrect question to train risk management.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 4. ALL CGPSC TESTS TAB                                                */}
      {/* ===================================================================== */}
      {activeTab === 'tests' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTests.map(test => (
            <div
              key={test.id}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 hover:border-rose-500/50 transition flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-rose-400 font-bold bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-800/40">
                    CGPSC Prelims
                  </span>
                  <span className="text-slate-400 flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{test.durationMinutes} Mins</span>
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-white line-clamp-2">
                  {test.title}
                </h3>

                <p className="text-xs text-slate-400 line-clamp-2">
                  {test.description}
                </p>

                <div className="flex items-center space-x-3 text-xs text-slate-400 pt-1">
                  <span>{test.questionCount} Questions</span>
                  <span>•</span>
                  <span>{test.marksPerQuestion * test.questionCount} Marks</span>
                  <span>•</span>
                  <span className="text-rose-400">-{test.negativeMarksPerQuestion} Neg</span>
                </div>
              </div>

              <button
                onClick={() => onStartTest(test)}
                className="w-full py-2.5 rounded-xl font-black text-xs bg-rose-600 hover:bg-rose-500 text-white transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-lg shadow-rose-900/40"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Start Mock Test</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ===================================================================== */}
      {/* 5. PYP TAB                                                            */}
      {/* ===================================================================== */}
      {activeTab === 'pyp' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cgpscPapers.map(paper => (
            <div
              key={paper.id}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                  CGPSC SSE {paper.year}
                </span>
                <span className="text-xs text-slate-400">{paper.totalQuestions} Questions</span>
              </div>

              <h4 className="text-base font-bold text-white">
                {paper.title}
              </h4>

              <p className="text-xs text-slate-400">
                {paper.paperSummary || 'Official State Service examination paper with verified key.'}
              </p>

              <button
                onClick={() => onPracticePYP(paper)}
                className="w-full py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 text-amber-400" />
                <span>Practice as CBT Paper</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
