import React, { useState, useMemo } from 'react';
import { Question, ExamCategory } from '../types';
import {
  Zap,
  Plus,
  Search,
  Trash2,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  ExternalLink,
  Edit3
} from 'lucide-react';
import { getQuestionSeoUrl } from '../utils/seoUrlHelper';

interface AdminPracticeSetManagerProps {
  questions: Question[];
  onAddQuestion?: (q: Question) => void;
  onUpdateQuestion?: (id: string, qData: Partial<Question>) => void;
  onDeleteQuestion?: (id: string) => void;
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

export const AdminPracticeSetManager: React.FC<AdminPracticeSetManagerProps> = ({
  questions,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
  onOpenUniversalIngest,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('ALL');

  const subjects = useMemo(() => {
    const s = new Set<string>();
    questions.forEach(q => {
      if (q.subject) s.add(q.subject);
    });
    return Array.from(s);
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const matchSearch =
        (q.questionHindi && q.questionHindi.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (q.questionText && q.questionText.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (q.topic && q.topic.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchSubject = subjectFilter === 'ALL' || q.subject === subjectFilter;

      return matchSearch && matchSubject;
    });
  }, [questions, searchQuery, subjectFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-teal-500/20 text-teal-400">
              <Zap className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Practice Drill & Daily Quiz CMS
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Manage instant-explanation practice sets, flashcard decks, and rapid speed drills.
          </p>
        </div>

        {onOpenUniversalIngest && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() =>
                onOpenUniversalIngest({
                  type: 'QUESTION_BANK',
                  lockType: false,
                  initialInputTab: 'JSON_EDITOR',
                  authority: 'CGSSB',
                  examName: 'CG Practice Drills 2026',
                })
              }
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/40 font-bold text-xs sm:text-sm flex items-center space-x-2 transition cursor-pointer shadow-sm"
              title="Upload or paste raw JSON questions for practice bank"
            >
              <span className="text-sm">📥</span>
              <span>Import JSON</span>
            </button>

            <button
              onClick={() =>
                onOpenUniversalIngest({
                  type: 'QUESTION_BANK',
                  lockType: false,
                  initialInputTab: 'SMART_PASTE',
                  authority: 'CGSSB',
                  examName: 'CG Practice Drills 2026',
                })
              }
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 via-emerald-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center space-x-2 shadow-lg shadow-teal-600/20 transition cursor-pointer shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              <span>⚡ Ingest Practice Questions</span>
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
            placeholder="Search practice items by Hindi or English text..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none"
          />
        </div>

        <select
          value={subjectFilter}
          onChange={e => setSubjectFilter(e.target.value)}
          className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:border-teal-500 focus:outline-none"
        >
          <option value="ALL">All Subjects ({subjects.length})</option>
          {subjects.map(s => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Questions Practice List */}
      <div className="space-y-3">
        {filteredQuestions.slice(0, 40).map((q, idx) => (
          <div
            key={q.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-slate-700 transition"
          >
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/10 text-teal-300 border border-teal-500/20">
                  {q.subject}
                </span>
                {q.topic && (
                  <span className="text-[11px] text-slate-400 font-medium">• {q.topic}</span>
                )}
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                  Ans: ({q.correctOption})
                </span>
              </div>

              <div className="font-semibold text-xs sm:text-sm text-white line-clamp-2">
                {q.questionHindi || q.questionText}
              </div>

              {(q.explanation || q.explanationHindi) && (
                <p className="text-[11px] text-slate-400 line-clamp-1">
                  💡 {q.explanationHindi || q.explanation}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              {onDeleteQuestion && (
                <button
                  onClick={() => {
                    if (confirm('Delete this practice question?')) {
                      onDeleteQuestion(q.id);
                    }
                  }}
                  className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/20 transition"
                  title="Delete Question"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
