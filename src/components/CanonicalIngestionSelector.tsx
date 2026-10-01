import React, { useEffect, useState } from 'react';
import { Building2, FolderTree, GraduationCap, Layers3, Plus } from 'lucide-react';
import {
  ExamAuthority, ExamProgram, ExamPost, ExamTestSeries,
  fetchExamAuthorities, fetchExamPrograms, fetchExamPosts, fetchExamTestSeries
} from '../firebase/examCatalogService';

interface Props {
  authority: string;
  examName: string;
  cadre: string;
  targetBundleId: string;
  onChange: (value: { authority: string; examName: string; cadre: string; targetBundleId: string }) => void;
}

export const CanonicalIngestionSelector: React.FC<Props> = ({
  authority, examName, cadre, targetBundleId, onChange
}) => {
  const [authorities, setAuthorities] = useState<ExamAuthority[]>([]);
  const [programs, setPrograms] = useState<ExamProgram[]>([]);
  const [posts, setPosts] = useState<ExamPost[]>([]);
  const [series, setSeries] = useState<ExamTestSeries[]>([]);
  const [authorityId, setAuthorityId] = useState('');
  const [programId, setProgramId] = useState('');
  const [postId, setPostId] = useState('');

  useEffect(() => {
    fetchExamAuthorities().then(list => {
      setAuthorities(list);
      const match = list.find(a => a.name === authority || a.shortName === authority || a.id === authority);
      setAuthorityId(match?.id || list[0]?.id || '');
    }).catch(() => setAuthorities([]));
  }, [authority]);

  useEffect(() => {
    if (!authorityId) return;
    fetchExamPrograms(authorityId).then(list => {
      setPrograms(list);
      const match = list.find(p => p.name === examName || p.id === examName);
      setProgramId(match?.id || list[0]?.id || '');
    }).catch(() => setPrograms([]));
  }, [authorityId, examName]);

  useEffect(() => {
    if (!programId) return;
    fetchExamPosts(programId).then(list => {
      setPosts(list);
      const match = list.find(p => p.name === cadre || p.id === cadre);
      setPostId(match?.id || '');
    }).catch(() => setPosts([]));
    fetchExamTestSeries(programId).then(list => setSeries(list)).catch(() => setSeries([]));
  }, [programId, cadre]);

  useEffect(() => {
    const selectedSeries = series.find(s => s.id === targetBundleId || s.bundleId === targetBundleId);
    if (selectedSeries) {
      onChange({
        authority: authorities.find(a => a.id === selectedSeries.authorityId)?.name || authority,
        examName: programs.find(p => p.id === selectedSeries.programId)?.name || examName,
        cadre: posts.find(p => p.id === selectedSeries.postId)?.name || cadre,
        targetBundleId: selectedSeries.bundleId || selectedSeries.id
      });
    }
  }, [targetBundleId]);

  const chooseAuthority = (id: string) => {
    const a = authorities.find(x => x.id === id);
    setAuthorityId(id);
    setProgramId('');
    setPostId('');
    onChange({ authority: a?.name || authority, examName: '', cadre: '', targetBundleId: '' });
  };
  const chooseProgram = (id: string) => {
    const p = programs.find(x => x.id === id);
    setProgramId(id);
    setPostId('');
    onChange({ authority, examName: p?.name || examName, cadre: '', targetBundleId: '' });
  };
  const choosePost = (id: string) => {
    const p = posts.find(x => x.id === id);
    setPostId(id);
    onChange({ authority, examName, cadre: p?.name || '', targetBundleId });
  };
  const chooseSeries = (id: string) => {
    const s = series.find(x => x.id === id);
    if (!s) return;
    onChange({
      authority: authorities.find(a => a.id === s.authorityId)?.name || authority,
      examName: programs.find(p => p.id === s.programId)?.name || examName,
      cadre: posts.find(p => p.id === s.postId)?.name || cadre,
      targetBundleId: s.bundleId || s.id
    });
  };

  return <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-indigo-500/20">
    <div>
      <div className="text-xs font-black text-white uppercase tracking-wider">Canonical exam hierarchy</div>
      <div className="text-[11px] text-slate-400 mt-1">Authority → Recruitment / Exam → Post (optional) → Test Series. New content is stored against stable IDs.</div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <label className="block">
        <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mb-1.5"><Building2 className="w-3.5 h-3.5"/>Authority</span>
        <select value={authorityId} onChange={e=>chooseAuthority(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white">
          <option value="">No catalog data</option>{authorities.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mb-1.5"><FolderTree className="w-3.5 h-3.5"/>Recruitment / Exam</span>
        <select value={programId} onChange={e=>chooseProgram(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white">
          <option value="">Select program</option>{programs.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mb-1.5"><GraduationCap className="w-3.5 h-3.5"/>Post (optional)</span>
        <select value={postId} onChange={e=>choosePost(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white">
          <option value="">Direct exam / no post</option>{posts.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mb-1.5"><Layers3 className="w-3.5 h-3.5"/>Test Series</span>
        <select value={targetBundleId} onChange={e=>chooseSeries(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white">
          <option value="">Select series</option>{series.map(s=><option key={s.id} value={s.id}>{s.name} · {s.status}</option>)}
        </select>
      </label>
    </div>
    {!authorities.length && <div className="text-[11px] text-amber-300 flex items-center gap-1"><Plus className="w-3 h-3"/>Create the recruitment and series first in Admin → Exam & Recruitment Catalog.</div>}
  </div>;
};
