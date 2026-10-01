import React, { useState, useEffect, useMemo } from 'react';
import {
  Sliders,
  Plus,
  RotateCcw,
  Eye,
  EyeOff,
  Edit3,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Check,
  CheckCircle2,
  Sparkles,
  Flame,
  Crown,
  Gift,
  Award,
  Zap,
  Trophy,
  ArrowRight,
  Search,
  ExternalLink,
  ShieldCheck,
  Tag,
  X,
  Layers,
  AlertCircle
} from 'lucide-react';
import { SliderBanner, SliderIconName, SliderActionType } from '../types';
import {
  getStoredSliderBanners,
  saveSliderBanners,
  togglePublishBanner,
  updateBanner,
  createBanner,
  deleteBanner,
  reorderBanners,
  resetBannersToDefault,
  syncSliderFromFirestore
} from '../utils/sliderStore';
import { getStoredBundles } from '../utils/bundleStore';

const ICON_OPTIONS: { name: SliderIconName; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { name: 'Gift', label: 'Gift (Referral/Free)', icon: Gift },
  { name: 'Flame', label: 'Flame (Hot/Trending)', icon: Flame },
  { name: 'Crown', label: 'Crown (Pass Pro/VIP)', icon: Crown },
  { name: 'Award', label: 'Award (Cadre/Exam)', icon: Award },
  { name: 'Zap', label: 'Zap (Speed/Daily)', icon: Zap },
  { name: 'Trophy', label: 'Trophy (Merit/Ranks)', icon: Trophy },
  { name: 'Sparkles', label: 'Sparkles (Special/AI)', icon: Sparkles },
  { name: 'Star', label: 'Star (Highlight)', icon: Sparkles },
];

const GRADIENT_PRESETS = [
  { id: 'amber', label: 'Amber Gold (Offers/Referral)', bgGradient: 'from-amber-950/40 via-slate-900 to-slate-950', borderAccent: 'border-amber-500/40 hover:border-amber-500/60', accentGlow: 'bg-amber-500/10' },
  { id: 'emerald', label: 'Emerald Green (Merit/Free)', bgGradient: 'from-emerald-950/40 via-slate-900 to-slate-950', borderAccent: 'border-emerald-500/40 hover:border-emerald-500/60', accentGlow: 'bg-emerald-500/10' },
  { id: 'indigo', label: 'Indigo Purple (Pass Pro)', bgGradient: 'from-indigo-950/50 via-slate-900 to-slate-950', borderAccent: 'border-indigo-500/40 hover:border-indigo-500/60', accentGlow: 'bg-indigo-500/10' },
  { id: 'rose', label: 'Rose Red (CGPSC/Crucial)', bgGradient: 'from-rose-950/30 via-slate-900 to-slate-950', borderAccent: 'border-rose-500/40 hover:border-rose-500/60', accentGlow: 'bg-rose-500/10' },
  { id: 'cyan', label: 'Cyan Blue (Vyapam/SI)', bgGradient: 'from-cyan-950/40 via-slate-900 to-slate-950', borderAccent: 'border-cyan-500/40 hover:border-cyan-500/60', accentGlow: 'bg-cyan-500/10' },
];

