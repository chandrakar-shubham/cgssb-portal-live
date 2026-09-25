import React, { useState, useDeferredValue, useRef } from 'react';
import Papa from 'papaparse';
import {
  MockTest,
  ExamCategory,
  Question,
  PreviousYearPaper
} from '../types';
import {
  Layers,
  Plus,
  Play,
  Eye,
  EyeOff,
  Trash2,
  Edit3,
  Clock,
  HelpCircle,
  Award,
  Sparkles,
  CheckCircle2,
  Search,
  Filter,
  AlertTriangle,
  Crown,
  Lock,
  Unlock,
  FileJson,
  FileSpreadsheet
} from 'lucide-react';
import { AdminCompleteTestEditorModal } from './AdminCompleteTestEditorModal';
import { BulkImportPreviewModal, IngestionPaperConfig } from './BulkImportPreviewModal';
import { mapRawJsonToQuestion } from '../utils/jsonQuestionMapper';

interface AdminTestCatalogProps {
  tests: MockTest[];
  questions?: Question[];
  onStartTest: (test: MockTest) => void;
  onTogglePublishTest: (testId: string) => void;
  onUpdateTest: (testId: string, updates: Partial<MockTest>) => void;
  onDeleteTest: (testId: string) => void;
  onAddTest: (test: Partial<MockTest>) => void;
  onNavigateToAICreator: () => void;
  onSaveCompletedTest?: (test: MockTest, questions: Question[]) => void;
  onAddPYP?: (pyp: Partial<PreviousYearPaper>) => void;
  onQuestionsAdded?: (questions: Question[]) => void;
  onTestAdded?: (test: MockTest) => void;
}

