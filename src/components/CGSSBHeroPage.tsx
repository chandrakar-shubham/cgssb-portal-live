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
  const [activeTab, setActiveTab] = useState<'tests' | 'pyp'>('tests');
  const [searchQuery, setSearchQuery] = useState('');

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

  return (
    <div className="space-y-8 pb-12 font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* 1. CGSSB Authority Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-950 border border-emerald-900/40 p-6 sm:p-10 shadow-2xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-teal-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            <span>छत्तीसगढ़ व्यावसायिक परीक्षा मण्डल (CG Vyapam) • Recruitment Exams</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            CG Vyapam Hostel Warden, Patwari & RI <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 bg-clip-text text-transparent">
              Dedicated Test Series Portal
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
            Targeted practice for <strong>Hostel Superintendent, Revenue Inspector, Patwari, Sub-Engineer, and Assistant Teacher</strong> with mandatory qualifying Computer criteria, Chhattisgarhi language, and 1/3 negative marking.
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-slate-950/80 p-3 rounded-2xl border border-emerald-900/30">
              <span className="text-[11px] text-slate-400 block font-medium">Top Post Target</span>
              <span className="text-sm font-black text-white">Hostel Warden & RI</span>
            </div>
            <div className="bg-slate-950/80 p-3 rounded-2xl border border-emerald-900/30">
              <span className="text-[11px] text-slate-400 block font-medium">Marking System</span>
              <span className="text-sm font-black text-emerald-400">+1.0 / -0.33 (⅓)</span>
            </div>
            <div className="bg-slate-950/80 p-3 rounded-2xl border border-emerald-900/30">
              <span className="text-[11px] text-slate-400 block font-medium">Available Mocks</span>
              <span className="text-sm font-black text-white">{vyapamTests.length} Tests</span>
            </div>
            <div className="bg-slate-950/80 p-3 rounded-2xl border border-emerald-900/30">
              <span className="text-[11px] text-slate-400 block font-medium">Previous Papers</span>
              <span className="text-sm font-black text-teal-300">{vyapamPapers.length} Papers</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Vyapam Unique Exam Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-start space-x-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
            <Laptop className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Computer 50 Marks Mandatory</h4>
            <p className="text-xs text-slate-400 mt-1">
              For Hostel Warden exams, scoring 50% (25 Marks) in Computer knowledge is compulsory to have the rest evaluated.
            </p>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-start space-x-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">छत्तीसगढ़ी हाना, जनउला व मुहावरे</h4>
            <p className="text-xs text-slate-400 mt-1">
              High-yield focus on Chhattisgarhi grammar, vocabulary, idioms, and folk proverbs frequently repeated by Vyapam.
            </p>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-start space-x-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Instant TCS iON Simulator</h4>
            <p className="text-xs text-slate-400 mt-1">
              Realistic candidate pre-flight screen with bilingual toggling and live question palette tracking.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Tab Switcher */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('tests')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
              activeTab === 'tests'
                ? 'bg-emerald-600 text-slate-950 font-black shadow-lg shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Vyapam Mock Tests ({vyapamTests.length})</span>
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
            <span>Official Papers ({vyapamPapers.length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search Vyapam exams..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* 4. Tab 1: Mock Tests Grid */}
      {activeTab === 'tests' && (
        <div className="space-y-4">
          {filteredTests.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/50 rounded-3xl border border-slate-800 p-8">
              <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No specific Vyapam tests matching search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredTests.map(test => (
                <div
                  key={test.id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4 group transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black tracking-wide">
                        CG VYAPAM
                      </span>
                      <div className="flex items-center space-x-1 text-slate-400 text-xs">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{test.durationMinutes || 90} Mins</span>
                      </div>
                    </div>

                    <h3 className="text-base font-black text-white group-hover:text-emerald-300 transition-colors line-clamp-2">
                      {test.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {test.description || 'Full-length syllabus-aligned mock test for upcoming CG Vyapam recruitment examinations.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{test.questionCount || 100} Questions</span>
                      <span className="text-emerald-400 font-bold">+1 / -0.33</span>
                    </div>

                    <button
                      onClick={() => onStartTest(test)}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-95 transition"
                    >
                      <Play className="w-3.5 h-3.5 fill-slate-950" />
                      <span>Start Vyapam Test (TCS iON Mode)</span>
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
            {vyapamPapers.map(paper => (
              <div
                key={paper.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-teal-500/40 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4 group transition"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-300 border border-teal-500/20 text-[10px] font-black">
                      VYAPAM OFFICIAL • {paper.year}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{paper.durationMinutes || 90} Min</span>
                  </div>

                  <h3 className="text-base font-black text-white group-hover:text-teal-200 transition">
                    {paper.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {paper.paperSummary || 'Authentic Vyapam paper with verified answers and subject weightage.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-slate-300">{paper.totalQuestions || 100} Questions</span>
                  <button
                    onClick={() => onPracticePYP(paper)}
                    className="py-2 px-4 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 font-bold text-xs flex items-center space-x-1.5 cursor-pointer transition"
                  >
                    <Play className="w-3 h-3 fill-teal-300" />
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
