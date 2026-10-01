import React, { useMemo, useState } from 'react';
import { ArrowLeft, Building2, ChevronRight, GraduationCap, Layers3 } from 'lucide-react';
import { TestSeriesBundle } from '../data/bundleCatalog';
import { BundleCompactCard } from './BundleCompactCard';
import { fetchExamPrograms, fetchExamPosts, ExamProgram, ExamPost } from '../firebase/examCatalogService';

interface Props {
  bundles: TestSeriesBundle[];
  enrolledBundleIds: string[];
  onOpenBundle: (bundle: TestSeriesBundle) => void;
  onEnrollNow: (bundle: TestSeriesBundle) => void;
  onOpenMyTests?: (bundle: TestSeriesBundle) => void;
  onStartFreeTest?: (bundle: TestSeriesBundle) => void;
}

interface ProgramGroup {
  key: string;
  authority: string;
  name: string;
  year: number;
  bundles: TestSeriesBundle[];
}

function programFor(bundle: TestSeriesBundle): { key:string; name:string } {
  if (bundle.programId) {
    const key = bundle.programId;
    if (bundle.authority === 'CGSSB' && /(assistant teacher|teacher|lecturer|vyakhyata)/i.test(bundle.targetPost || '')) {
      return { key, name: `CGSSB Teacher Recruitment ${bundle.targetYear}` };
    }
    if (bundle.authority === 'CGPSC') return { key, name: `CGPSC State Service Examination ${bundle.targetYear}` };
    return { key, name: bundle.title.replace(/\\s+test\\s+series\\s*$/i,'').trim() };
  }
  if (bundle.authority === 'CGSSB' && /(assistant teacher|teacher|lecturer|vyakhyata)/i.test(bundle.targetPost || '')) {
    return { key:`program-cgssb-teacher-${bundle.targetYear}`, name:`CGSSB Teacher Recruitment ${bundle.targetYear}` };
  }
  if (bundle.authority === 'CGPSC') {
    return { key:`program-cgpsc-sse-${bundle.targetYear}`, name:`CGPSC State Service Examination ${bundle.targetYear}` };
  }
  return { key:`program-${bundle.id}`, name:bundle.title.replace(/\\s+test\\s+series\\s*$/i,'').trim() };
}

