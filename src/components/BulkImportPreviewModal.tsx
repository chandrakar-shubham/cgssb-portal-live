import React, { useState, useMemo } from 'react';
import { Question, ExamCategory, PreviousYearPaper, MockTest, QuestionType } from '../types';
import { ExamHierarchySelector, ExamHierarchyValue } from './ExamHierarchySelector';
import {
  HierarchyRecord,
  mapAuthorityToExamCategory,
  normalizeAuthority,
  extractHierarchyFromApp
} from '../utils/examHierarchy';
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
  RotateCcw,
  BookOpen,
  Briefcase,
  Award,
  ListOrdered,
  ArrowRightLeft,
  FileQuestion,
  HelpCircle,
  Building2,
  FolderTree
} from 'lucide-react';

export interface IngestionPaperConfig {
  paperNature: 'pyp' | 'mock';
  title: string;
  authority: string;
  examCategory: ExamCategory;
  subCategory: string;
  postName?: string;
  examName: string;
  year: number;
  durationMinutes: number;
  marks: number;
  negativeMarkingRatio: string;
  paperSummary: string;
  subjectsWeightage: { subject: string; questionCount: number; percentage: number }[];
  vacancies?: string;
}

interface BulkImportPreviewModalProps {
  isOpen: boolean;
  records: Question[];
  onClose: () => void;
  onConfirm: (
    paperConfig: IngestionPaperConfig,
    finalQuestions: Question[]
  ) => void;
  isImporting: boolean;
  allRecords?: HierarchyRecord[];
  existingTests?: MockTest[];
  existingPYPs?: PreviousYearPaper[];
}

// Common Sub-Category Suggestions
const SUB_CATEGORY_SUGGESTIONS = [
  'Teacher Recruitment 2026',
  'Police Recruitment 2026',
  'Patwari & Revenue Inspector (RI)',
  'State Service Examination (Prelims)',
  'Hostel Warden (छात्रावास अधीक्षक)',
  'Sub-Inspector (CG SI)',
  'Staff Selection Commission (SSC)',
  'Railway Recruitment Board (RRB)',
];

