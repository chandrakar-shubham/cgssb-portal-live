import React, { useEffect } from 'react';
import { Question, MockTest, PreviousYearPaper } from '../types';
import {
  HelpCircle,
  CheckCircle2,
  Share2,
  BookOpen,
  ArrowLeft,
  Sparkles,
  Layers,
  ChevronRight,
  ExternalLink,
  Award,
  Crown
} from 'lucide-react';
import { generateQuestionSchemaJsonLd, getQuestionSeoUrl, getMockTestSeoUrl, getChapterTestSeoUrl } from '../utils/seoUrlHelper';

interface SEOQuestionViewProps {
  question: Question;
  allTests?: MockTest[];
  allPypPapers?: PreviousYearPaper[];
  onBackToDashboard: () => void;
  onStartRelatedTest?: (test: MockTest) => void;
}

export const SEOQuestionView: React.FC<SEOQuestionViewProps> = ({
  question,
  allTests = [],
  allPypPapers = [],
  onBackToDashboard,
  onStartRelatedTest,
}) => {
  const pageUrl = typeof window !== 'undefined' ? window.location.href : 'https://cgtest.in';
  const schemaJsonLd = generateQuestionSchemaJsonLd(question, pageUrl);

  // Set document title & inject schema JSON-LD on mount
  useEffect(() => {
    const titleText = `${question.questionHindi || question.questionText || 'Solved Question'} - CG Vyapam & CGPSC MCQ | cgtest.in`;
    document.title = titleText.slice(0, 75);

    const scriptId = 'question-schema-jsonld';
    let scriptEl = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = scriptId;
      scriptEl.type = 'application/ld+json';
      document.head.appendChild(scriptEl);
    }
    scriptEl.textContent = JSON.stringify(schemaJsonLd);

    return () => {
      const el = document.getElementById(scriptId);
      if (el) el.remove();
    };
  }, [question]);

  // Find related mock test or PYP paper
  const relatedTest = allTests.find(t =>
    t.category === question.category ||
    t.sections.some(s => s.questionIds.includes(question.id))
  ) || allTests[0];

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: question.questionHindi || question.questionText,
        text: `Check out this solved CG Exam MCQ: ${question.questionHindi || question.questionText}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Question link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Navigation & Breadcrumbs */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <button
            onClick={onBackToDashboard}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Exam Portal</span>
          </button>

          <div className="flex items-center space-x-2 text-[11px]">
            <span className="text-emerald-400 font-bold">Home</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-slate-300">{question.subject || 'Chhattisgarh GK'}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-indigo-400 font-medium truncate max-w-[200px]">
              {question.topic || 'General Topic'}
            </span>
          </div>
        </div>

        {/* Question Master Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          
          {/* Header Badges */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                🏛️ {question.authority || question.category || 'CGSSB / CG Vyapam'}
              </span>
              {question.examName && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  🎯 {question.examName}
                </span>
              )}
              {question.year && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  📅 {question.year} Official PYQ
                </span>
              )}
            </div>

            <button
              onClick={handleShare}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center space-x-1.5 text-xs"
              title="Share Question"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>

          {/* Question Body (Bilingual Hindi + English) */}
          <div className="space-y-4">
            {question.questionHindi && (
              <div className="text-lg sm:text-xl font-bold text-white leading-relaxed font-sans">
                {question.questionHindi}
              </div>
            )}
            {question.questionText && question.questionText !== question.questionHindi && (
              <div className="text-sm sm:text-base text-slate-300 italic leading-relaxed">
                {question.questionText}
              </div>
            )}
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {question.options.map((opt) => {
              const isCorrect = opt.id === question.correctOption;
              return (
                <div
                  key={opt.id}
                  className={`p-4 rounded-2xl border transition flex items-start space-x-3 ${
                    isCorrect
                      ? 'bg-emerald-950/40 border-emerald-500/80 text-emerald-100 shadow-md shadow-emerald-950/50'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300'
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      isCorrect
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {opt.id}
                  </span>
                  <div className="flex-1">
                    <div className="font-medium text-sm text-slate-100">
                      {opt.textHindi || opt.text}
                    </div>
                    {opt.text && opt.textHindi && opt.text !== opt.textHindi && (
                      <div className="text-xs text-slate-400 mt-0.5">{opt.text}</div>
                    )}
                  </div>
                  {isCorrect && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Official Explanation Box */}
          {(question.explanation || question.explanationHindi) && (
            <div className="p-5 rounded-2xl bg-indigo-950/30 border border-indigo-900/50 space-y-2">
              <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Verified Solution & Detailed Hindi Explanation (व्याख्या)</span>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed font-sans">
                {question.explanationHindi || question.explanation}
              </p>
            </div>
          )}
        </div>

        {/* CONVERSION & LEAD-GEN CTA BANNER */}
        {relatedTest && (
          <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/80 via-teal-950/80 to-indigo-950/80 border border-emerald-500/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start space-x-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                  Practice Full Test Simulation
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white">
                {relatedTest.title}
              </h3>
              <p className="text-xs text-slate-300">
                Attempt {relatedTest.questionCount || 100} timed questions with Statewide Merit Leaderboard & Percentile.
              </p>
            </div>

            <button
              onClick={() => onStartRelatedTest && onStartRelatedTest(relatedTest)}
              className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/30 transition flex items-center space-x-2 shrink-0 cursor-pointer"
            >
              <span>Take Free Mock Test</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
