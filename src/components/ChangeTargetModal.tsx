import React, { useEffect, useState } from 'react';
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
import { fetchExamPrograms, type ExamProgram } from '../firebase/examCatalogService';

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

export const TARGET_EXAM_OPTIONS: TargetExamOption[] = [];

function legacyCategoryForProgram(program: ExamProgram): ExamCategory | 'ALL' {
  const key = `${program.name} ${program.slug || ''}`.toLowerCase();
  if (key.includes('teacher') || key.includes('shikshak')) return 'TEACHER_RECRUITMENT';
  if (key.includes('cgpsc') || key.includes('state service')) return 'CGPSC';
  if (key.includes('cgssb') || key.includes('vyapam')) return 'CGSSB';
  if (key.includes('atmanand') || key.includes('sages')) return 'SWAMI_ATMANAND';
  if (key.includes('ssc') || key.includes('rail') || key.includes('rrb') || key.includes('bank')) return 'CENTRAL_EXAMS';
  return 'ALL';
}

function iconForProgram(program: ExamProgram): React.ElementType {
  const key = program.name.toLowerCase();
  if (key.includes('teacher') || key.includes('shikshak')) return GraduationCap;
  if (key.includes('police')) return Shield;
  if (key.includes('cgpsc') || key.includes('state service')) return Award;
  if (key.includes('atmanand') || key.includes('sages')) return BookOpen;
  if (key.includes('ssc') || key.includes('rail') || key.includes('rrb')) return Zap;
  return Briefcase;
}

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
  const [programs, setPrograms] = useState<ExamProgram[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    fetchExamPrograms()
      .then(rows => {
        if (!cancelled) {
          setPrograms(rows.filter(program => program.status === 'PUBLISHED')
            .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)));
        }
      })
      .catch(() => { if (!cancelled) setPrograms([]); });
    return () => { cancelled = true; };
  }, [isOpen]);

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
          {programs.map(program => {
            const opt: TargetExamOption = {
              id: program.id,
              name: program.name,
              cadreTitle: program.name,
              description: program.description || 'Published examination program.',
              vacancies: program.totalVacancies ? `${program.totalVacancies} Posts` : 'See official notification',
              authority: 'Official Examination Authority',
              category: legacyCategoryForProgram(program),
              subtitle: program.description || 'Practice tests, syllabus and preparation resources.',
              icon: iconForProgram(program),
              badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
            };
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
