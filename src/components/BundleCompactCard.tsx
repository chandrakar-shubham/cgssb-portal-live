import React from 'react';
import { useAuth } from '../context/AuthContext';
import { TestSeriesBundle } from '../data/bundleCatalog';
import { isUserPassActive } from '../utils/devicePassManager';
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Crown,
  FileText,
  Flame,
  Globe2,
  Lock,
  Play,
  ShieldCheck,
  Sparkles,
  Users
} from 'lucide-react';

interface BundleCompactCardProps {
  bundle: TestSeriesBundle;
  onOpenBundle: (bundle: TestSeriesBundle) => void;
  onEnrollNow?: (bundle: TestSeriesBundle) => void;
  onStartFreeTest?: (bundle: TestSeriesBundle) => void;
  hasEnrolled?: boolean;
}

export const BundleCompactCard: React.FC<BundleCompactCardProps> = ({
  bundle,
  onOpenBundle,
  onEnrollNow,
  onStartFreeTest,
  hasEnrolled = false,
}) => {
  const { user } = useAuth();
  const isPassActive = isUserPassActive(user);
  const isCgpsc = bundle.authority === 'CGPSC';

  const badgeTheme = {
    emerald: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
    rose: 'bg-rose-500/15 border-rose-500/30 text-rose-300',
    blue: 'bg-blue-500/15 border-blue-500/30 text-blue-300',
    amber: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
    purple: 'bg-purple-500/15 border-purple-500/30 text-purple-300',
  }[bundle.badgeColor] || 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300';

  const glowBorder = isCgpsc
    ? 'hover:border-rose-500/50 hover:shadow-rose-950/40'
    : 'hover:border-emerald-500/50 hover:shadow-emerald-950/40';

  const authorityBg = isCgpsc
    ? 'bg-rose-950/60 text-rose-300 border-rose-800/40'
    : 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40';

  return (
    <div
      onClick={() => onOpenBundle(bundle)}
      className={`group relative flex flex-col justify-between bg-slate-900/90 rounded-2xl border border-slate-800/80 p-4 sm:p-5 shadow-lg transition-all duration-200 cursor-pointer ${glowBorder}`}
    >
      {/* Top Header: Authority & Launch Badge */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-1.5">
            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border tracking-wider ${authorityBg}`}>
              {bundle.authority}
            </span>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-800/70 px-2 py-0.5 rounded-md border border-slate-700/50">
              Batch {bundle.targetYear}
            </span>
          </div>

          <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border flex items-center space-x-1 ${badgeTheme}`}>
            <Sparkles className="w-3 h-3 inline-block" />
            <span>{bundle.badge}</span>
          </span>
        </div>

        {/* Title & Hindi Title */}
        <div>
          <h3 className="text-base sm:text-lg font-black text-white group-hover:text-emerald-400 transition-colors leading-snug">
            {bundle.title}
          </h3>
          <p className="text-xs font-semibold text-slate-400 mt-0.5 line-clamp-1">
            {bundle.titleHindi}
          </p>
        </div>

        {/* Short description */}
        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
          {bundle.shortDescription}
        </p>

        {/* Compact Key Stats Grid */}
        <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
          <div className="bg-slate-950/70 rounded-xl px-2.5 py-1.5 border border-slate-800 flex items-center space-x-1.5 text-slate-300">
            <BookOpen className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">
              <strong className="text-white font-bold">{bundle.totalTestsCount} Tests</strong> ({bundle.freeTestsCount} Free)
            </span>
          </div>

          <div className="bg-slate-950/70 rounded-xl px-2.5 py-1.5 border border-slate-800 flex items-center space-x-1.5 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">
              {bundle.examPattern.totalQuestions} Qs • {bundle.examPattern.durationMinutes}m
            </span>
          </div>

          <div className="bg-slate-950/70 rounded-xl px-2.5 py-1.5 border border-slate-800 flex items-center space-x-1.5 text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate">{bundle.examPattern.negativeMarkPenalty.split(' ')[0]} Neg</span>
          </div>

          <div className="bg-slate-950/70 rounded-xl px-2.5 py-1.5 border border-slate-800 flex items-center space-x-1.5 text-slate-300">
            <Globe2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span className="truncate">{bundle.languageDisplay.split(' ')[0]}</span>
          </div>
        </div>
      </div>

      {/* Card Footer: Universal Pass Model Pricing & Action Buttons */}
      <div className="pt-4 mt-3 border-t border-slate-800/80 flex items-center justify-between gap-3">
        <div className="flex flex-col">
          {isPassActive || hasEnrolled ? (
            <div className="flex items-center space-x-1.5 text-amber-300">
              <Crown className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />
              <span className="text-xs font-black">All-Access Pass Active</span>
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="flex items-center space-x-1 text-xs font-black text-amber-300">
                <Crown className="w-3.5 h-3.5 fill-amber-400" />
                <span>All-Access Pass</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                Unlocks All {bundle.totalTestsCount} Tests (From ₹199)
              </span>
            </div>
          )}
          <span className="text-[10px] text-emerald-400 font-semibold mt-0.5">
            {isPassActive || hasEnrolled ? '✓ All Tests Unlocked' : `${bundle.freeTestsCount} Free Diagnostic Mocks`}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {bundle.freeTestsCount > 0 && onStartFreeTest && !isPassActive && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onStartFreeTest(bundle);
              }}
              className="text-xs font-bold text-slate-300 hover:text-white bg-slate-800/90 hover:bg-slate-700/80 px-2.5 py-1.5 rounded-xl border border-slate-700 transition flex items-center space-x-1 cursor-pointer"
              title="Attempt Free Sample Test immediately"
            >
              <Play className="w-3 h-3 text-emerald-400 fill-emerald-400" />
              <span className="hidden sm:inline">Free Mock</span>
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenBundle(bundle);
            }}
            className={`text-xs font-black px-3.5 py-1.5 rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer ${
              isPassActive || hasEnrolled
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-emerald-900/40'
                : isCgpsc
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/40'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-emerald-900/40'
            }`}
          >
            <span>{isPassActive || hasEnrolled ? 'Practice Tests' : 'View Bundle'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
