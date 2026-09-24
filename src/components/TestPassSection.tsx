import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Check,
  Zap,
  Sparkles,
  ShieldCheck,
  Award,
  Crown,
  Lock,
  Unlock,
  CheckCircle2,
  HelpCircle,
  Clock,
  ArrowRight
} from 'lucide-react';

interface TestPassSectionProps {
  onExploreTests: () => void;
}

export const TestPassSection: React.FC<TestPassSectionProps> = ({ onExploreTests }) => {
  const { user, activateProPass } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<'yearly' | 'monthly' | 'lifetime'>('yearly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activatedSuccess, setActivatedSuccess] = useState<string | null>(null);

  const handleActivate = (planName: string) => {
    setIsProcessing(true);
    setTimeout(() => {
      activateProPass(planName);
      setIsProcessing(false);
      setActivatedSuccess(planName);
    }, 800);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-16 font-sans selection:bg-amber-400 selection:text-slate-950">
      
      {/* 1. Hero Pass Banner */}
      <section className="text-center space-y-4 pt-4">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold shadow-sm">
          <Crown className="w-3.5 h-3.5 fill-amber-400" />
          <span>Testbook-Grade Commercial Test Series Pass</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Unlock 100+ Tests with <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 bg-clip-text text-transparent">
            CG Exam Pass Pro
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          One single membership unlocks comprehensive test series for <strong>CGPSC State Services, CG Vyapam Hostel Warden, Patwari, RI, and Teacher Recruitment</strong> with All-India ranking simulation.
        </p>

        {user?.hasProPass && (
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-sm font-bold animate-pulse">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Active Subscription: {user.proPassPlan || 'Pro Pass Active'} • Unlimited Access</span>
          </div>
        )}
      </section>

      {/* 2. Pricing Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        
        {/* Tier 1: Monthly Pass */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-xl relative">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white">Monthly Pass</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                30 Days
              </span>
            </div>

            <div className="flex items-baseline space-x-2">
              <span className="text-3xl sm:text-4xl font-black text-white">₹99</span>
              <span className="text-xs text-slate-400 line-through">₹299</span>
              <span className="text-xs text-emerald-400 font-bold">66% Off</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Ideal for quick revision and testing your readiness right before the exam date.
            </p>

            <ul className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Access to all 100+ Mock Tests</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Bilingual Hindi & English Solutions</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>TCS iON Realistic Exam Interface</span>
              </li>
              <li className="flex items-center space-x-2 text-slate-500">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span>Limited AI Smart Test generation</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleActivate('Monthly Pass (₹99)')}
            disabled={isProcessing}
            className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
          >
            {user?.hasProPass ? 'Extend for ₹99' : 'Get Monthly Pass'}
          </button>
        </div>

        {/* Tier 2: Yearly Pro Pass (BEST VALUE - Highlighted) */}
        <div className="bg-gradient-to-b from-slate-900 to-amber-950/40 border-2 border-amber-500/80 rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-2xl relative scale-105 z-10">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-[11px] px-3.5 py-1 rounded-full uppercase tracking-wider shadow-md">
            Most Popular • 75% Off
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-amber-300 flex items-center space-x-2">
                <Crown className="w-5 h-5 fill-amber-400 text-amber-400" />
                <span>Yearly Pro Pass</span>
              </h3>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40">
                365 Days
              </span>
            </div>

            <div className="flex items-baseline space-x-2">
              <span className="text-4xl sm:text-5xl font-black text-white">₹299</span>
              <span className="text-sm text-slate-400 line-through">₹1,199</span>
              <span className="text-xs text-amber-400 font-bold">Best Value</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Complete full-year preparation for all upcoming 2026 notifications: CGPSC Prelims, CG Vyapam RI, Patwari, and Teacher Bharti.
            </p>

            <ul className="space-y-2.5 text-xs text-slate-200 pt-2 border-t border-slate-800">
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-bold text-white">Unlimited Access to All Tests & PYPs</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Simulated All-India Rank & Percentile</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Chhattisgarhi Special GK & Language Drills</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span>AI Smart Question Generator Access</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Printable PDF Question Papers</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleActivate('Yearly Pro Pass (₹299)')}
            disabled={isProcessing}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-xs hover:brightness-110 shadow-lg shadow-amber-500/25 transition cursor-pointer active:scale-95"
          >
            {user?.hasProPass ? 'Renew Yearly Pass (₹299)' : 'Unlock Yearly Pro Pass (₹299)'}
          </button>
        </div>

        {/* Tier 3: Lifetime / 2-Year Pass */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-xl relative">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white">Lifetime Pass</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                2 Years
              </span>
            </div>

            <div className="flex items-baseline space-x-2">
              <span className="text-3xl sm:text-4xl font-black text-white">₹499</span>
              <span className="text-xs text-slate-400 line-through">₹1,999</span>
              <span className="text-xs text-emerald-400 font-bold">75% Off</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              For dedicated aspirants preparing across multiple recruitment cycles through 2027.
            </p>

            <ul className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Everything in Yearly Pro Pass</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>All Future 2026-2027 Test Series Included</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Priority Doubt Support in Discussions</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleActivate('Lifetime Pass (₹499)')}
            disabled={isProcessing}
            className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
          >
            {user?.hasProPass ? 'Extend to Lifetime' : 'Get Lifetime Pass (₹499)'}
          </button>
        </div>
      </div>

      {/* 3. Activation Success Modal / Banner */}
      {activatedSuccess && (
        <div className="bg-emerald-950/80 border border-emerald-500 p-5 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black">
              ✓
            </div>
            <div>
              <h4 className="text-base font-black text-white">Pro Pass Activated Successfully!</h4>
              <p className="text-xs text-emerald-300">
                You now have full unrestricted access to all 100+ tests and previous papers.
              </p>
            </div>
          </div>

          <button
            onClick={onExploreTests}
            className="px-5 py-2.5 bg-emerald-500 text-slate-950 rounded-xl font-bold text-xs hover:bg-emerald-400 transition cursor-pointer"
          >
            Start Practicing Mocks Now →
          </button>
        </div>
      )}

      {/* 4. Feature Comparison Matrix */}
      <section className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
        <h3 className="text-base font-black text-white flex items-center space-x-2">
          <Award className="w-5 h-5 text-amber-400" />
          <span>Plan Comparison (Free vs Pro Pass)</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-3 px-4">Feature</th>
                <th className="py-3 px-4">Free Aspirant</th>
                <th className="py-3 px-4 text-amber-400 font-bold">Pro Pass Member</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr>
                <td className="py-3 px-4 font-semibold text-white">Full-Length Mock Tests</td>
                <td className="py-3 px-4">2 Free Starter Mocks</td>
                <td className="py-3 px-4 text-emerald-400 font-bold">Unlimited (100+ Tests)</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white">Official Previous Year Papers</td>
                <td className="py-3 px-4">Included (Free)</td>
                <td className="py-3 px-4 text-emerald-400 font-bold">Included + Detailed Notes</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white">TCS iON Pre-Flight Exam Interface</td>
                <td className="py-3 px-4">Yes</td>
                <td className="py-3 px-4 text-emerald-400 font-bold">Yes (All Tests)</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white">All-India Simulated Rank & Percentile</td>
                <td className="py-3 px-4">Basic</td>
                <td className="py-3 px-4 text-emerald-400 font-bold">Full Deep Analytics</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white">Bilingual Language Switching (Hindi/English)</td>
                <td className="py-3 px-4">Yes</td>
                <td className="py-3 px-4 text-emerald-400 font-bold">Yes</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. Frequently Asked Questions */}
      <section className="space-y-4">
        <h3 className="text-base font-black text-white flex items-center space-x-2">
          <HelpCircle className="w-5 h-5 text-slate-400" />
          <span>Frequently Asked Questions</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-2xl space-y-1">
            <h4 className="font-bold text-white">Can I switch between Hindi and English during the test?</h4>
            <p className="text-slate-400">
              Yes, you can toggle between Hindi and English anytime during the test with 1-click on the top header.
            </p>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-2xl space-y-1">
            <h4 className="font-bold text-white">Are questions aligned with the latest 2026 syllabus?</h4>
            <p className="text-slate-400">
              All mock tests follow exact official weightage and negative marking rules for CGPSC (+2/-0.66) and CG Vyapam (+1/-0.33).
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
