import React, { useMemo } from 'react';
import { Question, QuestionOption, QuestionType } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { Table, CheckCircle2, SplitSquareVertical, HelpCircle, FileText, Check } from 'lucide-react';

interface QuestionRendererProps {
  question: Question;
  selectedOption: 'A' | 'B' | 'C' | 'D' | string | null;
  onSelectOption?: (opt: any) => void;
  showSolution?: boolean;
}

export const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  selectedOption,
  onSelectOption,
  showSolution = false,
}) => {
  const { language, t } = useLanguage();

  // Determine Effective Language & Question Text based on subjectCategory
  // CASE A: subjectCategory === 'language' (General English, General Hindi, Chhattisgarhi Language)
  // - English subject: always English text
  // - Hindi subject: always Hindi text
  // CASE B: subjectCategory === 'non_language' (General Studies, Quantitative Aptitude, Reasoning)
  // - Toggle controls Hindi vs English
  const isLanguageSubject = useMemo(() => {
    if (question.subjectCategory === 'language') return true;
    const subj = (question.subject || '').toLowerCase();
    return subj.includes('english') || subj.includes('hindi') || subj.includes('chhattisgarhi') || subj.includes('sanskrit');
  }, [question.subjectCategory, question.subject]);

  const activeContent = useMemo(() => {
    const subj = (question.subject || '').toLowerCase();
    const isEnglishOnly = subj.includes('english');
    const isHindiOnly = subj.includes('hindi') || subj.includes('chhattisgarhi');

    let textStem = '';
    let isFixedLanguage = false;

    if (isLanguageSubject) {
      isFixedLanguage = true;
      if (isEnglishOnly) {
        textStem = question.question || question.questionEnglish || question.questionText || question.text || question.questionHindi || '';
      } else {
        textStem = question.questionHindi || question.textHindi || question.question || question.questionText || question.text || '';
      }
    } else {
      // Non-language subject follows the toggle
      if (language === 'hi') {
        textStem = question.questionHindi || question.textHindi || question.question || question.questionText || question.text || '';
      } else {
        textStem = question.question || question.questionEnglish || question.questionText || question.text || question.questionHindi || '';
      }
    }

    return {
      stem: textStem,
      isFixedLanguage,
    };
  }, [question, isLanguageSubject, language]);

  // Detected question type fallback
  const resolvedType: QuestionType = useMemo(() => {
    if (question.questionType) return question.questionType;
    if (question.type) return question.type;

    const lower = (activeContent.stem + ' ' + (question.question || '') + ' ' + (question.questionHindi || '')).toLowerCase();
    if (lower.includes('कथन') && (lower.includes('कारण') || lower.includes('अभिकथन')) || lower.includes('assertion') && lower.includes('reason')) {
      return 'assertion_reason';
    }
    if (lower.includes('सूची-i') || lower.includes('सूची - i') || lower.includes('list-i') || lower.includes('list i') || lower.includes('match the following')) {
      return 'matching';
    }
    if ((lower.includes('(j)') || lower.includes('(1)') || lower.includes('(i)')) && (lower.includes('केवल') || lower.includes('only') || lower.includes('which of the statement'))) {
      return 'multi_statement';
    }
    return 'mcq';
  }, [question, activeContent.stem]);

  // Helper to get option text according to bilingual rules
  const getOptionText = (option: QuestionOption): string => {
    const subj = (question.subject || '').toLowerCase();
    const isEnglishOnly = subj.includes('english');

    if (isLanguageSubject) {
      if (isEnglishOnly) {
        return option.text || option.textHindi || '';
      }
      return option.textHindi || option.text || '';
    }

    if (language === 'hi') {
      return option.textHindi || option.text || '';
    }
    return option.text || option.textHindi || '';
  };

  // -------------------------------------------------------------
  // MATCHING QUESTION RENDERER (List-I and List-II Table)
  // -------------------------------------------------------------
  const renderMatchingStem = (stemText: string) => {
    // Check if the text contains List-I and List-II markers
    const hasListSplit = stemText.includes('List-I') || stemText.includes('सूची-I') || stemText.includes('सूची - I') || stemText.includes('List I');

    if (!hasListSplit) {
      return (
        <p className="text-base sm:text-lg font-semibold text-white leading-relaxed whitespace-pre-line">
          {stemText}
        </p>
      );
    }

    // Split intro text and lists if possible
    const lines = stemText.split('\n').filter(l => l.trim().length > 0);
    const introLines: string[] = [];
    const list1Lines: string[] = [];
    const list2Lines: string[] = [];
    let currentSection: 'intro' | 'list1' | 'list2' = 'intro';

    lines.forEach(line => {
      const lower = line.toLowerCase();
      if (lower.includes('list-i') || lower.includes('सूची-i') || lower.includes('सूची - i') || lower.includes('list i')) {
        currentSection = 'list1';
      } else if (lower.includes('list-ii') || lower.includes('सूची-ii') || lower.includes('सूची - ii') || lower.includes('list ii')) {
        currentSection = 'list2';
      } else if (currentSection === 'intro') {
        introLines.push(line);
      } else if (currentSection === 'list1') {
        list1Lines.push(line);
      } else if (currentSection === 'list2') {
        list2Lines.push(line);
      }
    });

    const maxRows = Math.max(list1Lines.length, list2Lines.length);

    return (
      <div className="space-y-4">
        {introLines.length > 0 && (
          <p className="text-base sm:text-lg font-semibold text-white leading-relaxed">
            {introLines.join(' ')}
          </p>
        )}

        <div className="rounded-xl border border-indigo-500/30 overflow-hidden bg-slate-950/70 shadow-md">
          <div className="grid grid-cols-2 bg-indigo-950/40 border-b border-indigo-500/30 text-xs sm:text-sm font-black text-indigo-300">
            <div className="p-3 border-r border-indigo-500/20 flex items-center space-x-2">
              <Table className="w-4 h-4 text-indigo-400" />
              <span>{t('list_1', 'List - I (सूची - I)')}</span>
            </div>
            <div className="p-3 flex items-center space-x-2">
              <Table className="w-4 h-4 text-indigo-400" />
              <span>{t('list_2', 'List - II (सूची - II)')}</span>
            </div>
          </div>

          <div className="divide-y divide-slate-800 text-xs sm:text-sm">
            {Array.from({ length: maxRows > 0 ? maxRows : 4 }).map((_, idx) => (
              <div key={idx} className="grid grid-cols-2 hover:bg-slate-900/50 transition">
                <div className="p-3 border-r border-slate-800 text-slate-200 font-medium leading-relaxed">
                  {list1Lines[idx] || (lines[idx] ? lines[idx] : `1. Item ${idx + 1}`)}
                </div>
                <div className="p-3 text-slate-300 font-medium leading-relaxed">
                  {list2Lines[idx] || (lines[idx + 4] ? lines[idx + 4] : `A. Match ${idx + 1}`)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------
  // ASSERTION & REASON RENDERER
  // -------------------------------------------------------------
  const renderAssertionReasonStem = (stemText: string) => {
    // Attempt to parse Assertion and Reason components
    let assertionText = '';
    let reasonText = '';
    let intro = '';

    const lines = stemText.split('\n').map(l => l.trim()).filter(Boolean);

    lines.forEach(line => {
      const lower = line.toLowerCase();
      if (lower.startsWith('assertion') || lower.startsWith('अभिकथन') || lower.includes('[a]:') || lower.includes('(a):') || lower.startsWith('a:')) {
        assertionText = line.replace(/^(assertion|अभिकथन|[a]:|\(a\):|a:)\s*/i, '');
      } else if (lower.startsWith('reason') || lower.startsWith('कारण') || lower.includes('[r]:') || lower.includes('(r):') || lower.startsWith('r:')) {
        reasonText = line.replace(/^(reason|कारण|[r]:|\(r\):|r:)\s*/i, '');
      } else {
        intro += (intro ? ' ' : '') + line;
      }
    });

    if (!assertionText && !reasonText) {
      // Fallback: If not separated by newlines, render formatted stem
      return (
        <div className="space-y-3">
          <p className="text-base sm:text-lg font-semibold text-white leading-relaxed whitespace-pre-line">
            {stemText}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {intro && (
          <p className="text-base sm:text-lg font-semibold text-slate-200 leading-relaxed">
            {intro}
          </p>
        )}

        {/* Assertion Box */}
        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-start space-x-3">
          <span className="px-2.5 py-1 rounded bg-emerald-500/30 text-emerald-300 font-bold text-xs shrink-0 tracking-wide">
            {t('assertion', 'Assertion [A]')}
          </span>
          <p className="text-sm sm:text-base font-medium text-slate-100 leading-relaxed">
            {assertionText}
          </p>
        </div>

        {/* Reason Box */}
        <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30 flex items-start space-x-3">
          <span className="px-2.5 py-1 rounded bg-indigo-500/30 text-indigo-300 font-bold text-xs shrink-0 tracking-wide">
            {t('reason', 'Reason [R]')}
          </span>
          <p className="text-sm sm:text-base font-medium text-slate-100 leading-relaxed">
            {reasonText}
          </p>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------
  // MULTI-STATEMENT RENDERER
  // -------------------------------------------------------------
  const renderMultiStatementStem = (stemText: string) => {
    // If structured statements array is provided on the question
    const structuredStatements = question.statements;
    if (Array.isArray(structuredStatements) && structuredStatements.length > 0) {
      return (
        <div className="space-y-4">
          {stemText && (
            <p className="text-base sm:text-lg font-semibold text-white leading-relaxed">
              {stemText}
            </p>
          )}

          <div className="space-y-2.5">
            {structuredStatements.map((stmt: any, idx: number) => {
              const stmtText = (language === 'hi'
                ? (stmt.textHindi || stmt.text || (typeof stmt === 'string' ? stmt : ''))
                : (stmt.text || stmt.textHindi || (typeof stmt === 'string' ? stmt : ''))
              );
              const label = stmt.id || (idx + 1);

              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 text-sm sm:text-base flex items-start space-x-3"
                >
                  <div className="w-6 h-6 rounded-full bg-slate-800 text-emerald-400 font-black text-xs flex items-center justify-center shrink-0 mt-0.5 border border-slate-700">
                    {label}
                  </div>
                  <p className="font-medium leading-relaxed">{stmtText}</p>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    const lines = stemText.split('\n').map(l => l.trim()).filter(Boolean);
    const statements: string[] = [];
    const promptLines: string[] = [];

    lines.forEach(line => {
      if (/^(\([A-Z0-9]\)|[A-Z0-9]\.|\([i|v|x]+\)|[i|v|x]+\.)\s*/i.test(line)) {
        statements.push(line);
      } else {
        promptLines.push(line);
      }
    });

    if (statements.length === 0) {
      return (
        <p className="text-base sm:text-lg font-semibold text-white leading-relaxed whitespace-pre-line">
          {stemText}
        </p>
      );
    }

    return (
      <div className="space-y-4">
        {promptLines.length > 0 && (
          <p className="text-base sm:text-lg font-semibold text-white leading-relaxed">
            {promptLines.join(' ')}
          </p>
        )}

        <div className="space-y-2.5">
          {statements.map((stmt, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 text-sm sm:text-base flex items-start space-x-3"
            >
              <div className="w-6 h-6 rounded-full bg-slate-800 text-emerald-400 font-black text-xs flex items-center justify-center shrink-0 mt-0.5 border border-slate-700">
                {idx + 1}
              </div>
              <p className="font-medium leading-relaxed">{stmt}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Question Stem Box with Type Badge */}
      <div className="bg-slate-900/80 p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-sm relative overflow-hidden">
        {/* Type indicator banner */}
        <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800/80 text-xs">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold uppercase tracking-wider text-[10px] border border-slate-700">
              {resolvedType.replace('_', ' ')}
            </span>
            {activeContent.isFixedLanguage && (
              <span className="text-[11px] text-amber-400/90 font-medium flex items-center space-x-1">
                <span>•</span>
                <span>{t('fixed_language_notice', 'Fixed Language Section')}</span>
              </span>
            )}
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            {question.id}
          </div>
        </div>

        {/* Dynamic Stem Render */}
        {resolvedType === 'matching' && renderMatchingStem(activeContent.stem)}
        {resolvedType === 'assertion_reason' && renderAssertionReasonStem(activeContent.stem)}
        {resolvedType === 'multi_statement' && renderMultiStatementStem(activeContent.stem)}
        {resolvedType === 'mcq' && (
          <p className="text-base sm:text-lg font-semibold text-white leading-relaxed whitespace-pre-line">
            {activeContent.stem}
          </p>
        )}
      </div>

      {/* 2. Options Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
          <span>{t('select_one', 'Select one option:')}</span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {question.options.map((option) => {
            const optLabel = option.label || option.id || 'A';
            const isSelected = selectedOption === optLabel;
            const optionText = getOptionText(option);
            const isCorrect = showSolution && question.correctOption === optLabel;
            const isWrong = showSolution && isSelected && question.correctOption !== optLabel;

            let cardStyle = 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850';
            if (isSelected && !showSolution) {
              cardStyle = 'bg-emerald-500/15 border-emerald-500 shadow-md shadow-emerald-500/10';
            } else if (isCorrect) {
              cardStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-200';
            } else if (isWrong) {
              cardStyle = 'bg-rose-500/20 border-rose-500 text-rose-200';
            }

            return (
              <button
                key={optLabel}
                type="button"
                disabled={showSolution}
                onClick={() => onSelectOption && onSelectOption(optLabel)}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-start space-x-3.5 group cursor-pointer ${cardStyle}`}
              >
                {/* Radio Circle */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 transition-all ${
                    isCorrect
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : isWrong
                      ? 'bg-rose-500 text-white font-black'
                      : isSelected
                      ? 'bg-emerald-500 text-slate-950 font-black ring-4 ring-emerald-500/20'
                      : 'bg-slate-800 text-slate-300 border border-slate-700 group-hover:border-slate-500'
                  }`}
                >
                  {showSolution && isCorrect ? <Check className="w-4 h-4 stroke-[3]" /> : optLabel}
                </div>

                {/* Option Text */}
                <div className="flex-1 text-sm sm:text-base font-medium leading-relaxed text-slate-200 pt-0.5">
                  {optionText}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Explanation in Solutions Mode */}
      {showSolution && (
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 mt-4">
          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>{t('explanation', 'Detailed Explanation')}</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            {language === 'hi' && question.explanationHindi
              ? question.explanationHindi
              : question.explanation || question.explanationHindi || 'Explanation not provided.'}
          </p>
        </div>
      )}
    </div>
  );
};
