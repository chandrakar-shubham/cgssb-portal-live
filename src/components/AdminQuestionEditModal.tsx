import React, { useState, useEffect } from 'react';
import { Question, DifficultyLevel, ExamCategory, PYQAppearance } from '../types';
import { HIERARCHY_TREE } from '../mockData';
import { ExamHierarchySelector, ExamHierarchyValue } from './ExamHierarchySelector';
import {
  HierarchyRecord,
  mapAuthorityToExamCategory,
} from '../utils/examHierarchy';
import {
  FolderTree,
  Tag,
  BookOpen,
  Sparkles,
  History,
  Plus,
  Trash2,
  RefreshCw,
} from 'lucide-react';

const CG_EXAM_PRESETS = [
  'CGPSC State Service Prelims (Paper-I GS)',
  'CGPSC State Service Prelims (Paper-II CSAT)',
  'CGPSC State Service Mains',
  'CGSSB / CG Vyapam Combined Exam',
  'CGSSB Patwari Examination',
  'CGSSB Revenue Inspector (RI)',
  'CGSSB Mandi Inspector & Sub-Inspector',
  'CGSSB Hostel Warden (Chhatrawas Adhikshak)',
  'CGSSB Rural Agriculture Extension Officer',
  'CG Police Sub-Inspector (SI) Prelims',
  'CG Police Constable Recruitment',
  'CG Forest Guard & Ranger Exam',
  'CG TET (Teacher Eligibility Test) Paper-I',
  'CG TET (Teacher Eligibility Test) Paper-II',
  'Swami Atmanand English Medium Teacher Recruitment',
  'Swami Atmanand Lecturer / Principal Exam',
  'CG Vyapam Labour Inspector',
  'CG Vyapam Apex Bank Recruitment',
];

const RECENT_YEARS = [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010];

