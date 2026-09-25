import React, { useState } from 'react';
import { MockTest } from '../types';
import {
  GraduationCap,
  Award,
  Clock,
  Sparkles,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Crown,
  ChevronRight,
  Flame,
  Shield,
  Layers,
  HelpCircle,
  FileText,
  Target
} from 'lucide-react';

interface HotExamsCadreShowcaseProps {
  onStartTest: (test: MockTest) => void;
  onExplorePass: () => void;
  availableTests: MockTest[];
}

export const HotExamsCadreShowcase: React.FC<HotExamsCadreShowcaseProps> = ({
  onStartTest,
  onExplorePass,
  availableTests,
}) => {
  // Main Exam Filter
  const [activeExamType, setActiveExamType] = useState<'TEACHER' | 'CGPSC' | 'UPCOMING'>('TEACHER');

  // Teacher Recruitment Cadre Switcher
  const [selectedCadre, setSelectedCadre] = useState<'asst_teacher' | 'teacher' | 'lecturer'>('asst_teacher');

  // Selected Subject for Class 6-8 Teacher
  const [selectedTeacherSubject, setSelectedTeacherSubject] = useState<string>('maths_science');

  // Selected Subject for Class 9-12 Lecturer
  const [selectedLecturerSubject, setSelectedLecturerSubject] = useState<string>('physics');

  // Collapsible syllabus breakdown state (saves mobile scroll height)
  const [showSyllabusMatrix, setShowSyllabusMatrix] = useState(false);

  // Teacher Subjects configuration (Class 6 to 8)
  const teacherSubjects = [
    { id: 'maths_science', name: 'गणित एवं विज्ञान (Maths & Science)', icon: '📐', totalMocks: 12, questions: 150, freeSample: true },
    { id: 'english', name: 'अंग्रेजी शिक्षक (English Teacher)', icon: '📖', totalMocks: 10, questions: 150, freeSample: true },
    { id: 'sanskrit', name: 'संस्कृत शिक्षक (Sanskrit Teacher)', icon: '🪔', totalMocks: 10, questions: 150, freeSample: true },
    { id: 'social_science', name: 'सामाजिक अध्ययन (Social Science)', icon: '🏛️', totalMocks: 12, questions: 150, freeSample: true },
    { id: 'hindi', name: 'हिंदी शिक्षक (Hindi Teacher)', icon: '🇮🇳', totalMocks: 10, questions: 150, freeSample: true },
  ];

  // Lecturer Subjects configuration (Class 9 to 12)
  const lecturerSubjects = [
    { id: 'physics', name: 'भौतिकी व्याख्याता (Physics)', icon: '⚡', totalMocks: 10, questions: 150, freeSample: true },
    { id: 'chemistry', name: 'रसायन व्याख्याता (Chemistry)', icon: '🧪', totalMocks: 10, questions: 150, freeSample: true },
    { id: 'mathematics', name: 'गणित व्याख्याता (Mathematics)', icon: '📐', totalMocks: 12, questions: 150, freeSample: true },
    { id: 'biology', name: 'जीव विज्ञान व्याख्याता (Biology)', icon: '🧬', totalMocks: 10, questions: 150, freeSample: true },
    { id: 'commerce', name: 'वाणिज्य एवं अर्थशास्त्र (Commerce & Econ)', icon: '📚', totalMocks: 10, questions: 150, freeSample: true },
    { id: 'history_polity', name: 'इतिहास एवं राजनीति (History & Polity)', icon: '📜', totalMocks: 10, questions: 150, freeSample: true },
    { id: 'english_pg', name: 'अंग्रेजी व्याख्याता (English PG)', icon: '📖', totalMocks: 10, questions: 150, freeSample: true },
  ];

  // Quick helper to find a matching test or fallback to the first available test
  const handleLaunchSample = (titleMatch: string, fallbackTitle: string) => {
    const match = availableTests.find(t => 
      t.title.toLowerCase().includes(titleMatch.toLowerCase()) || 
      (t.subCategory && t.subCategory.toLowerCase().includes(titleMatch.toLowerCase()))
    ) || availableTests[0];

    if (match) {
      onStartTest({
        ...match,
        title: match.title || fallbackTitle,
      });
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6">
      
      {/* 1. Header with Hot Exam Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800/90">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-amber-400 mb-1">
            <Flame className="w-4 h-4 fill-amber-400" />
            <span className="uppercase tracking-wider">High-Yield Exam Portals 2026</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-400">Authentic Vyapam & PSC Patterns</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Targeted Test Series Bundles
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Choose your exact cadre, post, or exam specialization. Each series includes realistic CBT simulations, authentic bilingual questions, and state-wide percentile rankings.
          </p>
        </div>

        {/* Exam Category Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800 shrink-0 self-start md:self-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveExamType('TEACHER')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
              activeExamType === 'TEACHER'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>CG शिक्षक भर्ती 2026</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveExamType('CGPSC')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
              activeExamType === 'CGPSC'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>CGPSC Prelims 2026</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveExamType('UPCOMING')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
              activeExamType === 'UPCOMING'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>आगामी 6 माह (Next 6 Mo)</span>
          </button>
        </div>
      </div>

      {/* 2. SECTION A: CG TEACHER RECRUITMENT 2026 (All 3 Cadres) */}
      {activeExamType === 'TEACHER' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Cadre Navigation: Mobile Segmented Bar vs Desktop 3-Card Grid */}
          <div>
            <div className="text-xs font-bold text-slate-400 mb-2.5 flex items-center justify-between">
              <span>चुनिए अपना संवर्ग (Select Cadre):</span>
              <span className="text-[11px] text-amber-400 font-semibold hidden sm:inline">All 3 Cadres in Super Pass</span>
            </div>

            {/* Mobile Compact Cadre Segmented Strip (< md) */}
            <div className="md:hidden grid grid-cols-3 gap-1.5 p-1 bg-slate-950/90 rounded-2xl border border-slate-800 shadow-inner">
              <button
                type="button"
                onClick={() => setSelectedCadre('asst_teacher')}
                className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedCadre === 'asst_teacher'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <div className="text-[10px] opacity-75 leading-tight">Class 1-5</div>
                <div className="truncate">सहायक शिक्षक</div>
              </button>
              <button
                type="button"
                onClick={() => setSelectedCadre('teacher')}
                className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedCadre === 'teacher'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <div className="text-[10px] opacity-75 leading-tight">Class 6-8</div>
                <div className="truncate">शिक्षक (5 Subj)</div>
              </button>
              <button
                type="button"
                onClick={() => setSelectedCadre('lecturer')}
                className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedCadre === 'lecturer'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <div className="text-[10px] opacity-75 leading-tight">Class 9-12</div>
                <div className="truncate">व्याख्याता (PG)</div>
              </button>
            </div>

            {/* Desktop Full Cadre Cards (md and up) */}
            <div className="hidden md:grid md:grid-cols-3 gap-3">
              {/* Cadre 1: Assistant Teacher */}
              <button
                type="button"
                onClick={() => setSelectedCadre('asst_teacher')}
                className={`p-4 rounded-2xl text-left border transition cursor-pointer relative ${
                  selectedCadre === 'asst_teacher'
                    ? 'bg-amber-500/10 border-amber-500/70 text-white ring-1 ring-amber-500/40'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-950'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
                    1-5
                  </div>
                  <span className="text-[10px] font-mono text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-md">
                    E & T Cadre
                  </span>
                </div>
                <h3 className="font-bold text-sm sm:text-base text-white">
                  सहायक शिक्षक (Assistant Teacher)
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  कक्षा 1 से 5 अध्यापन • 150 प्रश्न (बाल विकास, गणित, पर्यावरण, हिंदी, अंग्रेजी, कंप्यूटर, सामान्य ज्ञान).
                </p>
                <div className="mt-3 flex items-center text-[11px] font-semibold text-slate-400 space-x-2">
                  <span className="text-emerald-400 font-bold">1 Free Diagnostic</span>
                  <span aria-hidden="true">·</span>
                  <span>15 Full Mocks</span>
                  <span aria-hidden="true">·</span>
                  <span>Official PYPs</span>
                </div>
              </button>

              {/* Cadre 2: Teacher (Subject Specific) */}
              <button
                type="button"
                onClick={() => setSelectedCadre('teacher')}
                className={`p-4 rounded-2xl text-left border transition cursor-pointer relative ${
                  selectedCadre === 'teacher'
                    ? 'bg-amber-500/10 border-amber-500/70 text-white ring-1 ring-amber-500/40'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-950'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
                    6-8
                  </div>
                  <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/15 px-2 py-0.5 rounded-md">
                    विषयवार (Subject-Wise)
                  </span>
                </div>
                <h3 className="font-bold text-sm sm:text-base text-white">
                  शिक्षक (Teacher Class 6-8)
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  कक्षा 6 से 8 अध्यापन • गणित-विज्ञान, अंग्रेजी, संस्कृत, सामाजिक विज्ञान, एवं हिंदी शिक्षक टेस्ट श्रृंखला.
                </p>
                <div className="mt-3 flex items-center text-[11px] font-semibold text-slate-400 space-x-2">
                  <span className="text-emerald-400 font-bold">5 Subject Series</span>
                  <span aria-hidden="true">·</span>
                  <span>Dedicated Mocks</span>
                </div>
              </button>

              {/* Cadre 3: Lecturer (Subject Specific) */}
              <button
                type="button"
                onClick={() => setSelectedCadre('lecturer')}
                className={`p-4 rounded-2xl text-left border transition cursor-pointer relative ${
                  selectedCadre === 'lecturer'
                    ? 'bg-amber-500/10 border-amber-500/70 text-white ring-1 ring-amber-500/40'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-950'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm">
                    9-12
                  </div>
                  <span className="text-[10px] font-mono text-purple-300 bg-purple-500/15 px-2 py-0.5 rounded-md">
                    स्नातकोत्तर (PG Level)
                  </span>
                </div>
                <h3 className="font-bold text-sm sm:text-base text-white">
                  व्याख्याता (Lecturer Class 9-12)
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  उच्चतर माध्यमिक अध्यापन • भौतिकी, रसायन, गणित, जीव विज्ञान, वाणिज्य, इतिहास, एवं अंग्रेजी विषय.
                </p>
                <div className="mt-3 flex items-center text-[11px] font-semibold text-slate-400 space-x-2">
                  <span className="text-emerald-400 font-bold">7 Subject Series</span>
                  <span aria-hidden="true">·</span>
                  <span>Deep PG Syllabus</span>
                </div>
              </button>
            </div>
          </div>

          {/* Cadre 1 Details: Assistant Teacher */}
          {selectedCadre === 'asst_teacher' && (
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2 text-xs text-emerald-400 font-bold mb-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Official 150-Question Composite Paper Scheme</span>
                  </div>
                  <h4 className="text-lg font-black text-white">
                    छत्तीसगढ़ सहायक शिक्षक (Class 1-5) संपूर्ण मॉक टेस्ट सीरीज
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Pattern: 150 Questions · 150 Marks · 150 Minutes · Negative Marking -0.25 (-¼) · Bilingual (हिं / En)
                  </p>
                </div>

                <div className="flex items-center space-x-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleLaunchSample('assistant teacher', 'CG Assistant Teacher Full Mock #1')}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition flex items-center space-x-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
                  >
                    <span>Start Free Mock (150 Qs)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={onExplorePass}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-bold text-xs transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Crown className="w-3.5 h-3.5 fill-amber-400" />
                    <span>Unlock 15 Mocks @ ₹299</span>
                  </button>
                </div>
              </div>

              {/* Exact 7-Subject Syllabus Marks Matrix (Collapsible on Mobile) */}
              <div className="pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between py-1 text-xs">
                  <div className="text-slate-400 truncate max-w-[70%] sm:max-w-none">
                    <span className="text-slate-300 font-semibold">150 Qs Weighting:</span> CDP (30) · हिंदी (25) · English (25) · गणित (30) · EVS (20) · Comp (10) · GK (10)
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSyllabusMatrix(!showSyllabusMatrix)}
                    className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition shrink-0 cursor-pointer"
                  >
                    {showSyllabusMatrix ? 'Hide Breakdown ▲' : 'Show Grid Breakdown ▼'}
                  </button>
                </div>

                {showSyllabusMatrix && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-2 text-center animate-in fade-in duration-150">
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block font-semibold truncate">बाल विकास (CDP)</span>
                      <span className="text-sm font-black text-amber-400">30 Qs</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block font-semibold truncate">सामान्य हिंदी</span>
                      <span className="text-sm font-black text-white">25 Qs</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block font-semibold truncate">General English</span>
                      <span className="text-sm font-black text-white">25 Qs</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block font-semibold truncate">गणित (Maths)</span>
                      <span className="text-sm font-black text-blue-400">30 Qs</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block font-semibold truncate">पर्यावरण (EVS)</span>
                      <span className="text-sm font-black text-emerald-400">20 Qs</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block font-semibold truncate">कंप्यूटर (Computer)</span>
                      <span className="text-sm font-black text-purple-400">10 Qs</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block font-semibold truncate">सामान्य ज्ञान (GK)</span>
                      <span className="text-sm font-black text-teal-400">10 Qs</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Cadre 2 Details: Teacher (Class 6 to 8 - Subject Specific) */}
          {selectedCadre === 'teacher' && (
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-base font-bold text-white">
                    विषयवार शिक्षक टेस्ट सीरीज (Select Subject Discipline):
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Each subject teacher test includes 30 Qs Child Pedagogy + 30 Qs Language + 80-90 Qs Subject Core.
                  </p>
                </div>
                <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 self-start sm:self-auto">
                  5 Disciplines Available
                </span>
              </div>

              {/* Subject Tabs (Horizontal Swipe on Mobile) */}
              <div className="flex overflow-x-auto no-scrollbar touch-scroll gap-2 pt-1 pb-1">
                {teacherSubjects.map(subj => (
                  <button
                    key={subj.id}
                    type="button"
                    onClick={() => setSelectedTeacherSubject(subj.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 whitespace-nowrap cursor-pointer ${
                      selectedTeacherSubject === subj.id
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <span>{subj.icon}</span>
                    <span>{subj.name}</span>
                  </button>
                ))}
              </div>

              {/* Active Subject Test Overview Card */}
              {(() => {
                const cur = teacherSubjects.find(s => s.id === selectedTeacherSubject) || teacherSubjects[0];
                return (
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
                    <div>
                      <div className="flex items-center space-x-2 text-xs text-indigo-400 font-bold mb-1">
                        <span>{cur.icon}</span>
                        <span>{cur.name} Test Package</span>
                      </div>
                      <h5 className="font-bold text-white text-sm sm:text-base">
                        कक्षा 6 से 8: {cur.name} संपूर्ण मॉडल मॉक पेपर
                      </h5>
                      <p className="text-xs text-slate-400 mt-1">
                        Includes {cur.totalMocks} Full Mocks · Core Subject Pedagogy · Past Year Solved Papers · Bilingual Explanations
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleLaunchSample(cur.name, `${cur.name} Mock Test #1`)}
                        className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition cursor-pointer"
                      >
                        Free Diagnostic Test
                      </button>
                      <button
                        type="button"
                        onClick={onExplorePass}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-amber-500/30 transition cursor-pointer"
                      >
                        Unlock Series @ ₹299
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Cadre 3 Details: Lecturer (Class 9 to 12 - Deep PG Mastery) */}
          {selectedCadre === 'lecturer' && (
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-base font-bold text-white">
                    विषयवार व्याख्याता टेस्ट सीरीज (Post-Graduate Subject Mastery):
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    100 Qs Post-Graduate Subject Specialization + 50 Qs General Pedagogy & Mental Ability.
                  </p>
                </div>
                <span className="text-xs font-mono text-purple-400 font-bold bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20 self-start sm:self-auto">
                  7 PG Subjects Available
                </span>
              </div>

              {/* Subject Tabs (Horizontal Swipe on Mobile) */}
              <div className="flex overflow-x-auto no-scrollbar touch-scroll gap-2 pt-1 pb-1">
                {lecturerSubjects.map(subj => (
                  <button
                    key={subj.id}
                    type="button"
                    onClick={() => setSelectedLecturerSubject(subj.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 whitespace-nowrap cursor-pointer ${
                      selectedLecturerSubject === subj.id
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <span>{subj.icon}</span>
                    <span>{subj.name}</span>
                  </button>
                ))}
              </div>

              {/* Active Subject Test Overview Card */}
              {(() => {
                const cur = lecturerSubjects.find(s => s.id === selectedLecturerSubject) || lecturerSubjects[0];
                return (
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
                    <div>
                      <div className="flex items-center space-x-2 text-xs text-purple-400 font-bold mb-1">
                        <span>{cur.icon}</span>
                        <span>{cur.name} PG Level Series</span>
                      </div>
                      <h5 className="font-bold text-white text-sm sm:text-base">
                        छत्तीसगढ़ व्याख्याता भर्ती 2026: {cur.name}
                      </h5>
                      <p className="text-xs text-slate-400 mt-1">
                        Includes {cur.totalMocks} PG Mocks · 2019/2023 Official Question Trends · Model Answer Explanations
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleLaunchSample(cur.name, `${cur.name} Mock Test #1`)}
                        className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition cursor-pointer"
                      >
                        Free Diagnostic Test
                      </button>
                      <button
                        type="button"
                        onClick={onExplorePass}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-amber-500/30 transition cursor-pointer"
                      >
                        Unlock Series @ ₹299
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Super Pass Promotion Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-slate-950 to-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Crown className="w-5 h-5 fill-amber-400" />
              </div>
              <div>
                <h5 className="font-bold text-white text-sm">
                  CG Teacher Super Pass: Unlock All 3 Cadres @ ₹449
                </h5>
                <p className="text-xs text-slate-400">
                  Assistant Teacher + All Subject Teachers (Maths, English, Sanskrit, Social Science) + All Lecturers (Physics, Chem, Maths, Bio) for 1 Year.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onExplorePass}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shadow-md shrink-0 cursor-pointer"
            >
              Get Teacher Super Pass (₹449)
            </button>
          </div>

        </div>
      )}

      {/* 3. SECTION B: CGPSC STATE SERVICE PRELIMS 2026 */}
      {activeExamType === 'CGPSC' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2 text-xs text-blue-400 font-bold mb-1">
                  <Award className="w-4 h-4" />
                  <span>State Service Examination (SSE) Prelims 2026</span>
                </div>
                <h3 className="text-lg font-black text-white">
                  CGPSC प्रारंभिक परीक्षा 2026 (Paper 1 GS + Paper 2 CSAT)
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  Rigorous mock tests mapped to official CGPSC question weighting: 50 Qs Chhattisgarh General Studies (इतिहास, भूगोल, जनजातीय संस्कृति, पंचायती राज) + 50 Qs India GS.
                </p>
              </div>

              <div className="flex items-center space-x-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleLaunchSample('cgpsc', 'CGPSC Prelims Full Mock 2026')}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition flex items-center space-x-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  <span>Start Free GS Mock #1</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onExplorePass}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-bold text-xs transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Crown className="w-3.5 h-3.5 fill-amber-400" />
                  <span>Get CGPSC Pass @ ₹299</span>
                </button>
              </div>
            </div>

            {/* Papers breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-white">Paper 1: General Studies</span>
                  <span className="text-[11px] font-mono text-emerald-400">100 Qs · 200 Marks · -⅓</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  50 Qs CG Specific (जनजातियां, तीज-त्यौहार, साहित्य, प्रशासनिक ढांचा) + 50 Qs Indian History, Polity, Economy & Science.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-white">Paper 2: CSAT Aptitude</span>
                  <span className="text-[11px] font-mono text-blue-400">100 Qs · 200 Marks · -⅓</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Reasoning, Quantitative Aptitude, Chhattisgarhi Bhasha Grammar, and Hindi Language Comprehension.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. SECTION C: UPCOMING IN NEXT 6 MONTHS */}
      {activeExamType === 'UPCOMING' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
          
          {/* Upcoming 1: CG Vyapam Hostel Warden */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  CG Vyapam Notification
                </span>
                <span className="text-[10px] font-mono text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-md">
                  High Demand
                </span>
              </div>
              <h4 className="font-bold text-base text-white">
                छात्रावास अधीक्षक 2026 (Hostel Warden)
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                100 Questions with the crucial <strong className="text-amber-300">50-Mark Computer Qualifying Section</strong> (min 25 marks required to qualify) + CG GS, Hindi, English, Maths.
              </p>
              <div className="flex items-center text-[11px] text-slate-400 space-x-2 pt-1">
                <span>100 Qs · 100 Marks · -⅓ Negative</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleLaunchSample('warden', 'CG Hostel Warden 2026 Full Mock')}
                className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition cursor-pointer"
              >
                Free Diagnostic Mock
              </button>
              <button
                type="button"
                onClick={onExplorePass}
                className="text-xs font-bold text-amber-400 hover:underline flex items-center space-x-1"
              >
                <span>Unlock Full Series</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Upcoming 2: Patwari & Revenue Inspector */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">
                  Revenue Dept Recruitment
                </span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md">
                  Expected Soon
                </span>
              </div>
              <h4 className="font-bold text-base text-white">
                राजस्व निरीक्षक (RI) एवं पटवारी 2026
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                150 Questions comprehensive test covering Quantitative Aptitude, Land Revenue basics, General Studies, Computer Science, and Hindi.
              </p>
              <div className="flex items-center text-[11px] text-slate-400 space-x-2 pt-1">
                <span>150 Qs · 150 Marks · -⅓ Negative</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleLaunchSample('patwari', 'CG Patwari Full Simulation Mock')}
                className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition cursor-pointer"
              >
                Free Diagnostic Mock
              </button>
              <button
                type="button"
                onClick={onExplorePass}
                className="text-xs font-bold text-amber-400 hover:underline flex items-center space-x-1"
              >
                <span>Unlock Full Series</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Upcoming 3: Apex Bank & Cooperative */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                  Cooperative Banking
                </span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md">
                  Active
                </span>
              </div>
              <h4 className="font-bold text-base text-white">
                अपेक्स बैंक एवं सहकारी समितियां (Apex Bank)
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Chhattisgarh Cooperative Societies Act, Banking Awareness, Computer, Reasoning, and Chhattisgarhi Language tests.
              </p>
              <div className="flex items-center text-[11px] text-slate-400 space-x-2 pt-1">
                <span>100 Qs · 100 Marks · -¼ Negative</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleLaunchSample('bank', 'Apex Bank Practice Mock')}
                className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition cursor-pointer"
              >
                Free Practice Test
              </button>
              <button
                type="button"
                onClick={onExplorePass}
                className="text-xs font-bold text-amber-400 hover:underline flex items-center space-x-1"
              >
                <span>Unlock Full Series</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Upcoming 4: CG Police Sub-Inspector */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                  Police Department
                </span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md">
                  Physical + Mains
                </span>
              </div>
              <h4 className="font-bold text-base text-white">
                छत्तीसगढ़ पुलिस सब-इंस्पेक्टर (CG Police SI)
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                General Knowledge, Aptitude, and Hindi/English language testing with authentic Vyapam exam difficulty.
              </p>
              <div className="flex items-center text-[11px] text-slate-400 space-x-2 pt-1">
                <span>100 Qs · 300 Marks · Mains Level</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleLaunchSample('police', 'CG Police SI Mock Test')}
                className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition cursor-pointer"
              >
                Free Practice Test
              </button>
              <button
                type="button"
                onClick={onExplorePass}
                className="text-xs font-bold text-amber-400 hover:underline flex items-center space-x-1"
              >
                <span>Unlock Full Series</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
