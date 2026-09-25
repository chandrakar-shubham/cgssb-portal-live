import React, { useState, useEffect } from 'react';
import { TestSeriesBundle, BundleTestItem } from '../data/bundleCatalog';
import { MockTest } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  AlertCircle,
  ArrowLeft,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Crown,
  FileText,
  Flame,
  Globe2,
  HelpCircle,
  Layers,
  Lock,
  Percent,
  Play,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Users,
  Zap,
  Check,
  QrCode,
  Loader2,
  ExternalLink,
  GraduationCap,
  Download,
  Copy,
  Info,
  Building,
  CheckCheck
} from 'lucide-react';
import {
  calculateDaysRemaining,
  isUserPassActive,
} from '../utils/devicePassManager';

interface BundleDetailPageProps {
  bundle: TestSeriesBundle;
  availableTests: MockTest[];
  onBack: () => void;
  onStartTest: (test: MockTest) => void;
  onExplorePass: () => void;
  isEnrolled?: boolean;
  onEnrollSuccess?: (bundleId: string) => void;
}

export const BundleDetailPage: React.FC<BundleDetailPageProps> = ({
  bundle,
  availableTests,
  onBack,
  onStartTest,
  onExplorePass,
  isEnrolled = false,
  onEnrollSuccess,
}) => {
  const { user, activateProPass } = useAuth();
  const isPassActive = isUserPassActive(user);
  const daysRemaining = calculateDaysRemaining(user?.passExpiresAt);

  const [activeTab, setActiveTab] = useState<'tests' | 'dates' | 'eligibility' | 'syllabus' | 'pattern' | 'faqs'>('tests');
  const [testTypeFilter, setTestTypeFilter] = useState<'ALL' | 'MOCK' | 'CHAPTER' | 'PYP'>('ALL');
  const [selectedSyllabusIndex, setSelectedSyllabusIndex] = useState<number | null>(0);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [paymentStep, setPaymentStep] = useState<'plan' | 'qr' | 'processing' | 'success'>('plan');
  const [activeUpiApp, setActiveUpiApp] = useState<'phonepe' | 'gpay' | 'paytm' | 'bhim'>('phonepe');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const isCgpsc = bundle.authority === 'CGPSC';

  // Dynamic SEO Title & Schema.org JSON-LD structured data injection
  useEffect(() => {
    const originalTitle = document.title;
    document.title = `${bundle.title} (${bundle.targetYear}) – Syllabus, Eligibility & Mock Tests | CG Exam Portal`;

    // Structured data for Google Rich Results
    const schemaData = {
      '@context': 'https://schema.org',
      '@type': 'Course',
      'name': bundle.title,
      'alternateName': bundle.titleHindi,
      'description': bundle.shortDescription,
      'provider': {
        '@type': 'Organization',
        'name': `${bundle.authority} Exam Prep Portal`,
        'url': window.location.origin
      },
      'offers': {
        '@type': 'Offer',
        'price': bundle.price.toString(),
        'priceCurrency': 'INR',
        'availability': 'https://schema.org/InStock',
        'validFrom': '2026-01-01'
      },
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': bundle.rating.toString(),
        'reviewCount': bundle.enrolledStudentsCount.toString(),
        'bestRating': '5',
        'worstRating': '1'
      }
    };

    let scriptTag = document.getElementById('bundle-schema-jsonld') as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = 'bundle-schema-jsonld';
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }
    scriptTag.text = JSON.stringify(schemaData);

    return () => {
      document.title = originalTitle;
      const el = document.getElementById('bundle-schema-jsonld');
      if (el) el.remove();
    };
  }, [bundle]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Compile combined test items (Full Mocks + Chapters + PYPs)
  const allAttachedItems = [
    ...(bundle.testItems || []).map(t => ({ ...t, kind: 'MOCK' as const })),
    ...(bundle.chapterTests || []).map(t => ({ ...t, kind: 'CHAPTER' as const })),
    ...(bundle.pypTests || []).map(t => ({ ...t, kind: 'PYP' as const }))
  ];

  const filteredAttachedItems = allAttachedItems.filter(item => {
    if (testTypeFilter === 'ALL') return true;
    return item.kind === testTypeFilter;
  });

  // Find or synthesize a playable MockTest for a given test item
  const resolvePlayableTest = (item: BundleTestItem): MockTest => {
    const found = availableTests.find(t => t.id === item.id);
    if (found) return found;

    const matchByTitle = availableTests.find(t =>
      t.title.toLowerCase().includes(item.title.toLowerCase()) ||
      (t.category === bundle.authority)
    );

    if (matchByTitle) {
      return {
        ...matchByTitle,
        id: item.id,
        title: item.title,
        durationMinutes: item.durationMinutes || matchByTitle.durationMinutes,
        questionCount: item.questionCount || matchByTitle.questionCount,
      };
    }

    const base = availableTests[0] || {
      id: item.id,
      title: item.title,
      category: bundle.authority,
      durationMinutes: item.durationMinutes || 120,
      questionCount: item.questionCount || 100,
      marksPerQuestion: isCgpsc ? 2.0 : 1.0,
      negativeMarksPerQuestion: isCgpsc ? 0.667 : 0.25,
      sections: [{ id: 'sec-1', name: 'General', questionIds: [] }],
      attemptsCount: item.attemptsCount,
      createdAt: new Date().toISOString(),
    };

    return {
      ...base,
      id: item.id,
      title: item.title,
      durationMinutes: item.durationMinutes,
      questionCount: item.questionCount,
    };
  };

  const handleStartItemTest = (item: BundleTestItem) => {
    if (!item.isFreePreview && !isPassActive) {
      setIsPassModalOpen(true);
      return;
    }
    const testToLaunch = resolvePlayableTest(item);
    onStartTest(testToLaunch);
  };

  const handleCopyShareLink = () => {
    const url = `${window.location.origin}/series/${bundle.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    showToast('Direct test series link copied to clipboard!');
  };

  const handleWhatsAppShare = () => {
    const url = `${window.location.origin}/series/${bundle.slug}`;
    const text = `🏛️ *${bundle.title} (${bundle.targetYear})*\n${bundle.titleHindi}\n\n📚 Pattern: ${bundle.examPattern.totalQuestions} Questions (${bundle.examPattern.totalMarks} Marks)\n🎯 Free Sample Mocks available for practice.\n\n👉 Open Series & Syllabus: ${url}`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  const firstFreeItem = allAttachedItems.find(t => t.isFreePreview) || allAttachedItems[0];

  return (
    <div className="space-y-6 pb-16 font-sans text-slate-100 selection:bg-emerald-500 selection:text-slate-950 max-w-7xl mx-auto">
      
      {/* Toast notification */}
      {toastMsg && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 bg-emerald-500 text-slate-950 px-4 py-3 rounded-2xl shadow-2xl font-bold flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Share2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-black text-white">Share This Test Series</h3>
              </div>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* WhatsApp Card Preview */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400">WhatsApp / Social Message Preview</span>
              <div className="text-xs text-slate-300 space-y-1 font-mono bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                <p className="font-bold text-white">🏛️ {bundle.title} ({bundle.targetYear})</p>
                <p className="text-emerald-400">{bundle.titleHindi}</p>
                <p className="text-slate-400">Total Marks: {bundle.examPattern.totalMarks} | {bundle.totalTestsCount} Tests Included</p>
              </div>
            </div>

            {/* Quick Share Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleWhatsAppShare}
                className="py-3 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-black text-xs flex items-center justify-center space-x-2 shadow-lg transition cursor-pointer"
              >
                <span>Share to WhatsApp</span>
              </button>
              <button
                onClick={handleCopyShareLink}
                className="py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center justify-center space-x-2 shadow-lg transition cursor-pointer"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Copied' : 'Copy Direct URL'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Navigation & Share Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-2 text-xs sm:text-sm font-bold text-slate-400 hover:text-white transition px-3.5 py-2 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-400" />
          <span>Back to All Test Series</span>
        </button>

        <div className="flex items-center space-x-2">
          <span className="hidden md:inline-flex text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
            /series/{bundle.slug}
          </span>
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition cursor-pointer flex items-center space-x-1.5 text-xs font-bold"
            title="Share series link with preview"
          >
            <Share2 className="w-4 h-4 text-emerald-400" />
            <span>Share Series</span>
          </button>
        </div>
      </div>

      {/* Hero Banner Section */}
      <section className={`relative overflow-hidden rounded-3xl border p-6 sm:p-8 shadow-2xl ${
        isCgpsc
          ? 'bg-gradient-to-br from-rose-950/90 via-slate-900 to-slate-950 border-rose-900/40'
          : 'bg-gradient-to-br from-indigo-950/90 via-slate-900 to-slate-950 border-indigo-900/40'
      }`}>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-4 max-w-4xl">
          {/* Authority & Status Tag */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-md text-xs font-black uppercase tracking-wider border ${
              isCgpsc ? 'bg-rose-900/50 text-rose-300 border-rose-700/50' : 'bg-indigo-900/50 text-indigo-300 border-indigo-700/50'
            }`}>
              {bundle.authority} Official Blueprint
            </span>
            
            {bundle.badge && (
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold text-amber-300 bg-amber-950/50 border border-amber-800/40 flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{bundle.badge}</span>
              </span>
            )}

            {bundle.importantDates?.status && (
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40 flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Status: {bundle.importantDates.status.toUpperCase()}</span>
              </span>
            )}

            <span className="text-xs text-slate-400 bg-slate-950/60 px-2.5 py-0.5 rounded-md border border-slate-800">
              Exam Year {bundle.targetYear}
            </span>
          </div>

          {/* Title Heading */}
          <div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              {bundle.title}
            </h1>
            <p className="text-sm sm:text-base font-semibold text-emerald-400 mt-1">
              {bundle.titleHindi}
            </p>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
            {bundle.fullDescription}
          </p>

          {/* Key Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block font-medium">Total Curriculum</span>
              <span className="text-sm sm:text-base font-black text-white flex items-center space-x-1">
                <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                <span>{allAttachedItems.length || bundle.totalTestsCount} Tests</span>
                <span className="text-[10px] text-emerald-400 font-normal">({bundle.freeTestsCount || 1} Free)</span>
              </span>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block font-medium">Medium</span>
              <span className="text-sm sm:text-base font-black text-teal-300 flex items-center space-x-1">
                <Globe2 className="w-3.5 h-3.5 text-teal-400" />
                <span>{bundle.languageDisplay.split(' ')[0]}</span>
              </span>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block font-medium">Enrolled Aspirants</span>
              <span className="text-sm sm:text-base font-black text-white flex items-center space-x-1">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span>{bundle.enrolledStudentsCount.toLocaleString()}+</span>
              </span>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block font-medium">Target Exam Date</span>
              <span className="text-sm sm:text-base font-black text-amber-300 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span className="truncate">{bundle.importantDates?.examDate || `${bundle.targetYear}`}</span>
              </span>
            </div>
          </div>

          {/* CTA Action Row */}
          <div className="pt-3 flex flex-wrap items-center gap-3">
            {isPassActive ? (
              <div className="inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-sm font-black shadow-md">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>All-Access Pass Active • All Tests Unlocked</span>
              </div>
            ) : (
              <button
                onClick={() => setIsPassModalOpen(true)}
                className="px-6 py-3.5 rounded-2xl font-black text-sm bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 shadow-xl shadow-amber-950/50 hover:brightness-110 transition flex items-center space-x-2 cursor-pointer"
              >
                <Crown className="w-4 h-4 fill-slate-950" />
                <span>Unlock Series (₹{bundle.price}) / All-Access Pass</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            )}

            {firstFreeItem && (
              <button
                onClick={() => handleStartItemTest(firstFreeItem)}
                className="px-5 py-3 rounded-2xl font-bold text-sm bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700 hover:border-slate-600 transition flex items-center space-x-2 cursor-pointer"
              >
                <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                <span>Attempt Free Sample Test</span>
              </button>
            )}

            {bundle.officialLinks?.applyUrl && (
              <a
                href={bundle.officialLinks.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-3 rounded-2xl font-bold text-xs sm:text-sm bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 transition flex items-center space-x-1.5 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Official Apply Portal</span>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Main Content Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 overflow-x-auto no-scrollbar">
        {[
          { id: 'tests', label: `Tests & Curriculum (${allAttachedItems.length})`, icon: BookOpen },
          { id: 'dates', label: 'Important Dates & Timeline', icon: Calendar, highlight: true },
          { id: 'eligibility', label: 'Eligibility & Rules', icon: GraduationCap },
          { id: 'syllabus', label: `Official Syllabus (${bundle.syllabusBreakdown.length} Subjects)`, icon: FileText },
          { id: 'pattern', label: 'Exam Pattern & Rules', icon: ShieldAlert },
          { id: 'faqs', label: 'FAQs & Guidance', icon: HelpCircle },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center space-x-2 cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800/80'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: TESTS & CURRICULUM (MOCKS + CHAPTERS + PYPS)                   */}
      {/* ===================================================================== */}
      {activeTab === 'tests' && (
        <div className="space-y-4">
          
          {/* Sub Filter for Test Types */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
            <div className="flex items-center space-x-2">
              {(['ALL', 'MOCK', 'CHAPTER', 'PYP'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setTestTypeFilter(type)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    testTypeFilter === type
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  {type === 'ALL' && `All Curriculum (${allAttachedItems.length})`}
                  {type === 'MOCK' && `Full Mocks (${bundle.testItems?.length || 0})`}
                  {type === 'CHAPTER' && `Chapter Tests (${bundle.chapterTests?.length || 0})`}
                  {type === 'PYP' && `Past Papers (${bundle.pypTests?.length || 0})`}
                </button>
              ))}
            </div>

            <div className="text-xs text-slate-400 flex items-center space-x-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>TCS iON CBT Interface Bilingual</span>
            </div>
          </div>

          {/* Test Cards List */}
          <div className="grid grid-cols-1 gap-3.5">
            {filteredAttachedItems.map((item, idx) => {
              const isItemPlayable = item.isFreePreview || isPassActive;

              return (
                <div
                  key={item.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border transition-all ${
                    item.isFreePreview
                      ? 'bg-slate-900/90 border-emerald-900/50 hover:border-emerald-500/60 shadow-md'
                      : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black text-slate-400 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                        {item.kind === 'CHAPTER' ? 'Chapter Test' : (item.kind === 'PYP' ? 'PYQ Paper' : `Mock #${idx + 1}`)}
                      </span>

                      {item.isFreePreview ? (
                        <span className="text-[11px] font-black text-emerald-300 bg-emerald-950/60 border border-emerald-700/50 px-2 py-0.5 rounded-full flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>FREE PREVIEW</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-amber-300 bg-amber-950/50 border border-amber-800/40 px-2 py-0.5 rounded-full flex items-center space-x-1">
                          <Crown className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>PRO ACCESS</span>
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-extrabold text-white">
                      {item.title}
                    </h4>

                    {item.titleHindi && (
                      <p className="text-xs font-medium text-slate-400">
                        {item.titleHindi}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 pt-1">
                      <span className="flex items-center space-x-1">
                        <BookOpen className="w-3.5 h-3.5 text-teal-400" />
                        <span>{item.questionCount} Questions</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>{item.durationMinutes} Minutes</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Award className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{item.marks} Total Marks</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0 self-start sm:self-center">
                    {isItemPlayable ? (
                      <button
                        onClick={() => handleStartItemTest(item)}
                        className="px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-900/40 transition flex items-center space-x-2 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-slate-950" />
                        <span>Start Test</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsPassModalOpen(true)}
                        className="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 flex items-center space-x-1.5 transition cursor-pointer"
                      >
                        <Crown className="w-3.5 h-3.5 fill-amber-400" />
                        <span>Unlock with Pass</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: IMPORTANT DATES & TIMELINE                                     */}
      {/* ===================================================================== */}
      {activeTab === 'dates' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-black text-white">
                Official Examination Dates & Schedule Timeline
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Track key official milestones for {bundle.title} including application form dates, admit card release, and target exam day.
            </p>

            {/* Dates Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
              
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 block">Official Notification</span>
                <span className="text-base font-black text-white">{bundle.importantDates?.notificationDate || 'Released'}</span>
                <span className="text-[10px] text-slate-500 block">Gazette Publication</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 block">Application Form Starts</span>
                <span className="text-base font-black text-emerald-400">{bundle.importantDates?.formStartDate || 'Available Online'}</span>
                <span className="text-[10px] text-slate-500 block">Online Registration</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-rose-900/40 space-y-1">
                <span className="text-[11px] font-bold text-rose-300 block">Application Form Last Date</span>
                <span className="text-base font-black text-rose-400">{bundle.importantDates?.formEndDate || 'To Be Announced'}</span>
                <span className="text-[10px] text-rose-500/80 block">Deadline for fee payment</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 block">Correction Window</span>
                <span className="text-base font-black text-slate-200">{bundle.importantDates?.correctionLastDate || 'Post Form Close'}</span>
                <span className="text-[10px] text-slate-500 block">Portal edit window</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 block">Admit Card Release</span>
                <span className="text-base font-black text-indigo-300">{bundle.importantDates?.admitCardDate || '7-10 Days before exam'}</span>
                <span className="text-[10px] text-slate-500 block">Hall ticket download</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/40 space-y-1">
                <span className="text-[11px] font-bold text-emerald-400 block">Target Exam Date</span>
                <span className="text-base font-black text-emerald-300">{bundle.importantDates?.examDate || `${bundle.targetYear}`}</span>
                <span className="text-[10px] text-emerald-500/80 block">CBT / OMR Written Exam</span>
              </div>
            </div>
          </div>

          {/* Official Apply Links Section */}
          {bundle.officialLinks && (
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-900/50 p-6 rounded-3xl space-y-4">
              <h4 className="text-base font-black text-white flex items-center space-x-2">
                <Building className="w-5 h-5 text-indigo-400" />
                <span>Official Authority Links & Downloads</span>
              </h4>

              <div className="flex flex-wrap gap-3">
                {bundle.officialLinks.applyUrl && (
                  <a
                    href={bundle.officialLinks.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center space-x-2 shadow-lg transition"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Apply on Vyapam / CGPSC Portal</span>
                  </a>
                )}

                {bundle.officialLinks.notificationPdfUrl && (
                  <a
                    href={bundle.officialLinks.notificationPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center space-x-2 transition"
                  >
                    <Download className="w-4 h-4 text-blue-400" />
                    <span>Download Notification PDF</span>
                  </a>
                )}

                {bundle.officialLinks.syllabusPdfUrl && (
                  <a
                    href={bundle.officialLinks.syllabusPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center space-x-2 transition"
                  >
                    <Download className="w-4 h-4 text-teal-400" />
                    <span>Download Detailed Syllabus PDF</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: ELIGIBILITY & RULES                                            */}
      {/* ===================================================================== */}
      {activeTab === 'eligibility' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 space-y-6">
            <div className="flex items-center space-x-2">
              <GraduationCap className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-black text-white">
                Cadre Eligibility Criteria & Qualification Standards
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Age Criteria</span>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-black text-white">{bundle.eligibility?.minAge || 21} - {bundle.eligibility?.maxAge || 35} Years</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {bundle.eligibility?.ageRelaxation || 'Standard 5-year age relaxation applies for SC/ST/OBC and women residents of Chhattisgarh.'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Domicile Requirement (मूल निवास)</span>
                <p className="text-sm font-bold text-emerald-400">
                  {bundle.eligibility?.domicile || 'Candidate must be a bonafide resident / domicile holder of Chhattisgarh State.'}
                </p>
                <p className="text-xs text-slate-400">
                  Valid Niwas Praman Patra is strictly verified during counseling.
                </p>
              </div>

              <div className="md:col-span-2 p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Prescribed Educational Qualification</span>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                  {bundle.eligibility?.qualification || 'Relevant degree / diploma from recognized university or board as per official gazette notification.'}
                </p>
              </div>

              {bundle.eligibility?.otherRules && bundle.eligibility.otherRules.length > 0 && (
                <div className="md:col-span-2 space-y-2 pt-2">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Special Verification Rules:</span>
                  <ul className="space-y-2">
                    {bundle.eligibility.otherRules.map((rule, rIdx) => (
                      <li key={rIdx} className="flex items-start space-x-2 text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                        <CheckCheck className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: DETAILED SYLLABUS & MARKS WEIGHTAGE                            */}
      {/* ===================================================================== */}
      {activeTab === 'syllabus' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 p-5 rounded-3xl border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-black text-white">
                Official Syllabus & Subject-Wise Marks Distribution
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Every mock test in this bundle follows the exact official mark weightage distribution outlined below.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Subject selector list */}
            <div className="space-y-2">
              {bundle.syllabusBreakdown.map((sec, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedSyllabusIndex(idx)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition flex items-center justify-between cursor-pointer ${
                    selectedSyllabusIndex === idx
                      ? 'bg-emerald-500/15 border-emerald-500/50 text-white font-bold shadow-md'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <span className="text-xs font-bold block truncate text-white">{sec.subject}</span>
                    <span className="text-[11px] text-slate-400 block truncate">{sec.subjectHindi}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-emerald-400 block">{sec.marks} Marks</span>
                    <span className="text-[10px] text-slate-500 block">{sec.weightagePercentage}% Weight</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Selected subject detailed topics */}
            <div className="md:col-span-2 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4">
              {selectedSyllabusIndex !== null && bundle.syllabusBreakdown[selectedSyllabusIndex] ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <h4 className="text-base sm:text-lg font-black text-white">
                        {bundle.syllabusBreakdown[selectedSyllabusIndex].subject}
                      </h4>
                      <p className="text-xs text-emerald-400 font-medium">
                        {bundle.syllabusBreakdown[selectedSyllabusIndex].subjectHindi}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                      <span className="text-slate-400">Weightage:</span>
                      <strong className="text-white font-black">
                        {bundle.syllabusBreakdown[selectedSyllabusIndex].marks} Marks ({bundle.syllabusBreakdown[selectedSyllabusIndex].questionCount} Qs)
                      </strong>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <span className="text-xs font-bold text-slate-300 block uppercase tracking-wider">
                      Prescribed Syllabus Topics:
                    </span>
                    <ul className="grid grid-cols-1 gap-2.5">
                      {bundle.syllabusBreakdown[selectedSyllabusIndex].topics.map((topic, tIdx) => (
                        <li
                          key={tIdx}
                          className="flex items-start space-x-2 text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                          <span className="leading-relaxed">{topic}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 5: EXAM PATTERN & MARKING SCHEME                                  */}
      {/* ===================================================================== */}
      {activeTab === 'pattern' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-1">
              <span className="text-xs font-semibold text-slate-400 block">Total Questions</span>
              <span className="text-xl font-black text-white">{bundle.examPattern.totalQuestions} Questions</span>
              <p className="text-[11px] text-slate-500">All multiple-choice single correct</p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-1">
              <span className="text-xs font-semibold text-slate-400 block">Maximum Marks</span>
              <span className="text-xl font-black text-emerald-400">{bundle.examPattern.totalMarks} Marks</span>
              <p className="text-[11px] text-slate-500">{bundle.examPattern.markingScheme}</p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-1">
              <span className="text-xs font-semibold text-slate-400 block">Total Duration</span>
              <span className="text-xl font-black text-amber-300">{bundle.examPattern.durationMinutes} Minutes</span>
              <p className="text-[11px] text-slate-500">Live countdown with auto-submit</p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-1">
              <span className="text-xs font-semibold text-slate-400 block">Negative Marking</span>
              <span className="text-xl font-black text-rose-400">{bundle.examPattern.negativeMarkPenalty.split(' ')[0]}</span>
              <p className="text-[11px] text-slate-500">Deducted for incorrect response</p>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-4">
            <h4 className="text-base font-black text-white flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Official Examination Blueprint Guidelines</span>
            </h4>

            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
              {bundle.examPattern.keyRules.map((rule, idx) => (
                <li key={idx} className="flex items-start space-x-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 6: FAQS & CANDIDATE GUIDANCE                                      */}
      {/* ===================================================================== */}
      {activeTab === 'faqs' && (
        <div className="space-y-4">
          {bundle.faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-2"
            >
              <h4 className="text-sm sm:text-base font-extrabold text-white flex items-center space-x-2">
                <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{faq.question}</span>
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 pl-6 leading-relaxed">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ===================================================================== */}
      {/* UNIVERSAL ALL-ACCESS PASS ACTIVATION MODAL                            */}
      {/* ===================================================================== */}
      {isPassModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => {
                setIsPassModalOpen(false);
                setPaymentStep('plan');
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
            >
              ✕
            </button>

            {/* Header */}
            <div>
              <div className="flex items-center space-x-2 text-xs font-semibold text-amber-400 mb-1">
                <Crown className="w-4 h-4 fill-amber-400" />
                <span>Unified All-Access Pass</span>
              </div>
              <h3 className="text-xl font-black text-white">
                Unlock {bundle.title} & ALL Other Exams
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                One pass unlocks this test series plus all CG Teacher, CGPSC, and CG Vyapam bundles.
              </p>
            </div>

            {/* Step: Plan Selection */}
            {paymentStep === 'plan' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Monthly Pass */}
                  <div
                    onClick={() => setSelectedPlan('monthly')}
                    className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between space-y-2 ${
                      selectedPlan === 'monthly'
                        ? 'bg-slate-800/90 border-amber-500 shadow-md'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-black text-sm text-white">Monthly Pass</span>
                      <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded font-bold">30 Days</span>
                    </div>
                    <div className="flex items-baseline space-x-1.5">
                      <span className="text-2xl font-black text-white">₹199</span>
                      <span className="text-xs text-slate-500 line-through">₹299</span>
                    </div>
                    <span className="text-[11px] text-slate-400">Ideal for 30-day revision</span>
                  </div>

                  {/* Yearly Pass */}
                  <div
                    onClick={() => setSelectedPlan('yearly')}
                    className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between space-y-2 relative overflow-hidden ${
                      selectedPlan === 'yearly'
                        ? 'bg-gradient-to-b from-slate-800 via-amber-950/30 to-slate-800 border-amber-500 shadow-lg'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="absolute -top-1 -right-6 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-[9px] px-6 py-0.5 rotate-12 uppercase">
                      50% OFF
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="font-black text-sm text-white">Yearly Pass</span>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold">365 Days</span>
                    </div>
                    <div className="flex items-baseline space-x-1.5">
                      <span className="text-2xl font-black text-white">₹599</span>
                      <span className="text-xs text-slate-500 line-through">₹1199</span>
                    </div>
                    <span className="text-[11px] text-amber-300 font-semibold">Best Value (~₹1.6/day)</span>
                  </div>
                </div>

                <button
                  onClick={() => setPaymentStep('qr')}
                  className="w-full py-3.5 rounded-2xl font-black text-sm bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 shadow-xl shadow-amber-950/40 hover:brightness-110 transition cursor-pointer flex items-center justify-center space-x-2"
                >
                  <Crown className="w-4 h-4 fill-slate-950" />
                  <span>Proceed to UPI Payment (₹{selectedPlan === 'monthly' ? '199' : '599'})</span>
                </button>
              </div>
            )}

            {/* Step: QR & Payment Simulation */}
            {paymentStep === 'qr' && (
              <div className="space-y-4 text-center">
                <div className="p-5 rounded-2xl bg-white text-slate-900 inline-block shadow-inner">
                  <QrCode className="w-44 h-44 mx-auto text-slate-950" />
                  <span className="text-[10px] font-mono text-slate-600 block mt-1">UPI ID: cgexamportal@upi</span>
                </div>

                <div className="flex justify-center space-x-2">
                  {(['phonepe', 'gpay', 'paytm', 'bhim'] as const).map(app => (
                    <button
                      key={app}
                      onClick={() => setActiveUpiApp(app)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition ${
                        activeUpiApp === app ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {app}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    setPaymentStep('processing');
                    setTimeout(() => {
                      activateProPass(selectedPlan);
                      setPaymentStep('success');
                      showToast('🎉 All-Access Pass Activated! All tests unlocked.');
                      if (onEnrollSuccess) onEnrollSuccess(bundle.id);
                    }, 1200);
                  }}
                  className="w-full py-3 rounded-2xl font-black text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition cursor-pointer"
                >
                  Simulate Successful UPI Payment
                </button>
              </div>
            )}

            {paymentStep === 'processing' && (
              <div className="py-12 text-center space-y-3">
                <Loader2 className="w-10 h-10 text-amber-400 animate-spin mx-auto" />
                <p className="text-sm font-bold text-white">Verifying Transaction with Bank Gateway...</p>
              </div>
            )}

            {paymentStep === 'success' && (
              <div className="py-8 text-center space-y-4">
                <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto" />
                <h4 className="text-lg font-black text-white">All Tests & Series Unlocked!</h4>
                <p className="text-xs text-slate-300">You now have unrestricted access to all test series, chapter quizzes, and PYP papers.</p>
                <button
                  onClick={() => {
                    setIsPassModalOpen(false);
                    setPaymentStep('plan');
                  }}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs"
                >
                  Start Practicing Now
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
