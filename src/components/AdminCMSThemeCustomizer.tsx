import React, { useState } from 'react';
import {
  CMSSiteSettings,
  NavMenuItem,
  ThemeTokens,
  PageThemeArchetype,
  PostThemeArchetype,
  DEFAULT_PAGE_THEME_TOKENS,
  DEFAULT_POST_THEME_TOKENS,
  DEFAULT_AD_SETTINGS
} from '../types/cms';
import {
  Palette,
  Save,
  CheckCircle2,
  Menu,
  Plus,
  Trash2,
  Globe,
  Sliders,
  DollarSign,
  ShieldCheck,
  Sparkles,
  Layout,
  Megaphone,
  Radio,
  FileText,
  RotateCcw
} from 'lucide-react';

interface AdminCMSThemeCustomizerProps {
  settings: CMSSiteSettings;
  onSaveSettings: (settings: CMSSiteSettings) => Promise<void>;
}

export const AdminCMSThemeCustomizer: React.FC<AdminCMSThemeCustomizerProps> = ({
  settings,
  onSaveSettings,
}) => {
  const [draftSettings, setDraftSettings] = useState<CMSSiteSettings>(() => {
    return {
      ...settings,
      pageThemes: settings.pageThemes || { ...DEFAULT_PAGE_THEME_TOKENS },
      postThemes: settings.postThemes || { ...DEFAULT_POST_THEME_TOKENS },
      adSettings: settings.adSettings || { ...DEFAULT_AD_SETTINGS },
    };
  });

  const [activeSubTab, setActiveSubTab] = useState<'themes' | 'ads' | 'nav' | 'identity'>('themes');
  const [selectedThemeCategory, setSelectedThemeCategory] = useState<'pages' | 'posts'>('pages');
  const [selectedArchetypeKey, setSelectedArchetypeKey] = useState<string>('hero_landing');
  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  React.useEffect(() => {
    setDraftSettings({
      ...settings,
      pageThemes: settings.pageThemes || { ...DEFAULT_PAGE_THEME_TOKENS },
      postThemes: settings.postThemes || { ...DEFAULT_POST_THEME_TOKENS },
      adSettings: settings.adSettings || { ...DEFAULT_AD_SETTINGS },
    });
  }, [settings]);

  const showNotification = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveSettings(draftSettings);
      showNotification('Theme tokens and ad monetization settings saved! All pages updated.');
    } catch (err: any) {
      alert('Failed to save settings: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetThemesToDefaults = () => {
    if (window.confirm('Reset all theme tokens to FAANG factory defaults?')) {
      setDraftSettings(prev => ({
        ...prev,
        pageThemes: { ...DEFAULT_PAGE_THEME_TOKENS },
        postThemes: { ...DEFAULT_POST_THEME_TOKENS },
        adSettings: { ...DEFAULT_AD_SETTINGS },
      }));
      showNotification('Reset to factory theme tokens.');
    }
  };

  // Nav Menu Helpers
  const handleAddNavItem = () => {
    const newNav: NavMenuItem = {
      id: `nav-${Date.now()}`,
      label: 'New Link',
      url: '/test-series',
    };
    setDraftSettings(prev => ({
      ...prev,
      navMenu: [...prev.navMenu, newNav],
    }));
  };

  const handleUpdateNavItem = (index: number, updated: NavMenuItem) => {
    const navMenu = [...draftSettings.navMenu];
    navMenu[index] = updated;
    setDraftSettings(prev => ({ ...prev, navMenu }));
  };

  const handleDeleteNavItem = (index: number) => {
    const navMenu = draftSettings.navMenu.filter((_, i) => i !== index);
    setDraftSettings(prev => ({ ...prev, navMenu }));
  };

  // Active Theme Token object
  const activeTokens: ThemeTokens =
    selectedThemeCategory === 'pages'
      ? draftSettings.pageThemes[selectedArchetypeKey as PageThemeArchetype] || DEFAULT_PAGE_THEME_TOKENS.hero_landing
      : draftSettings.postThemes[selectedArchetypeKey as PostThemeArchetype] || DEFAULT_POST_THEME_TOKENS.exam_notification;

  const updateActiveToken = (partial: Partial<ThemeTokens>) => {
    if (selectedThemeCategory === 'pages') {
      const key = selectedArchetypeKey as PageThemeArchetype;
      setDraftSettings(prev => ({
        ...prev,
        pageThemes: {
          ...prev.pageThemes,
          [key]: { ...prev.pageThemes[key], ...partial },
        },
      }));
    } else {
      const key = selectedArchetypeKey as PostThemeArchetype;
      setDraftSettings(prev => ({
        ...prev,
        postThemes: {
          ...prev.postThemes,
          [key]: { ...prev.postThemes[key], ...partial },
        },
      }));
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 font-sans">
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-500 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-xs shadow-2xl flex items-center space-x-2 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30 mb-2">
            <Palette className="w-3.5 h-3.5" />
            <span>Centralized Design Tokens & Monetization Engine</span>
          </div>
          <h1 className="text-2xl font-black text-white">Theme Tokens & Google Ads Studio</h1>
          <p className="text-xs text-slate-400 mt-1">
            Modify any page or post theme archetype once to cascade across all content, and manage Google AdSense monetization slots.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleResetThemesToDefaults}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center space-x-1.5 border border-slate-700 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex items-center space-x-2 transition shadow-lg shadow-purple-600/30 cursor-pointer disabled:opacity-50 shrink-0"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Publishing...' : 'Publish Theme Changes Live'}</span>
          </button>
        </div>
      </div>

      {/* Sub-Tab Navigation */}
      <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800">
        {[
          { id: 'themes', label: 'Theme Archetypes & Tokens', icon: Palette },
          { id: 'ads', label: 'Google Ads & Monetization', icon: DollarSign },
          { id: 'nav', label: 'Header Navigation Menu', icon: Menu },
          { id: 'identity', label: 'Site Identity & Banners', icon: Megaphone },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition cursor-pointer ${
                isActive
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: THEME ARCHETYPES & DESIGN TOKENS */}
      {activeSubTab === 'themes' && (
        <div className="space-y-6">
          {/* Category Switcher: Page Themes vs Post Themes */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setSelectedThemeCategory('pages');
                  setSelectedArchetypeKey('hero_landing');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                  selectedThemeCategory === 'pages'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                Page Themes (Landing, CBT, Syllabus)
              </button>
              <button
                onClick={() => {
                  setSelectedThemeCategory('posts');
                  setSelectedArchetypeKey('exam_notification');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                  selectedThemeCategory === 'posts'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                Post Themes (Alerts, Digests, Guides)
              </button>
            </div>

            {/* Archetype Selector */}
            <div className="flex flex-wrap items-center gap-2">
              {(selectedThemeCategory === 'pages'
                ? [
                    { key: 'hero_landing', label: '1. Hero Landing' },
                    { key: 'cbt_exam_focused', label: '2. CBT Series Focus' },
                    { key: 'editorial_magazine', label: '3. Editorial Magazine' },
                    { key: 'institutional_trust', label: '4. Institutional Trust' },
                  ]
                : [
                    { key: 'exam_notification', label: '1. Exam Notification' },
                    { key: 'daily_current_affairs', label: '2. Current Affairs Digest' },
                    { key: 'study_material_guide', label: '3. Study Material Guide' },
                    { key: 'topper_strategy', label: '4. Topper Strategy & Cutoffs' },
                  ]
              ).map(arch => (
                <button
                  key={arch.key}
                  onClick={() => setSelectedArchetypeKey(arch.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedArchetypeKey === arch.key
                      ? 'bg-slate-800 text-purple-400 border border-purple-500/40 font-black'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {arch.label}
                </button>
              ))}
            </div>
          </div>

          {/* Token Customizer Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Token Form */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-xs font-black uppercase text-purple-400 tracking-wider">
                  Configuring {activeTokens.name}
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">{activeTokens.description}</p>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Theme Accent Color Ramp</label>
                  <select
                    value={activeTokens.accentGradient}
                    onChange={e => updateActiveToken({ accentGradient: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-bold"
                  >
                    <option value="from-indigo-600 via-purple-600 to-pink-600">Indigo & Purple Mesh (High-Impact)</option>
                    <option value="from-teal-600 to-emerald-600">Teal & Emerald (Focus / Exam Series)</option>
                    <option value="from-sky-600 to-blue-700">Sky Blue & Deep Royal (Editorial / News)</option>
                    <option value="from-rose-600 to-red-700">Rose & Crimson (Urgent Notifications)</option>
                    <option value="from-amber-600 to-orange-600">Amber & Warm Gold (Official Authority)</option>
                    <option value="from-purple-600 to-indigo-700">Deep Violet & Purple (Study Materials)</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Card Container Style</label>
                    <select
                      value={activeTokens.cardStyle}
                      onChange={e => updateActiveToken({ cardStyle: e.target.value as any })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-bold"
                    >
                      <option value="glassmorphism">Glassmorphism (Frosted Dark)</option>
                      <option value="bordered_solid">Bordered Solid (Clean Sharp)</option>
                      <option value="minimal_clean">Minimal Clean (Subtle Slate)</option>
                      <option value="high_contrast">High Contrast (CBT Focus)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Border Corner Radius</label>
                    <select
                      value={activeTokens.borderRadius}
                      onChange={e => updateActiveToken({ borderRadius: e.target.value as any })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-bold"
                    >
                      <option value="rounded-xl">Compact (12px / rounded-xl)</option>
                      <option value="rounded-2xl">Modern Soft (16px / rounded-2xl)</option>
                      <option value="rounded-3xl">Pill Smooth (24px / rounded-3xl)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Header Layout Archetype</label>
                    <select
                      value={activeTokens.headerLayout}
                      onChange={e => updateActiveToken({ headerLayout: e.target.value as any })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-bold"
                    >
                      <option value="hero_banner">Full Gradient Hero Banner</option>
                      <option value="magazine_clean">Magazine Clean Header</option>
                      <option value="compact_split">Compact Split Layout</option>
                      <option value="official_header">Official Government Portal Header</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Ad Density for this Theme</label>
                    <select
                      value={activeTokens.adDensity}
                      onChange={e => updateActiveToken({ adDensity: e.target.value as any })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-amber-400 font-bold"
                    >
                      <option value="none">None (0 Ads / Pure Focus)</option>
                      <option value="light">Light (Top Leaderboard only)</option>
                      <option value="standard">Standard (Leaderboard + In-Article)</option>
                      <option value="high">High (Leaderboard + In-Article + Sidebar)</option>
                    </select>
                  </div>
                </div>

                {/* Toggles */}
                <div className="pt-2 border-t border-slate-800 space-y-3">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-300 font-bold">Show Breadcrumb Navigation Path</span>
                    <input
                      type="checkbox"
                      checked={activeTokens.showBreadcrumbs}
                      onChange={e => updateActiveToken({ showBreadcrumbs: e.target.checked })}
                      className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-300 font-bold">Show 1-Click WhatsApp / Social Share</span>
                    <input
                      type="checkbox"
                      checked={activeTokens.showSocialShare}
                      onChange={e => updateActiveToken({ showSocialShare: e.target.checked })}
                      className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-300 font-bold">Show Related Test Series Recommendations</span>
                    <input
                      type="checkbox"
                      checked={activeTokens.showRelatedTests}
                      onChange={e => updateActiveToken({ showRelatedTests: e.target.checked })}
                      className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Right: Live Theme Visual Token Preview Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
              <span className="text-xs font-black uppercase text-slate-400 tracking-wider block">
                Live Token Hierarchy Preview
              </span>

              {/* Sample Mini Mockup Card */}
              <div
                className={`p-6 bg-gradient-to-r ${activeTokens.accentGradient} ${activeTokens.borderRadius} space-y-3 shadow-2xl text-white`}
              >
                <div className="inline-block px-2.5 py-0.5 rounded-full bg-black/40 text-[10px] font-black uppercase tracking-wider">
                  Live Preview: {activeTokens.name}
                </div>
                <h4 className="text-xl font-black">Sample CGSSB Examination Header</h4>
                <p className="text-xs text-white/90 leading-relaxed font-medium">
                  This card showcases active typography, corner radii ({activeTokens.borderRadius}), and gradient lighting tokens.
                </p>
              </div>

              {/* Sample Sub-card */}
              <div
                className={`p-5 bg-slate-950 border border-slate-800 ${activeTokens.borderRadius} space-y-2 text-xs`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-purple-400 font-bold">Ad Density Level</span>
                  <span className="font-mono text-amber-400 uppercase font-bold">{activeTokens.adDensity}</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  All published content assigned to "{activeTokens.name}" automatically syncs with these rules.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GOOGLE ADS & MONETIZATION */}
      {activeSubTab === 'ads' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-black text-white flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <span>Google AdSense & In-App Monetization Engine</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage banner ad slots, AdSense publisher IDs, and subscription-aware ad filtering.
              </p>
            </div>

            <label className="flex items-center space-x-2 cursor-pointer">
              <span className="text-xs font-bold text-slate-300">Global Ads Switch:</span>
              <input
                type="checkbox"
                checked={draftSettings.adSettings?.enableAds ?? true}
                onChange={e =>
                  setDraftSettings(prev => ({
                    ...prev,
                    adSettings: { ...prev.adSettings, enableAds: e.target.checked },
                  }))
                }
                className="rounded text-emerald-500 focus:ring-emerald-500 h-5 w-5"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-2">
              <label className="text-slate-300 font-bold block">Google AdSense Publisher ID</label>
              <input
                type="text"
                value={draftSettings.adSettings?.adSensePublisherId || ''}
                onChange={e =>
                  setDraftSettings(prev => ({
                    ...prev,
                    adSettings: { ...prev.adSettings, adSensePublisherId: e.target.value },
                  }))
                }
                placeholder="ca-pub-1234567890123456"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono"
              />
              <span className="text-[11px] text-slate-500">Auto-injected into HTML header when AdSense is approved.</span>
            </div>

            <div className="space-y-4 pt-4 sm:pt-0">
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                <div>
                  <span className="text-white font-bold block">Auto-Bypass Ads for Pro Pass Holders</span>
                  <span className="text-slate-400 text-[11px]">Paying candidates get a 100% distraction-free experience.</span>
                </div>
                <input
                  type="checkbox"
                  checked={draftSettings.adSettings?.disableAdsForProUsers ?? true}
                  onChange={e =>
                    setDraftSettings(prev => ({
                      ...prev,
                      adSettings: { ...prev.adSettings, disableAdsForProUsers: e.target.checked },
                    }))
                  }
                  className="rounded text-indigo-500 focus:ring-indigo-500 h-4 w-4"
                />
              </label>
            </div>
          </div>

          {/* Ad Slot Specific Toggles */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">Dynamic Ad Slot Placements</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { key: 'topLeaderboard', title: 'Top Leaderboard', desc: '728x90 banner above article title' },
                { key: 'inContent', title: 'In-Content Native', desc: 'Injected between article paragraphs' },
                { key: 'sidebar', title: 'Sticky Sidebar', desc: '300x250 ad unit in desktop side rail' },
                { key: 'postFooter', title: 'Post-Footer Banner', desc: 'Bottom unit before comments & related tests' },
              ].map(slot => {
                const isSlotActive = draftSettings.adSettings?.slots?.[slot.key as keyof typeof draftSettings.adSettings.slots]?.enabled ?? true;
                return (
                  <div
                    key={slot.key}
                    className={`p-4 rounded-xl border transition flex flex-col justify-between space-y-3 ${
                      isSlotActive
                        ? 'bg-slate-950 border-emerald-500/30'
                        : 'bg-slate-950/40 border-slate-800 opacity-60'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold text-white block">{slot.title}</span>
                      <p className="text-[11px] text-slate-400">{slot.desc}</p>
                    </div>

                    <label className="flex items-center justify-between pt-2 border-t border-slate-800 cursor-pointer">
                      <span className="text-[10px] font-bold text-slate-400">Slot Active</span>
                      <input
                        type="checkbox"
                        checked={isSlotActive}
                        onChange={e => {
                          const slots = { ...(draftSettings.adSettings?.slots || DEFAULT_AD_SETTINGS.slots) };
                          (slots as any)[slot.key] = {
                            ...(slots as any)[slot.key],
                            enabled: e.target.checked,
                          };
                          setDraftSettings(prev => ({
                            ...prev,
                            adSettings: { ...prev.adSettings, slots },
                          }));
                        }}
                        className="rounded text-emerald-500 focus:ring-emerald-500 h-4 w-4"
                      />
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HEADER NAVIGATION MENU */}
      {activeSubTab === 'nav' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-black text-white">Header Navigation Links</h3>
              <p className="text-xs text-slate-400">Add or edit top menu links on candidate student views.</p>
            </div>
            <button
              onClick={handleAddNavItem}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center space-x-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Menu Link</span>
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {draftSettings.navMenu.map((item, idx) => (
              <div
                key={item.id}
                className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-3"
              >
                <div className="flex-1">
                  <input
                    type="text"
                    value={item.label}
                    onChange={e => handleUpdateNavItem(idx, { ...item, label: e.target.value })}
                    placeholder="Link Text"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-bold"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={item.url}
                    onChange={e => handleUpdateNavItem(idx, { ...item, url: e.target.value })}
                    placeholder="/page/about or /test-series"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-indigo-400 font-mono"
                  />
                </div>
                <button
                  onClick={() => handleDeleteNavItem(idx)}
                  className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                  title="Remove Link"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SITE IDENTITY & ANNOUNCEMENT */}
      {activeSubTab === 'identity' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-base font-black text-white">Brand Identity & Support Contacts</h3>
            <p className="text-xs text-slate-400">Configure portal title, official contact numbers, and student support.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-400 font-bold block mb-1">Site Title</label>
              <input
                type="text"
                value={draftSettings.siteName}
                onChange={e => setDraftSettings({ ...draftSettings, siteName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-bold"
              />
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">Tagline</label>
              <input
                type="text"
                value={draftSettings.tagline}
                onChange={e => setDraftSettings({ ...draftSettings, tagline: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-300"
              />
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">Support Email</label>
              <input
                type="email"
                value={draftSettings.contactEmail || ''}
                onChange={e => setDraftSettings({ ...draftSettings, contactEmail: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white"
              />
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">Support Phone / WhatsApp</label>
              <input
                type="text"
                value={draftSettings.contactPhone || ''}
                onChange={e => setDraftSettings({ ...draftSettings, contactPhone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
