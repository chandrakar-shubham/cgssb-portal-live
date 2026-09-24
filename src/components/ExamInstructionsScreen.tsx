import React, { useState } from 'react';
import { MockTest } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  Clock,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Bookmark,
  ChevronRight,
  ArrowLeft,
  User,
  Monitor,
  CheckSquare,
  Square,
  Globe,
  History,
  Sparkles,
  Crown
} from 'lucide-react';

interface ExamInstructionsScreenProps {
  test: MockTest;
  onStartExam: (chosenLanguage: 'hi' | 'en') => void;
  onCancel: () => void;
}

export const ExamInstructionsScreen: React.FC<ExamInstructionsScreenProps> = ({
  test,
  onStartExam,
  onCancel,
}) => {
  const { user } = useAuth();
  const { language, setLanguage } = useLanguage();

  // Instruction view language (can be read in Hindi or English)
  const [instructionLang, setInstructionLang] = useState<'hi' | 'en'>('hi');
  
  // Default language for the question paper
  const [defaultPaperLang, setDefaultPaperLang] = useState<'hi' | 'en'>('hi');
  
  // Terms and condition declaration state
  const [hasAgreed, setHasAgreed] = useState(false);

  const durationMin = test.durationMinutes || 120;
  const marksPerQ = test.marksPerQuestion || 1.0;
  const negMarks = test.negativeMarksPerQuestion || (test.category === 'CGPSC' ? 0.67 : 0.33);

  const handleStart = () => {
    if (!hasAgreed) return;
    setLanguage(defaultPaperLang);
    onStartExam(defaultPaperLang);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* TCS iON Candidate Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-slate-950 text-sm shadow-md">
              CG
            </div>
            <div>
              <h1 className="font-extrabold text-base sm:text-lg text-white leading-tight">
                {test.title}
              </h1>
              <div className="flex items-center space-x-2 text-xs text-slate-400 flex-wrap gap-y-1">
                <span className="font-semibold text-emerald-400">{test.category} Examination</span>
                <span>•</span>
                {Boolean(test.isPYP || test.originType === 'pyq' || test.pypYear) ? (
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold border border-amber-500/40 flex items-center space-x-1">
                    <History className="w-3 h-3 text-amber-400" />
                    <span>OFFICIAL PREVIOUS YEAR PAPER {test.pypYear ? `(${test.pypYear})` : ''}</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-bold border border-indigo-500/40 flex items-center space-x-1">
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    <span>FULL MOCK TEST SERIES</span>
                  </span>
                )}
                {test.isPro && (
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold border border-amber-500/40 flex items-center space-x-1">
                    <Crown className="w-3 h-3 fill-amber-400" />
                    <span>PRO PASS</span>
                  </span>
                )}
                <span>•</span>
                <span>Code: {test.id.slice(0, 12)}</span>
              </div>
            </div>
          </div>

          {/* Candidate Profile Box */}
          <div className="flex items-center space-x-3 bg-slate-950/70 border border-slate-800 px-3.5 py-1.5 rounded-xl text-xs">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
              <User className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white">{user?.name || 'Aspirant Candidate'}</div>
              <div className="text-[11px] text-slate-400 flex items-center space-x-2">
                <span>Roll: CG-2026-{user?.id?.slice(-4) || '8841'}</span>
                <span>•</span>
                <span className="text-emerald-400 font-mono">System: C001</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-8 flex flex-col lg:flex-row gap-6">
        
        {/* Left: General Instructions Document */}
        <div className="flex-1 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            
            {/* Instruction Language Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
              <div>
                <h2 className="text-lg font-black text-white flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>
                    {instructionLang === 'hi' ? 'सामान्य अनुदेश (General Instructions)' : 'General Instructions'}
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {instructionLang === 'hi' 
                    ? 'कृपया परीक्षा प्रारंभ करने से पूर्व सभी निर्देशों को ध्यानपूर्वक पढ़ें।'
                    : 'Please read the instructions carefully before starting the exam.'}
                </p>
              </div>

              {/* View Instructions In */}
              <div className="flex items-center space-x-2 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-400">View in:</span>
                <button
                  type="button"
                  onClick={() => setInstructionLang('hi')}
                  className={`px-2 py-0.5 rounded text-xs font-bold transition ${
                    instructionLang === 'hi' 
                      ? 'bg-emerald-500 text-slate-950' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  हिंदी
                </button>
                <button
                  type="button"
                  onClick={() => setInstructionLang('en')}
                  className={`px-2 py-0.5 rounded text-xs font-bold transition ${
                    instructionLang === 'en' 
                      ? 'bg-emerald-500 text-slate-950' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            {/* Instruction Body */}
            {instructionLang === 'hi' ? (
              <div className="space-y-5 text-sm text-slate-300 leading-relaxed max-h-[460px] overflow-y-auto pr-2 custom-scrollbar">
                
                {/* Exam Quick Facts */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 text-xs">
                  <div>
                    <span className="text-slate-400 block">कुल समय (Duration)</span>
                    <span className="font-extrabold text-emerald-400 text-sm">{durationMin} मिनट</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">कुल प्रश्न (Questions)</span>
                    <span className="font-extrabold text-white text-sm">{test.questionCount || 100}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">प्रत्येक सही उत्तर</span>
                    <span className="font-extrabold text-emerald-400 text-sm">+{marksPerQ} अंक</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">नकारात्मक अंक (Penalty)</span>
                    <span className="font-extrabold text-rose-400 text-sm">-{negMarks} अंक (⅓)</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-white text-sm uppercase tracking-wider text-emerald-400">
                    1. सामान्य जानकारी एवं टाइमर नियम:
                  </h3>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-300">
                    <li>स्क्रीन के शीर्ष दाएं कोने पर घड़ी दिखाई देगी जो परीक्षा के शेष समय को दर्शाएगी।</li>
                    <li>निर्धारित समय समाप्त होते ही परीक्षा स्वतः (Auto-Submit) जमा हो जाएगी।</li>
                    <li>किसी भी प्रश्न का उत्तर बदलने के लिए नया विकल्प चुनें या "Clear Response" पर क्लिक करें।</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-white text-sm uppercase tracking-wider text-emerald-400">
                    2. प्रश्न पैलेट रंग संकेत (Question Palette Status):
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center space-x-2.5 p-2 rounded-lg bg-slate-950 border border-slate-800">
                      <div className="w-5 h-5 rounded bg-slate-700 text-white flex items-center justify-center font-bold text-[10px]">
                        01
                      </div>
                      <span>आपने अभी तक प्रश्न नहीं देखा है (Not Visited)</span>
                    </div>
                    <div className="flex items-center space-x-2.5 p-2 rounded-lg bg-slate-950 border border-slate-800">
                      <div className="w-5 h-5 rounded bg-rose-600 text-white flex items-center justify-center font-bold text-[10px]">
                        02
                      </div>
                      <span>आपने प्रश्न का उत्तर नहीं दिया है (Not Answered)</span>
                    </div>
                    <div className="flex items-center space-x-2.5 p-2 rounded-lg bg-slate-950 border border-slate-800">
                      <div className="w-5 h-5 rounded bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">
                        03
                      </div>
                      <span>आपने प्रश्न का उत्तर दे दिया है (Answered)</span>
                    </div>
                    <div className="flex items-center space-x-2.5 p-2 rounded-lg bg-slate-950 border border-slate-800">
                      <div className="w-5 h-5 rounded bg-purple-600 text-white flex items-center justify-center font-bold text-[10px]">
                        04
                      </div>
                      <span>पुनरावलोकन हेतु चिह्नित (Marked for Review)</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs sm:text-sm">
                  <h3 className="font-bold text-white text-sm uppercase tracking-wider text-emerald-400">
                    3. भाषा का चयन (Language Selection):
                  </h3>
                  <p>
                    आप परीक्षा के दौरान भी शीर्ष पट्टी पर दिए गए <strong>"भाषा बदलें (Language Toggle)"</strong> बटन पर क्लिक करके किसी भी समय प्रश्न की भाषा हिंदी से अंग्रेजी अथवा अंग्रेजी से हिंदी में बदल सकते हैं।
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-5 text-sm text-slate-300 leading-relaxed max-h-[460px] overflow-y-auto pr-2 custom-scrollbar">
                
                {/* Exam Quick Facts */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 text-xs">
                  <div>
                    <span className="text-slate-400 block">Total Duration</span>
                    <span className="font-extrabold text-emerald-400 text-sm">{durationMin} Minutes</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Total Questions</span>
                    <span className="font-extrabold text-white text-sm">{test.questionCount || 100}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Marks Per Correct</span>
                    <span className="font-extrabold text-emerald-400 text-sm">+{marksPerQ} Marks</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Negative Marking</span>
                    <span className="font-extrabold text-rose-400 text-sm">-{negMarks} Marks (⅓)</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-white text-sm uppercase tracking-wider text-emerald-400">
                    1. General Information & Timer:
                  </h3>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-300">
                    <li>The countdown timer at the top-right corner of the screen will display remaining time.</li>
                    <li>When the timer reaches zero, the examination will automatically end and submit.</li>
                    <li>To deselect your chosen answer, click on the option again or click "Clear Response".</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-white text-sm uppercase tracking-wider text-emerald-400">
                    2. Question Palette Legend:
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center space-x-2.5 p-2 rounded-lg bg-slate-950 border border-slate-800">
                      <div className="w-5 h-5 rounded bg-slate-700 text-white flex items-center justify-center font-bold text-[10px]">
                        01
                      </div>
                      <span>You have not visited the question yet.</span>
                    </div>
                    <div className="flex items-center space-x-2.5 p-2 rounded-lg bg-slate-950 border border-slate-800">
                      <div className="w-5 h-5 rounded bg-rose-600 text-white flex items-center justify-center font-bold text-[10px]">
                        02
                      </div>
                      <span>You have not answered the question.</span>
                    </div>
                    <div className="flex items-center space-x-2.5 p-2 rounded-lg bg-slate-950 border border-slate-800">
                      <div className="w-5 h-5 rounded bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">
                        03
                      </div>
                      <span>You have answered the question.</span>
                    </div>
                    <div className="flex items-center space-x-2.5 p-2 rounded-lg bg-slate-950 border border-slate-800">
                      <div className="w-5 h-5 rounded bg-purple-600 text-white flex items-center justify-center font-bold text-[10px]">
                        04
                      </div>
                      <span>Marked for Review (will not be evaluated if unanswered).</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs sm:text-sm">
                  <h3 className="font-bold text-white text-sm uppercase tracking-wider text-emerald-400">
                    3. Language Selection & Switching:
                  </h3>
                  <p>
                    You can toggle the language between Hindi and English at any moment during the test using the <strong>Language Selector</strong> in the top header.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Back button */}
          <div className="pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Test Series Portal</span>
            </button>
          </div>
        </div>

        {/* Right: Language Selection, Declaration & Start Button */}
        <div className="w-full lg:w-96 flex flex-col justify-between space-y-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
          <div className="space-y-6">
            
            {/* 1. Default Question Paper Language */}
            <div className="space-y-2.5 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5">
                <Globe className="w-4 h-4 text-emerald-400" />
                <span>Choose Default Language of Paper</span>
              </label>
              <p className="text-[11px] text-slate-400">
                कृपया प्रश्न पत्र की प्राथमिक भाषा चुनें:
              </p>
              
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDefaultPaperLang('hi')}
                  className={`p-3 rounded-xl border text-center font-bold text-xs transition cursor-pointer flex flex-col items-center space-y-1 ${
                    defaultPaperLang === 'hi'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="text-sm font-black">हिंदी (Hindi)</span>
                  <span className="text-[10px] text-slate-400">प्राथमिक माध्यम</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDefaultPaperLang('en')}
                  className={`p-3 rounded-xl border text-center font-bold text-xs transition cursor-pointer flex flex-col items-center space-y-1 ${
                    defaultPaperLang === 'en'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="text-sm font-black">English</span>
                  <span className="text-[10px] text-slate-400">Standard English</span>
                </button>
              </div>

              <div className="text-[10px] text-slate-500 italic pt-1">
                * Note: You can also change the language of any question during the exam.
              </div>
            </div>

            {/* 2. Official Terms & Conditions Checkbox */}
            <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300 block">
                घोषणा / Declaration
              </span>
              
              <label className="flex items-start space-x-3 cursor-pointer group select-none">
                <input
                  type="checkbox"
                  checked={hasAgreed}
                  onChange={e => setHasAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900 bg-slate-900 cursor-pointer"
                />
                <span className="text-xs text-slate-300 leading-snug group-hover:text-white transition">
                  {instructionLang === 'hi' ? (
                    <>
                      मैंने सभी <strong>अनुदेशों को पढ़ व समझ लिया है</strong>। मेरे कंप्यूटर सिस्टम का हार्डवेयर भली-भांति कार्य कर रहा है। मैं सहमत हूँ कि नियमों का उल्लंघन करने पर मुझे परीक्षा से अयोग्य घोषित किया जा सकता है।
                    </>
                  ) : (
                    <>
                      I have <strong>read and understood all instructions</strong>. All computer hardware allocated to me is in proper working condition. I declare that I am not carrying any prohibited devices.
                    </>
                  )}
                </span>
              </label>
            </div>
          </div>

          {/* 3. Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              disabled={!hasAgreed}
              onClick={handleStart}
              className={`w-full py-3.5 px-4 rounded-xl font-black text-sm tracking-wide transition-all shadow-xl flex items-center justify-center space-x-2 cursor-pointer ${
                hasAgreed
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:brightness-110 shadow-emerald-500/20 active:scale-[0.99]'
                  : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
              }`}
            >
              <span>{instructionLang === 'hi' ? 'परीक्षा आरंभ करें (I Am Ready)' : 'I Am Ready to Begin'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            {!hasAgreed && (
              <p className="text-[11px] text-amber-400/90 text-center flex items-center justify-center space-x-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>कृपया आगे बढ़ने के लिए घोषणा पत्र पर टिक करें</span>
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
