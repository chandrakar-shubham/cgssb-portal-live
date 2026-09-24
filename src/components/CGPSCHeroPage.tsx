import React, { useState } from 'react';
import { MockTest, PreviousYearPaper } from '../types';
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
  const [activeTab, setActiveTab] = useState<'tests' | 'pyp' | 'syllabus'>('tests');
  const [searchQuery, setSearchQuery] = useState('');

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

  return (
    <div className="space-y-8 pb-12 font-sans selection:bg-rose-500 selection:text-white">
      {/* 1. CGPSC Authority Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-950/70 via-slate-900 to-slate-950 border border-rose-900/40 p-6 sm:p-10 shadow-2xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold">
            <Award className="w-3.5 h-3.5 text-rose-400" />
            <span>छत्तीसगढ़ लोक सेवा आयोग (CGPSC) • State Service Exams 2026</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            CGPSC State Service & Forest Exam <br />
            <span className="bg-gradient-to-r from-rose-400 via-amber-300 to-rose-200 bg-clip-text text-transparent">
              High-Precision Mock Test Series
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
            Prepare with standard <strong>+2 Marks / -0.66 Negative Marking</strong> pattern, bilingual questions in Hindi and English, and authentic Previous Year Papers from 2012 to 2024.
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-slate-950/80 p-3 rounded-2xl border border-rose-900/30">
              <span className="text-[11px] text-slate-400 block font-medium">Exam Scheme</span>
              <span className="text-sm font-black text-white">Paper 1 + Paper 2</span>
            </div>
            <div className="bg-slate-950/80 p-3 rounded-2xl border border-rose-900/30">
              <span className="text-[11px] text-slate-400 block font-medium">Marking System</span>
              <span className="text-sm font-black text-rose-400">+2 / -0.66 (⅓)</span>
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

      {/* 2. Notification & High-Yield Blueprint Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-start space-x-3">
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

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-start space-x-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Paper 2: Aptitude & Reasoning</h4>
            <p className="text-xs text-slate-400 mt-1">
              General Hindi, Chhattisgarhi Language grammar, Logical Reasoning, and Data Interpretation. Qualifying nature (33%).
            </p>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-start space-x-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">CG Exam Pass Included</h4>
            <p className="text-xs text-slate-400 mt-1">
              Unlock all full-length mocks, sectional tests, and model answers with our comprehensive test series pass.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Tab Switcher (Mock Tests vs Previous Year Papers vs Syllabus) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('tests')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
              activeTab === 'tests'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>CGPSC Mock Tests ({cgpscTests.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('pyp')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
              activeTab === 'pyp'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Official PYQ Papers ({cgpscPapers.length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search CGPSC tests..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
          />
        </div>
      </div>

      {/* 4. Tab 1: Mock Tests Grid */}
      {activeTab === 'tests' && (
        <div className="space-y-4">
          {filteredTests.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/50 rounded-3xl border border-slate-800 p-8">
              <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No specific CGPSC tests matching criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredTests.map(test => (
                <div
                  key={test.id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-rose-500/50 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4 group transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-black tracking-wide">
                        CGPSC SSE
                      </span>
                      <div className="flex items-center space-x-1 text-slate-400 text-xs">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{test.durationMinutes || 120} Mins</span>
                      </div>
                    </div>

                    <h3 className="text-base font-black text-white group-hover:text-rose-300 transition-colors line-clamp-2">
                      {test.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {test.description || 'Complete bilingual mock test designed according to latest CGPSC Prelims syllabus.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{test.questionCount || 100} Questions</span>
                      <span className="text-rose-400 font-bold">+2 / -0.66</span>
                    </div>

                    <button
                      onClick={() => onStartTest(test)}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-rose-900/20 cursor-pointer active:scale-95 transition"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Start CGPSC Test (TCS iON Mode)</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. Tab 2: PYP Archive */}
      {activeTab === 'pyp' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cgpscPapers.map(paper => (
              <div
                key={paper.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4 group transition"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-black">
                      OFFICIAL PYQ • {paper.year}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{paper.durationMinutes || 120} Min</span>
                  </div>

                  <h3 className="text-base font-black text-white group-hover:text-amber-200 transition">
                    {paper.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {paper.paperSummary || 'Official Question Paper with authentic answer key and subject weightage.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-slate-300">{paper.totalQuestions || 100} Questions</span>
                  <button
                    onClick={() => onPracticePYP(paper)}
                    className="py-2 px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center space-x-1.5 cursor-pointer transition"
                  >
                    <Play className="w-3 h-3 fill-amber-300" />
                    <span>Practice Paper as Test</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