const generateUniqueId = (prefix = 'q-cg') => {
  const randomHex = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${Date.now().toString().slice(-4)}-${randomHex}`;
};

export interface AdminQuestionEditModalProps {
  isOpen: boolean;
  editingQuestion: Question | null;
  defaultOrigin?: 'mock' | 'pyq';
  onClose: () => void;
  onSave: (payload: Partial<Question>, editingId?: string) => void;
  existingChapters: string[];
  allHierarchyRecords?: HierarchyRecord[];
}

export const AdminQuestionEditModal: React.FC<AdminQuestionEditModalProps> = ({
  isOpen,
  editingQuestion,
  defaultOrigin = 'mock',
  onClose,
  onSave,
  existingChapters,
  allHierarchyRecords,
}) => {
  const [formData, setFormData] = useState<{
    id: string;
    originType: 'mock' | 'pyq';
    chapter: string;
    subject: string;
    topic: string;
    subtopic: string;
    difficulty: DifficultyLevel;
    authority: string;
    category: ExamCategory;
    subCategory: string;
    postName?: string;
    examName: string;
    questionText: string;
    questionHindi: string;
    options: { id: 'A' | 'B' | 'C' | 'D'; text: string; textHindi: string }[];
    correctOption: 'A' | 'B' | 'C' | 'D';
    marks: number;
    negativeMarks: number;
    explanation: string;
    explanationHindi: string;
    pypAppearances: PYQAppearance[];
    modelKey?: 'A' | 'B' | 'C' | 'D' | '';
    finalAmendedKey?: 'A' | 'B' | 'C' | 'D' | '';
    isCancelled?: boolean;
    imageUrl?: string;
  }>({
    id: '',
    originType: defaultOrigin,
    chapter: '',
    subject: HIERARCHY_TREE[0].subject,
    topic: HIERARCHY_TREE[0].topics[0].name,
    subtopic: HIERARCHY_TREE[0].topics[0].subtopics[0],
    difficulty: 'Medium',
    authority: 'CGSSB',
    category: 'CGSSB',
    subCategory: 'Teacher Recruitment 2026',
    postName: 'CG Lecturer 2026',
    examName: 'CG English Lecturer 2026',
    questionText: '',
    questionHindi: '',
    options: [
      { id: 'A', text: '', textHindi: '' },
      { id: 'B', text: '', textHindi: '' },
      { id: 'C', text: '', textHindi: '' },
      { id: 'D', text: '', textHindi: '' },
    ],
    correctOption: 'A',
    marks: 1.0,
    negativeMarks: 0.333,
    explanation: '',
    explanationHindi: '',
    pypAppearances: [],
    modelKey: '',
    finalAmendedKey: '',
    isCancelled: false,
    imageUrl: '',
  });

  // Re-sync local formData only when modal opens or target question changes
  useEffect(() => {
    if (!isOpen) return;

    if (editingQuestion) {
      let appearances: PYQAppearance[] = [];
      if (editingQuestion.pypAppearances && editingQuestion.pypAppearances.length > 0) {
        appearances = [...editingQuestion.pypAppearances];
      } else if (editingQuestion.pypSource) {
        appearances = [{ examName: editingQuestion.pypSource, year: 2022 }];
      }

      const isPyq = editingQuestion.originType === 'pyq' || appearances.length > 0 || Boolean(editingQuestion.pypSource);

      setFormData({
        id: editingQuestion.id,
        originType: isPyq ? 'pyq' : 'mock',
        chapter: editingQuestion.chapter || editingQuestion.chapterName || '',
        subject: editingQuestion.subject || 'Chhattisgarh General Studies',
        topic: editingQuestion.topic || 'General',
        subtopic: editingQuestion.subtopic || 'General',
        difficulty: editingQuestion.difficulty || 'Medium',
        authority: editingQuestion.authority || (editingQuestion.category as string) || 'CGSSB',
        category: (editingQuestion.category as ExamCategory) || 'CGSSB',
        subCategory: editingQuestion.subCategory || 'Teacher Recruitment 2026',
        postName: editingQuestion.postName || 'CG Lecturer 2026',
        examName: editingQuestion.examName || editingQuestion.pypSource || '',
        questionText: editingQuestion.questionText || editingQuestion.question || '',
        questionHindi: editingQuestion.questionHindi || '',
        options: (editingQuestion.options || []).map((o, idx) => ({
          id: (o.id || o.label || ['A', 'B', 'C', 'D'][idx] || 'A') as 'A' | 'B' | 'C' | 'D',
          text: o.text || '',
          textHindi: o.textHindi || '',
        })),
        correctOption: editingQuestion.correctOption || 'A',
        marks: editingQuestion.marks || 1.0,
        negativeMarks: editingQuestion.negativeMarks || 0.333,
        explanation: editingQuestion.explanation || '',
        explanationHindi: editingQuestion.explanationHindi || '',
        pypAppearances: appearances,
        modelKey: (editingQuestion.modelKey as any) || '',
        finalAmendedKey: (editingQuestion.finalAmendedKey as any) || '',
        isCancelled: Boolean(editingQuestion.isCancelled),
        imageUrl: editingQuestion.imageUrl || '',
      });
    } else {
      setFormData({
        id: generateUniqueId('q-cg'),
        originType: defaultOrigin,
        chapter: '',
        subject: HIERARCHY_TREE[0].subject,
        topic: HIERARCHY_TREE[0].topics[0].name,
        subtopic: HIERARCHY_TREE[0].topics[0].subtopics[0],
        difficulty: 'Medium',
        authority: 'CGSSB',
        category: 'CGSSB',
        subCategory: 'Teacher Recruitment 2026',
        postName: 'CG Lecturer 2026',
        examName: 'CG English Lecturer 2026',
        questionText: '',
        questionHindi: '',
        options: [
          { id: 'A', text: '', textHindi: '' },
          { id: 'B', text: '', textHindi: '' },
          { id: 'C', text: '', textHindi: '' },
          { id: 'D', text: '', textHindi: '' },
        ],
        correctOption: 'A',
        marks: 1.0,
        negativeMarks: 0.333,
        explanation: '',
        explanationHindi: '',
        pypAppearances: defaultOrigin === 'pyq' ? [
          {
            examName: 'CGPSC State Service Prelims (Paper-I GS)',
            year: 2023,
            shift: 'Morning Shift',
          }
        ] : [],
      });
    }
  }, [isOpen, editingQuestion, defaultOrigin]);

  if (!isOpen) return null;

  const currentSubjectObj = HIERARCHY_TREE.find(s => s.subject === formData.subject) || HIERARCHY_TREE[0];
  const currentTopicObj = currentSubjectObj.topics.find(t => t.name === formData.topic) || currentSubjectObj.topics[0];

  const handleHierarchyChange = (val: ExamHierarchyValue) => {
    const nextCat = mapAuthorityToExamCategory(val.authority);
    const matchedRecord = allHierarchyRecords?.find(
      r => r.authority === val.authority && r.category === val.category && r.examName === val.examName
    );

    setFormData(prev => {
      let appearances = prev.pypAppearances;
      if (val.examName) {
        if (appearances.length === 0) {
          appearances = [{ examName: val.examName, year: 2024 }];
        } else if (!appearances.some(a => a.examName === val.examName)) {
          appearances = [{ examName: val.examName, year: 2024 }, ...appearances];
        }
      }

      return {
        ...prev,
        authority: val.authority,
        subCategory: val.category,
        postName: val.postName || matchedRecord?.postName || prev.postName || 'CG Lecturer 2026',
        examName: val.examName,
        category: nextCat,
        negativeMarks: matchedRecord?.negativeMarkingRatio
          ? (matchedRecord.negativeMarkingRatio.includes('0.66') || matchedRecord.negativeMarkingRatio.includes('0.67') ? 0.667 : 0.25)
          : prev.negativeMarks,
        pypAppearances: appearances,
      };
    });
  };

  const handleAddAppearance = () => {
    setFormData(prev => ({
      ...prev,
      pypAppearances: [
        ...prev.pypAppearances,
        {
          examName: 'CGPSC State Service Prelims (Paper-I GS)',
          year: 2023,
          shift: '',
        },
      ],
    }));
  };

  const handleRemoveAppearance = (index: number) => {
    setFormData(prev => ({
      ...prev,
      pypAppearances: prev.pypAppearances.filter((_, i) => i !== index),
    }));
  };

  const handleUpdateAppearance = (index: number, field: keyof PYQAppearance, value: any) => {
    setFormData(prev => {
      const updated = [...prev.pypAppearances];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, pypAppearances: updated };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.questionText.trim()) return;

    const trimmedChapter = formData.chapter.trim();
    const payload: Partial<Question> = {
      ...formData,
      originType: formData.originType,
      id: formData.id.trim() || generateUniqueId('q-cg'),
      authority: formData.authority,
      category: formData.category,
      subCategory: formData.subCategory,
      postName: formData.postName,
      examName: formData.examName,
      chapter: trimmedChapter || undefined,
      chapterName: trimmedChapter || undefined,
      modelKey: (formData.modelKey as any) || undefined,
      finalAmendedKey: (formData.finalAmendedKey as any) || undefined,
      isCancelled: formData.isCancelled,
      imageUrl: formData.imageUrl?.trim() || undefined,
      pypSource: formData.pypAppearances.length > 0
        ? `${formData.pypAppearances[0].examName} ${formData.pypAppearances[0].year}`
        : (formData.examName || ''),
    };

    onSave(payload, editingQuestion?.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-6 shadow-2xl my-8 space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
              <FolderTree className="w-5 h-5 text-emerald-400" />
              <span>{editingQuestion ? 'Edit Question in Bank' : 'Add New Question to Taxonomic Bank'}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure hierarchy, marking rules, unique ID, and all PYQ exam appearances.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs font-bold px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 cursor-pointer"
          >
            ✕ Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Question Origin Classification: Official PYQ vs Mock Practice */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <label className="block text-slate-300 font-bold flex items-center space-x-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-400" />
              <span>Question Origin Classification *</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setFormData({ ...formData, originType: 'pyq' })}
                className={`p-3 rounded-xl border transition cursor-pointer flex items-start space-x-2.5 ${
                  formData.originType === 'pyq'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-amber-500/30'
                }`}
              >
                <History className={`w-4 h-4 mt-0.5 shrink-0 ${formData.originType === 'pyq' ? 'text-amber-400' : 'text-slate-500'}`} />
                <div>
                  <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <span>Official PYQ</span>
                    {formData.originType === 'pyq' && (
                      <span className="text-[9px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.2 rounded">SELECTED</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Sourced directly from official CGPSC or CG Vyapam past year exam papers.
                  </p>
                </div>
              </div>

              <div
                onClick={() => setFormData({ ...formData, originType: 'mock' })}
                className={`p-3 rounded-xl border transition cursor-pointer flex items-start space-x-2.5 ${
                  formData.originType === 'mock'
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/10'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-emerald-500/30'
                }`}
              >
                <Sparkles className={`w-4 h-4 mt-0.5 shrink-0 ${formData.originType === 'mock' ? 'text-emerald-400' : 'text-slate-500'}`} />
                <div>
                  <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <span>Mock Test Series Item</span>
                    {formData.originType === 'mock' && (
                      <span className="text-[9px] bg-emerald-500 text-slate-950 font-black px-1.5 py-0.2 rounded">SELECTED</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Curated practice questions for mock test series, sectionals & chapter tests.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Unique ID & Multi-Level Exam Hierarchy */}
          <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800 space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-300 font-bold">
                  Unique Question ID <span className="text-emerald-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, id: generateUniqueId('q-cg') })}
                  className="text-[10px] text-emerald-400 hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Auto-Generate</span>
                </button>
              </div>
              <input
                type="text"
                required
                value={formData.id}
                onChange={e => setFormData({ ...formData, id: e.target.value })}
                placeholder="e.g. q-cg-1024 or QID-VYAPAM-01"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Exam Hierarchy Selector */}
            <ExamHierarchySelector
              value={{
                authority: formData.authority,
                category: formData.subCategory,
                postName: formData.postName,
                examName: formData.examName,
              }}
              onChange={handleHierarchyChange}
              allRecords={allHierarchyRecords || []}
            />
          </div>

          {/* Taxonomic Hierarchy (Subject -> Topic -> Subtopic) */}
          <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <label className="block text-slate-300 font-bold">
              Taxonomic Hierarchy (Subject → Topic → Subtopic) <span className="text-emerald-400">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-[10px] text-slate-400 mb-0.5 block">1. Subject</span>
                <select
                  value={formData.subject}
                  onChange={e => {
                    const newSubj = e.target.value;
                    const subjObj = HIERARCHY_TREE.find(s => s.subject === newSubj) || HIERARCHY_TREE[0];
                    setFormData({
                      ...formData,
                      subject: newSubj,
                      topic: subjObj.topics[0].name,
                      subtopic: subjObj.topics[0].subtopics[0],
                    });
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                >
                  {HIERARCHY_TREE.map(s => (
                    <option key={s.subject} value={s.subject}>
                      {s.subject}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 mb-0.5 block">2. Topic</span>
                <select
                  value={formData.topic}
                  onChange={e => {
                    const newTopic = e.target.value;
                    const topicObj = currentSubjectObj.topics.find(t => t.name === newTopic) || currentSubjectObj.topics[0];
                    setFormData({
                      ...formData,
                      topic: newTopic,
                      subtopic: topicObj.subtopics[0] || 'General',
                    });
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                >
                  {currentSubjectObj.topics.map(t => (
                    <option key={t.name} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 mb-0.5 block">3. Subtopic</span>
                <select
                  value={formData.subtopic}
                  onChange={e => setFormData({ ...formData, subtopic: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                >
                  {currentTopicObj.subtopics.map(st => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Curriculum Chapter Field */}
          <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-bold flex items-center space-x-1.5">
                <BookOpen className="w-4 h-4 text-purple-400" />
                <span>Curriculum Chapter (पाठ्यक्रम अध्याय)</span>
              </label>
              <span className="text-[11px] text-slate-400 font-normal">Optional curriculum grouping</span>
            </div>
            <div className="relative">
              <input
                type="text"
                list="chapter-suggestions-modal-list"
                value={formData.chapter}
                onChange={e => setFormData({ ...formData, chapter: e.target.value })}
                placeholder="e.g. अध्याय 1: छत्तीसगढ़ का सामान्य परिचय, Chapter 3: Ancient Dynasties..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-purple-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 text-xs"
              />
              <datalist id="chapter-suggestions-modal-list">
                {existingChapters.map(ch => (
                  <option key={ch} value={ch} />
                ))}
              </datalist>
            </div>
            {existingChapters.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-500 font-medium">Existing Chapters:</span>
                {existingChapters.slice(0, 5).map(ch => (
                  <button
                    type="button"
                    key={ch}
                    onClick={() => setFormData({ ...formData, chapter: ch })}
                    className="px-2 py-0.5 rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 text-[10px] font-semibold transition truncate max-w-[200px] cursor-pointer"
                    title={ch}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Difficulty & Marking Scheme */}
          <div className="grid grid-cols-3 gap-3 bg-slate-850 p-3.5 rounded-xl border border-slate-800">
            <div>
              <label className="block text-slate-400 font-bold mb-1">Difficulty Tag</label>
              <select
                value={formData.difficulty}
                onChange={e => setFormData({ ...formData, difficulty: e.target.value as any })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 font-bold mb-1">Positive Marks (+)</label>
              <input
                type="number"
                step="0.5"
                value={formData.marks}
                onChange={e => setFormData({ ...formData, marks: parseFloat(e.target.value) || 1 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-bold mb-1">Negative Penalty (-)</label>
              <input
                type="number"
                step="0.01"
                value={formData.negativeMarks}
                onChange={e => setFormData({ ...formData, negativeMarks: parseFloat(e.target.value) || 0.333 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
              />
            </div>
          </div>

          {/* PYQ Appearances (All Exams and Years Asked) */}
          <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-slate-200 font-bold flex items-center space-x-1.5">
                  <History className="w-4 h-4 text-emerald-400" />
                  <span>PYQ Provenance (Exams & Years Question Was Asked)</span>
                </label>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  If this question appeared in multiple exams over the years, add all appearances below.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddAppearance}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 text-[11px] font-bold flex items-center space-x-1 transition cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add Exam & Year</span>
              </button>
            </div>

            {formData.pypAppearances.length === 0 ? (
              <div className="text-center py-3 border border-dashed border-slate-700 rounded-xl text-slate-400">
                <p>No PYQ appearances specified (this will be marked as a Standard Practice item).</p>
                <button
                  type="button"
                  onClick={handleAddAppearance}
                  className="mt-1 text-emerald-400 hover:underline font-bold text-xs cursor-pointer"
                >
                  + Tag as a Previous Year Question (PYQ)
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {formData.pypAppearances.map((app, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                  >
                    {/* Exam Name Selector / Input */}
                    <div className="sm:col-span-6">
                      <span className="text-[10px] text-slate-400 block mb-0.5">Exam Name</span>
                      <input
                        type="text"
                        list="modal-exam-presets"
                        value={app.examName}
                        onChange={e => handleUpdateAppearance(idx, 'examName', e.target.value)}
                        placeholder="e.g. CGPSC SSE Prelims Paper-I"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs"
                      />
                      <datalist id="modal-exam-presets">
                        {CG_EXAM_PRESETS.map(preset => (
                          <option key={preset} value={preset} />
                        ))}
                      </datalist>
                    </div>

                    {/* Year */}
                    <div className="sm:col-span-3">
                      <span className="text-[10px] text-slate-400 block mb-0.5">Exam Year</span>
                      <select
                        value={app.year}
                        onChange={e => handleUpdateAppearance(idx, 'year', parseInt(e.target.value) || 2024)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-xs font-mono"
                      >
                        {RECENT_YEARS.map(yr => (
                          <option key={yr} value={yr}>
                            {yr}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Shift */}
                    <div className="sm:col-span-2">
                      <span className="text-[10px] text-slate-400 block mb-0.5">Shift / Paper</span>
                      <input
                        type="text"
                        value={app.shift || ''}
                        onChange={e => handleUpdateAppearance(idx, 'shift', e.target.value)}
                        placeholder="e.g. GS Shift 1"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-xs"
                      />
                    </div>

                    {/* Delete Button */}
                    <div className="sm:col-span-1 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveAppearance(idx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950 transition cursor-pointer"
                        title="Remove this appearance"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Question Text (English & Hindi) */}
          <div className="space-y-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Question Text (English) <span className="text-emerald-400">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="Enter standard question statement..."
                value={formData.questionText}
                onChange={e => setFormData({ ...formData, questionText: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Question Text (Hindi Translation - Optional)
              </label>
              <textarea
                rows={3}
                placeholder="प्रश्न का हिंदी विवरण दर्ज करें..."
                value={formData.questionHindi}
                onChange={e => setFormData({ ...formData, questionHindi: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>

            {/* Optional Image / Map Diagram URL */}
            <div className="pt-2 border-t border-slate-800">
              <label className="block text-slate-300 font-bold mb-1 text-xs">
                Question Diagram / Map / Formula Image URL (Optional)
              </label>
              <input
                type="url"
                placeholder="https://example.com/diagram.png or data:image/..."
                value={formData.imageUrl || ''}
                onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
              />
              {formData.imageUrl && (
                <div className="mt-2 p-2 bg-slate-950 border border-slate-800 rounded-xl max-w-xs">
                  <img src={formData.imageUrl} alt="Preview" className="max-h-32 object-contain rounded mx-auto" />
                </div>
              )}
            </div>
          </div>

          {/* Options A, B, C, D */}
          <div className="space-y-2">
            <label className="block text-slate-300 font-bold">Options (A, B, C, D)</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {formData.options.map((opt, i) => (
                <div key={opt.id} className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400">Option {opt.id}</span>
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="modalCorrectOpt"
                        checked={formData.correctOption === opt.id}
                        onChange={() => setFormData({ ...formData, correctOption: opt.id })}
                        className="accent-emerald-500 cursor-pointer"
                      />
                      <span className="text-[10px] text-slate-300 font-bold">Correct Key</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder={`Option ${opt.id} text (English)`}
                    value={opt.text}
                    onChange={e => {
                      const updatedOpts = [...formData.options];
                      updatedOpts[i] = { ...updatedOpts[i], text: e.target.value };
                      setFormData({ ...formData, options: updatedOpts });
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                  />
                  <input
                    type="text"
                    placeholder={`Option ${opt.id} text (Hindi)`}
                    value={opt.textHindi}
                    onChange={e => {
                      const updatedOpts = [...formData.options];
                      updatedOpts[i] = { ...updatedOpts[i], textHindi: e.target.value };
                      setFormData({ ...formData, options: updatedOpts });
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Official Model Key vs Final Amended Key Tracking & Cancellation */}
          <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-slate-200 font-bold text-xs">
                  Official Key Provenance & Amendment Tracking (CGPSC / Vyapam)
                </label>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Track discrepancies between initial model answer keys and final amended keys.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-[11px] text-slate-400 font-bold mb-1">
                  Preliminary Model Key
                </label>
                <select
                  value={formData.modelKey || ''}
                  onChange={e => setFormData({ ...formData, modelKey: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200"
                >
                  <option value="">None / Same as Correct</option>
                  <option value="A">Option A</option>
                  <option value="B">Option B</option>
                  <option value="C">Option C</option>
                  <option value="D">Option D</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 font-bold mb-1">
                  Final Amended Key
                </label>
                <select
                  value={formData.finalAmendedKey || ''}
                  onChange={e => setFormData({ ...formData, finalAmendedKey: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200"
                >
                  <option value="">None / Unchanged</option>
                  <option value="A">Option A</option>
                  <option value="B">Option B</option>
                  <option value="C">Option C</option>
                  <option value="D">Option D</option>
                </select>
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-center space-x-2 text-xs text-purple-300 font-bold cursor-pointer p-2 rounded-xl bg-purple-950/30 border border-purple-500/30">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.isCancelled)}
                    onChange={e => setFormData({ ...formData, isCancelled: e.target.checked })}
                    className="rounded border-purple-500 text-purple-600 focus:ring-0"
                  />
                  <span>Board Cancelled / Disputed (Bonus marks awarded)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Step-by-Step Explanation */}
          <div className="space-y-2">
            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Step-by-Step Explanation & Justification (English)
              </label>
              <textarea
                rows={2}
                placeholder="Provide detailed justification of the right answer..."
                value={formData.explanation}
                onChange={e => setFormData({ ...formData, explanation: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Step-by-Step Explanation (Hindi - Optional)
              </label>
              <textarea
                rows={2}
                placeholder="उत्तर का हिंदी में विस्तृत विश्लेषण..."
                value={formData.explanationHindi}
                onChange={e => setFormData({ ...formData, explanationHindi: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-lg shadow-emerald-500/20 active:scale-95 transition cursor-pointer"
            >
              {editingQuestion ? 'Save Changes' : 'Save Question to Bank'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
