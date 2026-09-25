import React, { useState, useEffect } from 'react';
import {
  Flame,
  Crown,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Clock,
  Award,
  CheckCircle2,
  Copy,
  Check,
  Zap,
  Tag,
  ShieldCheck,
  Gift,
  Trophy
} from 'lucide-react';
import { OFFICIAL_BUNDLES_CATALOG, TestSeriesBundle } from '../data/bundleCatalog';
import { MockTest } from '../types';

interface HotSliderAndOffersProps {
  onExplorePass: () => void;
  onOpenBundle: (bundle: TestSeriesBundle) => void;
  onStartTest: (test: MockTest) => void;
  tests: MockTest[];
  onOpenLeaderboard?: (testId?: string) => void;
}

export const HotSliderAndOffers: React.FC<HotSliderAndOffersProps> = ({
  onExplorePass,
  onOpenBundle,
  onStartTest,
  tests,
  onOpenLeaderboard,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);

  const teacherBundle = OFFICIAL_BUNDLES_CATALOG.find(b => b.id === 'assistant-teacher-2026') || OFFICIAL_BUNDLES_CATALOG[0];
  const cgpscBundle = OFFICIAL_BUNDLES_CATALOG.find(b => b.id === 'cgpsc-pre-2026') || OFFICIAL_BUNDLES_CATALOG[1];
  const siBundle = OFFICIAL_BUNDLES_CATALOG.find(b => b.id === 'cgssb-si-2026') || OFFICIAL_BUNDLES_CATALOG[4];

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCoupon(code);
    setTimeout(() => setCopiedCoupon(null), 2500);
  };

  const slides = [
    {
      id: 'teacher-hot-series',
      category: 'HOT TEST SERIES',
      categoryIcon: Flame,
      categoryColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      badge: '5,000+ Posts Announced',
      badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      title: 'CG शिक्षक भर्ती 2026 महा-अभ्यास श्रृंखला',
      subtitle: 'सहायक शिक्षक (1-5), शिक्षक (6-8) एवं व्याख्याता (9-12) के लिए पूर्ण 15 Full Mocks + 20 विषयवार टेस्ट।',
      highlights: [
        '150 Questions · Authentic -¼ Negative Marking',
        'Real TCS iON Computer-Based CBT Interface',
        'State-Wide Rank & Detailed Bilingual Explanations',
      ],
      primaryActionLabel: 'Open Teacher Bundle',
      primaryAction: () => {
        if (teacherBundle) onOpenBundle(teacherBundle);
      },
      secondaryActionLabel: 'Try Free Diagnostic Mock',
      secondaryAction: () => {
        const freeItem = teacherBundle?.testItems.find(t => t.isFreePreview) || teacherBundle?.testItems[0];
        const match = (freeItem && tests.find(t => t.id === freeItem.id)) || tests[0];
        if (match) onStartTest(match);
      },
      bgGradient: 'from-amber-950/40 via-slate-900 to-slate-950',
      borderAccent: 'border-amber-500/40 hover:border-amber-500/60',
      accentGlow: 'bg-amber-500/10',
    },
    {
      id: 'pass-pro-offer',
      category: 'SPECIAL PASS OFFER',
      categoryIcon: Crown,
      categoryColor: 'text-amber-300 bg-amber-500/20 border-amber-500/40',
      badge: 'FLAT 50% OFF · YEARLY PASS @ ₹599',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      title: 'Unified All-Access Pass: Unrestricted Access to All 42+ Mocks & Bundles',
      subtitle: 'One pass for all exams. Yearly All-Access at ₹599 (was ₹1,199) or Monthly at ₹199 (was ₹299). 100% full validity with zero ads.',
      highlights: [
        'Unlocks ALL Teacher Cadres, CGPSC & Vyapam Tests',
        'One Device One Pass Account Protection',
        'Printable Bilingual Question PDFs & Rank Benchmark',
      ],
      couponCode: 'CGPASS50',
      primaryActionLabel: 'Get All-Access Pass (From ₹199)',
      primaryAction: onExplorePass,
      secondaryActionLabel: 'View Plan Details',
      secondaryAction: onExplorePass,
      bgGradient: 'from-indigo-950/50 via-slate-900 to-slate-950',
      borderAccent: 'border-indigo-500/40 hover:border-indigo-500/60',
      accentGlow: 'bg-indigo-500/10',
    },
    {
      id: 'cgpsc-master-series',
      category: 'HIGH-YIELD PORTAL',
      categoryIcon: Award,
      categoryColor: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
      badge: 'State Service Prelims 2026',
      badgeColor: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
      title: 'CGPSC SSE Prelims 2026: GS Paper 1 + CSAT Paper 2 Series',
      subtitle: 'Complete 100 Qs GS-1 (Chhattisgarh Special GK) and 100 Qs CSAT Paper 2 with official -0.667 negative evaluation.',
      highlights: [
        '200 Marks Per Paper · Official Exam Timing & Marks',
        'Deep Chhattisgarh Geography, History, Tribes & Current',
        'Interpersonal Skills & Logical Aptitude Section',
      ],
      primaryActionLabel: 'Explore CGPSC Bundle',
      primaryAction: () => {
        if (cgpscBundle) onOpenBundle(cgpscBundle);
      },
      secondaryActionLabel: 'Free CSAT Mock Test',
      secondaryAction: () => {
        const freeItem = cgpscBundle?.testItems.find(t => t.isFreePreview) || cgpscBundle?.testItems[0];
        const match = (freeItem && tests.find(t => t.id === freeItem.id)) || tests.find(t => t.category === 'CGPSC') || tests[0];
        if (match) onStartTest(match);
      },
      bgGradient: 'from-rose-950/30 via-slate-900 to-slate-950',
      borderAccent: 'border-rose-500/40 hover:border-rose-500/60',
      accentGlow: 'bg-rose-500/10',
    },
    {
      id: 'si-recruitment-series',
      category: 'HOT TEST SERIES',
      categoryIcon: Zap,
      categoryColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
      badge: 'Police Sub-Inspector 2026',
      badgeColor: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
      title: 'CG Police Sub-Inspector (SI) 2026: 10 Full Length Mocks',
      subtitle: '300 Marks Prelims & Mains booster series with 50 Qs Chhattisgarh Special GK and General Science.',
      highlights: [
        '100 Qs · 300 Marks · 120 Minutes Real Timer',
        'State Percentile Scorecard & Sectional Speed Analytics',
        'Includes Official 2023 SI Question Paper Simulation',
      ],
      primaryActionLabel: 'View SI 2026 Bundle',
      primaryAction: () => {
        if (siBundle) onOpenBundle(siBundle);
      },
      secondaryActionLabel: 'Start Free Sample Test',
      secondaryAction: () => {
        const freeItem = siBundle?.testItems.find(t => t.isFreePreview) || siBundle?.testItems[0];
        const match = (freeItem && tests.find(t => t.id === freeItem.id)) || tests[0];
        if (match) onStartTest(match);
      },
      bgGradient: 'from-cyan-950/30 via-slate-900 to-slate-950',
      borderAccent: 'border-cyan-500/40 hover:border-cyan-500/60',
      accentGlow: 'bg-cyan-500/10',
    },
    {
      id: 'live-leaderboard-challenge',
      category: 'LIVE STATE LEADERBOARD',
      categoryIcon: Trophy,
      categoryColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      badge: 'State-Wide Competition · Updated Live',
      badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      title: 'All-Chhattisgarh Mock Leaderboard: Compete with 15,000+ Aspirants',
      subtitle: 'Real-time percentile ranking, district-wise merit lists, and speed analytics. See where you stand against toppers in Raipur, Bilaspur, Durg & Bastar.',
      highlights: [
        'Live District & State Rank Evaluation',
        'Top 3 Winners Awarded Pass Pro Scholarships',
        'Detailed Topper Accuracy & Time Comparison',
      ],
      primaryActionLabel: 'View Live Leaderboard',
      primaryAction: () => {
        if (onOpenLeaderboard) onOpenLeaderboard();
      },
      secondaryActionLabel: 'Attempt Flagship Mock',
      secondaryAction: () => {
        if (tests[0]) onStartTest(tests[0]);
      },
      bgGradient: 'from-emerald-950/40 via-slate-900 to-slate-950',
      borderAccent: 'border-emerald-500/40 hover:border-emerald-500/60',
      accentGlow: 'bg-emerald-500/10',
    }
  ];

  // Auto-play timer
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 5500);

    return () => clearInterval(timer);
  }, [isPaused, slides.length]);

  const slide = slides[currentSlide];
  const CategoryIcon = slide.categoryIcon;

  return (
    <div
      className="relative rounded-3xl overflow-hidden border transition-all duration-300 group shadow-xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background with Ambient Glow */}
      <div className={`absolute inset-0 bg-gradient-to-r ${slide.bgGradient} transition-colors duration-700`} />
      <div className={`absolute -right-20 -top-20 w-80 h-80 rounded-full blur-3xl opacity-30 pointer-events-none ${slide.accentGlow} transition-all duration-700`} />

      {/* Main Slide Card Content */}
      <div className="relative p-4 sm:p-6 lg:p-7 flex flex-col justify-between min-h-[220px] sm:min-h-[200px] z-10 space-y-4">
        
        {/* Top Header Row: Category Tag, Badges, Coupon, Navigation Arrows */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1.5">
            <span className={`inline-flex items-center space-x-1.5 text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-xl border ${slide.categoryColor}`}>
              <CategoryIcon className="w-3.5 h-3.5" />
              <span>{slide.category}</span>
            </span>

            <span className={`text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-lg border ${slide.badgeColor}`}>
              {slide.badge}
            </span>

            {slide.couponCode && (
              <button
                type="button"
                onClick={() => handleCopyCode(slide.couponCode!)}
                className="inline-flex items-center space-x-1.5 text-[10px] sm:text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-lg hover:bg-amber-500/30 transition cursor-pointer"
                title="Click to copy coupon code"
              >
                <Tag className="w-3 h-3 text-amber-400" />
                <span>CODE: {slide.couponCode}</span>
                {copiedCoupon === slide.couponCode ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3 text-amber-400 opacity-80" />
                )}
              </button>
            )}
          </div>

          {/* Slider Prev / Next Controls */}
          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={() => setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length)}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-750 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono text-slate-400 font-bold px-1">
              {currentSlide + 1}/{slides.length}
            </span>
            <button
              type="button"
              onClick={() => setCurrentSlide(prev => (prev + 1) % slides.length)}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-755 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
              aria-label="Next slide"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Middle Content Row: Title, Subtitle, Highlights */}
        <div className="space-y-1.5 sm:space-y-2">
          <h2 className="text-base sm:text-xl lg:text-2xl font-black text-white tracking-tight leading-snug">
            {slide.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
            {slide.subtitle}
          </p>

          {/* Highlights row */}
          <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400 pt-1">
            {slide.highlights.map((highlight, idx) => (
              <span key={idx} className="flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>{highlight}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Bottom Action Row: CTAs and Dot Indicators */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
            <button
              type="button"
              onClick={slide.primaryAction}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition shadow-md shadow-emerald-500/20 flex items-center space-x-1.5 cursor-pointer"
            >
              <span>{slide.primaryActionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {slide.secondaryAction && (
              <button
                type="button"
                onClick={slide.secondaryAction}
                className="px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white font-bold text-xs border border-slate-750 transition cursor-pointer"
              >
                {slide.secondaryActionLabel}
              </button>
            )}

            {copiedCoupon === slide.couponCode && (
              <span className="text-[11px] font-bold text-emerald-400 animate-in fade-in flex items-center space-x-1">
                <Check className="w-3 h-3" />
                <span>Coupon copied to clipboard!</span>
              </span>
            )}
          </div>

          {/* Slide Indicator Dots / Progress Bars */}
          <div className="flex items-center space-x-1.5">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setCurrentSlide(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  currentSlide === idx
                    ? 'w-6 bg-emerald-400 shadow-sm shadow-emerald-400/50'
                    : 'w-2 bg-slate-700 hover:bg-slate-600'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
