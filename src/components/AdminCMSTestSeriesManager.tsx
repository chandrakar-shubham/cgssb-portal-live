import React, { useState } from 'react';
import { CMSTestSeriesPack } from '../types/cms';
import { MockTest } from '../types';
import {
  Layers,
  Plus,
  Trash2,
  Save,
  Crown,
  CheckCircle2,
  Edit3,
  ExternalLink,
  ShieldCheck,
  Monitor,
  Layout,
  Sparkles,
  Zap,
  Check
} from 'lucide-react';

interface AdminCMSTestSeriesManagerProps {
  seriesPacks: CMSTestSeriesPack[];
  availableTests: MockTest[];
  onSavePack: (pack: CMSTestSeriesPack) => Promise<void>;
  onDeletePack: (id: string) => Promise<void>;
}

export const AdminCMSTestSeriesManager: React.FC<AdminCMSTestSeriesManagerProps> = ({
  seriesPacks,
  availableTests,
  onSavePack,
  onDeletePack,
}) => {
  const [selectedPackId, setSelectedPackId] = useState<string | null>(
    seriesPacks[0]?.id || null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'split' | 'edit' | 'preview'>('split');

  const activePack = seriesPacks.find(p => p.id === selectedPackId) || seriesPacks[0] || null;
  const [draftPack, setDraftPack] = useState<CMSTestSeriesPack | null>(activePack);

  React.useEffect(() => {
    const p = seriesPacks.find(x => x.id === selectedPackId);
    if (p) setDraftPack(JSON.parse(JSON.stringify(p)));
  }, [selectedPackId, seriesPacks]);

  const showNotification = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleCreateNewPack = () => {
    const newId = `pack-${Date.now()}`;
    const newPack: CMSTestSeriesPack = {
      id: newId,
      slug: `test-series-pack-${Math.floor(Math.random() * 1000)}`,
      title: 'New Test Series Master Pack',
      category: 'CGPSC',
      description: 'Curated test series package with subject wise and full mock papers.',
      badge: 'New Launch',
      price: 199,
      isPro: true,
      mockTestIds: availableTests.slice(0, 3).map(t => t.id),
      isPublished: true,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setDraftPack(newPack);
    setSelectedPackId(newId);
    showNotification('New Test Series Pack created.');
  };

  const handleToggleTestInPack = (testId: string) => {
    if (!draftPack) return;
    const exists = draftPack.mockTestIds.includes(testId);
    const mockTestIds = exists
      ? draftPack.mockTestIds.filter(id => id !== testId)
      : [...draftPack.mockTestIds, testId];

    setDraftPack({ ...draftPack, mockTestIds });
  };

  const handleSave = async () => {
    if (!draftPack) return;
    setIsSaving(true);
    try {
      await onSavePack(draftPack);
      showNotification('Test Series Pack saved!');
    } catch (err: any) {
      alert('Failed to save pack: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this test series pack?')) return;
    try {
      await onDeletePack(id);
      showNotification('Pack deleted.');
      const remaining = seriesPacks.filter(p => p.id !== id);
      if (remaining.length > 0) setSelectedPackId(remaining[0].id);
      else setDraftPack(null);
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-500 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-xs shadow-2xl flex items-center space-x-2 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 mb-2">
            <Crown className="w-3.5 h-3.5" />
            <span>Test Series Pack & Pass Pro Bundle Customizer</span>
          </div>
          <h1 className="text-2xl font-black text-white">No-Code Test Series Packs Manager</h1>
          <p className="text-xs text-slate-400 mt-1">
            Bundle mock tests into premium passes, set pricing, and preview live candidate cards.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* View Controller */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('split')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer ${
                activeTab === 'split' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
              <span>Split View</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('edit')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer ${
                activeTab === 'edit' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Form</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer ${
                activeTab === 'preview' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>⚡ Live Card</span>
            </button>
          </div>

          <button
            onClick={handleCreateNewPack}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center space-x-2 border border-slate-700 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>New Series Pack</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving || !draftPack}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center space-x-2 transition shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Series Pack'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar */}
        <div className="lg:col-span-3 space-y-3 bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase">Test Packs ({seriesPacks.length})</span>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono">Pass Pro</span>
          </div>

          <div className="space-y-1.5">
            {seriesPacks.map(p => {
              const isSelected = p.id === draftPack?.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPackId(p.id)}
                  className={`p-3 rounded-xl border text-xs font-semibold cursor-pointer transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="truncate space-y-0.5">
                    <div className="font-bold text-white truncate">{p.title}</div>
                    <div className="text-[10px] text-amber-400 font-mono">₹{p.price} • {p.mockTestIds.length} Tests</div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(p.id);
                    }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Middle & Right Content */}
        {draftPack && (
          <div className="lg:col-span-9 space-y-6">
            <div className={`grid gap-6 ${activeTab === 'split' ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
              
              {/* EDIT FORM */}
              {(activeTab === 'split' || activeTab === 'edit') && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <h3 className="font-bold text-white text-sm flex items-center space-x-2">
                      <Edit3 className="w-4 h-4 text-amber-400" />
                      <span>Series Pack Configuration</span>
                    </h3>
                    <span className="text-xs font-mono text-amber-400">ID: {draftPack.id}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="sm:col-span-2">
                      <label className="block text-slate-400 font-semibold mb-1">Pack Title</label>
                      <input
                        type="text"
                        value={draftPack.title}
                        onChange={e => setDraftPack({ ...draftPack, title: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Badge Tag</label>
                      <input
                        type="text"
                        value={draftPack.badge}
                        onChange={e => setDraftPack({ ...draftPack, badge: e.target.value })}
                        placeholder="e.g. Best Seller / Popular"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Price (₹ INR)</label>
                      <input
                        type="number"
                        value={draftPack.price}
                        onChange={e => setDraftPack({ ...draftPack, price: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-slate-400 font-semibold mb-1">Description</label>
                      <textarea
                        rows={2}
                        value={draftPack.description}
                        onChange={e => setDraftPack({ ...draftPack, description: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Included Tests Picker */}
                  <div className="space-y-3 pt-3 border-t border-slate-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">Bundled Mock Tests ({draftPack.mockTestIds.length} Selected)</span>
                      <span className="text-slate-400">Pick tests to bundle</span>
                    </div>

                    <div className="grid grid-cols-1 gap-2 max-h-52 overflow-y-auto pr-1">
                      {availableTests.map(t => {
                        const isSelected = draftPack.mockTestIds.includes(t.id);
                        return (
                          <div
                            key={t.id}
                            onClick={() => handleToggleTestInPack(t.id)}
                            className={`p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition flex items-center justify-between ${
                              isSelected
                                ? 'bg-amber-500/15 border-amber-500/60 text-amber-200'
                                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            <div className="truncate space-y-0.5">
                              <div className="truncate font-bold">{t.title}</div>
                              <div className="text-[10px] text-slate-500">{t.category} • {t.questionCount} Qs</div>
                            </div>

                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="rounded border-slate-700 text-amber-500 focus:ring-0"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* LIVE CARD PREVIEW */}
              {(activeTab === 'split' || activeTab === 'preview') && (
                <div className="space-y-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <h3 className="font-bold text-white text-sm flex items-center space-x-2">
                        <Monitor className="w-4 h-4 text-emerald-400" />
                        <span>Student Live Card Preview</span>
                      </h3>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                        Real-time Rendering
                      </span>
                    </div>

                    {/* Rendered Live Card */}
                    <div className="bg-gradient-to-br from-indigo-950/50 via-slate-950 to-slate-900 border-2 border-amber-500/40 rounded-3xl p-6 space-y-5 shadow-2xl relative overflow-hidden">
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-black text-xs border border-amber-500/40 uppercase tracking-wider flex items-center space-x-1.5 shadow-sm">
                          <Crown className="w-3.5 h-3.5" />
                          <span>{draftPack.badge || 'PRO TEST PASS'}</span>
                        </span>
                        <div className="text-right">
                          <span className="text-2xl font-black text-amber-400">₹{draftPack.price}</span>
                          <span className="text-[10px] text-slate-400 block font-sans">one-time access</span>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xl font-black text-white leading-tight">
                          {draftPack.title || 'Untitled Test Series Pack'}
                        </h3>
                        <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                          {draftPack.description || 'Comprehensive test series with full analytics and bilingual question papers.'}
                        </p>
                      </div>

                      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2.5 text-xs">
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-slate-300">Included Test Papers:</span>
                          <span className="text-amber-400 font-mono">{draftPack.mockTestIds.length} Tests Ready</span>
                        </div>

                        <div className="space-y-1.5">
                          {draftPack.mockTestIds.slice(0, 3).map(id => {
                            const test = availableTests.find(t => t.id === id);
                            return (
                              <div key={id} className="flex items-center space-x-2 text-[11px] text-slate-300">
                                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <span className="truncate">{test ? test.title : id}</span>
                              </div>
                            );
                          })}
                          {draftPack.mockTestIds.length > 3 && (
                            <div className="text-[10px] text-slate-500 pl-5">
                              + {draftPack.mockTestIds.length - 3} more full mock papers included
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-300 pt-1">
                        <div className="flex items-center space-x-1.5">
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          <span>Instant Score Analysis</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Bilingual Hindi/English</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 font-black text-sm flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/25 hover:opacity-95 transition"
                      >
                        <Crown className="w-4 h-4" />
                        <span>Unlock with All-Access Pass</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
