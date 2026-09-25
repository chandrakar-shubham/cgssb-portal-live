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
  Database,
  GitCommit,
  Info,
  Globe,
  Palette,
  Crown
} from 'lucide-react';
import { APP_BUILD_INFO } from '../utils/buildInfo';

// Compile-time Vite globals defined in vite.config.ts
declare const __APP_BUILD_NUMBER__: string | undefined;
declare const __APP_BUILD_TIME__: string | undefined;
declare const __APP_COMMIT_SHA__: string | undefined;

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
  const [showBuildDetails, setShowBuildDetails] = useState(false);

  // Directly access global constants with safe fallbacks
  const currentBuildNumber = typeof __APP_BUILD_NUMBER__ !== 'undefined' ? __APP_BUILD_NUMBER__ : APP_BUILD_INFO.buildNumber;
  const currentBuildTime = typeof __APP_BUILD_TIME__ !== 'undefined' ? __APP_BUILD_TIME__ : APP_BUILD_INFO.buildTime;
  const currentCommitSha = typeof __APP_COMMIT_SHA__ !== 'undefined' ? __APP_COMMIT_SHA__ : APP_BUILD_INFO.commitSha;

  const navItems = [
    { id: 'admin-overview', label: 'CMS Dashboard', icon: LayoutDashboard },
    { id: 'admin-cms-pages', label: 'No-Code Pages', icon: Globe },
    { id: 'admin-cms-posts', label: 'News & Posts', icon: FileText },
    { id: 'admin-cms-series', label: 'Series Bundles', icon: Crown },
    { id: 'admin-cms-customizer', label: 'Site Customizer', icon: Palette },
    { id: 'admin-tests', label: 'Live Test Catalog', icon: Layers },
    { id: 'admin-questions', label: 'Question Bank', icon: FolderTree },
    { id: 'admin-pyp', label: 'PYP Manager', icon: FileText },
    { id: 'admin-ai', label: 'AI Test Creator', icon: Sparkles },
    { id: 'admin-database', label: 'Database & Schema', icon: Database, badge: 'MySQL' },
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
                {/* Build No. Badge */}
                <button
                  onClick={() => setShowBuildDetails(!showBuildDetails)}
                  title={`Click to view build details\nBuild: ${currentBuildNumber}\nSHA: ${currentCommitSha}\nCompiled: ${currentBuildTime}`}
                  className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition cursor-pointer"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>{currentBuildNumber}</span>
                </button>
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
                  {item.badge && (
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${isActive ? 'bg-indigo-700/80 text-white' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'}`}>
                      {item.badge}
                    </span>
                  )}
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

      {/* Build Details Modal */}
      {showBuildDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-indigo-800/80 rounded-2xl p-6 max-w-md w-full shadow-2xl shadow-indigo-950/50 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Production Build Metadata</h3>
              </div>
              <button
                onClick={() => setShowBuildDetails(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-400">Build Number</span>
                <span className="font-mono font-bold text-emerald-400">{currentBuildNumber}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-400">App Version</span>
                <span className="font-mono font-bold text-indigo-300">v{APP_BUILD_INFO.version}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-400">Git Commit SHA</span>
                <span className="font-mono font-bold text-slate-300">{currentCommitSha}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-400">Compiled Time</span>
                <span className="font-mono text-slate-300">{currentBuildTime}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-400">Target Host</span>
                <span className="font-bold text-blue-400">{APP_BUILD_INFO.targetPlatform}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowBuildDetails(false)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
