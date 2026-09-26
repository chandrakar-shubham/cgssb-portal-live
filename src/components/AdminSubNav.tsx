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

  // Grouped Navigation Structure
  const navGroups = [
    {
      groupName: 'CMS & Customization',
      items: [
        { id: 'admin-overview', label: 'CMS Dashboard', icon: LayoutDashboard },
        { id: 'admin-cms-pages', label: 'No-Code Pages', icon: Globe },
        { id: 'admin-cms-posts', label: 'News & Articles', icon: FileText },
        { id: 'admin-cms-series', label: 'Series Bundles', icon: Crown },
        { id: 'admin-cms-customizer', label: 'Site Customizer', icon: Palette },
      ],
    },
    {
      groupName: 'Exams & Catalog',
      items: [
        { id: 'admin-tests', label: 'Test Catalog', icon: Layers },
        { id: 'admin-questions', label: 'Question Bank', icon: FolderTree },
        { id: 'admin-pyp', label: 'PYP Manager', icon: FileText },
        { id: 'admin-ai', label: 'AI Test Creator', icon: Sparkles },
      ],
    },
    {
      groupName: 'System & Database',
      items: [
        { id: 'admin-database', label: 'Database & Schema', icon: Database, badge: 'Firestore' },
        { id: 'admin-android-api', label: 'Android API', icon: Smartphone, highlight: true },
      ],
    },
  ];

  // All flat items for search & breadcrumb lookup
  const allNavItems = navGroups.flatMap(g => g.items);
  const activeItem = allNavItems.find(i => i.id === activeTab) || allNavItems[0];
  const activeGroup = navGroups.find(g => g.items.some(i => i.id === activeTab)) || navGroups[0];

  const filteredSearchItems = allNavItems.filter(i =>
    i.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-slate-900/90 border-b border-indigo-950/60 sticky top-16 z-40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Left: Dynamic Breadcrumbs */}
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 overflow-x-auto py-1 shrink-0">
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

          {/* Right: Categorized Navigation Quick Switcher Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar touch-scroll py-1 max-w-full">
            {navGroups.map(group => (
              <div key={group.groupName} className="flex items-center space-x-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80 shrink-0">
                {group.items.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-indigo-400'}`} />
                      <span>{item.label}</span>
                      {'badge' in item && item.badge && (
                        <span className="text-[9px] font-mono px-1 rounded bg-indigo-500/20 text-indigo-300">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}

            {/* Admin Quick Search Command Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition cursor-pointer shrink-0"
              title="Search Admin Modules (Ctrl/Cmd+K)"
            >
              <Search className="w-4 h-4 text-indigo-400" />
            </button>

            {/* DB Tools & PDF */}
            {onOpenToolsModal && (
              <button
                onClick={onOpenToolsModal}
                className="hidden xl:inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-bold rounded-xl bg-slate-950/80 hover:bg-indigo-950 text-indigo-300 border border-slate-800 hover:border-indigo-700/60 transition cursor-pointer shrink-0"
                title="Database Tools, Snapshots & PDF Generator"
              >
                <Database className="w-3.5 h-3.5 text-indigo-400" />
                <span>DB Tools</span>
              </button>
            )}

            {/* Student Portal Switcher */}
            <button
              onClick={onNavigateToStudent}
              className="hidden lg:inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-bold rounded-xl bg-slate-950/80 hover:bg-emerald-950/60 text-emerald-400 hover:text-emerald-300 border border-slate-800 hover:border-emerald-700/60 transition cursor-pointer shrink-0"
              title="Switch to Student Candidate View"
            >
              <span>Student View</span>
              <ExternalLink className="w-3.5 h-3.5" />
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
