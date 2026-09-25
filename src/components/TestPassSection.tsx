import React, { useState, useMemo } from 'react';
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
  ArrowRight,
  QrCode,
  Smartphone,
  X,
  Loader2,
  Download,
  GraduationCap,
  Laptop,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import {
  getOrCreateDeviceId,
  calculateDaysRemaining,
  checkDeviceAuthorization,
  isUserPassActive
} from '../utils/devicePassManager';

interface TestPassSectionProps {
  onExploreTests: () => void;
}

export interface PassTier {
  id: 'monthly' | 'yearly';
  name: string;
  hindiTitle: string;
  price: number;
  originalPrice: number;
  durationDays: number;
  durationLabel: string;
  badge?: string;
  isPopular?: boolean;
  savingsTag: string;
  description: string;
  features: string[];
  recommendedFor: string;
}

export const TestPassSection: React.FC<TestPassSectionProps> = ({ onExploreTests }) => {
  const { user, activateProPass, transferPassDevice } = useAuth();
  const [selectedTier, setSelectedTier] = useState<PassTier | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'qr' | 'processing' | 'success'>('qr');
  const [activeUpiApp, setActiveUpiApp] = useState<'phonepe' | 'gpay' | 'paytm' | 'bhim'>('phonepe');
  const [transferSuccessMsg, setTransferSuccessMsg] = useState<string | null>(null);

  const deviceCheck = useMemo(() => checkDeviceAuthorization(user), [user]);
  const daysLeft = useMemo(() => calculateDaysRemaining(user?.passExpiresAt), [user?.passExpiresAt]);
  const isPassActive = useMemo(() => isUserPassActive(user), [user]);

  const passTiers: PassTier[] = [
    {
      id: 'monthly',
      name: 'Monthly All-Access Pass',
      hindiTitle: 'मासिक ऑल-एक्सेस पास (30 दिन)',
      price: 199,
      originalPrice: 299,
      durationDays: 30,
      durationLabel: '30 Days Complete Validity',
      savingsTag: 'Save ₹100',
      description: 'Full unrestricted access to every mock test, PYQ paper, and bundle across all Chhattisgarh exams for 30 days.',
      recommendedFor: 'Targeted Revision & Last-Minute Exam Sprint',
      features: [
        'Unlocks ALL 42+ Mock Tests & Previous Year Papers (PYP)',
        'CG शिक्षक भर्ती 2026 (Assistant Teacher, Teacher, Lecturer)',
        'CGPSC SSE Prelims 2026 (GS Paper 1 + CSAT Paper 2)',
        'CGSSB Vyapam (Hostel Warden, Patwari, RI, ADEO)',
        'CG Police Sub-Inspector (SI) & SAGES Mocks',
        'Bilingual (Hindi / English) TCS iON CBT Engine',
        'State-Level Percentile & District Merit Ranking',
        'Mistake Notebook & AI Analytics',
      ],
    },
    {
      id: 'yearly',
      name: 'Yearly All-Access Pass',
      hindiTitle: 'वार्षिक संपूर्ण महा-पास (365 दिन)',
      price: 599,
      originalPrice: 1199,
      durationDays: 365,
      durationLabel: '365 Days (1 Full Year Validity)',
      badge: '🔥 50% FLAT OFF OFFER • BEST VALUE',
      isPopular: true,
      savingsTag: 'Save ₹600 (Only ₹1.6 / Day)',
      description: 'The ultimate year-long subscription for serious candidates preparing across all upcoming 2026 exams in Chhattisgarh.',
      recommendedFor: 'Complete Year-Round Preparation Across Multiple Exams',
      features: [
        'Everything in Monthly Pass with 365 Days Uninterrupted Access',
        'Unlimited Mock Test Attempts & Retakes with Zero Ads',
        'Full 3-Cadre CG Teacher Recruitment 2026 Master Series',
        'Full CGPSC State Service Prelims 2026 Test Series',
        'Full CG Vyapam 2026 Combined Test Series',
        'High-Yield CG Special GK & Current Affairs 2026 Boosters',
        'Printable PDF Question Papers with Bilingual Detailed Solutions',
        'Priority Access to all Newly Added Tests throughout the year',
        'One-Time Payment • No Monthly Hassle or Credits Required',
      ],
    },
  ];

  const handleOpenCheckout = (tier: PassTier) => {
    setSelectedTier(tier);
    setPaymentStep('qr');
    setIsCheckoutOpen(true);
  };

  const handleSimulatePayment = () => {
    setPaymentStep('processing');
    setTimeout(() => {
      if (selectedTier) {
        activateProPass(selectedTier.id, `${selectedTier.name} (₹${selectedTier.price})`);
      }
      setPaymentStep('success');
    }, 1200);
  };

  const handleTransferDevice = () => {
    transferPassDevice();
    setTransferSuccessMsg('Pass successfully transferred to this device!');
    setTimeout(() => setTransferSuccessMsg(null), 3500);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-16 font-sans selection:bg-amber-400 selection:text-slate-950">
      
      {/* 1. Hero Pass Banner */}
      <section className="text-center space-y-4 pt-2">
        <div className="inline-flex items-center space-x-2 text-xs font-semibold text-amber-400">
          <Crown className="w-4 h-4 fill-amber-400" />
          <span className="uppercase tracking-wider">Unified All-Access Pass</span>
          <span aria-hidden="true">·</span>
          <span className="text-slate-400">No Single Exam Restrictions · 100% Full Access</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          One Pass. All Exams. Pure Practice. <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 bg-clip-text text-transparent">
            Tenure Validity with Unlimited Tests
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          No complicated credits or exam-by-exam purchase. One simple pass unlocks every test for <strong>CG शिक्षक भर्ती (All 3 Cadres)</strong>, <strong>CGPSC Prelims</strong>, and <strong>CG Vyapam</strong> for your chosen validity.
        </p>

        {/* Active Pass Status Pill */}
        {isPassActive && (
          <div className="inline-flex flex-wrap items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-500/15 border-2 border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-bold shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Active Plan: {user?.proPassPlan || 'All-Access Pass'}</span>
            <span className="bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-lg border border-emerald-500/30 font-mono">
              {daysLeft > 0 ? `${daysLeft} Days Remaining` : 'Active'}
            </span>
          </div>
        )}
      </section>

      {/* 2. Device Security & "One Device, One Pass" Guarantee Banner */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-400 border border-amber-500/20 shrink-0 mt-0.5">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-white text-sm sm:text-base">One Device, One Pass Security</h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 uppercase">
                  Device Protected
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
                Your pass is secured to your primary study device (<strong>{deviceCheck.currentDevice.name}</strong>). This protects your practice data, test progress, and bookmarks while preventing unauthorized account sharing.
              </p>
              {transferSuccessMsg && (
                <div className="mt-2 text-xs font-bold text-emerald-400 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{transferSuccessMsg}</span>
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0 flex items-center space-x-2 self-start md:self-center">
            {user?.hasProPass && user?.boundDeviceId && user.boundDeviceId !== deviceCheck.currentDevice.id ? (
              <button
                type="button"
                onClick={handleTransferDevice}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center space-x-1.5 shadow cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Switch Pass to This Device</span>
              </button>
            ) : (
              <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center space-x-1.5 font-mono">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Device Linked & Protected</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. Pricing Tiers Grid (Monthly ₹199 vs Yearly ₹599) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-stretch max-w-4xl mx-auto">
        {passTiers.map(tier => {
          const isSelected = selectedTier?.id === tier.id;
          return (
            <div
              key={tier.id}
              className={`rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-2xl relative transition-all ${
                tier.isPopular
                  ? 'bg-gradient-to-b from-slate-900 via-amber-950/40 to-slate-900 border-2 border-amber-500/80 shadow-amber-950/30 md:-translate-y-2'
                  : 'bg-slate-900/90 border border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Optional Popular Pill Banner */}
              {tier.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-[11px] px-4 py-1 rounded-full uppercase tracking-wider shadow-lg whitespace-nowrap">
                  {tier.badge}
                </div>
              )}

              <div className="space-y-4">
                {/* Title & Subtitle */}
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xl sm:text-2xl font-black text-white">
                      {tier.name}
                    </h3>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {tier.savingsTag}
                    </span>
                  </div>
                  <span className="text-xs text-amber-300/90 font-medium block mt-1">
                    {tier.hindiTitle}
                  </span>
                  <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-mono mt-2 bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800 w-fit">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{tier.durationLabel}</span>
                  </div>
                </div>

                {/* Pricing Box */}
                <div className="flex items-baseline space-x-2.5 pt-2 border-t border-slate-800">
                  <span className="text-4xl sm:text-5xl font-black text-white">
                    ₹{tier.price}
                  </span>
                  <span className="text-base text-slate-500 line-through">
                    ₹{tier.originalPrice}
                  </span>
                  <span className="text-xs text-emerald-400 font-black bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30">
                    {Math.round(((tier.originalPrice - tier.price) / tier.originalPrice) * 100)}% Off
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {tier.description}
                </p>

                {/* Features List */}
                <div className="pt-2 border-t border-slate-800 space-y-2.5">
                  <span className="text-xs font-bold text-slate-200 block">
                    What is unlocked with this pass:
                  </span>
                  <ul className="space-y-2.5 text-xs text-slate-300">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <Check className={`w-4 h-4 mt-0.5 shrink-0 ${tier.isPopular ? 'text-amber-400' : 'text-emerald-400'}`} />
                        <span className="leading-snug">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => handleOpenCheckout(tier)}
                className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm transition flex items-center justify-center space-x-2 shadow-lg cursor-pointer ${
                  tier.isPopular
                    ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 hover:brightness-110 shadow-amber-500/25'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                }`}
              >
                <span>{isPassActive ? `Renew / Extend @ ₹${tier.price}` : `Get ${tier.name} @ ₹${tier.price}`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* 4. Value Proposition Guarantees */}
      <section className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-3 sm:space-y-0 sm:space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-white">All Exams Included</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Never buy another test pass. One active pass gives 100% access to all current and upcoming tests.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-3 sm:space-y-0 sm:space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-white">Authentic Vyapam & CGPSC Pattern</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              TCS iON CBT engine simulation with real state negative marking and bilingual explanations.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-3 sm:space-y-0 sm:space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-white">Printable Revision PDFs</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Active pass holders can download test papers and official answer keys for quick offline revision.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Interactive UPI / QR Checkout Modal */}
      {isCheckoutOpen && selectedTier && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            
            {/* Close */}
            <button
              type="button"
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div>
              <div className="flex items-center space-x-2 text-xs font-semibold text-amber-400 mb-1">
                <Crown className="w-3.5 h-3.5 fill-amber-400" />
                <span>Instant Pass Activation • {selectedTier.durationLabel}</span>
              </div>
              <h3 className="text-xl font-black text-white">
                {selectedTier.name}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Special Offer: <strong className="text-emerald-400 font-bold">₹{selectedTier.price}</strong> (Saved ₹{selectedTier.originalPrice - selectedTier.price})
              </p>
            </div>

            {/* Step: QR Code View */}
            {paymentStep === 'qr' && (
              <div className="space-y-4">
                
                {/* QR Code Container */}
                <div className="p-4 bg-white rounded-2xl flex flex-col items-center justify-center space-y-2 shadow-inner">
                  <div className="w-40 h-40 bg-slate-100 rounded-xl border border-slate-300 flex flex-col items-center justify-center relative p-2">
                    <QrCode className="w-32 h-32 text-slate-900" />
                    <span className="text-[9px] font-mono text-slate-600 bg-white px-1.5 rounded border border-slate-200 absolute bottom-1">
                      UPI ID: cgssbtest@upi
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-800 text-center">
                    Scan with any UPI App to Pay ₹{selectedTier.price}
                  </span>
                </div>

                {/* UPI App Selector */}
                <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setActiveUpiApp('phonepe')}
                    className={`p-2 rounded-xl border transition cursor-pointer ${
                      activeUpiApp === 'phonepe' ? 'bg-purple-600/20 border-purple-500 text-purple-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    PhonePe
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveUpiApp('gpay')}
                    className={`p-2 rounded-xl border transition cursor-pointer ${
                      activeUpiApp === 'gpay' ? 'bg-blue-600/20 border-blue-500 text-blue-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Google Pay
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveUpiApp('paytm')}
                    className={`p-2 rounded-xl border transition cursor-pointer ${
                      activeUpiApp === 'paytm' ? 'bg-cyan-600/20 border-cyan-500 text-cyan-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Paytm
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveUpiApp('bhim')}
                    className={`p-2 rounded-xl border transition cursor-pointer ${
                      activeUpiApp === 'bhim' ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    BHIM UPI
                  </button>
                </div>

                {/* Instant Verification Button */}
                <button
                  type="button"
                  onClick={handleSimulatePayment}
                  className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm transition flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>I Have Paid ₹{selectedTier.price} • Activate Instantly</span>
                </button>
              </div>
            )}

            {/* Step: Processing Verification */}
            {paymentStep === 'processing' && (
              <div className="py-8 flex flex-col items-center justify-center space-y-3 text-center">
                <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
                <h4 className="font-bold text-white text-sm">
                  Verifying UPI Transaction & Linking Device...
                </h4>
                <p className="text-xs text-slate-400 max-w-xs">
                  Activating {selectedTier.name} for {selectedTier.durationDays} days on this device.
                </p>
              </div>
            )}

            {/* Step: Success */}
            {paymentStep === 'success' && (
              <div className="py-6 flex flex-col items-center justify-center space-y-3 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <h4 className="font-black text-white text-lg">
                  Pass Activated Successfully!
                </h4>
                <p className="text-xs text-slate-300 max-w-xs">
                  Your <strong>{selectedTier.name}</strong> is active for {selectedTier.durationDays} days. All tests across CG Teacher, CGPSC, and Vyapam are unlocked!
                </p>
                <div className="pt-3 w-full">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCheckoutOpen(false);
                      onExploreTests();
                    }}
                    className="w-full py-3 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs transition cursor-pointer shadow-lg shadow-emerald-500/20"
                  >
                    Start Practicing Tests Now
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
