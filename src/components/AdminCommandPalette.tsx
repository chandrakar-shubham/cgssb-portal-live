import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Command,
  Plus,
  Layers,
  FileText,
  FolderTree,
  Sparkles,
  Globe,
  Palette,
  Crown,
  Database,
  Smartphone,
  Sliders,
  X,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  category: string;
  icon: React.ElementType;
  shortcut?: string;
  action: () => void;
}

interface AdminCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tabId: string) => void;
  onQuickCreate: (type: 'test' | 'question' | 'page' | 'post' | 'alert') => void;
  onNavigateToStudent: () => void;
}

export const AdminCommandPalette: React.FC<AdminCommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onQuickCreate,
  onNavigateToStudent,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const allCommands: CommandItem[] = [
    // Quick Actions
    {
      id: 'create-question',
      title: 'Quick Create: New Question (MCQ / Statement)',
      category: '⚡ Quick Actions',
      icon: Plus,
      shortcut: 'N Q',
      action: () => {
        onQuickCreate('question');
        onClose();
      },
    },
    {
      id: 'create-test',
      title: 'Quick Create: New CBT Mock Test',
      category: '⚡ Quick Actions',
      icon: Layers,
      shortcut: 'N T',
      action: () => {
        onQuickCreate('test');
        onClose();
      },
    },
    {
      id: 'create-page',
      title: 'Quick Create: New Dynamic Page (Elementor Block)',
      category: '⚡ Quick Actions',
      icon: Globe,
      shortcut: 'N P',
      action: () => {
        onQuickCreate('page');
        onClose();
      },
    },
    {
      id: 'create-post',
      title: 'Quick Create: New Exam Notification Article',
      category: '⚡ Quick Actions',
      icon: FileText,
      shortcut: 'N A',
      action: () => {
        onQuickCreate('post');
        onClose();
      },
    },
    // Navigation: Examination Studio
    {
      id: 'nav-tests',
      title: 'Open Mock Test Catalog (Live Timed Exams)',
      category: '🎓 Examination Studio',
      icon: Layers,
      action: () => {
        onNavigateTab('admin-tests');
        onClose();
      },
    },
    {
      id: 'nav-questions',
      title: 'Open Question Bank (1,200+ Filterable MCQs)',
      category: '🎓 Examination Studio',
      icon: FolderTree,
      action: () => {
        onNavigateTab('admin-questions');
        onClose();
      },
    },
    {
      id: 'nav-pyp',
      title: 'Open PYP Archives (Previous Year Solved Papers)',
      category: '🎓 Examination Studio',
      icon: FileText,
      action: () => {
        onNavigateTab('admin-pyp');
        onClose();
      },
    },
    {
      id: 'nav-chapters',
      title: 'Open Chapter & Topic Quizzes',
      category: '🎓 Examination Studio',
      icon: FolderTree,
      action: () => {
        onNavigateTab('admin-chapters');
        onClose();
      },
    },
    {
      id: 'nav-practice',
      title: 'Open Practice Drills & Solved Bank',
      category: '🎓 Examination Studio',
      icon: Sparkles,
      action: () => {
        onNavigateTab('admin-practice');
        onClose();
      },
    },
    {
      id: 'nav-ca',
      title: 'Open Current Affairs Studio (Daily News MCQs)',
      category: '🎓 Examination Studio',
      icon: Sparkles,
      action: () => {
        onNavigateTab('admin-ca-studio');
        onClose();
      },
    },
    {
      id: 'nav-ai',
      title: 'Open AI Test Creator (Gemini Intelligence)',
      category: '🎓 Examination Studio',
      icon: Sparkles,
      action: () => {
        onNavigateTab('admin-ai');
        onClose();
      },
    },
    // Navigation: CMS & Theming
    {
      id: 'nav-slider',
      title: 'Open Hero Slider & Promo Banners Studio (Edit, Publish & Reorder)',
      category: '📰 Content & CMS',
      icon: Sliders,
      action: () => {
        onNavigateTab('admin-slider');
        onClose();
      },
    },
    {
      id: 'nav-cms-pages',
      title: 'Open Page Builder (Block-Based Landing Pages)',
      category: '📰 Content & CMS',
      icon: Globe,
      action: () => {
        onNavigateTab('admin-cms-pages');
        onClose();
      },
    },
    {
      id: 'nav-cms-posts',
      title: 'Open News, Articles & Exam Alerts',
      category: '📰 Content & CMS',
      icon: FileText,
      action: () => {
        onNavigateTab('admin-cms-posts');
        onClose();
      },
    },
    {
      id: 'nav-cms-series',
      title: 'Open Test Series Packages & Bundles',
      category: '📰 Content & CMS',
      icon: Crown,
      action: () => {
        onNavigateTab('admin-cms-series');
        onClose();
      },
    },
    {
      id: 'nav-theme-customizer',
      title: 'Open Design Tokens & Google AdSense Studio',
      category: '🎨 Brand & Monetization',
      icon: Palette,
      action: () => {
        onNavigateTab('admin-cms-customizer');
        onClose();
      },
    },
    // Navigation: System & Cloud
    {
      id: 'nav-remote-config',
      title: 'Open Remote Config & Feature Flags (SDUI)',
      category: '🛠️ System & Cloud',
      icon: Sliders,
      action: () => {
        onNavigateTab('admin-remote-config');
        onClose();
      },
    },
    {
      id: 'nav-database',
      title: 'Open Cloud Firestore Database Collections',
      category: '🛠️ System & Cloud',
      icon: Database,
      action: () => {
        onNavigateTab('admin-database');
        onClose();
      },
    },
    {
      id: 'nav-android',
      title: 'Open Android REST API & Mobile Sync',
      category: '🛠️ System & Cloud',
      icon: Smartphone,
      action: () => {
        onNavigateTab('admin-android-api');
        onClose();
      },
    },
    {
      id: 'view-student',
      title: 'Switch to Live Student / Candidate View',
      category: '🌐 Portal',
      icon: ExternalLink,
      action: () => {
        onNavigateToStudent();
        onClose();
      },
    },
  ];

  const filteredCommands = allCommands.filter(
    cmd =>
      cmd.title.toLowerCase().includes(query.toLowerCase()) ||
      cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle keyboard navigation inside command palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (filteredCommands.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 gap-3 bg-slate-950/70">
          <Command className="w-5 h-5 text-indigo-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, tool or search anything... (e.g. 'question', 'theme', 'create')"
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none font-medium"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Command Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1 divide-y divide-slate-800/40">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No matching commands or actions found for "{query}".
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = selectedIndex === idx;
              const Icon = cmd.icon;
              return (
                <div
                  key={cmd.id}
                  onClick={() => cmd.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full px-3.5 py-2.5 rounded-xl flex items-center justify-between transition cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30'
                      : 'text-slate-300 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center space-x-3 truncate">
                    <div
                      className={`p-1.5 rounded-lg ${
                        isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-indigo-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate text-left">
                      <span className="text-xs block truncate">{cmd.title}</span>
                      <span className="text-[10px] text-slate-400 opacity-80 block">{cmd.category}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {cmd.shortcut && (
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          isSelected
                            ? 'bg-indigo-700 border-indigo-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        {cmd.shortcut}
                      </span>
                    )}
                    <ArrowRight className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-600'}`} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Legend */}
        <div className="px-4 py-2 bg-slate-950/90 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <div className="flex items-center space-x-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span>CGSSB Admin OS v2.6</span>
        </div>
      </div>
    </div>
  );
};
