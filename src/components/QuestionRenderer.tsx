import React, { useMemo } from 'react';
import { Question, QuestionOption, QuestionType } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { Table, CheckCircle2, SplitSquareVertical, HelpCircle, FileText, Check, History, Sparkles, Flame } from 'lucide-react';
import { extractStatementsFromStem, ParsedStemSegments } from '../utils/statementParser';

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

    const rawEnglish = (question.questionEnglish || question.question || question.questionText || question.text || '').trim();
    const rawHindi = (question.questionHindi || question.textHindi || '').trim();
    const fallbackText = rawEnglish || rawHindi || (question as any).prompt || 'Question content loading...';

    let textStem = '';
    let isFixedLanguage = false;

    if (isLanguageSubject) {
      isFixedLanguage = true;
      if (isEnglishOnly) {
        textStem = rawEnglish || rawHindi || fallbackText;
      } else {
        textStem = rawHindi || rawEnglish || fallbackText;
      }
    } else {
      // Non-language subject follows the toggle
      if (language === 'hi') {
        textStem = rawHindi || rawEnglish || fallbackText;
      } else {
        textStem = rawEnglish || rawHindi || fallbackText;
      }
    }

    return {
      stem: textStem,
      isFixedLanguage,
    };
  }, [question, isLanguageSubject, language]);

  // Robust Normalized Options Parser: supports Array of objects, Array of strings, Dictionary object, and Legacy option_A... keys
  const normalizedOptions = useMemo(() => {
    if (!question) return [];
    const rawOpts = question.options;

    // 1. Array of options
    if (Array.isArray(rawOpts) && rawOpts.length > 0) {
      return rawOpts.map((opt: any, idx: number) => {
        if (typeof opt === 'string') {
          const letter = ['A', 'B', 'C', 'D', 'E'][idx] || `Opt ${idx + 1}`;
          return { id: letter, label: letter, text: opt, textHindi: opt };
        }
        const letter = String(opt.label || opt.id || ['A', 'B', 'C', 'D', 'E'][idx] || 'A').toUpperCase();
        const textEn = String(opt.text || opt.textEnglish || opt.option || opt.value || opt.textHindi || '').trim();
        const textHi = String(opt.textHindi || opt.text || opt.value || textEn).trim();
        return {
          id: letter,
          label: letter,
          text: textEn || textHi,
          textHindi: textHi || textEn,
        };
      });
    }

    // 2. Dictionary object: { A: 'text', B: 'text' }
    if (rawOpts && typeof rawOpts === 'object') {
      return Object.entries(rawOpts).map(([key, val]: [string, any], idx) => {
        const textStr = typeof val === 'string' ? val : (val.text || val.textHindi || val.value || '');
        const letter = key.toUpperCase();
        return {
          id: letter,
          label: letter,
          text: textStr,
          textHindi: typeof val === 'object' && val.textHindi ? val.textHindi : textStr,
        };
      });
    }

    // 3. Fallback for legacy option_A, option_B, option_C, option_D
    const qAny = question as any;
    if (qAny.option_A || qAny.option_B || qAny.optionA || qAny.optionB) {
      const optA = String(qAny.option_A || qAny.optionA || '');
      const optB = String(qAny.option_B || qAny.optionB || '');
      const optC = String(qAny.option_C || qAny.optionC || '');
      const optD = String(qAny.option_D || qAny.optionD || '');
      return [
        { id: 'A', label: 'A', text: optA, textHindi: qAny.option_A_hi || optA },
        { id: 'B', label: 'B', text: optB, textHindi: qAny.option_B_hi || optB },
        { id: 'C', label: 'C', text: optC, textHindi: qAny.option_C_hi || optC },
        { id: 'D', label: 'D', text: optD, textHindi: qAny.option_D_hi || optD },
      ];
    }

    return [];
  }, [question]);

  // Extract structured statements/segments from attached data or text stem
  const parsedStem: ParsedStemSegments = useMemo(() => {
    // 1. If explicit structured statements exist on the question
    if (Array.isArray(question.statements) && question.statements.length > 0) {
      const segs = question.statements.map((stmt: any, idx: number) => {
        const stmtText = (language === 'hi'
          ? (stmt.textHindi || stmt.text || (typeof stmt === 'string' ? stmt : ''))
          : (stmt.text || stmt.textHindi || (typeof stmt === 'string' ? stmt : ''))
        );
        const label = String(stmt.label || stmt.id || (idx + 1));
        return {
          id: label,
          label,
          text: stmtText,
        };
      });

      return {
        hasSegments: true,
        intro: activeContent.stem,
        segments: segs,
      };
    }

    // 2. Automatically parse segments from active stem text (e.g. "K. ... L. ... M. ... N. ...")
    return extractStatementsFromStem(activeContent.stem);
  }, [question.statements, activeContent.stem, language]);

  // Detected question type fallback
  const resolvedType: QuestionType = useMemo(() => {
    // Priority 1: Check for Matching question (Column A / Column B)
    const colA = question.columnA || (question as any).column1 || (question as any).list1;
    const colB = question.columnB || (question as any).column2 || (question as any).list2;
    if (Array.isArray(colA) && Array.isArray(colB) && colA.length > 0 && colB.length > 0) {
      return 'matching';
    }

    // Priority 2: Check for Assertion & Reason question (STRICT PRIORITY over multi_statement)
    const lower = (activeContent.stem + ' ' + (question.question || '') + ' ' + (question.questionHindi || '')).toLowerCase();
    const isAssertionReason = (
      question.questionType === 'assertion_reason' ||
      question.type === 'assertion_reason' ||
      Boolean(question.assertion || question.reason) ||
      Boolean(question.assertionHindi || question.reasonHindi) ||
      (lower.includes('कथन') && (lower.includes('कारण') || lower.includes('अभिकथन'))) ||
      (lower.includes('अभिकथन') && lower.includes('कारण')) ||
      (lower.includes('assertion') && lower.includes('reason')) ||
      lower.includes('labelled as assertion') ||
      lower.includes('labelled as reason') ||
      lower.includes('अभिकथन (a)') ||
      lower.includes('कारण (r)')
    );

    if (isAssertionReason) {
      return 'assertion_reason';
    }

    // Priority 3: Multi-statement question (structured or detected)
    if (parsedStem.hasSegments) {
      return 'multi_statement';
    }
    if (Array.isArray(question.statements) && question.statements.length > 0) {
      return 'multi_statement';
    }
    if (question.questionType === 'multi_statement' || question.type === 'multi_statement') {
      return 'multi_statement';
    }

    // Priority 4: Text-based matching lists
    if (lower.includes('सूची-i') || lower.includes('सूची - i') || lower.includes('list-i') || lower.includes('list i') || lower.includes('match the following') || lower.includes('सुमेलित कीजिए')) {
      return 'matching';
    }

    if (question.questionType) return question.questionType;
    if (question.type) return question.type;

    return 'mcq';
  }, [question, activeContent.stem, parsedStem.hasSegments]);

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
    const colA: any[] = question.columnA || (question as any).column1 || (question as any).list1 || (question as any).listA || [];
    const colB: any[] = question.columnB || (question as any).column2 || (question as any).list2 || (question as any).listB || [];
    const hasStructuredColumns = Array.isArray(colA) && Array.isArray(colB) && colA.length > 0 && colB.length > 0;

    // CASE 1: Structured Column A and Column B arrays (from Ingestion or Question Bank)
    if (hasStructuredColumns) {
      const showHindiSecondary = language === 'en' && question.questionHindi && question.questionHindi.trim() !== stemText.trim() && !isLanguageSubject;

      return (
        <div className="space-y-4">
          <div>
            <p className="text-base sm:text-lg font-semibold text-white leading-relaxed">
              {stemText}
            </p>
            {showHindiSecondary && (
              <p className="text-emerald-300/90 text-sm font-medium leading-relaxed border-l-2 border-emerald-500/40 pl-3 py-0.5 mt-1.5">
                {question.questionHindi}
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-purple-500/30 overflow-hidden bg-slate-950/80 shadow-lg">
            {/* Table Header */}
            <div className="grid grid-cols-1 md:grid-cols-2 bg-purple-950/40 border-b border-purple-500/30 text-xs sm:text-sm font-black text-purple-200">
              <div className="p-3 md:border-r border-purple-500/20 flex items-center space-x-2">
                <Table className="w-4 h-4 text-purple-400" />
                <span>Column I (सूची - I)</span>
              </div>
              <div className="p-3 hidden md:flex items-center space-x-2">
                <Table className="w-4 h-4 text-purple-400" />
                <span>Column II (सूची - II)</span>
              </div>
            </div>

            {/* Two Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800">
              {/* Column A Items */}
              <div className="p-3.5 space-y-2">
                <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider block md:hidden pb-1 border-b border-purple-500/20">
                  Column I (सूची - I)
                </span>
                {colA.map((item, idx) => {
                  const label = item.id || (idx + 1);
                  const text = (language === 'hi' && !isLanguageSubject
                    ? (item.textHindi || item.text || String(item))
                    : (item.text || item.textHindi || String(item))
                  );
                  return (
                    <div key={idx} className="flex items-start space-x-2.5 p-2 rounded-lg bg-slate-900/60 border border-slate-850 hover:border-purple-500/30 transition">
                      <span className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-purple-500/30 font-mono">
                        {label}
                      </span>
                      <div className="text-sm font-medium text-slate-100 leading-snug pt-0.5">
                        {text}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Column B Items */}
              <div className="p-3.5 space-y-2">
                <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider block md:hidden pb-1 border-b border-purple-500/20">
                  Column II (सूची - II)
                </span>
                {colB.map((item, idx) => {
                  const label = item.id || String.fromCharCode(65 + idx);
                  const text = (language === 'hi' && !isLanguageSubject
                    ? (item.textHindi || item.text || String(item))
                    : (item.text || item.textHindi || String(item))
                  );
                  return (
                    <div key={idx} className="flex items-start space-x-2.5 p-2 rounded-lg bg-slate-900/60 border border-slate-850 hover:border-purple-500/30 transition">
                      <span className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-purple-500/30 font-mono">
                        {label}
                      </span>
                      <div className="text-sm font-medium text-slate-100 leading-snug pt-0.5">
                        {text}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // CASE 2: Text-parsed List-I and List-II markers
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
    // Check structured assertion/reason properties first
    const hasStructured = Boolean(question.assertion || question.reason);
    if (hasStructured) {
      const assertionText = (language === 'hi' && !isLanguageSubject && question.assertionHindi) ? question.assertionHindi : (question.assertion || question.assertionHindi || '');
      const reasonText = (language === 'hi' && !isLanguageSubject && question.reasonHindi) ? question.reasonHindi : (question.reason || question.reasonHindi || '');

      return (
        <div className="space-y-4">
          {stemText && stemText !== assertionText && (
            <p className="text-base sm:text-lg font-semibold text-white leading-relaxed">
              {stemText}
            </p>
          )}

          {/* Assertion Box */}
          {assertionText && (
            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-start space-x-3">
              <span className="px-2.5 py-1 rounded bg-amber-500/30 text-amber-300 font-bold text-xs shrink-0 tracking-wide border border-amber-500/40">
                {t('assertion', 'Assertion [A]')}
              </span>
              <div className="text-sm sm:text-base font-medium text-slate-100 leading-relaxed">
                {assertionText}
              </div>
            </div>
          )}

          {/* Reason Box */}
          {reasonText && (
            <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 flex items-start space-x-3">
              <span className="px-2.5 py-1 rounded bg-cyan-500/30 text-cyan-300 font-bold text-xs shrink-0 tracking-wide border border-cyan-500/40">
                {t('reason', 'Reason [R]')}
              </span>
              <div className="text-sm sm:text-base font-medium text-slate-100 leading-relaxed">
                {reasonText}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Attempt to parse Assertion and Reason components from text
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
      // Check inline pattern e.g. "Assertion (A): ... Reason (R): ..." or "Assertion [A]: ... Reason [R]: ..."
      const inlineMatch = stemText.match(/(.*?)(?:Assertion|अभिकथन)\s*[\(\[]A[\)\]]?[:\s]+(.*?)(?:Reason|कारण)\s*[\(\[]R[\)\]]?[:\s]+(.*)/i);
      if (inlineMatch) {
        intro = inlineMatch[1].trim();
        assertionText = inlineMatch[2].trim();
        reasonText = inlineMatch[3].trim();
      }
    }

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
  // MULTI-STATEMENT RENDERER (Clean one-below-another segmented layout)
  // -------------------------------------------------------------
  const renderMultiStatementStem = () => {
    const { intro, segments, hasSegments } = parsedStem;

    if (!hasSegments || segments.length === 0) {
      return (
        <p className="text-base sm:text-lg font-semibold text-white leading-relaxed whitespace-pre-line">
          {activeContent.stem}
        </p>
      );
    }

    return (
      <div className="space-y-4">
        {intro && (
          <p className="text-base sm:text-lg font-semibold text-white leading-relaxed">
            {intro}
          </p>
        )}

        <div className="space-y-2.5 pt-1">
          {segments.map((stmt, idx) => (
            <div
              key={idx}
              className="p-3.5 sm:p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 text-sm sm:text-base flex items-start space-x-3.5 hover:border-slate-750 transition-colors shadow-sm"
            >
              <div className="w-7 h-7 rounded-full bg-slate-800 text-emerald-400 font-black text-xs flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/30 ring-2 ring-emerald-500/10 font-mono">
                {stmt.label}
              </div>
              <p className="font-medium leading-relaxed pt-0.5 text-slate-100">
                {stmt.text}
              </p>
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
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold uppercase tracking-wider text-[10px] border border-slate-700">
              {resolvedType.replace('_', ' ')}
            </span>

            {/* Provenance Badge */}
            {(() => {
              const isPyq = question.originType === 'pyq' || (question.pypAppearances && question.pypAppearances.length > 0) || Boolean(question.pypSource);
              const appearances = question.pypAppearances || (question.pypSource ? [{ examName: question.pypSource, year: 2022 }] : []);
              const isRepeated = appearances.length > 1;

              if (isPyq) {
                return (
                  <div className="flex items-center space-x-1.5">
                    <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 font-bold uppercase tracking-wider text-[10px] border border-amber-500/40 flex items-center space-x-1">
                      <History className="w-3 h-3 text-amber-400" />
                      <span>OFFICIAL PYQ</span>
                      {appearances[0]?.year && (
                        <span className="font-mono text-amber-200">({appearances[0].year})</span>
                      )}
                    </span>
                    {isRepeated && (
                      <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30 flex items-center space-x-1">
                        <Flame className="w-2.5 h-2.5 text-purple-400" />
                        <span className="hidden sm:inline">Repeated in {appearances.length} Exams</span>
                      </span>
                    )}
                  </div>
                );
              }

              return (
                <span className="px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 font-bold uppercase tracking-wider text-[10px] border border-indigo-500/30 flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  <span>MOCK QUESTION</span>
                </span>
              );
            })()}

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
        {resolvedType === 'multi_statement' && renderMultiStatementStem()}
        {resolvedType === 'mcq' && (
          parsedStem.hasSegments ? renderMultiStatementStem() : (
            <p className="text-base sm:text-lg font-semibold text-white leading-relaxed whitespace-pre-line">
              {activeContent.stem}
            </p>
          )
        )}
      </div>

      {/* 2. Options Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
          <span>{t('select_one', 'Select one option:')}</span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {normalizedOptions.map((option) => {
            const optLabel = option.label || option.id || 'A';
            const isSelected = selectedOption === optLabel;
            const optionText = (language === 'hi' && !activeContent.isFixedLanguage
              ? (option.textHindi || option.text)
              : (option.text || option.textHindi)
            );
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
      {showSolution && (() => {
        const expEn = String(question.explanation || (question as any).explaination || (question as any).solution || (question as any).sol || '').trim();
        const expHi = String(question.explanationHindi || (question as any).solutionHindi || (question as any).explainationHindi || '').trim();

        return (
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-emerald-500/40 space-y-3 mt-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
              <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>{t('explanation', 'Step-by-Step Detailed Solution (विस्तृत व्याख्या)')}</span>
              </div>
              {question.correctOption && (
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold flex items-center space-x-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                  <span>Correct Option: <strong className="text-white text-sm">{question.correctOption}</strong></span>
                </span>
              )}
            </div>

            {/* Official Exam Provenance in Solution Mode */}
            {(() => {
              const isPyq = question.originType === 'pyq' || (question.pypAppearances && question.pypAppearances.length > 0) || Boolean(question.pypSource);
              const appearances = question.pypAppearances || (question.pypSource ? [{ examName: question.pypSource, year: 2022 }] : []);

              if (isPyq && appearances.length > 0) {
                return (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 space-y-1.5 text-xs">
                    <div className="flex items-center space-x-2 text-amber-300 font-bold text-xs">
                      <History className="w-4 h-4 text-amber-400" />
                      <span>Official Past Year Examination Provenance (वास्तविक परीक्षा संदर्भ):</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      {appearances.map((app, aIdx) => (
                        <span
                          key={aIdx}
                          className="px-2.5 py-1 rounded-lg bg-slate-950 border border-amber-500/40 text-amber-200 text-xs font-medium flex items-center space-x-1.5 shadow-sm"
                        >
                          <span className="font-bold text-white">{app.examName}</span>
                          {app.year && <span className="font-mono text-emerald-400 font-bold">({app.year})</span>}
                          {app.shift && <span className="text-slate-400 text-[11px]">• {app.shift}</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              }

              if (!isPyq) {
                return (
                  <div className="bg-indigo-500/10 border border-indigo-500/25 rounded-xl p-2.5 flex items-center space-x-2 text-xs text-indigo-300">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="text-[11px]">
                      Mock Test Series Practice Item — crafted specifically per CGPSC & CG Vyapam latest syllabus trends.
                    </span>
                  </div>
                );
              }

              return null;
            })()}

            <div className="space-y-2.5 text-sm text-slate-200 leading-relaxed pt-1">
              {expEn && (
                <p className="whitespace-pre-line">{expEn}</p>
              )}
              {expHi && expHi !== expEn && (
                <p className="text-emerald-300/95 font-medium leading-relaxed border-t border-slate-800/80 pt-2 text-xs sm:text-sm whitespace-pre-line">
                  {expHi}
                </p>
              )}
              {!expEn && !expHi && (
                <p className="text-slate-400 italic text-xs">Explanation not provided for this question.</p>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
};
