import React, { useEffect, useMemo, useState } from 'react';
import { Trophy, Medal, Target, Users, MapPin, RefreshCw, Play, Shield, Layers } from 'lucide-react';
import { MockTest, LeaderboardEntryRecord } from '../types';
import { useAuth } from '../context/AuthContext';
import { fetchLeaderboardEntriesFromFirestore } from '../firebase/firestoreService';

interface LiveTestLeaderboardProps {
  tests: MockTest[];
  initialTestId?: string;
  onStartTest: (test: MockTest) => void;
  onExplorePass?: () => void;
}
type Mode = 'target' | 'series' | 'test';
interface Candidate {
  userId: string; name: string; district: string; category: string;
  percentage: number; accuracy: number; score: number; maxScore: number;
  tests: number; percentile: number; rank: number; time: number;
}

const labelForTarget = (target?: string) => {
  const s = String(target || '').trim();
  if (/cgpsc/i.test(s)) return 'CGPSC State Service 2026';
  if (/teacher|shikshak|assistant/i.test(s)) return 'CGSSB Teacher / Recruitment 2026';
  if (/cgssb|vyapam/i.test(s)) return 'CGSSB Recruitment 2026';
  return s || 'Exam Target';
};

const bestPerTest = (rows: LeaderboardEntryRecord[]) => {
  const m = new Map<string, LeaderboardEntryRecord>();
  rows.forEach(r => {
    const k = r.userId + ':' + r.testId;
    const old = m.get(k);
    if (!old || r.percentage > old.percentage || (r.percentage === old.percentage && r.timeTakenSeconds < old.timeTakenSeconds)) m.set(k, r);
  });
  return [...m.values()];
};

const buildRanking = (rows: LeaderboardEntryRecord[], minimumTests: number): Candidate[] => {
  const byUser = new Map<string, LeaderboardEntryRecord[]>();
  bestPerTest(rows).forEach(r => {
    const list = byUser.get(r.userId) || [];
    list.push(r); byUser.set(r.userId, list);
  });
  const candidates: Candidate[] = [];
  byUser.forEach((list, userId) => {
    if (list.length < minimumTests) return;
    const percentage = +(list.reduce((s, r) => s + r.percentage, 0) / list.length).toFixed(2);
    const accuracy = +(list.reduce((s, r) => s + r.accuracy, 0) / list.length).toFixed(2);
    const score = +(list.reduce((s, r) => s + r.score, 0) / list.length).toFixed(2);
    const maxScore = +(list.reduce((s, r) => s + r.maxScore, 0) / list.length).toFixed(2);
    const first = list[0];
    candidates.push({
      userId, name: first.candidateName || 'Aspirant', district: first.district || 'Chhattisgarh',
      category: first.category || 'UR', percentage, accuracy, score, maxScore, tests: list.length,
      percentile: 0, rank: 0,
      time: Math.round(list.reduce((s, r) => s + r.timeTakenSeconds, 0) / list.length)
    });
  });
  candidates.sort((a,b) => b.percentage-a.percentage || b.accuracy-a.accuracy || a.time-b.time || a.name.localeCompare(b.name));
  const scores = candidates.map(c => c.percentage);
  return candidates.map((c,i) => ({
    ...c,
    rank: i + 1,
    percentile: +((((scores.filter(x => x < c.percentage).length + scores.filter(x => x === c.percentage).length * 0.5) / Math.max(scores.length,1)) * 100).toFixed(2))
  }));
};

