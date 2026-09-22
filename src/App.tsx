/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { StudentDashboard } from './components/StudentDashboard';
import { PYPSection } from './components/PYPSection';
import { AnalyticsHub } from './components/AnalyticsHub';
import { ExamEngine } from './components/ExamEngine';
import { SolutionsScreen } from './components/SolutionsScreen';
import { AdminQuestionBank } from './components/AdminQuestionBank';
import { AdminPYPManager } from './components/AdminPYPManager';
import { AdminAITestCreator } from './components/AdminAITestCreator';
import { AdminTestCatalog } from './components/AdminTestCatalog';
import { AdminAndroidAPIManager } from './components/AdminAndroidAPIManager';
import { AdminPortalLogin } from './components/AdminPortalLogin';
import { AdminHeader } from './components/AdminHeader';
import { AuthModal } from './components/AuthModal';
import {
  MockTest,
  Question,
  PreviousYearPaper,
  TestAttempt,
  ExamCategory,
  QuestionPaletteStatus
} from './types';
import {
  INITIAL_MOCK_TESTS,
  INITIAL_QUESTIONS,
  INITIAL_PYP_PAPERS,
  INITIAL_ATTEMPTS
} from './mockData';
import {
  normalizeSubjectName,
  migrateLegacyQuestion,
  migrateLegacyAttempt,
  runTaxonomyMigration
} from './utils/taxonomyMigration';
import { Shield, Lock, ExternalLink, Smartphone } from 'lucide-react';

