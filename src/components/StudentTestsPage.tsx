import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen, CheckCircle2, ChevronRight, Eye, Lock, Play, RotateCcw, Sparkles, Target, TrendingUp, Trophy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MockTest, SeriesEnrollment, TestAttempt } from '../types';
import { TestSeriesBundle } from '../data/bundleCatalog';
import { findBundleBySlugOrId, getStoredBundles, syncBundlesFromFirestore } from '../utils/bundleStore';
import { fetchMySeriesEnrollmentsFromFirestore } from '../firebase/firestoreService';
import { calculateDaysRemaining, isUserPassActive } from '../utils/devicePassManager';

export const getStudentSlug = (user?: { id: string; name?: string } | null): string => {
  if (!user) return '';
  const base = (user.name || 'student').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32) || 'student';
  let hash = 0;
  for (let i = 0; i < user.id.length; i++) hash = (hash * 31 + user.id.charCodeAt(i)) >>> 0;
  return `${base}-${hash.toString(36).slice(0, 6)}`;
};

interface Props {
  tests: MockTest[];
  attempts?: TestAttempt[];
  onStartTest: (test: MockTest) => void;
  onReviewAttempt?: (attempt: TestAttempt) => void;
  onBrowseSeries: () => void;
  onOpenAuthModal?: () => void;
}

