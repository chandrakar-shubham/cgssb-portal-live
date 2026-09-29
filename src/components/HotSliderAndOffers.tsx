import React, { useState, useEffect, useMemo } from 'react';
import {
  Flame,
  Crown,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Award,
  CheckCircle2,
  Copy,
  Check,
  Zap,
  Tag,
  Gift,
  Trophy
} from 'lucide-react';
import { OFFICIAL_BUNDLES_CATALOG, TestSeriesBundle } from '../data/bundleCatalog';
import { findBundleBySlugOrId } from '../utils/bundleStore';
import { MockTest, SliderBanner, SliderIconName } from '../types';
import { getStoredSliderBanners, syncSliderFromFirestore } from '../utils/sliderStore';

interface HotSliderAndOffersProps {
  onExplorePass: () => void;
  onOpenBundle: (bundle: TestSeriesBundle) => void;
  onStartTest: (test: MockTest) => void;
  tests: MockTest[];
  onOpenLeaderboard?: (testId?: string) => void;
  onOpenReferral?: () => void;
}

const ICON_MAP: Record<SliderIconName | string, React.ComponentType<{ className?: string }>> = {
  Gift,
  Flame,
  Crown,
  Award,
  Zap,
  Trophy,
  Sparkles,
  Star: Sparkles,
};

export const HotSliderAndOffers: React.FC<HotSliderAndOffersProps> = ({
  onExplorePass,
  onOpenBundle,
  onStartTest,
  tests,
  onOpenLeaderboard,
  onOpenReferral,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);

  // Load published banners dynamically from sliderStore
  const [banners, setBanners] = useState<SliderBanner[]>(() => {
    return getStoredSliderBanners().filter(b => b.isPublished !== false);
  });

  const teacherBundle = findBundleBySlugOrId('assistant-teacher-2026') || OFFICIAL_BUNDLES_CATALOG[0];

  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setBanners(e.detail.filter((b: SliderBanner) => b.isPublished !== false));
      }
    };
    window.addEventListener('cgtest-slider-updated', handleUpdate);

    syncSliderFromFirestore().then(list => {
      if (list && list.length > 0) {
        setBanners(list.filter(b => b.isPublished !== false));
      }
    }).catch(() => null);

    return () => window.removeEventListener('cgtest-slider-updated', handleUpdate);
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCoupon(code);
    setTimeout(() => setCopiedCoupon(null), 2500);
  };

  const executeAction = (actionType?: string, target?: string) => {
    switch (actionType) {
      case 'open_referral':
        if (onOpenReferral) onOpenReferral();
        else onExplorePass();
        break;
      case 'explore_pass':
        onExplorePass();
        break;
      case 'open_bundle':
        if (target) {
          const bundle = findBundleBySlugOrId(target);
          if (bundle) {
            onOpenBundle(bundle);
            break;
          }
        }
        if (teacherBundle) onOpenBundle(teacherBundle);
        break;
      case 'start_test':
        if (target) {
          const test = tests.find(t => t.id === target);
          if (test) {
            onStartTest(test);
            break;
          }
        }
        if (tests.length > 0) onStartTest(tests[0]);
        break;
      case 'open_leaderboard':
        if (onOpenLeaderboard) onOpenLeaderboard();
        break;
      case 'custom_url':
        if (target && typeof window !== 'undefined') {
          if (target.startsWith('http')) {
            window.open(target, '_blank', 'noopener,noreferrer');
          } else {
            window.location.href = target;
          }
        }
        break;
      default:
        onExplorePass();
    }
  };

  const activeSlides = useMemo(() => {
    return banners.length > 0 ? banners : getStoredSliderBanners();
  }, [banners]);

  // Adjust currentSlide index if slides count shrinks
  useEffect(() => {
    if (currentSlide >= activeSlides.length && activeSlides.length > 0) {
      setCurrentSlide(0);
    }
  }, [activeSlides.length, currentSlide]);

  // Auto-play timer
  useEffect(() => {
    if (isPaused || activeSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % activeSlides.length);
    }, 5500);

    return () => clearInterval(timer);
  }, [isPaused, activeSlides.length]);

  if (activeSlides.length === 0) {
    return null;
  }

  const slide = activeSlides[currentSlide] || activeSlides[0];
  const CategoryIcon = (slide.categoryIcon && ICON_MAP[slide.categoryIcon]) || Sparkles;

  return (
    <div
      className="relative rounded-3xl overflow-hidden border transition-all duration-300 group shadow-xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background with Ambient Glow */}
      <div className={`absolute inset-0 bg-gradient-to-r ${slide.bgGradient || 'from-slate-900 to-slate-950'} transition-colors duration-700`} />
      <div className={`absolute -right-20 -top-20 w-80 h-80 rounded-full blur-3xl opacity-30 pointer-events-none ${slide.accentGlow || 'bg-amber-500/10'} transition-all duration-700`} />

      {/* Main Slide Card Content */}
      <div className="relative p-4 sm:p-6 lg:p-7 flex flex-col justify-between min-h-[220px] sm:min-h-[200px] z-10 space-y-4">
        
        {/* Top Header Row: Category Tag, Badges, Coupon, Navigation Arrows */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1.5">
            <span className={`inline-flex items-center space-x-1.5 text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-xl border ${slide.categoryColor || 'text-amber-300 bg-amber-500/20 border-amber-500/40'}`}>
              <CategoryIcon className="w-3.5 h-3.5" />
              <span>{slide.category}</span>
            </span>

            <span className={`text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-lg border ${slide.badgeColor || 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'}`}>
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
          {activeSlides.length > 1 && (
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => setCurrentSlide(prev => (prev - 1 + activeSlides.length) % activeSlides.length)}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-750 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-mono text-slate-400 font-bold px-1">
                {currentSlide + 1}/{activeSlides.length}
              </span>
              <button
                type="button"
                onClick={() => setCurrentSlide(prev => (prev + 1) % activeSlides.length)}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-755 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
                aria-label="Next slide"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
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
          {slide.highlights && slide.highlights.length > 0 && (
            <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400 pt-1">
              {slide.highlights.map((highlight, idx) => (
                <span key={idx} className="flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>{highlight}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Action Row: CTAs and Dot Indicators */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
            <button
              type="button"
              onClick={() => executeAction(slide.primaryActionType, slide.primaryActionTarget)}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition shadow-md shadow-emerald-500/20 flex items-center space-x-1.5 cursor-pointer"
            >
              <span>{slide.primaryActionLabel || 'Explore Offer'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {slide.secondaryActionLabel && (
              <button
                type="button"
                onClick={() => executeAction(slide.secondaryActionType, slide.secondaryActionTarget)}
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
          {activeSlides.length > 1 && (
            <div className="flex items-center space-x-1.5">
              {activeSlides.map((s, idx) => (
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
          )}
        </div>

      </div>
    </div>
  );
};
