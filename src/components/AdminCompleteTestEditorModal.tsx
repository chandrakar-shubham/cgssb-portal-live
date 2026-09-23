import React, { useState, useMemo } from 'react';
import {
  MockTest,
  Question,
  ExamCategory,
  QuestionType,
  QuestionOption
} from '../types';
import {
  X,
  Save,
  CheckCircle2,
  Trash2,
  Edit3,
  Plus,
  Search,
  Filter,
  Eye,
  EyeOff,
  Clock,
  Award,
  BookOpen,
  HelpCircle,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Table,
  Lightbulb,
  SplitSquareVertical,
  ArrowRight
} from 'lucide-react';
import { extractStatementsFromStem } from '../utils/statementParser';

/**
 * Resolves question type by inspecting both explicit type and contents (matching columns, assertion/reason, statements)
 */
export function getEffectiveQuestionType(q: Question): QuestionType {
  const colA = q.columnA || (q as any).column1 || (q as any).list1 || (q as any).listA || (q as any).column_a;
  const colB = q.columnB || (q as any).column2 || (q as any).list2 || (q as any).listB || (q as any).column_b;
  if ((Array.isArray(colA) && colA.length > 0) || (Array.isArray(colB) && colB.length > 0)) {
    return 'matching';
  }

  const stem = `${q.question || ''} ${q.questionHindi || ''} ${q.questionText || ''}`.toLowerCase();
  if (
    q.questionType === 'assertion_reason' ||
    q.type === 'assertion_reason' ||
    Boolean(q.assertion || q.reason || q.assertionHindi || q.reasonHindi) ||
    (stem.includes('assertion') && stem.includes('reason')) ||
    (stem.includes('अभिकथन') && stem.includes('कारण')) ||
    stem.includes('labelled as assertion') ||
    stem.includes('labelled as reason')
  ) {
    return 'assertion_reason';
  }

  if (
    q.questionType === 'matching' ||
    q.type === 'matching' ||
    stem.includes('match the') ||
    stem.includes('सुमेलित') ||
    stem.includes('list-i') ||
    stem.includes('सूची-i') ||
    stem.includes('list i') ||
    stem.includes('सूची i')
  ) {
    return 'matching';
  }

  const parsed = extractStatementsFromStem(q.question || q.questionHindi || '');
  if (parsed.hasSegments || (Array.isArray(q.statements) && q.statements.length > 0) || q.questionType === 'multi_statement' || q.type === 'multi_statement') {
    return 'multi_statement';
  }

  return (q.questionType || q.type || 'mcq') as QuestionType;
}

/**
 * Normalizes Column A and Column B from any aliases/structures into clean arrays of { id, text, textHindi }
 */
export function getNormalizedColumns(q: Question) {
  const rawColA = q.columnA || (q as any).column1 || (q as any).list1 || (q as any).listA || (q as any).column_a || [];
  const rawColB = q.columnB || (q as any).column2 || (q as any).list2 || (q as any).listB || (q as any).column_b || [];

  const parseCol = (items: any[], defaultPrefix: '1' | 'A') => {
    if (!Array.isArray(items)) return [];
    return items.map((item, idx) => {
      if (typeof item === 'string') {
        const id = defaultPrefix === '1' ? String(idx + 1) : String.fromCharCode(65 + idx);
        return { id, text: item, textHindi: item };
      }
      return {
        id: String(item.id || (defaultPrefix === '1' ? idx + 1 : String.fromCharCode(65 + idx))),
        text: String(item.text || item.textEnglish || item.title || ''),
        textHindi: String(item.textHindi || item.text || item.textEnglish || ''),
      };
    });
  };

  return {
    colA: parseCol(rawColA, '1'),
    colB: parseCol(rawColB, 'A'),
  };
}

/**
 * Normalizes Assertion and Reason fields with fallback to stem regex parsing
 */
export function getNormalizedAssertionReason(q: Question) {
  let assertionEn = (q.assertion || (q as any).assertion_en || (q as any).Assertion || '').trim();
  let assertionHi = (q.assertionHindi || (q as any).assertion_hi || (q as any)['अभिकथन'] || assertionEn).trim();
  let reasonEn = (q.reason || (q as any).reason_en || (q as any).Reason || '').trim();
  let reasonHi = (q.reasonHindi || (q as any).reason_hi || (q as any)['कारण'] || reasonEn).trim();

  // If not present in fields, try extracting from stem
  if (!assertionEn && !reasonEn) {
    const combined = `${q.question || ''}\n${q.questionHindi || ''}`;
    const match = combined.match(/(?:Assertion|अभिकथन)\s*[\(\[]A[\)\]]?[:\s]+(.*?)(?:Reason|कारण)\s*[\(\[]R[\)\]]?[:\s]+(.*)/is);
    if (match) {
      assertionEn = match[1].trim();
      reasonEn = match[2].trim();
      if (!assertionHi) assertionHi = assertionEn;
      if (!reasonHi) reasonHi = reasonEn;
    }
  }

  return { assertionEn, assertionHi, reasonEn, reasonHi };
}

/**
 * Normalizes Multi-Statement segments with fallback to stem extraction
 */
export function getNormalizedStatements(q: Question) {
  if (Array.isArray(q.statements) && q.statements.length > 0) {
    return {
      hasStatements: true,
      intro: '',
      statements: q.statements.map((s, idx) => ({
        id: String(s.id || s.label || idx + 1),
        label: String(s.label || s.id || idx + 1),
        text: String(s.text || (typeof s === 'string' ? s : '')),
        textHindi: String(s.textHindi || s.text || ''),
      })),
    };
  }

  const parsedEn = extractStatementsFromStem(q.question || '');
  if (parsedEn.hasSegments && parsedEn.segments.length > 0) {
    const parsedHi = q.questionHindi ? extractStatementsFromStem(q.questionHindi) : null;
    return {
      hasStatements: true,
      intro: parsedEn.intro,
      statements: parsedEn.segments.map((seg, idx) => ({
        id: seg.id,
        label: seg.label,
        text: seg.text,
        textHindi: parsedHi?.segments[idx]?.text || seg.text,
      })),
    };
  }

  return { hasStatements: false, intro: '', statements: [] };
}

interface AdminCompleteTestEditorModalProps {
  test: MockTest;
  allQuestions: Question[];
  isOpen: boolean;
  onClose: () => void;
  onSaveTest: (updatedTest: MockTest, updatedQuestions: Question[]) => void;
}

