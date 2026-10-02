import React, { useEffect, useMemo, useState } from 'react';
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
  onCanonicalChange?: (series: ExamTestSeries | null) => void;
}

export const CanonicalIngestionSelector: React.FC<Props> = ({
  authority, examName, cadre, targetBundleId, onChange, onCanonicalChange
}) => {
  const [authorities, setAuthorities] = useState<ExamAuthority[]>([]);
  const [programs, setPrograms] = useState<ExamProgram[]>([]);
  const [posts, setPosts] = useState<ExamPost[]>([]);
  const [series, setSeries] = useState<ExamTestSeries[]>([]);
  const [authorityId, setAuthorityId] = useState('');
  const [programId, setProgramId] = useState('');
  const [postId, setPostId] = useState('');
  const [selectedSeriesId, setSelectedSeriesId] = useState('');

  // The canonical hierarchy is Firestore-backed. Any create/delete/restore in another
  // admin studio invalidates this selector immediately instead of leaving stale options.
  const reloadHierarchy = async () => {
    try {
      const authorityList = await fetchExamAuthorities();
      setAuthorities(authorityList);

      // Resolve the canonical series FIRST when a bundle/series target is already known.
      // Display labels are not identifiers and must never be used to infer the hierarchy.
      const allSeries = await fetchExamTestSeries();
      const canonicalTarget = targetBundleId
        ? allSeries.find(s => s.id === targetBundleId || s.bundleId === targetBundleId)
        : undefined;

      const matchedAuthority = canonicalTarget
        ? authorityList.find(a => a.id === canonicalTarget.authorityId)
        : authorityList.find(
            a => a.name === authority || a.shortName === authority || a.id === authority
          );
      const nextAuthorityId = canonicalTarget?.authorityId || matchedAuthority?.id || authorityList[0]?.id || '';
      setAuthorityId(nextAuthorityId);

      if (!nextAuthorityId) {
        setPrograms([]);
        setPosts([]);
        setSeries([]);
        return;
      }

      const programList = await fetchExamPrograms(nextAuthorityId);
      setPrograms(programList);
      const matchedProgram = canonicalTarget
        ? programList.find(p => p.id === canonicalTarget.programId)
        : programList.find(p => p.name === examName || p.id === examName);
      const nextProgramId = canonicalTarget?.programId || matchedProgram?.id || programList[0]?.id || '';
      setProgramId(nextProgramId);

      if (!nextProgramId) {
        setPosts([]);
        setSeries([]);
        return;
      }

      const postList = await fetchExamPosts(nextProgramId);
      setPosts(postList);
      const matchedPost = canonicalTarget
        ? postList.find(p => p.id === canonicalTarget.postId)
        : postList.find(p => p.name === cadre || p.id === cadre);
      const nextPostId = canonicalTarget?.postId || matchedPost?.id || '';
      setPostId(nextPostId);

      // Critical integrity rule: when a recruitment has posts and a post is selected,
      // only series belonging to that exact post are eligible for ingestion.
      const seriesList = await fetchExamTestSeries(nextProgramId, nextPostId || undefined);
      setSeries(seriesList);

      const selected = canonicalTarget
        ? seriesList.find(s => s.id === canonicalTarget.id)
        : seriesList.find(s => s.id === targetBundleId || s.bundleId === targetBundleId);
      setSelectedSeriesId(selected?.id || '');
      onCanonicalChange?.(selected || null);
    } catch {
      setAuthorities([]);
      setPrograms([]);
      setPosts([]);
      setSeries([]);
      setSelectedSeriesId('');
    }
  };

  useEffect(() => {
    reloadHierarchy();
    const handleCatalogUpdate = () => { reloadHierarchy(); };
    window.addEventListener('cgssb-exam-catalog-updated', handleCatalogUpdate);
    return () => window.removeEventListener('cgssb-exam-catalog-updated', handleCatalogUpdate);
    // Initial values are intentionally the only trigger; cross-studio changes use the event above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authority, examName, cadre, targetBundleId]);

  const visibleSeries = useMemo(() => {
    return series.filter(s => {
      if (s.status === 'ARCHIVED') return false;
      if (programId && s.programId !== programId) return false;
      if (postId && s.postId !== postId) return false;
      // If the selected recruitment has posts, a series without a post is not valid here.
      if (postId && !s.postId) return false;
      return true;
    });
  }, [series, programId, postId]);

  const chooseAuthority = (id: string) => {
    const a = authorities.find(x => x.id === id);
    setAuthorityId(id);
    setProgramId('');
    setPostId('');
    setSelectedSeriesId('');
    setSeries([]);
    onCanonicalChange?.(null);
    onChange({ authority: a?.name || '', examName: '', cadre: '', targetBundleId: '' });
  };

  const chooseProgram = (id: string) => {
    const p = programs.find(x => x.id === id);
    setProgramId(id);
    setPostId('');
    setSelectedSeriesId('');
    setSeries([]);
    onCanonicalChange?.(null);
    onChange({
      authority: authorities.find(a => a.id === authorityId)?.name || authority,
      examName: p?.name || '',
      cadre: '',
      targetBundleId: ''
    });
  };

  const choosePost = (id: string) => {
    const p = posts.find(x => x.id === id);
    setPostId(id);
    setSelectedSeriesId('');
    setSeries([]);
    onCanonicalChange?.(null);
    onChange({
      authority: authorities.find(a => a.id === authorityId)?.name || authority,
      examName: programs.find(x => x.id === programId)?.name || examName,
      cadre: p?.name || '',
      targetBundleId: ''
    });
  };

  const chooseSeries = (id: string) => {
    const s = visibleSeries.find(x => x.id === id);
    if (!s || s.status === 'ARCHIVED') return;
    setSelectedSeriesId(s.id);
    onCanonicalChange?.(s);
    onChange({
      authority: authorities.find(a => a.id === s.authorityId)?.name || authority,
      examName: programs.find(p => p.id === s.programId)?.name || examName,
      cadre: posts.find(p => p.id === s.postId)?.name || cadre,
      targetBundleId: s.bundleId || ''
    });
  };

  return <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-indigo-500/20">
    <div>
      <div className="text-xs font-black text-white uppercase tracking-wider">Canonical exam hierarchy</div>
      <div className="text-[11px] text-slate-400 mt-1">
        Authority → Recruitment / Exam → Post → Test Series. Ingestion can only target an active canonical series linked to the selected post.
      </div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <label className="block">
        <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mb-1.5"><Building2 className="w-3.5 h-3.5"/>Authority</span>
        <select value={authorityId} onChange={e => chooseAuthority(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white">
          <option value="">No catalog data</option>
          {authorities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </label>

      <label className="block">
        <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mb-1.5"><FolderTree className="w-3.5 h-3.5"/>Recruitment / Exam</span>
        <select value={programId} onChange={e => chooseProgram(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white">
          <option value="">Select program</option>
          {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </label>

      <label className="block">
        <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mb-1.5"><GraduationCap className="w-3.5 h-3.5"/>Post</span>
        <select value={postId} onChange={e => choosePost(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white">
          <option value="">Direct exam / no post</option>
          {posts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </label>

      <label className="block">
        <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mb-1.5"><Layers3 className="w-3.5 h-3.5"/>Test Series</span>
        <select value={selectedSeriesId} onChange={e => chooseSeries(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white">
          <option value="">Select series</option>
          {visibleSeries.map(s => <option key={s.id} value={s.id}>{s.name} · {s.status}</option>)}
        </select>
      </label>
    </div>

    {!authorities.length && (
      <div className="text-[11px] text-amber-300 flex items-center gap-1">
        <Plus className="w-3 h-3"/>Create the recruitment and series first in Admin → Exam & Recruitment Catalog.
      </div>
    )}
  </div>;
};
