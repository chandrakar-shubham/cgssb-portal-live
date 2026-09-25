import React, { useState, useMemo, useDeferredValue, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import { Question, DifficultyLevel, ExamCategory, PYQAppearance, PreviousYearPaper, MockTest } from '../types';
import { HIERARCHY_TREE } from '../mockData';
import { ExamHierarchySelector, ExamHierarchyValue } from './ExamHierarchySelector';
import { AdminQuestionEditModal } from './AdminQuestionEditModal';
import { BulkImportPreviewModal, IngestionPaperConfig } from './BulkImportPreviewModal';
import { mapRawJsonToQuestion } from '../utils/jsonQuestionMapper';
import {
  HierarchyRecord,
  extractHierarchyFromApp,
  mapAuthorityToExamCategory,
  getAvailableAuthorities,
  getAvailableCategories
} from '../utils/examHierarchy';
import {
  FolderTree,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Copy,
  Check,
  CheckCircle2,
  Tag,
  BookOpen,
  HelpCircle,
  Sparkles,
  Layers,
  Calendar,
  Award,
  ChevronRight,
  Flame,
  FileText,
  Clock,
  History,
  Info,
  Hash,
  RefreshCw,
  ExternalLink,
  FileJson,
  FileSpreadsheet
} from 'lucide-react';

interface AdminQuestionBankProps {
  questions: Question[];
  onAddQuestion: (q: Partial<Question>) => void;
  onUpdateQuestion: (id: string, q: Partial<Question>) => void;
  onDeleteQuestion: (id: string) => void;
  allHierarchyRecords?: HierarchyRecord[];
  onAddPYP?: (pyp: Partial<PreviousYearPaper>) => void;
  onQuestionsAdded?: (questions: Question[]) => void;
  onTestAdded?: (test: MockTest) => void;
}

// Preset common CG competitive exams for quick selection
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

const RECENT_YEARS = [2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010];

export const AdminQuestionBank: React.FC<AdminQuestionBankProps> = ({
  questions,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
  allHierarchyRecords,
  onAddPYP,
  onQuestionsAdded,
  onTestAdded,
}) => {
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedTopic, setSelectedTopic] = useState<string>('ALL');
  const [selectedSubtopic, setSelectedSubtopic] = useState<string>('ALL');
  const [selectedChapter, setSelectedChapter] = useState<string>('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedAuthority, setSelectedAuthority] = useState<string>('ALL');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('ALL');
  const [bankSegment, setBankSegment] = useState<'ALL' | 'PYQ' | 'MOCK'>('ALL');
  const [pyqFilter, setPyqFilter] = useState<'ALL' | 'REPEATED' | 'SINGLE_PYQ' | 'PRACTICE'>('ALL');

  // Bulk Ingestion State
  const jsonInputRef = useRef<HTMLInputElement | null>(null);
  const csvInputRef = useRef<HTMLInputElement | null>(null);
  const [previewQuestions, setPreviewQuestions] = useState<Question[]>([]);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // JSON Import Handler
  const handleJSONImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const records: any[] = Array.isArray(parsed) ? parsed : (parsed.questions || []);

        if (records.length === 0) {
          alert('❌ The JSON file is empty or does not contain questions.');
          return;
        }

        const mapped = records.map((r, idx) => mapRawJsonToQuestion(r, idx));
        setPreviewQuestions(mapped);
        setIsPreviewModalOpen(true);
      } catch (err: any) {
        alert(`❌ Invalid JSON file: ${err.message}`);
      } finally {
        if (e.target) e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  // CSV Import Handler
  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const records = results.data as any[];
          if (!records || records.length === 0) {
            alert('❌ The CSV file is empty.');
            return;
          }
          const mapped = records.map((r, idx) => mapRawJsonToQuestion(r, idx));
          setPreviewQuestions(mapped);
          setIsPreviewModalOpen(true);
        } catch (err: any) {
          alert(`❌ CSV Parsing Error: ${err.message}`);
        } finally {
          if (e.target) e.target.value = '';
        }
      },
      error: (err) => {
        alert(`❌ Failed to read CSV file: ${err.message}`);
        if (e.target) e.target.value = '';
      }
    });
  };

  // Confirm Import Handler from BulkImportPreviewModal
  const handleConfirmImport = async (
    paperConfig: IngestionPaperConfig,
    finalQuestions: Question[]
  ) => {
    if (finalQuestions.length === 0) return;
    setIsImporting(true);

    try {
      const catPrefix = paperConfig.examCategory === 'CGPSC' ? 'cgpsc' : paperConfig.examCategory === 'CENTRAL_EXAMS' ? 'central' : 'cgssb';
      const year = paperConfig.year || new Date().getFullYear();
      const timestamp = Date.now();
      const marksPerQ = Number((paperConfig.marks / (finalQuestions.length || 1)).toFixed(2)) || 1.0;
      const negMarks = finalQuestions[0]?.negativeMarks || 0.25;

      const authority = paperConfig.authority || 'CGSSB';
      const subCategory = paperConfig.subCategory || 'General Recruitment';
      const postName = paperConfig.postName || 'CG Lecturer 2026';
      const examNameStr = paperConfig.examName || paperConfig.title;

      const taggedQuestions: Question[] = finalQuestions.map(q => ({
        ...q,
        authority,
        category: paperConfig.examCategory,
        subCategory,
        postName,
        examName: examNameStr,
        pypSource: examNameStr,
        year: year,
      }));

      // Register Mock Test if selected
      if (paperConfig.paperNature === 'mock' || paperConfig.paperNature === 'both') {
        const testId = `mock-${catPrefix}-${year}-${timestamp}`;
        const newMockTest: MockTest = {
          id: testId,
          title: paperConfig.title,
          authority,
          category: paperConfig.examCategory,
          subCategory,
          postName,
          examName: examNameStr,
          description: paperConfig.paperSummary,
          durationMinutes: paperConfig.durationMinutes,
          questionCount: taggedQuestions.length,
          marksPerQuestion: marksPerQ,
          negativeMarksPerQuestion: negMarks,
          isPYP: paperConfig.paperNature === 'both',
          pypYear: year,
          pypExamName: examNameStr,
          sections: [
            {
              id: `sec-${testId}`,
              name: 'Complete Test Paper',
              questionIds: taggedQuestions.map(q => q.id),
            },
          ],
          attemptsCount: 0,
          isPublished: true,
          difficultyDistribution: { easy: 30, medium: 50, hard: 20 },
          createdAt: new Date().toISOString().split('T')[0],
        };

        if (onTestAdded) onTestAdded(newMockTest);
      }

      // Register PYP Paper if selected
      if (paperConfig.paperNature === 'pyp' || paperConfig.paperNature === 'both') {
        const paperId = `pyp-${catPrefix}-${year}-${timestamp}`;
        const newPypPaper: PreviousYearPaper = {
          id: paperId,
          title: paperConfig.title,
          authority,
          examCategory: paperConfig.examCategory,
          subCategory,
          postName,
          examName: examNameStr,
          year: year,
          totalQuestions: taggedQuestions.length,
          durationMinutes: paperConfig.durationMinutes,
          marks: paperConfig.marks,
          negativeMarkingRatio: paperConfig.negativeMarkingRatio,
          paperSummary: paperConfig.paperSummary,
          subjectsWeightage: paperConfig.subjectsWeightage,
          isOfficialPaper: true,
          linkedQuestionIds: taggedQuestions.map(q => q.id),
        };

        if (onAddPYP) onAddPYP(newPypPaper);
      }

      if (taggedQuestions.length > 0) {
        if (onQuestionsAdded) {
          onQuestionsAdded(taggedQuestions);
        } else {
          taggedQuestions.forEach(q => onAddQuestion(q));
        }
      }

      setIsPreviewModalOpen(false);
      alert(`✅ Imported "${paperConfig.title}" with ${finalQuestions.length} questions as ${paperConfig.paperNature === 'mock' ? '🎯 Mock Test' : paperConfig.paperNature === 'pyp' ? '📜 Official PYP' : '⚡ Both (PYP + Mock Test)'}!`);
    } catch (err: any) {
      alert(`❌ Import Failed: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const computedHierarchyRecords = useMemo(() => {
    if (allHierarchyRecords && allHierarchyRecords.length > 0) return allHierarchyRecords;
    return extractHierarchyFromApp([], [], questions);
  }, [allHierarchyRecords, questions]);

  // Taxonomy Explorer toggle
  const [showTaxonomyTree, setShowTaxonomyTree] = useState(false);

  // Copied ID indicator
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal State & Editing Question (managed by isolated AdminQuestionEditModal)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Pagination & Search Debounce to keep typing at 60fps+
  const deferredSearch = useDeferredValue(search);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 25;

  // Reset pagination on filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [
    selectedSubject,
    selectedTopic,
    selectedSubtopic,
    selectedChapter,
    selectedDifficulty,
    selectedCategory,
    selectedAuthority,
    selectedSubCategory,
    bankSegment,
    pyqFilter,
    deferredSearch,
  ]);

  // Helper to generate a unique question ID
  const generateUniqueId = (prefix = 'q-cg') => {
    const randomHex = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${Date.now().toString().slice(-4)}-${randomHex}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingQuestion(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (q: Question) => {
    setEditingQuestion(q);
    setIsModalOpen(true);
  };

  // Save Modal Action
  const handleSaveModal = (payload: Partial<Question>, editingId?: string) => {
    if (editingId) {
      onUpdateQuestion(editingId, payload);
    } else {
      onAddQuestion(payload);
    }
  };

  // Clone Question Action
  const handleCloneQuestion = (q: Question) => {
    const clonedId = generateUniqueId('q-cg');
    const clonedQ: Partial<Question> = {
      ...q,
      id: clonedId,
      questionText: `${q.questionText} (Clone)`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    onAddQuestion(clonedQ);
  };

  // Statistics Calculations
  const stats = useMemo(() => {
    const total = questions.length;
    let pyqCount = 0;
    let mockCount = 0;
    let repeatedPyqCount = 0;
    let singlePyqCount = 0;

    questions.forEach(q => {
      const isPyq = q.originType === 'pyq' || (q.pypAppearances && q.pypAppearances.length > 0) || Boolean(q.pypSource);
      if (isPyq) {
        pyqCount++;
        const appearances = q.pypAppearances?.length || (q.pypSource ? 1 : 0);
        if (appearances > 1) {
          repeatedPyqCount++;
        } else {
          singlePyqCount++;
        }
      } else {
        mockCount++;
      }
    });

    return { total, pyqCount, mockCount, repeatedPyqCount, singlePyqCount, practiceCount: mockCount };
  }, [questions]);

  // Extract all existing unique chapters for datalist suggestions & filtering
  const existingChapters = useMemo(() => {
    const set = new Set<string>();
    questions.forEach(q => {
      const ch = (q.chapter || q.chapterName)?.trim();
      if (ch) set.add(ch);
    });
    return Array.from(set).sort();
  }, [questions]);

  // Filter questions
  const filteredQuestions = useMemo(() => {
    const seen = new Set<string>();
    return questions.filter(q => {
      if (!q || !q.id || seen.has(q.id)) return false;
      seen.add(q.id);

      // Bank Segment filter (All vs Official PYQ vs Mock Test questions)
      const isPyq = q.originType === 'pyq' || (q.pypAppearances && q.pypAppearances.length > 0) || Boolean(q.pypSource);
      if (bankSegment === 'PYQ' && !isPyq) return false;
      if (bankSegment === 'MOCK' && isPyq) return false;

      const matchSubject = selectedSubject === 'ALL' || q.subject === selectedSubject;
      const matchTopic = selectedTopic === 'ALL' || q.topic === selectedTopic;
      const matchSubtopic = selectedSubtopic === 'ALL' || q.subtopic === selectedSubtopic;
      const matchChapter =
        selectedChapter === 'ALL' ||
        (selectedChapter === '__NO_CHAPTER__'
          ? !q.chapter && !q.chapterName
          : (q.chapter || q.chapterName) === selectedChapter);
      const matchDifficulty = selectedDifficulty === 'ALL' || q.difficulty === selectedDifficulty;
      const matchCategory = selectedCategory === 'ALL' || q.category === selectedCategory;
      const matchAuthority =
        selectedAuthority === 'ALL' ||
        (q.authority || q.category) === selectedAuthority ||
        (selectedAuthority === 'CGPSC' && q.category === 'CGPSC') ||
        (selectedAuthority === 'CGSSB' && q.category === 'CGSSB');
      const matchSubCategory =
        selectedSubCategory === 'ALL' ||
        q.subCategory === selectedSubCategory;

      if (!matchAuthority || !matchSubCategory) return false;

      // PYQ Filter
      const appCount = q.pypAppearances?.length || (q.pypSource ? 1 : 0);
      let matchPyq = true;
      if (pyqFilter === 'REPEATED') matchPyq = appCount > 1;
      else if (pyqFilter === 'SINGLE_PYQ') matchPyq = appCount === 1;
      else if (pyqFilter === 'PRACTICE') matchPyq = appCount === 0;

      // Search matching text, unique ID, Hindi, chapter, topic, subtopic, or any exam/year appearance
      const s = deferredSearch.toLowerCase().trim();
      const matchSearch =
        !s ||
        q.id.toLowerCase().includes(s) ||
        (q.authority && q.authority.toLowerCase().includes(s)) ||
        (q.subCategory && q.subCategory.toLowerCase().includes(s)) ||
        (q.examName && q.examName.toLowerCase().includes(s)) ||
        (q.chapter && q.chapter.toLowerCase().includes(s)) ||
        (q.chapterName && q.chapterName.toLowerCase().includes(s)) ||
        (q.questionText || q.question || '').toLowerCase().includes(s) ||
        (q.questionHindi && q.questionHindi.toLowerCase().includes(s)) ||
        (q.topic || '').toLowerCase().includes(s) ||
        (q.subtopic && q.subtopic.toLowerCase().includes(s)) ||
        (q.pypSource && q.pypSource.toLowerCase().includes(s)) ||
        (q.pypAppearances &&
          q.pypAppearances.some(
            app =>
              app.examName.toLowerCase().includes(s) ||
              String(app.year).includes(s) ||
              (app.shift && app.shift.toLowerCase().includes(s))
          ));

      return matchSubject && matchTopic && matchSubtopic && matchChapter && matchDifficulty && matchCategory && matchPyq && matchSearch;
    });
  }, [questions, selectedSubject, selectedTopic, selectedSubtopic, selectedChapter, selectedDifficulty, selectedCategory, selectedAuthority, selectedSubCategory, bankSegment, pyqFilter, deferredSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / PAGE_SIZE));
  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredQuestions.slice(start, start + PAGE_SIZE);
  }, [filteredQuestions, currentPage]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Hidden File Inputs for Native File Pickers */}
      <input
        type="file"
        ref={jsonInputRef}
        onChange={handleJSONImport}
        accept=".json,application/json"
        className="hidden"
      />
      <input
        type="file"
        ref={csvInputRef}
        onChange={handleCSVImport}
        accept=".csv,text/csv"
        className="hidden"
      />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-lg">
        <div>
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-wider">
              Question Bank
            </span>
            <span className="text-[10px] font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
              Subject → Topic → Subtopic Hierarchy
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-black text-white flex items-center space-x-2">
            <FolderTree className="w-5 h-5 text-emerald-400" />
            <span>Question Bank Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Maintain Subject → Topic → Subtopic taxonomic question hierarchy with difficulty tagging, unique question IDs, and multi-exam PYQ provenance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => jsonInputRef.current?.click()}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 hover:border-emerald-500/50 font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer"
            title="Import questions from JSON file as Mock Test or Official PYP"
          >
            <FileJson className="w-3.5 h-3.5 text-emerald-400" />
            <span>Import JSON</span>
          </button>
          <button
            onClick={() => csvInputRef.current?.click()}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-400 border border-slate-700 hover:border-teal-500/50 font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer"
            title="Import questions from CSV file as Mock Test or Official PYP"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-teal-400" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={() => setShowTaxonomyTree(!showTaxonomyTree)}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition border ${
              showTaxonomyTree
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>{showTaxonomyTree ? 'Hide Tree' : 'Explore Tree'}</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition shadow-sm active:scale-95 whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Question</span>
          </button>
        </div>
      </div>

      {/* SEPARATION OF MOCK AND PYQ SEGMENT TABS */}
      <div className="bg-slate-900/95 border border-slate-800 p-2.5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xl">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setBankSegment('ALL');
              setPyqFilter('ALL');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
              bankSegment === 'ALL'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            <span>All Question Bank</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-950/60 font-mono font-black">
              {stats.total}
            </span>
          </button>

          <button
            onClick={() => setBankSegment('PYQ')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
              bankSegment === 'PYQ'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/30'
                : 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/20'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Official PYQ Repository</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${bankSegment === 'PYQ' ? 'bg-slate-950 text-amber-300' : 'bg-amber-500/20 text-amber-300'}`}>
              {stats.pyqCount} Qs
            </span>
          </button>

          <button
            onClick={() => setBankSegment('MOCK')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
              bankSegment === 'MOCK'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/30'
                : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-emerald-500/20'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Mock Test Series Bank</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${bankSegment === 'MOCK' ? 'bg-slate-950 text-emerald-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
              {stats.mockCount} Qs
            </span>
          </button>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-400 px-2 shrink-0">
          {bankSegment === 'PYQ' && (
            <span className="text-amber-400 font-semibold flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Viewing Genuine Official Exam Papers (CGPSC & Vyapam)</span>
            </span>
          )}
          {bankSegment === 'MOCK' && (
            <span className="text-emerald-400 font-semibold flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Viewing Curated Mock Test Questions & Practice Items</span>
            </span>
          )}
          {bankSegment === 'ALL' && (
            <span className="text-slate-400">
              Showing Complete Unified Inventory
            </span>
          )}
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div 
          onClick={() => {
            setBankSegment('ALL');
            setPyqFilter('ALL');
          }}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            bankSegment === 'ALL' && pyqFilter === 'ALL'
              ? 'bg-indigo-600/15 border-indigo-500/60 shadow-md shadow-indigo-600/10'
              : 'bg-slate-900 border-slate-800 hover:border-indigo-500/40'
          }`}
        >
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Questions</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-white">{stats.total}</span>
            <span className="text-xs text-slate-400">indexed</span>
          </div>
        </div>

        <div
          onClick={() => setBankSegment(bankSegment === 'PYQ' ? 'ALL' : 'PYQ')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            bankSegment === 'PYQ'
              ? 'bg-amber-500/15 border-amber-500/60 shadow-md shadow-amber-500/10'
              : 'bg-slate-900 border-slate-800 hover:border-amber-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1">
              <History className="w-3.5 h-3.5 text-amber-400" />
              <span>Official PYQs</span>
            </span>
            {bankSegment === 'PYQ' && <span className="text-[9px] bg-amber-500 text-slate-950 font-bold px-1.5 py-0.2 rounded">ACTIVE</span>}
          </div>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-amber-400">{stats.pyqCount}</span>
            <span className="text-xs text-slate-400">from papers</span>
          </div>
        </div>

        <div
          onClick={() => setBankSegment(bankSegment === 'MOCK' ? 'ALL' : 'MOCK')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            bankSegment === 'MOCK'
              ? 'bg-emerald-500/15 border-emerald-500/60 shadow-md shadow-emerald-500/10'
              : 'bg-slate-900 border-slate-800 hover:border-emerald-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Mock Series Items</span>
            </span>
            {bankSegment === 'MOCK' && <span className="text-[9px] bg-emerald-500 text-slate-950 font-bold px-1.5 py-0.2 rounded">ACTIVE</span>}
          </div>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-emerald-400">{stats.mockCount}</span>
            <span className="text-xs text-slate-400">curated test items</span>
          </div>
        </div>

        <div
          onClick={() => setPyqFilter(pyqFilter === 'REPEATED' ? 'ALL' : 'REPEATED')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            pyqFilter === 'REPEATED'
              ? 'bg-purple-500/15 border-purple-500/60 shadow-md shadow-purple-500/10'
              : 'bg-slate-900 border-slate-800 hover:border-purple-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider flex items-center space-x-1">
              <Flame className="w-3.5 h-3.5 text-purple-400" />
              <span>Multi-Exam Repeats</span>
            </span>
            {pyqFilter === 'REPEATED' && <span className="text-[9px] bg-purple-500 text-white font-bold px-1.5 py-0.2 rounded">ACTIVE</span>}
          </div>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-purple-400">{stats.repeatedPyqCount}</span>
            <span className="text-xs text-slate-400">asked 2+ times</span>
          </div>
        </div>
      </div>

      {/* TAXONOMY EXPLORER DRAWER / PANEL */}
      {showTaxonomyTree && (
        <div className="bg-slate-900 border border-emerald-500/30 p-5 rounded-2xl space-y-4 shadow-xl animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <FolderTree className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Subject → Topic → Subtopic Taxonomic Directory</h3>
            </div>
            <span className="text-[11px] text-slate-400">
              Click any node to filter questions instantly
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {HIERARCHY_TREE.map(subj => {
              const subjQuestionsCount = questions.filter(q => q.subject === subj.subject).length;
              const isSelectedSubj = selectedSubject === subj.subject;

              return (
                <div
                  key={subj.subject}
                  className={`p-3 rounded-xl border transition ${
                    isSelectedSubj
                      ? 'bg-emerald-500/10 border-emerald-500/50'
                      : 'bg-slate-850/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div
                    onClick={() => {
                      if (isSelectedSubj) {
                        setSelectedSubject('ALL');
                        setSelectedTopic('ALL');
                        setSelectedSubtopic('ALL');
                      } else {
                        setSelectedSubject(subj.subject);
                        setSelectedTopic('ALL');
                        setSelectedSubtopic('ALL');
                      }
                    }}
                    className="flex items-center justify-between cursor-pointer font-bold text-slate-200 hover:text-emerald-400 pb-2 border-b border-slate-800/80"
                  >
                    <span className="truncate pr-2">{subj.subject}</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono text-[10px] shrink-0">
                      {subjQuestionsCount} Qs
                    </span>
                  </div>

                  <div className="mt-2 space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {subj.topics.map(topic => {
                      const topicQuestionsCount = questions.filter(
                        q => q.subject === subj.subject && q.topic === topic.name
                      ).length;
                      const isSelectedTopic = selectedSubject === subj.subject && selectedTopic === topic.name;

                      return (
                        <div
                          key={topic.name}
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedSubject(subj.subject);
                            setSelectedTopic(isSelectedTopic ? 'ALL' : topic.name);
                            setSelectedSubtopic('ALL');
                          }}
                          className={`p-1.5 rounded-lg text-[11px] flex items-center justify-between cursor-pointer transition ${
                            isSelectedTopic
                              ? 'bg-emerald-500 text-slate-950 font-bold'
                              : 'text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <span className="truncate pl-1">› {topic.name}</span>
                          <span className="text-[10px] opacity-75 font-mono ml-2">
                            {topicQuestionsCount}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {(selectedSubject !== 'ALL' || selectedTopic !== 'ALL' || selectedSubtopic !== 'ALL') && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
              <div className="flex items-center space-x-2 text-slate-300">
                <span className="text-slate-500">Active Taxonomy Filter:</span>
                <span className="font-bold text-emerald-400">{selectedSubject}</span>
                {selectedTopic !== 'ALL' && (
                  <>
                    <span className="text-slate-600">›</span>
                    <span className="font-bold text-white">{selectedTopic}</span>
                  </>
                )}
                {selectedSubtopic !== 'ALL' && (
                  <>
                    <span className="text-slate-600">›</span>
                    <span className="font-bold text-slate-300">{selectedSubtopic}</span>
                  </>
                )}
              </div>
              <button
                onClick={() => {
                  setSelectedSubject('ALL');
                  setSelectedTopic('ALL');
                  setSelectedSubtopic('ALL');
                }}
                className="text-xs text-rose-400 hover:underline font-bold"
              >
                Clear Taxonomy Filter
              </button>
            </div>
          )}
        </div>
      )}

      {/* FILTER TOOLBAR */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3 text-xs shadow-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search by ID, Topic, Text, Exam, Year, Chapter */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ID, text, chapter, exam, or year..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Subject Filter */}
          <div>
            <select
              value={selectedSubject}
              onChange={e => {
                setSelectedSubject(e.target.value);
                setSelectedTopic('ALL');
                setSelectedSubtopic('ALL');
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 truncate"
            >
              <option value="ALL">All Subjects ({HIERARCHY_TREE.length})</option>
              {HIERARCHY_TREE.map(s => (
                <option key={s.subject} value={s.subject}>
                  {s.subject}
                </option>
              ))}
            </select>
          </div>

          {/* Chapter Filter */}
          <div>
            <select
              value={selectedChapter}
              onChange={e => setSelectedChapter(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-purple-200 focus:outline-none focus:border-purple-500 truncate"
            >
              <option value="ALL">All Chapters ({existingChapters.length})</option>
              {existingChapters.map(ch => (
                <option key={ch} value={ch}>
                  अध्याय: {ch}
                </option>
              ))}
              <option value="__NO_CHAPTER__">No Chapter Tagged</option>
            </select>
          </div>

          {/* Authority Filter */}
          <div>
            <select
              value={selectedAuthority}
              onChange={e => {
                setSelectedAuthority(e.target.value);
                setSelectedSubCategory('ALL');
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 truncate"
            >
              <option value="ALL">All Authorities</option>
              {getAvailableAuthorities(computedHierarchyRecords).map(auth => (
                <option key={auth} value={auth}>{auth}</option>
              ))}
            </select>
          </div>

          {/* Sub-Category / Recruitment Drive Filter */}
          <div>
            <select
              value={selectedSubCategory}
              onChange={e => setSelectedSubCategory(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 truncate"
            >
              <option value="ALL">All Sub-Categories</option>
              {getAvailableCategories(computedHierarchyRecords, selectedAuthority !== 'ALL' ? selectedAuthority : undefined).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Difficulty Filter */}
          <div>
            <select
              value={selectedDifficulty}
              onChange={e => setSelectedDifficulty(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>

        {/* Second row: Subtopic & PYQ Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              PYQ Filter:
            </span>
            <button
              onClick={() => setPyqFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                pyqFilter === 'ALL'
                  ? 'bg-emerald-500 text-slate-950 font-black'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              All Questions ({questions.length})
            </button>
            <button
              onClick={() => setPyqFilter('REPEATED')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
                pyqFilter === 'REPEATED'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'bg-slate-800 text-amber-400 hover:bg-slate-700 border border-amber-500/30'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Multi-Exam PYQs ({stats.repeatedPyqCount})</span>
            </button>
            <button
              onClick={() => setPyqFilter('SINGLE_PYQ')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
                pyqFilter === 'SINGLE_PYQ'
                  ? 'bg-emerald-500 text-slate-950 font-black'
                  : 'bg-slate-800 text-emerald-400 hover:bg-slate-700 border border-emerald-500/30'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Single Exam PYQs ({stats.singlePyqCount})</span>
            </button>
            <button
              onClick={() => setPyqFilter('PRACTICE')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
                pyqFilter === 'PRACTICE'
                  ? 'bg-cyan-500 text-slate-950 font-black'
                  : 'bg-slate-800 text-cyan-400 hover:bg-slate-700 border border-cyan-500/30'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Practice Items ({stats.practiceCount})</span>
            </button>
          </div>

          <div className="text-xs text-slate-400">
            Showing <strong className="text-emerald-400 font-bold">{filteredQuestions.length > 0 ? (currentPage - 1) * PAGE_SIZE + 1 : 0}</strong> - <strong className="text-emerald-400 font-bold">{Math.min(currentPage * PAGE_SIZE, filteredQuestions.length)}</strong> of <strong className="text-white font-bold">{filteredQuestions.length}</strong> questions
          </div>
        </div>
      </div>

      {/* QUESTIONS LIST */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
            <HelpCircle className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No questions matched your filters</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Try adjusting your taxonomy filters, search query, or PYQ frequency filters.
            </p>
            <button
              onClick={() => {
                setSearch('');
                setSelectedSubject('ALL');
                setSelectedTopic('ALL');
                setSelectedSubtopic('ALL');
                setSelectedChapter('ALL');
                setSelectedDifficulty('ALL');
                setSelectedCategory('ALL');
                setPyqFilter('ALL');
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs rounded-xl border border-slate-700 transition"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          paginatedQuestions.map((q, idx) => {
            const appearances = q.pypAppearances || (q.pypSource ? [{ examName: q.pypSource, year: 2022 }] : []);
            const isRepeated = appearances.length > 1;
            const isPyq = q.originType === 'pyq' || appearances.length > 0 || Boolean(q.pypSource);

            return (
              <div
                key={q.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition space-y-4 shadow-md"
              >
                {/* Header Line: Unique Question ID, Taxonomic Path & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Unique Question ID */}
                    <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-700 px-2.5 py-1 rounded-lg">
                      <Hash className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="font-mono text-xs font-black text-white">{q.id}</span>
                      <button
                        onClick={() => copyToClipboard(q.id)}
                        className="text-slate-400 hover:text-emerald-400 transition p-0.5 ml-1"
                        title="Copy Question ID"
                      >
                        {copiedId === q.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>

                    {/* Question Origin Badge (Separation of PYQ and Mock) */}
                    {isPyq ? (
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-amber-500/15 text-amber-300 border border-amber-500/40 flex items-center space-x-1 shadow-sm">
                        <History className="w-3.5 h-3.5 text-amber-400" />
                        <span>OFFICIAL PYQ</span>
                        {q.year && <span className="font-mono text-amber-200">({q.year})</span>}
                        {isRepeated && (
                          <span className="ml-1 px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[9px]">
                            {appearances.length}x Repeated
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1 shadow-sm">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        <span>MOCK PRACTICE ITEM</span>
                      </span>
                    )}

                    {/* Taxonomic Breadcrumb */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      {(q.chapter || q.chapterName) && (
                        <span className="px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 font-bold flex items-center space-x-1">
                          <BookOpen className="w-3 h-3 text-purple-400 mr-0.5" />
                          <span className="text-[10px] text-purple-400">अध्याय:</span>
                          <span>{q.chapter || q.chapterName}</span>
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                        {q.subject}
                      </span>
                      <span className="text-slate-600 font-bold">›</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                        {q.topic}
                      </span>
                      <span className="text-slate-600 font-bold">›</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800/60 text-slate-400 border border-slate-700/60">
                        {q.subtopic}
                      </span>
                    </div>

                    {/* Multi-Level Exam Hierarchy Badges */}
                    {(q.authority || q.subCategory || q.examName) && (
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] pt-0.5">
                        <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 font-bold">
                          🏛️ {q.authority || q.category}
                        </span>
                        {q.subCategory && (
                          <span className="px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-medium">
                            📁 {q.subCategory}
                          </span>
                        )}
                        {q.examName && (
                          <span className="px-2 py-0.5 rounded bg-teal-500/15 text-teal-300 border border-teal-500/30 font-medium">
                            🎯 {q.examName}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Meta & Action Buttons */}
                  <div className="flex items-center space-x-2 shrink-0">
                    <span
                      className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${
                        q.difficulty === 'Easy'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : q.difficulty === 'Medium'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {q.difficulty}
                    </span>

                    <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 text-[10px] font-mono font-bold border border-slate-700">
                      +{q.marks} / -{q.negativeMarks.toFixed(2)}
                    </span>

                    <button
                      onClick={() => handleCloneQuestion(q)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700"
                      title="Clone Question with new Unique ID"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleOpenEditModal(q)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-950 text-slate-300 hover:text-emerald-400 transition border border-slate-700"
                      title="Edit Question"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onDeleteQuestion(q.id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition border border-slate-700"
                      title="Delete Question"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* PYQ EXAM & YEAR APPEARANCES SECTION */}
                {appearances.length > 0 && (
                  <div
                    className={`p-3 rounded-xl border space-y-2 ${
                      isRepeated
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : 'bg-slate-850/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center space-x-2">
                        {isRepeated ? (
                          <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-black text-[10px] flex items-center space-x-1 shadow">
                            <Flame className="w-3 h-3 fill-slate-950" />
                            <span>REPEATED PYQ • Asked in {appearances.length} Exams</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-[10px] flex items-center space-x-1">
                            <History className="w-3 h-3" />
                            <span>Official Previous Year Question (PYQ)</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Exam Year Provenance Verified
                      </span>
                    </div>

                    {/* Appearances Badges */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {appearances.map((app, appIdx) => (
                        <div
                          key={appIdx}
                          className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center space-x-2 ${
                            isRepeated
                              ? 'bg-slate-900 border-amber-500/40 text-amber-200'
                              : 'bg-slate-900 border-slate-700 text-slate-200'
                          }`}
                        >
                          <span className="text-emerald-400 font-bold">{app.examName}</span>
                          <span className="text-slate-500">•</span>
                          <span className="bg-slate-800 px-1.5 py-0.2 rounded text-[11px] font-mono text-emerald-300 font-bold">
                            {app.year}
                          </span>
                          {app.shift && (
                            <>
                              <span className="text-slate-600">•</span>
                              <span className="text-slate-400 text-[10px]">{app.shift}</span>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Question Statements (English & Hindi) */}
                <div className="space-y-2">
                  <p className="text-sm sm:text-base font-semibold text-white leading-relaxed">
                    {q.questionText}
                  </p>
                  {q.questionHindi && q.questionHindi.trim() !== q.questionText.trim() && (
                    <p className="text-xs sm:text-sm text-emerald-300/90 font-medium leading-relaxed border-l-2 border-emerald-500/40 pl-3 py-0.5">
                      {q.questionHindi}
                    </p>
                  )}
                </div>

                {/* MATCHING LIST DISPLAY (Column A & Column B) */}
                {(q.questionType === 'matching' || (Array.isArray(q.columnA) && q.columnA.length > 0)) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950/80 border border-purple-500/30 my-2">
                    {Array.isArray(q.columnA) && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider block border-b border-purple-500/20 pb-1">
                          Column I (सूची-I)
                        </span>
                        {q.columnA.map((item, idx) => (
                          <div key={idx} className="flex items-start space-x-2 text-xs text-slate-200">
                            <span className="w-5 h-5 rounded bg-purple-500/20 text-purple-300 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                              {item.id || idx + 1}
                            </span>
                            <span>{item.text || item.textHindi || String(item)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {Array.isArray(q.columnB) && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider block border-b border-purple-500/20 pb-1">
                          Column II (सूची-II)
                        </span>
                        {q.columnB.map((item, idx) => (
                          <div key={idx} className="flex items-start space-x-2 text-xs text-slate-200">
                            <span className="w-5 h-5 rounded bg-purple-500/20 text-purple-300 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                              {item.id || String.fromCharCode(65 + idx)}
                            </span>
                            <span>{item.text || item.textHindi || String(item)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ASSERTION & REASON DISPLAY */}
                {(q.questionType === 'assertion_reason' || q.assertion) && (
                  <div className="space-y-2 p-3 rounded-xl bg-slate-950/80 border border-amber-500/30 my-2 text-xs">
                    {q.assertion && (
                      <div className="flex items-start space-x-2.5">
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-black text-[10px] shrink-0 mt-0.5 border border-amber-500/40">
                          Assertion (A)
                        </span>
                        <div className="text-slate-100 font-medium leading-relaxed">
                          {q.assertion}
                          {q.assertionHindi && q.assertionHindi !== q.assertion && (
                            <div className="text-emerald-300/80 text-[11px] mt-0.5">{q.assertionHindi}</div>
                          )}
                        </div>
                      </div>
                    )}
                    {q.reason && (
                      <div className="flex items-start space-x-2.5 pt-1.5 border-t border-slate-800">
                        <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-black text-[10px] shrink-0 mt-0.5 border border-cyan-500/40">
                          Reason (R)
                        </span>
                        <div className="text-slate-100 font-medium leading-relaxed">
                          {q.reason}
                          {q.reasonHindi && q.reasonHindi !== q.reason && (
                            <div className="text-emerald-300/80 text-[11px] mt-0.5">{q.reasonHindi}</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* MULTI-STATEMENT DISPLAY */}
                {(q.questionType === 'multi_statement' || (Array.isArray(q.statements) && q.statements.length > 0)) && (
                  <div className="space-y-2 p-3 rounded-xl bg-slate-950/80 border border-sky-500/30 my-2 text-xs">
                    <span className="text-[10px] font-bold text-sky-300 uppercase tracking-wider block border-b border-sky-500/20 pb-1">
                      Statements (कथन)
                    </span>
                    <div className="space-y-2">
                      {q.statements?.map((stmt, sIdx) => (
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

                {/* Options Preview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                  {q.options.map(opt => {
                    const isCorrect = opt.id === q.correctOption;
                    return (
                      <div
                        key={opt.id}
                        className={`p-2.5 rounded-xl border text-[11px] flex items-start space-x-2 transition ${
                          isCorrect
                            ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-200 font-semibold'
                            : 'bg-slate-800/40 border-slate-800 text-slate-300'
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-lg text-[10px] font-bold flex items-center justify-center shrink-0 ${
                            isCorrect
                              ? 'bg-emerald-500 text-slate-950 font-black shadow'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {opt.id}
                        </span>
                        <div className="overflow-hidden">
                          <p className="truncate font-medium">{opt.text}</p>
                          {opt.textHindi && (
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">{opt.textHindi}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                {q.explanation && (
                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-xs text-slate-300 space-y-1">
                    <span className="font-bold text-emerald-400 text-[10px] uppercase tracking-wider block">
                      Step-by-step Solution:
                    </span>
                    <p>{q.explanation}</p>
                    {q.explanationHindi && (
                      <p className="text-emerald-300/80 text-[11px] pt-1 border-t border-slate-850 mt-1">
                        {q.explanationHindi}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* PAGINATION TOOLBAR */}
      {filteredQuestions.length > PAGE_SIZE && (
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="text-xs text-slate-400">
            Page <strong className="text-white font-bold">{currentPage}</strong> of <strong className="text-white font-bold">{totalPages}</strong>
            <span className="mx-2 text-slate-600">•</span>
            <span>{filteredQuestions.length} Total Matching Questions</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                currentPage === 1
                  ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-800'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              ‹ Previous
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded-xl text-xs font-bold transition cursor-pointer ${
                    currentPage === pageNum
                      ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                currentPage === totalPages
                  ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-800'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              Next ›
            </button>
          </div>
        </div>
      )}

      {/* ISOLATED ADD / EDIT QUESTION MODAL */}
      <AdminQuestionEditModal
        isOpen={isModalOpen}
        editingQuestion={editingQuestion}
        defaultOrigin={bankSegment === 'PYQ' ? 'pyq' : 'mock'}
        onClose={() => {
          setIsModalOpen(false);
          setEditingQuestion(null);
        }}
        onSave={handleSaveModal}
        existingChapters={existingChapters}
        allHierarchyRecords={computedHierarchyRecords}
      />

      {/* Bulk Import Preview Modal */}
      {isPreviewModalOpen && (
        <BulkImportPreviewModal
          isOpen={isPreviewModalOpen}
          records={previewQuestions}
          onClose={() => setIsPreviewModalOpen(false)}
          onConfirm={handleConfirmImport}
          isImporting={isImporting}
        />
      )}
    </div>
  );
};
