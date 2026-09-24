import React, { useState, useMemo, useEffect } from 'react';
import { Question, MockTest } from '../types';
import { normalizeSubjectName } from '../utils/taxonomyMigration';
import {
  Bookmark,
  Sparkles,
  BookOpen,
  Search,
  Trash2,
  Edit3,
  Check,
  RotateCcw,
  Tag,
  CheckCircle2,
  Calendar,
  Layers
} from 'lucide-react';
import {
  getBookmarks,
  deleteBookmark,
  saveBookmarkNote,
  QuestionBookmark,
  BOOKMARKS_CHANGED_EVENT
} from '../utils/bookmarkStorage';

interface BookmarksManagerProps {
  questions: Question[];
  onStartPractice: (test: MockTest, questions: Question[]) => void;
  onExploreTests: () => void;
}

export const BookmarksManager: React.FC<BookmarksManagerProps> = ({
  questions,
  onStartPractice,
  onExploreTests,
}) => {
  const [bookmarks, setBookmarks] = useState<QuestionBookmark[]>(() => getBookmarks());
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  // Reload bookmarks on storage events
  useEffect(() => {
    const handleBookmarkChange = () => {
      setBookmarks(getBookmarks());
    };
    window.addEventListener(BOOKMARKS_CHANGED_EVENT, handleBookmarkChange);
    return () => window.removeEventListener(BOOKMARKS_CHANGED_EVENT, handleBookmarkChange);
  }, []);

  // Map question lookup
  const questionsMap = useMemo(() => {
    const map = new Map<string, Question>();
    questions.forEach(q => map.set(q.id, q));
    return map;
  }, [questions]);

  // Combine bookmark record with question details
  const enrichedBookmarks = useMemo(() => {
    return bookmarks
      .map(b => ({
        bookmark: b,
        question: questionsMap.get(b.questionId),
      }))
      .filter((item): item is { bookmark: QuestionBookmark; question: Question } => !!item.question);
  }, [bookmarks, questionsMap]);

  // Unique subjects among bookmarked questions
  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    enrichedBookmarks.forEach(item => {
      set.add(normalizeSubjectName(item.question.subject));
    });
    return Array.from(set).sort();
  }, [enrichedBookmarks]);

  // Filtered bookmarks list
  const filteredList = useMemo(() => {
    return enrichedBookmarks.filter(({ bookmark, question }) => {
      if (selectedSubject !== 'ALL' && normalizeSubjectName(question.subject) !== selectedSubject) {
        return false;
      }

      if (searchQuery.trim()) {
        const s = searchQuery.toLowerCase().trim();
        const note = (bookmark.note || '').toLowerCase();
        const qText = (question.questionText || question.question || '').toLowerCase();
        const qHindi = (question.questionHindi || '').toLowerCase();
        const qTopic = (question.topic || '').toLowerCase();
        return note.includes(s) || qText.includes(s) || qHindi.includes(s) || qTopic.includes(s);
      }

      return true;
    });
  }, [enrichedBookmarks, selectedSubject, searchQuery]);

  // Start practice session with bookmarked questions
  const handleStartPracticeSession = () => {
    const practiceQuestions = filteredList.map(item => item.question);
    if (practiceQuestions.length === 0) return;

    const bookmarkTest: MockTest = {
      id: `bookmark-practice-${Date.now()}`,
      title: `Bookmarked Questions Practice (${practiceQuestions.length} Qs)`,
      description: `Targeted revision session covering your starred questions and tricky concepts.`,
      category: 'CGSSB',
      durationMinutes: Math.max(10, Math.ceil(practiceQuestions.length * 1.5)),
      marksPerQuestion: 1,
      negativeMarksPerQuestion: 0.333,
      sections: [
        {
          id: 'sec-bookmarks',
          name: 'Bookmarked Revision Section',
          questionIds: practiceQuestions.map(q => q.id),
        },
      ],
      questionCount: practiceQuestions.length,
      attemptsCount: 0,
      createdAt: new Date().toISOString(),
    };

    onStartPractice(bookmarkTest, practiceQuestions);
  };

  const handleSaveNote = (qid: string) => {
    saveBookmarkNote(qid, noteText);
    setEditingNoteId(null);
    setNoteText('');
    setBookmarks(getBookmarks());
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 font-sans">
      {/* Banner */}
      <div className="bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border border-amber-900/30 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="max-w-2xl">
            <div className="flex items-center space-x-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center">
                <Bookmark className="w-3 h-3 mr-1 fill-amber-400" />
                BOOKMARKS & PERSONAL NOTES
              </span>
              <span className="text-xs text-slate-400">Personal Knowledge Base</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Starred Questions & Study Mnemonics
            </h1>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Curate high-yield questions, attach personal formulas or historical mnemonics, and practice them in an instant revision drill before exam day.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={handleStartPracticeSession}
              disabled={filteredList.length === 0}
              className={`px-5 py-3 rounded-2xl text-xs font-black transition flex items-center space-x-2 shadow-lg cursor-pointer ${
                filteredList.length > 0
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 hover:brightness-110 shadow-amber-500/20 active:scale-95'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>Practice Bookmarked ({filteredList.length} Qs)</span>
            </button>
          </div>
        </div>

        {/* Counter */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Total Starred Questions</span>
            <span className="text-xl font-black text-amber-400 mt-0.5 block">{bookmarks.length}</span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Questions with Notes</span>
            <span className="text-xl font-black text-teal-400 mt-0.5 block">
              {bookmarks.filter(b => b.note && b.note.trim().length > 0).length}
            </span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Subjects Covered</span>
            <span className="text-xl font-black text-emerald-400 mt-0.5 block">{availableSubjects.length}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <select
            value={selectedSubject}
            onChange={e => setSelectedSubject(e.target.value)}
            className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Subjects ({availableSubjects.length})</option>
            {availableSubjects.map(subj => (
              <option key={subj} value={subj}>
                {subj}
              </option>
            ))}
          </select>
        </div>

        <div className="relative flex-1 md:w-72">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search notes or question text..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Questions List */}
      {filteredList.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
            <Bookmark className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No bookmarked questions yet!</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            During any test or when reviewing solutions, click the Bookmark icon to save tricky questions and attach personal notes.
          </p>
          <button
            onClick={onExploreTests}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition inline-flex items-center space-x-1.5 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Explore Test Series</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredList.map(({ bookmark, question }, idx) => {
            const isEditing = editingNoteId === question.id;

            return (
              <div
                key={question.id}
                className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-3xl p-5 transition-all duration-200 shadow-md space-y-4"
              >
                {/* Meta Header */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black text-slate-400">#{idx + 1}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      {normalizeSubjectName(question.subject)}
                    </span>
                    {question.topic && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        {question.topic}
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                      <span>Saved from:</span>
                      <strong className="text-slate-300 font-medium">{bookmark.sourceTestTitle || 'Practice'}</strong>
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        deleteBookmark(question.id);
                        setBookmarks(getBookmarks());
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                      title="Remove Bookmark"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Question Stem */}
                <div className="space-y-2">
                  {question.questionHindi && (
                    <p className="text-sm font-semibold text-white leading-relaxed font-sans">
                      {question.questionHindi}
                    </p>
                  )}
                  {question.questionText && question.questionText !== question.questionHindi && (
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {question.questionText}
                    </p>
                  )}
                </div>

                {/* Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(question.options || []).map((opt, optIdx) => {
                    const optId = (opt.id || opt.label || ['A', 'B', 'C', 'D'][optIdx]) as 'A' | 'B' | 'C' | 'D';
                    const isCorrect = question.correctOption === optId;

                    return (
                      <div
                        key={optId}
                        className={`p-2.5 rounded-xl border text-xs flex items-start space-x-2 transition ${
                          isCorrect
                            ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200 font-bold'
                            : 'bg-slate-950/50 border-slate-800 text-slate-400'
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-[10px] font-black ${
                            isCorrect ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {optId}
                        </span>
                        <div className="flex-1">
                          <span>{opt.textHindi || opt.text}</span>
                        </div>
                        {isCorrect && (
                          <span className="text-[10px] text-emerald-400 font-bold">Official Key</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Personal Study Note Area */}
                <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>My Personal Study Note / Mnemonic (याद रखने का सूत्र)</span>
                    </span>

                    {!isEditing && (
                      <button
                        onClick={() => {
                          setEditingNoteId(question.id);
                          setNoteText(bookmark.note || '');
                        }}
                        className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center space-x-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>{bookmark.note ? 'Edit Note' : '+ Add Note'}</span>
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        rows={2}
                        value={noteText}
                        onChange={e => setNoteText(e.target.value)}
                        placeholder="Write formula, key facts, or reason you got it wrong..."
                        className="w-full bg-slate-900 border border-amber-500/50 rounded-xl p-2.5 text-xs text-amber-100 placeholder-amber-400/40 focus:outline-none focus:border-amber-400"
                      />
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setEditingNoteId(null)}
                          className="px-3 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveNote(question.id)}
                          className="px-4 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center space-x-1"
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>Save Note</span>
                        </button>
                      </div>
                    </div>
                  ) : bookmark.note ? (
                    <p className="text-xs text-amber-100 leading-relaxed font-sans">
                      "{bookmark.note}"
                    </p>
                  ) : (
                    <p className="text-xs text-amber-400/50 italic">
                      No personal note added yet. Click "+ Add Note" to save formulas, tricks, or reminders.
                    </p>
                  )}
                </div>

                {/* Explanation Strip */}
                {(question.explanationHindi || question.explanation) && (
                  <div className="text-xs text-slate-400 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                    <strong className="text-emerald-400">Official Fact: </strong>
                    <span>{question.explanationHindi || question.explanation}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