const Podium: React.FC<{candidate?: Candidate; place: 1|2|3}> = ({candidate, place}) => {
  const medal = place === 1 ? '🥇' : place === 2 ? '🥈' : '🥉';
  if (!candidate) return <div className="bg-slate-950/60 border border-slate-800 rounded-3xl p-6 min-h-[185px] flex flex-col items-center justify-center text-center"><Trophy className="w-9 h-9 text-slate-700"/><p className="text-xs text-slate-500 mt-2">Awaiting qualifying attempts</p></div>;
  return <div className={'bg-slate-900 border rounded-3xl p-5 text-center shadow-xl ' + (place===1 ? 'border-amber-400/60 md:-translate-y-3' : place===2 ? 'border-slate-300/40' : 'border-orange-400/40')}>
    <div className="text-2xl">{medal}</div>
    <div className="w-14 h-14 mx-auto mt-2 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl font-black text-white">{candidate.name.charAt(0).toUpperCase()}</div>
    <h3 className="text-sm font-black text-white mt-3 truncate">{candidate.name}</h3>
    <p className="text-[10px] text-slate-500 flex justify-center items-center gap-1"><MapPin className="w-3 h-3"/>{candidate.district}</p>
    <div className="grid grid-cols-3 gap-2 mt-3 text-[10px]"><div><span className="block text-slate-500">Rank</span><b className="text-white">#{candidate.rank}</b></div><div><span className="block text-slate-500">Score</span><b className="text-emerald-300">{candidate.percentage}%</b></div><div><span className="block text-slate-500">Percentile</span><b className="text-amber-300">{candidate.percentile}</b></div></div>
  </div>;
};

