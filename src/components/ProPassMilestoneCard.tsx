import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Crown,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  Gift,
  Zap,
  Target,
  Trophy,
  ShieldCheck
} from 'lucide-react';
import { calculateDaysRemaining } from '../utils/devicePassManager';

interface ProPassMilestoneCardProps {
  onStartPractice?: () => void;
  onOpenAuthModal?: () => void;
  className?: string;
}

export const ProPassMilestoneCard: React.FC<ProPassMilestoneCardProps> = ({
  onStartPractice,
  onOpenAuthModal,
  className = '',
}) => {
  const { user } = useAuth();

  const isGuest = !user;
  const completedCount = user?.completedTestsCount || (typeof window !== 'undefined' && localStorage.getItem('cgtest_guest_test_completed') === 'true' ? 1 : 0);
  const targetGoal = 5;
  const remainingCount = Math.max(0, targetGoal - completedCount);
  const isUnlockedBonus = Boolean(user?.unlockedMilestoneBonus || completedCount >= 5);
  const daysLeft = calculateDaysRemaining(user?.passExpiresAt);

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border transition-all duration-300 shadow-xl ${
        isUnlockedBonus
          ? 'bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 border-amber-500/40 hover:border-amber-500/60'
          : 'bg-gradient-to-r from-indigo-950/50 via-slate-900 to-slate-950 border-indigo-500/30 hover:border-indigo-500/50'
      } p-5 sm:p-6 ${className}`}
    >
      {/* Background Glow */}
      <div className="absolute -top-16 -right-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-4">
        {/* Top Header Tag */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 flex items-center space-x-1 shadow-sm">
              <Gift className="w-3 h-3 fill-slate-950" />
              <span>cgtest.in 3-Months Free Pro Pass</span>
            </span>
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">
              1 Month on Signup + 2 Months on 5 Tests
            </span>
          </div>

          {user?.hasProPass && (
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] font-bold text-amber-300">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{daysLeft > 0 ? `${daysLeft} Days Validity Left` : 'Active'}</span>
            </div>
          )}
        </div>

        {/* Headline & Description */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base sm:text-xl font-black text-white flex items-center space-x-2">
              <Crown className="w-5 h-5 text-amber-400 fill-amber-400" />
              <span>
                {isGuest
                  ? 'Get 3 Months of Unlimited Exam Practice for Free'
                  : isUnlockedBonus
                  ? '🎉 3-Months Milestone Completed! 90 Days Total Pro Pass Active'
                  : `Complete 5 Tests to Unlock +2 Extra Months Free (${completedCount}/5 Done)`}
              </span>
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              {isGuest
                ? 'Try 1 Free Full Mock Test first. Create your account to instantly claim 1 Month Free All-Access Pass, then complete 5 mock tests to unlock 2 additional months free.'
                : isUnlockedBonus
                ? 'You have crossed the competitive exam threshold! All CG Teacher, CGPSC Prelims, and Vyapam mock tests and previous papers are completely unlocked.'
                : `You are on the fast track! Attempt ${remainingCount} more full mock test${remainingCount > 1 ? 's' : ''} to automatically add 60 free bonus days to your pass.`}
            </p>
          </div>

          {/* Action CTA */}
          <div className="shrink-0 flex items-center space-x-2">
            {isGuest ? (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:brightness-110 text-slate-950 font-black text-xs transition flex items-center space-x-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 fill-slate-950" />
                <span>Sign Up & Claim 1st Month Free</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onStartPractice}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition flex items-center space-x-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                <Target className="w-4 h-4 fill-slate-950" />
                <span>{isUnlockedBonus ? 'Practice Mocks' : `Attempt Test #${completedCount + 1}`}</span>
              </button>
            )}
          </div>
        </div>

        {/* 5-Step Visual Progress Stepper */}
        <div className="pt-2">
          <div className="bg-slate-950/70 rounded-2xl p-3 sm:p-4 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 flex items-center space-x-1.5">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Milestone Journey</span>
              </span>
              <span className="font-mono font-bold text-emerald-400">
                {isUnlockedBonus ? '100% Unlocked (3 Months Free)' : `${completedCount} of 5 Mocks Completed`}
              </span>
            </div>

            {/* Stepper Dots & Progress Track */}
            <div className="grid grid-cols-5 gap-2">
              {[
                { step: 1, label: 'Free Signup Pass', sub: '1 Month (30d)', isSignup: true },
                { step: 2, label: 'Mock 2', sub: 'Habit building' },
                { step: 3, label: 'Mock 3', sub: 'Halfway there' },
                { step: 4, label: 'Mock 4', sub: 'Almost unlocked' },
                { step: 5, label: '+2 Months Bonus', sub: '60 Days Free!', isBonus: true },
              ].map((item) => {
                const isCompleted = isGuest ? false : completedCount >= item.step;
                const isCurrent = isGuest ? item.step === 1 : completedCount + 1 === item.step;

                return (
                  <div
                    key={item.step}
                    className={`rounded-xl p-2 sm:p-2.5 border transition-all text-center flex flex-col justify-between space-y-1 ${
                      isCompleted
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                        : isCurrent
                        ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 ring-2 ring-amber-500/20'
                        : 'bg-slate-900/60 border-slate-800 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-center">
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : item.isBonus ? (
                        <Gift className={`w-4 h-4 ${isCurrent ? 'text-amber-400 animate-bounce' : 'text-slate-500'}`} />
                      ) : (
                        <span className="w-4 h-4 rounded-full border border-current text-[10px] font-bold flex items-center justify-center">
                          {item.step}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] sm:text-xs font-black truncate block">
                      {item.label}
                    </span>
                    <span className="text-[9px] text-slate-400 hidden sm:block truncate">
                      {item.sub}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