export const ExamRecruitmentExplorer: React.FC<Props> = ({
  bundles, enrolledBundleIds, onOpenBundle, onEnrollNow, onOpenMyTests, onStartFreeTest
}) => {
  const [authority, setAuthority] = useState('ALL');
  const [programKey, setProgramKey] = useState<string | null>(null);
  const [postKey, setPostKey] = useState<string | null>(null);
  const [canonicalPrograms, setCanonicalPrograms] = useState<ExamProgram[]>([]);
  const [canonicalPosts, setCanonicalPosts] = useState<ExamPost[]>([]);

  React.useEffect(() => {
    fetchExamPrograms().then(setCanonicalPrograms).catch(() => setCanonicalPrograms([]));
  }, []);
  React.useEffect(() => {
    if (!programKey) { setCanonicalPosts([]); return; }
    fetchExamPosts(programKey).then(setCanonicalPosts).catch(() => setCanonicalPosts([]));
  }, [programKey]);

  const visible = bundles.filter(b => b.isPublished !== false && !b.isDraft);
  const programs = useMemo<ProgramGroup[]>(() => {
    const map = new Map<string, ProgramGroup>();
    visible.filter(b => authority === 'ALL' || b.authority === authority).forEach(b => {
      const p = programFor(b);
      const canonical = b.programId ? canonicalPrograms.find(x => x.id === b.programId) : undefined;
      const key = canonical?.id || p.key;
      const name = canonical?.name || p.name;
      const existing = map.get(key);
      if (existing) existing.bundles.push(b);
      else map.set(key, { key, authority:b.authority || 'Unknown', name, year:b.targetYear || new Date().getFullYear(), bundles:[b] });
    });
    return Array.from(map.values()).sort((a,b)=>a.name.localeCompare(b.name));
  }, [visible, authority, canonicalPrograms]);

  const program = programs.find(p=>p.key===programKey) || null;
  const posts = useMemo(() => {
    if (!program) return [];
    const map = new Map<string, TestSeriesBundle[]>();
    program.bundles.forEach(b => {
      const canonicalPost = b.postId ? canonicalPosts.find(x => x.id === b.postId) : undefined;
      const key = canonicalPost?.id || b.postId || `post-${(b.targetPost || 'General').toLowerCase().replace(/\\s+/g,'-')}`;
      const list = map.get(key) || [];
      list.push(b); map.set(key,list);
    });
    return Array.from(map.entries()).map(([key,list]) => ({ key, name: canonicalPosts.find(x=>x.id===key)?.name || list[0]?.targetPost || 'General Exam', bundles:list }));
  }, [program, canonicalPosts]);

  const selectedPost = posts.find(p=>p.key===postKey) || null;
  const series = selectedPost ? selectedPost.bundles : (program && posts.length === 1 ? posts[0].bundles : []);

  const reset = () => { if (postKey) setPostKey(null); else setProgramKey(null); };

  return <div className="space-y-5">
    <div className="flex items-start justify-between gap-3 flex-wrap">
      <div>
        <div className="flex items-center gap-2">
          {(programKey || postKey) && <button onClick={reset} className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white"><ArrowLeft className="w-4 h-4"/></button>}
          <h2 className="text-lg sm:text-xl font-black text-white">
            {!programKey ? 'What are you preparing for?' : postKey ? (selectedPost?.name || 'Test Series') : program?.name}
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          {!programKey ? 'Choose your exam or recruitment first. We will take you to the right post and preparation suite.' : postKey ? 'Choose a test series for your target post.' : 'Choose your target post, or continue directly if this is a single examination.'}
        </p>
      </div>
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {['ALL', ...Array.from(new Set(visible.map(b=>b.authority)))].map(a=><button key={a} onClick={()=>{setAuthority(String(a));setProgramKey(null);setPostKey(null)}} className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border ${authority===a?'bg-emerald-500 text-slate-950 border-emerald-400':'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'}`}>{a==='ALL'?'All':a}</button>)}
      </div>
    </div>

    {!programKey && <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {programs.map(p=><button key={p.key} onClick={()=>setProgramKey(p.key)} className="text-left group rounded-2xl bg-slate-900/90 border border-slate-800 p-5 hover:border-emerald-500/50 hover:-translate-y-0.5 transition shadow-lg">
        <div className="flex items-center justify-between"><span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[10px] font-black uppercase text-emerald-300"><Building2 className="w-3 h-3"/>{p.authority}</span><ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400"/></div>
        <h3 className="mt-4 text-base sm:text-lg font-black text-white">{p.name}</h3>
        <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
          <span className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">{p.bundles.length} Test Series</span>
          <span className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">{new Set(p.bundles.map(b=>b.targetPost)).size} {new Set(p.bundles.map(b=>b.targetPost)).size===1?'Track':'Posts'}</span>
        </div>
        <div className="mt-4 text-xs font-bold text-emerald-400">Explore {p.name} →</div>
      </button>)}
    </div>}

    {programKey && !postKey && posts.length > 1 && <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {posts.map(p=><button key={p.key} onClick={()=>{ setPostKey(p.key); }} className="text-left group rounded-2xl bg-slate-900/90 border border-slate-800 p-5 hover:border-indigo-500/50 transition">
        <div className="flex items-center justify-between"><GraduationCap className="w-5 h-5 text-indigo-400"/><ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400"/></div>
        <h3 className="mt-3 text-base font-black text-white">{p.name}</h3>
        <p className="text-xs text-slate-400 mt-1">{p.bundles.length} preparation series</p>
        <div className="mt-4 text-xs font-bold text-indigo-400">Open post →</div>
      </button>)}
    </div>}

    {programKey && (postKey || posts.length === 1) && <div>
      {posts.length === 1 && !postKey && <div className="mb-3 inline-flex items-center gap-1.5 text-xs text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-3 py-1.5"><GraduationCap className="w-3.5 h-3.5"/>{posts[0].name}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {series.map(bundle=><BundleCompactCard key={bundle.id} bundle={bundle} onOpenBundle={onOpenBundle} onEnrollNow={onEnrollNow} onOpenMyTests={onOpenMyTests} onStartFreeTest={onStartFreeTest} hasEnrolled={enrolledBundleIds.includes(bundle.id)}/>)}
      </div>
    </div>}
  </div>;
};
