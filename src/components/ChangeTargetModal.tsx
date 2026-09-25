import React from 'react';
import {
  Target,
  X,
  Check,
  GraduationCap,
  Award,
  Shield,
  Zap,
  BookOpen,
  Briefcase,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { ExamCategory } from '../types';

export interface TargetExamOption {
  id: string;
  name: string;
  cadreTitle: string;
  description: string;
  vacancies: string;
  authority: string;
  category: ExamCategory | 'ALL';
  subtitle: string;
  icon: React.ElementType;
  badgeColor: string;
}

export const TARGET_EXAM_OPTIONS: TargetExamOption[] = [
  {
    id: 'cg-teacher-2026',
    name: 'CG Teacher 2026',
    cadreTitle: 'CG शिक्षक भर्ती 2026 (All 3 Cadres)',
    description: 'सहायक शिक्षक (कक्षा 1-5), शिक्षक (कक्षा 6-8) एवं व्याख्याता (कक्षा 9-12)। 150 प्रश्न एवं -¼ निगेटिव मार्किंग।',
    vacancies: '5,000+ Posts',
    authority: 'CG Vyapam / DPI',
    category: 'TEACHER_RECRUITMENT',
    subtitle: 'Full practice suite for CG Teacher Recruitment (All 3 Cadres), complete syllabus & subject tests.',
    icon: GraduationCap,
    badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  },
  {
    id: 'cgpsc-pre-2026',
    name: 'CGPSC SSE Prelims 2026',
    cadreTitle: 'CGPSC State Service Prelims 2026',
    description: 'डिप्टी कलेक्टर, डीएसपी, नायब तहसीलदार। Paper 1 GS (छत्तीसगढ़ विशेष) + Paper 2 CSAT (-0.667 निगेटिव मार्किंग)।',
    vacancies: '242+ Posts',
    authority: 'CGPSC',
    category: 'CGPSC',
    subtitle: 'Complete GS Paper 1 & CSAT Paper 2 test series with official -0.667 negative marking.',
    icon: Award,
    badgeColor: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  },
  {
    id: 'cgssb-general-2026',
    name: 'CGSSB Vyapam 2026',
    cadreTitle: 'CGSSB Vyapam (Hostel Warden, Patwari & RI)',
    description: 'छात्रावास अधीक्षक (कंप्यूटर 50 प्रश्न अनिवार्य), पटवारी, राजस्व निरीक्षक (RI), एवं सहायक ग्रेड-3।',
    vacancies: '300+ Posts',
    authority: 'CGSSB / Vyapam',
    category: 'CGSSB',
    subtitle: 'Dedicated mock test bank with Computer 50 Qs mandatory qualifying rules and Vyapam PYPs.',
    icon: Briefcase,
    badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  },
  {
    id: 'cg-police-si-2026',
    name: 'CG Police SI 2026',
    cadreTitle: 'CG Police Sub-Inspector (SI) 2026',
    description: 'सूबेदार, उपनिरीक्षक (SI), एवं प्लाटून कमांडर। 100 प्रश्न (300 अंक), 50 प्रश्न छत्तीसगढ़ सामान्य ज्ञान विशेष।',
    vacancies: '975+ Posts',
    authority: 'CG Police / Vyapam',
    category: 'CGSSB',
    subtitle: '300 Marks mock tests featuring 50 Qs Chhattisgarh GK special section and full syllabus.',
    icon: Shield,
    badgeColor: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  },
  {
    id: 'swami-atmanand-sages',
    name: 'Swami Atmanand (SAGES)',
    cadreTitle: 'Swami Atmanand Excellence Schools',
    description: 'स्वामी आत्मानंद अंग्रेजी एवं हिंदी माध्यम विद्यालय शिक्षक भर्ती एवं संविदा पद।',
    vacancies: 'District Cadre',
    authority: 'Education Dept',
    category: 'SWAMI_ATMANAND',
    subtitle: 'Subject pedagogy, English proficiency, and school curriculum assessment tests.',
    icon: BookOpen,
    badgeColor: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  },
  {
    id: 'central-exams',
    name: 'Central Exams (SSC & RRB)',
    cadreTitle: 'Railway NTPC / SSC CGL / CHSL',
    description: 'रेलवे एनटीपीसी, ग्रुप डी, एसएससी सीजीएल/सीएचएसएल एवं बैंकिंग भर्ती परीक्षाएं।',
    vacancies: 'National Level',
    authority: 'Central Govt',
    category: 'CENTRAL_EXAMS',
    subtitle: 'National CBT pattern simulations, quantitative aptitude, reasoning & English.',
    icon: Zap,
    badgeColor: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  },
];

interface ChangeTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTargetName: string;
  onSelectTarget: (target: TargetExamOption) => void;
}

export const ChangeTargetModal: React.FC<ChangeTargetModalProps> = ({
  isOpen,
  onClose,
  currentTargetName,
  onSelectTarget,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-5 sm:p-6 space-y-5 shadow-2xl relative max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  Change Target Exam
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-slate-700 font-bold">
                  2026 Batch
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Select your primary goal to personalize your dashboard, mock recommendations, and syllabus focus.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Options List (Scrollable) */}
        <div className="overflow-y-auto space-y-2.5 pr-1 flex-1">
          {TARGET_EXAM_OPTIONS.map(opt => {
            const isSelected = opt.name.toLowerCase() === currentTargetName.toLowerCase() ||
              opt.id.toLowerCase() === currentTargetName.toLowerCase();
            const Icon = opt.icon;

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onSelectTarget(opt);
                  onClose();
                }}
                className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 group cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500/10 border-emerald-500/60 ring-1 ring-emerald-500/30 text-white'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950 text-slate-300'
                }`}
              >
                <div className="flex items-start space-x-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${opt.badgeColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="text-sm font-black text-white group-hover:text-emerald-300 transition">
                        {opt.cadreTitle}
                      </span>
                      {isSelected && (
                        <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          <Check className="w-3 h-3" />
                          <span>Current Target</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                      {opt.description}
                    </p>
                    <div className="flex items-center space-x-2 pt-1 text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-400">{opt.authority}</span>
                      <span>•</span>
                      <span className="text-amber-400 font-bold">{opt.vacancies}</span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 pt-1">
                  <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition ${
                    isSelected
                      ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-sm'
                      : 'border-slate-700 group-hover:border-slate-500 text-transparent'
                  }`}>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span className="flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Target can be changed at any time</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
