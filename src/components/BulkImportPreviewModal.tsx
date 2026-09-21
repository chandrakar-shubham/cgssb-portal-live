import React, { useState, useMemo } from 'react';
import { BulkImportQuestion, ExamCategory, PreviousYearPaper } from '../types';
import {
  X,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Layers,
  Calendar,
  Clock,
  Trash2,
  Edit3,
  Search,
  Plus,
  Play,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Save,
  Tag,
  Check,
  RotateCcw
} from 'lucide-react';

interface BulkImportPreviewModalProps {
  isOpen: boolean;
  records: BulkImportQuestion[];
  onClose: () => void;
  onConfirm: (
    paperConfig: {
      title: string;
      examCategory: ExamCategory;
      year: number;
      durationMinutes: number;
      marks: number;
      negativeMarkingRatio: string;
      paperSummary: string;
      subjectsWeightage: { subject: string; questionCount: number; percentage: number }[];
    },
    finalQuestions: BulkImportQuestion[]
  ) => void;
  isImporting: boolean;
}

export const BulkImportPreviewModal: React.FC<BulkImportPreviewModalProps> = ({
  isOpen,
  records: initialRecords,
  onClose,
  onConfirm,
  isImporting,
}) => {
  if (!isOpen || initialRecords.length === 0) return null;

  // Active View Tab: 'settings' (Exam Configuration & Live Card Preview) vs 'questions' (All Questions & Editor)
  const [activeTab, setActiveTab] = useState<'settings' | 'questions'>('settings');

  // Detect Initial Exam Meta
  const sampleExam = String(initialRecords[0]?.Examname || 'CGPSC PRE').trim();
  const sampleYear = Number(initialRecords[0]?.Year || 2024);

  const initialCategory: ExamCategory = useMemo(() => {
    const lower = sampleExam.toLowerCase();
    if (lower.includes('psc')) return 'CGPSC';
    if (lower.includes('central') || lower.includes('ssc') || lower.includes('railway') || lower.includes('upsc')) return 'CENTRAL_EXAMS';
    return 'CGSSB';
  }, [sampleExam]);

  // Questions State (with auto-generated unique IDs)
  const [questionsList, setQuestionsList] = useState<BulkImportQuestion[]>(() => {
    const catPrefix = initialCategory === 'CGPSC' ? 'CGPSC' : initialCategory === 'CENTRAL_EXAMS' ? 'CENTRAL' : 'CGSSB';
    return initialRecords.map((item, idx) => {
      const sno = Number(item['S.No.'] || (idx + 1));
      const year = Number(item.Year || sampleYear);
      const generatedUniqueId = item.uniqueQuestionId || `${catPrefix}-${year}-Q${String(sno).padStart(3, '0')}`;
      return {
        ...item,
        'S.No.': sno,
        Year: year,
        Examname: item.Examname || sampleExam,
        uniqueQuestionId: generatedUniqueId,
      };
    });
  });

  // Paper Configuration State
  const [category, setCategory] = useState<ExamCategory>(initialCategory);
  const [examTitle, setExamTitle] = useState<string>(() => {
    if (sampleExam.toUpperCase().includes('CGPSC')) {
      return `CGPSC State Service Prelims Paper-I (General Studies) ${sampleYear}`;
    }
    if (sampleExam.toUpperCase().includes('PATWARI')) {
      return `CGSSB Patwari Official Question Paper ${sampleYear}`;
    }
    return `${sampleExam} Official Solved Paper ${sampleYear}`;
  });
  const [examYear, setExamYear] = useState<number>(sampleYear);
  const [durationMinutes, setDurationMinutes] = useState<number>(initialCategory === 'CGPSC' ? 120 : 180);
  const [negativeMarkingRatio, setNegativeMarkingRatio] = useState<string>(
    initialCategory === 'CGPSC' ? '-⅓rd (0.667 Marks per wrong answer)' : '-⅓rd (0.33 Marks)'
  );
  const [paperSummary, setPaperSummary] = useState<string>(
    `Official past paper simulation containing ${initialRecords.length} bilingual questions, authentic answer keys, and detailed solutions.`
  );

  // Search & Pagination in Questions Tab
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 8;

  // Editing Single Question Modal/Drawer State
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<BulkImportQuestion | null>(null);

  // When Category or Year changes, offer to harmonize unique IDs
  const handleCategoryChange = (newCat: ExamCategory) => {
    setCategory(newCat);
    const catPrefix = newCat === 'CGPSC' ? 'CGPSC' : newCat === 'CENTRAL_EXAMS' ? 'CENTRAL' : 'CGSSB';
    
    // Auto-adjust default duration & negative ratio
    if (newCat === 'CGPSC') {
      setDurationMinutes(120);
      setNegativeMarkingRatio('-⅓rd (0.667 Marks per wrong answer)');
    } else if (newCat === 'CENTRAL_EXAMS') {
      setDurationMinutes(120);
      setNegativeMarkingRatio('-¼th (0.25 / 0.50 Marks)');
    } else {
      setDurationMinutes(180);
      setNegativeMarkingRatio('-⅓rd (0.33 Marks)');
    }

    // Harmonize unique IDs
    setQuestionsList(prev =>
      prev.map(q => {
        const sno = Number(q['S.No.']);
        return {
          ...q,
          uniqueQuestionId: `${catPrefix}-${examYear}-Q${String(sno).padStart(3, '0')}`,
        };
      })
    );
  };

  const handleYearChange = (newYear: number) => {
    setExamYear(newYear);
    const catPrefix = category === 'CGPSC' ? 'CGPSC' : category === 'CENTRAL_EXAMS' ? 'CENTRAL' : 'CGSSB';
    setQuestionsList(prev =>
      prev.map(q => {
        const sno = Number(q['S.No.']);
        return {
          ...q,
          Year: newYear,
          uniqueQuestionId: `${catPrefix}-${newYear}-Q${String(sno).padStart(3, '0')}`,
        };
      })
    );
  };

  // Filtered Questions List for Viewing/Editing
  const filteredQuestions = useMemo(() => {
    if (!searchQuery.trim()) return questionsList;
    const q = searchQuery.toLowerCase();
    return questionsList.filter(item => {
      const qH = String(item['Question(Hindi)'] || '').toLowerCase();
      const qE = String(item['Question(english)'] || '').toLowerCase();
      const uId = String(item.uniqueQuestionId || '').toLowerCase();
      const sno = String(item['S.No.'] || '');
      return qH.includes(q) || qE.includes(q) || uId.includes(q) || sno === q;
    });
  }, [questionsList, searchQuery]);

  const totalPages = Math.ceil(filteredQuestions.length / PAGE_SIZE) || 1;
  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredQuestions.slice(start, start + PAGE_SIZE);
  }, [filteredQuestions, currentPage]);

  // Open Question Edit Modal
  const openEditQuestion = (originalIndex: number) => {
    setEditingIndex(originalIndex);
    setEditFormData({ ...questionsList[originalIndex] });
  };

  const saveEditedQuestion = () => {
    if (editingIndex === null || !editFormData) return;
    setQuestionsList(prev => {
      const next = [...prev];
      next[editingIndex] = editFormData;
      return next;
    });
    setEditingIndex(null);
    setEditFormData(null);
  };

  const deleteQuestion = (indexToDelete: number) => {
    if (window.confirm(`Are you sure you want to remove Question #${questionsList[indexToDelete]['S.No.']} from this paper?`)) {
      setQuestionsList(prev => prev.filter((_, i) => i !== indexToDelete));
    }
  };

  // Dynamic Subject Weightages
  const subjectsWeightage = useMemo(() => {
    const count = questionsList.length;
    if (count === 0) return [];
    if (category === 'CGPSC') {
      return [
        { subject: 'Chhattisgarh General Studies', questionCount: Math.round(count * 0.5), percentage: 50 },
        { subject: 'Indian History & Constitution', questionCount: Math.round(count * 0.25), percentage: 25 },
        { subject: 'Geography, Economy & Current Affairs', questionCount: Math.round(count * 0.25), percentage: 25 },
      ];
    }
    if (category === 'CENTRAL_EXAMS') {
      return [
        { subject: 'General Awareness & GK', questionCount: Math.round(count * 0.4), percentage: 40 },
        { subject: 'Quantitative Aptitude & Reasoning', questionCount: Math.round(count * 0.4), percentage: 40 },
        { subject: 'General English / Comprehension', questionCount: Math.round(count * 0.2), percentage: 20 },
      ];
    }
    return [
      { subject: 'Chhattisgarh Special Knowledge', questionCount: Math.round(count * 0.35), percentage: 35 },
      { subject: 'Quantitative & Reasoning', questionCount: Math.round(count * 0.35), percentage: 35 },
      { subject: 'Computer & Language (Hindi/Chhattisgarhi)', questionCount: Math.round(count * 0.3), percentage: 30 },
    ];
  }, [category, questionsList.length]);

  const marks = category === 'CGPSC' ? questionsList.length * 2 : questionsList.length;

  const handlePublish = () => {
    onConfirm(
      {
        title: examTitle.trim() || `${category} ${examYear} Official Paper`,
        examCategory: category,
        year: examYear,
        durationMinutes,
        marks,
        negativeMarkingRatio,
        paperSummary: paperSummary.trim(),
        subjectsWeightage,
      },
      questionsList
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-6xl shadow-2xl overflow-hidden my-4 sm:my-8 flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800 bg-slate-950/80 gap-3 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  PYP Ingestion & Examination Studio
                </h2>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                  {questionsList.length} Questions
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Review questions, assign unique IDs, configure official exam attributes, and publish directly as a live test.
              </p>
            </div>
          </div>

          {/* Tab Switcher & Close */}
          <div className="flex items-center space-x-2 self-end sm:self-center">
            <div className="bg-slate-800/90 p-1 rounded-xl border border-slate-700/60 flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Live Card & Setup</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('questions')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                  activeTab === 'questions'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>All Questions ({questionsList.length})</span>
              </button>
            </div>

            <button
              onClick={onClose}
              disabled={isImporting}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: SETTINGS & LIVE PREVIEW CARD */}
          {activeTab === 'settings' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Configuration Controls */}
              <div className="lg:col-span-6 space-y-4 bg-slate-950/40 border border-slate-800/80 p-5 rounded-2xl">
                <div className="border-b border-slate-800 pb-2">
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <Tag className="w-4 h-4 text-emerald-400" />
                    <span>Exam Categorization & Attributes</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Categorize the examination into CGPSC, CGSSB, or Central Exam, and set duration & negative marking rules.
                  </p>
                </div>

                {/* 1. Category Selection Pills */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Target Exam Authority / Category <span className="text-rose-400">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleCategoryChange('CGPSC')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center space-y-1 transition cursor-pointer ${
                        category === 'CGPSC'
                          ? 'bg-blue-600/20 border-blue-500 text-blue-300 ring-1 ring-blue-500'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <span className="text-sm font-extrabold">CGPSC</span>
                      <span className="text-[10px] opacity-80">State Service</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCategoryChange('CGSSB')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center space-y-1 transition cursor-pointer ${
                        category === 'CGSSB'
                          ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <span className="text-sm font-extrabold">CGSSB</span>
                      <span className="text-[10px] opacity-80">Vyapam Board</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCategoryChange('CENTRAL_EXAMS')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center space-y-1 transition cursor-pointer ${
                        category === 'CENTRAL_EXAMS'
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 ring-1 ring-indigo-500'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <span className="text-sm font-extrabold">Central Exam</span>
                      <span className="text-[10px] opacity-80">SSC / Railways</span>
                    </button>
                  </div>
                </div>

                {/* 2. Exam Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Official Exam Paper Title <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={examTitle}
                    onChange={e => setExamTitle(e.target.value)}
                    placeholder="e.g. CGPSC State Service Prelims Paper-I 2024"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-semibold"
                  />
                </div>

                {/* 3. Year & Duration */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Exam Year
                    </label>
                    <input
                      type="number"
                      min={2000}
                      max={2030}
                      value={examYear}
                      onChange={e => handleYearChange(Number(e.target.value) || 2024)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Duration (Minutes)
                    </label>
                    <input
                      type="number"
                      min={30}
                      max={360}
                      step={15}
                      value={durationMinutes}
                      onChange={e => setDurationMinutes(Number(e.target.value) || 120)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono font-bold"
                    />
                  </div>
                </div>

                {/* 4. Negative Marking Ratio */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Negative Marking Rule
                  </label>
                  <input
                    type="text"
                    value={negativeMarkingRatio}
                    onChange={e => setNegativeMarkingRatio(e.target.value)}
                    placeholder="e.g. -⅓rd (0.33 Marks)"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-rose-400 focus:outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>

                {/* 5. Paper Summary */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Paper Summary / Description
                  </label>
                  <textarea
                    rows={2}
                    value={paperSummary}
                    onChange={e => setPaperSummary(e.target.value)}
                    placeholder="Describe the paper syllabus, sections, or recruitment drive..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80">
                  <span className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Unique Question IDs auto-harmonized to: <code className="text-emerald-400 font-mono font-bold">{category}-{examYear}-Q###</code></span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('questions')}
                    className="text-emerald-400 hover:text-emerald-300 font-bold underline cursor-pointer text-[11px]"
                  >
                    View & Edit Questions →
                  </button>
                </div>
              </div>

              {/* Right Column: LIVE PREVIEW CARD (EXACTLY AS IN USER'S SCREENSHOT) */}
              <div className="lg:col-span-6 space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Live Preview Card (As seen in PYP Catalog & Live Test)</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono font-semibold">Real-time Reactive</span>
                </div>

                {/* The Exact Card Replica from User Image */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xl ring-1 ring-slate-800/80">
                  <div>
                    {/* Card Top Pill & Exam Year */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-emerald-400 border border-slate-700">
                        {category}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center space-x-1 font-semibold">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Exam Year: {examYear}</span>
                      </span>
                    </div>

                    {/* Card Title */}
                    <h3 className="text-base font-bold text-white leading-snug">
                      {examTitle || 'Official Question Paper'}
                    </h3>

                    {/* Card Summary */}
                    <p className="text-xs text-slate-300 mt-1.5 leading-relaxed line-clamp-3">
                      {paperSummary || 'Actual question paper conducted by official examination board.'}
                    </p>

                    {/* Specs Box: Questions, Duration, Negative */}
                    <div className="mt-4 grid grid-cols-3 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50 text-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Questions</span>
                        <span className="font-bold text-white text-sm">{questionsList.length}</span>
                      </div>
                      <div className="border-x border-slate-700/50">
                        <span className="text-[10px] text-slate-400 block">Duration</span>
                        <span className="font-bold text-emerald-400 text-sm">{durationMinutes}m</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Negative</span>
                        <span className="font-bold text-rose-400 text-xs truncate px-1 block" title={negativeMarkingRatio}>
                          {negativeMarkingRatio}
                        </span>
                      </div>
                    </div>

                    {/* Subject Weightages Breakdown */}
                    <div className="mt-3.5 text-xs space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Subject Weightages
                      </span>
                      {subjectsWeightage.slice(0, 3).map((sw, i) => (
                        <div key={i} className="flex justify-between items-center text-[11px] text-slate-300">
                          <span className="truncate pr-2">{sw.subject}</span>
                          <span className="text-emerald-400 font-mono font-bold shrink-0">{sw.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <button
                      type="button"
                      disabled
                      className="p-2 text-slate-500 rounded-lg text-xs flex items-center space-x-1 cursor-not-allowed opacity-60"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Remove</span>
                    </button>

                    <button
                      type="button"
                      onClick={handlePublish}
                      disabled={isImporting || questionsList.length === 0}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 text-xs font-bold transition flex items-center space-x-1.5 shadow-sm active:scale-95 cursor-pointer"
                    >
                      {isImporting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Publishing...</span>
                        </>
                      ) : (
                        <>
                          <Layers className="w-3.5 h-3.5" />
                          <span>Publish as Mock Test</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-blue-950/25 border border-blue-500/25 rounded-xl text-xs text-blue-300 space-y-1">
                  <div className="font-bold flex items-center space-x-1.5 text-blue-200">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Instant Mock Test Generation Included</span>
                  </div>
                  <p className="text-[11px] text-blue-300/80 leading-relaxed">
                    Clicking "Publish" automatically generates both the Previous Year Paper entry and an interactive Mock Test. Aspirants can click "Give Test" to sit the full exam with timed negative marking right away!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ALL QUESTIONS REVIEW & INLINE/MODAL EDITOR */}
          {activeTab === 'questions' && (
            <div className="space-y-4">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search by question text, Unique ID, or S.No..."
                    className="w-full pl-9 pr-3.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center space-x-3 text-xs text-slate-400">
                  <span>
                    Showing <strong className="text-white">{paginatedQuestions.length}</strong> of{' '}
                    <strong className="text-white">{questionsList.length}</strong> questions
                  </span>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-emerald-400 hover:underline text-[11px]"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              </div>

              {/* Questions Grid/List */}
              <div className="space-y-3">
                {paginatedQuestions.map((qItem, pageIdx) => {
                  const originalIndex = questionsList.findIndex(
                    q => q.uniqueQuestionId === qItem.uniqueQuestionId || q['S.No.'] === qItem['S.No.']
                  );

                  return (
                    <div
                      key={qItem.uniqueQuestionId || pageIdx}
                      className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 space-y-3 hover:border-slate-700 transition"
                    >
                      {/* Top Meta Line: S.No, Unique ID, Exam & Edit Button */}
                      <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-slate-800 text-emerald-400 font-bold text-xs flex items-center justify-center font-mono">
                            {qItem['S.No.']}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[11px] font-bold">
                            {qItem.uniqueQuestionId}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                            {qItem.Examname} ({qItem.Year})
                          </span>

                          {/* Chapter Badge */}
                          <span className="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[10px] font-medium flex items-center space-x-1">
                            <span>अध्याय:</span>
                            <span className="font-semibold">{qItem.chapterName || qItem.chapter || 'Auto-linked'}</span>
                          </span>

                          {/* Repeated indicator if present */}
                          {(qItem.timesRepeated || qItem.repeatedInExams) && (
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold flex items-center space-x-1">
                              <span>🔥 Repeated</span>
                              {qItem.timesRepeated && <span>({qItem.timesRepeated}x)</span>}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => openEditQuestion(originalIndex)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 hover:border-emerald-500/40 text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit Question</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteQuestion(originalIndex)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                            title="Delete question"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Question Text (Hindi & English) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        {qItem['Question(Hindi)'] && (
                          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                              Hindi Question
                            </span>
                            <p className="text-white font-medium leading-relaxed">
                              {qItem['Question(Hindi)']}
                            </p>
                          </div>
                        )}
                        {qItem['Question(english)'] && (
                          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                              English Question
                            </span>
                            <p className="text-slate-300 font-medium leading-relaxed">
                              {qItem['Question(english)']}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Options Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        {(['A', 'B', 'C', 'D'] as const).map(optKey => {
                          const optText = qItem[`option_${optKey}` as keyof BulkImportQuestion];
                          const isCorrect = String(qItem.answer).toUpperCase().trim() === optKey;

                          return (
                            <div
                              key={optKey}
                              className={`p-2 rounded-lg border flex items-start space-x-2 ${
                                isCorrect
                                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-semibold'
                                  : 'bg-slate-900/40 border-slate-800 text-slate-300'
                              }`}
                            >
                              <span
                                className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                                  isCorrect ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {optKey}
                              </span>
                              <span className="truncate">{String(optText || '—')}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      {qItem.explaination && (
                        <div className="bg-slate-900/30 p-2 rounded-lg border border-slate-850 text-[11px] text-slate-400 flex items-start space-x-1.5">
                          <span className="font-bold text-amber-400 shrink-0">Explanation:</span>
                          <span className="line-clamp-2">{qItem.explaination}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-slate-400">
                    Page {currentPage} of {totalPages}
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 flex items-center space-x-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Previous</span>
                    </button>
                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 flex items-center space-x-1"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Bottom Sticky Footer with Publish Action */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 bg-slate-950 border-t border-slate-800 shrink-0">
          <div className="flex items-center space-x-3 text-xs text-slate-400">
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>
                Ready to publish <strong className="text-white">{questionsList.length}</strong> questions under{' '}
                <strong className="text-emerald-400">{category}</strong>
              </span>
            </span>
          </div>

          <div className="flex items-center space-x-3 self-end sm:self-center">
            <button
              type="button"
              onClick={onClose}
              disabled={isImporting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handlePublish}
              disabled={isImporting || questionsList.length === 0}
              className="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 text-slate-950 hover:from-emerald-400 hover:to-teal-300 transition shadow-lg shadow-emerald-500/20 flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing Exam & Mock Test...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Publish PYP Exam & Create Live Test</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* INDIVIDUAL QUESTION EDIT MODAL */}
      {editingIndex !== null && editFormData && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-5 space-y-4 shadow-2xl my-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  Edit Question #{editFormData['S.No.']} ({editFormData.uniqueQuestionId})
                </h3>
              </div>
              <button
                onClick={() => {
                  setEditingIndex(null);
                  setEditFormData(null);
                }}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕ Cancel
              </button>
            </div>

            <div className="space-y-3.5 text-xs max-h-[70vh] overflow-y-auto pr-1">
              {/* S.No. and Unique ID */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">S.No.</label>
                  <input
                    type="number"
                    value={editFormData['S.No.']}
                    onChange={e =>
                      setEditFormData({ ...editFormData, 'S.No.': Number(e.target.value) || 1 })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Unique Question ID</label>
                  <input
                    type="text"
                    value={editFormData.uniqueQuestionId || ''}
                    onChange={e =>
                      setEditFormData({ ...editFormData, uniqueQuestionId: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-emerald-400 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Chapter & Repetition Tracking */}
              <div className="grid grid-cols-2 gap-3 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80">
                <div>
                  <label className="block text-purple-300 font-bold mb-1 flex items-center space-x-1">
                    <span>Chapter / Topic (अध्याय)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. History of Chhattisgarh"
                    value={editFormData.chapterName || editFormData.chapter || ''}
                    onChange={e =>
                      setEditFormData({
                        ...editFormData,
                        chapterName: e.target.value,
                        chapter: e.target.value,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-purple-200 placeholder-slate-600 font-medium"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Leave blank to auto-link via syllabus taxonomy
                  </span>
                </div>
                <div>
                  <label className="block text-amber-300 font-bold mb-1 flex items-center space-x-1">
                    <span>Repeated in Exams (पुनरावृत्ति)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CGPSC 2021, Patwari 2022"
                    value={
                      Array.isArray(editFormData.repeatedInExams)
                        ? editFormData.repeatedInExams.join(', ')
                        : editFormData.repeatedInExams || ''
                    }
                    onChange={e =>
                      setEditFormData({
                        ...editFormData,
                        repeatedInExams: e.target.value,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-amber-200 placeholder-slate-600 font-medium"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Comma-separated list or auto-detected by text
                  </span>
                </div>
              </div>

              {/* Question Hindi */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">Question (Hindi)</label>
                <textarea
                  rows={2}
                  value={editFormData['Question(Hindi)']}
                  onChange={e =>
                    setEditFormData({ ...editFormData, 'Question(Hindi)': e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                />
              </div>

              {/* Question English */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">Question (English)</label>
                <textarea
                  rows={2}
                  value={editFormData['Question(english)']}
                  onChange={e =>
                    setEditFormData({ ...editFormData, 'Question(english)': e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                />
              </div>

              {/* Options A, B, C, D */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Option A</label>
                  <input
                    type="text"
                    value={editFormData.option_A}
                    onChange={e => setEditFormData({ ...editFormData, option_A: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Option B</label>
                  <input
                    type="text"
                    value={editFormData.option_B}
                    onChange={e => setEditFormData({ ...editFormData, option_B: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Option C</label>
                  <input
                    type="text"
                    value={editFormData.option_C}
                    onChange={e => setEditFormData({ ...editFormData, option_C: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Option D</label>
                  <input
                    type="text"
                    value={editFormData.option_D}
                    onChange={e => setEditFormData({ ...editFormData, option_D: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              {/* Correct Answer Radio Selector */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Correct Answer Key
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['A', 'B', 'C', 'D'] as const).map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setEditFormData({ ...editFormData, answer: opt })}
                      className={`p-2 rounded-lg border font-bold text-center transition cursor-pointer ${
                        String(editFormData.answer).toUpperCase().trim() === opt
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 ring-2 ring-emerald-400'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Option {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Explanation */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">Explanation</label>
                <textarea
                  rows={2}
                  value={editFormData.explaination}
                  onChange={e =>
                    setEditFormData({ ...editFormData, explaination: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setEditingIndex(null);
                  setEditFormData(null);
                }}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEditedQuestion}
                className="px-4 py-1.5 rounded-lg text-xs font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 flex items-center space-x-1"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Question</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
