import React, { useEffect, useMemo, useState } from 'react';
import { Trophy, MapPin, RefreshCw, Play, Shield, Layers } from 'lucide-react';
import { MockTest, LeaderboardProfileRecord } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  fetchLeaderboardProfilesFromFirestore,
  fetchMyLeaderboardProfileFromFirestore,
} from '../firebase/firestoreService';

interface LiveTestLeaderboardProps {
  tests: MockTest[];
  initialTestId?: string;
  onStartTest: (test: MockTest) => void;
  onExplorePass?: () => void;
}

type Mode = 'target' | 'series' | 'test';

interface Candidate extends LeaderboardProfileRecord {
  rank: number;
  percentile: number;
}

const normalizeTargetLabel = (target?: string) => {
  const s = String(target || '').trim();
  if (/cgpsc/i.test(s)) return 'CGPSC State Service 2026';
  if (/teacher|shikshak|assistant/i.test(s)) return 'CGSSB Teacher / Recruitment 2026';
  if (/cgssb|vyapam/i.test(s)) return 'CGSSB Recruitment 2026';
  return s || 'Exam Target';
};

const deriveTargetKey = (test: MockTest) => {
  if (test.targetKey) return test.targetKey;
  const exam = test.examName || test.title;
  const authority = String(test.authority || test.category || 'CG').toUpperCase();
  const normalized = String(exam).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
  return authority + ':' + normalized + ':2026';
};

const RankingCard: React.FC<{ candidate?: Candidate; place: 1 | 2 | 3 }> = ({ candidate, place }) => {
  if (!candidate) {
    return <div className="bg-slate-950/60 border border-slate-800 rounded-3xl p-6 min-h-[180px] flex flex-col items-center justify-center text-center"><Trophy className="w-9 h-9 text-slate-700" /><p className="text-xs text-slate-500 mt-2">Awaiting qualifying attempts</p></div>;
  }
  const medal = place === 1 ? '🥇' : place === 2 ? '🥈' : '🥉';
  return <div className={'bg-slate-900 border rounded-3xl p-5 text-center shadow-xl ' + (place === 1 ? 'border-amber-400/60 md:-translate-y-3' : place === 2 ? 'border-slate-300/40' : 'border-orange-400/40')}>
    <div className="text-2xl">{medal}</div>
    <div className="w-14 h-14 mx-auto mt-2 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl font-black text-white">{candidate.candidateName.charAt(0).toUpperCase()}</div>
    <h3 className="text-sm font-black text-white mt-3 truncate">{candidate.candidateName}</h3>
    <p className="text-[10px] text-slate-500 flex justify-center items-center gap-1"><MapPin className="w-3 h-3" />{candidate.district || 'Chhattisgarh'}</p>
    <div className="grid grid-cols-3 gap-2 mt-3 text-[10px]">
      <div><span className="block text-slate-500">Rank</span><b className="text-white">#{candidate.rank}</b></div>
      <div><span className="block text-slate-500">Score</span><b className="text-emerald-300">{candidate.averagePercentage}%</b></div>
      <div><span className="block text-slate-500">Percentile</span><b className="text-amber-300">{candidate.percentile}</b></div>
    </div>
  </div>;
};

