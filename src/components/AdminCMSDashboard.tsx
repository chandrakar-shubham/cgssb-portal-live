import React from 'react';
import {
  Layers,
  FolderTree,
  FileText,
  Sparkles,
  Smartphone,
  Crown,
  Users,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Database,
  ArrowRight,
  Zap,
  BarChart2,
  Lock,
  Code2
} from 'lucide-react';
import { MockTest, Question, PreviousYearPaper, TestAttempt } from '../types';

interface AdminCMSDashboardProps {
  tests: MockTest[];
  questions: Question[];
  pypPapers: PreviousYearPaper[];
  attempts?: TestAttempt[];
  onNavigateTab: (tabId: string) => void;
}

export const AdminCMSDashboard: React.FC<AdminCMSDashboardProps> = ({
  tests,
  questions,
  pypPapers,
  attempts = [],
  onNavigateTab,
}) => {
  const publishedTests = tests.filter(t => t.isPublished !== false);
  const proTests = tests.filter(t => t.isPro);
  const freeTests = tests.filter(t => !t.isPro);

  // Subject breakdown for questions
  const subjectCounts = questions.reduce<Record<string, number>>((acc, q) => {
    const subj = q.subject || 'General Studies';
    acc[subj] = (acc[subj] || 0) + 1;
    return acc;
  }, {});

  const totalSubjectEntries = Object.entries(subjectCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* CMS Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-900/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Modular Central Content Management System (CMS)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Exam Platform Control & Catalog CMS
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Canonical repository for tests, question banks, previous year exam papers, and Testbook-style Pass Pro monetization subscriptions.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap gap-2.5 shrink-0">
            <button
              onClick={() => onNavigateTab('admin-tests')}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center space-x-2 transition shadow-lg shadow-indigo-600/20 active:scale-95 cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              <span>Manage Tests</span>
            </button>
            <button
              onClick={() => onNavigateTab('admin-questions')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center space-x-2 transition active:scale-95 cursor-pointer"
            >
              <FolderTree className="w-4 h-4 text-emerald-400" />
              <span>Question Bank</span>
            </button>
            <button
              onClick={() => onNavigateTab('admin-pyp')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center space-x-2 transition active:scale-95 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-blue-400" />
              <span>PYP Ingestion</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-indigo-500/40 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Live Mock Tests</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{publishedTests.length}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center space-x-2">
            <span className="text-emerald-400 font-bold">{freeTests.length} Free</span>
            <span>•</span>
            <span className="text-amber-400 font-bold">{proTests.length} Pass Pro</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-indigo-500/40 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Question Repository</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <FolderTree className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{questions.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Bilingual Hindi & English items
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-indigo-500/40 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Official PYP Papers</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{pypPapers.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            CGPSC & Vyapam (2012–2024)
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-indigo-500/40 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Pass Pro Tier</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Crown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-400">₹99 - ₹499</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Testbook model monetization active
          </div>
        </div>
      </div>

      {/* Two Column Layout: Module Architecture & Question Bank Taxonomy */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Modular CMS Architecture */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Code2 className="w-5 h-5 text-indigo-400" />
                <h2 className="text-base font-bold text-white">Modular System Architecture</h2>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-indigo-300">
                Independent Canonical Modules
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Module 1 */}
              <div 
                onClick={() => onNavigateTab('admin-tests')}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/50 transition cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition">
                      <Layers className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm text-white group-hover:text-indigo-300 transition">Test Catalog CMS</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition" />
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Configures time limit, section breakdown, marking schemes (+1/-0.33, +2/-0.66), and 1-click Pro Pass access locks.
                </p>
              </div>

              {/* Module 2 */}
              <div 
                onClick={() => onNavigateTab('admin-questions')}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/50 transition cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition">
                      <FolderTree className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm text-white group-hover:text-emerald-300 transition">Question Bank Module</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition" />
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Bilingual Hindi/English question schema with subject, topic, subtopic taxonomy, explanations, and PYP cross-referencing.
                </p>
              </div>

              {/* Module 3 */}
              <div 
                onClick={() => onNavigateTab('admin-pyp')}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/50 transition cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm text-white group-hover:text-blue-300 transition">PYP Ingestion Engine</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition" />
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Accepts raw paper text/OCR, builds question matrices, and converts historical archives into playable mock exams.
                </p>
              </div>

              {/* Module 4 */}
              <div 
                onClick={() => onNavigateTab('admin-android-api')}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/50 transition cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm text-white group-hover:text-purple-300 transition">Mobile REST Endpoints</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400 transition" />
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Headless JSON API endpoints (`/api/tests`, `/api/questions`, `/api/pyp`) for Android App and external clients.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Question Bank Subject Distribution */}
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <BarChart2 className="w-4 h-4 text-indigo-400" />
                <span>Subject Inventory</span>
              </h2>
              <span className="text-[11px] font-mono text-slate-400">{questions.length} Total</span>
            </div>

            <div className="space-y-3">
              {totalSubjectEntries.slice(0, 6).map(([subject, count]) => {
                const percentage = Math.round((count / (questions.length || 1)) * 100);
                return (
                  <div key={subject} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium truncate max-w-[180px]">{subject}</span>
                      <span className="font-mono text-slate-400 font-semibold">{count} Qs ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-indigo-500 h-1.5 rounded-full" 
                        style={{ width: `${Math.max(5, percentage)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => onNavigateTab('admin-questions')}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-bold transition flex items-center justify-center space-x-1.5 border border-slate-700 cursor-pointer"
            >
              <span>Explore All Questions & Syllabus</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
