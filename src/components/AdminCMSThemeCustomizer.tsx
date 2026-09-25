import React, { useState } from 'react';
import { CMSSiteSettings, NavMenuItem } from '../types/cms';
import {
  Palette,
  Save,
  CheckCircle2,
  Menu,
  Plus,
  Trash2,
  Globe,
  Sliders,
  Phone,
  Mail,
  Megaphone,
  Layers
} from 'lucide-react';

interface AdminCMSThemeCustomizerProps {
  settings: CMSSiteSettings;
  onSaveSettings: (settings: CMSSiteSettings) => Promise<void>;
}

export const AdminCMSThemeCustomizer: React.FC<AdminCMSThemeCustomizerProps> = ({
  settings,
  onSaveSettings,
}) => {
  const [draftSettings, setDraftSettings] = useState<CMSSiteSettings>(
    JSON.parse(JSON.stringify(settings))
  );
  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  React.useEffect(() => {
    setDraftSettings(JSON.parse(JSON.stringify(settings)));
  }, [settings]);

  const showNotification = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleAddNavItem = () => {
    const newNav: NavMenuItem = {
      id: `nav-${Date.now()}`,
      label: 'New Nav Link',
      url: '/test-series',
    };
    setDraftSettings({
      ...draftSettings,
      navMenu: [...draftSettings.navMenu, newNav],
    });
  };

  const handleUpdateNavItem = (index: number, updated: NavMenuItem) => {
    const navMenu = [...draftSettings.navMenu];
    navMenu[index] = updated;
    setDraftSettings({ ...draftSettings, navMenu });
  };

  const handleDeleteNavItem = (index: number) => {
    const navMenu = draftSettings.navMenu.filter((_, i) => i !== index);
    setDraftSettings({ ...draftSettings, navMenu });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveSettings(draftSettings);
      showNotification('Site customization settings saved!');
    } catch (err: any) {
      alert('Failed to save settings: ' + err.message);
    } finally {
      setIsSaving(false);
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
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30 mb-2">
            <Palette className="w-3.5 h-3.5" />
            <span>WordPress-Style Site Customizer & Theme Options</span>
          </div>
          <h1 className="text-2xl font-black text-white">Website Branding & Navigation Customizer</h1>
          <p className="text-xs text-slate-400 mt-1">
            Customize header menus, primary theme colors, announcement banners, and footer credits.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center space-x-2 transition shadow-lg shadow-purple-600/30 cursor-pointer disabled:opacity-50 shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving...' : 'Save Theme Customizations'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Identity & Colors */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center space-x-2 pb-3 border-b border-slate-800">
            <Sliders className="w-4 h-4 text-purple-400" />
            <span>Site Identity & Theme Colors</span>
          </h2>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Site Title</label>
              <input
                type="text"
                value={draftSettings.siteName}
                onChange={e => setDraftSettings({ ...draftSettings, siteName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Tagline</label>
              <input
                type="text"
                value={draftSettings.tagline}
                onChange={e => setDraftSettings({ ...draftSettings, tagline: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Primary Color Palette Accent</label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
                {(['indigo', 'emerald', 'amber', 'rose', 'violet', 'cyan'] as const).map(color => {
                  const isSelected = draftSettings.primaryColor === color;
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setDraftSettings({ ...draftSettings, primaryColor: color })}
                      className={`p-2 rounded-xl border text-[11px] font-bold capitalize transition cursor-pointer flex flex-col items-center gap-1 ${
                        isSelected
                          ? 'border-purple-400 bg-purple-500/20 text-white'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full bg-${color}-500 inline-block`} />
                      <span>{color}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Support Phone / WhatsApp</label>
                <input
                  type="text"
                  value={draftSettings.contactPhone || ''}
                  onChange={e => setDraftSettings({ ...draftSettings, contactPhone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Support Email</label>
                <input
                  type="text"
                  value={draftSettings.contactEmail || ''}
                  onChange={e => setDraftSettings({ ...draftSettings, contactEmail: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Top Announcement Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center space-x-2 pb-3 border-b border-slate-800">
            <Megaphone className="w-4 h-4 text-amber-400" />
            <span>Top Announcement Bar</span>
          </h2>

          <div className="space-y-4 text-xs">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="ann-enabled"
                checked={draftSettings.announcementBar.enabled}
                onChange={e => setDraftSettings({
                  ...draftSettings,
                  announcementBar: { ...draftSettings.announcementBar, enabled: e.target.checked }
                })}
                className="rounded border-slate-700 text-purple-600 focus:ring-0"
              />
              <label htmlFor="ann-enabled" className="text-white font-bold cursor-pointer">
                Enable Top Announcement Banner
              </label>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Banner Text Message</label>
              <textarea
                rows={2}
                value={draftSettings.announcementBar.message}
                onChange={e => setDraftSettings({
                  ...draftSettings,
                  announcementBar: { ...draftSettings.announcementBar, message: e.target.value }
                })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">CTA Button Label</label>
                <input
                  type="text"
                  value={draftSettings.announcementBar.buttonText || ''}
                  onChange={e => setDraftSettings({
                    ...draftSettings,
                    announcementBar: { ...draftSettings.announcementBar, buttonText: e.target.value }
                  })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">CTA Button Link</label>
                <input
                  type="text"
                  value={draftSettings.announcementBar.buttonLink || ''}
                  onChange={e => setDraftSettings({
                    ...draftSettings,
                    announcementBar: { ...draftSettings.announcementBar, buttonLink: e.target.value }
                  })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Header Navigation Menu Editor */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Menu className="w-4 h-4 text-emerald-400" />
              <span>Header Navigation Menu Editor ({draftSettings.navMenu.length} Links)</span>
            </h2>

            <button
              onClick={handleAddNavItem}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs flex items-center space-x-1.5 border border-slate-700 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Nav Item</span>
            </button>
          </div>

          <div className="space-y-2">
            {draftSettings.navMenu.map((item, idx) => (
              <div
                key={item.id}
                className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center space-x-2 grow">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={item.label}
                    onChange={e => handleUpdateNavItem(idx, { ...item, label: e.target.value })}
                    placeholder="Link Label"
                    className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-bold grow focus:border-purple-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={item.url}
                    onChange={e => handleUpdateNavItem(idx, { ...item, url: e.target.value })}
                    placeholder="Target URL (e.g. /p/about)"
                    className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 font-mono grow focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <button
                  onClick={() => handleDeleteNavItem(idx)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
