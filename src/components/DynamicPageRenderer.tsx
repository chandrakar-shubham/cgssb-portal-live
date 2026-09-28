import React, { useState } from 'react';
import { CMSPage, PageBlock, DEFAULT_PAGE_THEME_TOKENS, ThemeTokens } from '../types/cms';
import { AdSlotRenderer } from './AdSlotRenderer';
import {
  Sparkles,
  HelpCircle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Layers,
  Globe,
  Calendar,
  FileText,
  Download,
  AlertCircle,
  Share2,
  BookOpen,
  Award,
  Check,
  X
} from 'lucide-react';

interface DynamicPageRendererProps {
  page: CMSPage;
  onNavigateToTests?: () => void;
  onStartTestById?: (testId: string) => void;
  siteSettingsTheme?: ThemeTokens;
}

export const DynamicPageRenderer: React.FC<DynamicPageRendererProps> = ({
  page,
  onNavigateToTests,
  onStartTestById,
  siteSettingsTheme,
}) => {
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);
  const [quizAnswerState, setQuizAnswerState] = useState<Record<string, number | null>>({});
  const [copiedShare, setCopiedShare] = useState(false);

  // Resolve active theme tokens
  const archetype = page.themeArchetype || 'hero_landing';
  const defaultTokens = DEFAULT_PAGE_THEME_TOKENS[archetype] || DEFAULT_PAGE_THEME_TOKENS.hero_landing;
  const activeTheme: ThemeTokens = {
    ...defaultTokens,
    ...(siteSettingsTheme || {}),
    ...(page.themeOverride || {}),
  };

  const handleShareClick = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  return (
    <article className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-10 font-sans">
      {/* Optional Top Leaderboard Ad */}
      {activeTheme.adDensity !== 'none' && (
        <AdSlotRenderer slotType="topLeaderboard" theme={activeTheme} />
      )}

      {/* Page Header (Archetype Governed) */}
      <div className="border-b border-slate-800/80 pb-6 space-y-3">
        {activeTheme.showBreadcrumbs && (
          <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
            <span>Portal</span>
            <span>/</span>
            <span>Pages</span>
            <span>/</span>
            <span className="text-white font-bold">{page.slug}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold">
            <Globe className="w-3.5 h-3.5" />
            <span>Official CGSSB Exam Resource</span>
          </div>

          {activeTheme.showSocialShare && (
            <button
              onClick={handleShareClick}
              className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold transition cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copiedShare ? 'Link Copied!' : 'Share Page'}</span>
            </button>
          )}
        </div>

        <h1 className={`text-3xl sm:text-4xl lg:text-5xl text-white ${activeTheme.headingFont} leading-tight`}>
          {page.title}
        </h1>
      </div>

      {/* Render Blocks */}
      <div className="space-y-10">
        {page.blocks.map(block => (
          <React.Fragment key={block.id}>
            {renderBlockContent(
              block,
              activeTheme,
              openFaqIdx,
              setOpenFaqIdx,
              quizAnswerState,
              setQuizAnswerState,
              onNavigateToTests,
              onStartTestById
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Optional Bottom Footer Ad */}
      {activeTheme.adDensity !== 'none' && (
        <AdSlotRenderer slotType="postFooter" theme={activeTheme} />
      )}
    </article>
  );
};

function renderBlockContent(
  block: PageBlock,
  theme: ThemeTokens,
  openFaqIdx: number | null,
  setOpenFaqIdx: (idx: number | null) => void,
  quizAnswerState: Record<string, number | null>,
  setQuizAnswerState: React.Dispatch<React.SetStateAction<Record<string, number | null>>>,
  onNavigateToTests?: () => void,
  onStartTestById?: (testId: string) => void
) {
  switch (block.type) {
    case 'hero':
      return (
        <div
          className={`bg-gradient-to-r ${theme.accentGradient} p-8 sm:p-12 ${theme.borderRadius} shadow-2xl relative overflow-hidden text-center sm:text-left space-y-6 border border-white/10`}
        >
          <div className="max-w-2xl space-y-3 relative z-10">
            <div className="inline-block px-3 py-1 rounded-full bg-black/30 backdrop-blur text-white text-xs font-black uppercase tracking-wider">
              {block.title || 'Official Series'}
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight">
              {block.title}
            </h2>
            {block.subtitle && (
              <p className="text-sm sm:text-base text-white/90 leading-relaxed font-medium">
                {block.subtitle}
              </p>
            )}
          </div>

          {block.buttonText && (
            <div className="relative z-10 pt-2">
              <a
                href={block.buttonLink || '/test-series'}
                onClick={e => {
                  if (block.buttonLink === '/test-series' && onNavigateToTests) {
                    e.preventDefault();
                    onNavigateToTests();
                  }
                }}
                className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-2xl bg-slate-950 hover:bg-slate-900 text-white font-black text-sm shadow-2xl transition cursor-pointer border border-white/20"
              >
                <span>{block.buttonText}</span>
                <ArrowRight className="w-4 h-4 text-emerald-400" />
              </a>
            </div>
          )}
        </div>
      );

    case 'exam_notification_box': {
      const meta = block.notificationMeta;
      if (!meta) return null;
      return (
        <div className={`p-6 sm:p-8 bg-slate-900/90 border border-rose-500/30 ${theme.borderRadius} space-y-6 shadow-xl`}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
                Official Exam Notification
              </span>
              <h3 className="text-xl font-black text-white">{meta.examName}</h3>
              <p className="text-xs text-slate-400">Conducting Authority: {meta.authority}</p>
            </div>
            {meta.officialPdfUrl && (
              <a
                href={meta.officialPdfUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Download Official PDF</span>
              </a>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Application Deadline</span>
              <span className="text-white font-black">{meta.applicationEndDate || 'To be announced'}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Exam Date</span>
              <span className="text-amber-400 font-black">{meta.examDate || 'Scheduled 2026'}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Total Vacancies</span>
              <span className="text-emerald-400 font-black">{meta.totalVacancies || 'Multiple Posts'}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Eligibility</span>
              <span className="text-white font-bold truncate">{meta.eligibilityBrief || '12th / Graduate'}</span>
            </div>
          </div>

          {meta.applyOnlineUrl && (
            <div className="pt-2 flex items-center justify-end">
              <a
                href={meta.applyOnlineUrl}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition flex items-center space-x-2 shadow-lg shadow-rose-600/20"
              >
                <span>Apply Online Portal</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>
      );
    }

    case 'syllabus_table': {
      const data = block.syllabusData;
      if (!data) return null;
      return (
        <div className={`p-6 bg-slate-900 border border-slate-800 ${theme.borderRadius} space-y-4 shadow-xl`}>
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <FileText className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-black text-white">{block.title || 'Official Syllabus & Marks Weightage'}</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-bold">
                  {data.subjectHeaders.map((h, i) => (
                    <th key={i} className="py-2.5 px-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {data.rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 font-bold text-white">{row.subject}</td>
                    <td className="py-3 px-3 text-slate-400 leading-relaxed">{row.topics}</td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-400">{row.weightageMarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    case 'key_takeaways': {
      const items = block.keyTakeaways || [];
      return (
        <div className={`p-6 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/30 ${theme.borderRadius} space-y-4 shadow-xl`}>
          <div className="flex items-center space-x-2 text-indigo-400 font-black text-sm">
            <Sparkles className="w-4 h-4" />
            <span>{block.title || 'Key Exam Takeaways & Tips'}</span>
          </div>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-200">
            {items.map((item, i) => (
              <li key={i} className="flex items-start space-x-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    }

    case 'checkpoint_quiz': {
      const quiz = block.checkpointQuiz;
      if (!quiz) return null;
      const selectedOption = quizAnswerState[block.id] ?? null;
      const isAnswered = selectedOption !== null;
      const isCorrect = isAnswered && selectedOption === quiz.correctIndex;

      return (
        <div className={`p-6 bg-slate-900/90 border border-purple-500/30 ${theme.borderRadius} space-y-4 shadow-xl`}>
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-black uppercase tracking-wider border border-purple-500/30 flex items-center space-x-1">
              <Award className="w-3 h-3" />
              <span>Interactive Knowledge Checkpoint</span>
            </span>
            {isAnswered && (
              <span className={`text-xs font-black ${isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isCorrect ? '✓ Correct Answer!' : '✗ Incorrect Attempt'}
              </span>
            )}
          </div>

          <p className="text-sm font-bold text-white leading-snug">{quiz.question}</p>
          {quiz.questionHindi && (
            <p className="text-xs text-slate-300 font-serif leading-snug">{quiz.questionHindi}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            {quiz.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isThisCorrect = isAnswered && idx === quiz.correctIndex;
              return (
                <button
                  key={idx}
                  disabled={isAnswered}
                  onClick={() => setQuizAnswerState(prev => ({ ...prev, [block.id]: idx }))}
                  className={`p-3 rounded-xl text-xs font-bold text-left transition flex items-center justify-between cursor-pointer ${
                    isThisCorrect
                      ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-300'
                      : isSelected && !isThisCorrect
                      ? 'bg-rose-500/20 border border-rose-500 text-rose-300'
                      : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span>{opt}</span>
                  {isThisCorrect && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                  {isSelected && !isThisCorrect && <X className="w-4 h-4 text-rose-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          {isAnswered && (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1 animate-fade-in">
              <span className="font-bold text-indigo-400 block">Explanation:</span>
              <p className="leading-relaxed">{quiz.explanation}</p>
            </div>
          )}
        </div>
      );
    }

    case 'heading':
      return (
        <div className="space-y-2 border-l-4 border-indigo-500 pl-4 py-1">
          <h2 className="text-2xl sm:text-3xl font-black text-white">{block.title}</h2>
          {block.subtitle && <p className="text-sm text-slate-400">{block.subtitle}</p>}
        </div>
      );

    case 'paragraph':
      return (
        <div className={`bg-slate-900/70 border border-slate-800 ${theme.borderRadius} p-6 text-slate-200 leading-relaxed text-sm space-y-3`}>
          {block.title && <h3 className="text-lg font-bold text-white">{block.title}</h3>}
          <p className="whitespace-pre-line">{block.subtitle || block.content}</p>
        </div>
      );

    case 'features':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {block.items?.map((item, idx) => (
            <div
              key={idx}
              className={`bg-slate-900 border border-slate-800 ${theme.borderRadius} p-5 space-y-2 shadow-lg hover:border-slate-700 transition`}
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black text-xs">
                {idx + 1}
              </div>
              <h4 className="text-sm font-bold text-white">{item.title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      );

    case 'faq':
      return (
        <div className={`bg-slate-900 border border-slate-800 ${theme.borderRadius} p-6 sm:p-8 space-y-4 shadow-xl`}>
          <div className="space-y-1">
            <h3 className="text-xl font-black text-white">{block.title || 'Frequently Asked Questions'}</h3>
            {block.subtitle && <p className="text-xs text-slate-400">{block.subtitle}</p>}
          </div>

          <div className="divide-y divide-slate-800">
            {block.faqList?.map((faq, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div key={idx} className="py-3.5">
                  <button
                    onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between text-left text-xs sm:text-sm font-bold text-white hover:text-indigo-400 transition cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-indigo-400' : 'text-slate-500'}`} />
                  </button>
                  {isOpen && (
                    <p className="mt-2.5 text-xs text-slate-400 leading-relaxed pl-2 border-l-2 border-indigo-500/50">
                      {faq.answer}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );

    case 'cta':
      return (
        <div className={`bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/80 border border-emerald-500/30 ${theme.borderRadius} p-8 text-center space-y-4 shadow-2xl`}>
          <h3 className="text-2xl font-black text-white">{block.title || 'Start Your Free Practice Today'}</h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">{block.subtitle}</p>
          <div className="pt-2">
            <button
              onClick={onNavigateToTests}
              className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-xl shadow-emerald-600/30 transition cursor-pointer"
            >
              {block.buttonText || 'Attempt Real CBT Mock Test'}
            </button>
          </div>
        </div>
      );

    case 'ad_slot':
      return (
        <AdSlotRenderer slotType="inContent" theme={theme} customLabel={block.adSlotConfig?.customLabel} />
      );

    default:
      return null;
  }
}
