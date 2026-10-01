import React from 'react';
import {\n  BookOpen,\n  CheckCircle2,\n  ChevronRight,\n  Clock,\n  Crown,\n  Sparkles,\n} from 'lucide-react';

interface BundleCompactCardProps {
  bundle: TestSeriesBundle;
  onOpenBundle: (bundle: TestSeriesBundle) => void;
  onEnrollNow?: (bundle: TestSeriesBundle) => void;
  onStartFreeTest?: (bundle: TestSeriesBundle) => void;
  onOpenMyTests?: (bundle: TestSeriesBundle) => void;
  hasEnrolled?: boolean;
}

const getBundleComposition = (bundle: TestSeriesBundle): string[] => {
  const counts = new Map<string, number>();
  const add = (label: string, items?: { type?: string }[]) => {
    if (!items?.length) return;
    const count = items.length;
    if (count > 0) counts.set(label, (counts.get(label) || 0) + count);
  };

  add('Full Mocks', bundle.testItems?.filter(item => item.type === 'full_mock'));
  add('Sectional Tests', bundle.testItems?.filter(item => item.type === 'sectional'));
  add('PYPs', bundle.pypTests);
  add('Chapter Tests', bundle.chapterTests);
  add('Live Tests', bundle.testItems?.filter(item => item.type === 'live_test'));

  return Array.from(counts.entries()).map(([label, count]) => `${count} ${label}`);
};

export const BundleCompactCard: React.FC<BundleCompactCardProps> = ({
  bundle,
  onOpenBundle,
  onEnrollNow,
  onStartFreeTest,
  onOpenMyTests,
  hasEnrolled = false,
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isPassActive = isUserPassActive(user);
  const isCgpsc = bundle.authority === 'CGPSC';
  const isPublished = bundle.isPublished !== false && !bundle.isDraft;

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
          <div className="flex items-center space-x-1.5 flex-wrap">
            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border tracking-wider ${authorityBg}`}>
              {bundle.authority}
            </span>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-800/70 px-2 py-0.5 rounded-md border border-slate-700/50">
              Batch {bundle.targetYear}
            </span>
          </div>

          <div className="flex items-center space-x-1.5 flex-wrap justify-end">
            {!isPublished && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full border bg-amber-500/20 text-amber-300 border-amber-500/30">
                Draft (Hidden)
              </span>
            )}
            <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border flex items-center space-x-1 ${badgeTheme}`}>
              <Sparkles className="w-3 h-3 inline-block" />
              <span>{bundle.badge}</span>
            </span>
          </div>
        </div>

        {/* Title & Hindi Title */}
        <div>
          <h3 className="text-base sm:text-lg font-black text-white group-hover:text-emerald-400 transition-colors leading-snug line-clamp-2 break-words">
            {bundle.title}
          </h3>
          <p className="text-xs font-semibold text-slate-400 mt-0.5 line-clamp-1">
            {bundle.titleHindi}
          </p>
        </div>

        {/* What is included — keep the card scannable; full details live on the bundle page */}
        <div className="min-h-[3.25rem]">
          <div className="flex items-center gap-1.5 mb-1.5">
            <BookOpen className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">What's included</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {getBundleComposition(bundle).length > 0 ? getBundleComposition(bundle).map(item => (
              <span key={item} className="text-[11px] font-bold text-slate-200 bg-slate-950/70 border border-slate-800 rounded-lg px-2 py-1">
                {item}
              </span>
            )) : (
              <span className="text-[11px] font-bold text-slate-200 bg-slate-950/70 border border-slate-800 rounded-lg px-2 py-1">
                {bundle.totalTestsCount} Tests
              </span>
            )}
          </div>
        </div>

        {/* Essential exam format only */}
        <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
          <div className="bg-slate-950/70 rounded-xl px-2.5 py-1.5 border border-slate-800 flex items-center space-x-1.5 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">{bundle.examPattern.totalQuestions} Qs • {bundle.examPattern.durationMinutes}m</span>
          </div>
          <div className="bg-slate-950/70 rounded-xl px-2.5 py-1.5 border border-slate-800 flex items-center space-x-1.5 text-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate">{bundle.freeTestsCount} Free Preview{bundle.freeTestsCount === 1 ? '' : 's'}</span>
          </div>
        </div>
      </div>

      {/* Card Footer: Universal Pass Model Pricing & Action Buttons */}
      <div className="pt-4 mt-3 border-t border-slate-800/80 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex flex-col">
          {hasEnrolled ? (
            <div className="flex items-center space-x-1.5 text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs font-black">Series Enrolled</span>
            </div>
          ) : isPassActive ? (
            <div className="flex items-center space-x-1.5 text-amber-300">
              <Crown className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />
              <span className="text-xs font-black">Free Pass Active</span>
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="flex items-center space-x-1 text-xs font-black text-amber-300">
                <Crown className="w-3.5 h-3.5 fill-amber-400" />
                <span>Free Launch Pass</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                Unlocks All {bundle.totalTestsCount} Tests
              </span>
            </div>
          )}
          <span className="text-[10px] text-emerald-400 font-semibold mt-0.5">
            {hasEnrolled ? (isPassActive ? '✓ All Tests Unlocked' : 'Free pass expired') : isPassActive ? '✓ All Tests Unlocked' : `${bundle.freeTestsCount} Free Diagnostic Mocks`}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (hasEnrolled && onOpenMyTests) {
                onOpenMyTests(bundle);
              } else {
                onOpenBundle(bundle);
              }
            }}
            className="w-full sm:w-auto text-xs font-bold px-3 py-2 sm:py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center justify-center space-x-1.5 cursor-pointer"
            title={hasEnrolled ? "Open your enrolled tests" : "View test series details, syllabus and included tests"}
          >
            {hasEnrolled ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <span>View Details</span>}
            {hasEnrolled && <span>My Tests</span>}
            {!hasEnrolled && <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (hasEnrolled) {
                onOpenBundle(bundle);
              } else if (onEnrollNow) {
                onEnrollNow(bundle);
              } else {
                onOpenBundle(bundle);
              }
            }}
            className={`w-full sm:w-auto text-xs font-black px-3.5 py-2 sm:py-1.5 rounded-xl shadow-md transition flex items-center justify-center space-x-1.5 cursor-pointer ${
              hasEnrolled
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-900/40'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-900/40'
            }`}
          >
            {hasEnrolled ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>View Bundle</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{!user ? 'Sign In to Enroll' : isPassActive ? 'Enroll in Test Series' : 'Start Free Pass'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
