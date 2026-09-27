import React, { useState } from 'react';
import {
  LayoutDashboard,
  Globe,
  FileText,
  Crown,
  Palette,
  Layers,
  FolderTree,
  Sparkles,
  Database,
  Smartphone,
  ChevronRight,
  Home,
  ExternalLink,
  Search,
  Command,
  ArrowLeft
} from 'lucide-react';

interface AdminSubNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onNavigateToStudent: () => void;
  onOpenToolsModal?: () => void;
}

export const AdminSubNav: React.FC<AdminSubNavProps> = ({
  activeTab,
  setActiveTab,
  onNavigateToStudent,
  onOpenToolsModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuContainerRef = React.useRef<HTMLDivElement>(null);

  // Grouped Navigation Structure
  const navGroups = [
    {
      groupId: 'content',
      groupName: 'Exams & Content',
      icon: Layers,
      items: [
        { id: 'admin-tests', label: 'Mock Test Catalog', icon: Layers, desc: 'Manage full-length timed exams' },
        { id: 'admin-pyp', label: 'PYP Manager', icon: FileText, desc: 'Previous year question papers' },
        { id: 'admin-chapters', label: 'Chapter Tests', icon: FolderTree, desc: 'Subject & topic-wise quizzes' },
        { id: 'admin-practice', label: 'Practice Drills', icon: Sparkles, desc: 'Instant-explanation daily MCQs' },
        { id: 'admin-questions', label: 'Question Bank', icon: FolderTree, desc: 'Central question repository' },
        { id: 'admin-ca-studio', label: 'Current Affairs Studio', icon: Sparkles, badge: 'New', desc: 'Sources, topics & CA Q-Bank' },
        { id: 'admin-ai', label: 'AI Test Creator', icon: Sparkles, desc: 'Generate tests with Gemini AI' },
      ],
    },
    {
      groupId: 'cms',
      groupName: 'CMS & Customizer',
      icon: Globe,
      items: [
        { id: 'admin-overview', label: 'CMS Dashboard', icon: LayoutDashboard, desc: 'Overview, analytics & sync' },
        { id: 'admin-cms-pages', label: 'No-Code Pages', icon: Globe, desc: 'Static & landing pages' },
        { id: 'admin-cms-posts', label: 'News & Articles', icon: FileText, desc: 'Blog posts & exam updates' },
        { id: 'admin-cms-series', label: 'Series Bundles', icon: Crown, desc: 'Test series package studio' },
        { id: 'admin-cms-customizer', label: 'Site Customizer', icon: Palette, desc: 'Colors, branding & typography' },
      ],
    },
    {
      groupId: 'system',
      groupName: 'System & APIs',
      icon: Database,
      items: [
        { id: 'admin-database', label: 'Database & Schema', icon: Database, badge: 'Firestore', desc: 'Firestore collections & backups' },
        { id: 'admin-android-api', label: 'Android API', icon: Smartphone, highlight: true, desc: 'Mobile app sync & endpoints' },
      ],
    },
  ];

  // Close dropdown on outside click
  React.useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // All flat items for search & breadcrumb lookup
  const allNavItems = navGroups.flatMap(g => g.items);
  const activeItem = allNavItems.find(i => i.id === activeTab) || allNavItems[0];
  const activeGroup = navGroups.find(g => g.items.some(i => i.id === activeTab)) || navGroups[0];

  const filteredSearchItems = allNavItems.filter(i =>
    i.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-slate-900/95 border-b border-indigo-950/60 sticky top-16 z-40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          
          {/* Left: Dynamic Breadcrumbs */}
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 overflow-x-auto py-0.5 shrink-0">
            <button
              onClick={() => setActiveTab('admin-overview')}
              className="hover:text-indigo-400 flex items-center space-x-1 transition cursor-pointer shrink-0"
              title="Return to CMS Dashboard"
            >
              <Home className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-slate-300 font-bold">Admin</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <span className="text-slate-400 shrink-0">{activeGroup.groupName}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <span className="text-indigo-300 font-bold bg-indigo-500/10 px-2.5 py-0.5 rounded-lg border border-indigo-500/20 shrink-0">
              {activeItem.label}
            </span>
          </div>

          {/* Right: 3 Category Dropdowns + Quick Search */}
          <div className="flex items-center space-x-2 shrink-0" ref={menuContainerRef}>
            {navGroups.map(group => {
              const Icon = group.icon;
              const isGroupActive = group.items.some(i => i.id === activeTab);
              const isOpen = activeMenu === group.groupId;

              return (
                <div key={group.groupId} className="relative">
                  <button
                    onClick={() => setActiveMenu(isOpen ? null : group.groupId)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                      isGroupActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                        : 'bg-slate-950/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{group.groupName}</span>
                    <span className="px-1 py-0.2 rounded text-[9px] bg-indigo-950/80 border border-indigo-700/40 text-indigo-300">
                      {group.items.length}
                    </span>
                    <ChevronRight className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {isOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-800/80 mb-1">
                        {group.groupName} Modules
                      </div>
                      {group.items.map(item => {
                        const ItemIcon = item.icon;
                        const isCurrent = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setActiveTab(item.id);
                              setActiveMenu(null);
                            }}
                            className={`w-full px-3 py-2 rounded-xl text-left transition flex items-start space-x-2.5 cursor-pointer ${
                              isCurrent
                                ? 'bg-indigo-600 text-white font-bold'
                                : 'text-slate-200 hover:bg-slate-800'
                            }`}
                          >
                            <ItemIcon className={`w-4 h-4 mt-0.5 shrink-0 ${isCurrent ? 'text-white' : 'text-indigo-400'}`} />
                            <div className="flex flex-col min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold">{item.label}</span>
                                {'badge' in item && item.badge && (
                                  <span className="text-[9px] font-mono px-1 rounded bg-indigo-500/20 text-indigo-300">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <span className={`text-[11px] leading-tight mt-0.5 ${isCurrent ? 'text-indigo-100' : 'text-slate-400'}`}>
                                {item.desc}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Admin Quick Search Command Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition cursor-pointer shrink-0"
              title="Quick Search Modules (Ctrl/Cmd+K)"
            >
              <Search className="w-4 h-4 text-indigo-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Admin Quick Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-start justify-center pt-20 px-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-4 space-y-3 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search admin module, pages, questions, database..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-11 pr-4 py-2.5 text-sm text-white font-medium focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1 max-h-60 overflow-y-auto">
              {filteredSearchItems.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-950/50 hover:bg-indigo-600/20 hover:border-indigo-500/50 border border-slate-800 text-xs font-bold text-slate-200 flex items-center justify-between transition cursor-pointer"
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon className="w-4 h-4 text-indigo-400" />
                      <span>{item.label}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">{item.id}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setIsSearchOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition cursor-pointer"
              >
                Close (Esc)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
