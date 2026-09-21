import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { ExamCategory, MockTest } from '../types';
import { EXAM_PATTERNS } from '../mockData';
import { deduplicateAndConsolidateTests } from '../utils/testDeduplication';
import {
  Clock,
  Award,
  AlertCircle,
  Play,
  CheckCircle2,
  BookOpen,
  Filter,
  Search,
  Zap,
  Info,
  ChevronRight,
  TrendingUp,
  Target,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
  Plus,
  Layers,
  ShieldCheck,
  Check,
  X
} from 'lucide-react';

interface StudentDashboardProps {
  tests: MockTest[];
  onStartTest: (test: MockTest) => void;
  onSelectCategory: (category: ExamCategory) => void;
  selectedCategory: ExamCategory | 'ALL';
  onUpdateTest?: (testId: string, updates: Partial<MockTest>) => void;
  onDeleteTest?: (testId: string) => void;
  onTogglePublishTest?: (testId: string) => void;
  onDeduplicateTests?: () => void;
  onAddTest?: (newTest: Partial<MockTest>) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  tests,
  onStartTest,
  onSelectCategory,
  selectedCategory,
  onUpdateTest,
  onDeleteTest,
  onTogglePublishTest,
  onDeduplicateTests,
  onAddTest,
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [searchTerm, setSearchTerm] = useState('');
  const [adminPublishFilter, setAdminPublishFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [selectedPatternModal, setSelectedPatternModal] = useState<ExamCategory | null>(null);
  const [editingTest, setEditingTest] = useState<MockTest | null>(null);
  const [isCreatingTest, setIsCreatingTest] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const categories: { id: ExamCategory | 'ALL'; label: string; badge?: string }[] = [
    { id: 'ALL', label: 'All Exams' },
    { id: 'CGSSB', label: 'CGSSB / Vyapam', badge: '100 Qs • +1 • -⅓' },
    { id: 'CGPSC', label: 'CGPSC SSE', badge: '100 Qs • +2 • -⅓' },
    { id: 'SWAMI_ATMANAND', label: 'Swami Atmanand', badge: '100 Qs • +1 • -⅓' },
    { id: 'CENTRAL_EXAMS', label: 'Central (Rail, SSC, Bank)', badge: 'Coming Soon' },
  ];

  // For students: deduplicate automatically and hide drafts
  // For admins: deduplicate or show all tests with draft/published controls
  const processedTests = useMemo(() => {
    return deduplicateAndConsolidateTests(tests);
  }, [tests]);

  const filteredTests = useMemo(() => {
    const listToFilter = isAdmin ? tests : processedTests;
    const seen = new Set<string>();

    return listToFilter.filter(test => {
      if (!test || !test.id) return false;
      if (seen.has(test.id)) return false;
      seen.add(test.id);

      // Student view: only published tests
      if (!isAdmin && test.isPublished === false) return false;

      // Admin filter
      if (isAdmin) {
        if (adminPublishFilter === 'published' && test.isPublished === false) return false;
        if (adminPublishFilter === 'draft' && test.isPublished !== false) return false;
      }

      const matchesCategory = selectedCategory === 'ALL' || test.category === selectedCategory;
      const matchesSearch =
        test.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [tests, processedTests, isAdmin, adminPublishFilter, selectedCategory, searchTerm]);

  // Admin stats
  const totalPublishedCount = useMemo(() => {
    return tests.filter(t => t.isPublished !== false).length;
  }, [tests]);

  const totalDraftCount = useMemo(() => {
    return tests.filter(t => t.isPublished === false).length;
  }, [tests]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-xs shadow-2xl flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ADMIN CONTROL BAR (Only visible to Admin) */}
      {isAdmin && (
        <div className="bg-slate-900 border-2 border-emerald-500/40 rounded-2xl p-4 sm:p-5 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base font-bold text-white">Admin Live Test Catalog</h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Live Control
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Manage published tests, toggle student visibility, eliminate duplicate tests, and edit marking schemes.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Quick Status Stats */}
              <div className="flex items-center space-x-1 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                <span className="text-slate-400">Total:</span>
                <span className="font-bold text-white ml-1">{tests.length}</span>
                <span className="text-slate-600 mx-1.5">•</span>
                <span className="text-emerald-400">Published:</span>
                <span className="font-bold text-emerald-300 ml-1">{totalPublishedCount}</span>
                <span className="text-slate-600 mx-1.5">•</span>
                <span className="text-amber-400">Drafts:</span>
                <span className="font-bold text-amber-300 ml-1">{totalDraftCount}</span>
              </div>

              {/* Deduplicate Action */}
              {onDeduplicateTests && (
                <button
                  type="button"
                  onClick={() => {
                    onDeduplicateTests();
                    showToast('Cleaned duplicate tests and synced catalog!');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                  title="Consolidates duplicate test versions (e.g. Real Exam Simulation vs Official Mock Test)"
                >
                  <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                  <span>Consolidate Duplicates</span>
                </button>
              )}

              {/* Add New Mock Test */}
              <button
                type="button"
                onClick={() => setIsCreatingTest(true)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition flex items-center space-x-1.5 shadow-md cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Mock Test</span>
              </button>
            </div>
          </div>

          {/* Admin Publish Filter Tabs */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center space-x-2 text-xs">
            <span className="text-slate-400 font-semibold mr-1">Status Filter:</span>
            <button
              onClick={() => setAdminPublishFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition ${
                adminPublishFilter === 'all'
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({tests.length})
            </button>
            <button
              onClick={() => setAdminPublishFilter('published')}
              className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center space-x-1 ${
                adminPublishFilter === 'published'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Published Only ({totalPublishedCount})</span>
            </button>
            <button
              onClick={() => setAdminPublishFilter('draft')}
              className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center space-x-1 ${
                adminPublishFilter === 'draft'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-amber-400'
              }`}
            >
              <EyeOff className="w-3 h-3" />
              <span>Drafts / Hidden ({totalDraftCount})</span>
            </button>
          </div>
        </div>
      )}

      {/* Student Profile & Quick Stats Bar (Only shown for non-admin) */}
      {!isAdmin && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-xl shadow-inner shrink-0">
                {user?.name ? user.name[0].toUpperCase() : 'A'}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    Welcome back, {user?.name || 'Aspirant'}
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Target: CG State Exams 2024-25
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Practice Chhattisgarh Vyapam, CGPSC SSE Prelims & Swami Atmanand recruitments.
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-5 shrink-0">
              <div className="bg-slate-950/60 rounded-xl p-2 sm:p-2.5 border border-slate-800/80 text-center">
                <span className="text-[10px] text-slate-400 block font-medium">Credits</span>
                <span className="text-sm sm:text-base font-black text-emerald-400 flex items-center justify-center space-x-1 mt-0.5">
                  <Zap className="w-3 h-3 fill-emerald-400" />
                  <span>{user?.credits || 0}</span>
                </span>
              </div>
              <div className="bg-slate-950/60 rounded-xl p-2 sm:p-2.5 border border-slate-800/80 text-center">
                <span className="text-[10px] text-slate-400 block font-medium">Practiced</span>
                <span className="text-sm sm:text-base font-black text-white flex items-center justify-center space-x-1 mt-0.5">
                  <Target className="w-3 h-3 text-blue-400" />
                  <span>4</span>
                </span>
              </div>
              <div className="bg-slate-950/60 rounded-xl p-2 sm:p-2.5 border border-slate-800/80 text-center">
                <span className="text-[10px] text-slate-400 block font-medium">Accuracy</span>
                <span className="text-sm sm:text-base font-black text-teal-300 flex items-center justify-center space-x-1 mt-0.5">
                  <TrendingUp className="w-3 h-3 text-teal-400" />
                  <span>88.5%</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Exam Categories Navigation Tabs */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-bold text-white flex items-center space-x-2">
            <span>Official Exam Portals & Mock Tests</span>
          </h2>
          <span className="text-xs text-slate-400 hidden sm:inline">Filter by target authority</span>
        </div>

        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {categories.map(cat => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id as any)}
                className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                  isSelected
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <span>{cat.label}</span>
                {cat.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                      isSelected
                        ? 'bg-slate-950/20 text-slate-950'
                        : cat.badge === 'Coming Soon'
                        ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {cat.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Category Pattern Guide Banner */}
      {selectedCategory !== 'ALL' && EXAM_PATTERNS[selectedCategory as ExamCategory] && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start space-x-2.5">
            <div className="p-1.5 bg-emerald-500/15 rounded-lg text-emerald-400 mt-0.5 shrink-0">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white text-xs sm:text-sm">
                  {EXAM_PATTERNS[selectedCategory as ExamCategory].name}
                </span>
                <span className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px] text-emerald-300 font-semibold border border-slate-700">
                  Official Pattern
                </span>
              </div>
              <p className="text-slate-300 mt-1 leading-relaxed text-xs">
                {EXAM_PATTERNS[selectedCategory as ExamCategory].description}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedPatternModal(selectedCategory as ExamCategory)}
            className="whitespace-nowrap px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold text-xs transition border border-slate-700 shrink-0"
          >
            Syllabus & Marking
          </button>
        </div>
      )}

      {/* Search & Filter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search mock tests..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500/60"
          />
        </div>
        <div className="text-xs text-slate-400 font-medium">
          Showing <span className="text-emerald-400 font-bold">{filteredTests.length}</span> tests ready for practice
        </div>
      </div>

      {/* Mock Tests Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {filteredTests.map(test => {
          const pattern = EXAM_PATTERNS[test.category];
          const isPublished = test.isPublished !== false;

          return (
            <div
              key={test.id}
              className={`bg-slate-900/90 border rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-lg hover:shadow-emerald-950/20 group relative ${
                isAdmin && !isPublished
                  ? 'border-amber-500/40 bg-slate-900/60'
                  : 'border-slate-800 hover:border-emerald-500/40'
              }`}
            >
              <div>
                {/* Card Top Category Pill & Questions Count */}
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center space-x-1.5">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-950 border border-slate-800 text-emerald-400">
                      {pattern?.shortName || test.category}
                    </span>
                    {/* Admin Status Pill */}
                    {isAdmin && (
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center space-x-1 ${
                          isPublished
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isPublished ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                        <span>{isPublished ? 'Published' : 'Draft'}</span>
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{test.durationMinutes} Mins</span>
                  </span>
                </div>

                <h3 className="font-bold text-sm sm:text-base text-white group-hover:text-emerald-300 transition-colors leading-snug">
                  {test.title}
                </h3>

                <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                  {test.description}
                </p>

                {/* Exam Marking Spec Pill Box */}
                <div className="mt-3.5 bg-slate-950/70 rounded-xl p-2 border border-slate-850 grid grid-cols-3 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Questions</span>
                    <span className="font-bold text-white text-xs">{test.questionCount} Qs</span>
                  </div>
                  <div className="border-x border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-medium">Correct</span>
                    <span className="font-bold text-emerald-400 text-xs">+{test.marksPerQuestion}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Negative</span>
                    <span className="font-bold text-rose-400 text-xs">
                      -{test.negativeMarksPerQuestion.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Section breakdown tags */}
                <div className="mt-2.5 flex flex-wrap gap-1">
                  {test.sections.map(sec => (
                    <span
                      key={sec.id}
                      className="px-2 py-0.5 rounded bg-slate-800/70 text-[10px] text-slate-300 font-medium"
                    >
                      {sec.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    <span className="text-slate-300 font-semibold">{test.attemptsCount.toLocaleString()}</span> attempted
                  </span>

                  {/* ADMIN QUICK ACTIONS ROW */}
                  {isAdmin ? (
                    <div className="flex items-center space-x-1.5">
                      {/* Toggle Publish / Unpublish */}
                      {onTogglePublishTest && (
                        <button
                          type="button"
                          onClick={() => {
                            onTogglePublishTest(test.id);
                            showToast(isPublished ? `Unpublished "${test.title}"` : `Published "${test.title}" to students!`);
                          }}
                          className={`p-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer flex items-center space-x-1 ${
                            isPublished
                              ? 'bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border-slate-700'
                              : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
                          }`}
                          title={isPublished ? 'Unpublish test (hide from students)' : 'Publish test (make visible to students)'}
                        >
                          {isPublished ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          <span className="text-[10px] hidden sm:inline">{isPublished ? 'Unpublish' : 'Publish'}</span>
                        </button>
                      )}

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => setEditingTest(test)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs transition cursor-pointer"
                        title="Edit Test Settings"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button */}
                      {onDeleteTest && (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(test.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 text-xs transition cursor-pointer"
                          title="Delete Mock Test"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ) : null}
                </div>

                {/* Primary Start / Test Button */}
                <button
                  onClick={() => onStartTest(test)}
                  className="w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center space-x-1.5 transition shadow-sm active:scale-95 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  <span>{isAdmin ? 'Test Exam Simulation' : 'Start Test'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3 text-rose-400">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">Delete Mock Test</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently remove this test from the catalog? This will delete the mock test entry and student test listings.
            </p>
            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs hover:bg-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (onDeleteTest && deleteConfirmId) {
                    onDeleteTest(deleteConfirmId);
                    showToast('Mock test deleted successfully.');
                  }
                  setDeleteConfirmId(null);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Create Test Modal */}
      {(editingTest || isCreatingTest) && (
        <EditTestModal
          test={editingTest}
          isOpen={!!(editingTest || isCreatingTest)}
          onClose={() => {
            setEditingTest(null);
            setIsCreatingTest(false);
          }}
          onSave={updates => {
            if (editingTest && onUpdateTest) {
              onUpdateTest(editingTest.id, updates);
              showToast(`Updated "${updates.title || editingTest.title}"`);
            } else if (isCreatingTest && onAddTest) {
              onAddTest(updates);
              showToast(`Created new mock test "${updates.title}"`);
            }
            setEditingTest(null);
            setIsCreatingTest(false);
          }}
        />
      )}

      {/* Central Exams Coming Soon Preview Section */}
      {selectedCategory === 'CENTRAL_EXAMS' && (
        <div className="mt-8 bg-gradient-to-br from-amber-950/30 via-slate-800 to-slate-900 border border-amber-600/40 rounded-2xl p-6 text-center max-w-2xl mx-auto shadow-xl">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3">
            <Award className="w-6 h-6" />
          </div>
          <span className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs font-bold border border-amber-500/40 inline-block mb-2">
            In Active Development
          </span>
          <h3 className="text-lg font-bold text-white">Central Competitive Exams (Railway, SSC, Banking, UPSC)</h3>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            The curriculum setters are indexing previous 10 years question banks for RRB NTPC, SSC CGL Tier 1 & 2, IBPS PO/Clerk, and UPSC CSE Prelims. Full mock test series will launch shortly.
          </p>
          <div className="mt-4 flex justify-center space-x-2">
            <button
              onClick={() => onSelectCategory('CGSSB')}
              className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 transition"
            >
              Practice CGSSB Tests Now
            </button>
          </div>
        </div>
      )}

      {/* Pattern Modal */}
      {selectedPatternModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <span>{EXAM_PATTERNS[selectedPatternModal].name}</span>
              </h3>
              <button
                onClick={() => setSelectedPatternModal(null)}
                className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 bg-slate-800 rounded"
              >
                ✕ Close
              </button>
            </div>
            <div className="space-y-3 text-xs text-slate-300">
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <span className="text-slate-400 block font-bold mb-1">Standard Specifications</span>
                <p>Questions: {EXAM_PATTERNS[selectedPatternModal].totalQuestions} Questions</p>
                <p>Marks per Correct: +{EXAM_PATTERNS[selectedPatternModal].marksPerCorrect}</p>
                <p>Negative Penalty: -{EXAM_PATTERNS[selectedPatternModal].negativeMarksPerWrong} marks</p>
                <p>Duration: {EXAM_PATTERNS[selectedPatternModal].durationMinutes} Minutes</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface EditTestModalProps {
  test: MockTest | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<MockTest>) => void;
}

const EditTestModal: React.FC<EditTestModalProps> = ({ test, isOpen, onClose, onSave }) => {
  const [title, setTitle] = useState(test?.title || '');
  const [category, setCategory] = useState<ExamCategory>(test?.category || 'CGSSB');
  const [description, setDescription] = useState(test?.description || '');
  const [durationMinutes, setDurationMinutes] = useState(test?.durationMinutes || 120);
  const [questionCount, setQuestionCount] = useState(test?.questionCount || 100);
  const [marksPerQuestion, setMarksPerQuestion] = useState(test?.marksPerQuestion || 1.0);
  const [negativeMarksPerQuestion, setNegativeMarksPerQuestion] = useState(test?.negativeMarksPerQuestion || 0.333);
  const [isPublished, setIsPublished] = useState(test?.isPublished !== false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Edit3 className="w-4 h-4 text-emerald-400" />
            <span>{test ? 'Edit Mock Test' : 'Create New Mock Test'}</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xs font-bold">
            ✕
          </button>
        </div>

        <form
          onSubmit={e => {
            e.preventDefault();
            onSave({
              title,
              category,
              description,
              durationMinutes: Number(durationMinutes),
              questionCount: Number(questionCount),
              marksPerQuestion: Number(marksPerQuestion),
              negativeMarksPerQuestion: Number(negativeMarksPerQuestion),
              isPublished,
            });
          }}
          className="space-y-3.5 text-xs"
        >
          <div>
            <label className="block text-slate-300 font-bold mb-1">Test Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. CGPSC State Service Prelims Paper-I (General Studies) 2024"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-bold mb-1">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as ExamCategory)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
              >
                <option value="CGSSB">CGSSB / Vyapam</option>
                <option value="CGPSC">CGPSC SSE</option>
                <option value="SWAMI_ATMANAND">Swami Atmanand</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 font-bold mb-1">Duration (Mins)</label>
              <input
                type="number"
                value={durationMinutes}
                onChange={e => setDurationMinutes(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 font-bold mb-1">Questions</label>
              <input
                type="number"
                value={questionCount}
                onChange={e => setQuestionCount(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-bold mb-1">Marks per Q</label>
              <input
                type="number"
                step="0.1"
                value={marksPerQuestion}
                onChange={e => setMarksPerQuestion(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-bold mb-1">Negative Penalty</label>
              <input
                type="number"
                step="0.001"
                value={negativeMarksPerQuestion}
                onChange={e => setNegativeMarksPerQuestion(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
            />
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-white font-bold block">Published Status</span>
              <span className="text-[11px] text-slate-400">
                When enabled, students can see and practice this mock test.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsPublished(!isPublished)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center space-x-1.5 ${
                isPublished
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {isPublished ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
              <span>{isPublished ? 'Published (Live)' : 'Draft (Hidden)'}</span>
            </button>
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

