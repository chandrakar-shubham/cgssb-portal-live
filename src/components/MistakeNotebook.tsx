import React, { useState, useMemo, useEffect } from 'react';
import { TestAttempt, Question, MockTest } from '../types';
import { normalizeSubjectName } from '../utils/taxonomyMigration';
import {
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  BookOpen,
  Filter,
  Search,
  Sparkles,
  Flame,
  Bookmark,
  ChevronDown,
  ChevronUp,
  Award,
  Check,
  Zap,
  Info
} from 'lucide-react';
import {
  isQuestionBookmarked,
  toggleBookmark,
  saveBookmarkNote,
  getBookmark,
  BOOKMARKS_CHANGED_EVENT
} from '../utils/bookmarkStorage';

interface MistakeNotebookProps {
  attempts: TestAttempt[];
  questions: Question[];
  onStartMistakeTest: (test: MockTest, questions: Question[]) => void;
  onExploreTests: () => void;
}

interface DerivedMistake {
  question: Question;
  selectedOption: 'A' | 'B' | 'C' | 'D' | null;
  correctOption: 'A' | 'B' | 'C' | 'D';
  isSkipped: boolean;
  timesMissed: number;
  latestTestTitle: string;
  latestAttemptDate: string;
  resolved: boolean;
}

export const MistakeNotebook: React.FC<MistakeNotebookProps> = ({
  attempts,
  questions,
  onStartMistakeTest,
  onExploreTests,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'wrong' | 'skipped' | 'resolved'>('wrong');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedExplanations, setExpandedExplanations] = useState<Record<string, boolean>>({});
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const [showNoteInput, setShowNoteInput] = useState<Record<string, boolean>>({});
  const [, setBookmarkRefreshKey] = useState(0);

  // Resolved status storage
  const [resolvedMap, setResolvedMap] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('cgssb_resolved_mistakes');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  const toggleResolved = (qid: string) => {
    setResolvedMap(prev => {
      const next = { ...prev, [qid]: !prev[qid] };
      try {
        localStorage.setItem('cgssb_resolved_mistakes', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    const handleBookmarkChange = () => setBookmarkRefreshKey(k => k + 1);
    window.addEventListener(BOOKMARKS_CHANGED_EVENT, handleBookmarkChange);
    return () => window.removeEventListener(BOOKMARKS_CHANGED_EVENT, handleBookmarkChange);
  }, []);

  // Map question lookup
  const questionsMap = useMemo(() => {
    const map = new Map<string, Question>();
    questions.forEach(q => map.set(q.id, q));
    return map;
  }, [questions]);

  // Derive all mistake entries from test attempts
  const allMistakes: DerivedMistake[] = useMemo(() => {
    const mistakeMap = new Map<string, DerivedMistake>();

    // Process attempts in chronological order
    attempts.forEach(att => {
      const responses = att.responses || {};
      Object.entries(responses).forEach(([qid, userAns]) => {
        const q = questionsMap.get(qid);
        if (!q) return;

        const isCorrect = userAns === q.correctOption;
        const isSkipped = userAns == null;

        if (!isCorrect) {
          const existing = mistakeMap.get(qid);
          if (existing) {
            existing.timesMissed += 1;
            existing.latestTestTitle = att.testTitle;
            existing.latestAttemptDate = att.submittedAt;
            existing.selectedOption = userAns;
            existing.isSkipped = isSkipped;
          } else {
            mistakeMap.set(qid, {
              question: q,
              selectedOption: userAns,
              correctOption: q.correctOption,
              isSkipped,
              timesMissed: 1,
              latestTestTitle: att.testTitle,
              latestAttemptDate: att.submittedAt,
              resolved: !!resolvedMap[qid],
            });
          }
        }
      });
    });

    return Array.from(mistakeMap.values()).map(m => ({
      ...m,
      resolved: !!resolvedMap[m.question.id],
    }));
  }, [attempts, questionsMap, resolvedMap]);

  // Available subjects for filtering
  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    allMistakes.forEach(m => {
      set.add(normalizeSubjectName(m.question.subject));
    });
    return Array.from(set).sort();
  }, [allMistakes]);

  // Filtered mistakes list
  const filteredMistakes = useMemo(() => {
    return allMistakes.filter(m => {
      // Status filter
      if (activeFilter === 'wrong' && (m.isSkipped || m.resolved)) return false;
      if (activeFilter === 'skipped' && (!m.isSkipped || m.resolved)) return false;
      if (activeFilter === 'resolved' && !m.resolved) return false;
      if (activeFilter === 'all' && m.resolved) return false; // In 'all', show active pending mistakes

      // Subject filter
      if (selectedSubject !== 'ALL' && normalizeSubjectName(m.question.subject) !== selectedSubject) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const qText = (m.question.questionText || m.question.question || '').toLowerCase();
        const qHindi = (m.question.questionHindi || '').toLowerCase();
        const qTopic = (m.question.topic || '').toLowerCase();
        const s = searchQuery.toLowerCase().trim();
        return qText.includes(s) || qHindi.includes(s) || qTopic.includes(s);
      }

      return true;
    });
  }, [allMistakes, activeFilter, selectedSubject, searchQuery]);

  // Launch Re-test with filtered mistake questions
  const handleLaunchMistakeTest = () => {
    const targetMistakes = filteredMistakes.length > 0 ? filteredMistakes : allMistakes;
    if (targetMistakes.length === 0) return;

    const testQuestions = targetMistakes.map(m => m.question);
    const durationMinutes = Math.max(10, Math.ceil(testQuestions.length * 1.2));

    const mistakeTest: MockTest = {
      id: `mistake-retest-${Date.now()}`,
      title: `Fix My Mistakes Drill (${testQuestions.length} Questions)`,
      description: `Customized diagnostic re-test generated from your incorrect and skipped questions across previous exams.`,
      category: 'CGSSB',
      durationMinutes,
      marksPerQuestion: 1,
      negativeMarksPerQuestion: 0.333,
      sections: [
        {
          id: 'sec-mistakes',
          name: 'Mistake Correction Section',
          questionIds: testQuestions.map(q => q.id),
        },
      ],
      questionCount: testQuestions.length,
      attemptsCount: 0,
      createdAt: new Date().toISOString(),
    };

    onStartMistakeTest(mistakeTest, testQuestions);
  };

  const getSubjectBadgeStyle = (subj: string) => {
    switch (normalizeSubjectName(subj)) {
      case 'Chhattisgarh General Studies':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'India General Studies':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
      case 'General Hindi':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'Chhattisgarhi Language':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'Reasoning':
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
      case 'Quantitative Aptitude':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      case 'Computer Knowledge':
        return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-900 border border-rose-900/30 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="max-w-2xl">
            <div className="flex items-center space-x-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center">
                <AlertTriangle className="w-3 h-3 mr-1" />
                MISTAKE NOTEBOOK (कमज़ोर विषय डायरी)
              </span>
              <span className="text-xs text-slate-400">Targeted Error Elimination</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Review Missed Questions & Take Re-Tests
            </h1>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Every incorrect question in CGPSC or CGSSB costs negative marks. Review your mistakes, read bilingual explanations, write personal notes, and launch a targeted re-test to master them.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={handleLaunchMistakeTest}
              disabled={filteredMistakes.length === 0}
              className={`px-5 py-3 rounded-2xl text-xs font-black transition flex items-center space-x-2 shadow-lg cursor-pointer ${
                filteredMistakes.length > 0
                  ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 hover:brightness-110 shadow-rose-500/20 active:scale-95'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>Launch "Fix My Mistakes" Re-Test ({filteredMistakes.length} Qs)</span>
            </button>
          </div>
        </div>

        {/* Counter Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Total Mistakes Logged</span>
            <span className="text-xl font-black text-rose-400 mt-0.5 block">{allMistakes.length}</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Wrong Answers (Negative)</span>
            <span className="text-xl font-black text-amber-400 mt-0.5 block">
              {allMistakes.filter(m => !m.isSkipped && !m.resolved).length}
            </span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Skipped Questions</span>
            <span className="text-xl font-black text-teal-400 mt-0.5 block">
              {allMistakes.filter(m => m.isSkipped && !m.resolved).length}
            </span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Mastered / Resolved</span>
            <span className="text-xl font-black text-emerald-400 mt-0.5 block">
              {allMistakes.filter(m => m.resolved).length}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Status Filters */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setActiveFilter('wrong')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeFilter === 'wrong'
                ? 'bg-rose-500 text-slate-950 shadow-md shadow-rose-500/20'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Wrong Answers ({allMistakes.filter(m => !m.isSkipped && !m.resolved).length})
          </button>

          <button
            onClick={() => setActiveFilter('skipped')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeFilter === 'skipped'
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Skipped ({allMistakes.filter(m => m.isSkipped && !m.resolved).length})
          </button>

          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            All Pending ({allMistakes.filter(m => !m.resolved).length})
          </button>

          <button
            onClick={() => setActiveFilter('resolved')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeFilter === 'resolved'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Mastered ({allMistakes.filter(m => m.resolved).length})
          </button>
        </div>

        {/* Search & Subject Dropdown */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-56">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search mistakes..."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          <select
            value={selectedSubject}
            onChange={e => setSelectedSubject(e.target.value)}
            className="bg-slate-950 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
          >
            <option value="ALL">All Subjects ({availableSubjects.length})</option>
            {availableSubjects.map(subj => (
              <option key={subj} value={subj}>
                {subj}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mistakes Questions List */}
      {filteredMistakes.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No active mistakes found!</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {allMistakes.length === 0
              ? 'Attempt tests in the portal. Any incorrect or skipped questions will automatically be logged here for revision.'
              : 'You have mastered all filtered questions in this section! Switch filters or take a new mock test.'}
          </p>
          <button
            onClick={onExploreTests}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition inline-flex items-center space-x-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Practice New Mock Tests</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMistakes.map((m, idx) => {
            const q = m.question;
            const qid = q.id;
            const isBookmarked = isQuestionBookmarked(qid);
            const currentBookmark = getBookmark(qid);
            const isExpanded = !!expandedExplanations[qid];
            const isNoteOpen = !!showNoteInput[qid];
            const currentNote = editingNotes[qid] ?? (currentBookmark?.note || '');

            return (
              <div
                key={qid}
                className={`bg-slate-900 border rounded-3xl p-5 transition-all duration-200 shadow-md ${
                  m.resolved
                    ? 'border-emerald-500/30 opacity-75'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Meta Badges */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black text-slate-400">#{idx + 1}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getSubjectBadgeStyle(q.subject)}`}>
                      {normalizeSubjectName(q.subject)}
                    </span>
                    {q.topic && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        {q.topic}
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                      <span>From:</span>
                      <strong className="text-slate-300 font-medium">{m.latestTestTitle}</strong>
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Bookmark Toggle */}
                    <button
                      onClick={() => {
                        toggleBookmark(qid, {
                          sourceTestTitle: m.latestTestTitle,
                          subject: normalizeSubjectName(q.subject),
                        });
                        setBookmarkRefreshKey(k => k + 1);
                      }}
                      className={`p-1.5 rounded-lg border text-xs font-bold transition flex items-center space-x-1 ${
                        isBookmarked
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-slate-800 text-slate-400 hover:text-white border-slate-700'
                      }`}
                      title={isBookmarked ? 'Remove Bookmark' : 'Star & Bookmark Question'}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-400 text-amber-400' : ''}`} />
                      <span className="text-[10px] hidden sm:inline">{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
                    </button>

                    {/* Mark as Resolved Checkbox */}
                    <button
                      onClick={() => toggleResolved(qid)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 border ${
                        m.resolved
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-800 text-slate-400 hover:text-white border-slate-700'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{m.resolved ? 'Mastered' : 'Mark as Understood'}</span>
                    </button>
                  </div>
                </div>

                {/* Question Text */}
                <div className="space-y-2 mb-4">
                  {q.questionHindi && (
                    <p className="text-sm font-semibold text-white leading-relaxed font-sans">
                      {q.questionHindi}
                    </p>
                  )}
                  {q.questionText && q.questionText !== q.questionHindi && (
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {q.questionText}
                    </p>
                  )}
                </div>

                {/* Options Comparison (Candidate Answer vs Correct Answer) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                  {(q.options || []).map((opt, optIdx) => {
                    const optId = (opt.id || opt.label || ['A', 'B', 'C', 'D'][optIdx]) as 'A' | 'B' | 'C' | 'D';
                    const isCandidateChoice = m.selectedOption === optId;
                    const isCorrect = q.correctOption === optId;

                    let cardClass = 'bg-slate-950/50 border-slate-800 text-slate-400';
                    if (isCorrect) {
                      cardClass = 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200 font-bold';
                    } else if (isCandidateChoice) {
                      cardClass = 'bg-rose-950/40 border-rose-500/60 text-rose-200 font-semibold';
                    }

                    return (
                      <div
                        key={optId}
                        className={`p-2.5 rounded-xl border text-xs flex items-start space-x-2 transition ${cardClass}`}
                      >
                        <span
                          className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-[10px] font-black ${
                            isCorrect
                              ? 'bg-emerald-500 text-slate-950'
                              : isCandidateChoice
                              ? 'bg-rose-500 text-white'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {optId}
                        </span>

                        <div className="flex-1">
                          <span>{opt.textHindi || opt.text}</span>
                          {opt.textHindi && opt.text && opt.textHindi !== opt.text && (
                            <span className="block text-[11px] opacity-75 mt-0.5">{opt.text}</span>
                          )}
                        </div>

                        {isCorrect && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center shrink-0">
                            <Check className="w-2.5 h-2.5 mr-0.5" />
                            Correct
                          </span>
                        )}

                        {isCandidateChoice && !isCorrect && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center shrink-0">
                            <XCircle className="w-2.5 h-2.5 mr-0.5" />
                            Your Answer
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation Dropdown */}
                <div className="border-t border-slate-800/80 pt-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setExpandedExplanations(prev => ({ ...prev, [qid]: !prev[qid] }))}
                      className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 cursor-pointer"
                    >
                      <Info className="w-3.5 h-3.5" />
                      <span>{isExpanded ? 'Hide Official Explanation' : 'View Official Solution & Key Concept'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5 ml-0.5" /> : <ChevronDown className="w-3.5 h-3.5 ml-0.5" />}
                    </button>

                    <button
                      onClick={() => setShowNoteInput(prev => ({ ...prev, [qid]: !prev[qid] }))}
                      className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center space-x-1 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{currentBookmark?.note ? 'Edit My Note' : '+ Add Study Note'}</span>
                    </button>
                  </div>

                  {/* Expanded Explanation */}
                  {isExpanded && (
                    <div className="bg-slate-950/80 border border-emerald-500/20 rounded-2xl p-3.5 text-xs text-slate-300 space-y-2 animate-in fade-in duration-150">
                      {q.explanationHindi && (
                        <p className="leading-relaxed font-sans text-slate-200">
                          <strong className="text-emerald-400">व्याख्या: </strong>
                          {q.explanationHindi}
                        </p>
                      )}
                      {q.explanation && (
                        <p className="leading-relaxed text-slate-300">
                          <strong className="text-emerald-400">Explanation: </strong>
                          {q.explanation}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Personal Study Note */}
                  {(isNoteOpen || currentBookmark?.note) && (
                    <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-3 space-y-2 mt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-amber-300 flex items-center space-x-1">
                          <Bookmark className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>My Personal Study Note / Mnemonic</span>
                        </span>
                        {isNoteOpen && (
                          <button
                            onClick={() => {
                              saveBookmarkNote(qid, currentNote);
                              setShowNoteInput(prev => ({ ...prev, [qid]: false }));
                              setBookmarkRefreshKey(k => k + 1);
                            }}
                            className="px-2.5 py-0.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black transition"
                          >
                            Save Note
                          </button>
                        )}
                      </div>

                      {isNoteOpen ? (
                        <textarea
                          rows={2}
                          value={currentNote}
                          onChange={e => setEditingNotes({ ...editingNotes, [qid]: e.target.value })}
                          placeholder="e.g. Remember: Kalchuri capital shifted from Tumman to Ratanpur under Ratandev I..."
                          className="w-full bg-slate-900 border border-amber-500/40 rounded-xl p-2 text-xs text-amber-100 placeholder-amber-400/40 focus:outline-none focus:border-amber-400"
                        />
                      ) : (
                        <p className="text-xs text-amber-200/90 italic">
                          "{currentBookmark?.note}"
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
