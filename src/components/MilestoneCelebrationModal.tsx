import React from 'react';
import {
  Trophy,
  Crown,
  Sparkles,
  CheckCircle2,
  Calendar,
  Zap,
  ArrowRight,
  Share2,
  X
} from 'lucide-react';

interface MilestoneCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinuePractice: () => void;
  completedCount?: number;
}

export const MilestoneCelebrationModal: React.FC<MilestoneCelebrationModalProps> = ({
  isOpen,
  onClose,
  onContinuePractice,
  completedCount = 5,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-amber-500/50 rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl relative text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Celebration Icon */}
        <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-xl shadow-amber-500/30 text-slate-950">
          <Trophy className="w-10 h-10 fill-slate-950" />
        </div>

        {/* Headline */}
        <div className="space-y-1.5">
          <span className="text-xs font-black uppercase tracking-wider text-amber-400 bg-amber-500/15 border border-amber-500/30 px-3 py-1 rounded-full inline-flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Milestone Achieved (5 Tests)</span>
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            +2 Extra Months Free Pass Unlocked!
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            You completed <strong>{completedCount} mock tests</strong> on <strong>cgtest.in</strong>! We have added <strong>60 bonus days</strong> to your account, giving you <strong>3 Full Months of All-Access Pro Pass</strong> completely free.
          </p>
        </div>

        {/* Reward Highlights */}
        <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 space-y-2.5 text-left text-xs">
          <div className="flex items-center space-x-2 text-emerald-300 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>90 Total Days of Free Unrestricted Access</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-300">
            <Crown className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
            <span>All 42+ CG Teacher, CGPSC & Vyapam Tests Unlocked</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-300">
            <Zap className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>State-Level Percentile & Mistake Notebook Analytics</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="pt-2 space-y-2.5">
          <button
            onClick={() => {
              onClose();
              onContinuePractice();
            }}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:brightness-110 text-slate-950 font-black text-sm flex items-center justify-center space-x-2 shadow-xl shadow-amber-500/25 transition cursor-pointer"
          >
            <span>Continue Practicing Mocks</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
