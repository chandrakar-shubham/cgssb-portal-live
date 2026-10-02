import React, { useState } from 'react';
import { CheckCircle2, ClipboardPaste, FileJson, ShieldCheck, UploadCloud, AlertCircle, RefreshCw } from 'lucide-react';
import { auth, db } from '../firebase/config';
import { collection, doc, getDoc, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';

type DraftImport = {
  schemaVersion?: string;
  importId?: string;
  operation?: 'create_draft';
  catalog?: { authorityId?: string; programId?: string; postId?: string; seriesId?: string; bundleId?: string };
  series?: { id?: string; status?: string; name?: string };
  bundle?: Record<string, any>;
  test?: Record<string, any>;
  questions?: Array<Record<string, any>>;
};

const toNumber = (value: unknown, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export const AdminContentDraftImporter: React.FC = () => {
  const [rawJson, setRawJson] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const createDraft = async () => {
    setResult(null);
    if (!db || !auth.currentUser) {
      setResult({ ok: false, text: 'Admin authentication is required before importing content.' });
      return;
    }

    let payload: DraftImport;
    try {
      payload = JSON.parse(rawJson) as DraftImport;
    } catch (error: any) {
      setResult({ ok: false, text: `Invalid JSON: ${error?.message || 'parse error'}` });
      return;
    }

    const questions = Array.isArray(payload.questions) ? payload.questions : [];
    const catalog = payload.catalog || {};
    const seriesId = String(catalog.seriesId || payload.series?.id || '').trim();
    const bundleId = String(catalog.bundleId || payload.bundle?.id || '').trim();

    if (!seriesId || !bundleId) {
      setResult({ ok: false, text: 'Draft import requires catalog.seriesId and catalog.bundleId.' });
      return;
    }
    if (questions.length === 0) {
      setResult({ ok: false, text: 'Draft import requires at least one question.' });
      return;
    }

    setIsImporting(true);
    try {
      const seriesRef = doc(db, 'examTestSeries', seriesId);
      const bundleRef = doc(db, 'bundles', bundleId);
      const [seriesSnap, bundleSnap] = await Promise.all([getDoc(seriesRef), getDoc(bundleRef)]);

      if (!seriesSnap.exists()) throw new Error(`Canonical Test Series not found: ${seriesId}`);
      if (!bundleSnap.exists()) throw new Error(`Bundle not found: ${bundleId}`);

      const series = seriesSnap.data() as Record<string, any>;
      const existingBundle = bundleSnap.data() as Record<string, any>;
      if (series.bundleId && series.bundleId !== bundleId) {
        throw new Error('Series and bundle linkage mismatch. Import was blocked.');
      }

      const importId = String(payload.importId || `manual-${Date.now()}`);
      const now = new Date().toISOString();
      const testId = String(payload.test?.id || `draft-${seriesId}-${Date.now()}`);
      const questionIds = questions.map((q, index) => String(q.id || `q-${importId}-${index + 1}`));

      const duplicateIds = questionIds.filter((id, index) => questionIds.indexOf(id) !== index);
      if (duplicateIds.length) throw new Error(`Duplicate question IDs in JSON: ${[...new Set(duplicateIds)].join(', ')}`);

      const batch = writeBatch(db);

      questions.forEach((question, index) => {
        const id = questionIds[index];
        batch.set(doc(db, 'questions', id), {
          ...question,
          id,
          authorityId: catalog.authorityId || question.authorityId || series.authorityId,
          programId: catalog.programId || question.programId || series.programId,
          postId: catalog.postId || question.postId || series.postId || null,
          seriesId,
          bundleId,
          contentStatus: 'DRAFT',
          isPublished: false,
          updatedAt: now,
          createdAt: question.createdAt || now,
        }, { merge: true });
      });

      const testInput = payload.test || {};
      const newTest = {
        ...testInput,
        id: testId,
        title: testInput.title || payload.series?.name || series.name || 'Imported Draft Test',
        authorityId: catalog.authorityId || testInput.authorityId || series.authorityId,
        programId: catalog.programId || testInput.programId || series.programId,
        postId: catalog.postId || testInput.postId || series.postId || null,
        seriesId,
        bundleId,
        seriesType: testInput.seriesType || series.seriesType || 'full_mock',
        questionCount: questions.length,
        totalMarks: toNumber(testInput.totalMarks, questions.reduce((sum, q) => sum + toNumber(q.marks, 1), 0)),
        isPublished: false,
        contentStatus: 'DRAFT',
        createdAt: testInput.createdAt || now,
        updatedAt: now,
        sections: testInput.sections || [{ id: 'sec-1', name: 'Imported Draft', questionIds }],
      };
      batch.set(doc(db, 'mockTests', testId), newTest, { merge: true });

      const previousItems = Array.isArray(existingBundle.testItems) ? existingBundle.testItems : [];
      const item = {
        id: testId,
        title: newTest.title,
        titleHindi: newTest.titleHindi || newTest.title,
        type: 'full_mock',
        questionCount: questions.length,
        durationMinutes: toNumber(newTest.durationMinutes, 0),
        marks: toNumber(newTest.totalMarks, 0),
        isFreePreview: false,
        attemptsCount: 0,
        contentStatus: 'DRAFT',
      };
      const nextItems = previousItems.some((x: any) => x?.id === testId)
        ? previousItems.map((x: any) => x?.id === testId ? item : x)
        : [...previousItems, item];

      batch.set(bundleRef, {
        ...existingBundle,
        ...payload.bundle,
        id: bundleId,
        authorityId: catalog.authorityId || existingBundle.authorityId || series.authorityId,
        programId: catalog.programId || existingBundle.programId || series.programId,
        postId: catalog.postId || existingBundle.postId || series.postId || null,
        seriesId,
        seriesType: series.seriesType || existingBundle.seriesType || 'full_mock',
        testItems: nextItems,
        totalTestsCount: nextItems.length,
        isDraft: true,
        isPublished: false,
        updatedAt: now,
      }, { merge: true });

      batch.set(seriesRef, {
        status: 'DRAFT',
        bundleId,
        updatedAt: now,
      }, { merge: true });

      const auditRef = doc(collection(db, 'aiContentManagerAudit'));
      batch.set(auditRef, {
        action: 'CREATE_DRAFT_FROM_JSON',
        actorUid: auth.currentUser.uid,
        actorEmail: auth.currentUser.email || null,
        importId,
        seriesId,
        bundleId,
        testId,
        questionCount: questions.length,
        status: 'DRAFT',
        createdAt: serverTimestamp(),
      });

      await batch.commit();

      setResult({
        ok: true,
        text: `Draft created successfully. Test: ${testId} • ${questions.length} questions • Series remains DRAFT.`,
      });
    } catch (error: any) {
      setResult({ ok: false, text: error?.message || 'Draft import failed.' });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h1 className="text-lg sm:text-xl font-black text-white">Content Manager — JSON Draft Import</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Authenticated admin import. JSON creates a DRAFT only; it never publishes student-facing content.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] font-bold">
          Firebase Spark • Authenticated
        </span>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
          <FileJson className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-black text-slate-200">Canonical Import JSON</span>
        </div>
        <div className="p-4 space-y-3">
          <textarea
            value={rawJson}
            onChange={e => setRawJson(e.target.value)}
            placeholder={'Paste validated Content Manager JSON here…'}
            className="w-full min-h-[420px] rounded-xl bg-slate-950 border border-slate-800 p-4 text-xs text-slate-200 font-mono outline-none focus:border-indigo-500 resize-y"
            spellCheck={false}
          />
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold cursor-pointer">
              <UploadCloud className="w-4 h-4" /> Load .json
              <input type="file" accept="application/json,.json" className="hidden" onChange={async e => {
                const file = e.target.files?.[0];
                if (file) setRawJson(await file.text());
              }} />
            </label>
            <button
              type="button"
              onClick={() => {
                try { setRawJson(JSON.stringify(JSON.parse(rawJson), null, 2)); }
                catch { setResult({ ok: false, text: 'Format requires valid JSON first.' }); }
              }}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold"
            >
              <RefreshCw className="w-4 h-4" /> Format JSON
            </button>
            <button
              type="button"
              disabled={isImporting || !rawJson.trim()}
              onClick={createDraft}
              className="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-black"
            >
              {isImporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ClipboardPaste className="w-4 h-4" />}
              {isImporting ? 'Creating Draft…' : 'Push JSON → Create Draft'}
            </button>
          </div>
        </div>
      </div>

      {result && (
        <div className={`rounded-xl border p-4 flex items-start gap-3 ${result.ok ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200' : 'bg-rose-500/10 border-rose-500/30 text-rose-200'}`}>
          {result.ok ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <div className="text-xs font-bold">{result.text}</div>
        </div>
      )}

      <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 text-[11px] text-slate-400">
        <p className="font-black text-slate-300 mb-2">Required minimum JSON</p>
        <pre className="overflow-x-auto">{JSON.stringify({
          schemaVersion: '1.0',
          importId: 'unique-import-id',
          operation: 'create_draft',
          catalog: { authorityId: '...', programId: '...', postId: '...', seriesId: '...', bundleId: '...' },
          test: { title: '...', durationMinutes: 120 },
          questions: [{ id: 'q-001', questionText: '...', options: [], correctOption: 'A', marks: 1 }]
        }, null, 2)}</pre>
      </div>
    </section>
  );
};