export const AdminCompleteTestEditorModal: React.FC<AdminCompleteTestEditorModalProps> = ({
  test,
  allQuestions,
  isOpen,
  onClose,
  onSaveTest,
}) => {
  // Active Tab: 'config' | 'questions' | 'add_question'
  const [activeTab, setActiveTab] = useState<'config' | 'questions' | 'add_question'>('config');

  // Test Config State
  const [title, setTitle] = useState(test.title || '');
  const [authority, setAuthority] = useState(test.authority || 'CGSSB');
  const [category, setCategory] = useState<ExamCategory>(test.category || 'CGSSB');
  const [postName, setPostName] = useState(test.postName || '');
  const [examName, setExamName] = useState(test.examName || test.title || '');
  const [pypYear, setPypYear] = useState<number>(test.pypYear || new Date().getFullYear());
  const [description, setDescription] = useState(test.description || '');
  const [durationMinutes, setDurationMinutes] = useState(test.durationMinutes || 120);
  const [totalMarks, setTotalMarks] = useState(test.totalMarks || 100);
  const [marksPerQuestion, setMarksPerQuestion] = useState(test.marksPerQuestion || 1.0);
  const [negativeMarksPerQuestion, setNegativeMarksPerQuestion] = useState(test.negativeMarksPerQuestion || 0.25);
  const [passingPercentage, setPassingPercentage] = useState(test.passingPercentage || 40);
  const [isPublished, setIsPublished] = useState(test.isPublished !== false);

  // Local Questions State for this test
  // Match questions by section questionIds first, then fallback to examName, postName, title, or category
  const initialTestQuestions = useMemo(() => {
    const normalizeQ = (rawQ: Question): Question => ({
      ...rawQ,
      question: rawQ.question || rawQ.questionText || (rawQ as any).stem || '',
      questionText: rawQ.questionText || rawQ.question || (rawQ as any).stem || '',
      questionHindi: rawQ.questionHindi || (rawQ as any).hindi || '',
      options: Array.isArray(rawQ.options) ? rawQ.options : [],
      correctOption: rawQ.correctOption || rawQ.correctAnswer || 'A',
      correctAnswer: rawQ.correctAnswer || rawQ.correctOption || 'A',
    });

    const sectionQIds = test.sections?.flatMap(s => s.questionIds) || [];
    if (sectionQIds.length > 0) {
      const idMap = new Map(allQuestions.map(q => [q.id, q]));
      const matched = sectionQIds.map(id => idMap.get(id)).filter(Boolean) as Question[];
      if (matched.length > 0) return matched.map(normalizeQ);
    }

    const testTitleLower = (test.title || '').toLowerCase();
    const testExamNameLower = (test.examName || '').toLowerCase();
    const testPostNameLower = (test.postName || '').toLowerCase();

    // Fallback: match by examName or title or pyp appearances
    const examMatches = allQuestions.filter(q => {
      const qExamLower = (q.examName || '').toLowerCase();
      const qPostLower = (q.postName || '').toLowerCase();
      return (
        (qExamLower && (qExamLower === testTitleLower || qExamLower === testExamNameLower)) ||
        (qPostLower && testPostNameLower && qPostLower === testPostNameLower) ||
        (q.pypAppearances && q.pypAppearances.some(p => p.examName.toLowerCase() === testTitleLower || p.examName.toLowerCase() === testExamNameLower))
      );
    });
    if (examMatches.length > 0) return examMatches.map(normalizeQ);

    // Keyword match for English Lecturer if relevant
    if (testTitleLower.includes('lecturer') && testTitleLower.includes('english')) {
      const engLecturerMatches = allQuestions.filter(q => {
        const text = `${q.examName || ''} ${q.subject || ''} ${q.topic || ''} ${q.question || ''}`.toLowerCase();
        return text.includes('english') || text.includes('pedagogy') || text.includes('lecturer');
      });
      if (engLecturerMatches.length > 0) return engLecturerMatches.slice(0, test.questionCount || 50).map(normalizeQ);
    }

    // Fallback: match by category
    const catMatches = allQuestions.filter(q => q.category === test.category);
    if (catMatches.length > 0) return catMatches.slice(0, test.questionCount || 100).map(normalizeQ);

    return allQuestions.slice(0, test.questionCount || 20).map(normalizeQ);
  }, [test, allQuestions]);

  const [testQuestions, setTestQuestions] = useState<Question[]>(initialTestQuestions);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'ALL' | QuestionType>('ALL');
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  // Sync state when test or initialTestQuestions change or modal opens
  React.useEffect(() => {
    if (isOpen) {
      setTestQuestions(initialTestQuestions);
      setTitle(test.title || '');
      setAuthority(test.authority || 'CGSSB');
      setCategory(test.category || 'CGSSB');
      setPostName(test.postName || '');
      setExamName(test.examName || test.title || '');
      setPypYear(test.pypYear || new Date().getFullYear());
      setDescription(test.description || '');
      setDurationMinutes(test.durationMinutes || 120);
      setTotalMarks(test.totalMarks || 100);
      setMarksPerQuestion(test.marksPerQuestion || 1.0);
      setNegativeMarksPerQuestion(test.negativeMarksPerQuestion || 0.25);
      setPassingPercentage(test.passingPercentage || 40);
      setIsPublished(test.isPublished !== false);
    }
  }, [test, initialTestQuestions, isOpen]);

  // New Question Form State
  const [newQStemEn, setNewQStemEn] = useState('');
  const [newQStemHi, setNewQStemHi] = useState('');
  const [newQType, setNewQType] = useState<QuestionType>('mcq');
  const [newQOptAEn, setNewQOptAEn] = useState('');
  const [newQOptAHi, setNewQOptAHi] = useState('');
  const [newQOptBEn, setNewQOptBEn] = useState('');
  const [newQOptBHi, setNewQOptBHi] = useState('');
  const [newQOptCEn, setNewQOptCEn] = useState('');
  const [newQOptCHi, setNewQOptCHi] = useState('');
  const [newQOptDEn, setNewQOptDEn] = useState('');
  const [newQOptDHi, setNewQOptDHi] = useState('');
  const [newQCorrect, setNewQCorrect] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [newQExpEn, setNewQExpEn] = useState('');
  const [newQExpHi, setNewQExpHi] = useState('');
  const [newQAssertionEn, setNewQAssertionEn] = useState('');
  const [newQAssertionHi, setNewQAssertionHi] = useState('');
  const [newQReasonEn, setNewQReasonEn] = useState('');
  const [newQReasonHi, setNewQReasonHi] = useState('');

  if (!isOpen) return null;

  // Filtered list of questions in tab 2
  const filteredQuestions = testQuestions.filter(q => {
    const matchesSearch = !searchQuery.trim() ||
      (q.question && q.question.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (q.questionHindi && q.questionHindi.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (q.questionText && q.questionText.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (q.topic && q.topic.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (q.subject && q.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
      q.id.toLowerCase().includes(searchQuery.toLowerCase());

    const effectiveType = getEffectiveQuestionType(q);
    const matchesType = selectedTypeFilter === 'ALL' || effectiveType === selectedTypeFilter;

    return matchesSearch && matchesType;
  });

  // Handle saving individual question edit
  const handleUpdateQuestion = (qId: string, updates: Partial<Question>) => {
    setTestQuestions(prev => prev.map(q => q.id === qId ? { ...q, ...updates } : q));
  };

  // Handle delete question from test
  const handleDeleteQuestion = (qId: string) => {
    if (confirm('Are you sure you want to remove this question from this mock test?')) {
      setTestQuestions(prev => prev.filter(q => q.id !== qId));
    }
  };

  // Handle add new question to test
  const handleAddNewQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQStemEn.trim() && !newQStemHi.trim()) {
      alert('Please enter question text in English or Hindi');
      return;
    }

    const newQId = `Q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newOptions: QuestionOption[] = [
      { id: 'A', label: 'A', text: newQOptAEn, textHindi: newQOptAHi },
      { id: 'B', label: 'B', text: newQOptBEn, textHindi: newQOptBHi },
      { id: 'C', label: 'C', text: newQOptCEn, textHindi: newQOptCHi },
      { id: 'D', label: 'D', text: newQOptDEn, textHindi: newQOptDHi },
    ];

    const newQuestion: Question = {
      id: newQId,
      uniqueQuestionId: newQId,
      authority,
      category,
      examName: title,
      subject: 'General',
      topic: 'Mock Test',
      difficulty: 'Medium',
      marks: marksPerQuestion,
      negativeMarks: negativeMarksPerQuestion,
      questionType: newQType,
      type: newQType,
      question: newQStemEn || newQStemHi,
      questionHindi: newQStemHi || newQStemEn,
      questionText: newQStemEn || newQStemHi,
      options: newOptions,
      correctOption: newQCorrect,
      correctAnswer: newQCorrect,
      explanation: newQExpEn,
      explanationHindi: newQExpHi,
      assertion: newQType === 'assertion_reason' ? newQAssertionEn : undefined,
      assertionHindi: newQType === 'assertion_reason' ? newQAssertionHi : undefined,
      reason: newQType === 'assertion_reason' ? newQReasonEn : undefined,
      reasonHindi: newQType === 'assertion_reason' ? newQReasonHi : undefined,
    };

    setTestQuestions(prev => [...prev, newQuestion]);
    // Reset form
    setNewQStemEn('');
    setNewQStemHi('');
    setNewQOptAEn('');
    setNewQOptAHi('');
    setNewQOptBEn('');
    setNewQOptBHi('');
    setNewQOptCEn('');
    setNewQOptCHi('');
    setNewQOptDEn('');
    setNewQOptDHi('');
    setNewQExpEn('');
    setNewQExpHi('');
    setNewQAssertionEn('');
    setNewQAssertionHi('');
    setNewQReasonEn('');
    setNewQReasonHi('');
    setActiveTab('questions');
  };

  // Handle final save of entire test and questions
  const handleSaveAll = () => {
    const updatedSections = [
      {
        id: test.sections?.[0]?.id || `sec-${test.id}`,
        name: test.sections?.[0]?.name || 'Complete Test Paper',
        questionIds: testQuestions.map(q => q.id),
      }
    ];

    const updatedTest: MockTest = {
      ...test,
      title,
      authority,
      category,
      postName,
      examName,
      pypYear,
      description,
      durationMinutes: Number(durationMinutes),
      totalMarks: Number(totalMarks),
      marksPerQuestion: Number(marksPerQuestion),
      negativeMarksPerQuestion: Number(negativeMarksPerQuestion),
      passingPercentage: Number(passingPercentage),
      questionCount: testQuestions.length,
      isPublished,
      sections: updatedSections,
    };

    onSaveTest(updatedTest, testQuestions);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-hidden">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black text-white tracking-tight">
                  Complete Test & Question Editor
                </h2>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                  isPublished
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                }`}>
                  {isPublished ? '● Published (Live)' : '○ Draft (Hidden)'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Editing: <span className="text-slate-200 font-semibold">{test.title}</span> • {testQuestions.length} Questions
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsPublished(prev => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 border cursor-pointer ${
                isPublished
                  ? 'bg-emerald-500/20 hover:bg-amber-500/20 text-emerald-300 hover:text-amber-300 border-emerald-500/40'
                  : 'bg-slate-800 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 border-slate-700'
              }`}
            >
              {isPublished ? (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>Make Draft</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Publish Live</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <button
            onClick={() => setActiveTab('config')}
            className={`py-3 px-4 text-xs font-bold transition border-b-2 flex items-center space-x-2 cursor-pointer ${
              activeTab === 'config'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>1. Test Parameters & Scoring</span>
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={`py-3 px-4 text-xs font-bold transition border-b-2 flex items-center space-x-2 cursor-pointer ${
              activeTab === 'questions'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>2. Test Questions ({testQuestions.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('add_question')}
            className={`py-3 px-4 text-xs font-bold transition border-b-2 flex items-center space-x-2 cursor-pointer ${
              activeTab === 'add_question'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>3. Add New Question</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* TAB 1: TEST CONFIGURATION & PARAMETERS */}
          {activeTab === 'config' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>General Test Identification</span>
                </h3>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Test Title <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. CG Lecturer English 2026"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white font-semibold focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Authority / Board</label>
                    <select
                      value={authority}
                      onChange={e => setAuthority(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="CGSSB">CGSSB (Vyapam)</option>
                      <option value="CGPSC">CGPSC (Civil Services)</option>
                      <option value="Swami Atmanand">Swami Atmanand</option>
                      <option value="Central Exams">Central Exams</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Exam Category</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value as ExamCategory)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="CGSSB">CGSSB</option>
                      <option value="CGPSC">CGPSC</option>
                      <option value="SWAMI_ATMANAND">SWAMI ATMANAND</option>
                      <option value="CENTRAL_EXAMS">CENTRAL EXAMS</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Examination Year</label>
                    <input
                      type="number"
                      value={pypYear}
                      onChange={e => setPypYear(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Post / Subject</label>
                    <input
                      type="text"
                      value={postName}
                      onChange={e => setPostName(e.target.value)}
                      placeholder="e.g. Lecturer English / Hostel Warden"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Exam Full Name</label>
                    <input
                      type="text"
                      value={examName}
                      onChange={e => setExamName(e.target.value)}
                      placeholder="e.g. CG Lecturer English Exam 2026"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Description & Candidate Instructions</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Instructions shown to candidates before beginning the exam..."
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white leading-relaxed focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Timing & Scoring */}
              <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                  <Award className="w-4 h-4 text-emerald-400" />
                  <span>Exam Timing, Marking & Negative Deduction</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Duration (Mins)</label>
                    <input
                      type="number"
                      value={durationMinutes}
                      onChange={e => setDurationMinutes(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Marks Per Question</label>
                    <input
                      type="number"
                      step="0.25"
                      value={marksPerQuestion}
                      onChange={e => setMarksPerQuestion(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Negative Marking</label>
                    <input
                      type="number"
                      step="0.001"
                      value={negativeMarksPerQuestion}
                      onChange={e => setNegativeMarksPerQuestion(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                      required
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">e.g. 0.25 (1/4th) or 0.333 (1/3rd)</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Total Marks</label>
                    <input
                      type="number"
                      value={totalMarks}
                      onChange={e => setTotalMarks(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Passing Percentage (%)</label>
                    <input
                      type="number"
                      value={passingPercentage}
                      onChange={e => setPassingPercentage(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Status in Student Portal</label>
                    <div className="flex items-center space-x-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsPublished(true)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                          isPublished
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                            : 'bg-slate-900 text-slate-400 border-slate-700'
                        }`}
                      >
                        Published (Live)
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsPublished(false)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                          !isPublished
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                            : 'bg-slate-900 text-slate-400 border-slate-700'
                        }`}
                      >
                        Draft (Hidden)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: QUESTIONS LIST & INLINE EDITING */}
          {activeTab === 'questions' && (
            <div className="space-y-4">
              {/* Filter / Search Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search questions in this test..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="flex items-center space-x-1.5">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={selectedTypeFilter}
                      onChange={e => setSelectedTypeFilter(e.target.value as any)}
                      className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-300 focus:outline-none"
                    >
                      <option value="ALL">All Question Types</option>
                      <option value="mcq">MCQ</option>
                      <option value="assertion_reason">Assertion-Reason</option>
                      <option value="multi_statement">Multi-Statement</option>
                      <option value="matching">Matching</option>
                    </select>
                  </div>

                  <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                    {filteredQuestions.length} of {testQuestions.length} Questions
                  </span>
                </div>
              </div>

              {/* Questions List */}
              {filteredQuestions.length === 0 ? (
                <div className="text-center py-12 bg-slate-950/40 rounded-2xl border border-slate-800">
                  <HelpCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">No questions found matching your search.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredQuestions.map((q, idx) => {
                    const isEditing = editingQuestionId === q.id;
                    const qType = getEffectiveQuestionType(q);
                    const { colA, colB } = getNormalizedColumns(q);
                    const { assertionEn, assertionHi, reasonEn, reasonHi } = getNormalizedAssertionReason(q);
                    const { hasStatements, intro: stmtIntro, statements } = getNormalizedStatements(q);

                    return (
                      <div
                        key={q.id}
                        className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 transition hover:border-slate-700 space-y-3"
                      >
                        {/* Question Card Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md text-xs font-black bg-slate-800 text-slate-200 border border-slate-700">
                              Q{idx + 1}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                              qType === 'assertion_reason'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                : qType === 'multi_statement'
                                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                                : qType === 'matching'
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            }`}>
                              {qType.replace('_', ' ')}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              ID: {q.id}
                            </span>
                            {q.difficulty && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                                {q.difficulty}
                              </span>
                            )}
                            {q.subject && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                                {q.subject}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => setEditingQuestionId(isEditing ? null : q.id)}
                              className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                                isEditing
                                  ? 'bg-indigo-600 text-white shadow-sm'
                                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                              }`}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>{isEditing ? 'Collapse' : 'Edit Question'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteQuestion(q.id)}
                              className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-700 transition cursor-pointer"
                              title="Delete from test"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Question Preview (When NOT Editing) */}
                        {!isEditing && (
                          <div className="space-y-3 text-xs">
                            {/* Question Stems */}
                            <div className="space-y-1.5">
                              {(q.question || q.questionText || (q as any).stem) ? (
                                <div className="text-slate-200 font-semibold leading-relaxed">
                                  <span className="text-[10px] uppercase font-bold text-slate-500 mr-1.5">[EN]</span>
                                  {q.question || q.questionText || (q as any).stem}
                                </div>
                              ) : null}
                              {q.questionHindi && q.questionHindi !== (q.question || q.questionText) ? (
                                <div className="text-slate-300 font-medium leading-relaxed">
                                  <span className="text-[10px] uppercase font-bold text-emerald-500 mr-1.5">[HI]</span>
                                  {q.questionHindi}
                                </div>
                              ) : null}
                              {!q.question && !q.questionText && !(q as any).stem && !q.questionHindi && (
                                <div className="text-amber-400/80 italic text-[11px]">
                                  [No question stem found - click 'Edit Question' to add content]
                                </div>
                              )}
                            </div>

                            {/* 1. MATCHING QUESTION PREVIEW */}
                            {qType === 'matching' && (
                              <div className="space-y-2 pt-1">
                                {colA.length > 0 || colB.length > 0 ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-900/90 border border-purple-500/30">
                                    {/* Column I */}
                                    <div className="space-y-2">
                                      <div className="text-[11px] font-black text-purple-300 uppercase tracking-wider pb-1 border-b border-purple-500/20 flex items-center space-x-1.5">
                                        <Table className="w-3.5 h-3.5" />
                                        <span>Column I (सूची - I)</span>
                                      </div>
                                      <div className="space-y-1.5">
                                        {colA.map((item, cIdx) => (
                                          <div key={cIdx} className="flex items-start space-x-2 bg-slate-950/60 p-2 rounded-lg border border-purple-500/10">
                                            <span className="w-5 h-5 rounded bg-purple-500/20 text-purple-300 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                                              {item.id || cIdx + 1}
                                            </span>
                                            <div className="text-slate-200">
                                              <p className="font-medium">{item.text}</p>
                                              {item.textHindi && item.textHindi !== item.text && (
                                                <p className="text-emerald-300/80 text-[11px] mt-0.5">{item.textHindi}</p>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Column II */}
                                    <div className="space-y-2">
                                      <div className="text-[11px] font-black text-purple-300 uppercase tracking-wider pb-1 border-b border-purple-500/20 flex items-center space-x-1.5">
                                        <Table className="w-3.5 h-3.5" />
                                        <span>Column II (सूची - II)</span>
                                      </div>
                                      <div className="space-y-1.5">
                                        {colB.map((item, cIdx) => (
                                          <div key={cIdx} className="flex items-start space-x-2 bg-slate-950/60 p-2 rounded-lg border border-purple-500/10">
                                            <span className="w-5 h-5 rounded bg-purple-500/20 text-purple-300 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                                              {item.id || String.fromCharCode(65 + cIdx)}
                                            </span>
                                            <div className="text-slate-200">
                                              <p className="font-medium">{item.text}</p>
                                              {item.textHindi && item.textHindi !== item.text && (
                                                <p className="text-emerald-300/80 text-[11px] mt-0.5">{item.textHindi}</p>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="p-3 bg-purple-950/20 border border-purple-500/30 rounded-xl text-purple-300 text-xs flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <AlertCircle className="w-4 h-4 shrink-0 text-purple-400" />
                                      <span>Matching items (Column I & Column II) are not yet specified.</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setEditingQuestionId(q.id)}
                                      className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold shrink-0"
                                    >
                                      Configure Columns
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* 2. ASSERTION & REASON PREVIEW */}
                            {qType === 'assertion_reason' && (
                              <div className="space-y-2 pt-1">
                                {assertionEn || reasonEn ? (
                                  <div className="space-y-2 p-3 bg-slate-900/90 border border-amber-500/30 rounded-xl">
                                    {assertionEn && (
                                      <div className="flex items-start space-x-2.5">
                                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-black text-[10px] shrink-0 mt-0.5 border border-amber-500/40">
                                          Assertion [A]
                                        </span>
                                        <div className="text-slate-100 font-medium leading-relaxed">
                                          <p>{assertionEn}</p>
                                          {assertionHi && assertionHi !== assertionEn && (
                                            <p className="text-emerald-300/80 text-[11px] mt-0.5">{assertionHi}</p>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {reasonEn && (
                                      <div className="flex items-start space-x-2.5 pt-2 border-t border-slate-800">
                                        <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-black text-[10px] shrink-0 mt-0.5 border border-cyan-500/40">
                                          Reason [R]
                                        </span>
                                        <div className="text-slate-100 font-medium leading-relaxed">
                                          <p>{reasonEn}</p>
                                          {reasonHi && reasonHi !== reasonEn && (
                                            <p className="text-emerald-300/80 text-[11px] mt-0.5">{reasonHi}</p>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                                      <span>Assertion [A] & Reason [R] fields are not yet filled.</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setEditingQuestionId(q.id)}
                                      className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold shrink-0"
                                    >
                                      Edit Assertion & Reason
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* 3. MULTI-STATEMENT / SEGMENTS PREVIEW */}
                            {qType === 'multi_statement' && hasStatements && (
                              <div className="space-y-2 pt-1">
                                {stmtIntro && (
                                  <p className="text-slate-300 italic">{stmtIntro}</p>
                                )}
                                <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/90 border border-indigo-500/30">
                                  <span className="text-[10px] font-black text-indigo-300 uppercase tracking-wider block border-b border-indigo-500/20 pb-1">
                                    Statements / Segments (कथन / खंड)
                                  </span>
                                  <div className="space-y-2 pt-1">
                                    {statements.map((stmt, sIdx) => (
                                      <div key={sIdx} className="flex items-start space-x-2.5 p-2 bg-slate-950/60 rounded-lg border border-indigo-500/10">
                                        <span className="w-6 h-6 rounded-md bg-indigo-500/20 text-indigo-300 font-mono font-black text-xs flex items-center justify-center shrink-0 mt-0.5 border border-indigo-500/30">
                                          {stmt.label}
                                        </span>
                                        <div className="text-slate-200">
                                          <p className="font-medium">{stmt.text}</p>
                                          {stmt.textHindi && stmt.textHindi !== stmt.text && (
                                            <p className="text-emerald-300/80 text-[11px] mt-0.5">{stmt.textHindi}</p>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Options Preview */}
                            {Array.isArray(q.options) && q.options.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                {q.options.map((opt: any, optIdx: number) => {
                                  const label = typeof opt === 'string'
                                    ? String.fromCharCode(65 + optIdx)
                                    : (opt.label || opt.id || String.fromCharCode(65 + optIdx)).toUpperCase();
                                  const isCorrect = (q.correctOption || q.correctAnswer) === label;
                                  const optText = typeof opt === 'string' ? opt : (opt.text || opt.textEnglish || opt.textHindi || '');
                                  const optHindi = typeof opt === 'object' ? opt.textHindi : '';

                                  return (
                                    <div
                                      key={optIdx}
                                      className={`p-2.5 rounded-xl border flex items-start space-x-2.5 transition ${
                                        isCorrect
                                          ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200 shadow-sm font-semibold'
                                          : 'bg-slate-900/70 border-slate-800 text-slate-300'
                                      }`}
                                    >
                                      <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5 ${
                                        isCorrect ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
                                      }`}>
                                        {label}
                                      </span>
                                      <div className="flex-1 min-w-0 text-xs">
                                        <p className="break-words">{optText || `Option ${label}`}</p>
                                        {optHindi && optHindi !== optText && (
                                          <p className="text-emerald-300/80 text-[11px] mt-0.5 break-words">{optHindi}</p>
                                        )}
                                      </div>
                                      {isCorrect && (
                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0 flex items-center space-x-1">
                                          <CheckCircle2 className="w-3 h-3" />
                                          <span>Correct</span>
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Explanation / Solution Preview */}
                            {(q.explanation || q.explanationHindi) && (
                              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1 text-slate-300">
                                <div className="text-[10px] font-black text-amber-300 uppercase tracking-wider flex items-center space-x-1">
                                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Explanation / Solution (व्याख्या)</span>
                                </div>
                                {q.explanation && <p className="text-slate-300">{q.explanation}</p>}
                                {q.explanationHindi && q.explanationHindi !== q.explanation && (
                                  <p className="text-emerald-300/80 text-[11px]">{q.explanationHindi}</p>
                                )}
                              </div>
                            )}

                            {/* Metadata Pills */}
                            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400 border-t border-slate-800/60">
                              <span>Marks: <strong className="text-emerald-400">+{q.marks || 1}</strong></span>
                              <span>•</span>
                              <span>Negative: <strong className="text-rose-400">-{q.negativeMarks || 0.25}</strong></span>
                              {q.topic && (
                                <>
                                  <span>•</span>
                                  <span>Topic: <strong className="text-slate-200">{q.topic}</strong></span>
                                </>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Question Full Inline Editor */}
                        {isEditing && (
                          <div className="space-y-4 pt-3 border-t border-slate-800">
                            {/* Type Selector & Correct Option */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-bold text-slate-300 mb-1">Question Type</label>
                                <select
                                  value={qType}
                                  onChange={e => handleUpdateQuestion(q.id, {
                                    questionType: e.target.value as QuestionType,
                                    type: e.target.value as QuestionType
                                  })}
                                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                                >
                                  <option value="mcq">Standard MCQ</option>
                                  <option value="assertion_reason">Assertion - Reason</option>
                                  <option value="multi_statement">Multi - Statement</option>
                                  <option value="matching">Matching (2 Columns)</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-xs font-bold text-slate-300 mb-1">Correct Answer Option</label>
                                <select
                                  value={q.correctOption || q.correctAnswer || 'A'}
                                  onChange={e => handleUpdateQuestion(q.id, {
                                    correctOption: e.target.value as 'A' | 'B' | 'C' | 'D',
                                    correctAnswer: e.target.value as 'A' | 'B' | 'C' | 'D'
                                  })}
                                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-emerald-300 font-bold focus:outline-none"
                                >
                                  <option value="A">Option A</option>
                                  <option value="B">Option B</option>
                                  <option value="C">Option C</option>
                                  <option value="D">Option D</option>
                                </select>
                              </div>
                            </div>

                            {/* English Stem */}
                            <div>
                              <label className="block text-xs font-bold text-slate-300 mb-1">Question Text (English)</label>
                              <textarea
                                value={q.question || q.questionText || ''}
                                onChange={e => handleUpdateQuestion(q.id, {
                                  question: e.target.value,
                                  questionText: e.target.value
                                })}
                                rows={3}
                                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-medium focus:outline-none focus:border-indigo-500"
                              />
                            </div>

                            {/* Hindi Stem */}
                            <div>
                              <label className="block text-xs font-bold text-slate-300 mb-1">Question Text (Hindi - प्रश्न)</label>
                              <textarea
                                value={q.questionHindi || ''}
                                onChange={e => handleUpdateQuestion(q.id, { questionHindi: e.target.value })}
                                rows={3}
                                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-medium focus:outline-none focus:border-indigo-500"
                              />
                            </div>

                            {/* 1. MATCHING (2-COLUMN) EDITOR */}
                            {qType === 'matching' && (
                              <div className="p-3 bg-purple-950/20 border border-purple-500/30 rounded-2xl space-y-4">
                                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-purple-500/20">
                                  <h4 className="text-xs font-black text-purple-300 uppercase tracking-wider flex items-center space-x-1.5">
                                    <Table className="w-3.5 h-3.5" />
                                    <span>2-Column Matching Configuration</span>
                                  </h4>
                                  <div className="flex items-center space-x-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const defaultColA = [
                                          { id: '1', text: 'Category 1', textHindi: 'श्रेणी 1' },
                                          { id: '2', text: 'Category 2', textHindi: 'श्रेणी 2' },
                                          { id: '3', text: 'Category 3', textHindi: 'श्रेणी 3' },
                                          { id: '4', text: 'Category 4', textHindi: 'श्रेणी 4' },
                                        ];
                                        const defaultColB = [
                                          { id: 'J', text: 'Example J', textHindi: 'उदाहरण J' },
                                          { id: 'K', text: 'Example K', textHindi: 'उदाहरण K' },
                                          { id: 'L', text: 'Example L', textHindi: 'उदाहरण L' },
                                          { id: 'M', text: 'Example M', textHindi: 'उदाहरण M' },
                                        ];
                                        handleUpdateQuestion(q.id, { columnA: defaultColA, columnB: defaultColB });
                                      }}
                                      className="px-2.5 py-1 rounded bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 text-[10px] font-bold border border-purple-500/30"
                                    >
                                      Preset (1-4 & J-M)
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const defaultColA = [
                                          { id: '1', text: 'Item 1', textHindi: 'मद 1' },
                                          { id: '2', text: 'Item 2', textHindi: 'मद 2' },
                                          { id: '3', text: 'Item 3', textHindi: 'मद 3' },
                                          { id: '4', text: 'Item 4', textHindi: 'मद 4' },
                                        ];
                                        const defaultColB = [
                                          { id: 'A', text: 'Match A', textHindi: 'सुमेलित A' },
                                          { id: 'B', text: 'Match B', textHindi: 'सुमेलित B' },
                                          { id: 'C', text: 'Match C', textHindi: 'सुमेलित C' },
                                          { id: 'D', text: 'Match D', textHindi: 'सुमेलित D' },
                                        ];
                                        handleUpdateQuestion(q.id, { columnA: defaultColA, columnB: defaultColB });
                                      }}
                                      className="px-2.5 py-1 rounded bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 text-[10px] font-bold border border-purple-500/30"
                                    >
                                      Preset (1-4 & A-D)
                                    </button>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Column I Editor */}
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs font-bold text-purple-200">
                                      <span>Column I (सूची - I)</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const cur = colA.length > 0 ? [...colA] : [];
                                          cur.push({ id: String(cur.length + 1), text: '', textHindi: '' });
                                          handleUpdateQuestion(q.id, { columnA: cur });
                                        }}
                                        className="text-[10px] px-2 py-0.5 bg-purple-600 hover:bg-purple-500 text-white rounded font-bold"
                                      >
                                        + Add Column I Item
                                      </button>
                                    </div>
                                    <div className="space-y-2">
                                      {colA.map((item, cIdx) => (
                                        <div key={cIdx} className="flex items-center space-x-2 bg-slate-900 p-2 rounded-xl border border-purple-500/20">
                                          <input
                                            type="text"
                                            value={item.id}
                                            onChange={e => {
                                              const cur = [...colA];
                                              cur[cIdx] = { ...cur[cIdx], id: e.target.value };
                                              handleUpdateQuestion(q.id, { columnA: cur });
                                            }}
                                            placeholder="1"
                                            className="w-10 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-center text-xs text-purple-300 font-bold"
                                          />
                                          <div className="flex-1 space-y-1">
                                            <input
                                              type="text"
                                              value={item.text}
                                              onChange={e => {
                                                const cur = [...colA];
                                                cur[cIdx] = { ...cur[cIdx], text: e.target.value };
                                                handleUpdateQuestion(q.id, { columnA: cur });
                                              }}
                                              placeholder="English text..."
                                              className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-white"
                                            />
                                            <input
                                              type="text"
                                              value={item.textHindi}
                                              onChange={e => {
                                                const cur = [...colA];
                                                cur[cIdx] = { ...cur[cIdx], textHindi: e.target.value };
                                                handleUpdateQuestion(q.id, { columnA: cur });
                                              }}
                                              placeholder="हिन्दी पाठ..."
                                              className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-emerald-300"
                                            />
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const cur = colA.filter((_, i) => i !== cIdx);
                                              handleUpdateQuestion(q.id, { columnA: cur });
                                            }}
                                            className="p-1 text-slate-500 hover:text-rose-400"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Column II Editor */}
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs font-bold text-purple-200">
                                      <span>Column II (सूची - II)</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const cur = colB.length > 0 ? [...colB] : [];
                                          const nextLetter = String.fromCharCode(65 + cur.length);
                                          cur.push({ id: nextLetter, text: '', textHindi: '' });
                                          handleUpdateQuestion(q.id, { columnB: cur });
                                        }}
                                        className="text-[10px] px-2 py-0.5 bg-purple-600 hover:bg-purple-500 text-white rounded font-bold"
                                      >
                                        + Add Column II Item
                                      </button>
                                    </div>
                                    <div className="space-y-2">
                                      {colB.map((item, cIdx) => (
                                        <div key={cIdx} className="flex items-center space-x-2 bg-slate-900 p-2 rounded-xl border border-purple-500/20">
                                          <input
                                            type="text"
                                            value={item.id}
                                            onChange={e => {
                                              const cur = [...colB];
                                              cur[cIdx] = { ...cur[cIdx], id: e.target.value };
                                              handleUpdateQuestion(q.id, { columnB: cur });
                                            }}
                                            placeholder="A"
                                            className="w-10 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-center text-xs text-purple-300 font-bold"
                                          />
                                          <div className="flex-1 space-y-1">
                                            <input
                                              type="text"
                                              value={item.text}
                                              onChange={e => {
                                                const cur = [...colB];
                                                cur[cIdx] = { ...cur[cIdx], text: e.target.value };
                                                handleUpdateQuestion(q.id, { columnB: cur });
                                              }}
                                              placeholder="English text..."
                                              className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-white"
                                            />
                                            <input
                                              type="text"
                                              value={item.textHindi}
                                              onChange={e => {
                                                const cur = [...colB];
                                                cur[cIdx] = { ...cur[cIdx], textHindi: e.target.value };
                                                handleUpdateQuestion(q.id, { columnB: cur });
                                              }}
                                              placeholder="हिन्दी पाठ..."
                                              className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-emerald-300"
                                            />
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const cur = colB.filter((_, i) => i !== cIdx);
                                              handleUpdateQuestion(q.id, { columnB: cur });
                                            }}
                                            className="p-1 text-slate-500 hover:text-rose-400"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* 2. ASSERTION REASON EDITOR */}
                            {qType === 'assertion_reason' && (
                              <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-2xl space-y-3">
                                <div className="flex items-center justify-between pb-1 border-b border-amber-500/20">
                                  <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider">
                                    Assertion & Reason Statements
                                  </h4>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-[11px] font-bold text-amber-200 mb-1">Assertion [A] (English)</label>
                                    <textarea
                                      value={q.assertion || assertionEn || ''}
                                      onChange={e => handleUpdateQuestion(q.id, { assertion: e.target.value })}
                                      rows={2}
                                      placeholder="Assertion statement..."
                                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[11px] font-bold text-amber-200 mb-1">Assertion [A] (Hindi - अभिकथन)</label>
                                    <textarea
                                      value={q.assertionHindi || assertionHi || ''}
                                      onChange={e => handleUpdateQuestion(q.id, { assertionHindi: e.target.value })}
                                      rows={2}
                                      placeholder="अभिकथन..."
                                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-[11px] font-bold text-cyan-200 mb-1">Reason [R] (English)</label>
                                    <textarea
                                      value={q.reason || reasonEn || ''}
                                      onChange={e => handleUpdateQuestion(q.id, { reason: e.target.value })}
                                      rows={2}
                                      placeholder="Reason statement..."
                                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[11px] font-bold text-cyan-200 mb-1">Reason [R] (Hindi - कारण)</label>
                                    <textarea
                                      value={q.reasonHindi || reasonHi || ''}
                                      onChange={e => handleUpdateQuestion(q.id, { reasonHindi: e.target.value })}
                                      rows={2}
                                      placeholder="कारण..."
                                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* 3. MULTI-STATEMENT EDITOR */}
                            {qType === 'multi_statement' && (
                              <div className="p-3 bg-indigo-950/20 border border-indigo-500/30 rounded-2xl space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-indigo-500/20">
                                  <h4 className="text-xs font-black text-indigo-300 uppercase tracking-wider">
                                    Statements / Ordered Segments
                                  </h4>
                                  <div className="flex items-center space-x-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const parsed = extractStatementsFromStem(q.question || '');
                                        if (parsed.hasSegments && parsed.segments.length > 0) {
                                          const parsedHi = q.questionHindi ? extractStatementsFromStem(q.questionHindi) : null;
                                          const newStmts = parsed.segments.map((seg, idx) => ({
                                            id: seg.id,
                                            label: seg.label,
                                            text: seg.text,
                                            textHindi: parsedHi?.segments[idx]?.text || seg.text,
                                          }));
                                          handleUpdateQuestion(q.id, {
                                            statements: newStmts,
                                            question: parsed.intro || q.question
                                          });
                                        } else {
                                          alert('No sequential statements (like 1., 2. or K., L.) found in question stem.');
                                        }
                                      }}
                                      className="px-2.5 py-1 rounded bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 text-[10px] font-bold border border-indigo-500/30"
                                    >
                                      Auto-Extract from Stem
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const cur = statements.length > 0 ? [...statements] : [];
                                        cur.push({
                                          id: String(cur.length + 1),
                                          label: String(cur.length + 1),
                                          text: '',
                                          textHindi: ''
                                        });
                                        handleUpdateQuestion(q.id, { statements: cur });
                                      }}
                                      className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold"
                                    >
                                      + Add Statement
                                    </button>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  {statements.map((stmt, sIdx) => (
                                    <div key={sIdx} className="flex items-center space-x-2 bg-slate-900 p-2 rounded-xl border border-indigo-500/20">
                                      <input
                                        type="text"
                                        value={stmt.label}
                                        onChange={e => {
                                          const cur = [...statements];
                                          cur[sIdx] = { ...cur[sIdx], label: e.target.value, id: e.target.value };
                                          handleUpdateQuestion(q.id, { statements: cur });
                                        }}
                                        placeholder="1"
                                        className="w-10 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-center text-xs text-indigo-300 font-bold"
                                      />
                                      <div className="flex-1 space-y-1">
                                        <input
                                          type="text"
                                          value={stmt.text}
                                          onChange={e => {
                                            const cur = [...statements];
                                            cur[sIdx] = { ...cur[sIdx], text: e.target.value };
                                            handleUpdateQuestion(q.id, { statements: cur });
                                          }}
                                          placeholder="Statement text (English)..."
                                          className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-white"
                                        />
                                        <input
                                          type="text"
                                          value={stmt.textHindi}
                                          onChange={e => {
                                            const cur = [...statements];
                                            cur[sIdx] = { ...cur[sIdx], textHindi: e.target.value };
                                            handleUpdateQuestion(q.id, { statements: cur });
                                          }}
                                          placeholder="कथन पाठ (हिन्दी)..."
                                          className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-emerald-300"
                                        />
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const cur = statements.filter((_, i) => i !== sIdx);
                                          handleUpdateQuestion(q.id, { statements: cur });
                                        }}
                                        className="p-1 text-slate-500 hover:text-rose-400"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Options A, B, C, D Editor */}
                            <div className="space-y-2">
                              <label className="block text-xs font-bold text-slate-300">Answer Options (A, B, C, D)</label>
                              <div className="space-y-2">
                                {['A', 'B', 'C', 'D'].map((optKey, optIdx) => {
                                  const foundOpt = q.options?.find((o: any, idx) => {
                                    if (typeof o === 'string') return idx === optIdx;
                                    const l = (o.label || o.id || String.fromCharCode(65 + idx)).toUpperCase();
                                    return l === optKey || idx === optIdx;
                                  });
                                  const curText = typeof foundOpt === 'string' ? foundOpt : (foundOpt?.text || (foundOpt as any)?.textEnglish || '');
                                  const curHindi = typeof foundOpt === 'object' ? (foundOpt?.textHindi || '') : '';
                                  const isCorrect = (q.correctOption || q.correctAnswer) === optKey;

                                  return (
                                    <div key={optKey} className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateQuestion(q.id, { correctOption: optKey as 'A' | 'B' | 'C' | 'D', correctAnswer: optKey as 'A' | 'B' | 'C' | 'D' })}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-black flex items-center space-x-1 shrink-0 ${
                                          isCorrect
                                            ? 'bg-emerald-500 text-slate-950 shadow-sm'
                                            : 'bg-slate-800 text-slate-400 hover:text-white'
                                        }`}
                                      >
                                        <span>Option {optKey}</span>
                                        {isCorrect && <CheckCircle2 className="w-3.5 h-3.5" />}
                                      </button>

                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1 w-full">
                                        <input
                                          type="text"
                                          value={curText}
                                          onChange={e => {
                                            const newOpts = ['A', 'B', 'C', 'D'].map((k, kIdx) => {
                                              const existing = q.options?.find((o: any, idx) => {
                                                if (typeof o === 'string') return idx === kIdx;
                                                const l = (o.label || o.id || String.fromCharCode(65 + idx)).toUpperCase();
                                                return l === k || idx === kIdx;
                                              });
                                              const prevText = typeof existing === 'string' ? existing : (existing?.text || (existing as any)?.textEnglish || '');
                                              const prevHindi = typeof existing === 'object' ? (existing?.textHindi || '') : '';
                                              if (k === optKey) {
                                                return { id: k, label: k, text: e.target.value, textHindi: prevHindi };
                                              }
                                              return { id: k, label: k, text: prevText, textHindi: prevHindi };
                                            });
                                            handleUpdateQuestion(q.id, { options: newOpts });
                                          }}
                                          placeholder={`English text for Option ${optKey}...`}
                                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                                        />
                                        <input
                                          type="text"
                                          value={curHindi}
                                          onChange={e => {
                                            const newOpts = ['A', 'B', 'C', 'D'].map((k, kIdx) => {
                                              const existing = q.options?.find((o: any, idx) => {
                                                if (typeof o === 'string') return idx === kIdx;
                                                const l = (o.label || o.id || String.fromCharCode(65 + idx)).toUpperCase();
                                                return l === k || idx === kIdx;
                                              });
                                              const prevText = typeof existing === 'string' ? existing : (existing?.text || (existing as any)?.textEnglish || '');
                                              const prevHindi = typeof existing === 'object' ? (existing?.textHindi || '') : '';
                                              if (k === optKey) {
                                                return { id: k, label: k, text: prevText, textHindi: e.target.value };
                                              }
                                              return { id: k, label: k, text: prevText, textHindi: prevHindi };
                                            });
                                            handleUpdateQuestion(q.id, { options: newOpts });
                                          }}
                                          placeholder={`Hindi text for Option ${optKey}...`}
                                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Detailed Explanation / Solution */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-bold text-slate-300 mb-1">Detailed Explanation (English)</label>
                                <textarea
                                  value={q.explanation || ''}
                                  onChange={e => handleUpdateQuestion(q.id, { explanation: e.target.value })}
                                  rows={2}
                                  placeholder="Solution and conceptual explanation..."
                                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-300 mb-1">Detailed Explanation (Hindi - व्याख्या)</label>
                                <textarea
                                  value={q.explanationHindi || ''}
                                  onChange={e => handleUpdateQuestion(q.id, { explanationHindi: e.target.value })}
                                  rows={2}
                                  placeholder="उत्तर व्याख्या..."
                                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                                />
                              </div>
                            </div>

                            {/* Metadata & Marks */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-400 mb-1">Subject</label>
                                <input
                                  type="text"
                                  value={q.subject || ''}
                                  onChange={e => handleUpdateQuestion(q.id, { subject: e.target.value })}
                                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-slate-400 mb-1">Topic</label>
                                <input
                                  type="text"
                                  value={q.topic || ''}
                                  onChange={e => handleUpdateQuestion(q.id, { topic: e.target.value })}
                                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-slate-400 mb-1">Marks (+)</label>
                                <input
                                  type="number"
                                  step="0.25"
                                  value={q.marks || 1}
                                  onChange={e => handleUpdateQuestion(q.id, { marks: parseFloat(e.target.value) || 1 })}
                                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-slate-400 mb-1">Negative (-)</label>
                                <input
                                  type="number"
                                  step="0.05"
                                  value={q.negativeMarks || 0.25}
                                  onChange={e => handleUpdateQuestion(q.id, { negativeMarks: parseFloat(e.target.value) || 0.25 })}
                                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                                />
                              </div>
                            </div>

                            {/* Done Editing Question Button */}
                            <div className="flex justify-end pt-2">
                              <button
                                type="button"
                                onClick={() => setEditingQuestionId(null)}
                                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md cursor-pointer flex items-center space-x-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Done Editing Q{idx + 1}</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ADD NEW QUESTION FORM */}
          {activeTab === 'add_question' && (
            <form onSubmit={handleAddNewQuestion} className="space-y-4 max-w-3xl mx-auto bg-slate-950/60 p-6 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-sm font-black text-white flex items-center space-x-2">
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <span>Add New Question to "{title}"</span>
                </h3>
                <span className="text-xs text-slate-400">
                  Will become Question #{testQuestions.length + 1}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Question Type</label>
                  <select
                    value={newQType}
                    onChange={e => setNewQType(e.target.value as QuestionType)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                  >
                    <option value="mcq">Standard MCQ</option>
                    <option value="assertion_reason">Assertion - Reason</option>
                    <option value="multi_statement">Multi - Statement</option>
                    <option value="matching">Matching (2 Columns)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Correct Option</label>
                  <select
                    value={newQCorrect}
                    onChange={e => setNewQCorrect(e.target.value as 'A' | 'B' | 'C' | 'D')}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-emerald-400 font-bold focus:outline-none"
                  >
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Question Stem (English)</label>
                <textarea
                  value={newQStemEn}
                  onChange={e => setNewQStemEn(e.target.value)}
                  rows={2}
                  placeholder="Enter English question text..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Question Stem (Hindi)</label>
                <textarea
                  value={newQStemHi}
                  onChange={e => setNewQStemHi(e.target.value)}
                  rows={2}
                  placeholder="हिन्दी में प्रश्न लिखें..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Assertion & Reason inputs if selected */}
              {newQType === 'assertion_reason' && (
                <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-2xl space-y-3">
                  <h4 className="text-xs font-black text-amber-300">Assertion & Reason Specifics</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={newQAssertionEn}
                      onChange={e => setNewQAssertionEn(e.target.value)}
                      placeholder="Assertion [A] English text..."
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                    />
                    <input
                      type="text"
                      value={newQAssertionHi}
                      onChange={e => setNewQAssertionHi(e.target.value)}
                      placeholder="अभिकथन [A] हिन्दी..."
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={newQReasonEn}
                      onChange={e => setNewQReasonEn(e.target.value)}
                      placeholder="Reason [R] English text..."
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                    />
                    <input
                      type="text"
                      value={newQReasonHi}
                      onChange={e => setNewQReasonHi(e.target.value)}
                      placeholder="कारण [R] हिन्दी..."
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                    />
                  </div>
                </div>
              )}

              {/* Options */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">Options (A, B, C, D)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newQOptAEn}
                    onChange={e => setNewQOptAEn(e.target.value)}
                    placeholder="Option A (English)"
                    className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  />
                  <input
                    type="text"
                    value={newQOptAHi}
                    onChange={e => setNewQOptAHi(e.target.value)}
                    placeholder="Option A (Hindi)"
                    className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  />
                  <input
                    type="text"
                    value={newQOptBEn}
                    onChange={e => setNewQOptBEn(e.target.value)}
                    placeholder="Option B (English)"
                    className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  />
                  <input
                    type="text"
                    value={newQOptBHi}
                    onChange={e => setNewQOptBHi(e.target.value)}
                    placeholder="Option B (Hindi)"
                    className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  />
                  <input
                    type="text"
                    value={newQOptCEn}
                    onChange={e => setNewQOptCEn(e.target.value)}
                    placeholder="Option C (English)"
                    className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  />
                  <input
                    type="text"
                    value={newQOptCHi}
                    onChange={e => setNewQOptCHi(e.target.value)}
                    placeholder="Option C (Hindi)"
                    className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  />
                  <input
                    type="text"
                    value={newQOptDEn}
                    onChange={e => setNewQOptDEn(e.target.value)}
                    placeholder="Option D (English)"
                    className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  />
                  <input
                    type="text"
                    value={newQOptDHi}
                    onChange={e => setNewQOptDHi(e.target.value)}
                    placeholder="Option D (Hindi)"
                    className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <textarea
                  value={newQExpEn}
                  onChange={e => setNewQExpEn(e.target.value)}
                  rows={2}
                  placeholder="Explanation / Solution (English)..."
                  className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                />
                <textarea
                  value={newQExpHi}
                  onChange={e => setNewQExpHi(e.target.value)}
                  rows={2}
                  placeholder="व्याख्या (हिन्दी)..."
                  className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg cursor-pointer flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Insert Question to Test</span>
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400">
            Total {testQuestions.length} questions will be linked to this mock test.
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel / Discard
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition cursor-pointer flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Save & Update Published Test</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