export const AdminTestCatalog: React.FC<AdminTestCatalogProps> = ({
  tests,
  questions = [],
  onStartTest,
  onTogglePublishTest,
  onUpdateTest,
  onDeleteTest,
  onAddTest,
  onNavigateToAICreator,
  onSaveCompletedTest,
  onAddPYP,
  onQuestionsAdded,
  onTestAdded,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ExamCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [editingTest, setEditingTest] = useState<MockTest | null>(null);
  const [isNewTestModalOpen, setIsNewTestModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<ExamCategory>('CGSSB');
  const [newDuration, setNewDuration] = useState(120);
  const [newMarks, setNewMarks] = useState(1.0);
  const [newNegativeMarks, setNewNegativeMarks] = useState(0.333);

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

      // Create Mock Test representation
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

        if (onTestAdded) {
          onTestAdded(newMockTest);
        } else {
          onAddTest(newMockTest);
        }
      }

      // Create PYP Paper representation
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

        if (onAddPYP) {
          onAddPYP(newPypPaper);
        }
      }

      if (taggedQuestions.length > 0 && onQuestionsAdded) {
        onQuestionsAdded(taggedQuestions);
      }

      setIsPreviewModalOpen(false);
      alert(`✅ Imported "${paperConfig.title}" successfully as ${paperConfig.paperNature === 'mock' ? '🎯 Mock Test' : paperConfig.paperNature === 'pyp' ? '📜 Official PYP' : '⚡ Both (PYP + Mock Test)'}!`);
    } catch (err: any) {
      alert(`❌ Import Failed: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const filteredTests = tests.filter(test => {
    const matchesCategory = selectedCategory === 'ALL' || test.category === selectedCategory;
    const s = deferredSearchQuery.toLowerCase().trim();
    const matchesSearch =
      !s ||
      test.title.toLowerCase().includes(s) ||
      (test.description && test.description.toLowerCase().includes(s));
    return matchesCategory && matchesSearch;
  });

  const handleCreateTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddTest({
      title: newTitle,
      category: newCategory,
      durationMinutes: newDuration,
      marksPerQuestion: newMarks,
      negativeMarksPerQuestion: newNegativeMarks,
      questionCount: 0,
      sections: [{ id: 'sec-1', name: 'General', questionIds: [] }],
      isPublished: true,
    });
    setNewTitle('');
    setIsNewTestModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTest) return;
    onUpdateTest(editingTest.id, {
      title: editingTest.title,
      durationMinutes: editingTest.durationMinutes,
      marksPerQuestion: editingTest.marksPerQuestion,
      negativeMarksPerQuestion: editingTest.negativeMarksPerQuestion,
    });
    setEditingTest(null);
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
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-black text-white tracking-tight">Mock Test Management Catalog</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {tests.length} Total Tests
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Control live publishing status, duration limits, marks, and negative marking ratios for student candidate portals.
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
            onClick={onNavigateToAICreator}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-purple-600/20 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Mock Creator</span>
          </button>
          <button
            onClick={() => setIsNewTestModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-emerald-600/20 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Mock Test</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Search className="w-4 h-4 text-slate-500 ml-1" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search tests by title or exam..."
            className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-full sm:w-64"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {(['ALL', 'CGSSB', 'CGPSC', 'SWAMI_ATMANAND', 'CENTRAL_EXAMS'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {cat === 'ALL' ? 'All Exams' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Test List Table / Cards */}
      <div className="grid grid-cols-1 gap-3">
        {filteredTests.map(test => {
          const isPublished = test.isPublished !== false;
          return (
            <div
              key={test.id}
              className={`p-4 rounded-2xl border transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                isPublished
                  ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  : 'bg-slate-900/40 border-slate-800/60 opacity-80'
              }`}
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    {test.category}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center space-x-1 ${
                      isPublished
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {isPublished ? <CheckCircle2 className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    <span>{isPublished ? 'Live on Student Portal' : 'Unpublished (Draft)'}</span>
                  </span>
                  {test.isPro ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center space-x-1">
                      <Crown className="w-3 h-3 fill-amber-400" />
                      <span>PRO PASS ONLY</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      FREE STARTER
                    </span>
                  )}
                  <span className="text-[11px] font-mono text-slate-500">ID: {test.id}</span>
                </div>

                <h3 className="text-base font-bold text-white">{test.title}</h3>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{test.durationMinutes} Mins</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                    <span>{test.questionCount || 0} Questions</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Award className="w-3.5 h-3.5 text-emerald-400" />
                    <span>+{test.marksPerQuestion || 1} / -{test.negativeMarksPerQuestion?.toFixed(2) || '0.33'}</span>
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 shrink-0 self-end md:self-auto">
                <button
                  onClick={() => onStartTest(test)}
                  title="Preview / Take Exam"
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Preview</span>
                </button>

                <button
                  onClick={() => onTogglePublishTest(test.id)}
                  title={isPublished ? 'Unpublish from Student Portal' : 'Publish to Student Portal'}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer ${
                    isPublished
                      ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30'
                      : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {isPublished ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{isPublished ? 'Unpublish' : 'Publish'}</span>
                </button>

                {/* 1-Click Pro Pass Monetization Toggle */}
                <button
                  onClick={() => onUpdateTest(test.id, { isPro: !test.isPro })}
                  title={test.isPro ? 'Demote to Free Starter Test' : 'Lock under CG Exam Pass Pro'}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer ${
                    test.isPro
                      ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  }`}
                >
                  <Crown className={`w-3.5 h-3.5 ${test.isPro ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
                  <span>{test.isPro ? 'Pass Pro Active' : 'Make Pass Pro'}</span>
                </button>

                <button
                  onClick={() => setEditingTest(test)}
                  title="Completely Edit Published Test & Questions"
                  className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Edit Test</span>
                </button>

                <button
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete test "${test.title}"?`)) {
                      onDeleteTest(test.id);
                    }
                  }}
                  title="Delete Test"
                  className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredTests.length === 0 && (
          <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-slate-800">
            <Layers className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400">No mock tests found matching your filter criteria.</p>
          </div>
        )}
      </div>

      {/* Complete Test & Questions Editor Modal */}
      {editingTest && (
        <AdminCompleteTestEditorModal
          test={editingTest}
          allQuestions={questions}
          isOpen={Boolean(editingTest)}
          onClose={() => setEditingTest(null)}
          onSaveTest={(updatedTest, updatedQuestions) => {
            onUpdateTest(updatedTest.id, updatedTest);
            if (onSaveCompletedTest) {
              onSaveCompletedTest(updatedTest, updatedQuestions);
            }
            setEditingTest(null);
          }}
        />
      )}

      {/* New Test Modal */}
      {isNewTestModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Create New Mock Test</h3>
            <form onSubmit={handleCreateTest} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Test Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. CGSSB Hostel Warden Mock Test 2024"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value as ExamCategory)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                >
                  <option value="CGSSB">CGSSB (Vyapam)</option>
                  <option value="CGPSC">CGPSC (Civil Services)</option>
                  <option value="SWAMI_ATMANAND">Swami Atmanand</option>
                  <option value="CENTRAL_EXAMS">Central Exams</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Duration (Min)</label>
                  <input
                    type="number"
                    value={newDuration}
                    onChange={e => setNewDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Marks</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newMarks}
                    onChange={e => setNewMarks(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Negative</label>
                  <input
                    type="number"
                    step="0.001"
                    value={newNegativeMarks}
                    onChange={e => setNewNegativeMarks(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewTestModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Create Mock Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