function MainApp() {
  const { user, deductCredits, isAdminAuthenticated } = useAuth();

  // Route State: Strictly separated 'student' vs 'admin'
  const [currentRoute, setCurrentRoute] = useState<'student' | 'admin'>(() => {
    if (typeof window === 'undefined') return 'student';
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    if (path.startsWith('/admin') || hash.startsWith('#/admin') || hash === '#admin') {
      return 'admin';
    }
    return 'student';
  });

  // Track browser forward / back button and hash changes
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path.startsWith('/admin') || hash.startsWith('#/admin') || hash === '#admin') {
        setCurrentRoute('admin');
      } else {
        setCurrentRoute('student');
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const navigateToAdmin = () => {
    if (window.location.pathname !== '/admin') {
      try {
        window.history.pushState({}, '', '/admin');
      } catch {
        window.location.hash = '#/admin';
      }
    }
    setCurrentRoute('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToStudent = () => {
    if (window.location.pathname !== '/') {
      try {
        window.history.pushState({}, '', '/');
      } catch {
        window.location.hash = '';
      }
    }
    setCurrentRoute('student');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Student Navigation State
  const [studentActiveTab, setStudentActiveTab] = useState<string>('tests');
  const [selectedCategory, setSelectedCategory] = useState<ExamCategory | 'ALL'>('ALL');

  // Admin Navigation State (Strictly for admin tabs)
  const [adminActiveTab, setAdminActiveTab] = useState<string>('admin-pyp');

  // Student Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Active Exam Session & Review
  const [activeExamTest, setActiveExamTest] = useState<MockTest | null>(null);
  const [activeAttemptReview, setActiveAttemptReview] = useState<TestAttempt | null>(null);

  // Helper to deduplicate objects with an 'id' attribute
  function dedupeById<T extends { id: string }>(items: T[]): T[] {
    const seen = new Set<string>();
    const result: T[] = [];
    for (const item of items) {
      if (item && item.id && !seen.has(item.id)) {
        seen.add(item.id);
        result.push(item);
      }
    }
    return result;
  }

  // App Data State (Synced with localStorage and backend endpoints)
  const [tests, setTests] = useState<MockTest[]>(() => {
    try {
      const saved = localStorage.getItem('cgssb_tests');
      if (saved) return dedupeById(JSON.parse(saved));
    } catch {}
    return INITIAL_MOCK_TESTS;
  });

  const [questions, setQuestions] = useState<Question[]>(() => {
    try {
      const saved = localStorage.getItem('cgssb_questions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return dedupeById(parsed.map(migrateLegacyQuestion));
        }
      }
    } catch {}
    return INITIAL_QUESTIONS;
  });

  const [pypPapers, setPypPapers] = useState<PreviousYearPaper[]>(() => {
    try {
      const saved = localStorage.getItem('cgssb_pyp');
      if (saved) return dedupeById(JSON.parse(saved));
    } catch {}
    return INITIAL_PYP_PAPERS;
  });

  const [attempts, setAttempts] = useState<TestAttempt[]>(() => {
    try {
      const saved = localStorage.getItem('cgssb_attempts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return dedupeById(parsed.map(a => migrateLegacyAttempt(a, INITIAL_QUESTIONS)));
        }
      }
    } catch {}
    return INITIAL_ATTEMPTS;
  });

  // Run taxonomy migration in localStorage on initial mount
  useEffect(() => {
    runTaxonomyMigration(INITIAL_QUESTIONS, INITIAL_ATTEMPTS);
  }, []);

  // Sync to localStorage with quota protection
  useEffect(() => {
    try {
      localStorage.setItem('cgssb_tests', JSON.stringify(tests));
    } catch (e) {
      console.warn('LocalStorage quota exceeded or unavailable for tests:', e);
    }
  }, [tests]);

  useEffect(() => {
    try {
      localStorage.setItem('cgssb_questions', JSON.stringify(questions));
    } catch (e) {
      console.warn('LocalStorage quota exceeded or unavailable for questions:', e);
    }
  }, [questions]);

  useEffect(() => {
    try {
      localStorage.setItem('cgssb_pyp', JSON.stringify(pypPapers));
    } catch (e) {
      console.warn('LocalStorage quota exceeded or unavailable for PYP:', e);
    }
  }, [pypPapers]);

  useEffect(() => {
    try {
      localStorage.setItem('cgssb_attempts', JSON.stringify(attempts));
    } catch (e) {
      console.warn('LocalStorage quota exceeded or unavailable for attempts:', e);
    }
  }, [attempts]);

  // Fetch initial data from server if reachable and returns genuine JSON
  useEffect(() => {
    async function loadData() {
      try {
        const [testsRes, pypRes, qRes] = await Promise.all([
          fetch('/api/tests').catch(() => null),
          fetch('/api/pyp').catch(() => null),
          fetch('/api/questions').catch(() => null),
        ]);

        if (testsRes && testsRes.ok && testsRes.headers.get('content-type')?.includes('application/json')) {
          const t = await testsRes.json();
          const list = Array.isArray(t) ? t : (t?.tests || []);
          if (list.length > 0) setTests(prev => dedupeById([...list, ...prev]));
        }
        if (pypRes && pypRes.ok && pypRes.headers.get('content-type')?.includes('application/json')) {
          const p = await pypRes.json();
          const list = Array.isArray(p) ? p : (p?.papers || []);
          if (list.length > 0) setPypPapers(prev => dedupeById([...list, ...prev]));
        }
        if (qRes && qRes.ok && qRes.headers.get('content-type')?.includes('application/json')) {
          const q = await qRes.json();
          const list = Array.isArray(q) ? q : (q?.questions || []);
          if (list.length > 0) setQuestions(prev => dedupeById([...list, ...prev]));
        }
      } catch (err) {
        console.warn('Backend API unavailable or non-JSON response received. Falling back to local state:', err);
      }
    }
    loadData();
  }, []);

  // START TEST HANDLER
  const handleStartTest = (test: MockTest) => {
    if (user?.role === 'student') {
      deductCredits(10);
    }
    setActiveAttemptReview(null);
    setActiveExamTest(test);
  };

  // PRACTICE PYP AS TEST HANDLER
  const handlePracticePaper = (paper: PreviousYearPaper) => {
    const existingTest = tests.find(t => t.id === paper.linkedMockTestId);
    if (existingTest) {
      handleStartTest(existingTest);
      return;
    }

    const relevantQs = questions.filter(q => q.category === paper.examCategory);
    const pypTest: MockTest = {
      id: `pyp-test-${paper.id}`,
      title: `${paper.title} (Real Exam Simulation)`,
      category: paper.examCategory,
      description: `Official past paper simulation. Converted from archived examination ${paper.year}.`,
      durationMinutes: paper.durationMinutes,
      questionCount: relevantQs.length > 0 ? relevantQs.length : paper.totalQuestions,
      marksPerQuestion: paper.examCategory === 'CGPSC' ? 2.0 : 1.0,
      negativeMarksPerQuestion: paper.examCategory === 'CGPSC' ? 0.666 : 0.333,
      sections: [
        {
          id: 'pyp-sec-1',
          name: 'Official Exam Paper',
          questionIds: relevantQs.length > 0 ? relevantQs.map(q => q.id) : questions.map(q => q.id),
        },
      ],
      difficultyDistribution: { easy: 40, medium: 40, hard: 20 },
      attemptsCount: 142,
      createdAt: new Date().toISOString(),
    };

    handleStartTest(pypTest);
  };

  // SUBMIT TEST HANDLER (Auto-calculates scores & negative marking)
  const handleSubmitTest = async (submission: {
    testId: string;
    timeTakenSeconds: number;
    responses: Record<string, 'A' | 'B' | 'C' | 'D' | null>;
    questionStatuses: Record<string, QuestionPaletteStatus>;
  }) => {
    if (!activeExamTest) return;

    const currentTest = activeExamTest;
    const testQs = questions.filter(q => {
      return currentTest.sections.some(s => s.questionIds.includes(q.id));
    });

    const activeQuestionList = testQs.length > 0 ? testQs : questions;

    try {
      const res = await fetch(`/api/tests/${currentTest.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeTakenSeconds: submission.timeTakenSeconds,
          responses: submission.responses,
        }),
      });

      if (res.ok) {
        const attempt = await res.json();
        setAttempts(prev => [attempt, ...prev]);
        setActiveExamTest(null);
        setActiveAttemptReview(attempt);
        return;
      }
    } catch (e) {
      console.warn('Server submission failed, performing local evaluation:', e);
    }

    // Local evaluation engine
    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;
    const subjectMap: Record<string, { total: number; correct: number; incorrect: number; unattempted: number }> = {};

    activeQuestionList.forEach(q => {
      const resp = submission.responses[q.id];
      const cleanSubj = normalizeSubjectName(q.subject, `${q.questionHindi || ''} ${q.questionText || ''}`);
      if (!subjectMap[cleanSubj]) {
        subjectMap[cleanSubj] = { total: 0, correct: 0, incorrect: 0, unattempted: 0 };
      }
      subjectMap[cleanSubj].total += 1;

      if (resp == null) {
        unattemptedCount += 1;
        subjectMap[cleanSubj].unattempted += 1;
      } else if (resp === q.correctOption) {
        correctCount += 1;
        subjectMap[cleanSubj].correct += 1;
      } else {
        incorrectCount += 1;
        subjectMap[cleanSubj].incorrect += 1;
      }
    });

    const marksPerQ = currentTest.marksPerQuestion || 1.0;
    const negPenaltyPerQ = currentTest.negativeMarksPerQuestion || 0.333;

    const rawScore = correctCount * marksPerQ;
    const negDeduction = Number((incorrectCount * negPenaltyPerQ).toFixed(2));
    const netScore = Number(Math.max(0, rawScore - negDeduction).toFixed(2));
    const maxScore = activeQuestionList.length * marksPerQ;
    const percentage = Number(((netScore / maxScore) * 100).toFixed(1));
    const attemptedCount = correctCount + incorrectCount;
    const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;

    const sectorAnalysis = Object.keys(subjectMap).map(subj => {
      const data = subjectMap[subj];
      const subjMax = data.total * marksPerQ;
      const subjScore = Number(Math.max(0, data.correct * marksPerQ - data.incorrect * negPenaltyPerQ).toFixed(2));
      const subjAtt = data.correct + data.incorrect;
      const subjAcc = subjAtt > 0 ? Math.round((data.correct / subjAtt) * 100) : 0;
      return {
        subject: subj,
        total: data.total,
        correct: data.correct,
        incorrect: data.incorrect,
        unattempted: data.unattempted,
        accuracy: subjAcc,
        score: subjScore,
        maxScore: subjMax,
      };
    });

    const newAttempt: TestAttempt = {
      id: `att-${Date.now()}`,
      testId: currentTest.id,
      testTitle: currentTest.title,
      category: currentTest.category,
      userId: user?.id || 'guest',
      userName: user?.name || 'Aspirant Student',
      submittedAt: new Date().toISOString(),
      timeTakenSeconds: submission.timeTakenSeconds,
      totalDurationSeconds: (currentTest.durationMinutes || 90) * 60,
      score: netScore,
      maxScore: maxScore,
      percentage: percentage,
      accuracy: accuracy,
      simulatedRank: Math.floor(Math.random() * 45) + 12,
      totalParticipants: 3850,
      percentile: Number((96.0 + Math.random() * 3.8).toFixed(1)),
      correctCount: correctCount,
      incorrectCount: incorrectCount,
      unattemptedCount: unattemptedCount,
      negativeMarksDeducted: negDeduction,
      responses: submission.responses,
      questionStatuses: submission.questionStatuses,
      markedForReviewCount: 0,
      sectorAnalysis: sectorAnalysis,
    };

    setAttempts(prev => [newAttempt, ...prev]);
    setActiveExamTest(null);
    setActiveAttemptReview(newAttempt);
  };

  // ADMIN QUESTION BANK ACTIONS
  const handleAddQuestion = (qData: Partial<Question>) => {
    const newQ: Question = {
      id: qData.id || `q-cg-${Date.now().toString().slice(-6)}`,
      subject: qData.subject || 'Chhattisgarh Special Knowledge',
      topic: qData.topic || 'General',
      subtopic: qData.subtopic || 'General',
      difficulty: qData.difficulty || 'Medium',
      category: qData.category || 'CGSSB',
      questionText: qData.questionText || '',
      questionHindi: qData.questionHindi || '',
      options: qData.options || [],
      correctOption: qData.correctOption || 'A',
      marks: qData.marks || 1.0,
      negativeMarks: qData.negativeMarks || 0.333,
      explanation: qData.explanation || '',
      explanationHindi: qData.explanationHindi || '',
      pypSource: qData.pypSource || '',
      pypAppearances: qData.pypAppearances || [],
      createdAt: new Date().toISOString().split('T')[0],
    };
    setQuestions(prev => [newQ, ...prev]);
    fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newQ),
    }).catch(() => {});
  };

  const handleUpdateQuestion = (id: string, qData: Partial<Question>) => {
    setQuestions(prev => prev.map(q => (q.id === id ? { ...q, ...qData } : q)));
    fetch(`/api/questions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(qData),
    }).catch(() => {});
  };

  const handleDeleteQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
    fetch(`/api/questions/${id}`, {
      method: 'DELETE',
    }).catch(() => {});
  };

  // ADMIN PYP ACTIONS
  const handleAddPYP = (pypData: Partial<PreviousYearPaper>) => {
    const paperId = pypData.id || `pyp-${Date.now()}`;
    const newPaper: PreviousYearPaper = {
      id: paperId,
      title: pypData.title || 'Official Exam Paper',
      examCategory: pypData.examCategory || 'CGSSB',
      year: pypData.year || 2024,
      totalQuestions: pypData.totalQuestions || 100,
      durationMinutes: pypData.durationMinutes || 120,
      marks: pypData.marks || 100,
      negativeMarkingRatio: pypData.negativeMarkingRatio || '1/3rd (0.333)',
      paperSummary: pypData.paperSummary || '',
      subjectsWeightage: pypData.subjectsWeightage || [],
      isOfficialPaper: true,
      downloadFileName: pypData.downloadFileName,
      linkedMockTestId: pypData.linkedMockTestId,
      linkedQuestionIds: pypData.linkedQuestionIds,
    };
    setPypPapers(prev => dedupeById([newPaper, ...prev]));
  };

  const handleDeletePYP = (id: string) => {
    setPypPapers(prev => prev.filter(p => p.id !== id));
  };

  const handleConvertPYPToMockTest = (pyp: PreviousYearPaper) => {
    const testId = pyp.linkedMockTestId || `test-from-${pyp.id}`;
    const newTest: MockTest = {
      id: testId,
      title: `${pyp.title} (Official Mock Test)`,
      category: pyp.examCategory,
      description: `Official past paper simulation. Converted from archived examination ${pyp.year}.`,
      durationMinutes: pyp.durationMinutes,
      questionCount: pyp.totalQuestions,
      marksPerQuestion: pyp.examCategory === 'CGPSC' ? 2.0 : 1.0,
      negativeMarksPerQuestion: pyp.examCategory === 'CGPSC' ? 0.66 : 0.333,
      sections: [
        {
          id: `sec-${pyp.id}`,
          name: 'Official Exam Paper',
          questionIds: questions.filter(q => q.category === pyp.examCategory).map(q => q.id),
        },
      ],
      difficultyDistribution: { easy: 40, medium: 40, hard: 20 },
      attemptsCount: 0,
      createdAt: new Date().toISOString(),
    };

    setTests(prev => dedupeById([newTest, ...prev]));
    setPypPapers(prev =>
      prev.map(p => (p.id === pyp.id ? { ...p, linkedMockTestId: newTest.id } : p))
    );
  };

  // ADMIN TEST MANAGEMENT ACTIONS
  const handleTogglePublishTest = async (testId: string) => {
    const target = tests.find(t => t.id === testId);
    const nextStatus = target ? target.isPublished === false : false;
    setTests(prev => prev.map(t => (t.id === testId ? { ...t, isPublished: nextStatus } : t)));
    try {
      await fetch(`/api/tests/${testId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: nextStatus }),
      });
    } catch (err) {
      console.warn('Failed to sync publish status with server:', err);
    }
  };

  const handleUpdateTest = async (testId: string, updates: Partial<MockTest>) => {
    setTests(prev => prev.map(t => (t.id === testId ? { ...t, ...updates } : t)));
    try {
      await fetch(`/api/tests/${testId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.warn('Failed to update test on server:', err);
    }
  };

  const handleDeleteTest = async (testId: string) => {
    setTests(prev => prev.filter(t => t.id !== testId));
    try {
      await fetch(`/api/tests/${testId}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('Failed to delete test on server:', err);
    }
  };

  const handleAddTest = (newTest: Partial<MockTest>) => {
    const fullTest: MockTest = {
      id: newTest.id || `test-${Date.now()}`,
      title: newTest.title || 'New Mock Test',
      category: newTest.category || 'CGSSB',
      description: newTest.description || '',
      durationMinutes: newTest.durationMinutes || 120,
      questionCount: newTest.questionCount || 100,
      marksPerQuestion: newTest.marksPerQuestion || 1.0,
      negativeMarksPerQuestion: newTest.negativeMarksPerQuestion || 0.333,
      sections: newTest.sections || [{ id: 'sec-1', name: 'General', questionIds: [] }],
      attemptsCount: 0,
      isPublished: newTest.isPublished !== false,
      createdAt: new Date().toISOString(),
    };
    setTests(prev => dedupeById([fullTest, ...prev]));
    fetch('/api/tests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullTest),
    }).catch(() => {});
  };

  // ADMIN AI TEST CREATOR PUBLISH ACTION
  const handleTestPublished = (newTest: MockTest, newQuestions: Question[]) => {
    setQuestions(prev => dedupeById([...newQuestions, ...prev]));
    setTests(prev => dedupeById([newTest, ...prev]));
    fetch('/api/tests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTest),
    }).catch(() => {});
  };

  // =========================================================================
  // VIEW 1: ACTIVE FULLSCREEN EXAM SESSION
  // =========================================================================
  if (activeExamTest) {
    const examQuestions = questions.filter(q =>
      activeExamTest.sections.some(s => s.questionIds.includes(q.id))
    );
    const resolvedQuestions = examQuestions.length > 0 ? examQuestions : questions;

    return (
      <ExamEngine
        test={activeExamTest}
        questions={resolvedQuestions}
        onExit={() => setActiveExamTest(null)}
        onSubmit={handleSubmitTest}
      />
    );
  }

  // =========================================================================
  // VIEW 2: ACTIVE ATTEMPT REVIEW SCREEN
  // =========================================================================
  if (activeAttemptReview) {
    const attemptQuestions = questions.filter(q =>
      Object.keys(activeAttemptReview.responses).includes(q.id)
    );
    const resolvedQuestions = attemptQuestions.length > 0 ? attemptQuestions : questions;

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar
          activeTab={studentActiveTab}
          setActiveTab={tab => {
            setActiveAttemptReview(null);
            setStudentActiveTab(tab);
          }}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
        />
        <main className="flex-1">
          <SolutionsScreen
            attempt={activeAttemptReview}
            questions={resolvedQuestions}
            onBackToDashboard={() => setActiveAttemptReview(null)}
            onReattempt={() => {
              const test = tests.find(t => t.id === activeAttemptReview.testId);
              if (test) {
                handleStartTest(test);
              }
            }}
          />
        </main>
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: SEPARATED ADMIN PORTAL (/admin)
  // Accessible at https://darkorange-chimpanzee-661223.hostingersite.com/admin
  // =========================================================================
  if (currentRoute === 'admin') {
    // If not logged in as Admin, show dedicated AdminPortalLogin
    if (!isAdminAuthenticated) {
      return (
        <AdminPortalLogin
          onSuccess={() => {}}
          onNavigateHome={navigateToStudent}
        />
      );
    }

    // Authenticated Admin Dashboard
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
        <AdminHeader
          activeTab={adminActiveTab}
          setActiveTab={setAdminActiveTab}
          onNavigateToStudent={navigateToStudent}
        />

        <main className="flex-1">
          {adminActiveTab === 'admin-pyp' && (
            <AdminPYPManager
              pypPapers={pypPapers}
              tests={tests}
              onAddPYP={handleAddPYP}
              onDeletePYP={handleDeletePYP}
              onConvertPYPToMockTest={handleConvertPYPToMockTest}
              onTogglePublishTest={handleTogglePublishTest}
              onStartTest={handleStartTest}
              onQuestionsAdded={newQs => setQuestions(prev => dedupeById([...newQs, ...prev]))}
              onTestAdded={newTest => setTests(prev => dedupeById([newTest, ...prev]))}
            />
          )}

          {adminActiveTab === 'admin-questions' && (
            <AdminQuestionBank
              questions={questions}
              onAddQuestion={handleAddQuestion}
              onUpdateQuestion={handleUpdateQuestion}
              onDeleteQuestion={handleDeleteQuestion}
            />
          )}

          {adminActiveTab === 'admin-ai' && (
            <AdminAITestCreator
              pypPapers={pypPapers}
              onTestPublished={handleTestPublished}
            />
          )}

          {adminActiveTab === 'admin-tests' && (
            <AdminTestCatalog
              tests={tests}
              onStartTest={handleStartTest}
              onTogglePublishTest={handleTogglePublishTest}
              onUpdateTest={handleUpdateTest}
              onDeleteTest={handleDeleteTest}
              onAddTest={handleAddTest}
              onNavigateToAICreator={() => setAdminActiveTab('admin-ai')}
            />
          )}

          {adminActiveTab === 'admin-android-api' && (
            <AdminAndroidAPIManager />
          )}
        </main>

        <footer className="bg-slate-950 border-t border-indigo-950/60 py-5 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-indigo-400" />
              <span className="font-bold text-slate-300">CGSSB Admin & Exam Controller Console</span>
              <span className="text-slate-700">•</span>
              <span className="font-mono text-emerald-400 text-[11px]">/admin</span>
            </div>
            <div className="flex items-center space-x-3 text-[11px]">
              <span className="text-slate-400">Hostinger Live Server Ready</span>
              <span className="text-slate-700">•</span>
              <button
                onClick={navigateToStudent}
                className="text-indigo-400 hover:text-indigo-300 font-semibold transition"
              >
                Go to Candidate Portal
              </button>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // =========================================================================
  // VIEW 4: STUDENT / CANDIDATE PORTAL (/)
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      <Navbar
        activeTab={studentActiveTab}
        setActiveTab={setStudentActiveTab}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      <main className="flex-1">
        {studentActiveTab === 'tests' && (
          <StudentDashboard
            tests={tests}
            onStartTest={handleStartTest}
            onSelectCategory={cat => setSelectedCategory(cat)}
            selectedCategory={selectedCategory}
            onTogglePublishTest={handleTogglePublishTest}
            onUpdateTest={handleUpdateTest}
            onDeleteTest={handleDeleteTest}
            onAddTest={handleAddTest}
          />
        )}

        {studentActiveTab === 'pyp' && (
          <PYPSection
            pypPapers={pypPapers}
            onPracticePaper={handlePracticePaper}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onOpenAdminPYP={navigateToAdmin}
          />
        )}

        {studentActiveTab === 'analytics' && (
          <AnalyticsHub
            attempts={attempts}
            onReviewAttempt={attempt => setActiveAttemptReview(attempt)}
            onExploreTests={() => setStudentActiveTab('tests')}
          />
        )}
      </main>

      {/* Student Portal Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-6 mt-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-extrabold text-white">
              CGSSB <span className="text-emerald-400">Test</span>
            </span>
            <span className="text-slate-600">•</span>
            <span>cgssbtest.com</span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400 font-semibold">Chhattisgarh State Exam Preparation</span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={navigateToAdmin}
              title="Official Exam Controller Administration (/admin)"
              className="text-slate-400 hover:text-slate-200 transition flex items-center space-x-1.5 py-1 px-2.5 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700"
            >
              <Lock className="w-3 h-3 text-indigo-400" />
              <span>Staff & Admin Portal</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Student Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
