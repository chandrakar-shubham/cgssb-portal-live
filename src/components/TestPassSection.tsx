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
  Clock,
  ArrowRight,
  QrCode,
  Smartphone,
  X,
  Loader2,
  Download,
  GraduationCap,
  RefreshCw,
  Tag,
  Copy,
  Receipt,
  ExternalLink,
  Gift
} from 'lucide-react';
import {
  getOrCreateDeviceId,
  calculateDaysRemaining,
  checkDeviceAuthorization,
  isUserPassActive,
  FREE_ACCESS_CAMPAIGN
} from '../utils/devicePassManager';
import { api } from '../utils/apiClient';

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
  const [activeUpiApp, setActiveUpiApp] = useState<'gpay' | 'phonepe' | 'paytm' | 'bhim'>('gpay');
  const [transferSuccessMsg, setTransferSuccessMsg] = useState<string | null>(null);

  // Coupon & UTR States
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPercentage: number } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [lastInvoiceNumber, setLastInvoiceNumber] = useState('');

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
    setAppliedCoupon(null);
    setCouponCodeInput('');
    setCouponError('');
    setUtrNumber('');
    setPaymentStep('qr');
    setIsCheckoutOpen(true);
  };

  // Final Payable Calculation with Coupon
  const finalPrice = useMemo(() => {
    if (!selectedTier) return 0;
    if (!appliedCoupon) return selectedTier.price;
    const discount = Math.round((selectedTier.price * appliedCoupon.discountPercentage) / 100);
    return Math.max(1, selectedTier.price - discount);
  }, [selectedTier, appliedCoupon]);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCodeInput.trim() || !selectedTier) return;
    setCouponError('');
    try {
      const res = await api.post<{ valid: boolean; coupon?: { code: string; discountPercentage: number }; error?: string }>(
        '/api/user/validate-coupon',
        { code: couponCodeInput.trim(), planType: selectedTier.id },
        { requireAuth: true }
      );
      if (res.valid && res.coupon) {
        setAppliedCoupon({
          code: res.coupon.code,
          discountPercentage: res.coupon.discountPercentage
        });
      } else {
        setAppliedCoupon(null);
        setCouponError(res.error || 'Invalid promo code');
      }
    } catch (error: any) {
      setAppliedCoupon(null);
      setCouponError(error?.message || 'Could not validate promo code');
    }
  };

  // UPI Deep Link Generator
  const upiDeepLink = useMemo(() => {
    if (!selectedTier) return '';
    const pa = 'cgtest@okaxis'; // Official UPI ID
    const pn = encodeURIComponent('cgtest.in Exam Portal');
    const am = finalPrice;
    const tn = encodeURIComponent(`CGTEST_${selectedTier.id}_${user?.id || 'guest'}`);
    return `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR&tn=${tn}`;
  }, [selectedTier, finalPrice, user]);

  const handleCompletePayment = () => {
    setPaymentStep('processing');
    const invNum = `INV-CGSSB-${Date.now().toString().slice(-6)}`;
    setLastInvoiceNumber(invNum);

    setTimeout(() => {
      if (selectedTier) {
        activateProPass(selectedTier.id, `${selectedTier.name} (₹${finalPrice})`);
      }
      setPaymentStep('success');
    }, 1200);
  };

  const handleTransferDevice = () => {
    transferPassDevice();
    setTransferSuccessMsg('Pass successfully transferred to this device!');
    setTimeout(() => setTransferSuccessMsg(null), 3500);
  };

  // Print Invoice Receipt
  const handlePrintReceipt = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>CGSSB Test Portal - Payment Receipt</title>
          <style>
            body { font-family: sans-serif; padding: 30px; color: #1e293b; }
            .header { border-bottom: 2px solid #059669; padding-bottom: 12px; margin-bottom: 20px; }
            .title { font-size: 22px; font-weight: bold; color: #065f46; }
            .meta { font-size: 13px; color: #64748b; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
            th { background: #f1f5f9; }
            .total { font-size: 16px; font-weight: bold; color: #047857; }
            .footer { font-size: 11px; color: #94a3b8; text-align: center; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">CGSSB Test Portal • Pass Tax Receipt</div>
            <div class="meta">Invoice: <strong>${lastInvoiceNumber}</strong> | Date: ${new Date().toLocaleDateString('en-IN')}</div>
          </div>
          <p><strong>Candidate:</strong> ${user?.name || 'Aspirant Student'} (${user?.email || 'N/A'})</p>
          <p><strong>Target Exam:</strong> ${user?.targetExam || 'CG Teacher / Vyapam / CGPSC'}</p>
          <table>
            <thead>
              <tr>
                <th>Item Description</th>
                <th>Validity</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${selectedTier?.name || 'All-Access Pass'}</td>
                <td>${selectedTier?.durationLabel || '365 Days'}</td>
                <td>₹${selectedTier?.price}</td>
              </tr>
              ${appliedCoupon ? `<tr><td>Promo Code (${appliedCoupon.code})</td><td>-</td><td>-${appliedCoupon.discountPercentage}%</td></tr>` : ''}
              <tr>
                <td colspan="2" class="total">Total Paid (Inclusive of all taxes):</td>
                <td class="total">₹${finalPrice}</td>
              </tr>
            </tbody>
          </table>
          <p><strong>Status:</strong> COMPLETED & VERIFIED (Instant Unlock)</p>
          <div class="footer">
            This is a computer-generated tax invoice. Verified by CGSSB Test Portal Academic Wing.
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Paid checkout is intentionally hidden during the free-launch growth campaign.
  // Keep the component route alive so we can restore paid plans later without changing navigation.
  if (FREE_ACCESS_CAMPAIGN) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-16 font-sans">
        <section className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-slate-900 via-emerald-950/30 to-slate-900 p-6 sm:p-8 shadow-2xl">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-black">
              <Gift className="w-4 h-4" />
              <span>FREE LAUNCH CAMPAIGN</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white">
              All-Access Practice is <span className="text-emerald-400">FREE</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Every registered aspirant gets <strong className="text-white">1 month free</strong>.
              Complete <strong className="text-white">5 tests</strong> and unlock an additional
              <strong className="text-amber-300"> 2 months free</strong>.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-4">
                <div className="text-2xl font-black text-emerald-400">30 Days</div>
                <div className="text-xs text-slate-400 mt-1">Free on registration</div>
              </div>
              <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-4">
                <div className="text-2xl font-black text-amber-300">+60 Days</div>
                <div className="text-xs text-slate-400 mt-1">After 5 completed tests</div>
              </div>
              <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-4">
                <div className="text-2xl font-black text-white">3 Months</div>
                <div className="text-xs text-slate-400 mt-1">Maximum free access</div>
              </div>
            </div>
          </div>
        </section>

        {user ? (
          <section className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-lg font-black text-white">Your Free All-Access Pass</h2>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {isPassActive
                    ? `${daysLeft} day${daysLeft === 1 ? '' : 's'} remaining • Complete ${Math.max(0, 5 - Number(user.completedTestsCount || 0))} more test${Math.max(0, 5 - Number(user.completedTestsCount || 0)) === 1 ? '' : 's'} to unlock the 2-month bonus.`
                    : 'Your free campaign pass has expired.'}
                </p>
              </div>
              <div className="shrink-0 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-black text-sm">
                {isPassActive ? `${daysLeft}d Free Access` : 'Expired'}
              </div>
            </div>

            <div className="mt-5 h-3 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all"
                style={{ width: `${Math.min(100, (Number(user.completedTestsCount || 0) / 5) * 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-[11px] font-bold text-slate-500">
              <span>{Math.min(5, Number(user.completedTestsCount || 0))}/5 tests completed</span>
              <span>{user.unlockedMilestoneBonus ? '3-month bonus unlocked' : '5 tests → +2 months'}</span>
            </div>

            <button
              type="button"
              onClick={onExploreTests}
              className="mt-5 w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm transition shadow-lg shadow-emerald-500/20"
            >
              <span>Start Practicing — All Tests Free</span>
            </button>
          </section>
        ) : (
          <section className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 text-center">
            <h2 className="text-xl font-black text-white">Create your free account</h2>
            <p className="text-sm text-slate-400 mt-2">Register to activate the 30-day All-Access launch pass.</p>
          </section>
        )}

        <section className="rounded-3xl bg-slate-900/70 border border-slate-800 p-5 text-center">
          <p className="text-xs text-slate-500">
            Paid All-Access plans are temporarily unavailable during the free-launch campaign.
            We will introduce paid plans later.
          </p>
        </section>
      </div>
    );
  }

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
          One simple pass unlocks every test for <strong>CG शिक्षक भर्ती (All 3 Cadres)</strong>, <strong>CGPSC Prelims</strong>, and <strong>CG Vyapam</strong> for your chosen validity.
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

      {/* 3. Pricing Tiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-stretch max-w-4xl mx-auto">
        {passTiers.map(tier => {
          return (
            <div
              key={tier.id}
              className={`rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-2xl relative transition-all ${
                tier.isPopular
                  ? 'bg-gradient-to-b from-slate-900 via-amber-950/40 to-slate-900 border-2 border-amber-500/80 shadow-amber-950/30 md:-translate-y-2'
                  : 'bg-slate-900/90 border border-slate-800 hover:border-slate-700'
              }`}
            >
              {tier.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-[11px] px-4 py-1 rounded-full uppercase tracking-wider shadow-lg whitespace-nowrap">
                  {tier.badge}
                </div>
              )}

              <div className="space-y-4">
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

              <button
                type="button"
                onClick={() => handleOpenCheckout(tier)}
                className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm transition flex items-center justify-center space-x-2 shadow-lg cursor-pointer ${
                  tier.isPopular
                    ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 hover:brightness-110 shadow-amber-500/25'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                }`}
              >
                <span>{isPassActive ? `Renew / Extend @ ₹${tier.price}` : `Unlock ${tier.name} @ ₹${tier.price}`}</span>
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

      {/* 5. Interactive Google Pay / UPI Dynamic Checkout Modal */}
      {isCheckoutOpen && selectedTier && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-7 space-y-5 shadow-2xl relative text-slate-100 my-auto">
            
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
                <span>Instant Pass Unlock • {selectedTier.durationLabel}</span>
              </div>
              <h3 className="text-xl font-black text-white">
                {selectedTier.name}
              </h3>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-2xl font-black text-emerald-400 font-mono">₹{finalPrice}</span>
                {appliedCoupon && (
                  <span className="text-xs text-emerald-300 font-bold bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    {appliedCoupon.code} Applied ({appliedCoupon.discountPercentage}% OFF)
                  </span>
                )}
              </div>
            </div>

            {/* Step: QR & Payment View */}
            {paymentStep === 'qr' && (
              <div className="space-y-4">
                
                {/* 1-Tap Google Pay / PhonePe direct intent launcher on Mobile */}
                <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-800/50 space-y-2">
                  <span className="text-xs font-bold text-indigo-300 flex items-center space-x-1.5">
                    <Smartphone className="w-4 h-4 text-indigo-400" />
                    <span>Pay via UPI App (1-Tap Direct Checkout)</span>
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={upiDeepLink}
                      className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs flex items-center justify-center space-x-2 shadow cursor-pointer transition"
                    >
                      <span>Google Pay (GPay)</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    <a
                      href={upiDeepLink}
                      className="py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs flex items-center justify-center space-x-2 shadow cursor-pointer transition"
                    >
                      <span>PhonePe</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* QR Code Container */}
                <div className="p-4 bg-white rounded-2xl flex flex-col items-center justify-center space-y-2 shadow-inner text-slate-900">
                  <div className="w-44 h-44 bg-slate-50 rounded-xl border border-slate-300 flex flex-col items-center justify-center relative p-2 shadow-sm">
                    <QrCode className="w-36 h-36 text-slate-900" />
                    <span className="text-[10px] font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-300 absolute bottom-1.5 shadow-sm">
                      UPI: cgtest@okaxis
                    </span>
                  </div>
                  <div className="text-center space-y-0.5">
                    <span className="text-xs font-black text-slate-900 block">
                      Scan with Google Pay, PhonePe or Paytm
                    </span>
                    <span className="text-[11px] text-slate-600 font-medium">
                      Exact Amount: <strong>₹{finalPrice}</strong>
                    </span>
                  </div>
                </div>

                {/* Promo Code Input Box */}
                <form onSubmit={handleApplyCoupon} className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center space-x-1">
                    <Tag className="w-3.5 h-3.5 text-amber-400" />
                    <span>Have a Promo Coupon Code?</span>
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={couponCodeInput}
                      onChange={e => setCouponCodeInput(e.target.value.toUpperCase())}
                      placeholder="e.g. CGTEACHER50"
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white uppercase font-mono font-bold focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer shadow"
                    >
                      Apply
                    </button>
                  </div>
                  {couponError && (
                    <span className="text-[11px] text-rose-400 font-semibold block">{couponError}</span>
                  )}
                </form>

                {/* Instant Verification Button */}
                <button
                  type="button"
                  onClick={handleCompletePayment}
                  className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm transition flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/25 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>I Have Completed ₹{finalPrice} Payment • Unlock Pass</span>
                </button>
              </div>
            )}

            {/* Step: Processing Verification */}
            {paymentStep === 'processing' && (
              <div className="py-10 flex flex-col items-center justify-center space-y-3 text-center">
                <Loader2 className="w-12 h-12 text-amber-400 animate-spin" />
                <h4 className="font-extrabold text-white text-base">
                  Verifying UPI Payment & Linking Device...
                </h4>
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                  Activating <strong>{selectedTier.name}</strong> on device: {deviceCheck.currentDevice.name}.
                </p>
              </div>
            )}

            {/* Step: Success */}
            {paymentStep === 'success' && (
              <div className="py-6 flex flex-col items-center justify-center space-y-4 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Check className="w-7 h-7 stroke-[3]" />
                </div>
                <div>
                  <h4 className="font-black text-white text-xl">
                    Pass Activated Successfully!
                  </h4>
                  <p className="text-xs text-slate-300 max-w-xs mt-1 leading-relaxed">
                    Your <strong>{selectedTier.name}</strong> is active for {selectedTier.durationDays} days. All CBT mock tests across CG Teacher, CGPSC, and Vyapam are unlocked!
                  </p>
                </div>

                <div className="w-full pt-2 flex flex-col sm:flex-row items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrintReceipt}
                    className="w-full sm:flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer border border-slate-700"
                  >
                    <Receipt className="w-4 h-4 text-emerald-400" />
                    <span>Download Receipt</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsCheckoutOpen(false);
                      onExploreTests();
                    }}
                    className="w-full sm:flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition cursor-pointer shadow-lg shadow-emerald-500/20"
                  >
                    Start Practicing Tests
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
