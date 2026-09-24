import React, { useState, useMemo } from 'react';
import { TestAttempt, SectorAnalysis } from '../types';
import { useAuth } from '../context/AuthContext';
import { normalizeSubjectName } from '../utils/taxonomyMigration';
import {
  TrendingUp,
  Award,
  Clock,
  CheckCircle,
  BarChart3,
  Calendar,
  ChevronRight,
  ArrowUpRight,
  Zap,
  Target,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  PieChart,
  Layers,
  HelpCircle,
  Check
} from 'lucide-react';

interface AnalyticsHubProps {
  attempts: TestAttempt[];
  onReviewAttempt: (attempt: TestAttempt) => void;
  onExploreTests: () => void;
}

interface ExamCutoffModel {
  id: string;
  name: string;
  totalMarks: number;
  expectedCutoffs: {
    UR: number;
    OBC: number;
    SC: number;
    ST: number;
    EWS: number;
  };
  negativeMarking: string;
  selectionNotes: string;
}

const CG_EXAM_CUTOFF_MODELS: ExamCutoffModel[] = [
  {
    id: 'cgpsc-prelims-gs',
    name: 'CGPSC State Service Prelims (Paper 1 - GS)',
    totalMarks: 200,
    expectedCutoffs: {
      UR: 132,
      OBC: 126,
      SC: 114,
      ST: 104,
      EWS: 122,
    },
    negativeMarking: '1/3rd (0.667 marks deduction)',
    selectionNotes: 'Chhattisgarh GS carries 50 questions (100 marks). High accuracy in CG History, Geography, and Current Affairs is decisive for clearing the prelims cut-off.',
  },
  {
    id: 'cgssb-hostel-warden',
    name: 'CG Vyapam Hostel Warden (छात्रावास अधीक्षक)',
    totalMarks: 150,
    expectedCutoffs: {
      UR: 102,
      OBC: 96,
      SC: 86,
      ST: 78,
      EWS: 92,
    },
    negativeMarking: '1/4th (0.25 marks deduction)',
    selectionNotes: 'Computer Awareness carries 50 marks alone with a mandatory 50% qualifying condition (25 marks). Hindi and Chhattisgarhi grammar determine top ranks.',
  },
  {
    id: 'cgssb-patwari-ri',
    name: 'CG Vyapam Patwari / Revenue Inspector (RI)',
    totalMarks: 150,
    expectedCutoffs: {
      UR: 108,
      OBC: 102,
      SC: 92,
      ST: 82,
      EWS: 98,
    },
    negativeMarking: '1/4th (0.25 marks deduction)',
    selectionNotes: 'Quantitative Aptitude (30 Qs) and Reasoning (15 Qs) determine the merit margin. High accuracy in calculation is critical.',
  },
  {
    id: 'cg-teacher-2026',
    name: 'CG Teacher / Assistant Teacher Recruitment 2026',
    totalMarks: 150,
    expectedCutoffs: {
      UR: 94,
      OBC: 88,
      SC: 78,
      ST: 70,
      EWS: 84,
    },
    negativeMarking: '1/4th (0.25 marks deduction)',
    selectionNotes: 'Child Development & Pedagogy (30 marks) combined with Hindi and English language proficiency form 60% of total score.',
  },
];

const CORE_SUBJECTS = [
  'Chhattisgarh General Studies',
  'India General Studies',
  'Reasoning',
  'Quantitative Aptitude',
  'General Hindi',
  'Chhattisgarhi Language',
  'Computer Knowledge',
  'General Science',
  'Child Pedagogy & Teaching Methodology',
];

