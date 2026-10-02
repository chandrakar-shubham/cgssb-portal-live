import React, { useMemo, useRef, useState } from 'react';
import { CheckCircle2, Code2, FileJson, FileUp, Loader2, RefreshCw, ShieldCheck, Upload, XCircle } from 'lucide-react';
import {
  CatalogPackageInput,
  CatalogImportPreview,
  importCatalogPackage,
  previewCatalogPackage,
  validateCatalogPackage,
} from '../firebase/catalogPackageImportService';

const SAMPLE_PACKAGE: CatalogPackageInput = {
  schemaVersion: '1.0',
  packageId: 'cgssb-teacher-recruitment-2026',
  mode: 'upsert',
  catalog: {
    authority: {
      name: 'CGSSB',
      shortName: 'CGSSB'
    },
    recruitment: {
      name: 'CGSSB Teacher Recruitment 2026',
      year: 2026,
      programType: 'recruitment',
      hasPosts: true,
      totalVacancies: 4800,
      recruitmentLabel: '4,800 Vacancies'
    },
    posts: [
      {
        name: 'Assistant Teacher',
        vacancies: 2292,
        payLevel: 'Level-06',
        salaryRange: '₹35,400–₹1,12,400',
        cadreBreakup: '795 E-Cadre + 1,497 T-Cadre'
      },
      {
        name: 'Teacher / TGT',
        vacancies: 1654,
        payLevel: 'Level-08',
        subjects: ['English', 'Hindi', 'Mathematics', 'Science', 'Social Science']
      }
    ],
    subjects: [
      {
        name: 'General Knowledge',
        nameHindi: 'सामान्य ज्ञान',
        topics: ['Indian Polity', 'History', 'Geography', 'Economy', 'General Science', 'Chhattisgarh GK']
      }
    ],
    testSeries: [
      {
        name: 'Assistant Teacher 2026 — Full Mock Series',
        seriesType: 'full_mock',
        postName: 'Assistant Teacher',
        description: 'Draft full-length mock test series.',
        examPattern: {
          totalQuestions: 100,
          totalMarks: 100,
          durationMinutes: 120,
          markingScheme: '+1 per question',
          negativeMarkPenalty: '-0.25',
          language: 'Bilingual',
          cadre: 'Assistant Teacher',
          keyRules: []
        },
        syllabus: [
          {
            subject: 'General Knowledge',
            marks: 100,
            questionCount: 100,
            topics: ['Indian Polity', 'History', 'Geography', 'Economy', 'General Science', 'Chhattisgarh GK']
          }
        ],
        officialLinks: {
          officialWebsiteUrl: 'https://vyapamcg.cgstate.gov.in/'
        }
      }
    ]
  }
};

interface Props {
  onImported?: () => void;
}