const go = (path: string) => {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

export const StudentTestsPage: React.FC<Props> = ({ tests, attempts = [], onStartTest, onReviewAttempt, onBrowseSeries, onOpenAuthModal }) => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<SeriesEnrollment[]>([]);
  const [bundles, setBundles] = useState<TestSeriesBundle[]>(() => getStoredBundles());
  const [loading, setLoading] = useState(true);
  const slug = getStudentSlug(user);
  const routeMatch = typeof window !== 'undefined' ? window.location.pathname.match(/^\/u\/([^/]+)\/tests(?:\/(series\/([^/]+)|([^/]+)))?/i) : null;
  const requestedSlug = routeMatch ? decodeURIComponent(routeMatch[1] || '') : '';
  const requestedSeriesSlug = routeMatch?.[3] ? decodeURIComponent(routeMatch[3]) : '';
  const requestedTestId = routeMatch?.[4] ? decodeURIComponent(routeMatch[4]) : '';

  useEffect(() => {
    if (!user?.id) { setEnrollments([]); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetchMySeriesEnrollmentsFromFirestore(user.id),
      syncBundlesFromFirestore().catch(() => ({ list: [] as TestSeriesBundle[] }))
    ]).then(([rows, synced]) => {
      if (cancelled) return;
      setEnrollments(rows);
      if (synced.list?.length) setBundles(synced.list);
    }).catch(() => { if (!cancelled) setEnrollments([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user?.id]);

  const active = useMemo(() => enrollments.filter(e => e.status === 'active'), [enrollments]);
  const series = useMemo(() => active.map(e => {
    const bundle = findBundleBySlugOrId(e.seriesId, bundles);
    if (!bundle) return null;
    const ids = new Set([...(bundle.testItems || []), ...(bundle.chapterTests || []), ...(bundle.pypTests || [])].map(x => x.id));
    const list = tests.filter(t => ids.has(t.id) && t.isPublished !== false);
    const completed = list.filter(t => attempts.some(a => a.testId === t.id)).length;
    return { enrollment: e, bundle, tests: list, completed };
  }).filter(Boolean) as Array<{ enrollment: SeriesEnrollment; bundle: TestSeriesBundle; tests: MockTest[]; completed: number }>, [active, bundles, tests, attempts]);

  const enrolledTests = useMemo(() => {
    const ids = new Set(series.flatMap(s => s.tests.map(t => t.id)));
    return tests.filter(t => ids.has(t.id));
  }, [series, tests]);
  const completed = enrolledTests.filter(t => attempts.some(a => a.testId === t.id)).length;
  const relevantAttempts = attempts.filter(a => enrolledTests.some(t => t.id === a.testId));
  const average = relevantAttempts.length ? Math.round(relevantAttempts.reduce((n, a) => n + Number(a.percentage || 0), 0) / relevantAttempts.length) : null;
  const checkpointKey = (testId: string) => `cgssb_exam_session_${testId}`;
  const hasLiveCheckpointForTest = (test: MockTest): boolean => {
    try {
      const raw = localStorage.getItem(checkpointKey(test.id));
      const parsed = raw ? JSON.parse(raw) : null;
      const age = parsed?.updatedAt ? Math.max(0, Date.now() - Number(parsed.updatedAt)) : Infinity;
      const savedRemaining = Number(parsed?.secondsRemaining);
      const effectiveRemaining = savedRemaining - (Number.isFinite(age) ? Math.floor(age / 1000) : Infinity);
      return parsed?.testId === test.id
        && !!parsed?.sessionId
        && effectiveRemaining > 0
        && Number(parsed?.questionCount) === Number(test.questionCount)
        && age < 1000 * 60 * 60 * 24 * 7;
    } catch (_) {
      return false;
    }
  };
  const next = series.flatMap(s => s.tests.map(test => ({ series: s, test }))).find(x => !attempts.some(a => a.testId === x.test.id));
  const nextInProgress = series.flatMap(s => s.tests.map(test => ({ series: s, test }))).find(x => !attempts.some(a => a.testId === x.test.id) && hasLiveCheckpointForTest(x.test));
  const passActive = isUserPassActive(user);
  const passDays = calculateDaysRemaining(user?.passExpiresAt);

  if (!user) return <div className="min-h-[65vh] flex items-center justify-center px-4"><div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center"><Lock className="w-10 h-10 mx-auto text-emerald-400"/><h1 className="mt-4 text-xl font-black text-white">Your private test workspace</h1><p className="mt-2 text-sm text-slate-400">Sign in to access enrolled series, attempts and results.</p><button onClick={onOpenAuthModal} className="mt-6 w-full py-3 rounded-2xl bg-emerald-500 text-slate-950 font-black text-sm">Sign In</button></div></div>;

  if (requestedSlug && requestedSlug !== slug) { go(`/u/${slug}/tests`); return null; }

  if (requestedTestId) {
    const currentTest = enrolledTests.find(t => t.id === requestedTestId);
    if (!currentTest) {
      return <div className="max-w-3xl mx-auto px-4 py-16 text-center"><BookOpen className="w-12 h-12 mx-auto text-slate-600"/><h1 className="mt-4 text-xl font-black text-white">Test not found</h1><p className="mt-2 text-sm text-slate-400">This test is not part of your enrolled workspace.</p><button onClick={() => go(`/u/${slug}/tests`)} className="mt-6 px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-black">Back to My Tests</button></div>;
    }

    const relatedSeries = series.find(s => s.tests.some(t => t.id === currentTest.id));
    const testAttempts = attempts.filter(a => a.testId === currentTest.id).sort((a,b) => String(b.submittedAt || '').localeCompare(String(a.submittedAt || '')));
    const latestAttempt = testAttempts[0];
    const bestAttempt = testAttempts.reduce<TestAttempt | undefined>((best, item) => !best || Number(item.percentage || 0) > Number(best.percentage || 0) ? item : best, undefined);

    let checkpoint: { testId?: string; sessionId?: string; secondsRemaining?: number; questionCount?: number; updatedAt?: number } | null = null;
    try {
      const raw = localStorage.getItem(`cgssb_exam_session_${currentTest.id}`);
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed?.testId === currentTest.id && parsed?.sessionId && Number(parsed.secondsRemaining) > 0 && Number(parsed.questionCount) > 0) checkpoint = parsed;
    } catch (_) {}

    const checkpointAge = checkpoint?.updatedAt ? Math.max(0, Date.now() - checkpoint.updatedAt) : Infinity;
    const savedRemaining = Number(checkpoint?.secondsRemaining);
    const effectiveRemaining = savedRemaining - (Number.isFinite(checkpointAge) ? Math.floor(checkpointAge / 1000) : Infinity);
    const hasLiveCheckpoint = !!checkpoint
      && checkpoint.questionCount === currentTest.questionCount
      && effectiveRemaining > 0
      && checkpointAge < 1000 * 60 * 60 * 24 * 7;
    const completion = latestAttempt ? Number(latestAttempt.percentage || 0) : null;

    return <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 space-y-6">
      <button onClick={() => relatedSeries ? go(`/u/${slug}/tests/series/${relatedSeries.bundle.slug}`) : go(`/u/${slug}/tests`)} className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white">← Back to {relatedSeries ? 'Series' : 'My Tests'}</button>

      <section className="rounded-[28px] border border-emerald-500/20 bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-950 p-5 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black border ${hasLiveCheckpoint ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' : latestAttempt ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'}`}>
                {hasLiveCheckpoint ? 'IN PROGRESS' : latestAttempt ? 'COMPLETED' : 'AVAILABLE'}
              </span>
              {relatedSeries && <span className="text-[10px] text-slate-500">{relatedSeries.bundle.title}</span>}
            </div>
            <h1 className="mt-3 text-2xl sm:text-3xl font-black text-white">{currentTest.title}</h1>
            <p className="mt-2 text-sm text-slate-400 max-w-3xl">{currentTest.description || 'Full-length exam simulation with section-wise performance analysis.'}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 shrink-0 min-w-[180px]">
            <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-3"><div className="text-lg font-black text-white">{currentTest.questionCount}</div><div className="text-[10px] text-slate-500">Questions</div></div>
            <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-3"><div className="text-lg font-black text-white">{currentTest.durationMinutes}m</div><div className="text-[10px] text-slate-500">Duration</div></div>
            <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-3"><div className="text-lg font-black text-white">+{currentTest.marksPerQuestion}</div><div className="text-[10px] text-slate-500">Correct</div></div>
            <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-3"><div className="text-lg font-black text-white">-{Number(currentTest.negativeMarksPerQuestion || 0).toFixed(2)}</div><div className="text-[10px] text-slate-500">Negative</div></div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-3xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Test Control Center</div>
          {hasLiveCheckpoint ? (
            <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
              <div className="text-sm font-black text-amber-200">Your exam session is saved on this device.</div>
              <div className="mt-1 text-xs text-slate-400">You can continue from the saved question and remaining time. Your answers are kept locally until you submit.</div>
            </div>
          ) : latestAttempt ? (
            <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <div className="text-sm font-black text-emerald-200">Latest attempt: {completion}%</div>
              <div className="mt-1 text-xs text-slate-400">{latestAttempt.correctCount} correct · {latestAttempt.incorrectCount} incorrect · {latestAttempt.unattemptedCount} unattempted</div>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4">
              <div className="text-sm font-black text-indigo-200">Ready to start</div>
              <div className="mt-1 text-xs text-slate-400">No attempt has been submitted for this test yet.</div>
            </div>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            <button onClick={() => onStartTest(currentTest)} className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black">
              {hasLiveCheckpoint ? <Play className="w-4 h-4 fill-current"/> : latestAttempt ? <RotateCcw className="w-4 h-4"/> : <Play className="w-4 h-4 fill-current"/>}
              {hasLiveCheckpoint ? 'Continue Test' : latestAttempt ? 'Re-attempt Test' : 'Start Test'}
            </button>
            {latestAttempt && onReviewAttempt && <button onClick={() => onReviewAttempt(latestAttempt)} className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-sky-300 text-xs font-black"><Eye className="w-4 h-4"/> View Latest Result</button>}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Performance</div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div><div className="text-2xl font-black text-white">{testAttempts.length}</div><div className="text-[10px] text-slate-500">Attempts</div></div>
            <div><div className="text-2xl font-black text-emerald-300">{bestAttempt ? `${Math.round(Number(bestAttempt.percentage || 0))}%` : '—'}</div><div className="text-[10px] text-slate-500">Best Score</div></div>
          </div>
          {latestAttempt && <div className="mt-5 pt-4 border-t border-slate-800 text-xs text-slate-400"><div>Accuracy: <strong className="text-white">{latestAttempt.accuracy}%</strong></div><div className="mt-1">Time: <strong className="text-white">{Math.round(Number(latestAttempt.timeTakenSeconds || 0) / 60)} min</strong></div></div>}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6">
        <h2 className="text-base font-black text-white">Before You Start</h2>
        <ul className="mt-3 space-y-2 text-xs text-slate-400 list-disc pl-5">
          <li>{currentTest.questionCount} questions · {currentTest.durationMinutes} minutes</li>
          <li>Correct answer: +{currentTest.marksPerQuestion} marks</li>
          <li>Incorrect answer: -{Number(currentTest.negativeMarksPerQuestion || 0).toFixed(2)} marks</li>
          <li>Your in-progress answers are saved locally on this device and restored when you reopen the test.</li>
        </ul>
      </section>
    </div>;
  }

  if (requestedSeriesSlug) {
    const currentSeries = series.find(s => s.bundle.slug === requestedSeriesSlug);
    if (!currentSeries) return <div className="max-w-3xl mx-auto px-4 py-16 text-center"><BookOpen className="w-12 h-12 mx-auto text-slate-600"/><h1 className="mt-4 text-xl font-black text-white">Test series not found</h1><p className="mt-2 text-sm text-slate-400">This series is not available in your enrolled workspace.</p><button onClick={() => go(`/u/${slug}/tests`)} className="mt-6 px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-black">Back to My Tests</button></div>;
    const progress = currentSeries.tests.length ? Math.round(currentSeries.completed / currentSeries.tests.length * 100) : 0;
    return <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 space-y-6">
      <button onClick={() => go(`/u/${slug}/tests`)} className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white">← Back to My Tests</button>
      <section className="rounded-[28px] border border-emerald-500/20 bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-950 p-5 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div className="min-w-0"><span className="text-[10px] font-black tracking-widest uppercase text-emerald-400">My Enrolled Series</span><h1 className="mt-2 text-2xl sm:text-3xl font-black text-white">{currentSeries.bundle.title}</h1><p className="mt-2 text-sm text-slate-400 max-w-3xl">{currentSeries.bundle.shortDescription}</p></div>
          <div className="shrink-0 text-right"><div className="text-2xl font-black text-emerald-300">{progress}%</div><div className="text-[10px] text-slate-500">completed</div></div>
        </div>
        <div className="mt-6"><div className="flex justify-between text-[11px] mb-1.5"><span className="text-slate-400">{currentSeries.completed} of {currentSeries.tests.length} tests completed</span><span className="text-slate-500">{currentSeries.tests.length} tests</span></div><div className="h-2.5 rounded-full bg-slate-800 overflow-hidden"><div className="h-full rounded-full bg-emerald-500" style={{width:`${progress}%`}}/></div></div>
      </section>
      <section className="space-y-2">
        {currentSeries.tests.length === 0 ? <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-sm text-slate-400">No published tests are currently attached to this series.</div> :
        currentSeries.tests.map((test, index) => {
          const attempt = attempts.find(a => a.testId === test.id);
          const isCompleted = !!attempt;
          const isInProgress = !isCompleted && hasLiveCheckpointForTest(test);
          return <div key={test.id} className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-black text-slate-300 shrink-0">{String(index + 1).padStart(2,'0')}</div>
                <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={`px-2 py-0.5 rounded-md text-[9px] font-black border ${isCompleted ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'}`}>{isCompleted ? 'COMPLETED' : 'AVAILABLE'}</span><span className="text-[10px] text-slate-500">{test.questionCount} Questions · {test.durationMinutes} min</span></div><button onClick={() => go(`/u/${slug}/tests/${encodeURIComponent(test.id)}`)} className="mt-1 text-sm sm:text-base font-bold text-white truncate text-left hover:text-emerald-300">{test.title}</button></div>
              </div>
              <div className="flex items-center gap-2 sm:justify-end">
                {isCompleted && onReviewAttempt && <button onClick={() => onReviewAttempt(attempt)} className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sky-300 text-[10px] font-black inline-flex items-center justify-center gap-1.5"><Eye className="w-3.5 h-3.5"/> Result</button>}
                <button onClick={() => onStartTest(test)} className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-black inline-flex items-center justify-center gap-1.5">{isCompleted ? <RotateCcw className="w-3.5 h-3.5"/> : <Play className="w-3.5 h-3.5 fill-current"/>}{isCompleted ? 'Re-attempt' : isInProgress ? 'Continue' : 'Start Test'}</button>
              </div>
            </div>
          </div>;
        })}
      </section>
    </div>;
  }

  return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 space-y-6">
    <section className="relative overflow-hidden rounded-[28px] border border-emerald-500/20 bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-950 p-5 sm:p-8 shadow-2xl">
      <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl"/>
      <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div><div className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-widest"><Sparkles className="w-4 h-4"/> Student Workspace</div><h1 className="mt-2 text-2xl sm:text-4xl font-black text-white">My Tests</h1><p className="mt-2 text-sm text-slate-300">Your enrolled preparation, progress and results — all in one place.</p></div>
        <button onClick={onBrowseSeries} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 border border-white/10 text-white text-xs font-black">Browse Test Series <ArrowRight className="w-4 h-4"/></button>
      </div>
    </section>

    <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[[ 'Enrolled Series', active.length, BookOpen ],['Available Tests', enrolledTests.length, Target],['Completed', completed, CheckCircle2],['Average Score', average === null ? '—' : `${average}%`, TrendingUp]].map(([label,value,Icon]: any) => <div key={label} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4"><Icon className="w-4 h-4 text-emerald-400"/><div className="mt-3 text-xl sm:text-2xl font-black text-white">{value}</div><div className="text-[11px] text-slate-400">{label}</div></div>)}
    </section>

    {passActive && <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs"><span className="text-amber-200"><Trophy className="inline w-4 h-4 mr-2 text-amber-400"/><strong>All-Access Pass active</strong> · {passDays > 0 ? `${passDays} days remaining` : 'Active'}</span></div>}

    {(nextInProgress || next) && (() => { const target = nextInProgress || next!; const inProgress = !!nextInProgress; return <section className="rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/50 to-slate-900 p-5 sm:p-6"><div className="text-[10px] font-black uppercase tracking-widest text-indigo-300">{inProgress ? 'Resume Preparation' : 'Continue Preparation'}</div><div className="mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div className="min-w-0"><h2 className="text-lg font-black text-white truncate">{target.test.title}</h2><p className="text-xs text-slate-400 mt-1">{target.series.bundle.title} · {target.test.questionCount} Questions · {target.test.durationMinutes} Minutes</p></div><button onClick={() => onStartTest(target.test)} className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 text-slate-950 text-xs font-black"><Play className="w-4 h-4 fill-current"/> {inProgress ? 'Continue Test' : 'Start Next Test'}</button></div></section>; })()}

    <section><div className="mb-3"><h2 className="text-lg font-black text-white">My Test Series</h2><p className="text-xs text-slate-400 mt-1">Open a series to continue from its complete test list.</p></div>
      {loading ? <div className="rounded-3xl border border-slate-800 bg-slate-900 p-10 text-center text-sm text-slate-400">Loading your test workspace…</div> :
      !series.length ? <div className="rounded-3xl border border-slate-800 bg-slate-900 p-10 text-center"><BookOpen className="w-10 h-10 mx-auto text-slate-600"/><h3 className="mt-3 font-black text-white">No enrolled test series yet</h3><p className="mt-1 text-xs text-slate-400">Browse a series and enroll with your active pass.</p><button onClick={onBrowseSeries} className="mt-5 px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-black">Explore Test Series</button></div> :
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{series.map(s => { const pct=s.tests.length?Math.round(s.completed/s.tests.length*100):0; return <button key={s.enrollment.id} onClick={() => go(`/u/${slug}/tests/series/${s.bundle.slug}`)} className="text-left rounded-3xl border border-slate-800 bg-slate-900/90 hover:border-emerald-500/30 p-5 group"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><span className="px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-300">ENROLLED</span><h3 className="mt-3 text-base sm:text-lg font-black text-white group-hover:text-emerald-300 truncate">{s.bundle.title}</h3><p className="mt-1 text-xs text-slate-400 line-clamp-2">{s.bundle.shortDescription}</p></div><ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-emerald-400 shrink-0"/></div><div className="mt-5 flex items-center justify-between text-[11px] mb-1.5"><span className="text-slate-400">Preparation progress</span><span className="text-emerald-300 font-black">{pct}%</span></div><div className="h-2 rounded-full bg-slate-800 overflow-hidden"><div className="h-full rounded-full bg-emerald-500" style={{width:`${pct}%`}}/></div><div className="mt-4 text-[11px] text-slate-500">{s.completed}/{s.tests.length} tests completed</div></button>})}</div>}
    </section>

    <section><div className="mb-3"><h2 className="text-lg font-black text-white">Your Tests</h2><p className="text-xs text-slate-400 mt-1">Quick access to tests from your enrolled series.</p></div>
      {!enrolledTests.length && !loading ? <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-400">Tests will appear here once your enrolled series is available.</div> :
      <div className="space-y-2">{enrolledTests.map(test => { const attempt=attempts.find(a=>a.testId===test.id); return <div key={test.id} className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-3.5 sm:p-4"><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className={`px-2 py-0.5 rounded-md text-[9px] font-black border ${attempt?'bg-emerald-500/10 text-emerald-300 border-emerald-500/20':'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'}`}>{attempt?'COMPLETED':'AVAILABLE'}</span><span className="text-[10px] text-slate-500">{test.questionCount} Q · {test.durationMinutes} min</span></div><button onClick={() => go(`/u/${slug}/tests/${encodeURIComponent(test.id)}`)} className="mt-1 text-sm font-bold text-white truncate text-left hover:text-emerald-300">{test.title}</button></div><div className="flex items-center gap-2">{attempt&&onReviewAttempt&&<button onClick={()=>onReviewAttempt(attempt)} className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sky-300 text-[10px] font-black inline-flex items-center gap-1.5"><Eye className="w-3.5 h-3.5"/> Result</button>}<button onClick={()=>onStartTest(test)} className="px-3.5 py-2 rounded-xl bg-emerald-500 text-slate-950 text-[10px] font-black inline-flex items-center gap-1.5">{attempt ? <RotateCcw className="w-3.5 h-3.5"/> : <Play className="w-3.5 h-3.5 fill-current" />}{attempt ? 'Re-attempt' : hasLiveCheckpointForTest(test) ? 'Continue' : 'Start'}</button></div></div>})}</div>}
    </section>
  </div>;
};
