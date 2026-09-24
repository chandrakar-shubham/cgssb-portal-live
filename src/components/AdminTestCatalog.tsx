import React, { useState } from 'react';
import {
  MockTest,
  ExamCategory,
  Question
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
  Unlock
} from 'lucide-react';
import { AdminCompleteTestEditorModal } from './AdminCompleteTestEditorModal';

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
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ExamCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTest, setEditingTest] = useState<MockTest | null>(null);
  const [isNewTestModalOpen, setIsNewTestModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<ExamCategory>('CGSSB');
  const [newDuration, setNewDuration] = useState(120);
  const [newMarks, setNewMarks] = useState(1.0);
  const [newNegativeMarks, setNewNegativeMarks] = useState(0.333);

  const filteredTests = tests.filter(test => {
    const matchesCategory = selectedCategory === 'ALL' || test.category === selectedCategory;
    const matchesSearch = test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (test.description && test.description.toLowerCase().includes(searchQuery.toLowerCase()));
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
    </div>
  );
};
