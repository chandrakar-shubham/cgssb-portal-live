import React, { useState, useMemo } from 'react';
import { Question, ExamCategory } from '../types';
import {
  Zap,
  Search,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  Layers,
  ArrowRight,
  RefreshCw,
  Award
} from 'lucide-react';
import { getQuestionSeoUrl } from '../utils/seoUrlHelper';

interface PracticeSetSectionProps {
  questions: Question[];
  onViewQuestionSEO?: (q: Question) => void;
  selectedCategory?: ExamCategory | 'ALL';
}

export const PracticeSetSection: React.FC<PracticeSetSectionProps> = ({
  questions,
  onViewQuestionSEO,
  selectedCategory = 'ALL',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});

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

      const matchSubject = selectedSubject === 'ALL' || q.subject === selectedSubject;

      return matchSearch && matchSubject;
    });
  }, [questions, searchQuery, selectedSubject]);

  const toggleReveal = (id: string) => {
    setRevealedAnswers(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-slate-900 border border-teal-900/40 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-bold">
            <Zap className="w-3.5 h-3.5" />
            <span>Untimed Daily Practice & Drills</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            CG Vyapam & CGPSC <span className="text-teal-400">Practice Drills</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Practice individual MCQs at your own pace with instant answer reveals, detailed Hindi explanations, and direct SEO sharing links.
          </p>
        </div>

        {/* Search & Subject Bar */}
        <div className="mt-6 space-y-3">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search practice questions by keyword..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <button
              onClick={() => setSelectedSubject('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedSubject === 'ALL'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              All ({questions.length})
            </button>
            {subjects.slice(0, 6).map(subj => (
              <button
                key={subj}
                onClick={() => setSelectedSubject(subj)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  selectedSubject === subj
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {subj}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Practice Question Feed */}
      <div className="space-y-4">
        {filteredQuestions.slice(0, 30).map((q, idx) => {
          const isRevealed = !!revealedAnswers[q.id];
          return (
            <div
              key={q.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4 hover:border-slate-700 transition"
            >
              {/* Question Header */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-300 font-bold text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">{q.subject}</span>
                  {q.topic && (
                    <span className="text-[11px] text-slate-500">• {q.topic}</span>
                  )}
                </div>

                {onViewQuestionSEO && (
                  <button
                    onClick={() => onViewQuestionSEO(q)}
                    className="text-[11px] font-medium text-teal-400 hover:underline flex items-center space-x-1"
                  >
                    <span>View SEO Page</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Question Text */}
              <div className="space-y-2">
                {q.questionHindi && (
                  <div className="text-sm sm:text-base font-bold text-white leading-relaxed">
                    {q.questionHindi}
                  </div>
                )}
                {q.questionText && q.questionText !== q.questionHindi && (
                  <div className="text-xs sm:text-sm text-slate-300 italic">
                    {q.questionText}
                  </div>
                )}
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {q.options.map(opt => {
                  const isCorrect = isRevealed && opt.id === q.correctOption;
                  return (
                    <div
                      key={opt.id}
                      className={`p-3 rounded-xl border text-xs font-medium flex items-center space-x-2.5 transition ${
                        isCorrect
                          ? 'bg-emerald-950/50 border-emerald-500/80 text-emerald-200'
                          : 'bg-slate-950/50 border-slate-800 text-slate-300'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] ${
                          isCorrect ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {opt.id}
                      </span>
                      <span>{opt.textHindi || opt.text}</span>
                    </div>
                  );
                })}
              </div>

              {/* Answer & Explanation Reveal Toggle */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-800/60">
                <button
                  onClick={() => toggleReveal(q.id)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isRevealed ? 'Hide Explanation' : 'Reveal Answer & Explanation'}</span>
                </button>

                {isRevealed && (
                  <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Correct Option: ({q.correctOption})</span>
                  </span>
                )}
              </div>

              {/* Revealed Explanation */}
              {isRevealed && (q.explanation || q.explanationHindi) && (
                <div className="p-3.5 rounded-xl bg-teal-950/20 border border-teal-900/40 text-xs text-slate-200 leading-relaxed font-sans">
                  <span className="font-bold text-teal-400">व्याख्या: </span>
                  {q.explanationHindi || q.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
