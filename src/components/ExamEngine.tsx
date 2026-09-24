import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MockTest,
  Question,
  QuestionPaletteStatus,
  TestAttempt,
  ExamCategory
} from '../types';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Eye,
  Maximize2,
  Minimize2,
  ShieldAlert,
  Send,
  Flame,
  History,
  Hash,
  Timer,
  Trophy,
  Sparkles,
  Bookmark,
  Layers,
  BarChart2,
  PieChart,
  LayoutGrid,
  CheckCircle,
  ArrowRight,
  SlidersHorizontal,
  ChevronDown,
  X
} from 'lucide-react';
import { QuestionRenderer } from './QuestionRenderer';
import { LanguageToggle } from './LanguageToggle';
import { useLanguage } from '../context/LanguageContext';
import { isQuestionBookmarked, toggleBookmark, BOOKMARKS_CHANGED_EVENT } from '../utils/bookmarkStorage';

interface ExamEngineProps {
  test: MockTest;
  questions: Question[];
  onExit: () => void;
  onSubmit: (attemptData: {
    testId: string;
    timeTakenSeconds: number;
    responses: Record<string, 'A' | 'B' | 'C' | 'D' | null>;
    questionStatuses: Record<string, QuestionPaletteStatus>;
  }) => void;
}

export const ExamEngine: React.FC<ExamEngineProps> = ({
  test,
  questions,
  onExit,
  onSubmit,
}) => {
  const { t } = useLanguage();

  // Timer State
  const initialDurationSeconds = (test.durationMinutes || 15) * 60;
  const [secondsRemaining, setSecondsRemaining] = useState(initialDurationSeconds);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  // Active Navigation State
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Individual Question Timers
  const [questionTimes, setQuestionTimes] = useState<Record<string, number>>({});
  const activeQuestionStartTimeRef = useRef<number>(Date.now());
  const [activeQuestionLiveSeconds, setActiveQuestionLiveSeconds] = useState(0);

  // Candidate Response State
  const [responses, setResponses] = useState<Record<string, 'A' | 'B' | 'C' | 'D' | null>>({});
  const [questionStatuses, setQuestionStatuses] = useState<Record<string, QuestionPaletteStatus>>(() => {
    const initial: Record<string, QuestionPaletteStatus> = {};
    questions.forEach((q, index) => {
      initial[q.id] = index === 0 ? 'unanswered' : 'not_visited';
    });
    return initial;
  });

  // UI state
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isTimeOutModal, setIsTimeOutModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [bookmarkKey, setBookmarkKey] = useState(0);
  const [paletteMobileOpen, setPaletteMobileOpen] = useState(false);
  const [isSectionSidebarOpen, setIsSectionSidebarOpen] = useState(true);
  const [paletteViewMode, setPaletteViewMode] = useState<'grid' | 'sections'>('grid');

  const containerRef = useRef<HTMLDivElement>(null);

  // Current Section & Questions
  const currentSection = test.sections[currentSectionIndex] || {
    id: 'sec-all',
    name: 'All Questions',
    questionIds: questions.map(q => q.id),
  };

  const sectionQuestions = useMemo(() => {
    if (!questions || questions.length === 0) return [];
    if (!currentSection || !Array.isArray(currentSection.questionIds) || currentSection.questionIds.length === 0) {
      return questions;
    }
    const matched = questions.filter(q => currentSection.questionIds.includes(q.id));
    return matched.length > 0 ? matched : questions;
  }, [questions, currentSection]);

  const activeQuestion = sectionQuestions[currentQuestionIndex] || sectionQuestions[0] || questions[0];

  // Calculate live section-wise breakdown & summary statistics
  const sectionSummaries = useMemo(() => {
    return test.sections.map((sec, idx) => {
      const secQIds = sec.questionIds || [];
      const secQs = questions.filter(q => secQIds.includes(q.id));

      let answered = 0;
      let unanswered = 0;
      let marked = 0;
      let notVisited = 0;

      secQIds.forEach(qId => {
        const status = questionStatuses[qId] || 'not_visited';
        if (status === 'answered' || status === 'answered_and_marked') {
          answered++;
        } else if (status === 'unanswered') {
          unanswered++;
        } else if (status === 'marked_for_review') {
          marked++;
        } else {
          notVisited++;
        }
      });

      const total = secQIds.length || secQs.length || 0;
      const progressPercent = total > 0 ? Math.round((answered / total) * 100) : 0;
      const dominantSubject = secQs[0]?.subject || sec.name;

      return {
        index: idx,
        id: sec.id,
        name: sec.name,
        dominantSubject,
        total,
        answered,
        unanswered,
        marked,
        notVisited,
        progressPercent,
        isCurrent: idx === currentSectionIndex
      };
    });
  }, [test.sections, questions, questionStatuses, currentSectionIndex]);

  // Helper to commit time on current active question
  const recordActiveQuestionTime = () => {
    if (!activeQuestion) return;
    const now = Date.now();
    const elapsedSeconds = Math.max(1, Math.round((now - activeQuestionStartTimeRef.current) / 1000));
    setQuestionTimes(prev => ({
      ...prev,
      [activeQuestion.id]: (prev[activeQuestion.id] || 0) + elapsedSeconds,
    }));
    activeQuestionStartTimeRef.current = Date.now();
  };

  // Live second counter for active question
  useEffect(() => {
    activeQuestionStartTimeRef.current = Date.now();
    setActiveQuestionLiveSeconds(questionTimes[activeQuestion?.id] || 0);

    const interval = setInterval(() => {
      const now = Date.now();
      const currentDelta = Math.round((now - activeQuestionStartTimeRef.current) / 1000);
      setActiveQuestionLiveSeconds((questionTimes[activeQuestion?.id] || 0) + currentDelta);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeQuestion?.id]);

  // Calculate unique question ID within this specific mock test context
  let overallMockIndex = 0;
  for (let i = 0; i < currentSectionIndex; i++) {
    const sec = test.sections[i];
    if (sec) overallMockIndex += sec.questionIds.length;
  }
  overallMockIndex += (currentQuestionIndex + 1);
  const mockQuestionUniqueId = `MOCK-${test.id.replace('test-', '').toUpperCase()}-Q${String(overallMockIndex).padStart(2, '0')}`;
  const activeAppearances = activeQuestion?.pypAppearances || (activeQuestion?.pypSource ? [{ examName: activeQuestion.pypSource, year: 2022 }] : []);

  // Timer Tick & Auto-submit
  useEffect(() => {
    if (!isTimerRunning) return;

    const interval = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsTimerRunning(false);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const handleAutoSubmit = () => {
    setIsTimeOutModal(true);
    setTimeout(() => {
      doFinalSubmit();
    }, 2500);
  };

  const doFinalSubmit = () => {
    recordActiveQuestionTime();
    const timeTaken = initialDurationSeconds - secondsRemaining;
    onSubmit({
      testId: test.id,
      timeTakenSeconds: Math.max(1, timeTaken),
      responses,
      questionStatuses,
    });
  };

  // Status computation for active question when visiting
  const selectQuestion = (qIndex: number) => {
    const targetQ = sectionQuestions[qIndex];
    if (!targetQ) return;

    recordActiveQuestionTime();
    setCurrentQuestionIndex(qIndex);

    // If currently 'not_visited', mark it 'unanswered'
    setQuestionStatuses(prev => {
      if (prev[targetQ.id] === 'not_visited') {
        return { ...prev, [targetQ.id]: 'unanswered' };
      }
      return prev;
    });
  };

  // Section switcher
  const selectSection = (sIndex: number) => {
    recordActiveQuestionTime();
    setCurrentSectionIndex(sIndex);
    setCurrentQuestionIndex(0);
    const newSection = test.sections[sIndex];
    if (newSection && newSection.questionIds.length > 0) {
      const firstQId = newSection.questionIds[0];
      setQuestionStatuses(prev => {
        if (prev[firstQId] === 'not_visited') {
          return { ...prev, [firstQId]: 'unanswered' };
        }
        return prev;
      });
    }
  };

  // Option selection
  const handleOptionSelect = (optionId: 'A' | 'B' | 'C' | 'D') => {
    setResponses(prev => ({
      ...prev,
      [activeQuestion.id]: optionId,
    }));
  };

  // Save & Next Action
  const handleSaveAndNext = () => {
    const hasSelected = responses[activeQuestion.id] != null;
    setQuestionStatuses(prev => ({
      ...prev,
      [activeQuestion.id]: hasSelected ? 'answered' : 'unanswered',
    }));

    // Advance to next question or section
    if (currentQuestionIndex < sectionQuestions.length - 1) {
      selectQuestion(currentQuestionIndex + 1);
    } else if (currentSectionIndex < test.sections.length - 1) {
      selectSection(currentSectionIndex + 1);
    }
  };

  // Clear Response Action
  const handleClearResponse = () => {
    setResponses(prev => ({
      ...prev,
      [activeQuestion.id]: null,
    }));
    setQuestionStatuses(prev => ({
      ...prev,
      [activeQuestion.id]: 'unanswered',
    }));
  };

  // Mark for Review & Next
  const handleMarkForReview = () => {
    const hasSelected = responses[activeQuestion.id] != null;
    setQuestionStatuses(prev => ({
      ...prev,
      [activeQuestion.id]: hasSelected ? 'answered_and_marked' : 'marked_for_review',
    }));

    if (currentQuestionIndex < sectionQuestions.length - 1) {
      selectQuestion(currentQuestionIndex + 1);
    } else if (currentSectionIndex < test.sections.length - 1) {
      selectSection(currentSectionIndex + 1);
    }
  };

  // Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // Format Timer string
  const formatTime = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    return `${hours > 0 ? String(hours).padStart(2, '0') + ':' : ''}${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // Color changing timer: Red in the last 5 minutes (300 seconds)
  const isUrgentTimer = secondsRemaining <= 300;
  const isWarningTimer = secondsRemaining <= 600 && !isUrgentTimer;

  // Question counts for palette
  const answeredCount = Object.values(questionStatuses).filter(
    s => s === 'answered' || s === 'answered_and_marked'
  ).length;
  const unansweredCount = Object.values(questionStatuses).filter(
    s => s === 'unanswered'
  ).length;
  const markedCount = Object.values(questionStatuses).filter(
    s => s === 'marked_for_review' || s === 'answered_and_marked'
  ).length;
  const notVisitedCount = questions.length - (answeredCount + unansweredCount + (markedCount - (Object.values(questionStatuses).filter(s => s === 'answered_and_marked').length)));

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col select-none"
    >
      {/* 1. TOP BAR: Countdown, Sections, Controls, Submit */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-2.5 flex items-center justify-between sticky top-0 z-30 shadow-lg">
        {/* Left: Brand & Test Name */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-extrabold text-sm">
            CG
          </div>
          <div className="max-w-[140px] sm:max-w-md truncate">
            <h1 className="text-xs sm:text-sm font-bold text-white truncate">{test.title}</h1>
            <span className="text-[10px] text-emerald-400 font-semibold block">
              +{test.marksPerQuestion} / -{test.negativeMarksPerQuestion.toFixed(2)} negative marking
            </span>
          </div>
        </div>

        {/* Center: Live Countdown Timer & Language Switcher */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <LanguageToggle />

          <div
            className={`px-3 py-1.5 rounded-xl border flex items-center space-x-2 font-mono font-bold tracking-wider transition-all duration-300 ${
              isUrgentTimer
                ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse shadow-lg shadow-rose-500/20'
                : isWarningTimer
                ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                : 'bg-slate-800/90 border-slate-700 text-slate-100'
            }`}
          >
            <Clock className={`w-4 h-4 ${isUrgentTimer ? 'text-rose-400' : 'text-emerald-400'}`} />
            <div className="text-xs sm:text-sm">
              <span className="text-[10px] text-slate-400 font-normal mr-1.5 hidden sm:inline">{t('time_left', 'Time Left')}:</span>
              <span className="font-extrabold">{formatTime(secondsRemaining)}</span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleFullscreen}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700 text-xs hidden sm:flex items-center"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setPaletteMobileOpen(!paletteMobileOpen)}
            className="md:hidden px-2.5 py-1.5 bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold"
          >
            Palette
          </button>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm transition shadow-lg shadow-emerald-500/20 flex items-center space-x-1.5 active:scale-95"
          >
            <Send className="w-3.5 h-3.5 fill-slate-950" />
            <span>Submit Test</span>
          </button>
        </div>
      </header>

      {/* 2. SECTION SWITCHER SUB-HEADER */}
      <div className="bg-slate-900/80 border-b border-slate-800 px-3 sm:px-6 py-2 flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setIsSectionSidebarOpen(!isSectionSidebarOpen)}
            className={`hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition border cursor-pointer ${
              isSectionSidebarOpen
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
            }`}
            title="Toggle Section Summary Sidebar"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>Section Sidebar</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-200">
              {sectionSummaries.length}
            </span>
          </button>

          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline mr-1">
            Sections:
          </span>

          <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
            {test.sections.map((sec, idx) => {
              const summary = sectionSummaries[idx];
              const isCurrent = currentSectionIndex === idx;
              return (
                <button
                  key={sec.id}
                  onClick={() => selectSection(idx)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center space-x-1.5 cursor-pointer ${
                    isCurrent
                      ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                  }`}
                >
                  <span>{sec.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-extrabold ${
                    isCurrent ? 'bg-slate-950/40 text-white' : 'bg-slate-900 text-slate-400'
                  }`}>
                    {summary ? `${summary.answered}/${summary.total}` : sec.questionIds.length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="text-[11px] text-slate-400 font-semibold hidden md:flex items-center space-x-2 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Question {currentQuestionIndex + 1} of {sectionQuestions.length} in this section</span>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE + SECTION SIDEBAR + PALETTE LAYOUT */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT SECTION SUMMARY SIDEBAR (Collapsible Desktop) */}
        {isSectionSidebarOpen && (
          <aside className="w-72 bg-slate-900/95 backdrop-blur-md border-r border-slate-800 flex flex-col justify-between p-3.5 z-20 shrink-0 hidden lg:flex">
            <div className="space-y-3 overflow-y-auto custom-scrollbar pr-1">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">
                      Section Summary
                    </h3>
                    <p className="text-[10px] text-slate-400">Subject Overview & Jump</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsSectionSidebarOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                  title="Collapse Sidebar"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

              {/* Overall Progress Widget */}
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Exam Attempted</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    {answeredCount} / {questions.length} ({questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                    style={{ width: `${questions.length > 0 ? (answeredCount / questions.length) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* List of Section Summary Cards */}
              <div className="space-y-2">
                {sectionSummaries.map((secSummary) => {
                  const isCurrent = secSummary.isCurrent;
                  return (
                    <div
                      key={secSummary.id}
                      onClick={() => selectSection(secSummary.index)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer space-y-2 ${
                        isCurrent
                          ? 'bg-emerald-950/40 border-emerald-500/60 shadow-lg shadow-emerald-950/30 ring-1 ring-emerald-500/40'
                          : 'bg-slate-950/50 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center space-x-1.5">
                            {isCurrent && (
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                            )}
                            <h4 className={`text-xs font-bold truncate ${isCurrent ? 'text-emerald-300' : 'text-slate-200'}`}>
                              {secSummary.name}
                            </h4>
                          </div>
                          <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                            {secSummary.dominantSubject}
                          </span>
                        </div>

                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-black shrink-0 ${
                          isCurrent ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {secSummary.total} Qs
                        </span>
                      </div>

                      {/* Section Progress Bar */}
                      <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-400 transition-all duration-300"
                          style={{ width: `${secSummary.progressPercent}%` }}
                        />
                      </div>

                      {/* Status Pills Grid */}
                      <div className="grid grid-cols-4 gap-1 text-[9px] font-mono font-bold text-center">
                        <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 py-0.5 rounded" title="Answered">
                          {secSummary.answered} <span className="text-[8px] font-sans">Ans</span>
                        </div>
                        <div className="bg-rose-500/15 border border-rose-500/30 text-rose-300 py-0.5 rounded" title="Unanswered">
                          {secSummary.unanswered} <span className="text-[8px] font-sans">Unans</span>
                        </div>
                        <div className="bg-purple-500/15 border border-purple-500/30 text-purple-300 py-0.5 rounded" title="Marked for Review">
                          {secSummary.marked} <span className="text-[8px] font-sans">Rev</span>
                        </div>
                        <div className="bg-slate-800 border border-slate-700 text-slate-400 py-0.5 rounded" title="Not Visited">
                          {secSummary.notVisited} <span className="text-[8px] font-sans">Left</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Section Switcher Tip */}
            <div className="pt-3 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
              <span>Click any section card to jump</span>
              <ArrowRight className="w-3 h-3 text-emerald-400" />
            </div>
          </aside>
        )}

        {/* Workspace: Question Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8 flex flex-col justify-between">
          <div className="max-w-3xl mx-auto w-full space-y-6">
            {/* Question Header meta with Unique IDs, Question Timer & Topper Benchmark */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 font-black text-sm border border-emerald-500/30">
                  #{currentQuestionIndex + 1}
                </span>

                {/* Individual Question Live Stopwatch */}
                <div
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono text-xs font-bold flex items-center space-x-1.5"
                  title="Time spent on this specific question"
                >
                  <Timer className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px] text-slate-400 font-sans hidden sm:inline">{t('time_spent', 'Time')}:</span>
                  <span>{formatTime(activeQuestionLiveSeconds)}</span>
                </div>

                {/* Topper / Ideal Benchmark Time */}
                <div
                  className="px-2.5 py-1 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 font-mono text-xs font-bold flex items-center space-x-1.5"
                  title="Target / Topper Benchmark Time"
                >
                  <Trophy className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-[10px] text-indigo-300/80 font-sans hidden sm:inline">{t('topper_time', 'Topper')}:</span>
                  <span>{activeQuestion.idealTimeSeconds || (activeQuestion.difficulty === 'Easy' ? 35 : activeQuestion.difficulty === 'Hard' ? 75 : 50)}s</span>
                </div>

                {/* Unique Question ID in Mock context */}
                <span className="px-2 py-0.5 rounded bg-slate-950 text-emerald-300 font-mono text-[11px] font-bold border border-emerald-500/30 flex items-center space-x-1" title="Unique Question ID in this Mock Test">
                  <span className="text-slate-400">Mock QID:</span>
                  <span>{mockQuestionUniqueId}</span>
                </span>

                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-medium border border-slate-700">
                  {activeQuestion.subject}
                </span>

                {/* Chapter Name Badge */}
                {activeQuestion.chapterName && (
                  <span className="px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 text-[11px] font-bold border border-purple-500/30 flex items-center space-x-1">
                    <span className="text-[10px] text-purple-400">अध्याय:</span>
                    <span>{activeQuestion.chapterName}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2 text-xs font-semibold shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    toggleBookmark(activeQuestion.id, {
                      sourceTestTitle: test.title,
                      subject: activeQuestion.subject,
                    });
                    setBookmarkKey(k => k + 1);
                  }}
                  className={`px-2 py-1 rounded-lg border text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                    isQuestionBookmarked(activeQuestion.id)
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:text-white border-slate-700'
                  }`}
                  title={isQuestionBookmarked(activeQuestion.id) ? 'Remove Bookmark' : 'Star & Bookmark this Question'}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${isQuestionBookmarked(activeQuestion.id) ? 'fill-amber-400 text-amber-400' : ''}`} />
                  <span className="text-[10px] hidden sm:inline">{isQuestionBookmarked(activeQuestion.id) ? 'Starred' : 'Star'}</span>
                </button>

                <div className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-emerald-400">+{activeQuestion.marks}</span>
                  <span className="text-slate-600">/</span>
                  <span className="text-rose-400">-{activeQuestion.negativeMarks}</span>
                </div>
              </div>
            </div>

            {/* PYQ Provenance Banner: Multi-Exam Appearances */}
            {activeAppearances.length > 0 && (
              <div
                className={`p-2.5 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                  activeAppearances.length > 1
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
                }`}
              >
                <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                  {activeAppearances.length > 1 ? (
                    <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-black text-[10px] flex items-center space-x-1 shrink-0">
                      <Flame className="w-3 h-3 fill-slate-950" />
                      <span>REPEATED PYQ • Asked in {activeAppearances.length} Exams:</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-300 font-bold text-[10px] flex items-center space-x-1 shrink-0">
                      <History className="w-3 h-3" />
                      <span>OFFICIAL PYQ:</span>
                    </span>
                  )}

                  {activeAppearances.map((app: any, appIdx: number) => (
                    <span
                      key={appIdx}
                      className={`px-2 py-0.5 rounded border text-[11px] font-semibold flex items-center space-x-1.5 ${
                        activeAppearances.length > 1
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
                  Past Examination Question
                </span>
              </div>
            )}

            {/* Mock Test Provenance Banner when not PYQ */}
            {activeAppearances.length === 0 && (
              <div className="p-2.5 rounded-xl border border-indigo-500/20 bg-indigo-950/20 text-indigo-200 text-xs flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold text-[10px] flex items-center space-x-1 shrink-0">
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  <span>MOCK TEST QUESTION</span>
                </span>
                <span className="text-[11px] text-slate-300">
                  Curated strictly according to official {test.category || 'exam'} syllabus pattern & difficulty.
                </span>
              </div>
            )}

            {/* Dynamic Question Renderer supporting MCQ, Matching (2-col table), Assertion-Reason, Multi-Statement */}
            <QuestionRenderer
              question={activeQuestion}
              selectedOption={responses[activeQuestion.id]}
              onSelectOption={handleOptionSelect}
              showSolution={false}
            />
          </div>

          {/* Bottom Toolbar */}
          <div className="max-w-3xl mx-auto w-full pt-6 mt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleMarkForReview}
                className="px-3.5 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Flag className="w-3.5 h-3.5 text-purple-400" />
                <span>Mark for Review & Next</span>
              </button>
              <button
                onClick={handleClearResponse}
                disabled={responses[activeQuestion.id] == null}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-300 text-xs font-semibold transition border border-slate-700 flex items-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  if (currentQuestionIndex > 0) {
                    selectQuestion(currentQuestionIndex - 1);
                  }
                }}
                disabled={currentQuestionIndex === 0}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-300 text-xs font-bold transition border border-slate-700 flex items-center space-x-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <button
                onClick={handleSaveAndNext}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs sm:text-sm font-black transition shadow-md shadow-emerald-500/20 flex items-center space-x-1.5 cursor-pointer"
              >
                <span>Save & Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </main>

        {/* 4. RIGHT-SIDE QUESTION PALETTE + SECTION SUMMARY SWITCHER */}
        <aside
          className={`fixed md:static inset-y-0 right-0 z-40 w-80 bg-slate-900 border-l border-slate-800 p-4 flex flex-col justify-between transition-transform duration-300 md:translate-x-0 ${
            paletteMobileOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full md:translate-x-0'
          }`}
        >
          <div className="overflow-y-auto custom-scrollbar pr-0.5">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
              {/* Palette Mode Switcher Tabs */}
              <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setPaletteViewMode('grid')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                    paletteViewMode === 'grid'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Question Grid</span>
                </button>
                <button
                  onClick={() => setPaletteViewMode('sections')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                    paletteViewMode === 'sections'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Sections ({sectionSummaries.length})</span>
                </button>
              </div>

              <button
                onClick={() => setPaletteMobileOpen(false)}
                className="md:hidden text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* TAB 1: QUESTION GRID VIEW */}
            {paletteViewMode === 'grid' && (
              <>
                {/* Visual Status Indicators Legend */}
                <div className="grid grid-cols-2 gap-2 my-4 text-[11px]">
                  <div className="flex items-center space-x-2 bg-slate-800/70 p-2 rounded-lg border border-slate-700/50">
                    <span className="w-5 h-5 rounded bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-[10px]">
                      {answeredCount}
                    </span>
                    <span className="text-slate-300 font-medium">Answered</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-slate-800/70 p-2 rounded-lg border border-slate-700/50">
                    <span className="w-5 h-5 rounded bg-rose-500 text-white font-bold flex items-center justify-center text-[10px]">
                      {unansweredCount}
                    </span>
                    <span className="text-slate-300 font-medium">Unanswered</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-slate-800/70 p-2 rounded-lg border border-slate-700/50">
                    <span className="w-5 h-5 rounded bg-purple-500 text-white font-bold flex items-center justify-center text-[10px]">
                      {markedCount}
                    </span>
                    <span className="text-slate-300 font-medium">Review</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-slate-800/70 p-2 rounded-lg border border-slate-700/50">
                    <span className="w-5 h-5 rounded bg-slate-700 text-slate-300 font-bold flex items-center justify-center text-[10px]">
                      {notVisitedCount}
                    </span>
                    <span className="text-slate-300 font-medium">Not Visited</span>
                  </div>
                </div>

                {/* Questions Grid Matrix */}
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-300 truncate max-w-[170px]">
                      {currentSection.name}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold">
                      {sectionQuestions.length} Questions
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                    {sectionQuestions.map((q: Question, idx: number) => {
                      const status = questionStatuses[q.id] || 'not_visited';
                      const isCurrent = idx === currentQuestionIndex;

                      let badgeClass = 'bg-slate-700 text-slate-300';
                      if (status === 'answered') {
                        badgeClass = 'bg-emerald-500 text-slate-950 font-black shadow-sm';
                      } else if (status === 'unanswered') {
                        badgeClass = 'bg-rose-500 text-white font-bold';
                      } else if (status === 'marked_for_review') {
                        badgeClass = 'bg-purple-500 text-white font-bold';
                      } else if (status === 'answered_and_marked') {
                        badgeClass = 'bg-purple-600 text-white border-2 border-emerald-400 font-bold';
                      }

                      return (
                        <button
                          key={q.id}
                          onClick={() => {
                            selectQuestion(idx);
                            setPaletteMobileOpen(false);
                          }}
                          className={`h-9 rounded-lg text-xs font-bold transition flex items-center justify-center relative cursor-pointer ${badgeClass} ${
                            isCurrent ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-105' : 'hover:opacity-90'
                          }`}
                        >
                          {idx + 1}
                          {status === 'answered_and_marked' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 absolute top-0.5 right-0.5"></span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* TAB 2: SECTIONS SUMMARY BREAKDOWN VIEW */}
            {paletteViewMode === 'sections' && (
              <div className="my-3 space-y-2.5">
                <div className="text-[11px] text-slate-400 flex items-center justify-between pb-1 border-b border-slate-800">
                  <span>Sections Overview</span>
                  <span className="font-bold text-emerald-400 font-mono">{sectionSummaries.length} Total</span>
                </div>

                {sectionSummaries.map((s) => {
                  const isCurrent = s.isCurrent;
                  return (
                    <div
                      key={s.id}
                      onClick={() => {
                        selectSection(s.index);
                        setPaletteViewMode('grid');
                        setPaletteMobileOpen(false);
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer space-y-2 ${
                        isCurrent
                          ? 'bg-emerald-950/40 border-emerald-500/60 ring-1 ring-emerald-500/40'
                          : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="min-w-0">
                          <h4 className={`text-xs font-bold truncate ${isCurrent ? 'text-emerald-300' : 'text-slate-200'}`}>
                            {s.name}
                          </h4>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {s.dominantSubject}
                          </span>
                        </div>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-black shrink-0 ${
                          isCurrent ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {s.total} Qs
                        </span>
                      </div>

                      <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-400 transition-all duration-300"
                          style={{ width: `${s.progressPercent}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-emerald-400 font-bold">{s.answered} answered</span>
                        <span className="text-slate-400">{s.progressPercent}% done</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom Palette Action */}
          <div className="pt-4 border-t border-slate-800 space-y-2 shrink-0">
            <button
              onClick={() => setShowSubmitModal(true)}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm transition shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer"
            >
              Submit Test Paper
            </button>
            <button
              onClick={onExit}
              className="w-full py-1.5 text-slate-400 hover:text-rose-400 text-xs font-semibold cursor-pointer"
            >
              Cancel / Exit to Dashboard
            </button>
          </div>
        </aside>
      </div>

      {/* 5. CONFIRM SUBMISSION MODAL */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Confirm Test Submission</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to submit your mock test? Once submitted, your score, negative mark deduction, accuracy rate, and All-India Rank simulation will be generated immediately.
            </p>

            {/* Summary Count Table */}
            <div className="grid grid-cols-2 gap-2 bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-700/50">
                <span className="text-slate-400">Answered:</span>
                <span className="font-bold text-emerald-400">{answeredCount}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-700/50">
                <span className="text-slate-400">Unanswered:</span>
                <span className="font-bold text-rose-400">{unansweredCount}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Marked for Review:</span>
                <span className="font-bold text-purple-400">{markedCount}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Time Remaining:</span>
                <span className="font-bold font-mono text-white">{formatTime(secondsRemaining)}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2.5">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Back to Test
              </button>
              <button
                onClick={() => {
                  setShowSubmitModal(false);
                  doFinalSubmit();
                }}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition shadow-lg shadow-emerald-500/20"
              >
                Yes, Submit Final Responses
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. TIMEOUT AUTO-SUBMIT MODAL */}
      {isTimeOutModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/60 rounded-2xl max-w-sm w-full p-6 text-center space-y-3 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500 text-rose-400 flex items-center justify-center mx-auto animate-bounce">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Time's Up!</h3>
            <p className="text-xs text-slate-300">
              Your exam duration has concluded. The exam engine is automatically compiling and submitting your answers now...
            </p>
            <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mt-2"></div>
          </div>
        </div>
      )}
    </div>
  );
};
