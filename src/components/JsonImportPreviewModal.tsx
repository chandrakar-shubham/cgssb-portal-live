import React, { useState } from 'react';
import { Question } from '../types';
import { QuestionRenderer } from './QuestionRenderer';
import {
  X,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Table,
  Sparkles,
  ChevronRight,
  Send,
  HelpCircle,
  Tag,
  Award,
  Layers,
  Edit3,
  Monitor,
  Check,
  Trash2,
  Plus
} from 'lucide-react';

interface JsonImportPreviewModalProps {
  isOpen: boolean;
  rawJsonData?: any[];
  mappedQuestions: Question[];
  onClose: () => void;
  onConfirm: (mode?: 'mock' | 'pyp' | 'both', finalQuestions?: Question[]) => Promise<void>;
  isImporting: boolean;
}

export const JsonImportPreviewModal: React.FC<JsonImportPreviewModalProps> = ({
  isOpen,
  mappedQuestions,
  onClose,
  onConfirm,
  isImporting,
}) => {
  const [selectedMode, setSelectedMode] = useState<'mock' | 'pyp' | 'both'>('mock');
  const [viewTab, setViewTab] = useState<'list' | 'live_card' | 'edit'>('list');
  const [questions, setQuestions] = useState<Question[]>(mappedQuestions);
  const [activeCardIndex, setActiveCardIndex] = useState<number>(0);
  const [simulatedAnswers, setSimulatedAnswers] = useState<Record<string, string>>({});
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  React.useEffect(() => {
    setQuestions(mappedQuestions);
  }, [mappedQuestions]);

  if (!isOpen || questions.length === 0) return null;

  const sampleExam = questions[0]?.examName || 'CG Exam';
  const sampleYear = questions[0]?.year || 2026;

  // Question type tally
  const typeCounts = questions.reduce((acc, q) => {
    const t = q.questionType || 'mcq';
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleUpdateOption = (qIdx: number, optId: string, text: string) => {
    setQuestions(prev => {
      const next = [...prev];
      const q = { ...next[qIdx] };
      q.options = q.options.map(o => (o.id === optId ? { ...o, text, textHindi: text } : o));
      next[qIdx] = q;
      return next;
    });
  };

  const handleUpdateCorrectOption = (qIdx: number, correctKey: any) => {
    setQuestions(prev => {
      const next = [...prev];
      next[qIdx] = { ...next[qIdx], correctOption: correctKey };
      return next;
    });
  };

  const handleUpdateField = (qIdx: number, field: keyof Question, value: any) => {
    setQuestions(prev => {
      const next = [...prev];
      next[qIdx] = { ...next[qIdx], [field]: value };
      return next;
    });
  };

  const handleDelete = (qIdx: number) => {
    setQuestions(prev => prev.filter((_, idx) => idx !== qIdx));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-5 shadow-2xl relative max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isImporting}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white">
              JSON Import Preview & Live Card Validation
            </h2>
            <p className="text-xs text-slate-400">
              Exam: <strong className="text-slate-200">{sampleExam} ({sampleYear})</strong> • {questions.length} Questions Verified
            </p>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950/60 p-3 rounded-2xl border border-slate-800 text-center">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Qs</span>
            <span className="text-lg font-black text-emerald-400">{questions.length}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">MCQ</span>
            <span className="text-lg font-black text-blue-400">{typeCounts['mcq'] || questions.length}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Classification</span>
            <span className="text-xs font-bold text-amber-300 mt-1 block uppercase">{selectedMode}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Status</span>
            <span className="text-xs font-bold text-emerald-400 mt-1 block">Ready to Write</span>
          </div>
        </div>

        {/* Mode Selector & View Tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
          {/* Paper Classification */}
          <div className="flex items-center space-x-1">
            <span className="text-xs font-bold text-slate-300 mr-1">Nature:</span>
            {[
              { id: 'mock', label: '🎯 Mock' },
              { id: 'pyp', label: '📜 PYP' },
              { id: 'both', label: '⚡ Both' },
            ].map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMode(m.id as any)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  selectedMode === m.id
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Sub-view controller */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded-xl border border-slate-800 self-center">
            <button
              type="button"
              onClick={() => setViewTab('list')}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 transition ${
                viewTab === 'list' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>List View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewTab('live_card')}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 transition ${
                viewTab === 'live_card' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>⚡ Live Card</span>
            </button>
            <button
              type="button"
              onClick={() => setViewTab('edit')}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 transition ${
                viewTab === 'edit' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>✏️ Quick Edit</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto space-y-3 max-h-[36vh] pr-1 scrollbar-thin">
          {/* 1. LIST VIEW */}
          {viewTab === 'list' && (
            <div className="space-y-2.5">
              {questions.map((q, idx) => (
                <div
                  key={q.id || idx}
                  className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-black text-[10px]">
                        Q{idx + 1}
                      </span>
                      <span className="text-slate-400 font-mono text-[10px]">{q.id}</span>
                    </div>
                    <span className="text-slate-300 font-bold">
                      Ans: <strong className="text-emerald-400">({q.correctOption})</strong>
                    </span>
                  </div>

                  <p className="text-slate-100 font-medium">{q.questionHindi || q.questionText}</p>

                  <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px] text-slate-400">
                    {q.options.map(opt => (
                      <div key={opt.id} className="truncate">
                        <strong className="text-slate-200">{opt.id}:</strong> {opt.textHindi || opt.text}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 2. LIVE CARD SIMULATOR */}
          {viewTab === 'live_card' && (
            <div>
              {(() => {
                const currentIdx = Math.min(activeCardIndex, questions.length - 1);
                const q = questions[currentIdx];
                if (!q) return null;
                const chosen = simulatedAnswers[q.id];

                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-indigo-400 font-mono">
                          Live Card: Q{currentIdx + 1} of {questions.length}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 font-semibold text-[11px]">
                          {q.subject}
                        </span>
                        {q.topic && <span className="text-slate-400 text-[11px] hidden sm:inline">• {q.topic}</span>}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          disabled={currentIdx === 0}
                          onClick={() => setActiveCardIndex(p => Math.max(0, p - 1))}
                          className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-xs text-slate-300 disabled:opacity-40 cursor-pointer"
                        >
                          Prev
                        </button>
                        <button
                          type="button"
                          disabled={currentIdx === questions.length - 1}
                          onClick={() => setActiveCardIndex(p => Math.min(questions.length - 1, p + 1))}
                          className="px-2.5 py-1 rounded bg-indigo-600 text-xs text-white font-bold disabled:opacity-40 cursor-pointer"
                        >
                          Next
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-950 border border-indigo-500/30 rounded-2xl p-4 shadow-xl">
                      <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800 text-xs">
                        <span className="font-bold text-emerald-400 flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Candidate Portal Live Card Preview</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowExplanation(!showExplanation)}
                          className="font-bold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{showExplanation ? 'Hide Solution' : '⚡ Reveal Answer Key'}</span>
                        </button>
                      </div>

                      <QuestionRenderer
                        question={q}
                        selectedOption={chosen || null}
                        onSelectOption={(opt) => setSimulatedAnswers(p => ({ ...p, [q.id]: opt }))}
                        showSolution={showExplanation}
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* 3. QUICK EDIT MODE */}
          {viewTab === 'edit' && (
            <div className="space-y-3">
              {questions.map((q, qIdx) => (
                <div
                  key={q.id || qIdx}
                  className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-300">Question #{qIdx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleDelete(qIdx)}
                      className="text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-0.5">Question Text</label>
                    <textarea
                      rows={2}
                      value={q.questionHindi || q.questionText || ''}
                      onChange={e => handleUpdateField(qIdx, 'questionHindi', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {q.options.map((opt, oIdx) => {
                      const optKey = (['A', 'B', 'C', 'D'][oIdx] || 'A') as 'A' | 'B' | 'C' | 'D';
                      const isCorrect = q.correctOption === optKey;
                      return (
                        <div key={optKey} className="flex items-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateCorrectOption(qIdx, optKey)}
                            className={`w-6 h-6 rounded font-bold text-xs shrink-0 ${
                              isCorrect ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {optKey}
                          </button>
                          <input
                            type="text"
                            value={opt.textHindi || opt.text || ''}
                            onChange={e => handleUpdateOption(qIdx, opt.id || optKey, e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white text-xs"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isImporting}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-bold transition cursor-pointer w-full sm:w-auto"
          >
            Cancel
          </button>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => onConfirm(selectedMode, questions)}
              disabled={isImporting}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm transition flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50 w-full sm:w-auto"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Importing Questions...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    Confirm Import as {selectedMode === 'mock' ? '🎯 Mock Test' : selectedMode === 'pyp' ? '📜 Official PYP' : '⚡ Both'} ({questions.length} Qs)
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
