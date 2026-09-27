import React, { useState, useMemo } from 'react';
import { MockTest, Question, ExamCategory } from '../types';
import {
  BookOpen,
  Plus,
  Search,
  Edit3,
  Trash2,
  Clock,
  Sparkles,
  Layers,
  Zap,
  Filter,
  CheckCircle2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface AdminChapterTestManagerProps {
  tests: MockTest[];
  questions: Question[];
  onAddTest?: (test: MockTest) => void;
  onUpdateTest?: (testId: string, updates: Partial<MockTest>) => void;
  onDeleteTest?: (testId: string) => void;
  onStartTest?: (test: MockTest) => void;
  onOpenUniversalIngest?: (config?: {
    type?: 'MOCK_TEST' | 'PYP' | 'CHAPTER_TEST' | 'QUESTION_BANK';
    lockType?: boolean;
    initialInputTab?: 'SMART_PASTE' | 'JSON_EDITOR' | 'AI_GEMINI';
    authority?: string;
    examName?: string;
    cadre?: string;
    bundleId?: string;
  }) => void;
}

export const AdminChapterTestManager: React.FC<AdminChapterTestManagerProps> = ({
  tests,
  questions,
  onAddTest,
  onUpdateTest,
  onDeleteTest,
  onStartTest,
  onOpenUniversalIngest,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('ALL');

  // Extract unique subjects
  const subjects = useMemo(() => {
    const s = new Set<string>();
    questions.forEach(q => {
      if (q.subject) s.add(q.subject);
    });
    return Array.from(s);
  }, [questions]);

  // Filter tests categorized as Chapter Tests
  const chapterTests = useMemo(() => {
    return tests.filter(t => {
      const isChapter = t.testType === 'chapter_test' ||
                        t.testType === 'sectional' ||
                        t.id.startsWith('chapter-') ||
                        t.title.toLowerCase().includes('chapter') ||
                        t.title.toLowerCase().includes('topic') ||
                        t.title.toLowerCase().includes('quiz') ||
                        (t.description && t.description.toLowerCase().includes('topic')) ||
                        t.sections.some(s => s.name.toLowerCase().includes('chapter') || s.name.toLowerCase().includes('topic'));

      const matchSearch = !searchQuery.trim() ||
                          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (t.subject && t.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (t.topic && t.topic.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchSubject = subjectFilter === 'ALL' ||
                           t.title.toLowerCase().includes(subjectFilter.toLowerCase()) ||
                           (t.subject && t.subject.toLowerCase() === subjectFilter.toLowerCase()) ||
                           t.sections.some(s => s.name.toLowerCase().includes(subjectFilter.toLowerCase()));

      return isChapter && matchSearch && matchSubject;
    });
  }, [tests, searchQuery, subjectFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Chapter & Topic Test CMS Manager
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Create, edit, and organize subject-wise syllabus modules (CG History, Panchayati Raj, Geography, Pedagogy, Computers).
          </p>
        </div>

        {onOpenUniversalIngest && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() =>
                onOpenUniversalIngest({
                  type: 'CHAPTER_TEST',
                  lockType: true,
                  initialInputTab: 'JSON_EDITOR',
                  authority: 'CGSSB',
                  examName: 'CG Vyapam Subject Mastery',
                })
              }
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/40 font-bold text-xs sm:text-sm flex items-center space-x-2 transition cursor-pointer shadow-sm"
              title="Upload or paste raw JSON questions for chapter test"
            >
              <span className="text-sm">📥</span>
              <span>Import JSON</span>
            </button>

            <button
              onClick={() =>
                onOpenUniversalIngest({
                  type: 'CHAPTER_TEST',
                  lockType: true,
                  initialInputTab: 'SMART_PASTE',
                  authority: 'CGSSB',
                  examName: 'CG Vyapam Subject Mastery',
                })
              }
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm flex items-center space-x-2 shadow-lg shadow-indigo-600/20 transition cursor-pointer shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              <span>⚡ Ingest Chapter Test</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search chapter tests..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <select
          value={subjectFilter}
          onChange={e => setSubjectFilter(e.target.value)}
          className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:border-indigo-500 focus:outline-none"
        >
          <option value="ALL">All Subjects ({subjects.length})</option>
          {subjects.map(s => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Tests Table / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {chapterTests.length > 0 ? (
          chapterTests.map(test => (
            <div
              key={test.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    📖 Chapter Test
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    ⏱️ {test.durationMinutes}m • 🎯 {test.totalMarks} Marks
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white line-clamp-2">{test.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-2">{test.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  <strong className="text-white">{test.questionCount || 20}</strong> MCQs
                </span>

                <div className="flex items-center space-x-2">
                  {onDeleteTest && (
                    <button
                      onClick={() => {
                        if (confirm(`Delete chapter test "${test.title}"?`)) {
                          onDeleteTest(test.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 transition"
                      title="Delete Test"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {onStartTest && (
                    <button
                      onClick={() => onStartTest(test)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition flex items-center space-x-1 text-[11px]"
                    >
                      <span>Preview</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-16 text-center text-slate-400 space-y-3 bg-slate-900/40 rounded-3xl border border-slate-800">
            <BookOpen className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-sm">No chapter tests found.</p>
            {onOpenUniversalIngest && (
              <button
                onClick={() =>
                  onOpenUniversalIngest({
                    type: 'CHAPTER_TEST',
                    lockType: true,
                    authority: 'CGSSB',
                  })
                }
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold inline-flex items-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create First Chapter Test</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