export const LiveTestLeaderboard: React.FC<LiveTestLeaderboardProps> = ({tests, initialTestId, onStartTest, onExplorePass}) => {
  const {user} = useAuth();
  const [rows,setRows]=useState<LeaderboardEntryRecord[]>([]);
  const [mode,setMode]=useState<Mode>('target');
  const [target,setTarget]=useState('');
  const [series,setSeries]=useState('');
  const [testId,setTestId]=useState(initialTestId || '');
  const [district,setDistrict]=useState('All Districts');
  const [loading,setLoading]=useState(false);

  const refresh=async()=>{setLoading(true);try{setRows(await fetchLeaderboardEntriesFromFirestore())}finally{setLoading(false)}};
  useEffect(()=>{void refresh()},[]);

  const targets=useMemo(()=>{
    const m=new Map<string,string>();
    rows.forEach(r=>m.set(r.targetKey,labelForTarget(r.targetExam)));
    if(user?.targetExam){
      const authority=/cgpsc/i.test(user.targetExam)?'CGPSC':'CGSSB';
      const key=authority+':'+String(user.targetExam).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80)+':'+(user.targetYear||2026);
      m.set(key,labelForTarget(user.targetExam));
    }
    return [...m.entries()].map(([key,label])=>({key,label}));
  },[rows,user?.targetExam,user?.targetYear]);

  useEffect(()=>{
    if(!target && targets.length){
      const mine=user?.targetExam ? targets.find(t=>t.label===labelForTarget(user.targetExam)) : undefined;
      setTarget(mine?.key || targets[0].key);
    }
  },[target,targets,user?.targetExam]);

  const seriesOptions=useMemo(()=>{
    const m=new Map<string,string>();
    rows.filter(r=>!target||r.targetKey===target).forEach(r=>{
      if(r.seriesId && !m.has(r.seriesId)){
        const t=tests.find(x=>x.id===r.testId);
        m.set(r.seriesId,t?.title ? 'Series: '+t.title.split(' Mock')[0] : r.seriesId);
      }
    });
    return [...m.entries()].map(([id,label])=>({id,label}));
  },[rows,target,tests]);

  useEffect(()=>{if(!series&&seriesOptions.length)setSeries(seriesOptions[0].id)},[series,seriesOptions]);
  useEffect(()=>{if(!testId&&tests.length)setTestId(tests[0].id)},[testId,tests]);

  const scoped=useMemo(()=>{
    if(mode==='test') return rows.filter(r=>r.testId===testId);
    if(mode==='series') return rows.filter(r=>(!target||r.targetKey===target)&&(!series||r.seriesId===series));
    return rows.filter(r=>!target||r.targetKey===target);
  },[rows,mode,target,series,testId]);

  const minimumTests=mode==='test'?1:2;
  const ranked=useMemo(()=>buildRanking(scoped,minimumTests),[scoped,minimumTests]);
  const visible=useMemo(()=>{
    if(district==='All Districts')return ranked;
    const d=district.split(' ')[0].toLowerCase();
    return ranked.filter(c=>c.district.toLowerCase().includes(d)||c.userId===user?.id);
  },[ranked,district,user?.id]);

  const me=visible.find(c=>c.userId===user?.id);
  const distribution=useMemo(()=>Array.from({length:10},(_,i)=>({label:i*10+'-'+((i+1)*10),count:visible.filter(c=>Math.min(9,Math.floor(c.percentage/10))===i).length})),[visible]);
  const title=mode==='test'?(tests.find(t=>t.id===testId)?.title||'Individual Test'):mode==='series'?(seriesOptions.find(s=>s.id===series)?.label||'Test Series'):(targets.find(t=>t.key===target)?.label||'Exam Target');

  return <div className="space-y-6">
    <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div><div className="text-[11px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/>CGTEST Performance Hub</div><h2 className="text-2xl sm:text-3xl font-black text-white mt-1 flex items-center gap-2">Exam Target Rankings <Trophy className="w-6 h-6 text-amber-400"/></h2><p className="text-xs text-slate-400 mt-1 max-w-3xl">{title}. This is a CGTEST practice ranking based on recorded attempts, not an official CGPSC/CGSSB rank.</p></div>
        <button onClick={()=>void refresh()} className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 cursor-pointer" title="Refresh"><RefreshCw className={'w-4 h-4 '+(loading?'animate-spin text-emerald-400':'')}/></button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800">
        {([['target','🎯 Exam Target'],['series','📚 Test Series'],['test','📝 Individual Test']] as [Mode,string][]).map(([v,l])=><button key={v} onClick={()=>setMode(v)} className={'py-2.5 rounded-xl text-xs font-black cursor-pointer '+(mode===v?'bg-emerald-500 text-slate-950':'text-slate-400 hover:text-white')}>{l}</button>)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {mode!=='test'&&<label className="text-[10px] text-slate-500 uppercase font-bold">Exam Target<select value={target} onChange={e=>{setTarget(e.target.value);setSeries('')}} className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-bold">{targets.length?targets.map(t=><option key={t.key} value={t.key}>{t.label}</option>):<option>No target data yet</option>}</select></label>}
        {mode==='series'&&<label className="text-[10px] text-slate-500 uppercase font-bold">Test Series<select value={series} onChange={e=>setSeries(e.target.value)} className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-bold">{seriesOptions.length?seriesOptions.map(s=><option key={s.id} value={s.id}>{s.label}</option>):<option>No series data yet</option>}</select></label>}
        {mode==='test'&&<label className="text-[10px] text-slate-500 uppercase font-bold md:col-span-2">Individual Test<select value={testId} onChange={e=>setTestId(e.target.value)} className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-bold">{tests.map(t=><option key={t.id} value={t.id}>{t.title}</option>)}</select></label>}
        <label className="text-[10px] text-slate-500 uppercase font-bold">District<select value={district} onChange={e=>setDistrict(e.target.value)} className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-bold"><option>All Districts</option><option>Raipur</option><option>Bilaspur</option><option>Durg</option><option>Bastar</option><option>Rajnandgaon</option><option>Surguja</option><option>Korba</option><option>Dhamtari</option><option>Kanker</option><option>Mahasamund</option><option>Raigarh</option></select></label>
      </div>
    </section>

    {me&&<section className="bg-gradient-to-r from-emerald-950/50 to-slate-900 border border-emerald-500/30 rounded-3xl p-5 sm:p-6"><div className="flex flex-col md:flex-row md:items-center justify-between gap-5"><div><p className="text-[10px] uppercase font-black tracking-widest text-emerald-400">Your CGTEST Standing</p><h3 className="text-3xl font-black text-white mt-1">#{me.rank}</h3><p className="text-xs text-slate-400 mt-1">among {visible.length.toLocaleString('en-IN')} qualifying candidates</p></div><div className="grid grid-cols-2 sm:grid-cols-4 gap-3"><div className="bg-slate-950/70 rounded-2xl px-4 py-3"><span className="text-[10px] text-slate-500 block">Percentile</span><b className="text-lg text-amber-300">{me.percentile}</b></div><div className="bg-slate-950/70 rounded-2xl px-4 py-3"><span className="text-[10px] text-slate-500 block">Avg Score</span><b className="text-lg text-emerald-300">{me.percentage}%</b></div><div className="bg-slate-950/70 rounded-2xl px-4 py-3"><span className="text-[10px] text-slate-500 block">Accuracy</span><b className="text-lg text-white">{me.accuracy}%</b></div><div className="bg-slate-950/70 rounded-2xl px-4 py-3"><span className="text-[10px] text-slate-500 block">Tests</span><b className="text-lg text-white">{me.tests}</b></div></div></div></section>}

    <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl"><div className="flex items-center justify-between mb-4"><div><h3 className="text-base font-black text-white flex items-center gap-2"><Layers className="w-4 h-4 text-emerald-400"/>Score Distribution</h3><p className="text-[11px] text-slate-500">Candidate distribution by score percentage.</p></div><span className="text-xs text-slate-500 font-bold">{visible.length} candidates</span></div>{visible.length>=3?<div className="h-44 flex items-end gap-1 sm:gap-2">{distribution.map((b,i)=>{const max=Math.max(...distribution.map(x=>x.count),1);const h=Math.max(4,Math.round(b.count/max*100));const mine=me&&Math.floor(me.percentage/10)===i;return <div key={b.label} className="flex-1 h-full flex flex-col justify-end items-center gap-1"><span className="text-[9px] text-slate-500">{b.count||''}</span><div className={'w-full rounded-t-lg '+(mine?'bg-amber-400':'bg-emerald-500/50')} style={{height:h+'%'}}/><span className={'text-[8px] '+(mine?'text-amber-300 font-black':'text-slate-600')}>{b.label}</span></div>})}</div>:<div className="py-12 text-center text-xs text-slate-500">Distribution curve will appear after at least 3 qualifying candidates are recorded.</div>}</section>

    <section className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end"><Podium candidate={visible[1]} place={2}/><Podium candidate={visible[0]} place={1}/><Podium candidate={visible[2]} place={3}/></section>

    <section className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl"><div className="p-5 border-b border-slate-800 flex items-center justify-between"><div><h3 className="text-lg font-black text-white">Full Ranking</h3><p className="text-xs text-slate-500 mt-1">Top performers, percentile and your relative position.</p></div><div className="text-xs text-emerald-300 flex items-center gap-1"><Shield className="w-3.5 h-3.5"/>Practice ranking</div></div>{visible.length?<div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-slate-950 text-[10px] uppercase text-slate-500"><tr><th className="px-5 py-3">Rank</th><th className="px-5 py-3">Aspirant</th><th className="px-5 py-3">District</th><th className="px-5 py-3">Score %</th><th className="px-5 py-3">Percentile</th><th className="px-5 py-3">Accuracy</th><th className="px-5 py-3">Tests</th></tr></thead><tbody className="divide-y divide-slate-800">{visible.slice(0,100).map(c=><tr key={c.userId} className={c.userId===user?.id?'bg-emerald-500/10':'hover:bg-slate-800/30'}><td className="px-5 py-3 font-black text-white">#{c.rank}</td><td className="px-5 py-3"><div className="font-bold text-sm text-white">{c.name}{c.userId===user?.id?' (You)':''}</div><div className="text-[10px] text-slate-500">{c.category}</div></td><td className="px-5 py-3 text-xs text-slate-400">{c.district}</td><td className="px-5 py-3 font-black text-emerald-300">{c.percentage}%</td><td className="px-5 py-3 font-black text-amber-300">{c.percentile}</td><td className="px-5 py-3 text-xs text-slate-300">{c.accuracy}%</td><td className="px-5 py-3 text-xs text-slate-300">{c.tests}</td></tr>)}</tbody></table></div>:<div className="py-16 px-6 text-center"><Trophy className="w-10 h-10 mx-auto text-slate-700"/><h4 className="font-black text-white mt-3">No qualifying ranking data yet</h4><p className="text-xs text-slate-500 mt-2">Complete at least {minimumTests} qualifying test{minimumTests>1?'s':''} for this ranking. Individual test ranking requires one attempt.</p><div className="flex justify-center gap-2 mt-5">{tests[0]&&<button onClick={()=>onStartTest(tests[0])} className="px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs cursor-pointer"><Play className="inline w-3.5 h-3.5 mr-1"/>Attempt a Test</button>}{onExplorePass&&<button onClick={onExplorePass} className="px-4 py-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs border border-slate-700 cursor-pointer">View Pass</button>}</div></div>}</section>
  </div>;
};