export const AnalyticsHub: React.FC<AnalyticsHubProps> = ({
  attempts,
  onReviewAttempt,
  onExploreTests,
}) => {
  const { user } = useAuth();

  const totalAttempts = attempts.length;
  const avgAccuracy = totalAttempts > 0
    ? Math.round(attempts.reduce((sum, a) => sum + a.accuracy, 0) / totalAttempts)
    : 0;
  const avgScore = totalAttempts > 0
    ? (attempts.reduce((sum, a) => sum + a.score, 0) / totalAttempts).toFixed(1)
    : '0';
  const bestRank = totalAttempts > 0
    ? Math.min(...attempts.map(a => a.simulatedRank))
    : '-';

  // Selected Target Exam & Category for Cutoff Predictor
  const [selectedExamId, setSelectedExamId] = useState<string>('cgpsc-prelims-gs');
  const [selectedCategory, setSelectedCategory] = useState<'UR' | 'OBC' | 'SC' | 'ST' | 'EWS'>(
    (user?.categoryReservation as any) || 'OBC'
  );

  // Active Cutoff Model
  const activeCutoffModel = useMemo(() => {
    return CG_EXAM_CUTOFF_MODELS.find(m => m.id === selectedExamId) || CG_EXAM_CUTOFF_MODELS[0];
  }, [selectedExamId]);

  // Subject-Wise Aggregated Performance
  const subjectAggregates = useMemo(() => {
    const aggMap = new Map<string, { total: number; correct: number; incorrect: number; unattempted: number }>();

    CORE_SUBJECTS.forEach(s => {
      aggMap.set(s, { total: 0, correct: 0, incorrect: 0, unattempted: 0 });
    });

    attempts.forEach(att => {
      (att.sectorAnalysis || []).forEach(sec => {
        const cleanSubj = normalizeSubjectName(sec.subject);
        if (!aggMap.has(cleanSubj)) {
          aggMap.set(cleanSubj, { total: 0, correct: 0, incorrect: 0, unattempted: 0 });
        }
        const curr = aggMap.get(cleanSubj)!;
        curr.total += sec.total;
        curr.correct += sec.correct;
        curr.incorrect += sec.incorrect;
        curr.unattempted += sec.unattempted;
      });
    });

    return Array.from(aggMap.entries()).map(([subject, stats]) => {
      const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
      let status: 'Mastered' | 'Strong' | 'Developing' | 'Needs Focus' = 'Needs Focus';
      if (stats.total === 0) status = 'Needs Focus';
      else if (accuracy >= 80) status = 'Mastered';
      else if (accuracy >= 65) status = 'Strong';
      else if (accuracy >= 45) status = 'Developing';

      return {
        subject,
        ...stats,
        accuracy,
        status,
      };
    });
  }, [attempts]);

  // Projected Score & Probability of Selection Calculation
  const predictionStats = useMemo(() => {
    const targetCutoff = activeCutoffModel.expectedCutoffs[selectedCategory] || 110;
    const maxMarks = activeCutoffModel.totalMarks;

    // Estimate user projected score normalized to this exam's totalMarks
    let projectedScore = 0;
    if (totalAttempts > 0) {
      const totalScorePercent = attempts.reduce((sum, a) => sum + (a.score / Math.max(1, a.maxScore)), 0) / totalAttempts;
      projectedScore = Math.round(totalScorePercent * maxMarks * 10) / 10;
    } else {
      projectedScore = Math.round(maxMarks * 0.45);
    }

    const margin = projectedScore - targetCutoff;

    let probability: 'High' | 'Moderate' | 'Borderline' | 'Needs Revision' = 'Moderate';
    let probabilityPercent = 50;

    if (margin >= 10) {
      probability = 'High';
      probabilityPercent = Math.min(95, 75 + Math.round(margin * 1.5));
    } else if (margin >= 0) {
      probability = 'Moderate';
      probabilityPercent = 60 + Math.round(margin * 1.4);
    } else if (margin >= -12) {
      probability = 'Borderline';
      probabilityPercent = Math.max(35, 55 + Math.round(margin * 1.5));
    } else {
      probability = 'Needs Revision';
      probabilityPercent = Math.max(15, 30 + Math.round(margin));
    }

    return {
      targetCutoff,
      projectedScore,
      margin,
      probability,
      probabilityPercent,
    };
  }, [activeCutoffModel, selectedCategory, totalAttempts, attempts]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 font-sans">
      {/* Overview Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="max-w-2xl">
          <div className="flex items-center space-x-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center">
              <BarChart3 className="w-3 h-3 mr-1" />
              ANALYTICS & ADAPTIVE INTELLIGENCE
            </span>
            <span className="text-xs text-slate-400">CGPSC & Vyapam Standard</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Performance Hub & Selection Predictor
          </h1>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            Monitor subject accuracy, track negative marking penalties, and simulate your real-time qualifying probability against actual CG recruitment cutoffs.
          </p>
        </div>

        {/* Global Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800">
          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 font-medium block">Tests Attempted</span>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-2xl font-black text-white">{totalAttempts}</span>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">Active</span>
            </div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 font-medium block">Average Accuracy</span>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-2xl font-black text-teal-300">{avgAccuracy}%</span>
              <span className="text-[10px] text-teal-400 font-semibold">Normalized</span>
            </div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 font-medium block">Average Score</span>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-2xl font-black text-emerald-400">{avgScore}</span>
              <span className="text-[10px] text-slate-400 font-semibold">Marks</span>
            </div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 font-medium block">Simulated Rank</span>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-2xl font-black text-amber-400">#{bestRank}</span>
              <span className="text-[10px] text-amber-400 font-semibold">Top Percentile</span>
            </div>
          </div>
        </div>
      </div>

      {/* CUTOFF PREDICTOR & RADAR SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Official Exam Cutoff Predictor Engine */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
            <Target className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-black text-white">Expected Cutoff Predictor</h2>
              <p className="text-[11px] text-slate-400">Simulate your probability of selection for upcoming CG exams</p>
            </div>
          </div>

          {/* Controls: Target Exam & Reservation Category */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Target Examination</label>
              <select
                value={selectedExamId}
                onChange={e => setSelectedExamId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
              >
                {CG_EXAM_CUTOFF_MODELS.map(model => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Reservation Category</label>
              <div className="grid grid-cols-5 gap-1.5">
                {(['UR', 'OBC', 'SC', 'ST', 'EWS'] as const).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`py-1.5 rounded-xl text-xs font-bold transition text-center cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                        : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Visual Prediction Gauge */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">Estimated Selection Probability</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${
                  predictionStats.probability === 'High'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : predictionStats.probability === 'Moderate'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                }`}
              >
                {predictionStats.probability} ({predictionStats.probabilityPercent}%)
              </span>
            </div>

            {/* Probability Progress Bar */}
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  predictionStats.probability === 'High'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : predictionStats.probability === 'Moderate'
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                    : 'bg-gradient-to-r from-rose-500 to-amber-500'
                }`}
                style={{ width: `${predictionStats.probabilityPercent}%` }}
              />
            </div>

            {/* Score Comparison Display */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-medium">Your Projected Score</span>
                <span className="text-lg font-black text-white mt-0.5 block font-mono">
                  {predictionStats.projectedScore} <span className="text-xs font-normal text-slate-400">/ {activeCutoffModel.totalMarks}</span>
                </span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-medium">Expected Cutoff ({selectedCategory})</span>
                <span className="text-lg font-black text-emerald-400 mt-0.5 block font-mono">
                  {predictionStats.targetCutoff} <span className="text-xs font-normal text-slate-400">Marks</span>
                </span>
              </div>
            </div>

            {/* Margin Tag */}
            <div className="text-[11px] text-slate-300 flex items-center justify-between">
              <span>Safety Margin:</span>
              <strong
                className={
                  predictionStats.margin >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'
                }
              >
                {predictionStats.margin >= 0 ? `+${predictionStats.margin.toFixed(1)} Marks Above Cutoff` : `${predictionStats.margin.toFixed(1)} Marks Below Cutoff`}
              </strong>
            </div>
          </div>

          {/* Strategic Exam Advice */}
          <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-3.5 text-xs text-slate-300 space-y-1.5">
            <span className="text-[10px] font-black uppercase text-emerald-400 flex items-center tracking-wider">
              <Sparkles className="w-3 h-3 mr-1 fill-emerald-400" />
              Exam Strategy & Negative Marking Note
            </span>
            <p className="leading-relaxed text-[11px] text-slate-300">
              {activeCutoffModel.selectionNotes}
            </p>
          </div>
        </div>

        {/* Right Column: Subject-Wise Strengths & Weaknesses (9 Core Subjects) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <PieChart className="w-5 h-5 text-teal-400" />
              <div>
                <h2 className="text-base font-black text-white">Subject-Wise Strength & Weakness Breakdown</h2>
                <p className="text-[11px] text-slate-400">Diagnostic performance across the 9 core exam subjects</p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-slate-400 hidden sm:inline">Accuracy Thresholds: ≥80% Mastered | &lt;45% Critical Focus</span>
          </div>

          {/* 9 Core Subjects List */}
          <div className="space-y-2.5">
            {subjectAggregates.map(sub => {
              return (
                <div
                  key={sub.subject}
                  className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:border-slate-700 transition"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-bold text-xs text-white truncate">{sub.subject}</span>
                      <span
                        className={`px-2 py-0.2 rounded-md text-[9px] font-black border ${
                          sub.status === 'Mastered'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : sub.status === 'Strong'
                            ? 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                            : sub.status === 'Developing'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        }`}
                      >
                        {sub.status}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          sub.accuracy >= 75
                            ? 'bg-emerald-400'
                            : sub.accuracy >= 55
                            ? 'bg-teal-400'
                            : sub.accuracy >= 40
                            ? 'bg-amber-400'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.max(4, sub.accuracy)}%` }}
                      />
                    </div>
                  </div>

                  {/* Quantitative Stats */}
                  <div className="flex items-center space-x-4 shrink-0 text-xs">
                    <div className="text-right">
                      <span className="text-slate-400 text-[10px] block">Accuracy</span>
                      <span className="font-black text-emerald-400">{sub.accuracy}%</span>
                    </div>
                    <div className="text-right border-l border-slate-800 pl-3">
                      <span className="text-slate-400 text-[10px] block">Qs Solved</span>
                      <span className="font-bold text-slate-200">{sub.correct} / {sub.total}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Attempt History List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white">Completed Mock Tests & Previous Attempts</h2>
            <p className="text-xs text-slate-400">Click on any attempt to inspect question solutions and sector analysis.</p>
          </div>
          <button
            onClick={onExploreTests}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition flex items-center space-x-1"
          >
            <span>Take New Test</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {attempts.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No mock tests attempted yet. Practice your first CGSSB or CGPSC test to see your analytics!
          </div>
        ) : (
          <div className="space-y-3">
            {attempts.map(att => (
              <div
                key={att.id}
                onClick={() => onReviewAttempt(att)}
                className="bg-slate-800/70 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/50 rounded-2xl p-4 transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div>
                  <div className="flex items-center space-x-2 mb-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-emerald-400 border border-slate-700">
                      {att.category}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{new Date(att.submittedAt).toLocaleDateString()}</span>
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-white group-hover:text-emerald-300 transition-colors">
                    {att.testTitle}
                  </h3>
                  <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1">
                    <span>Rank: <strong className="text-amber-400">#{att.simulatedRank}</strong></span>
                    <span>•</span>
                    <span>Accuracy: <strong className="text-teal-300">{att.accuracy}%</strong></span>
                    <span>•</span>
                    <span>Neg. penalty: <strong className="text-rose-400">-{att.negativeMarksDeducted}</strong></span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 sm:border-l sm:border-slate-700/60 sm:pl-4">
                  <div className="text-right">
                    <span className="text-base font-black text-emerald-400 block font-mono">
                      {att.score} / {att.maxScore}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">{att.percentage}% score</span>
                  </div>
                  <button className="p-2 rounded-xl bg-slate-700 group-hover:bg-emerald-500 text-slate-300 group-hover:text-slate-950 transition">
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
