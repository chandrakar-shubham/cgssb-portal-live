import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  LayoutDashboard,
  Layers,
  FolderTree,
  FileText,
  Sparkles,
  Crown,
  Palette,
  Globe,
  Database,
  Smartphone,
  Sliders,
  Search,
  Plus,
  Command,
  ExternalLink,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Wrench,
  CheckCircle2,
  Bell,
  RefreshCw,
  Users,
  UserCheck
} from 'lucide-react';
import { AdminCommandPalette } from './AdminCommandPalette';
import { APP_BUILD_INFO } from '../utils/buildInfo';

interface AdminWorkspaceLayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onNavigateToStudent: () => void;
  onOpenToolsModal?: () => void;
  onOpenUniversalIngest?: () => void;
  onQuickCreateQuestion?: () => void;
  onQuickCreateTest?: () => void;
  children: React.ReactNode;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  highlight?: boolean;
}

interface NavDomain {
  domainId: string;
  domainTitle: string;
  items: NavItem[];
}

export const AdminWorkspaceLayout: React.FC<AdminWorkspaceLayoutProps> = ({
  activeTab,
  setActiveTab,
  onNavigateToStudent,
  onOpenToolsModal,
  onOpenUniversalIngest,
  onQuickCreateQuestion,
  onQuickCreateTest,
  children,
}) => {
  const { adminUser, adminLogout } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const quickCreateRef = React.useRef<HTMLDivElement>(null);

  // Global Keyboard Shortcuts (Ctrl+K or Cmd+K for Command Palette)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Close Quick Create dropdown on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (quickCreateRef.current && !quickCreateRef.current.contains(e.target as Node)) {
        setIsQuickCreateOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Core Functional Domains
  const navigationDomains: NavDomain[] = [
    {
      domainId: 'exams',
      domainTitle: 'Examination Studio',
      items: [
        { id: 'admin-tests', label: 'Mock Test Catalog', icon: Layers, badge: 'CBT' },
        { id: 'admin-questions', label: 'Question Bank', icon: FolderTree, badge: '1,200+' },
        { id: 'admin-pyp', label: 'PYP Solved Archives', icon: FileText },
        { id: 'admin-chapters', label: 'Chapter Tests', icon: FolderTree },
        { id: 'admin-practice', label: 'Daily Practice Drills', icon: Sparkles },
        { id: 'admin-ca-studio', label: 'Current Affairs Studio', icon: Sparkles, badge: 'AI' },
        { id: 'admin-ai', label: 'AI Test Generator', icon: Sparkles },
      ],
    },
    {
      domainId: 'students',
      domainTitle: 'Students & Marketing',
      items: [
        { id: 'admin-students', label: 'Student Profile CRM', icon: Users, badge: 'Growth' },
        { id: 'admin-marketing', label: 'WhatsApp & Campaigns', icon: Sparkles },
      ],
    },
    {
      domainId: 'cms',
      domainTitle: 'Content & Portal CMS',
      items: [
        { id: 'admin-slider', label: 'Hero Slider & Banners', icon: Sliders, badge: 'Offers' },
        { id: 'admin-cms-pages', label: 'Dynamic Page Builder', icon: Globe, highlight: true },
        { id: 'admin-cms-posts', label: 'News, Alerts & Articles', icon: FileText },
        { id: 'admin-cms-series', label: 'Test Series Bundles', icon: Crown },
        { id: 'admin-overview', label: 'CMS Overview & Analytics', icon: LayoutDashboard },
      ],
    },
    {
      domainId: 'brand',
      domainTitle: 'Brand & Monetization',
      items: [
        { id: 'admin-cms-customizer', label: 'Theme Tokens & Google Ads', icon: Palette, badge: 'Ads' },
      ],
    },
    {
      domainId: 'system',
      domainTitle: 'System & Security (RBAC)',
      items: [
        { id: 'admin-roles', label: 'Admin Roles & Team', icon: UserCheck, badge: 'RBAC' },
        { id: 'admin-remote-config', label: 'Remote Config (SDUI)', icon: Sliders, badge: 'Live' },
        { id: 'admin-database', label: 'Firestore Collections', icon: Database },
        { id: 'admin-android-api', label: 'Android Mobile REST API', icon: Smartphone },
      ],
    },
  ];

  // Lookup active item details for breadcrumbs
  const activeItem = navigationDomains
    .flatMap(d => d.items)
    .find(i => i.id === activeTab) || navigationDomains[0].items[0];

  const activeDomain = navigationDomains.find(d =>
    d.items.some(i => i.id === activeTab)
  ) || navigationDomains[0];

  const handleQuickCreate = (type: 'test' | 'question' | 'page' | 'post' | 'alert') => {
    setIsQuickCreateOpen(false);
    if (type === 'question') {
      if (onQuickCreateQuestion) onQuickCreateQuestion();
      else setActiveTab('admin-questions');
    } else if (type === 'test') {
      if (onQuickCreateTest) onQuickCreateTest();
      else setActiveTab('admin-tests');
    } else if (type === 'page') {
      setActiveTab('admin-cms-pages');
    } else if (type === 'post') {
      setActiveTab('admin-cms-posts');
    } else if (type === 'alert') {
      setActiveTab('admin-remote-config');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* UNIVERSAL COMMAND PALETTE MODAL */}
      <AdminCommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigateTab={tab => setActiveTab(tab)}
        onQuickCreate={handleQuickCreate}
        onNavigateToStudent={onNavigateToStudent}
      />

      {/* 1. UNIVERSAL TOP APP BAR (56px) */}
      <header className="sticky top-0 z-40 h-14 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-4 sm:px-6 shadow-md">
        {/* Left: Brand Identity + Sidebar Toggle */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="md:hidden p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            {isMobileSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-600/30 font-black">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-black text-sm text-white tracking-tight">
                CGSSB <span className="text-indigo-400">Admin OS</span>
              </span>
              <span className="hidden sm:inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Firestore Online</span>
              </span>
            </div>
          </div>
        </div>

        {/* Center: Global Search & Command Palette Trigger */}
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-xs text-slate-400 transition cursor-pointer shadow-inner"
          >
            <div className="flex items-center space-x-2 truncate">
              <Search className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="truncate">Search exams, questions, pages, themes...</span>
            </div>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 shrink-0">
              Ctrl + K
            </span>
          </button>
        </div>

        {/* Right: Universal Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Quick Create Dropdown */}
          <div className="relative" ref={quickCreateRef}>
            <button
              onClick={() => setIsQuickCreateOpen(!isQuickCreateOpen)}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center space-x-1.5 shadow-md shadow-indigo-600/30 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">+ Create</span>
            </button>

            {isQuickCreateOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 text-xs space-y-1">
                <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Universal Quick Actions
                </div>
                <button
                  onClick={() => handleQuickCreate('question')}
                  className="w-full px-2.5 py-2 rounded-xl text-left hover:bg-slate-800 flex items-center space-x-2 text-slate-200 hover:text-white cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-indigo-400" />
                  <span>New MCQ / Question</span>
                </button>
                <button
                  onClick={() => handleQuickCreate('test')}
                  className="w-full px-2.5 py-2 rounded-xl text-left hover:bg-slate-800 flex items-center space-x-2 text-slate-200 hover:text-white cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>New CBT Mock Test</span>
                </button>
                <button
                  onClick={() => handleQuickCreate('page')}
                  className="w-full px-2.5 py-2 rounded-xl text-left hover:bg-slate-800 flex items-center space-x-2 text-slate-200 hover:text-white cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5 text-purple-400" />
                  <span>New Dynamic Page (Block)</span>
                </button>
                <button
                  onClick={() => handleQuickCreate('post')}
                  className="w-full px-2.5 py-2 rounded-xl text-left hover:bg-slate-800 flex items-center space-x-2 text-slate-200 hover:text-white cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <span>New Exam Alert Article</span>
                </button>
                <button
                  onClick={() => handleQuickCreate('alert')}
                  className="w-full px-2.5 py-2 rounded-xl text-left hover:bg-slate-800 flex items-center space-x-2 text-slate-200 hover:text-white cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  <span>Publish Emergency Banner</span>
                </button>
              </div>
            )}
          </div>

          {/* Universal Control & Ingest Button */}
          {onOpenUniversalIngest && (
            <button
              onClick={onOpenUniversalIngest}
              title="Universal Control & Ingestion Studio"
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-black text-xs flex items-center space-x-1.5 shadow-md shadow-emerald-500/20 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
              <span className="hidden sm:inline">Universal Control</span>
            </button>
          )}

          {/* Universal Ingest / Tools Modal */}
          {onOpenToolsModal && (
            <button
              onClick={onOpenToolsModal}
              title="System Tools & Backups"
              className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <Wrench className="w-4 h-4 text-slate-400" />
            </button>
          )}

          {/* Live Student Portal Switch */}
          <button
            onClick={onNavigateToStudent}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
          >
            <span className="hidden sm:inline">Student View</span>
            <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
          </button>

          {/* Admin Logout */}
          <button
            onClick={adminLogout}
            title="Sign out of Admin Session"
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-800 text-slate-400 hover:text-rose-400 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. BODY WORKSPACE: LEFT-RAIL SIDEBAR + MAIN CONTENT AREA */}
      <div className="flex-1 flex overflow-hidden">
        {/* DESKTOP COLLAPSIBLE SIDEBAR */}
        <aside
          className={`hidden md:flex flex-col border-r border-slate-800/80 bg-slate-950 transition-all duration-300 shrink-0 ${
            isSidebarCollapsed ? 'w-16' : 'w-64'
          }`}
        >
          {/* Collapse Toggle Button */}
          <div className="p-3 border-b border-slate-800/60 flex items-center justify-between">
            {!isSidebarCollapsed && (
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 px-2">
                Navigation Domains
              </span>
            )}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer mx-auto"
              title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Domain Links Stack */}
          <div className="flex-1 overflow-y-auto p-2 space-y-6">
            {navigationDomains.map(domain => (
              <div key={domain.domainId} className="space-y-1">
                {!isSidebarCollapsed && (
                  <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    {domain.domainTitle}
                  </div>
                )}
                {domain.items.map(item => {
                  const isActive = activeTab === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      title={isSidebarCollapsed ? item.label : undefined}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                      </div>

                      {!isSidebarCollapsed && item.badge && (
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                            isActive
                              ? 'bg-indigo-700 text-white border-indigo-500'
                              : 'bg-slate-900 text-slate-400 border-slate-800'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Sidebar Footer Info */}
          {!isSidebarCollapsed && (
            <div className="p-3 border-t border-slate-800/80 text-[10px] text-slate-500 font-mono flex items-center justify-between">
              <span>Build: {APP_BUILD_INFO.buildNumber}</span>
              <span className="text-emerald-400 font-bold">● Active</span>
            </div>
          )}
        </aside>

        {/* MOBILE SLIDE-OUT DRAWER */}
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            <div className="relative w-72 max-w-[80vw] bg-slate-950 border-r border-slate-800 h-full flex flex-col p-4 z-10 space-y-6 overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="font-black text-sm text-white">Admin Navigation</span>
                <button
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-1 rounded-lg bg-slate-900 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {navigationDomains.map(domain => (
                <div key={domain.domainId} className="space-y-1">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 px-2">
                    {domain.domainTitle}
                  </div>
                  {domain.items.map(item => {
                    const isActive = activeTab === item.id;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsMobileSidebarOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition ${
                          isActive
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'text-slate-400 hover:text-white hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. MAIN WORKSPACE CONTAINER */}
        <main className="flex-1 overflow-y-auto flex flex-col min-w-0 bg-slate-950">
          {/* Breadcrumb Header Bar */}
          <div className="px-4 sm:px-6 lg:px-8 py-3 border-b border-slate-800/80 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2 text-slate-400 font-medium">
              <span>Admin OS</span>
              <span>/</span>
              <span className="text-slate-500">{activeDomain.domainTitle}</span>
              <span>/</span>
              <span className="text-white font-bold">{activeItem.label}</span>
            </div>

            <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-mono">
              <span>Domain: {activeDomain.domainId}</span>
              <span>•</span>
              <span>State: Dual-Write Active</span>
            </div>
          </div>

          {/* Active Tool View Canvas */}
          <div className="flex-1 w-full max-w-full overflow-x-hidden p-2 sm:p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
