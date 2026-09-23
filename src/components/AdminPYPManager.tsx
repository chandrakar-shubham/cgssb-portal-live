import React, { useState, useRef, useMemo } from 'react';
import Papa from 'papaparse';
import { PreviousYearPaper, ExamCategory, BulkImportQuestion, MockTest, Question } from '../types';
import {
  FileText,
  Plus,
  Trash2,
  Edit3,
  Calendar,
  Layers,
  BarChart,
  CheckCircle,
  Download,
  Grid,
  Sparkles,
  Hash,
  BookOpenCheck,
  Tag,
  AlertCircle,
  Play,
  ArrowRight,
  Eye,
  EyeOff
} from 'lucide-react';
import { ManualGridBuilder } from './ManualGridBuilder';
import { AIPYPExtractorModal } from './AIPYPExtractorModal';
import { BulkImportPreviewModal } from './BulkImportPreviewModal';
import { JsonImportPreviewModal } from './JsonImportPreviewModal';
import { processBulkImportClientSide } from '../utils/pypEngine';
import { getBaseTestTitle } from '../utils/testDeduplication';
import { mapRawJsonToQuestion } from '../utils/jsonQuestionMapper';

const REQUIRED_BULK_KEYS = [
  'S.No.',
  'Examname',
  'Year',
  'Question(Hindi)',
  'Question(english)',
  'option_A',
  'option_B',
  'option_C',
  'option_D',
  'answer',
  'explaination'
] as const;

interface AdminPYPManagerProps {
  pypPapers: PreviousYearPaper[];
  tests?: MockTest[];
  onAddPYP: (pyp: Partial<PreviousYearPaper>) => void;
  onDeletePYP: (id: string) => void;
  onConvertPYPToMockTest: (pyp: PreviousYearPaper) => void;
  onTogglePublishTest?: (testId: string) => void;
  onStartTest?: (test: MockTest) => void;
  onQuestionsAdded?: (questions: Question[]) => void;
  onTestAdded?: (test: MockTest) => void;
}