export const CatalogPackageImporter: React.FC<Props> = ({ onImported }) => {
  const [rawJson, setRawJson] = useState('');
  const [preview, setPreview] = useState<CatalogImportPreview | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string>('');
  const fileRef = useRef<HTMLInputElement>(null);

  const parsedSize = useMemo(() => {
    if (!rawJson) return '0 KB';
    return `${(new Blob([rawJson]).size / 1024).toFixed(1)} KB`;
  }, [rawJson]);

  const parseAndPreview = async () => {
    setResult('');
    setPreview(null);
    try {
      const parsed = JSON.parse(rawJson);
      const validation = validateCatalogPackage(parsed);
      setErrors(validation.errors);
      setWarnings(validation.warnings);
      if (validation.errors.length || !validation.normalized) return;
      const nextPreview = await previewCatalogPackage(validation.normalized);
      setPreview({
        ...nextPreview,
        warnings: [...validation.warnings, ...nextPreview.warnings],
        errors: validation.errors
      });
    } catch (error: any) {
      setErrors([`Invalid JSON: ${error?.message || 'Unable to parse JSON'}`]);
      setWarnings([]);
    }
  };

  const formatJson = () => {
    try {
      setRawJson(JSON.stringify(JSON.parse(rawJson), null, 2));
      setErrors([]);
    } catch {
      setErrors(['Cannot format: JSON is invalid.']);
    }
  };

  const loadSample = () => {
    setRawJson(JSON.stringify(SAMPLE_PACKAGE, null, 2));
    setPreview(null);
    setErrors([]);
    setWarnings([]);
    setResult('');
  };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setRawJson(await file.text());
    setPreview(null);
    setErrors([]);
    setWarnings([]);
    setResult(`Loaded ${file.name}`);
    event.target.value = '';
  };

  const createDraft = async () => {
    if (!preview || errors.length) return;
    setBusy(true);
    setResult('');
    try {
      const parsed = JSON.parse(rawJson);
      const validation = validateCatalogPackage(parsed);
      if (validation.errors.length || !validation.normalized) {
        setErrors(validation.errors);
        return;
      }
      const imported = await importCatalogPackage(validation.normalized, preview);
      setResult(`Draft catalog created/updated successfully: ${imported.postIds.length} posts, ${imported.subjectIds.length} subjects, ${imported.seriesIds.length} test series and ${imported.bundleIds.length} bundles. No tests or questions were imported.`);
      setPreview(null);
      onImported?.();
    } catch (error: any) {
      setErrors([error?.message || 'Catalog import failed.']);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="bg-slate-950/50 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <FileJson className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-black text-white">Catalog Package Import</h2>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">JSON → DRAFT</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Creates Authority → Recruitment → Posts → Subjects → Test Series → Bundles. Tests and questions are intentionally excluded.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={loadSample} className="px-3 py-2 rounded-lg border border-slate-700 text-[11px] font-bold text-slate-300 hover:text-white hover:bg-slate-900">
            Load Sample
          </button>
          <button type="button" onClick={() => fileRef.current?.click()} className="px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5" /> Import JSON
          </button>
          <input ref={fileRef} type="file" accept=".json,application/json" onChange={handleFile} className="hidden" />
        </div>
      </div>

      <div className="p-5 grid grid-cols-1 xl:grid-cols-[1.25fr_.75fr] gap-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Catalog JSON</label>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-slate-600">{parsedSize}</span>
              <button type="button" onClick={formatJson} className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300">Format JSON</button>
            </div>
          </div>
          <textarea
            value={rawJson}
            onChange={e => { setRawJson(e.target.value); setPreview(null); setResult(''); }}
            spellCheck={false}
            className="w-full min-h-[500px] p-4 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:outline-none text-[11px] leading-5 font-mono text-slate-200"
            placeholder={'Paste a Catalog Package JSON here...'}
          />
          <button
            type="button"
            onClick={parseAndPreview}
            disabled={!rawJson.trim() || busy}
            className="w-full px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-black flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Validate & Preview Import
          </button>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <div className="flex items-center gap-2 text-xs font-black text-white">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Import contract
            </div>
            <ul className="mt-3 space-y-2 text-[11px] text-slate-400">
              <li>• Existing IDs are updated; missing records are created.</li>
              <li>• Authority, recruitment, posts, subjects, series and bundles remain <b className="text-amber-300">DRAFT</b>.</li>
              <li>• Bundle syllabus, blueprint, dates, eligibility, official links and SEO metadata can be populated.</li>
              <li>• Tests/PYP/questions are never created by this importer.</li>
              <li>• Stable IDs are generated from explicit IDs or canonical slugs.</li>
            </ul>
          </div>

          {errors.length > 0 && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-4">
              <div className="text-xs font-black text-rose-300">Validation errors</div>
              <ul className="mt-2 space-y-1 text-[11px] text-rose-200">
                {errors.map((error, index) => <li key={index}>• {error}</li>)}
              </ul>
            </div>
          )}

          {warnings.length > 0 && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4">
              <div className="text-xs font-black text-amber-300">Warnings</div>
              <ul className="mt-2 space-y-1 text-[11px] text-amber-200">
                {warnings.map((warning, index) => <li key={index}>• {warning}</li>)}
              </ul>
            </div>
          )}

          {preview && (
            <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/10 p-4">
              <div className="text-xs font-black text-cyan-300">Import Preview</div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                {[
                  ['Authority', preview.counts.authorities, preview.existing.authority],
                  ['Recruitment', preview.counts.programs, preview.existing.program],
                  ['Posts', preview.counts.posts, preview.existing.posts],
                  ['Subjects', preview.counts.subjects, preview.existing.subjects],
                  ['Test Series', preview.counts.series, preview.existing.series],
                  ['Bundles', preview.counts.bundles, preview.existing.bundles],
                ].map(([label, count, existing]) => (
                  <div key={String(label)} className="rounded-lg bg-slate-950/70 border border-slate-800 p-2.5">
                    <div className="text-[10px] text-slate-500">{label}</div>
                    <div className="flex items-end justify-between gap-2 mt-1">
                      <span className="text-sm font-black text-white">{count}</span>
                      <span className={existing ? 'text-[9px] text-amber-300' : 'text-[9px] text-emerald-300'}>
                        {existing ? 'UPSERT' : 'CREATE'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[10px] text-slate-500">
                Tests: <span className="text-white font-bold">0</span> · Questions: <span className="text-white font-bold">0</span> · Publish: <span className="text-amber-300 font-bold">NO</span>
              </div>
              <button
                type="button"
                onClick={createDraft}
                disabled={busy || preview.errors.length > 0}
                className="mt-3 w-full px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-black flex items-center justify-center gap-2"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {busy ? 'Creating Draft Catalog…' : 'Create / Update Draft Catalog'}
              </button>
            </div>
          )}

          {result && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 text-[11px] text-emerald-200">
              {result}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default CatalogPackageImporter;
