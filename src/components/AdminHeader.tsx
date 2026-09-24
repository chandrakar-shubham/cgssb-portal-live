import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  LayoutDashboard,
  FolderTree,
  FileText,
  Sparkles,
  Layers,
  Smartphone,
  ExternalLink,
  LogOut,
  Menu,
  X,
  Server,
  Database
} from 'lucide-react';

interface AdminHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onNavigateToStudent: () => void;
  onOpenToolsModal?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  activeTab,
  setActiveTab,
  onNavigateToStudent,
  onOpenToolsModal,
}) => {
  const { adminUser, adminLogout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'admin-overview', label: 'CMS Dashboard', icon: LayoutDashboard },
    { id: 'admin-tests', label: 'Live Test Catalog', icon: Layers },
    { id: 'admin-questions', label: 'Question Bank', icon: FolderTree },
    { id: 'admin-pyp', label: 'PYP Manager', icon: FileText },
    { id: 'admin-ai', label: 'AI Mock Creator', icon: Sparkles },
    { id: 'admin-android-api', label: 'Android REST API', icon: Smartphone, highlight: true },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-slate-950/95 backdrop-blur-md border-b border-indigo-900/40 shadow-xl shadow-black/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Admin Identity Brand */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-black text-lg">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className="font-black text-lg tracking-tight text-white">
                  CGSSB <span className="text-indigo-400">Admin</span>
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Controller Portal
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono hidden sm:block leading-none mt-0.5">
                https://darkorange-chimpanzee-661223.hostingersite.com/admin
              </span>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden xl:flex items-center space-x-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : item.highlight
                      ? 'text-emerald-400 hover:text-emerald-300 hover:bg-slate-800/80'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : item.highlight ? 'text-emerald-400' : 'text-indigo-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* DB Backup & Tools Button */}
            {onOpenToolsModal && (
              <button
                onClick={onOpenToolsModal}
                title="Database Snapshots, Quality Scanner & PDF Generator"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 hover:border-indigo-500 transition shadow-sm cursor-pointer"
              >
                <Database className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">DB Tools & PDF</span>
              </button>
            )}

            {/* View Student Portal Button */}
            <button
              onClick={onNavigateToStudent}
              title="Switch to Student Candidate View"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 hover:border-slate-500 transition shadow-sm cursor-pointer"
            >
              <span>Student Portal</span>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
            </button>

            {/* Admin User Chip */}
            <div className="hidden md:flex items-center space-x-2 px-3 py-1 rounded-lg bg-indigo-950/40 border border-indigo-800/40 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-semibold text-indigo-200">{adminUser?.name || 'Admin'}</span>
            </div>

            {/* Admin Logout */}
            <button
              onClick={adminLogout}
              title="Logout from Admin Portal"
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-500/40 transition flex items-center space-x-1 cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span className="hidden sm:inline text-xs font-semibold">Exit</span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="xl:hidden p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Medium Screens (lg) Sub-Navbar */}
        <div className="hidden lg:flex xl:hidden pb-3 pt-1 border-t border-slate-900 gap-1 overflow-x-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5 text-indigo-400" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="xl:hidden bg-slate-950 border-b border-indigo-900/50 px-4 pt-3 pb-4 space-y-1.5">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-indigo-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
