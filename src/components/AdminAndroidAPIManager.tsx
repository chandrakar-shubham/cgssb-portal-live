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

export const AdminAndroidAPIManager: React.FC = () => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [pingStatus, setPingStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [activeEndpointTest, setActiveEndpointTest] = useState<string | null>(null);
  const [testResponseData, setTestResponseData] = useState<any>(null);
  const [isTestingEndpoint, setIsTestingEndpoint] = useState(false);
  const [activeTab, setActiveTab] = useState<'endpoints' | 'kotlin' | 'offline-sync'>('endpoints');

  const currentHost = window.location.origin;
  const liveProductionUrl = 'https://darkorange-chimpanzee-661223.hostingersite.com';
  const apiBaseUrl = `${currentHost}/api`;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const runLivePingTest = async () => {
    setPingStatus('testing');
    const start = performance.now();
    try {
      const res = await fetch('/api/health');
      const end = performance.now();
      if (res.ok) {
        setPingStatus('success');
        setPingLatency(Math.round(end - start));
      } else {
        setPingStatus('failed');
      }
    } catch {
      setPingStatus('failed');
    }
  };

  const testEndpoint = async (url: string, method: string = 'GET', body?: any) => {
    setIsTestingEndpoint(true);
    setActiveEndpointTest(url);
    try {
      const res = await fetch(url, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      setTestResponseData({ status: res.status, ok: res.ok, data });
    } catch (err: any) {
      setTestResponseData({ status: 'Error', ok: false, data: { error: err.message } });
    } finally {
      setIsTestingEndpoint(false);
    }
  };

  const downloadOfflineSyncJson = async () => {
    try {
      const res = await fetch('/api/android/sync');
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cgssb_android_offline_seed_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download sync payload: ' + err);
    }
  };

  const endpointsList = [
    {
      method: 'GET',
      path: '/api/health',
      title: 'Server Health & Android Compatibility',
      desc: 'Checks backend runtime, API version, and supported Android SDK levels (Min 24, Target 34).',
    },
    {
      method: 'GET',
      path: '/api/tests',
      title: 'Mock Tests Catalog',
      desc: 'Returns all published mock tests with sections, marks, negative marking, and question counts.',
    },
    {
      method: 'GET',
      path: '/api/tests/test-cgssb-01',
      title: 'Test Details & Question Paper',
      desc: 'Returns a complete test package with questions, options, and section mappings.',
    },
    {
      method: 'POST',
      path: '/api/tests/test-cgssb-01/submit',
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
      path: '/api/pyp',
      title: 'Previous Year Papers Archive',
      desc: 'Lists authentic solved papers with weightage trends and official PDF downloads.',
    },
    {
      method: 'GET',
      path: '/api/android/sync',
      title: 'Full Offline Synchronization Payload',
      desc: 'Dumps all categories, questions, papers, and mock tests to seed Android Room / SQLite DB.',
    },
  ];

  const retrofitCode = `package com.cgssbtest.app.network

import retrofit2.Response
import retrofit2.http.*

interface CGSSBApiService {

    // 1. Check Server Status
    @GET("api/health")
    suspend fun getHealth(): Response<HealthResponse>

    // 2. Fetch Mock Test Catalog (Filtered by Category)
    @GET("api/tests")
    suspend fun getMockTests(@Query("category") category: String? = null): Response<TestsResponse>

    // 3. Complete Test with Questions for Offline Practice
    @GET("api/tests/{id}")
    suspend fun getTestDetails(@Path("id") testId: String): Response<TestDetailResponse>

    // 4. Submit Candidate Responses & Negative Marking Scoring
    @POST("api/tests/{id}/submit")
    suspend fun submitTest(
        @Path("id") testId: String,
        @Body submission: TestSubmissionDto
    ): Response<TestAttemptResultDto>

    // 5. Previous Year Papers (PYP) Repository
    @GET("api/pyp")
    suspend fun getPreviousYearPapers(@Query("category") category: String? = null): Response<PypResponse>

    // 6. Full Offline Mobile DB Synchronization (Room DB / SQLite)
    @GET("api/android/sync")
    suspend fun syncAllMobileData(): Response<AndroidSyncPayload>
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
              <span>{pingStatus === 'testing' ? 'Pinging Server...' : 'Ping Live Health'}</span>
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

        {/* Server & Connectivity Badges */}
        <div className="mt-5 pt-4 border-t border-indigo-900/40 flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <div className="flex items-center space-x-2 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
            <Server className="w-3.5 h-3.5 text-indigo-400" />
            <span>Active Base URL:</span>
            <code className="text-indigo-300 font-mono text-[11px]">{apiBaseUrl}</code>
            <button
              onClick={() => copyToClipboard(apiBaseUrl, 'base-url')}
              className="text-slate-400 hover:text-white"
            >
              {copiedSection === 'base-url' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>

          <div className="flex items-center space-x-2 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
            <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
            <span>Hostinger URL:</span>
            <code className="text-blue-300 font-mono text-[11px]">{liveProductionUrl}/api</code>
            <button
              onClick={() => copyToClipboard(`${liveProductionUrl}/api`, 'hostinger-url')}
              className="text-slate-400 hover:text-white"
            >
              {copiedSection === 'hostinger-url' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>

          {pingStatus === 'success' && (
            <div className="flex items-center space-x-1.5 text-emerald-400 bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-800/40 text-[11px] font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>200 OK ({pingLatency}ms)</span>
            </div>
          )}

          {pingStatus === 'failed' && (
            <div className="flex items-center space-x-1.5 text-rose-400 bg-rose-950/50 px-2.5 py-1 rounded-lg border border-rose-800/40 text-[11px] font-bold">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Ping failed</span>
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
                      onClick={() => testEndpoint(ep.path, ep.method, ep.body)}
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
                The mobile app uses the <code className="text-emerald-400">/api/android/sync</code> endpoint to download tests and questions for 100% offline practice. Aspirants in rural Chhattisgarh can practice mock tests even without continuous internet access.
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
                WorkManager periodically queries <code className="text-slate-300">/api/health</code> when Wi-Fi or cellular network is available.
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
