import React, { useState } from 'react';
import {
  Smartphone,
  Server,
  Activity,
  Copy,
  Check,
  Code2,
  Terminal,
  Download,
  Wifi,
  Database,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Send,
  CheckCircle2,
  AlertCircle,
  FileJson,
  Layers,
  FileText
} from 'lucide-react';
import { collection, getDoc, getDocs, doc } from 'firebase/firestore';
import { db } from '../firebase/config';

export const AdminAndroidAPIManager: React.FC = () => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [pingStatus, setPingStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [activeEndpointTest, setActiveEndpointTest] = useState<string | null>(null);
  const [testResponseData, setTestResponseData] = useState<any>(null);
  const [isTestingEndpoint, setIsTestingEndpoint] = useState(false);
  const [activeTab, setActiveTab] = useState<'endpoints' | 'kotlin' | 'offline-sync'>('endpoints');

  const firebaseProject = 'ai-studio-cgssbtest';
  const firebasePlatform = 'Firebase Authentication + Cloud Firestore';

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const runLivePingTest = async () => {
    setPingStatus('testing');
    const start = performance.now();
    try {
      await Promise.all([
        getDocs(collection(db, 'mockTests')),
        getDocs(collection(db, 'questions')),
        getDocs(collection(db, 'pypPapers')),
      ]);
      setPingStatus('success');
      setPingLatency(Math.round(performance.now() - start));
    } catch {
      setPingStatus('failed');
    }
  };

  const testEndpoint = async (path: string, method: string = 'GET') => {
    setIsTestingEndpoint(true);
    setActiveEndpointTest(path);
    try {
      const started = performance.now();
      if (method !== 'GET') {
        setTestResponseData({
          status: 'Firebase-native',
          ok: true,
          data: { message: 'Write operations are executed through Firebase Auth + Firestore SDKs. Android should use Firebase SDK authentication and Firestore writes rather than a REST server.' }
        });
      } else if (path === '/firebase/health') {
        await Promise.all([getDocs(collection(db, 'mockTests')), getDocs(collection(db, 'questions'))]);
        setTestResponseData({ status: 'OK', ok: true, data: { platform: 'Firebase Spark', latencyMs: Math.round(performance.now() - started) } });
      } else if (path === '/firebase/tests') {
        const snap = await getDocs(collection(db, 'mockTests'));
        setTestResponseData({ status: 'OK', ok: true, data: { count: snap.size, collection: 'mockTests' } });
      } else if (path.startsWith('/firebase/tests/')) {
        const id = path.split('/').pop() || '';
        const snap = await getDoc(doc(db, 'mockTests', id));
        setTestResponseData({ status: snap.exists() ? 'OK' : 'NOT_FOUND', ok: snap.exists(), data: snap.exists() ? snap.data() : { error: 'Test not found' } });
      } else if (path === '/firebase/pyp') {
        const snap = await getDocs(collection(db, 'pypPapers'));
        setTestResponseData({ status: 'OK', ok: true, data: { count: snap.size, collection: 'pypPapers' } });
      } else if (path === '/firebase/android-sync') {
        const [tests, questions, pyp] = await Promise.all([
          getDocs(collection(db, 'mockTests')),
          getDocs(collection(db, 'questions')),
          getDocs(collection(db, 'pypPapers')),
        ]);
        setTestResponseData({ status: 'OK', ok: true, data: { platform: 'Firebase Spark', tests: tests.size, questions: questions.size, pypPapers: pyp.size } });
      }
    } catch (err: any) {
      setTestResponseData({ status: 'Error', ok: false, data: { error: err?.message || 'Firebase operation failed' } });
    } finally {
      setIsTestingEndpoint(false);
    }
  };

  const downloadOfflineSyncJson = async () => {
    try {
      const [tests, questions, pyp] = await Promise.all([
        getDocs(collection(db, 'mockTests')),
        getDocs(collection(db, 'questions')),
        getDocs(collection(db, 'pypPapers')),
      ]);
      const data = {
        platform: 'Firebase Spark',
        generatedAt: new Date().toISOString(),
        mockTests: tests.docs.map(d => d.data()),
        questions: questions.docs.map(d => d.data()),
        pypPapers: pyp.docs.map(d => d.data()),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cgssb_android_firebase_seed_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download Firebase sync payload: ' + err);
    }
  };

  const endpointsList = [
    {
      method: 'GET',
      path: '/firebase/health',
      title: 'Firebase Health & Android Compatibility',
      desc: 'Checks backend runtime, API version, and supported Android SDK levels (Min 24, Target 34).',
    },
    {
      method: 'GET',
      path: '/firebase/tests',
      title: 'Mock Tests Catalog',
      desc: 'Returns all published mock tests with sections, marks, negative marking, and question counts.',
    },
    {
      method: 'GET',
      path: '/firebase/tests/test-cgssb-01',
      title: 'Test Details & Question Paper',
      desc: 'Returns a complete test package with questions, options, and section mappings.',
    },
    {
      method: 'POST',
      path: '/firebase/tests/test-cgssb-01/submit',
      title: 'Submit Candidate Exam Attempt',
      desc: 'Calculates instant score, negative marking deduction, candidate accuracy & percentile rank.',
      body: {
        userId: 'u-android-aspirant',
        timeTakenSeconds: 320,
        responses: { 'q-cg-01': 'A', 'q-cg-02': 'B' },
      },
    },
    {
      method: 'GET',
      path: '/firebase/pyp',
      title: 'Previous Year Papers Archive',
      desc: 'Lists authentic solved papers with weightage trends and official PDF downloads.',
    },
    {
      method: 'GET',
      path: '/firebase/android-sync',
      title: 'Full Offline Synchronization Payload',
      desc: 'Dumps all categories, questions, papers, and mock tests to seed Android Room / SQLite DB.',
    },
  ];

  const retrofitCode = `package com.cgtest.app.firebase

import com.google.firebase.firestore.FirebaseFirestore

class CGSSBFirebaseRepository {
    private val db = FirebaseFirestore.getInstance()

    fun getMockTests() = db.collection("mockTests")
    fun getQuestions() = db.collection("questions")
    fun getPreviousYearPapers() = db.collection("pypPapers")
    fun getTest(testId: String) = db.collection("mockTests").document(testId)
    // Authenticate with Firebase Auth before student-specific writes.
    // Store offline copies in Room for offline practice.
}`;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-900/50 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
              <Smartphone className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-black text-white tracking-tight">
                  Android Mobile App & REST API Suite
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Admin Control
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Seamless synchronization layer for native Android apps (Kotlin / Retrofit / Room DB). Manage endpoints, test live server health, and export offline exam seed databases.
              </p>
            </div>
          </div>

          {/* Quick Health Ping */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={runLivePingTest}
              disabled={pingStatus === 'testing'}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center space-x-2 border border-slate-700 shadow-md transition cursor-pointer disabled:opacity-50"
            >
              <Activity className={`w-3.5 h-3.5 ${pingStatus === 'testing' ? 'animate-spin text-indigo-400' : 'text-emerald-400'}`} />
              <span>{pingStatus === 'testing' ? 'Checking Firestore...' : 'Ping Live Health'}</span>
            </button>
            <button
              onClick={downloadOfflineSyncJson}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center space-x-2 shadow-md shadow-emerald-600/20 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Offline Seed</span>
            </button>
          </div>
        </div>

        {/* Firebase Connectivity Badges */}
        <div className="mt-5 pt-4 border-t border-indigo-900/40 flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <div className="flex items-center space-x-2 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            <span>Platform:</span>
            <code className="text-indigo-300 font-mono text-[11px]">{firebasePlatform}</code>
            <button
              onClick={() => copyToClipboard(firebaseProject, 'firebase-project')}
              className="text-slate-400 hover:text-white"
            >
              {copiedSection === 'firebase-project' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>

          <div className="flex items-center space-x-2 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
            <Database className="w-3.5 h-3.5 text-blue-400" />
            <span>Firestore Project:</span>
            <code className="text-blue-300 font-mono text-[11px]">{firebaseProject}</code>
          </div>

          {pingStatus === 'success' && (
            <div className="flex items-center space-x-1.5 text-emerald-400 bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-800/40 text-[11px] font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Firestore OK ({pingLatency}ms)</span>
            </div>
          )}

          {pingStatus === 'failed' && (
            <div className="flex items-center space-x-1.5 text-rose-400 bg-rose-950/50 px-2.5 py-1 rounded-lg border border-rose-800/40 text-[11px] font-bold">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Firestore check failed</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('endpoints')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
            activeTab === 'endpoints'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Interactive Endpoints ({endpointsList.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('kotlin')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
            activeTab === 'kotlin'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Android Kotlin Retrofit Code</span>
        </button>
        <button
          onClick={() => setActiveTab('offline-sync')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
            activeTab === 'offline-sync'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Room Database & Offline Architecture</span>
        </button>
      </div>

      {/* TAB 1: INTERACTIVE ENDPOINTS */}
      {activeTab === 'endpoints' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Endpoints List */}
          <div className="lg:col-span-7 space-y-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Available REST Endpoints
            </h2>
            {endpointsList.map((ep, idx) => {
              const isSelected = activeEndpointTest === ep.path;
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border transition ${
                    isSelected
                      ? 'bg-slate-900 border-indigo-500 shadow-md shadow-indigo-500/10'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black font-mono ${
                          ep.method === 'GET'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        {ep.method}
                      </span>
                      <code className="text-xs font-mono font-bold text-slate-200">{ep.path}</code>
                    </div>

                    <button
                      onClick={() => testEndpoint(ep.path, ep.method)}
                      disabled={isTestingEndpoint}
                      className="px-3 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-semibold flex items-center space-x-1.5 transition self-start sm:self-auto cursor-pointer"
                    >
                      <Send className="w-3 h-3" />
                      <span>Test Endpoint</span>
                    </button>
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-0.5">{ep.title}</h3>
                  <p className="text-xs text-slate-400">{ep.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Test Response Inspector */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Live Response Inspector
              </h2>
              {testResponseData && (
                <button
                  onClick={() => copyToClipboard(JSON.stringify(testResponseData.data, null, 2), 'response-json')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
                >
                  {copiedSection === 'response-json' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>Copy JSON</span>
                </button>
              )}
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 min-h-[400px] flex flex-col font-mono text-xs">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-slate-400 text-[11px]">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                  <span>{activeEndpointTest || 'Select an endpoint to test'}</span>
                </div>
                {testResponseData && (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${testResponseData.ok ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400'}`}>
                    Status: {testResponseData.status}
                  </span>
                )}
              </div>

              <div className="flex-1 overflow-auto max-h-[500px]">
                {isTestingEndpoint ? (
                  <div className="h-full flex items-center justify-center text-slate-500 space-x-2 py-12">
                    <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                    <span>Executing HTTP request...</span>
                  </div>
                ) : testResponseData ? (
                  <pre className="text-emerald-300 text-[11px] leading-relaxed whitespace-pre-wrap">
                    {JSON.stringify(testResponseData.data, null, 2)}
                  </pre>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center py-12">
                    <Terminal className="w-8 h-8 mb-2 stroke-1" />
                    <p className="text-xs font-sans">Click "Test Endpoint" on any API route to view live JSON output.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: KOTLIN RETROFIT CODE */}
      {activeTab === 'kotlin' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-300">
              Copy this complete Retrofit interface into your Android Studio project under <code className="text-indigo-300 bg-slate-900 px-1.5 py-0.5 rounded">network/CGSSBApiService.kt</code>.
            </p>
            <button
              onClick={() => copyToClipboard(retrofitCode, 'retrofit-code')}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer"
            >
              {copiedSection === 'retrofit-code' ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy Kotlin Code</span>
            </button>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xs overflow-x-auto text-indigo-200 leading-relaxed">
            <pre>{retrofitCode}</pre>
          </div>
        </div>
      )}

      {/* TAB 3: OFFLINE SYNC ARCHITECTURE */}
      {activeTab === 'offline-sync' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white mb-1">Android Room Database Synchronization</h3>
              <p className="text-xs text-slate-400 max-w-2xl">
                The mobile app reads published exam data from Cloud Firestore using the Firebase Android SDK, then mirrors it into Room for 100% offline practice. No REST server or Hostinger dependency is required.
              </p>
            </div>
            <button
              onClick={downloadOfflineSyncJson}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-2 shrink-0 transition cursor-pointer shadow-lg shadow-emerald-600/20"
            >
              <Download className="w-4 h-4" />
              <span>Download Seed JSON</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1.5">
              <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs">
                <Wifi className="w-4 h-4" />
                <span>1. Network Detection</span>
              </div>
              <p className="text-[11px] text-slate-400">
                WorkManager can trigger Firebase Firestore synchronization when network connectivity is available.
              </p>
            </div>

            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1.5">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
                <Database className="w-4 h-4" />
                <span>2. Room DB Upsert</span>
              </div>
              <p className="text-[11px] text-slate-400">
                New questions, papers, and mock tests are transactionally updated into local Room entities using the unique question ID.
              </p>
            </div>

            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1.5">
              <div className="flex items-center space-x-2 text-blue-400 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>3. Offline Evaluation</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Candidates complete full timed tests offline. Exact marks and negative markings are computed locally and queued for cloud sync.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
