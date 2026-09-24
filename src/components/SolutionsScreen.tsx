import React, { useState, useMemo } from 'react';
import { TestAttempt, Question, SectorAnalysis } from '../types';
import { normalizeSubjectName, migrateLegacyAttempt } from '../utils/taxonomyMigration';
import { QuestionRenderer } from './QuestionRenderer';
import { LanguageToggle } from './LanguageToggle';
import { useLanguage } from '../context/LanguageContext';
import {
  Award,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  ArrowLeft,
  RotateCcw,
  BarChart2,
  FileCheck,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Printer,
  Zap,
  Target,
  Flame,
  History,
  Hash,
  BookOpen,
  Filter,
  Trophy,
  Sparkles
} from 'lucide-react';

interface SolutionsScreenProps {
  attempt: TestAttempt;
  questions: Question[];
  onBackToDashboard: () => void;
  onReattempt: () => void;
}

export const SolutionsScreen: React.FC<SolutionsScreenProps> = ({
  attempt,
  questions,
  onBackToDashboard,
  onReattempt,
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'solutions' | 'sectors'>('summary');
  const [filterSolution, setFilterSolution] = useState<'all' | 'correct' | 'incorrect' | 'unattempted'>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [expandedExplanation, setExpandedExplanation] = useState<Record<string, boolean>>({});

  // Ensure sector analysis is completely migrated and reflects separate non-conjoined taxonomy
  const resolvedSectors: SectorAnalysis[] = useMemo(() => {
    const migrated = migrateLegacyAttempt(attempt, questions);
    return migrated.sectorAnalysis || [];
  }, [attempt, questions]);

  const toggleExplanation = (qid: string) => {
    setExpandedExplanation(prev => ({
      ...prev,
      [qid]: !prev[qid],
    }));
  };

  const filteredQuestions = questions.filter(q => {
    const candidateAnswer = attempt.responses[q.id];
    const cleanSubj = normalizeSubjectName(q.subject);

    if (subjectFilter !== 'all' && cleanSubj !== subjectFilter) {
      return false;
    }

    if (filterSolution === 'correct') {
      return candidateAnswer === q.correctOption;
    }
    if (filterSolution === 'incorrect') {
      return candidateAnswer != null && candidateAnswer !== q.correctOption;
    }
    if (filterSolution === 'unattempted') {
      return candidateAnswer == null;
    }
    return true;
  });

  const getSubjectBadgeStyle = (subjName: string) => {
    switch (subjName) {
      case 'India General Studies':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/40';
      case 'Chhattisgarh General Studies':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40';
      case 'Quantitative Aptitude':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/40';
      case 'Reasoning':
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40';
      case 'Computer Knowledge':
        return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40';
      case 'General Science':
        return 'bg-lime-500/15 text-lime-300 border-lime-500/40';
      case 'General Hindi':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/40';
      case 'Chhattisgarhi Language':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/40';
      case 'Child Pedagogy & Teaching Methodology':
        return 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/40';
      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600';
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Action Nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToDashboard}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition border border-slate-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition border border-slate-700"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Scorecard</span>
          </button>
          <button
            onClick={onReattempt}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition shadow-md shadow-emerald-500/20 active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Re-attempt Test</span>
          </button>
        </div>
      </div>

      {/* Main Score & Rank Card Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 translate-x-16 -translate-y-12 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Official Result • {attempt.category}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Submitted on {new Date(attempt.submittedAt).toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1.5 tracking-tight">
              {attempt.testTitle}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Candidate: <strong className="text-white">{attempt.userName}</strong> • Time Taken: <strong className="text-emerald-300">{formatSeconds(attempt.timeTakenSeconds)}</strong> of {formatSeconds(attempt.totalDurationSeconds)}
            </p>
          </div>

          {/* Simulated Rank & Percentile Trophy Block */}
          <div className="flex items-center space-x-3 bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 shadow-inner">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 shadow-md">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">
                Simulated All-India Rank
              </span>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-2xl font-black text-white">#{attempt.simulatedRank}</span>
                <span className="text-xs text-slate-400">/ {attempt.totalParticipants.toLocaleString()} candidates</span>
              </div>
              <span className="text-[11px] text-emerald-400 font-bold">
                {attempt.percentile} Percentile
              </span>
            </div>
          </div>
        </div>

        {/* Metric KPI Cards (Score, Accuracy, Negative Deduction, Percentage) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/50">
            <span className="text-[11px] text-slate-400 font-medium block">Total Marks Earned</span>
            <div className="flex items-baseline space-x-1 mt-1">
              <span className="text-2xl font-black text-emerald-400">{attempt.score}</span>
              <span className="text-xs text-slate-400 font-bold">/ {attempt.maxScore}</span>
            </div>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/50">
            <span className="text-[11px] text-slate-400 font-medium block">Accuracy Rate</span>
            <div className="flex items-baseline space-x-1 mt-1">
              <span className="text-2xl font-black text-teal-300">{attempt.accuracy}%</span>
              <span className="text-xs text-slate-400 font-bold">of attempted</span>
            </div>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/50">
            <span className="text-[11px] text-slate-400 font-medium block">Negative Deductions</span>
            <div className="flex items-baseline space-x-1 mt-1">
              <span className="text-2xl font-black text-rose-400">-{attempt.negativeMarksDeducted}</span>
              <span className="text-xs text-slate-400 font-bold">marks (-⅓ rule)</span>
            </div>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/50">
            <span className="text-[11px] text-slate-400 font-medium block">Percentage</span>
            <div className="flex items-baseline space-x-1 mt-1">
              <span className="text-2xl font-black text-white">{attempt.percentage}%</span>
              <span className={`text-xs font-bold ${attempt.percentage >= 45 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {attempt.percentage >= 45 ? 'Qualified' : 'Needs Practice'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Switcher: Summary Breakdown | Sector-wise Analysis | Question Solutions */}
      <div className="flex border-b border-slate-800 space-x-2">
        <button
          onClick={() => setActiveTab('summary')}
          className={`px-4 py-2.5 font-bold text-xs sm:text-sm border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'summary'
              ? 'border-emerald-500 text-emerald-400 font-black'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Performance Breakdown</span>
        </button>

        <button
          onClick={() => setActiveTab('sectors')}
          className={`px-4 py-2.5 font-bold text-xs sm:text-sm border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'sectors'
              ? 'border-emerald-500 text-emerald-400 font-black'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Sector-Wise Analysis</span>
        </button>

        <button
          onClick={() => setActiveTab('solutions')}
          className={`px-4 py-2.5 font-bold text-xs sm:text-sm border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'solutions'
              ? 'border-emerald-500 text-emerald-400 font-black'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Solution Viewer ({questions.length} Qs)</span>
        </button>
      </div>

      {/* TAB 1: SUMMARY BREAKDOWN */}
      {activeTab === 'summary' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Question Response Breakdown Cards */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <span>Attempts Distribution</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                  <CheckCircle className="w-4 h-4" />
                  <span>Correct Answers</span>
                </div>
                <span className="font-mono text-sm font-black text-emerald-400">
                  {attempt.correctCount}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-rose-500/10 border border-rose-500/30">
                <div className="flex items-center space-x-2 text-rose-400 font-bold">
                  <XCircle className="w-4 h-4" />
                  <span>Incorrect Answers</span>
                </div>
                <span className="font-mono text-sm font-black text-rose-400">
                  {attempt.incorrectCount}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-700/50 border border-slate-600/40">
                <div className="flex items-center space-x-2 text-slate-300 font-bold">
                  <AlertCircle className="w-4 h-4" />
                  <span>Unattempted / Skipped</span>
                </div>
                <span className="font-mono text-sm font-black text-slate-300">
                  {attempt.unattemptedCount}
                </span>
              </div>
            </div>

            {/* Visual Ratio Bar */}
            <div className="pt-2">
              <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">Distribution Visual</span>
              <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full"
                  style={{ width: `${(attempt.correctCount / questions.length) * 100}%` }}
                  title={`Correct: ${attempt.correctCount}`}
                ></div>
                <div
                  className="bg-rose-500 h-full"
                  style={{ width: `${(attempt.incorrectCount / questions.length) * 100}%` }}
                  title={`Incorrect: ${attempt.incorrectCount}`}
                ></div>
                <div
                  className="bg-slate-500 h-full"
                  style={{ width: `${(attempt.unattemptedCount / questions.length) * 100}%` }}
                  title={`Unattempted: ${attempt.unattemptedCount}`}
                ></div>
              </div>
            </div>
          </div>

          {/* Negative Marking Impact Analysis */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>Negative Marking Impact</span>
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed">
              Every incorrect response incurred a penalty of 1/3rd mark according to official exam rules.
            </p>

            <div className="bg-rose-950/30 border border-rose-800/40 rounded-xl p-4 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-300">Gross Marks Obtained:</span>
                <span className="font-bold text-white">
                  +{(attempt.correctCount * (attempt.maxScore / questions.length)).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-rose-400 font-semibold border-b border-rose-800/40 pb-2">
                <span>Negative Marks Deducted:</span>
                <span>-{attempt.negativeMarksDeducted}</span>
              </div>
              <div className="flex justify-between font-bold text-sm pt-1">
                <span className="text-slate-200">Net Normalized Score:</span>
                <span className="text-emerald-400">{attempt.score}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 italic">
              Tip: In competitive exams, avoiding uncertain guesses preserves marks and lifts All-India percentile.
            </p>
          </div>

          {/* Time Management Insight */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Pacing & Speed Analysis</span>
            </h3>

            <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-700/60 text-xs space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Exam Duration:</span>
                <span className="font-bold text-white">{formatSeconds(attempt.totalDurationSeconds)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Your Time Taken:</span>
                <span className="font-bold text-emerald-400">{formatSeconds(attempt.timeTakenSeconds)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Avg Time Per Question:</span>
                <span className="font-bold text-teal-300">
                  {Math.round(attempt.timeTakenSeconds / Math.max(1, questions.length))} seconds
                </span>
              </div>
            </div>

            <div className="pt-2 text-center">
              <button
                onClick={() => setActiveTab('solutions')}
                className="w-full py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition"
              >
                Inspect All Question Solutions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: OVERALL SECTOR-WISE (SUBJECT-WISE) ANALYSIS */}
      {activeTab === 'sectors' && (
        <div className="space-y-4">
          {/* Sector Matrix Header & Cards */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/80 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Target className="w-4 h-4 text-emerald-400" />
                  <span>Sector & Subject Proficiency Matrix</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Discrete curriculum breakdown. India GS, Chhattisgarh GS, Quantitative Aptitude, Reasoning, and Sciences are categorized individually.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 font-semibold bg-slate-900/60">
                    <th className="p-3">Subject / Sector</th>
                    <th className="p-3 text-center">Total Qs</th>
                    <th className="p-3 text-center text-emerald-400">Correct</th>
                    <th className="p-3 text-center text-rose-400">Incorrect</th>
                    <th className="p-3 text-center text-slate-400">Skipped</th>
                    <th className="p-3 text-center">Accuracy %</th>
                    <th className="p-3 text-right">Net Score</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {resolvedSectors && resolvedSectors.length > 0 ? (
                    resolvedSectors.map((sector, idx) => {
                      const badgeClass = getSubjectBadgeStyle(sector.subject);
                      return (
                        <tr key={idx} className="hover:bg-slate-800/60 transition">
                          <td className="p-3">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${badgeClass}`}>
                                {sector.subject}
                              </span>
                            </div>
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-slate-200">{sector.total}</td>
                          <td className="p-3 text-center font-mono font-bold text-emerald-400">{sector.correct}</td>
                          <td className="p-3 text-center font-mono font-bold text-rose-400">{sector.incorrect}</td>
                          <td className="p-3 text-center font-mono text-slate-400">{sector.unattempted}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full font-bold text-xs ${
                              sector.accuracy >= 75
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : sector.accuracy >= 50
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}>
                              {sector.accuracy}%
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono font-black text-emerald-400 text-sm">
                            {sector.score} / {sector.maxScore}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => {
                                setSubjectFilter(sector.subject);
                                setFilterSolution('all');
                                setActiveTab('solutions');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-[11px] font-semibold transition border border-slate-600 inline-flex items-center space-x-1"
                            >
                              <span>Inspect Qs</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-slate-400">
                        No subject breakdown available for this attempt.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: STEP-BY-STEP SOLUTION VIEWER */}
      {activeTab === 'solutions' && (
        <div className="space-y-4">
          {/* Solution Filters */}
          <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-slate-400 font-semibold mr-1">Outcome:</span>
                <button
                  onClick={() => setFilterSolution('all')}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    filterSolution === 'all'
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All ({questions.length})
                </button>
                <button
                  onClick={() => setFilterSolution('correct')}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    filterSolution === 'correct'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Correct ({attempt.correctCount})
                </button>
                <button
                  onClick={() => setFilterSolution('incorrect')}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    filterSolution === 'incorrect'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Incorrect ({attempt.incorrectCount})
                </button>
                <button
                  onClick={() => setFilterSolution('unattempted')}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    filterSolution === 'unattempted'
                      ? 'bg-slate-700 text-slate-200'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Skipped ({attempt.unattemptedCount})
                </button>
              </div>

              <div className="flex items-center space-x-3">
                <LanguageToggle />
                <span className="text-xs text-slate-400">
                  Showing <strong>{filteredQuestions.length}</strong> questions
                </span>
              </div>
            </div>

            {/* Subject Filters */}
            {resolvedSectors.length > 1 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-700/60 text-xs">
                <span className="text-slate-400 font-semibold flex items-center space-x-1 mr-1">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Subject:</span>
                </span>
                <button
                  onClick={() => setSubjectFilter('all')}
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold transition ${
                    subjectFilter === 'all'
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-700'
                  }`}
                >
                  All Subjects
                </button>
                {resolvedSectors.map((sec, sIdx) => {
                  const isSelected = subjectFilter === sec.subject;
                  return (
                    <button
                      key={sIdx}
                      onClick={() => setSubjectFilter(sec.subject)}
                      className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold transition border ${
                        isSelected
                          ? 'bg-slate-700 text-white border-slate-500'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-800'
                      }`}
                    >
                      {sec.subject} ({sec.total})
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Questions Solution List */}
          <div className="space-y-4">
            {filteredQuestions.map((q, idx) => {
              const candidateAnswer = attempt.responses[q.id];
              const isCorrect = candidateAnswer === q.correctOption;
              const isSkipped = candidateAnswer == null;
              const isExpanded = expandedExplanation[q.id] ?? true;
              const mockQId = `MOCK-${attempt.testId.replace('test-', '').toUpperCase()}-Q${String(idx + 1).padStart(2, '0')}`;
              const appearances = q.pypAppearances || (q.pypSource ? [{ examName: q.pypSource, year: 2022 }] : []);
              const isRepeated = appearances.length > 1;

              return (
                <div
                  key={q.id}
                  className={`bg-slate-900 border rounded-2xl p-5 space-y-4 transition ${
                    isCorrect
                      ? 'border-emerald-500/40'
                      : isSkipped
                      ? 'border-slate-800'
                      : 'border-rose-500/40'
                  }`}
                >
                  {/* Question Header with Unique IDs */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-300 font-bold text-xs border border-slate-700">
                        Q.{idx + 1}
                      </span>

                      {/* Unique Mock Question ID */}
                      <span className="px-2 py-0.5 rounded bg-slate-950 text-emerald-300 font-mono text-[11px] font-bold border border-emerald-500/30 flex items-center space-x-1" title="Unique Question ID in this Mock Test">
                        <span className="text-slate-400">Mock QID:</span>
                        <span>{mockQId}</span>
                      </span>

                      {/* Origin Provenance Badge */}
                      {q.originType === 'pyq' || appearances.length > 0 ? (
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold border border-amber-500/40 flex items-center space-x-1">
                          <History className="w-3 h-3 text-amber-400" />
                          <span>OFFICIAL PYQ</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-bold border border-indigo-500/40 flex items-center space-x-1">
                          <Sparkles className="w-3 h-3 text-indigo-400" />
                          <span>MOCK QUESTION</span>
                        </span>
                      )}

                      {/* Master Bank Question ID */}
                      <span className="px-2 py-0.5 rounded bg-slate-850 text-slate-400 font-mono text-[10px] border border-slate-700" title="Question Bank ID">
                        Bank QID: {q.id}
                      </span>

                      {q.chapterName && (
                        <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 font-medium text-[11px] border border-purple-500/30">
                          अध्याय: {q.chapterName}
                        </span>
                      )}
                      <span className="text-xs text-slate-400 font-medium">
                        {q.subject} • {q.topic}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      {isCorrect ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Correct (+{q.marks})</span>
                        </span>
                      ) : isSkipped ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-700 text-slate-300">
                          Skipped (0 Marks)
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center space-x-1">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Incorrect (-{q.negativeMarks})</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* PYQ Provenance Banner: Multi-Exam Appearances */}
                  {appearances.length > 0 && (
                    <div
                      className={`p-2.5 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                        isRepeated
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                          : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
                      }`}
                    >
                      <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                        {isRepeated ? (
                          <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-black text-[10px] flex items-center space-x-1 shrink-0">
                            <Flame className="w-3 h-3 fill-slate-950" />
                            <span>REPEATED PYQ • Asked in {appearances.length} Exams:</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-300 font-bold text-[10px] flex items-center space-x-1 shrink-0">
                            <History className="w-3 h-3" />
                            <span>OFFICIAL PYQ:</span>
                          </span>
                        )}

                        {appearances.map((app, appIdx) => (
                          <span
                            key={appIdx}
                            className={`px-2 py-0.5 rounded border text-[11px] font-semibold flex items-center space-x-1.5 ${
                              isRepeated
                                ? 'bg-slate-900/90 border-amber-500/30 text-amber-300'
                                : 'bg-slate-900/90 border-slate-700 text-slate-200'
                            }`}
                          >
                            <span className="text-emerald-400 font-bold">{app.examName}</span>
                            <span className="text-slate-500">•</span>
                            <span className="font-mono text-emerald-300">{app.year}</span>
                            {app.shift && <span className="text-slate-400 text-[10px]">({app.shift})</span>}
                          </span>
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider shrink-0">
                        Official Exam History
                      </span>
                    </div>
                  )}

                  {/* Mock Item Notice if not PYQ */}
                  {appearances.length === 0 && (
                    <div className="p-2.5 rounded-xl border border-indigo-500/20 bg-indigo-950/20 text-indigo-200 text-xs flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold text-[10px] flex items-center space-x-1 shrink-0">
                        <Sparkles className="w-3 h-3 text-indigo-400" />
                        <span>MOCK TEST ITEM</span>
                      </span>
                      <span className="text-[11px] text-slate-300">
                        Curated mock question designed for syllabus mastery and exam-hall simulation.
                      </span>
                    </div>
                  )}

                  {/* Benchmark Comparison Badge */}
                  <div className="flex items-center space-x-2 text-[11px]">
                    <div className="px-2.5 py-1 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 font-mono font-bold flex items-center space-x-1.5">
                      <Trophy className="w-3 h-3 text-indigo-400" />
                      <span>Ideal / Topper Benchmark: {q.idealTimeSeconds || (q.difficulty === 'Easy' ? 35 : q.difficulty === 'Hard' ? 75 : 50)}s</span>
                    </div>
                  </div>

                  {/* Dynamic Question Renderer */}
                  <QuestionRenderer
                    question={q}
                    selectedOption={candidateAnswer}
                    showSolution={true}
                  />

                  {/* Step-by-Step Explanation Accordion */}
                  <div className="bg-slate-800/70 rounded-xl p-4 border border-slate-700/60 text-xs">
                    <button
                      onClick={() => toggleExplanation(q.id)}
                      className="w-full flex items-center justify-between font-bold text-emerald-400 text-xs hover:text-emerald-300"
                    >
                      <span className="flex items-center space-x-1.5">
                        <HelpCircle className="w-4 h-4" />
                        <span>Step-by-Step Detailed Explanation</span>
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {isExpanded && (
                      <div className="mt-3 space-y-2 pt-2 border-t border-slate-700/50 text-slate-300 leading-relaxed">
                        <p>{q.explanation}</p>
                        {q.explanationHindi && (
                          <p className="text-emerald-300/90 border-t border-slate-700/30 pt-1.5">
                            {q.explanationHindi}
                          </p>
                        )}
                        {q.keyFactHindi && (
                          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2 text-amber-300 text-[11px] font-medium flex items-center space-x-1.5 mt-1.5">
                            <span className="font-bold">⚡ मुख्य तथ्य:</span>
                            <span>{q.keyFactHindi}</span>
                          </div>
                        )}
                        {q.pypSource && (
                          <span className="inline-block text-[10px] text-slate-400 font-semibold bg-slate-900/60 px-2 py-0.5 rounded mt-1">
                            Reference: {q.pypSource}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