export const LiveTestLeaderboard: React.FC<LiveTestLeaderboardProps> = ({ tests, initialTestId, onStartTest, onExplorePass }) => {
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>('target');
  const [targetKey, setTargetKey] = useState('');
  const [seriesKey, setSeriesKey] = useState('');
  const [testId, setTestId] = useState(initialTestId || '');
  const [district, setDistrict] = useState('All Districts');
  const [profiles, setProfiles] = useState<LeaderboardProfileRecord[]>([]);
  const [myProfile, setMyProfile] = useState<LeaderboardProfileRecord | null>(null);
  const [totalCandidates, setTotalCandidates] = useState(0);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [myPercentile, setMyPercentile] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const targetOptions = useMemo(() => {
    const map = new Map<string, string>();
    tests.forEach(test => {
      const key = deriveTargetKey(test);
      map.set(key, normalizeTargetLabel(test.examName || test.title));
    });
    if (user?.targetExam) {
      const matching = tests.find(t => /cgpsc/i.test(user.targetExam || '') === /cgpsc/i.test(t.examName || t.title));
      if (matching) map.set(deriveTargetKey(matching), normalizeTargetLabel(user.targetExam));
    }
    return [...map.entries()].map(([key, label]) => ({ key, label }));
  }, [tests, user?.targetExam]);

  useEffect(() => {
    if (!targetKey && targetOptions.length) {
      const mine = user?.targetExam ? targetOptions.find(o => o.label === normalizeTargetLabel(user.targetExam)) : undefined;
      setTargetKey(mine?.key || targetOptions[0].key);
    }
  }, [targetKey, targetOptions, user?.targetExam]);

  const seriesOptions = useMemo(() => {
    const map = new Map<string, string>();
    tests.filter(t => !targetKey || deriveTargetKey(t) === targetKey).forEach(t => {
      if (t.bundleId) map.set(t.bundleId, t.title.split(' Mock')[0] || t.bundleId);
    });
    return [...map.entries()].map(([id, label]) => ({ id, label: 'Series: ' + label }));
  }, [tests, targetKey]);

  useEffect(() => {
    if (!seriesKey && seriesOptions.length) setSeriesKey(seriesOptions[0].id);
  }, [seriesKey, seriesOptions]);

  useEffect(() => {
    if (!testId && tests.length) setTestId(tests[0].id);
  }, [testId, tests]);

  const query = useMemo(() => {
    if (mode === 'test') return { scopeType: 'test' as const, scopeKey: testId };
    if (mode === 'series') return { scopeType: 'series' as const, scopeKey: seriesKey };
    return { scopeType: 'target' as const, scopeKey: targetKey };
  }, [mode, testId, seriesKey, targetKey]);

  const title = mode === 'test'
    ? (tests.find(t => t.id === testId)?.title || 'Individual Test')
    : mode === 'series'
      ? (seriesOptions.find(s => s.id === seriesKey)?.label || 'Test Series')
      : (targetOptions.find(t => t.key === targetKey)?.label || 'Exam Target');

  const load = async () => {
    if (!query.scopeKey) return;
    setLoading(true);
    try {
      const [top, mine] = await Promise.all([
        fetchLeaderboardProfilesFromFirestore({ ...query, district, limitCount: 100 }),
        user?.id ? fetchMyLeaderboardProfileFromFirestore(user.id, query) : Promise.resolve(null),
      ]);
      setProfiles(top);
      setMyProfile(mine);
      const visibleCount = top.length;
      setTotalCandidates(visibleCount);
      if (mine) {
        const visibleIndex = top.findIndex(p => p.userId === mine.userId);
        if (visibleIndex >= 0) {
          const rank = visibleIndex + 1;
          setMyRank(rank);
          setMyPercentile(visibleCount > 0 ? Number((((visibleCount - rank) / visibleCount) * 100).toFixed(2)) : 0);
        } else {
          setMyRank(null);
          setMyPercentile(null);
        }
      } else {
        setMyRank(null);
        setMyPercentile(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [query.scopeKey, query.scopeType, district, user?.id]);

  const ranked = useMemo<Candidate[]>(() => {
    return profiles.map((p, index) => {
      const rank = p.userId === user?.id && myRank ? myRank : index + 1;
      const percentile = p.userId === user?.id && myPercentile !== null
        ? myPercentile
        : totalCandidates > 0
          ? Number((((totalCandidates - (index + 1)) / totalCandidates) * 100).toFixed(2))
          : 0;
      return { ...p, rank, percentile };
    });
  }, [profiles, user?.id, myRank, myPercentile, totalCandidates]);

  const me = myProfile ? {
    ...myProfile,
    rank: myRank || 0,
    percentile: myPercentile || 0,
  } : null;

  const distribution = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => ({
      label: i * 10 + '-' + ((i + 1) * 10),
      count: profiles.filter(p => Math.min(9, Math.floor(p.averagePercentage / 10)) === i).length
    }));
  }, [profiles]);

  return <div className="space-y-6">
    <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="text-[11px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />CGTEST Performance Hub</div>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-1 flex items-center gap-2">Exam Target Rankings <Trophy className="w-6 h-6 text-amber-400" /></h2>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">{title}. Rankings are based on compact CGTEST practice profiles, not official CGPSC/CGSSB recruitment ranks.</p>
        </div>
        <button onClick={() => void load()} className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 cursor-pointer" title="Refresh"><RefreshCw className={'w-4 h-4 ' + (loading ? 'animate-spin text-emerald-400' : '')} /></button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800">
        {([['target', '🎯 Exam Target'], ['series', '📚 Test Series'], ['test', '📝 Individual Test']] as [Mode, string][]).map(([v, l]) =>
          <button key={v} onClick={() => setMode(v)} className={'py-2.5 rounded-xl text-xs font-black cursor-pointer ' + (mode === v ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white')}>{l}</button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {mode !== 'test' && <label className="text-[10px] text-slate-500 uppercase font-bold">Exam Target
          <select value={targetKey} onChange={e => { setTargetKey(e.target.value); setSeriesKey(''); }} className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-bold">
            {targetOptions.length ? targetOptions.map(o => <option key={o.key} value={o.key}>{o.label}</option>) : <option>No target data yet</option>}
          </select>
        </label>}
        {mode === 'series' && <label className="text-[10px] text-slate-500 uppercase font-bold">Test Series
          <select value={seriesKey} onChange={e => setSeriesKey(e.target.value)} className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-bold">
            {seriesOptions.length ? seriesOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>) : <option>No series data yet</option>}
          </select>
        </label>}
        {mode === 'test' && <label className="text-[10px] text-slate-500 uppercase font-bold md:col-span-2">Individual Test
          <select value={testId} onChange={e => setTestId(e.target.value)} className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-bold">
            {tests.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </label>}
        <label className="text-[10px] text-slate-500 uppercase font-bold">District
          <select value={district} onChange={e => setDistrict(e.target.value)} className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-bold">
            <option>All Districts</option><option>Raipur</option><option>Bilaspur</option><option>Durg</option><option>Bastar</option><option>Rajnandgaon</option><option>Surguja</option><option>Korba</option><option>Dhamtari</option><option>Kanker</option><option>Mahasamund</option><option>Raigarh</option>
          </select>
        </label>
      </div>
    </section>

    {me && <section className="bg-gradient-to-r from-emerald-950/50 to-slate-900 border border-emerald-500/30 rounded-3xl p-5 sm:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div><p className="text-[10px] uppercase font-black tracking-widest text-emerald-400">Your CGTEST Standing</p><h3 className="text-3xl font-black text-white mt-1">#{me.rank}</h3><p className="text-xs text-slate-400 mt-1">among {totalCandidates.toLocaleString('en-IN')} qualifying candidates</p></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-950/70 rounded-2xl px-4 py-3"><span className="text-[10px] text-slate-500 block">Percentile</span><b className="text-lg text-amber-300">{me.percentile}</b></div>
          <div className="bg-slate-950/70 rounded-2xl px-4 py-3"><span className="text-[10px] text-slate-500 block">Avg Score</span><b className="text-lg text-emerald-300">{me.averagePercentage}%</b></div>
          <div className="bg-slate-950/70 rounded-2xl px-4 py-3"><span className="text-[10px] text-slate-500 block">Accuracy</span><b className="text-lg text-white">{me.averageAccuracy}%</b></div>
          <div className="bg-slate-950/70 rounded-2xl px-4 py-3"><span className="text-[10px] text-slate-500 block">Tests</span><b className="text-lg text-white">{me.testsTaken}</b></div>
        </div>
      </div>
    </section>}

    <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4"><div><h3 className="text-base font-black text-white flex items-center gap-2"><Layers className="w-4 h-4 text-emerald-400" />Score Distribution</h3><p className="text-[11px] text-slate-500">Distribution across the visible top-100 ranking window.</p></div><span className="text-xs text-slate-500 font-bold">{totalCandidates.toLocaleString('en-IN')} candidates</span></div>
      {profiles.length >= 3 ? <div className="h-44 flex items-end gap-1 sm:gap-2">{distribution.map((b, i) => { const max = Math.max(...distribution.map(x => x.count), 1); const h = Math.max(4, Math.round(b.count / max * 100)); const mine = me && Math.floor(me.averagePercentage / 10) === i; return <div key={b.label} className="flex-1 h-full flex flex-col justify-end items-center gap-1"><span className="text-[9px] text-slate-500">{b.count || ''}</span><div className={'w-full rounded-t-lg ' + (mine ? 'bg-amber-400' : 'bg-emerald-500/50')} style={{ height: h + '%' }} /><span className={'text-[8px] ' + (mine ? 'text-amber-300 font-black' : 'text-slate-600')}>{b.label}</span></div>; })}</div> : <div className="py-12 text-center text-xs text-slate-500">Distribution will appear after at least 3 qualifying profiles are recorded.</div>}
    </section>

    <section className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end"><RankingCard candidate={ranked[1]} place={2} /><RankingCard candidate={ranked[0]} place={1} /><RankingCard candidate={ranked[2]} place={3} /></section>

    <section className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
      <div className="p-5 border-b border-slate-800 flex items-center justify-between"><div><h3 className="text-lg font-black text-white">Full Ranking</h3><p className="text-xs text-slate-500 mt-1">Top 100 profiles are loaded; ranking is calculated within the visible top-100 practice window.</p></div><div className="text-xs text-emerald-300 flex items-center gap-1"><Shield className="w-3.5 h-3.5" />Scalable profile index</div></div>
      {ranked.length ? <div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-slate-950 text-[10px] uppercase text-slate-500"><tr><th className="px-5 py-3">Rank</th><th className="px-5 py-3">Aspirant</th><th className="px-5 py-3">District</th><th className="px-5 py-3">Score %</th><th className="px-5 py-3">Percentile</th><th className="px-5 py-3">Accuracy</th><th className="px-5 py-3">Tests</th></tr></thead><tbody className="divide-y divide-slate-800">{ranked.map(c => <tr key={c.id} className={c.userId === user?.id ? 'bg-emerald-500/10' : 'hover:bg-slate-800/30'}><td className="px-5 py-3 font-black text-white">#{c.rank}</td><td className="px-5 py-3"><div className="font-bold text-sm text-white">{c.candidateName}{c.userId === user?.id ? ' (You)' : ''}</div><div className="text-[10px] text-slate-500">{c.category || 'UR'}</div></td><td className="px-5 py-3 text-xs text-slate-400">{c.district || 'Chhattisgarh'}</td><td className="px-5 py-3 font-black text-emerald-300">{c.averagePercentage}%</td><td className="px-5 py-3 font-black text-amber-300">{c.percentile}</td><td className="px-5 py-3 text-xs text-slate-300">{c.averageAccuracy}%</td><td className="px-5 py-3 text-xs text-slate-300">{c.testsTaken}</td></tr>)}</tbody></table></div> : <div className="py-16 px-6 text-center"><Trophy className="w-10 h-10 mx-auto text-slate-700" /><h4 className="font-black text-white mt-3">No qualifying ranking data yet</h4><p className="text-xs text-slate-500 mt-2">Complete a qualifying test to create your practice ranking profile.</p><div className="flex justify-center gap-2 mt-5">{tests[0] && <button onClick={() => onStartTest(tests[0])} className="px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs cursor-pointer"><Play className="inline w-3.5 h-3.5 mr-1" />Attempt a Test</button>}{onExplorePass && <button onClick={onExplorePass} className="px-4 py-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs border border-slate-700 cursor-pointer">View Pass</button>}</div></div>}
    </section>
  </div>;
};
