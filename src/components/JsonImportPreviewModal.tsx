import React, { useState } from 'react';
import { Question } from '../types';
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
  Tag
} from 'lucide-react';

interface JsonImportPreviewModalProps {
  isOpen: boolean;
  rawJsonData: any[];
  mappedQuestions: Question[];
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isImporting: boolean;
}

export const JsonImportPreviewModal: React.FC<JsonImportPreviewModalProps> = ({
  isOpen,
  mappedQuestions,
  onClose,
  onConfirm,
  isImporting,
}) => {
  if (!isOpen || mappedQuestions.length === 0) return null;

  const previewList = mappedQuestions.slice(0, 3);
  const sampleExam = mappedQuestions[0]?.examName || 'CG Exam';
  const sampleYear = mappedQuestions[0]?.year || 2026;

  // Question type tally
  const typeCounts = mappedQuestions.reduce((acc, q) => {
    const t = q.questionType || 'mcq';
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
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
              JSON Import Preview & Validation
            </h2>
            <p className="text-xs text-slate-400">
              Exam: <strong className="text-slate-200">{sampleExam} ({sampleYear})</strong> • Verified Schema
            </p>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-center">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Qs</span>
            <span className="text-xl font-black text-emerald-400">{mappedQuestions.length}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">MCQ</span>
            <span className="text-xl font-black text-blue-400">{typeCounts['mcq'] || 0}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Matching</span>
            <span className="text-xl font-black text-purple-400">{typeCounts['matching'] || 0}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Assertion/Reason</span>
            <span className="text-xl font-black text-amber-400">{typeCounts['assertion_reason'] || 0}</span>
          </div>
        </div>

        {/* Sample Question Previews (First 3) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>First {previewList.length} Questions Preview:</span>
            <span className="text-emerald-400 font-normal">Auto-detected schema ready</span>
          </div>

          <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1 scrollbar-thin">
            {previewList.map((q, idx) => (
              <div
                key={q.id}
                className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                      Q{idx + 1}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                      {q.id}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold text-[10px]">
                      {q.questionType || 'mcq'}
                    </span>
                  </div>
                  <span className="text-slate-400 font-medium">
                    Ans: <strong className="text-emerald-400">({q.correctOption})</strong>
                  </span>
                </div>

                <p className="text-slate-100 font-medium line-clamp-2">
                  {q.question || q.questionHindi}
                </p>

                {q.questionHindi && q.question !== q.questionHindi && (
                  <p className="text-emerald-300/80 line-clamp-2 font-sans border-t border-slate-800/80 pt-1">
                    {q.questionHindi}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px] text-slate-400">
                  {q.options.map(opt => (
                    <div key={opt.label} className="truncate">
                      <strong className="text-slate-200">{opt.label}:</strong> {opt.text || opt.textHindi}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isImporting}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-bold transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isImporting}
            className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm transition flex items-center space-x-2 shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
          >
            {isImporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Importing Questions...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Import ({mappedQuestions.length} Questions)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