export const AdminPYPManager: React.FC<AdminPYPManagerProps> = ({
  pypPapers,
  tests = [],
  onAddPYP,
  onDeletePYP,
  onConvertPYPToMockTest,
  onTogglePublishTest,
  onStartTest,
  onQuestionsAdded,
  onTestAdded,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGridBuilderOpen, setIsGridBuilderOpen] = useState(false);
  const [isAIExtractorOpen, setIsAIExtractorOpen] = useState(false);
  const [convertedNotice, setConvertedNotice] = useState<string | null>(null);

  // Bulk Import State
  const [previewQuestions, setPreviewQuestions] = useState<BulkImportQuestion[]>([]);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importToast, setImportToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Advanced JSON Import State
  const [advancedRawJson, setAdvancedRawJson] = useState<any[]>([]);
  const [advancedMappedQuestions, setAdvancedMappedQuestions] = useState<Question[]>([]);
  const [isAdvancedJsonModalOpen, setIsAdvancedJsonModalOpen] = useState(false);
  const [publishedSuccess, setPublishedSuccess] = useState<{
    paper: PreviousYearPaper;
    mockTest?: MockTest;
    count: number;
  } | null>(null);

  const uniquePapers = useMemo(() => {
    const seen = new Set<string>();
    return pypPapers.filter(p => {
      if (!p || !p.id || seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }, [pypPapers]);

  const jsonInputRef = useRef<HTMLInputElement | null>(null);
  const csvInputRef = useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = useState<{
    title: string;
    examCategory: ExamCategory;
    year: number;
    totalQuestions: number;
    durationMinutes: number;
    marks: number;
    negativeMarkingRatio: string;
    paperSummary: string;
    subjectsWeightage: { subject: string; questionCount: number; percentage: number }[];
  }>({
    title: '',
    examCategory: 'CGSSB',
    year: 2024,
    totalQuestions: 100,
    durationMinutes: 120,
    marks: 100,
    negativeMarkingRatio: '1/3rd (0.333)',
    paperSummary: '',
    subjectsWeightage: [
      { subject: 'Chhattisgarh General Studies', questionCount: 25, percentage: 25 },
      { subject: 'India General Studies', questionCount: 20, percentage: 20 },
      { subject: 'Quantitative Aptitude', questionCount: 15, percentage: 15 },
      { subject: 'Reasoning', questionCount: 10, percentage: 10 },
      { subject: 'General Hindi', questionCount: 10, percentage: 10 },
      { subject: 'Chhattisgarhi Language', questionCount: 10, percentage: 10 },
      { subject: 'Computer Knowledge', questionCount: 10, percentage: 10 },
    ],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    onAddPYP({
      ...formData,
      isOfficialPaper: true,
      downloadFileName: `${formData.title.replace(/\s+/g, '_')}_Official.pdf`,
    });
    setIsModalOpen(false);
  };

  const handleConvert = (paper: PreviousYearPaper) => {
    onConvertPYPToMockTest(paper);
    setConvertedNotice(paper.title);
    setTimeout(() => setConvertedNotice(null), 3500);
  };

  // 11 Required Keys Validator
  const validateRecords = (records: any[]): { isValid: boolean; missingFields: string[] } => {
    if (!Array.isArray(records) || records.length === 0) {
      return { isValid: false, missingFields: ['Empty file: No records found.'] };
    }

    const missingSet = new Set<string>();
    records.forEach((row, idx) => {
      if (!row || typeof row !== 'object') {
        missingSet.add(`Record #${idx + 1} is not a valid object`);
        return;
      }
      REQUIRED_BULK_KEYS.forEach(key => {
        if (!(key in row) || row[key] === undefined || row[key] === null) {
          missingSet.add(key);
        }
      });
    });

    return {
      isValid: missingSet.size === 0,
      missingFields: Array.from(missingSet),
    };
  };

  // JSON Import Handler (Supports Advanced Question Schema + Legacy PYP)
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

        // Check if records represent advanced question schema (has question/questionText/questionType/options)
        const first = records[0];
        const isAdvancedFormat = first && (
          'questionType' in first ||
          'subjectCategory' in first ||
          'options' in first ||
          ('question' in first && !('S.No.' in first)) ||
          'columnA' in first ||
          'assertion' in first
        );

        if (isAdvancedFormat) {
          const mapped = records.map((r, idx) => mapRawJsonToQuestion(r, idx));
          setAdvancedRawJson(records);
          setAdvancedMappedQuestions(mapped);
          setIsAdvancedJsonModalOpen(true);
        } else {
          // Standard Legacy 11-key format
          const { isValid, missingFields } = validateRecords(records);
          if (!isValid) {
            // If it failed strict 11 keys, try mapping to questions
            try {
              const fallbackMapped = records.map((r, idx) => mapRawJsonToQuestion(r, idx));
              setAdvancedRawJson(records);
              setAdvancedMappedQuestions(fallbackMapped);
              setIsAdvancedJsonModalOpen(true);
              return;
            } catch {
              alert(
                `❌ Validation Failed for JSON Import!\n\nMissing key(s):\n${missingFields.map(f => `• ${f}`).join('\n')}`
              );
              return;
            }
          }

          setPreviewQuestions(records);
          setIsPreviewModalOpen(true);
        }
      } catch (err: any) {
        alert(`❌ Invalid JSON file: ${err.message}`);
      } finally {
        if (e.target) e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  // CSV Import Handler using PapaParse
  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const records = results.data as any[];
          const { isValid, missingFields } = validateRecords(records);

          if (!isValid) {
            alert(
              `❌ Validation Failed for CSV Import!\n\nThe CSV is missing the following required column(s):\n\n${missingFields.map(f => `• ${f}`).join('\n')}\n\nEvery record must contain exactly these 11 columns:\n${REQUIRED_BULK_KEYS.join(', ')}`
            );
            return;
          }

          setPreviewQuestions(records);
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

  // Confirm Import & Send to Backend API with custom configuration & Mock Test generation
  // Resilient to both full-stack Node environments and static hosting (e.g. Hostinger, cPanel, Vercel static)
  const handleConfirmImport = async (
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
  ) => {
    if (finalQuestions.length === 0) return;
    setIsImporting(true);
    try {
      let publishedPaper: PreviousYearPaper | null = null;
      let publishedMockTest: MockTest | null = null;
      let publishedQuestions: Question[] = [];

      // 1. Attempt backend API ingestion if server is reachable and active
      try {
        const res = await fetch('/api/pyp/bulk-import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questions: finalQuestions,
            paperConfig,
            createMockTest: true,
          }),
        });

        const contentType = res.headers.get('content-type') || '';
        // Only parse as JSON if response is OK and header confirms application/json
        // (Prevents "Unexpected token '<' in <!doctype html>" on static hosts like Hostinger)
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          if (data && data.success) {
            publishedPaper = data.paper;
            publishedMockTest = data.mockTest;
            publishedQuestions = data.questions || [];
          }
        }
      } catch (networkErr) {
        console.warn('Backend API unavailable or static environment detected. Falling back to client-side engine:', networkErr);
      }

      // 2. If backend did not return JSON (e.g. Hostinger static build or offline mode),
      // perform high-performance client-side ingestion instantly
      if (!publishedPaper) {
        const clientResult = processBulkImportClientSide({
          questions: finalQuestions,
          paperConfig,
        });
        publishedPaper = clientResult.paper;
        publishedMockTest = clientResult.mockTest;
        publishedQuestions = clientResult.questions;
      }

      // 3. Update application state and auto-persist to localStorage
      if (publishedPaper) {
        onAddPYP(publishedPaper);
      }
      if (publishedMockTest && onTestAdded) {
        onTestAdded(publishedMockTest);
      }
      if (publishedQuestions.length > 0 && onQuestionsAdded) {
        onQuestionsAdded(publishedQuestions);
      }

      setIsPreviewModalOpen(false);

      setImportToast({
        message: `✅ Published "${paperConfig.title}" with ${finalQuestions.length} questions! Live mock test created.`,
        type: 'success',
      });
      setTimeout(() => setImportToast(null), 5000);

      // Open Celebration & Live Test Trigger Dialog
      setPublishedSuccess({
        paper: publishedPaper,
        mockTest: publishedMockTest || undefined,
        count: finalQuestions.length,
      });
    } catch (err: any) {
      console.error('Publishing failed:', err);
      setImportToast({
        message: `❌ Import Failed: ${err.message || 'Error occurred while saving paper.'}`,
        type: 'error',
      });
      setTimeout(() => setImportToast(null), 6000);
    } finally {
      setIsImporting(false);
    }
  };

  // Confirm Advanced JSON Import (Sends to /api/questions/bulk or adds locally)
  const handleConfirmAdvancedJsonImport = async () => {
    if (advancedMappedQuestions.length === 0) return;
    setIsImporting(true);

    try {
      let savedQuestions: Question[] = [];

      try {
        const res = await fetch('/api/questions/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questions: advancedMappedQuestions }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data && data.success && data.questions) {
            savedQuestions = data.questions;
          }
        }
      } catch (e) {
        console.warn('Backend API bulk questions unavailable, saving client-side:', e);
      }

      if (savedQuestions.length === 0) {
        savedQuestions = advancedMappedQuestions;
      }

      if (onQuestionsAdded) {
        onQuestionsAdded(savedQuestions);
      }

      setIsAdvancedJsonModalOpen(false);
      setImportToast({
        message: `✅ Successfully imported ${savedQuestions.length} bilingual questions!`,
        type: 'success',
      });
      setTimeout(() => setImportToast(null), 4000);
    } catch (err: any) {
      setImportToast({
        message: `❌ Failed to import questions: ${err.message}`,
        type: 'error',
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Template Download Handlers
  const downloadCSVTemplate = () => {
    const csvContent =
      'S.No.,Examname,Year,Question(Hindi),Question(english),option_A,option_B,option_C,option_D,answer,explaination,chapterName,repeatedInExams\n' +
      '1,CGPSC PRE,2024,कलचुरी कालीन शासन व्यवस्था में प्रशासनिक प्रमुख को क्या कहा जाता था ?,In Kalchuri administration what was the administrative head called ?,महामात्य (Mahamatya),महापुरोहित (Mahapurohit),महाप्रतिहार (Mahapratihar),महासेनापति (Mahasenapati),A,कलचुरी शासन में राजा के मुख्य प्रशासनिक सलाहकार एवं प्रधान अधिकारी को महामात्य कहा जाता था।,History of Chhattisgarh,CGPSC 2018; CGPSC 2021';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'pyp_questions_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadJSONTemplate = () => {
    const jsonSample = [
      {
        'S.No.': 1,
        'Examname': 'CGPSC PRE',
        'Year': 2024,
        'Question(Hindi)': 'कलचुरी कालीन शासन व्यवस्था में प्रशासनिक प्रमुख को क्या कहा जाता था ?',
        'Question(english)': 'In Kalchuri administration what was the administrative head called ?',
        'option_A': 'महामात्य (Mahamatya)',
        'option_B': 'महापुरोहित (Mahapurohit)',
        'option_C': 'महाप्रतिहार (Mahapratihar)',
        'option_D': 'महासेनापति (Mahasenapati)',
        'answer': 'A',
        'explaination': 'कलचुरी शासन में राजा के मुख्य प्रशासनिक सलाहकार एवं प्रधान अधिकारी को महामात्य कहा जाता था।',
        'chapterName': 'History of Chhattisgarh',
        'repeatedInExams': 'CGPSC 2018, CGPSC 2021'
      }
    ];
    const blob = new Blob([JSON.stringify(jsonSample, null, 2)], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'pyp_questions_template.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 inline-block mb-1">
            Official Exam Archives
          </span>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <span>Previous Year Papers (PYP) Manager</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Archive, index, and convert genuine past exam question papers into live mock test simulations.
          </p>
        </div>

        <div className="flex flex-col items-start lg:items-end gap-2">
          {/* Main Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsGridBuilderOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center space-x-2 transition shadow-lg shadow-blue-500/20 border border-blue-400/30 cursor-pointer"
            >
              <Grid className="w-4 h-4" />
              <span>Interactive Grid Form</span>
            </button>

            <button
              onClick={() => setIsAIExtractorOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center space-x-2 transition shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Smart Ingest</span>
            </button>

            {/* NEW: Import JSON Button */}
            <button
              onClick={() => jsonInputRef.current?.click()}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 hover:border-emerald-500/50 font-bold text-xs sm:text-sm flex items-center space-x-2 transition cursor-pointer"
              title="Upload and bulk import from a JSON file"
            >
              <span className="text-sm">📥</span>
              <span>Import JSON</span>
            </button>

            {/* NEW: Import CSV Button */}
            <button
              onClick={() => csvInputRef.current?.click()}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-400 border border-slate-700 hover:border-teal-500/50 font-bold text-xs sm:text-sm flex items-center space-x-2 transition cursor-pointer"
              title="Upload and bulk import from a CSV file"
            >
              <span className="text-sm">📥</span>
              <span>Import CSV</span>
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs sm:text-sm flex items-center space-x-2 transition cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Quick Index PYP</span>
            </button>
          </div>

          {/* Secondary Template Download Links */}
          <div className="flex items-center space-x-3 text-xs text-slate-400 pr-1 pt-0.5">
            <button
              type="button"
              onClick={downloadCSVTemplate}
              className="hover:text-emerald-400 flex items-center space-x-1.5 transition underline decoration-slate-700 hover:decoration-emerald-400 cursor-pointer"
            >
              <span>📄 Download CSV Template</span>
            </button>
            <span className="text-slate-700">•</span>
            <button
              type="button"
              onClick={downloadJSONTemplate}
              className="hover:text-emerald-400 flex items-center space-x-1.5 transition underline decoration-slate-700 hover:decoration-emerald-400 cursor-pointer"
            >
              <span>📄 Download JSON Template</span>
            </button>
          </div>
        </div>
      </div>

      {/* Import Toast / Status Notification */}
      {importToast && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between space-x-2 transition-all shadow-md ${
            importToast.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          <div className="flex items-center space-x-2">
            {importToast.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{importToast.message}</span>
          </div>
          <button
            onClick={() => setImportToast(null)}
            className="text-slate-400 hover:text-white text-xs px-2 py-0.5 rounded hover:bg-slate-800 transition"
          >
            Dismiss
          </button>
        </div>
      )}

      {convertedNotice && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-semibold flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>
            <strong>{convertedNotice}</strong> has been converted into an active live mock test! Candidates can now practice it in real exam mode.
          </span>
        </div>
      )}

      {/* Papers Listing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {uniquePapers.map(paper => {
          const linkedTest = tests.find(t =>
            (paper.linkedMockTestId && t.id === paper.linkedMockTestId) ||
            (paper.testId && t.id === paper.testId) ||
            t.id === `test-from-${paper.id}` ||
            getBaseTestTitle(t.title) === getBaseTestTitle(paper.title)
          );
          const isTestPublished = linkedTest ? linkedTest.isPublished !== false : false;

          return (
            <div
              key={paper.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-emerald-400 border border-slate-700">
                      {paper.examCategory}
                    </span>
                    {linkedTest ? (
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center space-x-1 ${
                          isTestPublished
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isTestPublished ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                        <span>{isTestPublished ? 'Live in Catalog' : 'Draft / Unpublished'}</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800/80 text-slate-400 border border-slate-700">
                        Archived Only
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 flex items-center space-x-1 font-semibold">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Exam Year: {paper.year}</span>
                  </span>
                </div>

                <h3 className="text-base font-bold text-white">{paper.title}</h3>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{paper.paperSummary}</p>

                {/* Specs */}
                <div className="mt-4 grid grid-cols-3 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Questions</span>
                    <span className="font-bold text-white">{paper.totalQuestions}</span>
                  </div>
                  <div className="border-x border-slate-700/50">
                    <span className="text-[10px] text-slate-400 block">Duration</span>
                    <span className="font-bold text-emerald-400">{paper.durationMinutes}m</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Negative</span>
                    <span className="font-bold text-rose-400">{paper.negativeMarkingRatio}</span>
                  </div>
                </div>

                {/* Subject Breakdown */}
                <div className="mt-3 text-xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Subject Weightages
                  </span>
                  {paper.subjectsWeightage.slice(0, 3).map((sw, i) => (
                    <div key={i} className="flex justify-between text-[11px] text-slate-300">
                      <span>{sw.subject}</span>
                      <span className="text-emerald-400 font-mono font-bold">{sw.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => onDeletePYP(paper.id)}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition text-xs flex items-center space-x-1 cursor-pointer"
                  title="Remove paper from repository"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Remove</span>
                </button>

                <div className="flex items-center space-x-2">
                  {onStartTest && (
                    <button
                      type="button"
                      onClick={() => {
                        const testToRun: MockTest = linkedTest || {
                          id: paper.linkedMockTestId || `test-from-${paper.id}`,
                          title: `${paper.title} (Official Simulation)`,
                          category: paper.examCategory,
                          description: paper.paperSummary,
                          durationMinutes: paper.durationMinutes,
                          questionCount: paper.totalQuestions,
                          marksPerQuestion: paper.examCategory === 'CGPSC' ? 2.0 : 1.0,
                          negativeMarksPerQuestion: paper.examCategory === 'CGPSC' ? 0.667 : 0.333,
                          sections: [{ id: `sec-${paper.id}`, name: 'Official Paper', questionIds: paper.linkedQuestionIds || [] }],
                          attemptsCount: 0,
                          isPublished: true,
                          createdAt: new Date().toISOString(),
                        };
                        onStartTest(testToRun);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black transition flex items-center space-x-1 shadow-sm cursor-pointer active:scale-95"
                      title="Start Live Timed Exam for this Paper"
                    >
                      <Play className="w-3.5 h-3.5 fill-slate-950" />
                      <span>Give Test</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (linkedTest && onTogglePublishTest) {
                        onTogglePublishTest(linkedTest.id);
                      } else {
                        handleConvert(paper);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border ${
                      isTestPublished
                        ? 'bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border-slate-700'
                        : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
                    }`}
                    title={isTestPublished ? 'Hide from student catalog' : 'Publish to student catalog'}
                  >
                    {isTestPublished ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                        <span>Unpublish</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Publish Test</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add PYP Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl my-8 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Index New Previous Year Paper</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Official Paper Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CGSSB Hostel Superintendent 2022 Official Paper"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Exam Authority</label>
                  <select
                    value={formData.examCategory}
                    onChange={e => setFormData({ ...formData, examCategory: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                  >
                    <option value="CGSSB">CGSSB</option>
                    <option value="CGPSC">CGPSC</option>
                    <option value="SWAMI_ATMANAND">Swami Atmanand</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Exam Year</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) || 2024 })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Duration (Min)</label>
                  <input
                    type="number"
                    value={formData.durationMinutes}
                    onChange={e => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) || 120 })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Paper Summary & Curriculum Trend</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Official notification summary, syllabus coverage, and cut-off highlights..."
                  value={formData.paperSummary}
                  onChange={e => setFormData({ ...formData, paperSummary: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white"
                />
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black"
                >
                  Index & Save Paper
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Grid Builder Modal */}
      {isGridBuilderOpen && (
        <ManualGridBuilder
          onClose={() => setIsGridBuilderOpen(false)}
          onSavePaper={(paper) => {
            onAddPYP({
              title: paper.title,
              examCategory: paper.category === 'CGPSC' ? 'CGPSC' : 'CGSSB',
              year: paper.year,
              totalQuestions: paper.totalQuestions,
              durationMinutes: paper.durationMinutes,
              marks: paper.totalMarks,
              negativeMarkingRatio: paper.category.includes('CGPSC') ? '1/3rd (0.67)' : '1/3rd (0.333)',
              paperSummary: `Comprehensive ${paper.totalQuestions}-question paper aligned with official CG syllabus. Includes full bilingual explanations.`,
              subjectsWeightage: [
                { subject: 'Chhattisgarh General Studies', questionCount: Math.round(paper.totalQuestions * 0.4), percentage: 40 },
                { subject: 'Quantitative Aptitude', questionCount: Math.round(paper.totalQuestions * 0.3), percentage: 30 },
                { subject: 'Computer Knowledge', questionCount: Math.round(paper.totalQuestions * 0.3), percentage: 30 },
              ],
            });
            setIsGridBuilderOpen(false);
            setConvertedNotice(paper.title);
            setTimeout(() => setConvertedNotice(null), 3500);
          }}
          existingQuestions={[]}
        />
      )}

      {/* Gemini AI Smart Ingestion Modal */}
      {isAIExtractorOpen && (
        <AIPYPExtractorModal
          onClose={() => setIsAIExtractorOpen(false)}
          onExtracted={() => {
            setIsAIExtractorOpen(false);
            setIsGridBuilderOpen(true);
          }}
          existingQuestions={[]}
        />
      )}

      {/* Bulk Ingest Preview Modal (JSON & CSV) */}
      <BulkImportPreviewModal
        isOpen={isPreviewModalOpen}
        records={previewQuestions}
        onClose={() => {
          if (!isImporting) {
            setIsPreviewModalOpen(false);
            setPreviewQuestions([]);
          }
        }}
        onConfirm={handleConfirmImport}
        isImporting={isImporting}
      />

      {/* Advanced Question JSON Import Preview Modal */}
      <JsonImportPreviewModal
        isOpen={isAdvancedJsonModalOpen}
        rawJsonData={advancedRawJson}
        mappedQuestions={advancedMappedQuestions}
        onClose={() => {
          if (!isImporting) {
            setIsAdvancedJsonModalOpen(false);
            setAdvancedRawJson([]);
            setAdvancedMappedQuestions([]);
          }
        }}
        onConfirm={handleConfirmAdvancedJsonImport}
        isImporting={isImporting}
      />

      {/* Post-Publish Celebration & Live Test Modal */}
      {publishedSuccess && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700/90 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-white">
                Exam Paper & Mock Test Published!
              </h3>
              <p className="text-xs text-slate-400">
                {publishedSuccess.count} bilingual questions have been saved and indexed with auto-generated unique IDs. You can take this exam immediately in live simulation mode!
              </p>
            </div>

            {/* Exact Preview Card */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4.5 space-y-3 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-emerald-400 border border-slate-700">
                  {publishedSuccess.paper.examCategory}
                </span>
                <span className="text-xs text-slate-400 flex items-center space-x-1 font-semibold">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Exam Year: {publishedSuccess.paper.year}</span>
                </span>
              </div>

              <h4 className="text-sm font-bold text-white leading-snug">
                {publishedSuccess.paper.title}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                {publishedSuccess.paper.paperSummary}
              </p>

              <div className="grid grid-cols-3 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Questions</span>
                  <span className="font-bold text-white">{publishedSuccess.paper.totalQuestions}</span>
                </div>
                <div className="border-x border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Duration</span>
                  <span className="font-bold text-emerald-400">{publishedSuccess.paper.durationMinutes}m</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Negative</span>
                  <span className="font-bold text-rose-400 truncate block px-0.5">{publishedSuccess.paper.negativeMarkingRatio}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              {onStartTest && publishedSuccess.mockTest && (
                <button
                  type="button"
                  onClick={() => {
                    const test = publishedSuccess.mockTest!;
                    setPublishedSuccess(null);
                    onStartTest(test);
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs transition shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>Give Test Now (Start Live Exam Engine)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setPublishedSuccess(null)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
              >
                Done & View in PYP Repository
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
