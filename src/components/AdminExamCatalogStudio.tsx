import React, { useEffect, useState } from 'react';
import { Building2, FolderTree, Plus, Save, RefreshCw, Layers3, ChevronRight, Trash2 } from 'lucide-react';
import {
  ExamAuthority, ExamProgram, ExamPost, ExamTestSeries, ExamSubject,
  fetchExamAuthorities, fetchExamPrograms, fetchExamPosts,
  fetchExamTestSeries, saveExamAuthority, saveExamProgram,
  saveExamPost, saveExamTestSeries, saveExamSubject, slugifyCatalog
} from '../firebase/examCatalogService';
import { fetchBundlesFromFirestore, saveBundleToFirestore } from '../firebase/firestoreService';
import { saveSingleBundle, purgeAllDemoDatabaseData, moveToTrashTestSeries } from '../utils/bundleStore';
import { TestSeriesBundle } from '../data/bundleCatalog';
import { CatalogPackageImporter } from './CatalogPackageImporter';

const now = () => new Date().toISOString();

export const AdminExamCatalogStudio: React.FC = () => {
  const [authorities, setAuthorities] = useState<ExamAuthority[]>([]);
  const [programs, setPrograms] = useState<ExamProgram[]>([]);
  const [posts, setPosts] = useState<ExamPost[]>([]);
  const [series, setSeries] = useState<ExamTestSeries[]>([]);
  const [selectedAuthority, setSelectedAuthority] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedPost, setSelectedPost] = useState('');
  const [name, setName] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [status, setStatus] = useState<'DRAFT'|'PUBLISHED'>('DRAFT');
  const [programType, setProgramType] = useState<'recruitment'|'examination'>('recruitment');
  const [seriesType, setSeriesType] = useState<'full_mock'|'chapter_test'|'subject_test'|'pyp'|'live_test'|'practice'|'mixed'>('full_mock');
  const [postVacancies, setPostVacancies] = useState('');
  const [postCadreBreakup, setPostCadreBreakup] = useState('');
  const [postPayLevel, setPostPayLevel] = useState('');
  const [postSalaryRange, setPostSalaryRange] = useState('');
  const [postSubjects, setPostSubjects] = useState('');
  const [message, setMessage] = useState('');
  const [purging, setPurging] = useState(false);
  const [showCatalogImporter, setShowCatalogImporter] = useState(false);

  const load = async () => {
    try {
      const a = await fetchExamAuthorities();
      setAuthorities(a);
      const authorityId = selectedAuthority || a[0]?.id || '';
      if (!selectedAuthority && authorityId) setSelectedAuthority(authorityId);
      const p = await fetchExamPrograms(authorityId || undefined);
      setPrograms(p);
      const programId = selectedProgram && p.some(x=>x.id===selectedProgram) ? selectedProgram : (p[0]?.id || '');
      if (programId && programId !== selectedProgram) setSelectedProgram(programId);
      const po = await fetchExamPosts(programId || undefined);
      setPosts(po);
      const postId = selectedPost && po.some(x=>x.id===selectedPost) ? selectedPost : '';
      if (postId !== selectedPost) setSelectedPost(postId);

      const [rawSeries, bundles] = await Promise.all([
        fetchExamTestSeries(programId || undefined, postId || undefined),
        fetchBundlesFromFirestore(),
      ]);
      const bundleById = new Map(bundles.map(b => [b.id, b]));
      const validSeries = rawSeries.filter(s => {
        const b = s.bundleId ? bundleById.get(s.bundleId) : undefined;
        return Boolean(
          b &&
          b.seriesId === s.id &&
          b.authorityId === s.authorityId &&
          b.programId === s.programId &&
          (b.postId || undefined) === (s.postId || undefined) &&
          s.status !== 'ARCHIVED'
        );
      });
      setSeries(validSeries);
    } catch (e:any) {
      setMessage(e?.message || 'Unable to load exam catalog.');
    }
  };

  useEffect(() => {
    load();
    const handleCatalogUpdate = () => { load(); };
    window.addEventListener('cgssb-exam-catalog-updated', handleCatalogUpdate);
    return () => window.removeEventListener('cgssb-exam-catalog-updated', handleCatalogUpdate);
  }, [selectedAuthority, selectedProgram, selectedPost]);

  const createAuthority = async () => {
    if (!name.trim()) return;
    const id = `authority-${slugifyCatalog(name)}`;
    const record: ExamAuthority = { id, name: name.trim(), shortName: name.trim(), slug: slugifyCatalog(name), status, sortOrder: authorities.length, createdAt: now(), updatedAt: now() };
    await saveExamAuthority(record);
    setName(''); setMessage('Authority created.'); await load();
  };

  const createProgram = async () => {
    if (!selectedAuthority || !name.trim()) return;
    const id = `program-${slugifyCatalog(name)}`;
    const record: ExamProgram = { id, authorityId: selectedAuthority, name: name.trim(), slug: slugifyCatalog(name), year, programType, status, hasPosts: false, sortOrder: programs.length, createdAt: now(), updatedAt: now() };
    await saveExamProgram(record);
    setName(''); setMessage('Recruitment / exam created.'); await load();
  };

  const createPost = async () => {
    if (!selectedProgram || !name.trim()) return;
    const id = `post-${selectedProgram.replace(/^program-/, '')}-${slugifyCatalog(name)}`;
    const record: ExamPost = {
      id, programId: selectedProgram, name: name.trim(), slug: slugifyCatalog(name),
      status, sortOrder: posts.length, createdAt: now(), updatedAt: now(),
      ...(postVacancies.trim() ? { vacancies: Number(postVacancies) } : {}),
      ...(postCadreBreakup.trim() ? { cadreBreakup: postCadreBreakup.trim() } : {}),
      ...(postPayLevel.trim() ? { payLevel: postPayLevel.trim() } : {}),
      ...(postSalaryRange.trim() ? { salaryRange: postSalaryRange.trim() } : {}),
      ...(postSubjects.trim() ? { subjects: postSubjects.split(',').map(s => s.trim()).filter(Boolean) } : {})
    };
    await saveExamPost(record);
    const program = programs.find(p=>p.id===selectedProgram);
    if (program && !program.hasPosts) await saveExamProgram({ ...program, hasPosts:true, updatedAt:now() });
    setName('');
    setPostVacancies('');
    setPostCadreBreakup('');
    setPostPayLevel('');
    setPostSalaryRange('');
    setPostSubjects('');
    setMessage('Post created with explicit recruitment metadata.');
    await load();
  };

  const createSeries = async () => {
    if (!selectedAuthority || !selectedProgram || !name.trim()) return;
    const program = programs.find(p=>p.id===selectedProgram);
    const authority = authorities.find(a=>a.id===selectedAuthority);
    if (!program || !authority) return;
    if (program.hasPosts && !selectedPost) {
      setMessage('Select the canonical Post before creating a Test Series for this recruitment.');
      return;
    }
    const id = `series-${selectedProgram.replace(/^program-/, '')}-${slugifyCatalog(name)}`;
    const bundleId = `bundle-${id}`;
    const targetPost = posts.find(p=>p.id===selectedPost)?.name || 'General';
    const record: ExamTestSeries = {
      id, authorityId:selectedAuthority, programId:selectedProgram, postId:selectedPost || undefined,
      name:name.trim(), slug:slugifyCatalog(name), seriesType, bundleId,
      status, sortOrder:series.length, createdAt:now(), updatedAt:now()
    };
    await saveExamTestSeries(record);
    const bundle: TestSeriesBundle = {
      id: bundleId, slug:slugifyCatalog(name), title:name.trim(), titleHindi:name.trim(),
      authorityId:selectedAuthority, programId:selectedProgram, postId:selectedPost || undefined,
      seriesId:id,
      badge:'New Series', badgeColor:'emerald', shortDescription:`${name.trim()} test series for ${program.name}.`,
      fullDescription:'Draft series created from the canonical exam catalog. Add tests and syllabus before publishing.',
      price:0, originalPrice:0, isProOnly:false, totalTestsCount:0, freeTestsCount:0,
      enrolledStudentsCount:0, rating:0, validity:'Till Exam Date', languageDisplay:'Bilingual',
      examPattern:{ totalQuestions:0,totalMarks:0,durationMinutes:0,markingScheme:'',negativeMarkPenalty:'',language:'Bilingual',cadre:targetPost,keyRules:[] },
      syllabusBreakdown:[], features:[], testItems:[], faqs:[], isDraft:true, isPublished:false,
      seriesType
    };
    await saveBundleToFirestore(bundle);
    saveSingleBundle(bundle);
    setName(''); setMessage('Draft test series created. Open it in Test Series Studio to add content.'); await load();
  };

  const handleDeleteSeries = async (record: ExamTestSeries) => {
    const linkedBundleId = record.bundleId;
    const confirmed = window.confirm(
      `Delete "${record.name}" from the canonical catalog? This will also move its linked Test Series Bundle to Trash and remove it from Universal Ingestion.\n\nYou can restore the pair from Test Series & Bundle Studio → Trash Bin.`
    );
    if (!confirmed) return;

    try {
      await moveToTrashTestSeries(record);
      setMessage(`"${record.name}" and linked bundle ${linkedBundleId ? 'were' : 'was'} moved out of the active catalog.`);
      await load();
    } catch (error: any) {
      setMessage(error?.message || `Unable to delete "${record.name}".`);
    }
  };

  const purgeDemoData = async () => {
    if (!window.confirm('This will permanently delete only Firestore documents explicitly marked isDemo=true in supported demo-content collections. Canonical production catalog, user accounts, attempts, enrollments and leaderboard data will NOT be deleted. Continue?')) return;
    setPurging(true);
    setMessage('');
    try {
      await purgeAllDemoDatabaseData();
      setSelectedAuthority('');
      setSelectedProgram('');
      setSelectedPost('');
      setAuthorities([]);
      setPrograms([]);
      setPosts([]);
      setSeries([]);
      setMessage('Marked demo content was purged. Canonical production catalog records were not inferred or recreated.');
    } catch (e:any) {
      setMessage(e?.message || 'Demo-data purge failed.');
    } finally {
      setPurging(false);
    }
  };

  const section = (title:string, icon:React.ReactNode, children:React.ReactNode) => (
    <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-4 text-white font-black">{icon}<span>{title}</span></div>
      {children}
    </section>
  );

  return <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-5 text-slate-200">
    <div>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Exam & Recruitment Catalog</h1>
          <p className="text-sm text-slate-400 mt-1">One canonical hierarchy for the student portal, Universal Ingestion Studio, SEO and all test content.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCatalogImporter(true)}
          className="shrink-0 rounded-xl border border-cyan-500/50 bg-cyan-500/10 px-4 py-2 text-xs font-black text-cyan-200 hover:bg-cyan-500/20"
        >
          Import Catalog JSON
        </button>
        <button
          type="button"
          onClick={purgeDemoData}
          disabled={purging}
          className="shrink-0 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs font-black text-red-300 hover:bg-red-500/20 disabled:opacity-50"
        >
          {purging ? 'Purging…' : 'Purge Marked Demo Data'}
        </button>
      </div>
    </div>
    {message && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{message}</div>}
    {showCatalogImporter && (
      <div className="fixed inset-0 z-[120] overflow-y-auto bg-slate-950/85 backdrop-blur-md p-3 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-end mb-2">
            <button type="button" onClick={() => setShowCatalogImporter(false)} className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-2">
              Close <span>×</span>
            </button>
          </div>
          <CatalogPackageImporter onImported={async () => { setShowCatalogImporter(false); await load(); }} />
        </div>
      </div>
    )}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {section('1. Exam Authority', <Building2 className="w-4 h-4 text-cyan-400" />, <>
        <div className="flex gap-2"><select value={selectedAuthority} onChange={e=>setSelectedAuthority(e.target.value)} className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm">{authorities.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
        <div className="flex gap-2 mt-2"><input value={name} onChange={e=>setName(e.target.value)} placeholder="New authority" className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm"/><button onClick={createAuthority} className="px-3 rounded-xl bg-cyan-500 text-slate-950 font-black"><Plus className="w-4 h-4"/></button></div>
      </>)}
      {section('2. Recruitment / Examination', <FolderTree className="w-4 h-4 text-emerald-400" />, <>
        <select value={selectedProgram} onChange={e=>setSelectedProgram(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm">{programs.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <div className="grid grid-cols-2 gap-2 mt-2"><input type="number" value={year} onChange={e=>setYear(Number(e.target.value))} className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm"/><select value={programType} onChange={e=>setProgramType(e.target.value as any)} className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm"><option value="recruitment">Recruitment</option><option value="examination">Examination</option></select></div>
        <div className="flex gap-2 mt-2"><input value={name} onChange={e=>setName(e.target.value)} placeholder="New recruitment / exam" className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm"/><button onClick={createProgram} className="px-3 rounded-xl bg-emerald-500 text-slate-950 font-black"><Plus className="w-4 h-4"/></button></div>
      </>)}
      {section('3. Post (optional)', <ChevronRight className="w-4 h-4 text-amber-400" />, <>
        <select value={selectedPost} onChange={e=>setSelectedPost(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm"><option value="">No post / direct exam</option>{posts.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <div className="flex gap-2 mt-2"><input value={name} onChange={e=>setName(e.target.value)} placeholder="New post" className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm"/><button onClick={createPost} className="px-3 rounded-xl bg-amber-400 text-slate-950 font-black"><Plus className="w-4 h-4"/></button></div>
        <div className="mt-3 space-y-2">
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Optional recruitment metadata</p>
          <div className="grid grid-cols-2 gap-2">
            <input value={postVacancies} onChange={e=>setPostVacancies(e.target.value)} inputMode="numeric" placeholder="Vacancies" className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm"/>
            <input value={postPayLevel} onChange={e=>setPostPayLevel(e.target.value)} placeholder="Pay level" className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm"/>
          </div>
          <input value={postSalaryRange} onChange={e=>setPostSalaryRange(e.target.value)} placeholder="Salary range (optional)" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm"/>
          <input value={postCadreBreakup} onChange={e=>setPostCadreBreakup(e.target.value)} placeholder="Cadre breakup — only if applicable" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm"/>
          <input value={postSubjects} onChange={e=>setPostSubjects(e.target.value)} placeholder="Subjects, comma separated — only if applicable" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm"/>
        </div>
      </>)}
    </div>
    {section('4. Test Series', <Layers3 className="w-4 h-4 text-purple-400" />, <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <select value={selectedAuthority} onChange={e=>setSelectedAuthority(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm">{authorities.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select>
        <select value={selectedProgram} onChange={e=>setSelectedProgram(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm">{programs.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <select value={selectedPost} onChange={e=>setSelectedPost(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm"><option value="">Direct exam / no post</option>{posts.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-3">
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Assistant Teacher 2026 Full Mock Series" className="md:col-span-2 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm"/>
        <select value={seriesType} onChange={e=>setSeriesType(e.target.value as any)} className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm">
          <option value="full_mock">Full Mock</option>
          <option value="chapter_test">Chapter Test</option>
          <option value="subject_test">Subject Test</option>
          <option value="pyp">Previous Year Paper</option>
          <option value="live_test">Live Test</option>
          <option value="practice">Practice</option>
          <option value="mixed">Mixed</option>
        </select>
        <button onClick={createSeries} className="px-4 rounded-xl bg-purple-500 text-white font-black flex items-center justify-center gap-2"><Save className="w-4 h-4"/>Create Draft Series</button>
      </div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">{series.map(s=><div key={s.id} className="rounded-xl bg-slate-950/80 border border-slate-800 p-3"><div className="flex items-start justify-between gap-2"><div><div className="text-xs text-slate-500">{s.seriesType}</div><div className="font-bold text-white">{s.name}</div><div className="text-xs text-slate-500 mt-1">{s.status} · {s.postId ? (posts.find(p => p.id === s.postId)?.name || 'Post') : 'Direct exam'}</div></div><button type="button" onClick={() => handleDeleteSeries(s)} className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20" title="Move Test Series + linked Bundle to Trash"><Trash2 className="w-4 h-4"/></button></div></div>)}</div>
    </>)}
    <button onClick={load} className="text-xs text-slate-400 hover:text-white flex items-center gap-1"><RefreshCw className="w-3.5 h-3.5"/>Refresh catalog</button>
  </div>;
};
