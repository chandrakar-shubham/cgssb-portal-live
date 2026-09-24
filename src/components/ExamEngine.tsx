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
  Sparkles
} from 'lucide-react';
import { QuestionRenderer } from './QuestionRenderer';
import { LanguageToggle } from './LanguageToggle';
import { useLanguage } from '../context/LanguageContext';

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
  const [paletteMobileOpen, setPaletteMobileOpen] = useState(false);

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
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 sm:px-6 py-2 flex items-center justify-between overflow-x-auto scrollbar-none">
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline mr-2">
            Sections:
          </span>
          {test.sections.map((sec, idx) => (
            <button
              key={sec.id}
              onClick={() => selectSection(idx)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                currentSectionIndex === idx
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              {sec.name} ({sec.questionIds.length})
            </button>
          ))}
        </div>

        <div className="text-[11px] text-slate-400 font-semibold hidden md:block">
          Question {currentQuestionIndex + 1} of {sectionQuestions.length} in this section
        </div>
      </div>

      {/* 3. MAIN WORKSPACE + PALETTE LAYOUT */}
      <div className="flex-1 flex overflow-hidden">
        {/* Workspace: Question Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-between">
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
                <span className="text-emerald-400">+{activeQuestion.marks}</span>
                <span className="text-slate-600">/</span>
                <span className="text-rose-400">-{activeQuestion.negativeMarks}</span>
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
                className="px-3.5 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition flex items-center space-x-1.5"
              >
                <Flag className="w-3.5 h-3.5 text-purple-400" />
                <span>Mark for Review & Next</span>
              </button>
              <button
                onClick={handleClearResponse}
                disabled={responses[activeQuestion.id] == null}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-300 text-xs font-semibold transition border border-slate-700 flex items-center space-x-1.5"
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
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-300 text-xs font-bold transition border border-slate-700 flex items-center space-x-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <button
                onClick={handleSaveAndNext}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs sm:text-sm font-black transition shadow-md shadow-emerald-500/20 flex items-center space-x-1.5"
              >
                <span>Save & Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </main>

        {/* 4. RIGHT-SIDE QUESTION PALETTE (Desktop + Mobile Drawer) */}
        <aside
          className={`fixed md:static inset-y-0 right-0 z-40 w-80 bg-slate-900 border-l border-slate-800 p-4 flex flex-col justify-between transition-transform duration-300 md:translate-x-0 ${
            paletteMobileOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full md:translate-x-0'
          }`}
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Question Palette
              </h2>
              <button
                onClick={() => setPaletteMobileOpen(false)}
                className="md:hidden text-slate-400 text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

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
              <span className="text-[11px] font-bold text-slate-400 block mb-2">
                Section: {currentSection.name}
              </span>
              <div className="grid grid-cols-5 gap-2 max-h-72 overflow-y-auto pr-1">
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
                      className={`h-9 rounded-lg text-xs font-bold transition flex items-center justify-center relative ${badgeClass} ${
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
          </div>

          {/* Bottom Palette Action */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <button
              onClick={() => setShowSubmitModal(true)}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm transition shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              Submit Test Paper
            </button>
            <button
              onClick={onExit}
              className="w-full py-1.5 text-slate-400 hover:text-rose-400 text-xs font-semibold"
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
