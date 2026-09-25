import React from 'react';
import { CMSPage, PageBlock } from '../types/cms';
import {
  Sparkles,
  HelpCircle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Layers,
  Globe
} from 'lucide-react';

interface DynamicPageRendererProps {
  page: CMSPage;
  onNavigateToTests?: () => void;
}

export const DynamicPageRenderer: React.FC<DynamicPageRendererProps> = ({
  page,
  onNavigateToTests,
}) => {
  const [openFaqIdx, setOpenFaqIdx] = React.useState<number | null>(0);

  return (
    <article className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-12">
      {/* Page Title Header */}
      <div className="border-b border-slate-800 pb-6 space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold">
          <Globe className="w-3.5 h-3.5" />
          <span>Official CGSSB Portal Page</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          {page.title}
        </h1>
      </div>

      {/* Render Blocks */}
      {page.blocks.map(block => (
        <React.Fragment key={block.id}>
          {renderBlockContent(block, openFaqIdx, setOpenFaqIdx, onNavigateToTests)}
        </React.Fragment>
      ))}
    </article>
  );
};

function renderBlockContent(
  block: PageBlock,
  openFaqIdx: number | null,
  setOpenFaqIdx: (idx: number | null) => void,
  onNavigateToTests?: () => void
) {
  switch (block.type) {
    case 'hero':
      return (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-900/40 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden text-center sm:text-left space-y-6">
          <div className="max-w-2xl space-y-3">
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              {block.title}
            </h2>
            {block.subtitle && (
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                {block.subtitle}
              </p>
            )}
          </div>

          {block.buttonText && (
            <div>
              <a
                href={block.buttonLink || '/test-series'}
                onClick={e => {
                  if (block.buttonLink === '/test-series' && onNavigateToTests) {
                    e.preventDefault();
                    onNavigateToTests();
                  }
                }}
                className="inline-flex items-center space-x-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition cursor-pointer"
              >
                <span>{block.buttonText}</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>
      );

    case 'heading':
      return (
        <div className="space-y-2 border-l-4 border-indigo-500 pl-4 py-1">
          <h2 className="text-2xl font-bold text-white">{block.title}</h2>
          {block.subtitle && <p className="text-sm text-slate-400">{block.subtitle}</p>}
        </div>
      );

    case 'paragraph':
      return (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-slate-300 leading-relaxed text-sm space-y-3">
          {block.title && <h3 className="text-lg font-bold text-white">{block.title}</h3>}
          <p>{block.subtitle || block.content}</p>
        </div>
      );

    case 'features':
      return (
        <div className="space-y-4">
          {block.title && <h3 className="text-xl font-bold text-white">{block.title}</h3>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {block.items?.map((item, idx) => (
              <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
                <div className="flex items-center space-x-2 text-indigo-400 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-white">{item.title}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      );

    case 'faq':
      return (
        <div className="space-y-4">
          {block.title && (
            <h3 className="text-xl font-bold text-white flex items-center space-x-2">
              <HelpCircle className="w-5 h-5 text-indigo-400" />
              <span>{block.title}</span>
            </h3>
          )}
          <div className="space-y-2.5">
            {block.faqList?.map((faq, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                    className="w-full text-left p-4 font-bold text-sm text-white flex items-center justify-between gap-3 hover:bg-slate-800/50 transition cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="p-4 pt-0 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 bg-slate-950/40">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );

    case 'test_series_widget':
      return (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 text-center">
          <Layers className="w-10 h-10 text-indigo-400 mx-auto" />
          <h3 className="text-xl font-bold text-white">{block.title || 'Practice Live Test Series'}</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Access bilingual mock tests with TCS iON examination interface, instant rank prediction, and solutions.
          </p>
          <button
            onClick={onNavigateToTests}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer"
          >
            Launch Test Series Catalog
          </button>
        </div>
      );

    case 'raw_html':
      return (
        <div
          className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-200 text-xs overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: block.content || '' }}
        />
      );

    default:
      return null;
  }
}