export const BulkImportPreviewModal: React.FC<BulkImportPreviewModalProps> = ({
  isOpen,
  records: initialRecords,
  onClose,
  onConfirm,
  isImporting,
  allRecords = [],
  existingTests = [],
  existingPYPs = [],
}) => {
  if (!isOpen || initialRecords.length === 0) return null;

  // Active View Tab: 'settings' (Exam Configuration & Live Card Preview) vs 'questions' (All Questions & Editor)
  const [activeTab, setActiveTab] = useState<'settings' | 'questions'>('settings');

  // Detect Initial Exam Meta from first question
  const firstQ = initialRecords[0];
  const sampleExam = String(firstQ?.pypSource || firstQ?.examSource || firstQ?.chapter || 'CG Exam').replace(/\s*\(Q\d+\)/, '').trim();
  const sampleYear = Number(firstQ?.pypAppearances?.[0]?.year || new Date().getFullYear());

  // Detect Paper Nature: Mock Test vs PYP
  const initialNature: 'pyp' | 'mock' = useMemo(() => {
    const textToCheck = `${sampleExam} ${firstQ?.id || ''}`.toLowerCase();
    if (textToCheck.includes('mock') || textToCheck.includes('model') || textToCheck.includes('practice') || textToCheck.includes('-m')) {
      return 'mock';
    }
    if ((firstQ?.pypAppearances && firstQ.pypAppearances.length > 0) || textToCheck.includes('pyp') || textToCheck.includes('official') || textToCheck.includes('solved')) {
      return 'pyp';
    }
    return 'mock';
  }, [sampleExam, firstQ]);

  // Detect Initial Authority
  const initialAuthority: string = useMemo(() => {
    if (firstQ?.authority) return firstQ.authority;
    const lower = sampleExam.toLowerCase();
    if (lower.includes('psc')) return 'CGPSC';
    if (lower.includes('central') || lower.includes('ssc') || lower.includes('railway') || lower.includes('upsc')) return 'CENTRAL_EXAMS';
    if (lower.includes('police')) return 'CG Police';
    return 'CGSSB';
  }, [sampleExam, firstQ]);

  const initialCategory: ExamCategory = useMemo(() => {
    return mapAuthorityToExamCategory(initialAuthority);
  }, [initialAuthority]);

  // Detect Initial Sub-Category
  const initialSubCategory = useMemo(() => {
    const lower = sampleExam.toLowerCase();
    if (lower.includes('lecturer') || lower.includes('teacher') || lower.includes('shikshak') || lower.includes('vyakhyata')) {
      return 'Teacher Recruitment 2026';
    }
    if (lower.includes('police') || lower.includes('si') || lower.includes('sub-inspector') || lower.includes('constable')) {
      return 'Police Recruitment 2026';
    }
    if (lower.includes('patwari') || lower.includes('ri') || lower.includes('revenue')) {
      return 'Patwari & Revenue Inspector (RI)';
    }
    if (lower.includes('hostel') || lower.includes('warden')) {
      return 'Hostel Warden (छात्रावास अधीक्षक)';
    }
    if (lower.includes('state service') || lower.includes('prelims') || lower.includes('pre')) {
      return 'State Service Examination (Prelims)';
    }
    return 'Teacher Recruitment 2026';
  }, [sampleExam]);

  // Ingestion Configuration State
  const [paperNature, setPaperNature] = useState<'pyp' | 'mock'>(initialNature);
  const [authority, setAuthority] = useState<string>(initialAuthority);
  const [category, setCategory] = useState<ExamCategory>(initialCategory);
  const [subCategory, setSubCategory] = useState<string>(initialSubCategory);
  const [postName, setPostName] = useState<string>(() => {
    const lower = sampleExam.toLowerCase();
    if (lower.includes('lecturer') || lower.includes('vyakhyata')) return 'CG Lecturer 2026';
    if (lower.includes('assistant') || lower.includes('sahayak')) return 'CG Assistant Teacher 2026';
    if (lower.includes('teacher') || lower.includes('shikshak')) return 'CG Teacher 2026';
    return 'CG Lecturer 2026';
  });
  const [vacancies, setVacancies] = useState<string>('');

  const [examTitle, setExamTitle] = useState<string>(() => {
    if (sampleExam && sampleExam !== 'CG Exam') return sampleExam;
    return `${authority} Solved Paper ${sampleYear}`;
  });
  const [examYear, setExamYear] = useState<number>(sampleYear);
  const [durationMinutes, setDurationMinutes] = useState<number>(() => {
    if (firstQ?.idealTimeSeconds && firstQ.idealTimeSeconds > 0) {
      return Math.round((initialRecords.length * firstQ.idealTimeSeconds) / 60) || 120;
    }
    return initialCategory === 'CGPSC' ? 120 : 120;
  });
  const [negativeMarkingRatio, setNegativeMarkingRatio] = useState<string>(() => {
    if (firstQ?.negativeMarks) {
      return `-${firstQ.negativeMarks} Marks per wrong answer`;
    }
    return initialCategory === 'CGPSC' ? '-⅓rd (0.667 Marks per wrong answer)' : '-¼th (0.25 Marks per wrong answer)';
  });
  const [paperSummary, setPaperSummary] = useState<string>(
    `${paperNature === 'mock' ? 'High-yield mock simulation test' : 'Official past paper simulation'} containing ${initialRecords.length} questions, authentic answer keys, and detailed bilingual solutions.`
  );

  // Compute available hierarchy records across existing database and imported questions
  const computedHierarchyRecords = useMemo(() => {
    if (allRecords && allRecords.length > 0) return allRecords;
    return extractHierarchyFromApp(existingTests, existingPYPs, initialRecords);
  }, [allRecords, existingTests, existingPYPs, initialRecords]);

  // Handle Multi-level hierarchy change with auto-population
  const handleHierarchyChange = (newVal: ExamHierarchyValue, matchedRecord?: HierarchyRecord) => {
    setAuthority(newVal.authority);
    setSubCategory(newVal.category);
    if (newVal.postName) setPostName(newVal.postName);
    setExamTitle(newVal.examName);

    const mappedCat = mapAuthorityToExamCategory(newVal.authority);
    setCategory(mappedCat);

    // Auto-populate parameters if user matched an existing registered record
    if (matchedRecord) {
      if (matchedRecord.postName) setPostName(matchedRecord.postName);
      if (matchedRecord.year) setExamYear(matchedRecord.year);
      if (matchedRecord.durationMinutes) setDurationMinutes(matchedRecord.durationMinutes);
      if (matchedRecord.negativeMarkingRatio) setNegativeMarkingRatio(matchedRecord.negativeMarkingRatio);
      if (matchedRecord.vacancies) setVacancies(matchedRecord.vacancies);
      if (matchedRecord.paperSummary) setPaperSummary(matchedRecord.paperSummary);
    }
  };

  // Questions State
  const [questionsList, setQuestionsList] = useState<Question[]>(initialRecords);

  // Search & Pagination in Questions Tab
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 8;

  // Editing Single Question Modal/Drawer State
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<Question | null>(null);

  // Filtered Questions List for Viewing/Editing
  const filteredQuestions = useMemo(() => {
    if (!searchQuery.trim()) return questionsList;
    const q = searchQuery.toLowerCase();
    return questionsList.filter(item => {
      const qH = String(item.questionHindi || '').toLowerCase();
      const qE = String(item.questionText || item.question || '').toLowerCase();
      const uId = String(item.id || item.uniqueQuestionId || '').toLowerCase();
      const topic = String(item.topic || '').toLowerCase();
      const ch = String(item.chapter || item.chapterName || '').toLowerCase();
      return qH.includes(q) || qE.includes(q) || uId.includes(q) || topic.includes(q) || ch.includes(q);
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
    if (window.confirm(`Are you sure you want to remove Question #${indexToDelete + 1} (${questionsList[indexToDelete].id}) from this paper?`)) {
      setQuestionsList(prev => prev.filter((_, i) => i !== indexToDelete));
    }
  };

  // Dynamic Subject Weightages
  const subjectsWeightage = useMemo(() => {
    const count = questionsList.length;
    if (count === 0) return [];

    const map: Record<string, number> = {};
    questionsList.forEach(q => {
      const subj = q.subject || 'General Studies';
      map[subj] = (map[subj] || 0) + 1;
    });

    return Object.entries(map)
      .map(([subject, qCount]) => ({
        subject,
        questionCount: qCount,
        percentage: Math.round((qCount / count) * 100),
      }))
      .sort((a, b) => b.questionCount - a.questionCount);
  }, [questionsList]);

  const marks = category === 'CGPSC' ? questionsList.length * 2 : questionsList.length;

  const handlePublish = () => {
    const taggedQuestions = questionsList.map(q => ({
      ...q,
      authority,
      subCategory: subCategory.trim() || 'Teacher Recruitment 2026',
      postName: postName.trim() || 'CG Lecturer 2026',
      examName: examTitle.trim() || `${authority} ${subCategory} Exam`,
      year: examYear,
    }));

    onConfirm(
      {
        paperNature,
        title: examTitle.trim() || `${authority} ${subCategory} Exam`,
        authority,
        examCategory: category,
        subCategory: subCategory.trim() || 'Teacher Recruitment 2026',
        postName: postName.trim() || 'CG Lecturer 2026',
        examName: examTitle.trim() || `${authority} ${subCategory} Exam`,
        year: examYear,
        durationMinutes,
        marks,
        negativeMarkingRatio,
        paperSummary: paperSummary.trim(),
        subjectsWeightage,
        vacancies: vacancies.trim() || undefined,
      },
      taggedQuestions
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-6xl shadow-2xl overflow-hidden my-4 sm:my-8 flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800 bg-slate-950/80 gap-3 shrink-0">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl border ${paperNature === 'mock' ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Exam & Test Series Ingestion Studio
                </h2>
                <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${paperNature === 'mock' ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'}`}>
                  {questionsList.length} Questions Loaded
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {paperNature === 'mock' ? '🎯 Mock Series' : '📜 Official PYP'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Classify paper, select recruitment authority & sub-category, verify questions, and publish as a live interactive test.
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
                    <span>Exam Categorization & Hierarchy</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Select paper nature, recruitment drive, authority, and official exam parameters.
                  </p>
                </div>

                {/* 1. Paper Nature: Mock Test vs PYP */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    1. Paper Nature (प्रकृति) <span className="text-rose-400">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPaperNature('mock');
                        setPaperSummary(`High-yield mock simulation test containing ${questionsList.length} questions, authentic answer keys, and detailed bilingual solutions.`);
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition cursor-pointer ${
                        paperNature === 'mock'
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 ring-1 ring-cyan-400 shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span>🎯 Mock Test (Test Series)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPaperNature('pyp');
                        setPaperSummary(`Official past paper simulation containing ${questionsList.length} questions, authentic answer keys, and detailed bilingual solutions.`);
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition cursor-pointer ${
                        paperNature === 'pyp'
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200 ring-1 ring-emerald-400 shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <Award className="w-4 h-4 text-emerald-400" />
                      <span>📜 Official PYP (Past Exam)</span>
                    </button>
                  </div>
                </div>

                {/* 2. Multi-Level Exam Hierarchy (Authority > Category > Exam Name) */}
                <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                      <Tag className="w-3.5 h-3.5 text-emerald-400" />
                      <span>2. Exam Hierarchy (Authority &gt; Drive &gt; Cadre &gt; Specific Exam)</span>
                    </label>
                    <span className="text-[10px] text-slate-400">Searchable dropdowns with auto-population</span>
                  </div>

                  <ExamHierarchySelector
                    value={{
                      authority,
                      category: subCategory,
                      postName,
                      examName: examTitle,
                    }}
                    onChange={handleHierarchyChange}
                    allRecords={computedHierarchyRecords}
                  />
                </div>

                {/* 5. Year, Duration & Vacancies */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Exam Year
                    </label>
                    <input
                      type="number"
                      min={2000}
                      max={2030}
                      value={examYear}
                      onChange={e => setExamYear(Number(e.target.value) || 2026)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Duration (Mins)
                    </label>
                    <input
                      type="number"
                      min={30}
                      max={360}
                      step={15}
                      value={durationMinutes}
                      onChange={e => setDurationMinutes(Number(e.target.value) || 120)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Vacancies (Optional)
                    </label>
                    <input
                      type="text"
                      value={vacancies}
                      onChange={e => setVacancies(e.target.value)}
                      placeholder="e.g. 252 Posts"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-emerald-400 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>
                </div>

                {/* 6. Negative Marking Ratio */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Negative Marking Rule
                  </label>
                  <input
                    type="text"
                    value={negativeMarkingRatio}
                    onChange={e => setNegativeMarkingRatio(e.target.value)}
                    placeholder="e.g. -0.25 (¼th per wrong answer)"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-rose-400 focus:outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>

                {/* 7. Paper Summary */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Paper Summary / Description
                  </label>
                  <textarea
                    rows={2}
                    value={paperSummary}
                    onChange={e => setPaperSummary(e.target.value)}
                    placeholder="Describe syllabus, topics covered, or target recruitment drive..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Right Column: LIVE PREVIEW CARD */}
              <div className="lg:col-span-6 space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Live Preview Card (As seen in Live Test Catalog)</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono font-semibold">Real-time Reactive</span>
                </div>

                {/* The Reactive Card Replica */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xl ring-1 ring-slate-800/80">
                  <div>
                    {/* Card Top Badges */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-1.5">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${paperNature === 'mock' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}`}>
                          {paperNature === 'mock' ? '🎯 MOCK TEST' : '📜 OFFICIAL PYP'}
                        </span>
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {authority || category}
                        </span>
                        {subCategory && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-purple-500/10 text-purple-300 border border-purple-500/30">
                            {subCategory}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 flex items-center space-x-1 font-semibold">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Year: {examYear}</span>
                      </span>
                    </div>

                    {/* Card Title */}
                    <h3 className="text-base font-bold text-white leading-snug">
                      {examTitle || 'Exam Simulation Paper'}
                    </h3>

                    {vacancies && (
                      <p className="text-xs text-emerald-400 font-bold mt-1 flex items-center space-x-1">
                        <Briefcase className="w-3.5 h-3.5" />
                        <span>Total Announced Posts: {vacancies}</span>
                      </p>
                    )}

                    {/* Card Summary */}
                    <p className="text-xs text-slate-300 mt-1.5 leading-relaxed line-clamp-3">
                      {paperSummary || 'Actual practice questions conducted by official examination board.'}
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
                        Detected Subject Weightages
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
                      onClick={() => setActiveTab('questions')}
                      className="text-xs text-slate-400 hover:text-white transition flex items-center space-x-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Review & Edit All {questionsList.length} Questions</span>
                    </button>

                    <button
                      type="button"
                      onClick={handlePublish}
                      disabled={isImporting || questionsList.length === 0}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm active:scale-95 cursor-pointer ${
                        paperNature === 'mock'
                          ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                      }`}
                    >
                      {isImporting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Publishing...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-slate-950" />
                          <span>Publish {paperNature === 'mock' ? 'Mock Test' : 'Official PYP'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-blue-950/25 border border-blue-500/25 rounded-xl text-xs text-blue-300 space-y-1">
                  <div className="font-bold flex items-center space-x-1.5 text-blue-200">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Instant Live Test Creation Included</span>
                  </div>
                  <p className="text-[11px] text-blue-300/80 leading-relaxed">
                    Publishing registers all {questionsList.length} questions in the Question Bank, generates the exam catalog card under <strong>{subCategory}</strong>, and enables full interactive test taking with instant scoring and negative marking.
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
                    placeholder="Search by question text, Unique ID, or chapter..."
                    className="w-full pl-9 pr-3.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center space-x-3 text-xs text-slate-400">
                  <span>
                    Showing <strong className="text-emerald-400 font-bold">{paginatedQuestions.length}</strong> of {filteredQuestions.length} questions
                  </span>
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="text-rose-400 hover:underline text-xs"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              </div>

              {/* Questions Grid/List */}
              <div className="space-y-3">
                {paginatedQuestions.map((qItem, pageIdx) => {
                  const originalIndex = questionsList.findIndex(q => q.id === qItem.id);
                  const qType: QuestionType = qItem.questionType || qItem.type || 'mcq';
                  const isMatching = qType === 'matching' || (Array.isArray(qItem.columnA) && qItem.columnA.length > 0);
                  const isAssertionReason = qType === 'assertion_reason' || Boolean(qItem.assertion);
                  const isMultiStatement = qType === 'multi_statement' || (Array.isArray(qItem.statements) && qItem.statements.length > 0);

                  const stemEnglish = qItem.question || qItem.questionText || qItem.text || '';
                  const stemHindi = qItem.questionHindi || '';
                  const showHindi = stemHindi && stemHindi.trim() !== stemEnglish.trim();

                  return (
                    <div
                      key={qItem.id || pageIdx}
                      className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3 hover:border-slate-750 transition"
                    >
                      {/* Top Meta Line: S.No, Unique ID, Exam & Edit Button */}
                      <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-slate-800 text-emerald-400 font-bold text-xs flex items-center justify-center font-mono">
                            {(currentPage - 1) * PAGE_SIZE + pageIdx + 1}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[11px] font-bold">
                            {qItem.id}
                          </span>

                          {/* Question Type Badge */}
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            isMatching
                              ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                              : isAssertionReason
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              : isMultiStatement
                              ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}>
                            {isMatching ? 'Matching List' : isAssertionReason ? 'Assertion-Reason' : isMultiStatement ? 'Multi-Statement' : 'MCQ'}
                          </span>

                          {/* Subject & Chapter Badge */}
                          <span className="px-2 py-0.5 rounded bg-slate-850 border border-slate-750 text-slate-300 text-[10px] font-medium">
                            {qItem.subject}
                          </span>
                          {(qItem.chapter || qItem.chapterName) && (
                            <span className="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[10px] font-medium hidden sm:inline">
                              {qItem.chapter || qItem.chapterName}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => openEditQuestion(originalIndex)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-emerald-400 border border-slate-700 hover:border-emerald-500/40 text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit Question</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteQuestion(originalIndex)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                            title="Delete question"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Question Stem */}
                      <div className="space-y-1.5 text-xs sm:text-sm">
                        {stemEnglish && (
                          <p className="text-white font-medium leading-relaxed">
                            {stemEnglish}
                          </p>
                        )}
                        {showHindi && (
                          <p className="text-emerald-300/90 font-medium leading-relaxed border-l-2 border-emerald-500/40 pl-3 py-0.5 text-xs">
                            {stemHindi}
                          </p>
                        )}
                      </div>

                      {/* MATCHING LIST DISPLAY (Column A & Column B) */}
                      {isMatching && Array.isArray(qItem.columnA) && Array.isArray(qItem.columnB) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-900/80 border border-purple-500/30 my-2">
                          {/* Column A */}
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider block border-b border-purple-500/20 pb-1">
                              Column I (सूची-I)
                            </span>
                            {qItem.columnA.map((item, idx) => (
                              <div key={idx} className="flex items-start space-x-2 text-xs text-slate-200">
                                <span className="w-5 h-5 rounded bg-purple-500/20 text-purple-300 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                                  {item.id || idx + 1}
                                </span>
                                <span>{item.text || item.textHindi || String(item)}</span>
                              </div>
                            ))}
                          </div>

                          {/* Column B */}
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider block border-b border-purple-500/20 pb-1">
                              Column II (सूची-II)
                            </span>
                            {qItem.columnB.map((item, idx) => (
                              <div key={idx} className="flex items-start space-x-2 text-xs text-slate-200">
                                <span className="w-5 h-5 rounded bg-purple-500/20 text-purple-300 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                                  {item.id || String.fromCharCode(65 + idx)}
                                </span>
                                <span>{item.text || item.textHindi || String(item)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ASSERTION & REASON DISPLAY */}
                      {isAssertionReason && (qItem.assertion || qItem.reason) && (
                        <div className="space-y-2 p-3 rounded-xl bg-slate-900/80 border border-amber-500/30 my-2 text-xs">
                          {qItem.assertion && (
                            <div className="flex items-start space-x-2.5">
                              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-black text-[10px] shrink-0 mt-0.5 border border-amber-500/40">
                                Assertion (A)
                              </span>
                              <div className="text-slate-100 font-medium leading-relaxed">
                                {qItem.assertion}
                                {qItem.assertionHindi && qItem.assertionHindi !== qItem.assertion && (
                                  <div className="text-emerald-300/80 text-[11px] mt-0.5">{qItem.assertionHindi}</div>
                                )}
                              </div>
                            </div>
                          )}
                          {qItem.reason && (
                            <div className="flex items-start space-x-2.5 pt-1.5 border-t border-slate-800">
                              <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-black text-[10px] shrink-0 mt-0.5 border border-cyan-500/40">
                                Reason (R)
                              </span>
                              <div className="text-slate-100 font-medium leading-relaxed">
                                {qItem.reason}
                                {qItem.reasonHindi && qItem.reasonHindi !== qItem.reason && (
                                  <div className="text-emerald-300/80 text-[11px] mt-0.5">{qItem.reasonHindi}</div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* MULTI-STATEMENT DISPLAY */}
                      {isMultiStatement && Array.isArray(qItem.statements) && qItem.statements.length > 0 && (
                        <div className="space-y-2 p-3 rounded-xl bg-slate-900/80 border border-sky-500/30 my-2 text-xs">
                          <span className="text-[10px] font-bold text-sky-300 uppercase tracking-wider block border-b border-sky-500/20 pb-1">
                            Statements (कथन)
                          </span>
                          <div className="space-y-2">
                            {qItem.statements.map((stmt, sIdx) => (
                              <div key={sIdx} className="flex items-start space-x-2 text-slate-200">
                                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                  {stmt.id || sIdx + 1}
                                </span>
                                <div>
                                  <p>{stmt.text || (typeof stmt === 'string' ? stmt : '')}</p>
                                  {stmt.textHindi && stmt.textHindi !== stmt.text && (
                                    <p className="text-emerald-300/80 text-[11px] mt-0.5">{stmt.textHindi}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Options Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs pt-1">
                        {qItem.options.map(opt => {
                          const optKey = opt.label || opt.id || '';
                          const isCorrect = String(qItem.correctOption || qItem.correctAnswer).toUpperCase().trim() === String(optKey).toUpperCase().trim();

                          return (
                            <div
                              key={optKey}
                              className={`p-2.5 rounded-xl border flex items-start space-x-2 transition ${
                                isCorrect
                                  ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200 font-semibold shadow-sm'
                                  : 'bg-slate-900/50 border-slate-800 text-slate-300'
                              }`}
                            >
                              <span
                                className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                                  isCorrect ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-400 border border-slate-700'
                                }`}
                              >
                                {optKey}
                              </span>
                              <div className="overflow-hidden">
                                <span className="truncate block font-medium">{opt.text}</span>
                                {opt.textHindi && opt.textHindi !== opt.text && (
                                  <span className="text-[10px] text-slate-400 truncate block mt-0.5">{opt.textHindi}</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      {(qItem.explanation || qItem.explanationHindi) && (
                        <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/80 text-[11px] text-slate-300 space-y-1">
                          <span className="font-bold text-amber-400 block text-[10px] uppercase tracking-wider">
                            Step-by-step Solution:
                          </span>
                          {qItem.explanation && <p>{qItem.explanation}</p>}
                          {qItem.explanationHindi && qItem.explanationHindi !== qItem.explanation && (
                            <p className="text-emerald-300/80 text-[11px] pt-1 border-t border-slate-800/60 mt-1">
                              {qItem.explanationHindi}
                            </p>
                          )}
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
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-750 flex items-center space-x-1 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Previous</span>
                    </button>
                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-750 flex items-center space-x-1 cursor-pointer"
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
                <strong className="text-emerald-400">{category}</strong> › <strong className="text-purple-400">{subCategory}</strong> as{' '}
                <strong className={paperNature === 'mock' ? 'text-cyan-400' : 'text-emerald-400'}>
                  {paperNature === 'mock' ? 'Mock Test' : 'Official PYP'}
                </strong>
              </span>
            </span>
          </div>

          <div className="flex items-center space-x-3 self-end sm:self-center">
            <button
              type="button"
              onClick={onClose}
              disabled={isImporting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-750 transition cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handlePublish}
              disabled={isImporting || questionsList.length === 0}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition shadow-lg flex items-center space-x-2 cursor-pointer disabled:opacity-50 ${
                paperNature === 'mock'
                  ? 'bg-gradient-to-r from-cyan-500 via-teal-500 to-cyan-400 text-slate-950 hover:from-cyan-400 hover:to-teal-300 shadow-cyan-500/20'
                  : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 text-slate-950 hover:from-emerald-400 hover:to-teal-300 shadow-emerald-500/20'
              }`}
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing Exam & Test Series...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Publish {paperNature === 'mock' ? 'Mock Test' : 'PYP Exam'} & Create Live Test</span>
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
                  Edit Question ({editFormData.id})
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
              {/* Question Type and Unique ID */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Question Type</label>
                  <select
                    value={editFormData.questionType || editFormData.type || 'mcq'}
                    onChange={e =>
                      setEditFormData({ ...editFormData, questionType: e.target.value as QuestionType, type: e.target.value as QuestionType })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-semibold"
                  >
                    <option value="mcq">Standard MCQ</option>
                    <option value="matching">Matching List (Column A & B)</option>
                    <option value="assertion_reason">Assertion - Reason</option>
                    <option value="multi_statement">Multi-Statement</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Unique Question ID</label>
                  <input
                    type="text"
                    value={editFormData.id || ''}
                    onChange={e =>
                      setEditFormData({ ...editFormData, id: e.target.value, uniqueQuestionId: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-emerald-400 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Question English */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">Question Stem (English)</label>
                <textarea
                  rows={2}
                  value={editFormData.questionText || editFormData.question || ''}
                  onChange={e =>
                    setEditFormData({ ...editFormData, questionText: e.target.value, question: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                />
              </div>

              {/* Question Hindi */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">Question Stem (Hindi)</label>
                <textarea
                  rows={2}
                  value={editFormData.questionHindi || ''}
                  onChange={e =>
                    setEditFormData({ ...editFormData, questionHindi: e.target.value })
                  }
                  placeholder="Optional Hindi translation of the question stem..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                />
              </div>

              {/* Options A, B, C, D */}
              <div className="space-y-2">
                <label className="block text-slate-300 font-bold">Options (विकल्प)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {editFormData.options.map((opt, optIdx) => (
                    <div key={optIdx} className="bg-slate-950 p-2 rounded-lg border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-400 font-mono text-[11px]">Option {opt.label || opt.id}</span>
                      </div>
                      <input
                        type="text"
                        value={opt.text}
                        onChange={e => {
                          const updated = [...editFormData.options];
                          updated[optIdx] = { ...updated[optIdx], text: e.target.value };
                          setEditFormData({ ...editFormData, options: updated });
                        }}
                        placeholder="English text..."
                        className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-white text-xs"
                      />
                      <input
                        type="text"
                        value={opt.textHindi || ''}
                        onChange={e => {
                          const updated = [...editFormData.options];
                          updated[optIdx] = { ...updated[optIdx], textHindi: e.target.value };
                          setEditFormData({ ...editFormData, options: updated });
                        }}
                        placeholder="Hindi text (optional)..."
                        className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-300 text-xs"
                      />
                    </div>
                  ))}
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
                      onClick={() => setEditFormData({ ...editFormData, correctOption: opt, correctAnswer: opt })}
                      className={`p-2 rounded-lg border font-bold text-center transition cursor-pointer ${
                        String(editFormData.correctOption || editFormData.correctAnswer).toUpperCase().trim() === opt
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 ring-2 ring-emerald-400 font-black'
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
                <label className="block text-slate-300 font-bold mb-1">Explanation (Solution)</label>
                <textarea
                  rows={2}
                  value={editFormData.explanation || ''}
                  onChange={e =>
                    setEditFormData({ ...editFormData, explanation: e.target.value })
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
                className="px-4 py-1.5 rounded-lg text-xs font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 flex items-center space-x-1 cursor-pointer"
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