const COLOR_PRESETS = [
  { id: 'amber', label: 'Amber', categoryColor: 'text-amber-300 bg-amber-500/20 border-amber-500/40', badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { id: 'emerald', label: 'Emerald', categoryColor: 'text-emerald-300 bg-emerald-500/20 border-emerald-500/40', badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  { id: 'rose', label: 'Rose', categoryColor: 'text-rose-300 bg-rose-500/20 border-rose-500/40', badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
  { id: 'cyan', label: 'Cyan', categoryColor: 'text-cyan-300 bg-cyan-500/20 border-cyan-500/40', badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  { id: 'indigo', label: 'Indigo', categoryColor: 'text-indigo-300 bg-indigo-500/20 border-indigo-500/40', badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
];

const ACTION_TYPES: { type: SliderActionType; label: string; desc: string }[] = [
  { type: 'open_referral', label: 'Invite & Earn Referral Page', desc: 'Opens /invite-earn student referral program' },
  { type: 'explore_pass', label: 'Pass Pro Subscription', desc: 'Opens Pass Pro pricing and plan purchase' },
  { type: 'open_bundle', label: 'Specific Test Series Bundle', desc: 'Opens targeted bundle detail page (e.g. Teacher, CGPSC, SI)' },
  { type: 'start_test', label: 'Launch Mock Test Engine', desc: 'Starts free or flagship mock test directly' },
  { type: 'open_leaderboard', label: 'State Merit Leaderboard', desc: 'Opens state-wide ranking & percentile portal' },
  { type: 'custom_url', label: 'Custom / External Link', desc: 'Navigates to custom URL' },
];

export const AdminSliderStudio: React.FC = () => {
  const [banners, setBanners] = useState<SliderBanner[]>(() => getStoredSliderBanners());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'published' | 'drafts'>('all');
  const [editingBanner, setEditingBanner] = useState<SliderBanner | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(true);
  const [previewSlideIndex, setPreviewSlideIndex] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync with Firestore on mount
  useEffect(() => {
    syncSliderFromFirestore().then(list => {
      if (list && list.length > 0) setBanners(list);
    }).catch(() => null);

    const handleUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setBanners(e.detail);
      }
    };
    window.addEventListener('cgtest-slider-updated', handleUpdate);
    return () => window.removeEventListener('cgtest-slider-updated', handleUpdate);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Stats
  const stats = useMemo(() => {
    const total = banners.length;
    const published = banners.filter(b => b.isPublished !== false).length;
    const drafts = total - published;
    return { total, published, drafts };
  }, [banners]);

  // Filtered banners
  const filteredBanners = useMemo(() => {
    return banners.filter(b => {
      if (filterMode === 'published' && b.isPublished === false) return false;
      if (filterMode === 'drafts' && b.isPublished !== false) return false;
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        b.title.toLowerCase().includes(term) ||
        b.subtitle.toLowerCase().includes(term) ||
        b.category.toLowerCase().includes(term) ||
        (b.couponCode && b.couponCode.toLowerCase().includes(term))
      );
    });
  }, [banners, filterMode, searchTerm]);

  // Published banners for live preview
  const publishedBanners = useMemo(() => {
    return banners.filter(b => b.isPublished !== false);
  }, [banners]);

  // Toggle publish
  const handleTogglePublish = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = togglePublishBanner(id);
    setBanners(updated);
    const target = updated.find(b => b.id === id);
    showToast(target?.isPublished ? 'Slide Published! Visible to students.' : 'Slide Unpublished! Hidden from students.');
  };

  // Reorder
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= banners.length) return;
    const reordered = [...banners];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    const updated = reorderBanners(reordered.map(b => b.id));
    setBanners(updated);
    showToast('Slide order updated!');
  };

  // Duplicate
  const handleDuplicate = (banner: SliderBanner) => {
    const clone: Omit<SliderBanner, 'id' | 'createdAt' | 'updatedAt'> = {
      ...banner,
      title: `${banner.title} (Copy)`,
      isPublished: false,
      displayOrder: banners.length + 1,
    };
    const created = createBanner(clone);
    setBanners(getStoredSliderBanners());
    showToast('Slide duplicated as draft!');
  };

  // Delete
  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this slider banner?')) {
      const updated = deleteBanner(id);
      setBanners(updated);
      showToast('Slide deleted successfully!');
    }
  };

  // Factory reset
  const handleResetDefaults = () => {
    if (window.confirm('Reset all hero slider banners to factory defaults? Any custom slides will be replaced.')) {
      const defaults = resetBannersToDefault();
      setBanners(defaults);
      showToast('Restored default slider banners!');
    }
  };

  // Save Modal (Create or Edit)
  const handleSaveModal = (data: Partial<SliderBanner>) => {
    if (isCreating) {
      createBanner({
        category: data.category || 'PROMOTION',
        categoryIcon: data.categoryIcon || 'Sparkles',
        categoryColor: data.categoryColor || 'text-amber-300 bg-amber-500/20 border-amber-500/40',
        badge: data.badge || 'SPECIAL OFFER',
        badgeColor: data.badgeColor || 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        title: data.title || 'Special Exam Series Offer',
        subtitle: data.subtitle || 'Explore high-yield mock tests and study materials.',
        highlights: data.highlights || ['Authentic CBT Exam Interface', 'State-Wide Percentile Analytics'],
        couponCode: data.couponCode || '',
        primaryActionLabel: data.primaryActionLabel || 'Explore Offer',
        primaryActionType: data.primaryActionType || 'explore_pass',
        primaryActionTarget: data.primaryActionTarget || '',
        secondaryActionLabel: data.secondaryActionLabel || '',
        secondaryActionType: data.secondaryActionType || 'explore_pass',
        secondaryActionTarget: data.secondaryActionTarget || '',
        bgGradient: data.bgGradient || 'from-amber-950/40 via-slate-900 to-slate-950',
        borderAccent: data.borderAccent || 'border-amber-500/40 hover:border-amber-500/60',
        accentGlow: data.accentGlow || 'bg-amber-500/10',
        isPublished: data.isPublished !== false,
        displayOrder: banners.length + 1,
      });
      setIsCreating(false);
      showToast('New slide banner created successfully!');
    } else if (editingBanner) {
      updateBanner(editingBanner.id, data);
      setEditingBanner(null);
      showToast('Slide banner updated!');
    }
    setBanners(getStoredSliderBanners());
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-slate-950 px-4 py-2.5 rounded-2xl font-black text-xs shadow-2xl flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 fill-slate-950 text-emerald-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/30 rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Sliders className="w-6 h-6" />
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
              Live SDUI Controller
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Hero Slider & Promo Banners Studio
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Manage top promotional cards, flash sale banners, and special offers on the candidate dashboard.
            Edit bilingual copy, reorder carousel slides, and publish or unpublish campaigns in real time.
          </p>
        </div>

        {/* Quick Actions & Metrics */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-2.5 flex items-center space-x-4 text-center">
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Total</span>
              <span className="text-sm font-black text-white">{stats.total}</span>
            </div>
            <div className="border-l border-slate-800 pl-4">
              <span className="text-[10px] font-bold text-emerald-400 block uppercase">Published</span>
              <span className="text-sm font-black text-emerald-300">{stats.published}</span>
            </div>
            <div className="border-l border-slate-800 pl-4">
              <span className="text-[10px] font-bold text-amber-400 block uppercase">Drafts</span>
              <span className="text-sm font-black text-amber-300">{stats.drafts}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition flex items-center space-x-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Slide Banner</span>
          </button>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-xs border border-slate-750 transition flex items-center space-x-1.5 cursor-pointer"
            title="Reset to 7 standard default banners"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* Live Interactive Student Preview Carousel */}
      {showLivePreview && publishedBanners.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                Live Student Preview (Showing {publishedBanners.length} Active Slides)
              </h3>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setShowLivePreview(false)}
                className="text-[11px] text-slate-400 hover:text-white font-bold cursor-pointer"
              >
                Hide Preview
              </button>
            </div>
          </div>

          {/* Render Preview Card */}
          {(() => {
            const current = publishedBanners[previewSlideIndex % publishedBanners.length] || publishedBanners[0];
            const IconComponent = (current.categoryIcon && ICON_OPTIONS.find(o => o.name === current.categoryIcon)?.icon) || Sparkles;
            return (
              <div className="relative rounded-2xl overflow-hidden border border-slate-750 p-5 sm:p-6 transition-all duration-300">
                <div className={`absolute inset-0 bg-gradient-to-r ${current.bgGradient || 'from-slate-900 to-slate-950'} opacity-90`} />
                <div className={`absolute -right-16 -top-16 w-64 h-64 rounded-full blur-3xl opacity-30 pointer-events-none ${current.accentGlow || 'bg-amber-500/10'}`} />

                <div className="relative z-10 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center space-x-2 flex-wrap gap-1.5">
                      <span className={`inline-flex items-center space-x-1.5 text-[10px] font-bold px-2 py-0.5 rounded-lg border ${current.categoryColor}`}>
                        <IconComponent className="w-3 h-3" />
                        <span>{current.category}</span>
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border ${current.badgeColor}`}>
                        {current.badge}
                      </span>
                      {current.couponCode && (
                        <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-lg">
                          CODE: {current.couponCode}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => setPreviewSlideIndex(prev => (prev - 1 + publishedBanners.length) % publishedBanners.length)}
                        className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                      >
                        <ChevronUp className="w-3.5 h-3.5 -rotate-90" />
                      </button>
                      <span className="text-[10px] font-mono text-slate-400 font-bold px-1">
                        {(previewSlideIndex % publishedBanners.length) + 1}/{publishedBanners.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPreviewSlideIndex(prev => (prev + 1) % publishedBanners.length)}
                        className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                      >
                        <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white">{current.title}</h3>
                    <p className="text-xs text-slate-300 mt-0.5">{current.subtitle}</p>
                  </div>

                  <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-400">
                    {current.highlights?.map((h, i) => (
                      <span key={i} className="flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>{h}</span>
                      </span>
                    ))}
                  </div>

                  <div className="pt-2 flex items-center space-x-2">
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs flex items-center space-x-1">
                      <span>{current.primaryActionLabel}</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                    {current.secondaryActionLabel && (
                      <span className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs border border-slate-700">
                        {current.secondaryActionLabel}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterMode === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            All Slides ({banners.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('published')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterMode === 'published'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            Published ({stats.published})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('drafts')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterMode === 'drafts'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            Drafts / Hidden ({stats.drafts})
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search slides by title, badge, coupon..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>
      </div>

      {/* Banner Cards Management List */}
      <div className="space-y-3">
        {filteredBanners.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
            <h4 className="text-sm font-bold text-white">No slide banners found</h4>
            <p className="text-xs text-slate-400">Try changing your search term or click "New Slide Banner" above.</p>
          </div>
        ) : (
          filteredBanners.map((banner, index) => {
            const IconComp = (banner.categoryIcon && ICON_OPTIONS.find(o => o.name === banner.categoryIcon)?.icon) || Sparkles;
            const isFirst = index === 0;
            const isLast = index === banners.length - 1;

            return (
              <div
                key={banner.id}
                className={`bg-slate-900/80 rounded-2xl border transition-all duration-200 p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                  banner.isPublished !== false
                    ? 'border-slate-800 hover:border-slate-700'
                    : 'border-slate-800/60 opacity-75 bg-slate-950/40'
                }`}
              >
                {/* Left: Reorder Controls + Order Number */}
                <div className="flex items-center space-x-3 shrink-0">
                  <div className="flex flex-col space-y-1">
                    <button
                      type="button"
                      disabled={isFirst}
                      onClick={() => handleMove(index, 'up')}
                      className={`p-1 rounded-md bg-slate-800 text-slate-300 transition ${
                        isFirst ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-700 hover:text-white cursor-pointer'
                      }`}
                      title="Move slide up in order"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={isLast}
                      onClick={() => handleMove(index, 'down')}
                      className={`p-1 rounded-md bg-slate-800 text-slate-300 transition ${
                        isLast ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-700 hover:text-white cursor-pointer'
                      }`}
                      title="Move slide down in order"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className="w-7 h-7 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono font-black text-amber-300 flex items-center justify-center shrink-0">
                    #{index + 1}
                  </span>
                </div>

                {/* Middle: Banner Details */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className={`inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-lg border ${banner.categoryColor}`}>
                      <IconComp className="w-3 h-3" />
                      <span>{banner.category}</span>
                    </span>

                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border ${banner.badgeColor}`}>
                      {banner.badge}
                    </span>

                    {banner.couponCode && (
                      <span className="inline-flex items-center space-x-1 text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-lg">
                        <Tag className="w-2.5 h-2.5" />
                        <span>{banner.couponCode}</span>
                      </span>
                    )}

                    <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                      Action: {banner.primaryActionType} {banner.primaryActionTarget ? `(${banner.primaryActionTarget})` : ''}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-white truncate">
                    {banner.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-1">
                    {banner.subtitle}
                  </p>
                </div>

                {/* Right: Publish / Unpublish Switch & Actions */}
                <div className="flex items-center space-x-2.5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                  {/* Publish / Unpublish Switch */}
                  <button
                    type="button"
                    onClick={e => handleTogglePublish(banner.id, e)}
                    className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer border ${
                      banner.isPublished !== false
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                    }`}
                    title={banner.isPublished !== false ? 'Click to unpublish (hide from students)' : 'Click to publish (show to students)'}
                  >
                    {banner.isPublished !== false ? (
                      <>
                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Published</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                        <span>Unpublished (Draft)</span>
                      </>
                    )}
                  </button>

                  {/* Edit */}
                  <button
                    type="button"
                    onClick={() => setEditingBanner(banner)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition cursor-pointer"
                    title="Edit slide banner"
                  >
                    <Edit3 className="w-4 h-4 text-cyan-400" />
                  </button>

                  {/* Duplicate */}
                  <button
                    type="button"
                    onClick={() => handleDuplicate(banner)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition cursor-pointer"
                    title="Duplicate slide"
                  >
                    <Copy className="w-4 h-4 text-indigo-400" />
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => handleDelete(banner.id)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                    title="Delete slide"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Slide Editor / Creator Modal */}
      {(isCreating || editingBanner) && (
        <SlideEditorModal
          initialData={editingBanner || undefined}
          isCreating={isCreating}
          onClose={() => {
            setIsCreating(false);
            setEditingBanner(null);
          }}
          onSave={handleSaveModal}
        />
      )}
    </div>
  );
};

// =========================================================================
// SLIDE CREATOR & EDITOR MODAL
// =========================================================================

interface SlideEditorModalProps {
  initialData?: SliderBanner;
  isCreating: boolean;
  onClose: () => void;
  onSave: (data: Partial<SliderBanner>) => void;
}

const SlideEditorModal: React.FC<SlideEditorModalProps> = ({
  initialData,
  isCreating,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [subtitle, setSubtitle] = useState(initialData?.subtitle || '');
  const [category, setCategory] = useState(initialData?.category || 'HOT TEST SERIES');
  const [categoryIcon, setCategoryIcon] = useState<SliderIconName>(initialData?.categoryIcon || 'Flame');
  const [badge, setBadge] = useState(initialData?.badge || 'SPECIAL OFFER');
  const [couponCode, setCouponCode] = useState(initialData?.couponCode || '');
  const [primaryActionLabel, setPrimaryActionLabel] = useState(initialData?.primaryActionLabel || 'Explore Offer');
  const [primaryActionType, setPrimaryActionType] = useState<SliderActionType>(initialData?.primaryActionType || 'open_bundle');
  const [primaryActionTarget, setPrimaryActionTarget] = useState(initialData?.primaryActionTarget || '');
  const [secondaryActionLabel, setSecondaryActionLabel] = useState(initialData?.secondaryActionLabel || '');
  const [secondaryActionType, setSecondaryActionType] = useState<SliderActionType>(initialData?.secondaryActionType || 'start_test');
  const [secondaryActionTarget, setSecondaryActionTarget] = useState(initialData?.secondaryActionTarget || '');
  const [highlights, setHighlights] = useState<string[]>(initialData?.highlights || ['Authentic CBT Exam Interface', 'State-Wide Percentile Analytics']);
  const [newHighlight, setNewHighlight] = useState('');
  const [isPublished, setIsPublished] = useState(initialData ? initialData.isPublished !== false : true);
  const [selectedGradient, setSelectedGradient] = useState(initialData?.bgGradient || GRADIENT_PRESETS[0].bgGradient);
  const [selectedColor, setSelectedColor] = useState('amber');

  const handleAddHighlight = () => {
    if (newHighlight.trim()) {
      setHighlights(prev => [...prev, newHighlight.trim()]);
      setNewHighlight('');
    }
  };

  const handleRemoveHighlight = (idx: number) => {
    setHighlights(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please provide a slide title.');
      return;
    }

    const preset = GRADIENT_PRESETS.find(g => g.bgGradient === selectedGradient) || GRADIENT_PRESETS[0];
    const colorPreset = COLOR_PRESETS.find(c => c.id === selectedColor) || COLOR_PRESETS[0];

    onSave({
      title: title.trim(),
      subtitle: subtitle.trim(),
      category: category.trim(),
      categoryIcon,
      categoryColor: colorPreset.categoryColor,
      badge: badge.trim(),
      badgeColor: colorPreset.badgeColor,
      couponCode: couponCode.trim() || undefined,
      primaryActionLabel: primaryActionLabel.trim(),
      primaryActionType,
      primaryActionTarget: primaryActionTarget.trim() || undefined,
      secondaryActionLabel: secondaryActionLabel.trim() || undefined,
      secondaryActionType,
      secondaryActionTarget: secondaryActionTarget.trim() || undefined,
      highlights,
      bgGradient: preset.bgGradient,
      borderAccent: preset.borderAccent,
      accentGlow: preset.accentGlow,
      isPublished,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-6">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Sliders className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-black text-white">
                {isCreating ? 'Create New Hero Slide Banner' : 'Edit Hero Slide Banner'}
              </h3>
              <p className="text-xs text-slate-400">Configure content, call-to-actions, and live status.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* Status Toggle Switch */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">Publication Status</span>
              <span className="text-[11px] text-slate-400">
                {isPublished ? 'Live & Published · Visible to all students on the dashboard.' : 'Unpublished Draft · Hidden from candidate view.'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsPublished(!isPublished)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center space-x-1.5 border ${
                isPublished
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}
            >
              {isPublished ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Published (Active)</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                  <span>Draft (Hidden)</span>
                </>
              )}
            </button>
          </div>

          {/* Title and Subtitle */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Slide Headline / Title (Hindi or English) *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. CG शिक्षक भर्ती 2026 महा-अभ्यास श्रृंखला"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Slide Subtitle / Body Copy *
              </label>
              <textarea
                rows={2}
                required
                value={subtitle}
                onChange={e => setSubtitle(e.target.value)}
                placeholder="e.g. सहायक शिक्षक, शिक्षक एवं व्याख्याता के लिए 15 Full Mocks + 20 विषयवार टेस्ट।"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>

          {/* Category, Badge, and Icon */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Category Tag</label>
              <input
                type="text"
                value={category}
                onChange={e => setCategory(e.target.value)}
                placeholder="e.g. HOT TEST SERIES"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Category Icon</label>
              <select
                value={categoryIcon}
                onChange={e => setCategoryIcon(e.target.value as SliderIconName)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white cursor-pointer"
              >
                {ICON_OPTIONS.map(opt => (
                  <option key={opt.name} value={opt.name}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Badge Text</label>
              <input
                type="text"
                value={badge}
                onChange={e => setBadge(e.target.value)}
                placeholder="e.g. 5,000+ Posts Announced"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>
          </div>

          {/* Color & Theme Presets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Accent Theme Color</label>
              <div className="flex items-center space-x-2">
                {COLOR_PRESETS.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedColor(c.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
                      selectedColor === c.id
                        ? 'border-white text-white bg-slate-800'
                        : 'border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Background Ambient Glow</label>
              <select
                value={selectedGradient}
                onChange={e => setSelectedGradient(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white cursor-pointer"
              >
                {GRADIENT_PRESETS.map(g => (
                  <option key={g.id} value={g.bgGradient}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Call-To-Actions (Primary & Secondary) */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider">
              Call To Action Buttons Routing
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Primary Button Label *</label>
                <input
                  type="text"
                  required
                  value={primaryActionLabel}
                  onChange={e => setPrimaryActionLabel(e.target.value)}
                  placeholder="e.g. Open Teacher Bundle"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Primary Action Type</label>
                <select
                  value={primaryActionType}
                  onChange={e => setPrimaryActionType(e.target.value as SliderActionType)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white cursor-pointer"
                >
                  {ACTION_TYPES.map(a => (
                    <option key={a.type} value={a.type}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Target Bundle/ID/URL</label>
                {primaryActionType === 'open_bundle' ? (
                  <select
                    value={primaryActionTarget}
                    onChange={e => setPrimaryActionTarget(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white cursor-pointer"
                  >
                    <option value="">Default (First Bundle)</option>
                    {getStoredBundles().map((b: any) => (
                      <option key={b.id} value={b.slug || b.id}>
                        {b.title} ({b.targetPost || b.authority})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={primaryActionTarget}
                    onChange={e => setPrimaryActionTarget(e.target.value)}
                    placeholder="e.g. assistant-teacher-2026 or URL"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Secondary Button Label (Optional)</label>
                <input
                  type="text"
                  value={secondaryActionLabel}
                  onChange={e => setSecondaryActionLabel(e.target.value)}
                  placeholder="e.g. Try Free Mock"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Secondary Action Type</label>
                <select
                  value={secondaryActionType}
                  onChange={e => setSecondaryActionType(e.target.value as SliderActionType)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white cursor-pointer"
                >
                  {ACTION_TYPES.map(a => (
                    <option key={a.type} value={a.type}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Highlights & Promo Coupon */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">Highlight Points (Bullet Features)</label>
              <div className="flex items-center space-x-1.5">
                <input
                  type="text"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Promo Coupon Code (e.g. CGPASS50)"
                  className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-amber-300 placeholder-slate-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newHighlight}
                onChange={e => setNewHighlight(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddHighlight();
                  }
                }}
                placeholder="Add bullet highlight (e.g. 150 Qs · Authentic -¼ Negative Evaluation)"
                className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddHighlight}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {highlights.map((h, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>{h}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveHighlight(idx)}
                    className="text-slate-500 hover:text-rose-400 ml-1 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition flex items-center space-x-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isCreating ? 'Create Slide' : 'Save Changes'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
