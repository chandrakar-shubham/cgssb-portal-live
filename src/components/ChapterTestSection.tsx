import React, { useState, useMemo } from 'react';
import { MockTest, Question } from '../types';
import {
  BookOpen,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Play,
  Layers,
  Sparkles,
  ChevronRight,
  Award,
  Zap
} from 'lucide-react';
import { getChapterTestSeoUrl } from '../utils/seoUrlHelper';

interface ChapterTestSectionProps {
  tests: MockTest[];
  questions: Question[];
  onStartTest: (test: MockTest) => void;
  selectedCategory?: string | 'ALL';
}

export const ChapterTestSection: React.FC<ChapterTestSectionProps> = ({
  tests,
  questions,
  onStartTest,
  selectedCategory = 'ALL',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubject, setActiveSubject] = useState<string>('ALL');

  // Extract all distinct subjects from questions & tests
  const subjectList = useMemo(() => {
    const subs = new Set<string>();
    questions.forEach(q => {
      if (q.subject) subs.add(q.subject);
    });
    return Array.from(subs);
  }, [questions]);

  // Filter chapter / topic tests
  const chapterTests = useMemo(() => {
    return tests.filter(t => {
      const isChapterType = t.testType === 'chapter_test' ||
                            t.testType === 'sectional' ||
                            t.id.startsWith('chapter-') ||
                            t.title.toLowerCase().includes('chapter') ||
                            t.title.toLowerCase().includes('topic') ||
                            t.title.toLowerCase().includes('quiz') ||
                            t.sections.some(s => s.name.toLowerCase().includes('chapter') || s.name.toLowerCase().includes('topic') || s.name.toLowerCase().includes('quiz'));
      
      const matchesProgram = selectedCategory === 'ALL' ||
        (t.programId && String(t.programId) === String(selectedCategory)) ||
        (!t.programId && String(t.category || '') === String(selectedCategory));
      
      const matchesSearch = !searchQuery.trim() ||
                            t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                            (t.subject && t.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
                            (t.topic && t.topic.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesSubject = activeSubject === 'ALL' ||
                             t.title.toLowerCase().includes(activeSubject.toLowerCase()) ||
                             (t.subject && t.subject.toLowerCase() === activeSubject.toLowerCase()) ||
                             t.sections.some(s => s.name.toLowerCase().includes(activeSubject.toLowerCase()));

      return isChapterType && matchesProgram && matchesSearch && matchesSubject;
    });
  }, [tests, searchQuery, activeSubject, selectedCategory]);

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 border border-indigo-900/40 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Targeted Subject & Chapter Mastery</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            CG Vyapam & CGPSC <span className="text-indigo-400">Chapter Tests</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Practice topic-by-topic quizzes on Chhattisgarh History, Panchayati Raj, Computer, General Hindi, and Child Pedagogy with instant solutions.
          </p>
        </div>

        {/* Search and Subject Pill Filters */}
        <div className="mt-6 space-y-3">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search chapters (e.g. Kalchuri, Mahanadi, Sandhi, RTE)..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <button
              onClick={() => setActiveSubject('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeSubject === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              All Subjects ({subjectList.length})
            </button>
            {subjectList.slice(0, 6).map(subj => (
              <button
                key={subj}
                onClick={() => setActiveSubject(subj)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  activeSubject === subj
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {subj}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chapter Tests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {chapterTests.length > 0 ? (
          chapterTests.map(test => (
            <div
              key={test.id}
              className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    📖 Chapter Quiz
                  </span>
                  <span className="text-xs text-slate-400 flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{test.durationMinutes} mins</span>
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-indigo-400 transition line-clamp-2">
                    {test.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {test.description || 'Topic-specific MCQs with Devanagari Hindi explanations.'}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                <div className="text-xs text-slate-400">
                  <span className="font-bold text-white">{test.questionCount || 20}</span> MCQs •{' '}
                  <span className="text-emerald-400 font-bold">{test.totalMarks} Marks</span>
                </div>
                <button
                  onClick={() => onStartTest(test)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-indigo-600/20 transition cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Quiz</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-slate-400 space-y-2">
            <BookOpen className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-sm">No chapter tests matching your filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};
