import React, { useState } from 'react';
import { useRemoteConfig } from '../context/RemoteConfigContext';
import { AppRemoteConfig } from '../types';
import {
  Sliders,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  Bell,
  ShieldCheck,
  CreditCard,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Lock,
  Globe,
  Radio,
  Save,
  HelpCircle,
} from 'lucide-react';

export const AdminRemoteConfigStudio: React.FC = () => {
  const { config, updateConfig, resetToDefaults, refreshConfig, isLoading } = useRemoteConfig();
  const [formState, setFormState] = useState<AppRemoteConfig>(config);
  const [activeTab, setActiveTab] = useState<'flags' | 'maintenance' | 'banner' | 'exam_rules' | 'pricing' | 'json'>('flags');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Sync state if external config changes
  React.useEffect(() => {
    setFormState(config);
  }, [config]);

  const handleToggleFlag = (key: keyof AppRemoteConfig['featureFlags']) => {
    setFormState(prev => ({
      ...prev,
      featureFlags: {
        ...prev.featureFlags,
        [key]: !prev.featureFlags[key],
      },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    const success = await updateConfig(formState);
    setIsSaving(false);
    if (success) {
      setSaveStatus('Remote configuration successfully published live to all connected candidate devices!');
      setTimeout(() => setSaveStatus(null), 4000);
    } else {
      setSaveStatus('Error saving remote configuration. Please check network.');
    }
  };

  const handleReset = async () => {
    if (window.confirm('Reset all feature flags and configurations to factory defaults?')) {
      setIsSaving(true);
      await resetToDefaults();
      setIsSaving(false);
      setSaveStatus('Configuration reset to safe factory defaults.');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
            <Sliders className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-black text-white">Server-Driven Remote Config Studio</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-400" />
                <span>Live Remote Control</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Control frontend features, paywalls, maintenance mode, announcement banners, and exam security rules in real time without redeploying code.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border border-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Factory Reset</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black transition flex items-center space-x-2 shadow-lg shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Publishing Live...' : 'Publish Changes Live'}</span>
          </button>
        </div>
      </div>

      {saveStatus && (
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center space-x-2 animate-fade-in shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveStatus}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800">
        {[
          { id: 'flags', label: 'Feature Flags (On/Off)', icon: Sliders },
          { id: 'maintenance', label: 'Maintenance Mode', icon: AlertTriangle },
          { id: 'banner', label: 'Global Alert Banner', icon: Bell },
          { id: 'exam_rules', label: 'Exam Anti-Cheat & Rules', icon: ShieldCheck },
          { id: 'pricing', label: 'Pass Pricing & Credits', icon: CreditCard },
          { id: 'json', label: 'Config JSON Inspector', icon: Globe },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: FEATURE FLAGS */}
      {activeTab === 'flags' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div>
            <h3 className="text-base font-black text-white">Dynamic Frontend Module Control</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Toggle complete portals and candidate tools on or off instantly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { key: 'enablePYPSection', title: 'Previous Year Papers (PYP)', desc: 'Official solved question papers archive' },
              { key: 'enableChapterTests', title: 'Chapter-Wise Drill Tests', desc: 'Subject and topic-level practice sets' },
              { key: 'enableMistakeNotebook', title: 'Mistake Notebook & Error Tags', desc: 'Revision notebook for conceptual gaps & silly mistakes' },
              { key: 'enableLiveLeaderboard', title: 'Real-Time State Leaderboards', desc: 'State-level topper ranks and percentile graphs' },
              { key: 'enableCurrentAffairsAI', title: 'AI Current Affairs Daily Digest', desc: 'Search-grounded daily Chhattisgarh & India digest' },
              { key: 'enableTestPassPaywall', title: 'Test Pass Subscription Paywall', desc: 'Monetization gateway for full-length mock access' },
              { key: 'enableChhattisgarhiRevision', title: 'Chhattisgarhi Bhasha Module', desc: 'Hana, Janula, and grammar flashcard decks' },
              { key: 'enableAITestGenerator', title: 'AI Smart Mock Test Generator', desc: 'Automated exam paper synthesis via Gemini API' },
              { key: 'enableStudentAnalytics', title: 'Student Analytics Hub', desc: 'Subject mastery, velocity, and time-per-question' },
              { key: 'enableBookmarks', title: 'Question Bookmarking System', desc: 'Save & tag questions during practice tests' },
              { key: 'enableLanguageToggle', title: 'Bilingual Language Switcher', desc: 'English / Hindi toggle in navbar and exam engine' },
              { key: 'enableSocialShareChallenges', title: 'Social Share Challenges', desc: 'Share score cards & test challenge links' },
            ].map(item => {
              const flagKey = item.key as keyof AppRemoteConfig['featureFlags'];
              const isEnabled = formState.featureFlags[flagKey];
              return (
                <div
                  key={item.key}
                  className={`p-4 rounded-2xl border transition flex items-start justify-between gap-3 ${
                    isEnabled
                      ? 'bg-slate-950/80 border-indigo-500/30 shadow-sm'
                      : 'bg-slate-950/40 border-slate-800 opacity-70'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${isEnabled ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                      <span className="text-xs font-black text-white">{item.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleFlag(flagKey)}
                    className={`p-2 rounded-xl transition cursor-pointer shrink-0 ${
                      isEnabled
                        ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                        : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {isEnabled ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: MAINTENANCE MODE */}
      {activeTab === 'maintenance' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-white">Emergency & Maintenance Mode Lockdown</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Temporarily lock candidate access with an official branded maintenance screen during major updates.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setFormState(prev => ({
                  ...prev,
                  maintenanceMode: { ...prev.maintenanceMode, enabled: !prev.maintenanceMode.enabled },
                }))
              }
              className={`px-4 py-2 rounded-2xl font-black text-xs flex items-center space-x-2 transition cursor-pointer border ${
                formState.maintenanceMode.enabled
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-lg shadow-rose-500/20'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>{formState.maintenanceMode.enabled ? 'MAINTENANCE IS ACTIVE' : 'MAINTENANCE IS OFF'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">Maintenance Screen Title</label>
              <input
                type="text"
                value={formState.maintenanceMode.title}
                onChange={e =>
                  setFormState(prev => ({
                    ...prev,
                    maintenanceMode: { ...prev.maintenanceMode, title: e.target.value },
                  }))
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-bold"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">Estimated Duration / Resumption Time</label>
              <input
                type="text"
                value={formState.maintenanceMode.estimatedEndTime || ''}
                onChange={e =>
                  setFormState(prev => ({
                    ...prev,
                    maintenanceMode: { ...prev.maintenanceMode, estimatedEndTime: e.target.value },
                  }))
                }
                placeholder="e.g. 15 minutes / 02:00 PM IST"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold text-slate-300">Candidate Notice Message</label>
              <textarea
                rows={3}
                value={formState.maintenanceMode.message}
                onChange={e =>
                  setFormState(prev => ({
                    ...prev,
                    maintenanceMode: { ...prev.maintenanceMode, message: e.target.value },
                  }))
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GLOBAL ALERT BANNER */}
      {activeTab === 'banner' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-white">Top Announcement & Alert Banner</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Displays a prominent notice or offer strip at the very top of all student pages.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setFormState(prev => ({
                  ...prev,
                  globalAlertBanner: { ...prev.globalAlertBanner, enabled: !prev.globalAlertBanner.enabled },
                }))
              }
              className={`px-4 py-2 rounded-2xl font-black text-xs flex items-center space-x-2 transition cursor-pointer border ${
                formState.globalAlertBanner.enabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>{formState.globalAlertBanner.enabled ? 'BANNER IS ACTIVE' : 'BANNER IS HIDDEN'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">English Notice</label>
              <input
                type="text"
                value={formState.globalAlertBanner.message}
                onChange={e =>
                  setFormState(prev => ({
                    ...prev,
                    globalAlertBanner: { ...prev.globalAlertBanner, message: e.target.value },
                  }))
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">Hindi Notice</label>
              <input
                type="text"
                value={formState.globalAlertBanner.messageHindi}
                onChange={e =>
                  setFormState(prev => ({
                    ...prev,
                    globalAlertBanner: { ...prev.globalAlertBanner, messageHindi: e.target.value },
                  }))
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">Banner Alert Type</label>
              <select
                value={formState.globalAlertBanner.type}
                onChange={e =>
                  setFormState(prev => ({
                    ...prev,
                    globalAlertBanner: { ...prev.globalAlertBanner, type: e.target.value as any },
                  }))
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="info">Info (Blue/Indigo)</option>
                <option value="warning">Warning / Urgency (Amber)</option>
                <option value="alert">Critical Exam Alert (Rose)</option>
                <option value="success">Success / Offer (Emerald)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">Action Button Text</label>
              <input
                type="text"
                value={formState.globalAlertBanner.actionText || ''}
                onChange={e =>
                  setFormState(prev => ({
                    ...prev,
                    globalAlertBanner: { ...prev.globalAlertBanner, actionText: e.target.value },
                  }))
                }
                placeholder="e.g. Explore Series / Enroll"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: EXAM ENGINE RULES */}
      {activeTab === 'exam_rules' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div>
            <h3 className="text-base font-black text-white">CBT Exam Engine Lockdown & Anti-Cheat Rules</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Enforce proctored CBT constraints during active test attempts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { key: 'disableCopyPaste', title: 'Disable Copy-Paste & Right Click', desc: 'Prevents question text extraction or search copying during exam' },
              { key: 'enforceStrictFullscreen', title: 'Enforce Fullscreen Mode', desc: 'Prompts fullscreen and warns on window blur or tab switching' },
              { key: 'allowSectionSwitching', title: 'Allow Section Switching', desc: 'Enable free jumping between exam paper sections' },
              { key: 'autoSubmitOnTimerExpiry', title: 'Auto-Submit on Time Expiry', desc: 'Automatically submits candidate responses when countdown hits 0' },
              { key: 'showWatermark', title: 'Candidate Watermark Overlay', desc: 'Overlays dynamic watermark across test questions to prevent leak screenshots' },
            ].map(item => {
              const ruleKey = item.key as keyof AppRemoteConfig['examEngineRules'];
              const isEnabled = Boolean(formState.examEngineRules[ruleKey]);
              return (
                <div
                  key={item.key}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <span className="text-xs font-black text-white">{item.title}</span>
                    <p className="text-[11px] text-slate-400">{item.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setFormState(prev => ({
                        ...prev,
                        examEngineRules: {
                          ...prev.examEngineRules,
                          [ruleKey]: !prev.examEngineRules[ruleKey],
                        },
                      }))
                    }
                    className={`p-2 rounded-xl transition cursor-pointer shrink-0 ${
                      isEnabled
                        ? 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isEnabled ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: PRICING & CREDITS */}
      {activeTab === 'pricing' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div>
            <h3 className="text-base font-black text-white">Dynamic Test Pass Pricing & Credits Engine</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Change subscription prices, discount badges, and free trial allocations on the fly.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">Annual Pass Price (₹)</label>
              <input
                type="number"
                value={formState.pricingConfig.annualPassPrice}
                onChange={e =>
                  setFormState(prev => ({
                    ...prev,
                    pricingConfig: { ...prev.pricingConfig, annualPassPrice: Number(e.target.value) },
                  }))
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">Quarterly Pass Price (₹)</label>
              <input
                type="number"
                value={formState.pricingConfig.quarterlyPassPrice}
                onChange={e =>
                  setFormState(prev => ({
                    ...prev,
                    pricingConfig: { ...prev.pricingConfig, quarterlyPassPrice: Number(e.target.value) },
                  }))
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">Discount Badge (%)</label>
              <input
                type="number"
                value={formState.pricingConfig.discountPercentage}
                onChange={e =>
                  setFormState(prev => ({
                    ...prev,
                    pricingConfig: { ...prev.pricingConfig, discountPercentage: Number(e.target.value) },
                  }))
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">Signup Free Bonus Credits</label>
              <input
                type="number"
                value={formState.pricingConfig.signupBonusCredits}
                onChange={e =>
                  setFormState(prev => ({
                    ...prev,
                    pricingConfig: { ...prev.pricingConfig, signupBonusCredits: Number(e.target.value) },
                  }))
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">Credits Deducted Per AI Test</label>
              <input
                type="number"
                value={formState.pricingConfig.creditsPerAIGeneration}
                onChange={e =>
                  setFormState(prev => ({
                    ...prev,
                    pricingConfig: { ...prev.pricingConfig, creditsPerAIGeneration: Number(e.target.value) },
                  }))
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: JSON INSPECTOR */}
      {activeTab === 'json' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-white">Live Remote Config JSON Payload</h3>
            <span className="text-xs text-slate-400 font-mono">Last Updated: {formState.updatedAt}</span>
          </div>
          <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-emerald-400 text-xs font-mono overflow-x-auto max-h-96">
            {JSON.stringify(formState, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
