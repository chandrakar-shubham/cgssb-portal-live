import React, { useState, useMemo } from 'react';
import { MockTest, PreviousYearPaper } from '../types';
import { TestSeriesBundle } from '../data/bundleCatalog';
import { getStoredBundles, reconcileAllTestsWithBundles } from '../utils/bundleStore';
import { useAuth } from '../context/AuthContext';
import { CGSSBRecruitmentHub } from './CGSSBRecruitmentHub';
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
  Laptop,
  Play,
  Search,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
  Zap
} from 'lucide-react';

interface CGSSBHeroPageProps {
  tests: MockTest[];
  pypPapers: PreviousYearPaper[];
  onStartTest: (test: MockTest) => void;
  onPracticePYP: (paper: PreviousYearPaper) => void;
  onExplorePass: () => void;
}

export const CGSSBHeroPage: React.FC<CGSSBHeroPageProps> = ({
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
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Filter CGSSB specific bundles
  const allBundles = useMemo(() => reconcileAllTestsWithBundles(tests), [tests]);
  const cgssbBundles = allBundles.filter(
    b => b.authority === 'CGSSB' && (isAdmin || (b.isPublished !== false && !b.isDraft))
  );

  // Filter CGSSB / Vyapam specific tests
  const vyapamTests = tests.filter(
    t => t.category === 'CGSSB' || t.authority?.toUpperCase().includes('VYAPAM') || t.title.toUpperCase().includes('VYAPAM') || t.title.toUpperCase().includes('CGSSB')
  );

  // Filter CGSSB / Vyapam specific previous year papers
  const vyapamPapers = pypPapers.filter(
    p => p.examCategory === 'CGSSB' || p.authority?.toUpperCase().includes('VYAPAM') || p.title.toUpperCase().includes('VYAPAM')
  );

  const filteredTests = vyapamTests.filter(t =>
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
    <div className="space-y-8 pb-12 font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* 1. CGSSB Authority Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-950 border border-emerald-900/40 p-6 sm:p-10 shadow-2xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-teal-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            <span>छत्तीसगढ़ व्यावसायिक परीक्षा मण्डल (CG Vyapam) • 2026 Examination Portals</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            CG Vyapam Official Exam Portals <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 bg-clip-text text-transparent">
              Targeted Test Series Bundles 2026
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
            Choose your target recruitment examination below. Every launched bundle includes <strong>dedicated syllabus breakdowns</strong>, <strong>topic-wise weightage</strong>, and full-length CBT test series with instant bilingual Hindi/English switching.
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-slate-950/80 p-3 rounded-2xl border border-emerald-900/30">
              <span className="text-[11px] text-slate-400 block font-medium">Launched Bundles</span>
              <span className="text-sm font-black text-emerald-400">{cgssbBundles.length} Official Batches</span>
            </div>
            <div className="bg-slate-950/80 p-3 rounded-2xl border border-emerald-900/30">
              <span className="text-[11px] text-slate-400 block font-medium">Marking System</span>
              <span className="text-sm font-black text-white">+1.0 / -0.25 & -0.33</span>
            </div>
            <div className="bg-slate-950/80 p-3 rounded-2xl border border-emerald-900/30">
              <span className="text-[11px] text-slate-400 block font-medium">Available Mocks</span>
              <span className="text-sm font-black text-white">{vyapamTests.length} Tests</span>
            </div>
            <div className="bg-slate-950/80 p-3 rounded-2xl border border-emerald-900/30">
              <span className="text-[11px] text-slate-400 block font-medium">Previous Papers</span>
              <span className="text-sm font-black text-teal-300">{vyapamPapers.length} Solved Papers</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Primary Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('bundles')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
              activeTab === 'bundles'
                ? 'bg-emerald-600 text-slate-950 font-black shadow-lg shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Test Series Bundles ({cgssbBundles.length} Batches)</span>
          </button>

          <button
            onClick={() => setActiveTab('tests')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
              activeTab === 'tests'
                ? 'bg-emerald-600 text-slate-950 font-black shadow-lg shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>All Vyapam Tests ({vyapamTests.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('pyp')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
              activeTab === 'pyp'
                ? 'bg-emerald-600 text-slate-950 font-black shadow-lg shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PYP Bank ({vyapamPapers.length})</span>
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
              className="w-full pl-9 pr-4 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 3. RECRUITMENT-FIRST PREPARATION HUB */}
      {/* ===================================================================== */}
      {activeTab === 'bundles' && (
        <CGSSBRecruitmentHub
          bundles={cgssbBundles}
          tests={tests}
          onStartTest={onStartTest}
          onExplorePass={onExplorePass}
        />
      )}

      {/* ===================================================================== */}
      {/* 4. INDIVIDUAL TESTS TAB                                               */}
      {/* ===================================================================== */}
      {activeTab === 'tests' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTests.map(test => (
            <div
              key={test.id}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 hover:border-emerald-500/50 transition flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/40">
                    {test.authority || 'CG Vyapam'}
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
                </div>
              </div>

              <button
                onClick={() => onStartTest(test)}
                className="w-full py-2.5 rounded-xl font-black text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-slate-950" />
                <span>Start Mock Test</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ===================================================================== */}
      {/* 5. PREVIOUS YEAR PAPERS TAB                                           */}
      {/* ===================================================================== */}
      {activeTab === 'pyp' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vyapamPapers.map(paper => (
            <div
              key={paper.id}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal-400 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-800">
                  Year {paper.year}
                </span>
                <span className="text-xs text-slate-400">{paper.totalQuestions} Questions</span>
              </div>

              <h4 className="text-base font-bold text-white">
                {paper.title}
              </h4>

              <p className="text-xs text-slate-400">
                {paper.paperSummary || 'Official archived question paper with authenticated keys.'}
              </p>

              <button
                onClick={() => onPracticePYP(paper)}
                className="w-full py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 text-teal-400" />
                <span>Practice as CBT Paper</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
